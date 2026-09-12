// T60 / US-16: pure, network-free extraction logic shared by
// scripts/extract-overpass-landmarks.ts (the CLI entrypoint) and
// scripts/extract-overpass-landmarks.test.ts (unit tests). Splitting this out
// avoids any "is this the CLI entrypoint?" detection trickiness — this module
// has no side effects and is safe to import from either place.
import type { Province } from '../../src/data/thailand-provinces.ts';

export interface ExtractedLandmark {
  id: string;
  provinceId: string;
  nameTh: string;
  lat: number;
  lng: number;
}

export interface ProvinceExtractionReport {
  provinceId: string;
  nameEn: string;
  found: number;
  status: 'ok' | 'partial' | 'empty' | 'area-not-found' | 'request-failed';
}

export interface OverpassAdminArea {
  relationId: number;
  nameEn: string;
}

export interface OverpassRawElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export const MIN_LANDMARKS_TARGET = 3;
export const MAX_LANDMARKS_PER_PROVINCE = 5;

/**
 * Tag priority (dev/content decision — US-16 AC1 leaves the exact ranking to
 * the team): curated tourist attractions first, then temples/historic
 * monuments (usually genuinely notable), then generic places of worship
 * (numerous small neighborhood mosques/shrines — least "top landmark"-like),
 * then parks last (often small municipal parks). Lower index = kept first
 * when a province has more than MAX_LANDMARKS_PER_PROVINCE candidates.
 */
export const TAG_PRIORITY: { key: string; value: string }[] = [
  { key: 'tourism', value: 'attraction' },
  { key: 'historic', value: 'temple' },
  { key: 'historic', value: 'monument' },
  { key: 'amenity', value: 'place_of_worship' },
  { key: 'leisure', value: 'park' },
];

/** Overpass's "area from relation" id convention. */
export const RELATION_AREA_OFFSET = 3600000000;

/**
 * Normalize an English province name for matching our `nameEn` field against
 * OSM admin boundary `name:en` tags: lowercase, strip everything but
 * a-z0-9 (drops spaces/hyphens so "Phang-nga" and "Nong Bua Lam Phu" both
 * match their OSM counterparts), and drop a trailing "province" (OSM tags
 * boundaries e.g. "Chiang Mai Province"; our nameEn is just "Chiang Mai").
 * Bangkok is a special case in OSM data: tagged plain "Bangkok", no
 * "Province" suffix and no "Metropolis" (our nameEn is "Bangkok Metropolis").
 */
export function normalizeProvinceNameEn(name: string): string {
  const stripped = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (stripped.includes('bangkok')) return 'bangkok';
  return stripped.replace(/province$/, '');
}

/**
 * Build provinceId -> Overpass area id from a bulk admin_level=4 boundary
 * query result (T60 step 1). A province with no confident name match is
 * simply absent from the map — callers must treat that as "area not found"
 * and skip it without affecting any other province (US-16 AC5).
 */
export function buildProvinceAreaMap(
  provinces: Pick<Province, 'id' | 'nameEn'>[],
  adminAreas: OverpassAdminArea[]
): Map<string, number> {
  const byNormalizedName = new Map<string, number>();
  for (const area of adminAreas) {
    byNormalizedName.set(normalizeProvinceNameEn(area.nameEn), area.relationId + RELATION_AREA_OFFSET);
  }
  const result = new Map<string, number>();
  for (const province of provinces) {
    const areaId = byNormalizedName.get(normalizeProvinceNameEn(province.nameEn));
    if (areaId) result.set(province.id, areaId);
  }
  return result;
}

function tagPriorityIndex(tags: Record<string, string>): number {
  for (let i = 0; i < TAG_PRIORITY.length; i++) {
    const { key, value } = TAG_PRIORITY[i];
    if (tags[key] === value) return i;
  }
  return TAG_PRIORITY.length; // Shouldn't happen — the query only fetches these tags.
}

function isThaiText(value: string | undefined): boolean {
  return Boolean(value && /[฀-๿]/.test(value));
}

/**
 * Pick up to MAX_LANDMARKS_PER_PROVINCE from raw Overpass elements for one
 * province (T60 AC1/AC2). An element is dropped (never saved with a
 * null/NaN placeholder) when:
 *   - it has no usable Thai name (`name:th`, falling back to `name` only if
 *     that value itself already looks like Thai script), or
 *   - it has no valid numeric lat/lng (nodes carry lat/lon directly; ways and
 *     relations only have them when the query used `out center`).
 * Remaining candidates are de-duplicated by id (Overpass can return the same
 * element twice when it matches more than one unioned tag filter) and sorted
 * by TAG_PRIORITY, most important first.
 */
export function selectTopLandmarks(provinceId: string, elements: OverpassRawElement[]): ExtractedLandmark[] {
  const candidates: (ExtractedLandmark & { priority: number })[] = [];

  for (const el of elements) {
    const tags = el.tags ?? {};
    const nameTh = tags['name:th'] ?? (isThaiText(tags.name) ? tags.name : undefined);
    if (!nameTh) continue;

    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) continue;

    candidates.push({
      id: `${provinceId}-osm-${el.type[0]}${el.id}`,
      provinceId,
      nameTh,
      lat,
      lng,
      priority: tagPriorityIndex(tags),
    });
  }

  const seen = new Set<string>();
  const deduped = candidates.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
  deduped.sort((a, b) => a.priority - b.priority);

  return deduped.slice(0, MAX_LANDMARKS_PER_PROVINCE).map(({ priority, ...rest }) => {
    void priority;
    return rest;
  });
}

/** Build the report status for one province (T60 step 4 / US-16 AC3). */
export function reportStatus(found: number, areaResolved: boolean): ProvinceExtractionReport['status'] {
  if (!areaResolved) return 'area-not-found';
  if (found === 0) return 'empty';
  if (found < MIN_LANDMARKS_TARGET) return 'partial';
  return 'ok';
}

/** Build the Overpass QL query for one province's landmark search (T60 step 2). */
export function buildLandmarkQuery(areaId: number, timeoutSec: number): string {
  const tagFilters = TAG_PRIORITY.map(({ key, value }) => `nwr["${key}"="${value}"](area.a);`).join('');
  return `[out:json][timeout:${timeoutSec}];area(${areaId})->.a;(${tagFilters});out center 40;`;
}
