// T60 / US-16: unit tests for the pure extraction/matching logic. No network
// access — Overpass responses are mocked plain objects shaped like the real
// API (verified by hand against overpass-api.de during T61, see
// docs/dev-notes.md). This is what "ทดสอบ/รีวิวได้ด้วย unit test/mock response"
// (PM decision ประเด็น 13) refers to for T60 specifically.
import {
  buildLandmarkQuery,
  buildProvinceAreaMap,
  normalizeProvinceNameEn,
  reportStatus,
  selectTopLandmarks,
  MAX_LANDMARKS_PER_PROVINCE,
  MIN_LANDMARKS_TARGET,
  type OverpassAdminArea,
  type OverpassRawElement,
} from './lib/overpass-extract-core.ts';

describe('normalizeProvinceNameEn (T60)', () => {
  it('lowercases and strips spaces/hyphens', () => {
    expect(normalizeProvinceNameEn('Chiang Mai')).toBe('chiangmai');
    expect(normalizeProvinceNameEn('Phang-nga')).toBe('phangnga');
    expect(normalizeProvinceNameEn('Nong Bua Lam Phu')).toBe('nongbualamphu');
  });

  it('drops a trailing "Province" suffix so our nameEn matches OSM boundary tags', () => {
    expect(normalizeProvinceNameEn('Chiang Mai Province')).toBe('chiangmai');
    expect(normalizeProvinceNameEn('Phang-nga Province')).toBe('phangnga');
  });

  it('special-cases Bangkok (OSM tags it plain "Bangkok", we store "Bangkok Metropolis")', () => {
    expect(normalizeProvinceNameEn('Bangkok Metropolis')).toBe('bangkok');
    expect(normalizeProvinceNameEn('Bangkok')).toBe('bangkok');
  });
});

describe('buildProvinceAreaMap (T60)', () => {
  const provinces = [
    { id: 'chiang-mai', nameEn: 'Chiang Mai' },
    { id: 'bangkok-metropolis', nameEn: 'Bangkok Metropolis' },
    { id: 'phangnga', nameEn: 'Phangnga' },
    { id: 'nonexistent-province', nameEn: 'Nowhereland' },
  ];
  const adminAreas: OverpassAdminArea[] = [
    { relationId: 1908771, nameEn: 'Chiang Mai Province' },
    { relationId: 92277, nameEn: 'Bangkok' },
    { relationId: 1908799, nameEn: 'Phang-nga Province' },
  ];

  it('maps each resolvable province to its Overpass area id (relationId + 3600000000)', () => {
    const map = buildProvinceAreaMap(provinces, adminAreas);
    expect(map.get('chiang-mai')).toBe(1908771 + 3600000000);
    expect(map.get('bangkok-metropolis')).toBe(92277 + 3600000000);
    expect(map.get('phangnga')).toBe(1908799 + 3600000000);
  });

  it('leaves unmatched provinces out of the map entirely (US-16 AC5 — no fake area id)', () => {
    const map = buildProvinceAreaMap(provinces, adminAreas);
    expect(map.has('nonexistent-province')).toBe(false);
  });
});

