// US-27: unit tests for the pure TAT extraction/selection logic. No network
// access — records are plain objects shaped like the real attraction.json
// (verified by hand against a real download during this round, see
// docs/dev-notes.md).
import {
  buildSearchIndexEntries,
  MAX_LANDMARKS_PER_PROVINCE,
  parseTatLocation,
  selectTopTatLandmarks,
  stripHtml,
  type TatRawRecord,
} from './tat-extract-core.ts';

function record(overrides: Partial<TatRawRecord>): TatRawRecord {
  return {
    ATT_ID: '1',
    ATT_NAME_TH: 'สถานที่ตัวอย่าง',
    ATT_LOCATION: '13.75, 100.49',
    PROVINCE_NAME_TH: 'กรุงเทพมหานคร',
    ...overrides,
  };
}

describe('stripHtml (US-27)', () => {
  it('removes tags and decodes the handful of entities seen in the real dataset', () => {
    expect(stripHtml('<p>สวัสดี <strong>ครับ</strong></p>')).toBe('สวัสดี ครับ');
    expect(stripHtml('Visitors&rsquo; favorite &amp; best')).toBe('Visitors’ favorite & best');
    expect(stripHtml('a &nbsp;  b')).not.toContain('&nbsp;');
  });

  it('collapses repeated whitespace left over after stripping tags', () => {
    expect(stripHtml('<span>a</span>\n\n<span>b</span>')).toBe('a b');
  });
});

describe('parseTatLocation (US-27)', () => {
  it('parses a valid "lat, lng" string inside Thailand', () => {
    expect(parseTatLocation('13.7563, 100.5018')).toEqual({ lat: 13.7563, lng: 100.5018 });
  });

  it('returns null for missing/malformed/non-numeric input', () => {
    expect(parseTatLocation(null)).toBeNull();
    expect(parseTatLocation(undefined)).toBeNull();
    expect(parseTatLocation('')).toBeNull();
    expect(parseTatLocation('not-a-coordinate')).toBeNull();
    expect(parseTatLocation('13.75')).toBeNull();
  });

  it('returns null (never a garbage coordinate) when the value is outside Thailand\'s real bounding box', () => {
    expect(parseTatLocation('51.5074, -0.1278')).toBeNull(); // London
    expect(parseTatLocation('0, 0')).toBeNull();
  });
});

