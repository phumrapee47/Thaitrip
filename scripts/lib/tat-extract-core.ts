// US-27: pure, network-free extraction/selection logic for the TAT (Tourism
// Authority of Thailand) open-data attraction catalog, shared by
// scripts/extract-tat-landmarks.ts (the CLI entrypoint, network I/O) and
// scripts/lib/tat-extract-core.test.ts (unit tests, no network). Mirrors the
// split already established for the Overpass extraction
// (scripts/lib/overpass-extract-core.ts).
//
// Source: https://datacatalog.tat.or.th (dataset id 87442079-88ec-42eb-b507-dcf135fc4301,
// resource attraction.json) — official government open data, ~8,600 records
// covering 78 provinces, every record carries `PROVINCE_NAME_TH` (matches
// this app's `Province.nameTh` exactly, verified by hand for every target
// province before writing this module) and a "lat, lng" `ATT_LOCATION`
// string, but NO photo/image field of any kind (checked all 59 record keys).

/**
 * Deliberately a standalone copy of `detectCategory` from
 * `src/services/wikipediaService.ts` (not imported from there): that file's
 * own relative imports lack file extensions, which Node's native ESM loader
 * (used to run this script directly, no bundler) refuses to resolve —
 * `scripts/lib/overpass-extract-core.ts` avoids importing from `src/services/*`
 * for the same reason. Keep this in sync by hand if the categorization rules
 * there ever change; it's small, pure, and has not needed a change since it
 * was written.
 */
export function detectCategory(title: string, desc: string = ''): string {
  const t = (title + ' ' + desc).toLowerCase();
  if (/หาด|เกาะ|อ่าว|แหลม|ปะการัง|ทะเล(?!หมอก)/.test(t)) return 'ทะเลและชายหาด';
  if (/วัด|อาราม|เจดีย์|วิหาร|พระธาตุ|พระบรมธาตุ|มัสยิด|ศาลเจ้า|โบสถ์/.test(t)) return 'วัดและศาสนสถาน';
  if (/อุทยาน|ดอย|น้ำตก|ถ้ำ|ป่า|ภู|อ่างเก็บน้ำ|กิ่ว|เขตรักษาพันธุ์|น้ำพุร้อน|บึง|แม่น้ำ|เขื่อน|ทะเลหมอก/.test(t)) return 'ธรรมชาติและภูเขา';
  if (/วัง|พระราชวัง|เมืองเก่า|ประวัติศาสตร์|พิพิธภัณฑ์|พิพิธภัณฑ|ปราสาท|อนุสาวรีย์|หอศิลป์|โบราณ/.test(t)) return 'ประวัติศาสตร์และวัฒนธรรม';
  if (/ตลาด|ถนนคนเดิน|ไนท์บาซาร์|คอมมูนิตี้|ฟาร์ม|สวนสัตว์|สวนสนุก/.test(t)) return 'ช้อปปิ้งและสันทนาการ';
  return 'สถานที่ท่องเที่ยว';
}

export interface TatRawRecord {
  ATT_ID: string;
  ATT_NAME_TH: string;
  ATT_DETAIL_TH?: string | null;
  ATT_HILIGHT?: string | null;
  ATT_LOCATION?: string | null;
  PROVINCE_NAME_TH: string;
}

export interface ExtractedTatLandmark {
  id: string;
  provinceId: string;
  nameTh: string;
  lat: number;
  lng: number;
  description?: string;
  category?: string;
}

/** Recommended-list size per province — TAT data is far richer than Overpass's
 * POI tags (some provinces have 100+ records), so this caps bundle growth and
 * keeps each province's list "top picks" rather than an exhaustive directory.
 * Deliberately higher than Overpass's MAX_LANDMARKS_PER_PROVINCE (5): TAT
 * records are curated tourism-board entries, not raw OSM POIs, so a larger
 * cap here is still "top picks" quality, not noise. */
export const MAX_LANDMARKS_PER_PROVINCE = 15;

const DESCRIPTION_MAX_CHARS = 160;

// Thailand's real bounding box (with a small margin) — guards against a
// swapped lat/lng or garbage coordinate silently shipping (mirrors US-16 AC3's
// "never a partial/NaN coordinate" guarantee for the Overpass extraction).
const THAILAND_LAT_RANGE: [number, number] = [4, 22];
const THAILAND_LNG_RANGE: [number, number] = [96, 106];

/** Strips HTML tags/entities from TAT's rich-text detail fields down to plain
 * text, collapsing whitespace. Not a full HTML sanitizer — this data is our
 * own build-time input, never rendered as HTML, so entity-decoding only
 * covers the handful of entities actually observed in the real dataset. */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&rsquo;/gi, '’')
    .replace(/&lsquo;/gi, '‘')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars).trimEnd() + '…';
}

/** Parses TAT's `"lat, lng"` string format into finite numbers inside
 * Thailand's real bounding box. Returns null (never NaN/partial) for
 * anything malformed, out-of-range, or missing. */
