import type { Landmark } from '../data/thailand-landmarks';

export interface LandmarkProgress {
  checkedInCount: number;
  totalCount: number;
}

/** T36 / US-8 AC3: "เช็คอินแล้ว X/Y แห่ง" for one province. */
export function getLandmarkProgress(
  provinceId: string,
  allLandmarks: Landmark[],
  checkins: Record<string, boolean>
): LandmarkProgress {
  const provinceLandmarks = allLandmarks.filter((l) => l.provinceId === provinceId);
  const checkedInCount = provinceLandmarks.filter((l) => checkins[l.id]).length;
  return { checkedInCount, totalCount: provinceLandmarks.length };
}

/**
 * T36 / US-9: Province Master requires >=1 landmark AND every one checked in.
 * Always computed live from current progress — never cached — so un-checking
 * a landmark immediately revokes it (US-9 AC2), and 0-landmark provinces never
 * qualify (US-9 AC3).
 */
export function isProvinceMaster(progress: LandmarkProgress): boolean {
  return progress.totalCount > 0 && progress.checkedInCount === progress.totalCount;
}