describe('selectTopTatLandmarks (US-27)', () => {
  it('drops a record with no usable coordinate instead of saving a placeholder', () => {
    const records = [
      record({ ATT_ID: '1', ATT_NAME_TH: 'ไม่มีพิกัด', ATT_LOCATION: null }),
      record({ ATT_ID: '2', ATT_NAME_TH: 'มีพิกัด', ATT_LOCATION: '13.75, 100.49' }),
    ];
    const result = selectTopTatLandmarks('bangkok-metropolis', records);
    expect(result).toHaveLength(1);
    expect(result[0].nameTh).toBe('มีพิกัด');
  });

  it('drops a record with no name', () => {
    const records = [record({ ATT_ID: '1', ATT_NAME_TH: '' })];
    expect(selectTopTatLandmarks('p', records)).toEqual([]);
  });

  it('builds a stable, prefixed id from the source ATT_ID (never regenerated from the name)', () => {
    const records = [record({ ATT_ID: '20250620154151001' })];
    const result = selectTopTatLandmarks('p', records);
    expect(result[0].id).toBe('tat-20250620154151001');
  });

  it('prefers ATT_HILIGHT for the description, stripped and truncated', () => {
    const records = [
      record({
        ATT_ID: '1',
        ATT_HILIGHT: 'จุดเด่น'.repeat(60),
        ATT_DETAIL_TH: '<p>รายละเอียดยาว</p>',
      }),
    ];
    const result = selectTopTatLandmarks('p', records);
    expect(result[0].description!.length).toBeLessThanOrEqual(161); // 160 + ellipsis
    expect(result[0].description!.startsWith('จุดเด่น')).toBe(true);
  });

  it('falls back to stripped ATT_DETAIL_TH when ATT_HILIGHT is absent', () => {
    const records = [record({ ATT_ID: '1', ATT_HILIGHT: null, ATT_DETAIL_TH: '<p>รายละเอียด</p>' })];
    const result = selectTopTatLandmarks('p', records);
    expect(result[0].description).toBe('รายละเอียด');
  });

  it('leaves description undefined when neither field has content, and still assigns a category via detectCategory', () => {
    const records = [record({ ATT_ID: '1', ATT_NAME_TH: 'วัดใหญ่', ATT_HILIGHT: null, ATT_DETAIL_TH: null })];
    const result = selectTopTatLandmarks('p', records);
    expect(result[0].description).toBeUndefined();
    expect(result[0].category).toBe('วัดและศาสนสถาน');
  });

  it('de-duplicates by ATT_ID', () => {
    const records = [record({ ATT_ID: '1' }), record({ ATT_ID: '1' })];
    expect(selectTopTatLandmarks('p', records)).toHaveLength(1);
  });

  it('prioritizes records that have a usable description over ones that do not, preserving source order otherwise', () => {
    const records = [
      record({ ATT_ID: '1', ATT_NAME_TH: 'ไม่มีคำอธิบาย', ATT_HILIGHT: null, ATT_DETAIL_TH: null }),
      record({ ATT_ID: '2', ATT_NAME_TH: 'มีคำอธิบาย', ATT_HILIGHT: 'จุดเด่น' }),
    ];
    const result = selectTopTatLandmarks('p', records);
    expect(result[0].nameTh).toBe('มีคำอธิบาย');
    expect(result[1].nameTh).toBe('ไม่มีคำอธิบาย');
  });

  it('never excludes a record purely because it lacks a description — that is what buildSearchIndexEntries is for', () => {
    const records = Array.from({ length: MAX_LANDMARKS_PER_PROVINCE + 1 }, (_, i) =>
      record({ ATT_ID: String(i), ATT_NAME_TH: `มีคำอธิบาย ${i}`, ATT_HILIGHT: 'จุดเด่น' })
    );
    // The one famous-but-undocumented record would be dropped by the display
    // cap even though it's perfectly valid — exactly the real-world failure
    // this module's docstring describes (หาดชะอำ).
    records.push(record({ ATT_ID: 'famous', ATT_NAME_TH: 'หาดชะอำ', ATT_HILIGHT: null, ATT_DETAIL_TH: null }));
    const result = selectTopTatLandmarks('p', records);
    expect(result.find((r) => r.nameTh === 'หาดชะอำ')).toBeUndefined();
  });

  it('caps at MAX_LANDMARKS_PER_PROVINCE by default', () => {
    const records = Array.from({ length: MAX_LANDMARKS_PER_PROVINCE + 10 }, (_, i) =>
      record({ ATT_ID: String(i), ATT_NAME_TH: `สถานที่ ${i}` })
    );
    expect(selectTopTatLandmarks('p', records)).toHaveLength(MAX_LANDMARKS_PER_PROVINCE);
  });

  describe('buildSearchIndexEntries (search must cover the FULL set, not the capped display list)', () => {
    it('includes every valid record with no cap at all, unlike selectTopTatLandmarks', () => {
      const records = Array.from({ length: MAX_LANDMARKS_PER_PROVINCE + 20 }, (_, i) =>
        record({ ATT_ID: String(i), ATT_NAME_TH: `สถานที่ ${i}` })
      );
      expect(buildSearchIndexEntries('p', records)).toHaveLength(MAX_LANDMARKS_PER_PROVINCE + 20);
    });

    it('finds the exact real-world case selectTopTatLandmarks would drop (a famous place with no description)', () => {
      const records = [record({ ATT_ID: 'famous', ATT_NAME_TH: 'หาดชะอำ', ATT_HILIGHT: null, ATT_DETAIL_TH: null })];
      const result = buildSearchIndexEntries('phetchaburi', records);
      expect(result).toEqual([{ id: 'tat-famous', provinceId: 'phetchaburi', nameTh: 'หาดชะอำ', lat: 13.75, lng: 100.49 }]);
    });

    it('still drops records with no name or no valid coordinate, and de-duplicates by ATT_ID', () => {
      const records = [
        record({ ATT_ID: '1', ATT_NAME_TH: '' }),
        record({ ATT_ID: '2', ATT_LOCATION: null }),
        record({ ATT_ID: '3' }),
        record({ ATT_ID: '3' }),
      ];
      expect(buildSearchIndexEntries('p', records)).toHaveLength(1);
    });

    it('never includes description/category fields (lean, search-only shape)', () => {
      const records = [record({ ATT_ID: '1', ATT_HILIGHT: 'จุดเด่น', ATT_DETAIL_TH: '<p>รายละเอียด</p>' })];
      const result = buildSearchIndexEntries('p', records);
      expect(result[0]).not.toHaveProperty('description');
      expect(result[0]).not.toHaveProperty('category');
    });
  });

  it('honors a custom (lower) limit, for topping up a province that already has some landmarks from another source', () => {
    const records = Array.from({ length: 10 }, (_, i) => record({ ATT_ID: String(i), ATT_NAME_TH: `สถานที่ ${i}` }));
    expect(selectTopTatLandmarks('p', records, 3)).toHaveLength(3);
  });

  it('returns an empty array (never negative-length or throwing) when limit is 0 or negative', () => {
    const records = [record({ ATT_ID: '1' })];
    expect(selectTopTatLandmarks('p', records, 0)).toEqual([]);
    expect(selectTopTatLandmarks('p', records, -5)).toEqual([]);
  });
});
