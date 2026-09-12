// QA round 3 (US-16/US-17/T61) — independent data-integrity checks over the
// real (not synthetic/mocked) LANDMARKS dataset that shipped in this round.
// This does NOT re-run the Overpass extraction script; it validates the
// output data file the way a consumer (the app) actually reads it, plus the
// backward-compatibility guarantee US-17 AC5 promises for the 8 pilot
// provinces from T35.
import { LANDMARKS, getLandmarksForProvince } from '../../data/thailand-landmarks';
import { PROVINCES } from '../../data/thailand-provinces';

const PILOT_PROVINCE_IDS = [
  'bangkok-metropolis',
  'chiang-mai',
  'chiang-rai',
  'phra-nakhon-si-ayutthaya',
  'sukhothai',
  'chon-buri',
  'krabi',
  'phuket',
];

describe('thailand-landmarks.ts data integrity after T60/T61 Overpass merge (US-16/US-17)', () => {
  it('has no duplicate landmark ids anywhere in the dataset, across provinces', () => {
    const ids = LANDMARKS.map((l) => l.id);
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const id of ids) {
      if (seen.has(id)) duplicates.push(id);
      seen.add(id);
    }
    expect(duplicates).toEqual([]);
    expect(seen.size).toBe(LANDMARKS.length);
  });

  it('every landmark.provinceId refers to a real province id in thailand-provinces.ts (no orphaned/mistyped references)', () => {
    const validProvinceIds = new Set(PROVINCES.map((p) => p.id));
    const orphans = LANDMARKS.filter((l) => !validProvinceIds.has(l.provinceId));
    expect(orphans).toEqual([]);
  });

  it('every landmark that has a lat also has a lng, and both are finite numbers (US-16 AC3: never a partial/NaN coordinate)', () => {
    const offenders = LANDMARKS.filter((l) => {
      const hasLat = l.lat !== undefined;
      const hasLng = l.lng !== undefined;
      if (hasLat !== hasLng) return true; // one present without the other
      if (hasLat && (!Number.isFinite(l.lat as number) || !Number.isFinite(l.lng as number))) return true;
      return false;
    });
    expect(offenders).toEqual([]);
  });

  it('every landmark has a non-empty id, provinceId and nameTh (schema still intact per US-16 AC4)', () => {
    const malformed = LANDMARKS.filter(
      (l) => !l.id?.trim() || !l.provinceId?.trim() || !l.nameTh?.trim()
    );
    expect(malformed).toEqual([]);
  });

  it('exactly 45 of the 76 provinces have landmark data after T61 (8 pilot + 37 from the real Overpass run)', () => {
    const provinceIdsWithData = new Set(LANDMARKS.map((l) => l.provinceId));
    expect(provinceIdsWithData.size).toBe(45);
  });

  it('the remaining provinces (76 - 45 = 31) have zero landmarks and are NOT errors — they must fall through to the US-8 empty state', () => {
    const provinceIdsWithData = new Set(LANDMARKS.map((l) => l.provinceId));
    const withoutData = PROVINCES.filter((p) => !provinceIdsWithData.has(p.id));
    expect(withoutData.length).toBe(31);
    // Calling the same lookup function ProvinceDetailScreen/AddEntryScreen use
    // for one of them must return [] cleanly, not throw/undefined.
    const sample = withoutData[0];
    expect(getLandmarksForProvince(sample.id)).toEqual([]);
  });

  it('no province ever has more than 5 landmarks (US-16 AC2 cap)', () => {
    const counts = new Map<string, number>();
    for (const l of LANDMARKS) counts.set(l.provinceId, (counts.get(l.provinceId) ?? 0) + 1);
    for (const [provinceId, count] of counts) {
      expect(count).toBeLessThanOrEqual(5);
    }
  });

  describe('backward compatibility: the 8 original (T35) pilot provinces still resolve normally after the T61 merge', () => {
    it.each(PILOT_PROVINCE_IDS)('%s has at least one landmark and every one of them now has numeric lat/lng', (provinceId) => {
      const landmarks = getLandmarksForProvince(provinceId);
      expect(landmarks.length).toBeGreaterThan(0);
      for (const l of landmarks) {
        expect(typeof l.lat).toBe('number');
        expect(typeof l.lng).toBe('number');
        expect(Number.isFinite(l.lat)).toBe(true);
        expect(Number.isFinite(l.lng)).toBe(true);
      }
    });
  });

  // Independently re-derived (not copy-pasted from dev-notes.md/qa-result.md):
  // extracted straight from the pre-OSM-round baseline commit (3a5d8f7) via
  // `git show 3a5d8f7:src/data/thailand-landmarks.ts` and diffed programmatically
  // against the current file. All 29 original ids/provinceId/nameTh triples are
  // byte-identical (only lat/lng were added) — see docs/test-report.md round 3
  // for the verification method. Spot-checking a representative subset here so
  // a future regression (e.g. an accidental id regeneration during a future
  // merge script run) fails a real test, not just a one-off manual check.
  it('spot-checks that specific pre-existing (T35) landmark ids/provinceId/nameTh are byte-identical to the pre-OSM baseline', () => {
    const expected: Array<{ id: string; provinceId: string; nameTh: string }> = [
      { id: 'bkk-grand-palace', provinceId: 'bangkok-metropolis', nameTh: 'พระบรมมหาราชวัง' },
      { id: 'cnx-doi-suthep', provinceId: 'chiang-mai', nameTh: 'วัดพระธาตุดอยสุเทพ' },
      { id: 'cri-white-temple', provinceId: 'chiang-rai', nameTh: 'วัดร่องขุ่น' },
      { id: 'ayu-wat-mahathat', provinceId: 'phra-nakhon-si-ayutthaya', nameTh: 'วัดมหาธาตุ (อยุธยา)' },
      { id: 'skt-historical-park', provinceId: 'sukhothai', nameTh: 'อุทยานประวัติศาสตร์สุโขทัย' },
      { id: 'cbi-pattaya-beach', provinceId: 'chon-buri', nameTh: 'หาดพัทยา' },
      { id: 'kbi-railay-beach', provinceId: 'krabi', nameTh: 'หาดไร่เลย์' },
      { id: 'hkt-patong-beach', provinceId: 'phuket', nameTh: 'หาดป่าตอง' },
    ];
    for (const exp of expected) {
      const actual = LANDMARKS.find((l) => l.id === exp.id);
      expect(actual).toBeDefined();
      expect(actual?.provinceId).toBe(exp.provinceId);
      expect(actual?.nameTh).toBe(exp.nameTh);
    }
  });
});