describe('selectTopLandmarks (T60 AC1/AC2)', () => {
  function el(overrides: Partial<OverpassRawElement>): OverpassRawElement {
    return { type: 'node', id: 1, tags: {}, ...overrides };
  }

  it('drops elements with no coordinates instead of saving null/NaN', () => {
    const elements = [
      el({ id: 1, tags: { tourism: 'attraction', 'name:th': 'ไม่มีพิกัด' } }), // no lat/lon at all
      el({ id: 2, lat: 13.75, lon: 100.49, tags: { tourism: 'attraction', 'name:th': 'มีพิกัด' } }),
    ];
    const result = selectTopLandmarks('bangkok-metropolis', elements);
    expect(result).toHaveLength(1);
    expect(result[0].nameTh).toBe('มีพิกัด');
    expect(result.every((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng))).toBe(true);
  });

  it('reads coordinates from `center` for way/relation elements (out center query)', () => {
    const elements = [
      el({ type: 'way', id: 2, center: { lat: 13.75, lon: 100.49 }, tags: { tourism: 'attraction', 'name:th': 'วัง' } }),
    ];
    const result = selectTopLandmarks('bangkok-metropolis', elements);
    expect(result).toEqual([{ id: 'bangkok-metropolis-osm-w2', provinceId: 'bangkok-metropolis', nameTh: 'วัง', lat: 13.75, lng: 100.49 }]);
  });

  it('drops elements with no Thai name (falls back to `name` only if it is itself Thai script)', () => {
    const elements = [
      el({ id: 1, lat: 1, lon: 1, tags: { tourism: 'attraction', name: 'English Only Name' } }),
      el({ id: 2, lat: 2, lon: 2, tags: { tourism: 'attraction', name: 'วัดไทย' } }),
    ];
    const result = selectTopLandmarks('p', elements);
    expect(result).toHaveLength(1);
    expect(result[0].nameTh).toBe('วัดไทย');
  });

  it('de-duplicates the same element id (can appear in more than one unioned tag filter)', () => {
    const elements = [
      el({ id: 5, lat: 1, lon: 1, tags: { tourism: 'attraction', historic: 'temple', 'name:th': 'วัดซ้ำ' } }),
      el({ id: 5, lat: 1, lon: 1, tags: { tourism: 'attraction', historic: 'temple', 'name:th': 'วัดซ้ำ' } }),
    ];
    const result = selectTopLandmarks('p', elements);
    expect(result).toHaveLength(1);
  });

  it('ranks by TAG_PRIORITY and caps at MAX_LANDMARKS_PER_PROVINCE', () => {
    const elements = Array.from({ length: MAX_LANDMARKS_PER_PROVINCE + 3 }, (_, i) =>
      el({ id: i, lat: i, lon: i, tags: { leisure: 'park', 'name:th': `สวน ${i}` } })
    );
    // One single "attraction" mixed in should be sorted to the front despite being last in input.
    elements.push(el({ id: 999, lat: 9, lon: 9, tags: { tourism: 'attraction', 'name:th': 'สถานที่เด่น' } }));

    const result = selectTopLandmarks('p', elements);
    expect(result).toHaveLength(MAX_LANDMARKS_PER_PROVINCE);
    expect(result[0].nameTh).toBe('สถานที่เด่น');
  });
});

describe('reportStatus (T60 step 4 / US-16 AC3)', () => {
  it('flags an unresolved area', () => {
    expect(reportStatus(0, false)).toBe('area-not-found');
  });
  it('flags zero results as empty', () => {
    expect(reportStatus(0, true)).toBe('empty');
  });
  it('flags fewer than MIN_LANDMARKS_TARGET as partial', () => {
    expect(reportStatus(MIN_LANDMARKS_TARGET - 1, true)).toBe('partial');
  });
  it('flags MIN_LANDMARKS_TARGET or more as ok', () => {
    expect(reportStatus(MIN_LANDMARKS_TARGET, true)).toBe('ok');
    expect(reportStatus(MAX_LANDMARKS_PER_PROVINCE, true)).toBe('ok');
  });
});

describe('buildLandmarkQuery (T60 step 2)', () => {
  it('embeds the area id and every TAG_PRIORITY filter in the Overpass QL query', () => {
    const query = buildLandmarkQuery(3601908771, 30);
    expect(query).toContain('area(3601908771)->.a;');
    expect(query).toContain('nwr["tourism"="attraction"](area.a);');
    expect(query).toContain('nwr["historic"="temple"](area.a);');
    expect(query).toContain('nwr["historic"="monument"](area.a);');
    expect(query).toContain('nwr["amenity"="place_of_worship"](area.a);');
    expect(query).toContain('nwr["leisure"="park"](area.a);');
    expect(query).toContain('out center 40;');
    expect(query).toContain('[timeout:30]');
  });
});
