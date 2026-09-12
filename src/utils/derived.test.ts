import {
  isVisited,
  getVisitedProvinceIdSet,
  getUnlockedCount,
  getEntriesForProvince,
  getAllEntriesSorted,
  aggregateByRegion,
  getTopRegion,
  formatThaiDate,
  TOTAL_PROVINCES,
} from './derived';
import type { JournalEntry } from '../types/entry';
import type { Province } from '../data/thailand-provinces';

function makeEntry(overrides: Partial<JournalEntry>): JournalEntry {
  return {
    id: overrides.id ?? Math.random().toString(36),
    provinceId: overrides.provinceId ?? 'bangkok-metropolis',
    date: overrides.date ?? '2026-01-01',
    title: overrides.title ?? 'Test trip',
    notes: overrides.notes ?? '',
    photoUris: overrides.photoUris ?? [],
    tags: overrides.tags ?? [],
  };
}

function makeProvince(id: string, region: Province['region']): Province {
  return {
    id,
    nameEn: id,
    nameTh: id,
    region,
    path: 'M 0,0 Z',
    centroid: [0, 0],
  };
}

describe('derived state utilities (T5)', () => {
  it('TOTAL_PROVINCES is 76 (Bueng Kan excluded per requirements)', () => {
    expect(TOTAL_PROVINCES).toBe(76);
  });

  describe('isVisited', () => {
    it('returns false when no entries exist for a province', () => {
      expect(isVisited('phuket', [])).toBe(false);
    });

    it('returns true once at least one entry exists (entries.length > 0)', () => {
      const entries = [makeEntry({ provinceId: 'phuket' })];
      expect(isVisited('phuket', entries)).toBe(true);
      expect(isVisited('chiang-mai', entries)).toBe(false);
    });
  });

  describe('getUnlockedCount / getVisitedProvinceIdSet', () => {
    it('counts distinct provinces, not total entries', () => {
      const entries = [
        makeEntry({ provinceId: 'phuket' }),
        makeEntry({ provinceId: 'phuket' }),
        makeEntry({ provinceId: 'chiang-mai' }),
      ];
      expect(getUnlockedCount(entries)).toBe(2);
      expect(getVisitedProvinceIdSet(entries).size).toBe(2);
    });

    it('is 0 for an empty entry list', () => {
      expect(getUnlockedCount([])).toBe(0);
    });
  });

  describe('getEntriesForProvince', () => {
    it('filters to only the requested province and sorts reverse-chronological', () => {
      const entries = [
        makeEntry({ id: '1', provinceId: 'phuket', date: '2026-01-01' }),
        makeEntry({ id: '2', provinceId: 'phuket', date: '2026-03-01' }),
        makeEntry({ id: '3', provinceId: 'chiang-mai', date: '2026-05-01' }),
      ];
      const result = getEntriesForProvince('phuket', entries);
      expect(result.map((e) => e.id)).toEqual(['2', '1']);
    });
  });

  describe('getAllEntriesSorted', () => {
    it('sorts entries across all provinces reverse-chronological', () => {
      const entries = [
        makeEntry({ id: 'a', date: '2026-01-01' }),
        makeEntry({ id: 'b', date: '2026-06-01' }),
        makeEntry({ id: 'c', date: '2026-03-01' }),
      ];
      expect(getAllEntriesSorted(entries).map((e) => e.id)).toEqual(['b', 'c', 'a']);
    });

    it('does not mutate the input array', () => {
      const entries = [makeEntry({ id: 'a', date: '2026-01-01' }), makeEntry({ id: 'b', date: '2026-06-01' })];
      const original = [...entries];
      getAllEntriesSorted(entries);
      expect(entries).toEqual(original);
    });
  });

  describe('aggregateByRegion / getTopRegion', () => {
    const provinces: Province[] = [
      makeProvince('p1', 'north'),
      makeProvince('p2', 'north'),
      makeProvince('p3', 'south'),
    ];

    it('returns all 6 regions even with 0 unlocked', () => {
      const result = aggregateByRegion(provinces, []);
      expect(result).toHaveLength(6);
      expect(result.every((r) => r.unlockedCount === 0)).toBe(true);
    });

    it('counts unlocked provinces per region and sorts descending', () => {
      const entries = [makeEntry({ provinceId: 'p1' }), makeEntry({ provinceId: 'p2' }), makeEntry({ provinceId: 'p3' })];
      const result = aggregateByRegion(provinces, entries);
      expect(result[0].region).toBe('north');
      expect(result[0].unlockedCount).toBe(2);
    });

    it('getTopRegion returns null when nothing is unlocked yet (US-6 empty state)', () => {
      expect(getTopRegion(provinces, [])).toBeNull();
    });

    it('getTopRegion returns the region with the most unlocked provinces, translated to Thai', () => {
      const entries = [makeEntry({ provinceId: 'p1' }), makeEntry({ provinceId: 'p2' })];
      const top = getTopRegion(provinces, entries);
      expect(top?.region).toBe('north');
      expect(top?.regionNameTh).toBe('ภาคเหนือ');
    });
  });

  describe('formatThaiDate', () => {
    it('formats an ISO date as Thai day/month-abbr/Buddhist-year', () => {
      expect(formatThaiDate('2026-09-12')).toBe('12 ก.ย. 2569');
    });

    it('returns the raw input if it cannot be parsed as a date', () => {
      expect(formatThaiDate('not-a-date')).toBe('not-a-date');
    });
  });
});