export function parseTatLocation(raw: string | null | undefined): { lat: number; lng: number } | null {
  if (!raw) return null;
  const parts = raw.split(',').map((s) => Number(s.trim()));
  if (parts.length !== 2) return null;
  const [lat, lng] = parts;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < THAILAND_LAT_RANGE[0] || lat > THAILAND_LAT_RANGE[1]) return null;
  if (lng < THAILAND_LNG_RANGE[0] || lng > THAILAND_LNG_RANGE[1]) return null;
  return { lat, lng };
}

/** Best short description available for a record: the curated "highlight"
 * field first (already hand-written to be a teaser), falling back to the
 * long-form detail field stripped of HTML — both truncated to
 * DESCRIPTION_MAX_CHARS to match the app's existing Wikipedia-sourced
 * landmark description length (see wikipediaService.ts `exchars=160`). */
function buildDescription(record: TatRawRecord): string | undefined {
  const highlight = record.ATT_HILIGHT ? stripHtml(record.ATT_HILIGHT) : '';
  if (highlight) return truncate(highlight, DESCRIPTION_MAX_CHARS);

  const detail = record.ATT_DETAIL_TH ? stripHtml(record.ATT_DETAIL_TH) : '';
  if (detail) return truncate(detail, DESCRIPTION_MAX_CHARS);

  return undefined;
}

/**
 * Selects up to `limit` records (default MAX_LANDMARKS_PER_PROVINCE) for one
 * province from the raw TAT records already filtered to that province's
 * PROVINCE_NAME_TH. `limit` is a caller-supplied parameter (not always the
 * default) so a province that already has some landmarks from another
 * source (e.g. an earlier Overpass merge) can be topped up to the same
 * overall per-province cap instead of exceeding it — see
 * extract-tat-landmarks.ts's `remainingSlots` computation. Drops (never
 * saves with a placeholder) any record with no non-empty nameTh or no valid
 * coordinate. Prefers records with a usable description over ones with none
 * (richer content first), preserving the source array's relative order for
 * ties so the output is deterministic across runs.
 */
export function selectTopTatLandmarks(
  provinceId: string,
  records: TatRawRecord[],
  limit: number = MAX_LANDMARKS_PER_PROVINCE
): ExtractedTatLandmark[] {
  const candidates: (ExtractedTatLandmark & { hasDescription: boolean })[] = [];
  const seenIds = new Set<string>();

  for (const record of records) {
    const nameTh = record.ATT_NAME_TH?.trim();
    if (!nameTh) continue;

    const location = parseTatLocation(record.ATT_LOCATION);
    if (!location) continue;

    const id = `tat-${record.ATT_ID}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const description = buildDescription(record);
    candidates.push({
      id,
      provinceId,
      nameTh,
      lat: location.lat,
      lng: location.lng,
      description,
      category: detectCategory(nameTh, description ?? ''),
      hasDescription: Boolean(description),
    });
  }

  // Stable sort: records with a description first, ties keep source order
  // (Array.prototype.sort is guaranteed stable since ES2019 / all supported
  // Node/engine versions here).
  candidates.sort((a, b) => Number(b.hasDescription) - Number(a.hasDescription));

  return candidates.slice(0, Math.max(0, limit)).map(({ hasDescription, ...rest }) => {
    void hasDescription;
    return rest;
  });
}

/**
 * Builds a lean SEARCH-ONLY index entry for every valid record in one
 * province — no cap, no description/category (unlike selectTopTatLandmarks,
 * which curates a small "top picks" display list). This exists because no
 * field in the TAT dataset reliably signals real-world notability (verified
 * by hand: neither "has a description", description length, nor "has a
 * curated ATT_HILIGHT" correlates with fame — a famous, decades-old place
 * like หาดชะอำ/Cha-am Beach has no ATT_HILIGHT and a merely-average-length
 * description, while newer small community-tourism entries often have both,
 * since TAT staff write marketing copy specifically for the places that
 * still need promoting). Capping a "top N" selection by any such heuristic
 * therefore silently drops well-known places at random from *search*, not
 * just from the curated display list — so search must draw from the full
 * set instead. See scripts/extract-tat-search-index.ts, which builds
 * src/data/tat-search-index.ts from this.
 */
export function buildSearchIndexEntries(provinceId: string, records: TatRawRecord[]): ExtractedTatLandmark[] {
  const results: ExtractedTatLandmark[] = [];
  const seenIds = new Set<string>();

  for (const record of records) {
    const nameTh = record.ATT_NAME_TH?.trim();
    if (!nameTh) continue;

    const location = parseTatLocation(record.ATT_LOCATION);
    if (!location) continue;

    const id = `tat-${record.ATT_ID}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    results.push({ id, provinceId, nameTh, lat: location.lat, lng: location.lng });
  }

  return results;
}
