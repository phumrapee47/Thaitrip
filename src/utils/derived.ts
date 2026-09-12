import type { JournalEntry } from '../types/entry';
import type { Province, Region } from '../data/thailand-provinces';

export const TOTAL_PROVINCES = 76;

export const REGION_NAME_TH: Record<Region, string> = {
  north: 'ภาคเหนือ',
  northeast: 'ภาคอีสาน',
  central: 'ภาคกลาง',
  east: 'ภาคตะวันออก',
  west: 'ภาคตะวันตก',
  south: 'ภาคใต้',
};

/** A province is "visited"/unlocked once it has at least one journal entry. */
export function isVisited(provinceId: string, entries: JournalEntry[]): boolean {
  return entries.some((e) => e.provinceId === provinceId);
}

/** Build a Set of visited province ids for O(1) lookups (used by map tiles). */
export function getVisitedProvinceIdSet(entries: JournalEntry[]): Set<string> {
  return new Set(entries.map((e) => e.provinceId));
}

/** Count of distinct provinces that have >= 1 entry. */
export function getUnlockedCount(entries: JournalEntry[]): number {
  return getVisitedProvinceIdSet(entries).size;
}

/** Entries for one province, sorted reverse-chronological (latest date first). */
export function getEntriesForProvince(provinceId: string, entries: JournalEntry[]): JournalEntry[] {
  return entries
    .filter((e) => e.provinceId === provinceId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** All entries across every province, sorted reverse-chronological. */
export function getAllEntriesSorted(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

export interface RegionAggregation {
  region: Region;
  regionNameTh: string;
  unlockedCount: number;
}

/**
 * Aggregate unlocked province counts per region.
 * Returns all 6 regions (even if 0) sorted descending by unlockedCount.
 */
export function aggregateByRegion(provinces: Province[], entries: JournalEntry[]): RegionAggregation[] {
  const visited = getVisitedProvinceIdSet(entries);
  const counts = new Map<Region, number>();
  for (const region of Object.keys(REGION_NAME_TH) as Region[]) {
    counts.set(region, 0);
  }
  for (const province of provinces) {
    if (visited.has(province.id)) {
      counts.set(province.region, (counts.get(province.region) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([region, unlockedCount]) => ({
      region,
      regionNameTh: REGION_NAME_TH[region],
      unlockedCount,
    }))
    .sort((a, b) => b.unlockedCount - a.unlockedCount);
}

/** Region with the most unlocked provinces, or null if nothing unlocked yet. */
export function getTopRegion(provinces: Province[], entries: JournalEntry[]): RegionAggregation | null {
  const aggregated = aggregateByRegion(provinces, entries);
  const top = aggregated[0];
  if (!top || top.unlockedCount === 0) return null;
  return top;
}

/** Format an ISO date string (YYYY-MM-DD) as Thai-readable "12 ก.ย. 2569" (Buddhist Era). */
const THAI_MONTHS_ABBR = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

export function formatThaiDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  const day = d.getUTCDate();
  const month = THAI_MONTHS_ABBR[d.getUTCMonth()];
  const buddhistYear = d.getUTCFullYear() + 543;
  return `${day} ${month} ${buddhistYear}`;
}
