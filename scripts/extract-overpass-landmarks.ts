// T60 / US-16: OSM Overpass API extraction script — CLI entrypoint.
//
// *** Dev/build-time tool ONLY. Never imported from src/, never bundled into
// the app (PM decision ประเด็น 13 / docs/tasks.md). Run it by hand: ***
//
//   node scripts/extract-overpass-landmarks.ts [--only-missing] [--out <path>] [--report <path>]
//
// Node 22.6+ strips TypeScript syntax natively (this repo's dev machine runs
// Node 24), so no ts-node/tsx install is required. On an older Node use:
//   node --experimental-strip-types scripts/extract-overpass-landmarks.ts
// or install tsx and run `npx tsx scripts/extract-overpass-landmarks.ts`.
//
// `--only-missing` (recommended) skips the 8 pilot provinces that already
// have hand-curated landmarks in thailand-landmarks.ts (T35) — T64 only ever
// merges into the other 68 anyway (PM decision ประเด็น 12), so querying the
// pilot 8 again would just waste Overpass request budget. Omit the flag to
// extract all 76 provinces (e.g. to refresh/compare against the pilot data).
//
// Pure selection/matching logic lives in scripts/lib/overpass-extract-core.ts
// and is unit-tested there without any network access
// (scripts/extract-overpass-landmarks.test.ts). This file only adds the
// network I/O (fetch + retry + rate-limit delay) and file output — see
// docs/dev-notes.md "T60/T61" for the real run performed for this round.
import fs from 'node:fs';
import path from 'node:path';
import { PROVINCES, type Province } from '../src/data/thailand-provinces.ts';
import {
  buildLandmarkQuery,
  buildProvinceAreaMap,
  reportStatus,
  selectTopLandmarks,
  type ExtractedLandmark,
  type OverpassAdminArea,
  type OverpassRawElement,
  type ProvinceExtractionReport,
} from './lib/overpass-extract-core.ts';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
// Custom User-Agent (same courtesy as the Nominatim client, T68) — plain
// Node `fetch` with no Accept header gets a 406 from overpass-api.de in
// practice, so this also fixes that, not just good manners.
const USER_AGENT = 'THAITRIP-dev-extraction-script/1.0 (contact: phumrapee47@gmail.com)';
const ADMIN_AREAS_TIMEOUT_MS = 60000;
const PROVINCE_QUERY_TIMEOUT_SEC = 30;
const DELAY_BETWEEN_PROVINCES_MS = 1200; // US-16 AC4: courtesy delay between requests
const MAX_RETRIES_PER_PROVINCE = 1; // "retry อย่างน้อย 1 ครั้ง"
const RETRY_DELAY_MS = 2000;
const RATE_LIMIT_RETRY_DELAY_MS = 6000;

// The 8 pilot provinces already curated by hand in thailand-landmarks.ts
// (T35). Kept as a plain literal here (not imported) so this script has zero
// dependency on that file's shape — it only ever needs the id strings.
const PILOT_PROVINCE_IDS: ReadonlySet<string> = new Set([
  'bangkok-metropolis',
  'chiang-mai',
  'chiang-rai',
  'phra-nakhon-si-ayutthaya',
  'sukhothai',
  'chon-buri',
  'krabi',
  'phuket',
]);

async function fetchOverpassJson(query: string, timeoutMs: number): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT, Accept: '*/*' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, retries: number): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        // Overpass returns HTTP 429 when the shared public instance is under
        // load; back off noticeably longer than a generic transient failure
        // before the single allowed retry (US-16 AC4 courtesy).
        const isRateLimited = err instanceof Error && err.message.includes('429');
        await sleep(isRateLimited ? RATE_LIMIT_RETRY_DELAY_MS : RETRY_DELAY_MS);
      }
    }
  }
  throw lastErr;
}

async function fetchAdminAreas(): Promise<OverpassAdminArea[]> {
  const query =
    '[out:json][timeout:60];area["name:en"="Thailand"]["admin_level"="2"]->.th;' +
    'relation["boundary"="administrative"]["admin_level"="4"](area.th);out tags;';
  const data = await withRetry(() => fetchOverpassJson(query, ADMIN_AREAS_TIMEOUT_MS), MAX_RETRIES_PER_PROVINCE);
  return (data.elements ?? [])
    .filter((el: any) => typeof el?.tags?.['name:en'] === 'string')
    .map((el: any) => ({ relationId: el.id, nameEn: el.tags['name:en'] as string }));
}

async function extractProvince(
  province: Province,
  areaId: number
): Promise<{ landmarks: ExtractedLandmark[]; elementCount: number }> {
  const query = buildLandmarkQuery(areaId, PROVINCE_QUERY_TIMEOUT_SEC);
  const data = await withRetry(
    () => fetchOverpassJson(query, PROVINCE_QUERY_TIMEOUT_SEC * 1000 + 5000),
    MAX_RETRIES_PER_PROVINCE
  );
  const elements: OverpassRawElement[] = data.elements ?? [];
  return { landmarks: selectTopLandmarks(province.id, elements), elementCount: elements.length };
}

function parseArgs(argv: string[]): { onlyMissing: boolean; outPath: string; reportPath: string } {
  const onlyMissing = argv.includes('--only-missing');
  const outIndex = argv.indexOf('--out');
  const outPath = outIndex >= 0 ? argv[outIndex + 1] : 'scripts/output/overpass-landmarks.json';
  const reportIndex = argv.indexOf('--report');
  const reportPath = reportIndex >= 0 ? argv[reportIndex + 1] : 'scripts/output/overpass-landmarks-report.json';
  return { onlyMissing, outPath, reportPath };
}

function readJsonIfExists<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

/** Write current progress to disk after every province, not just at the end —
 * so a run that's interrupted (rate-limited, killed, machine sleeps, etc.)
 * never loses already-extracted provinces (US-16 AC5 applies to the *script's
 * own* resilience too, not just per-province error isolation). */
function writeProgress(
  outPath: string,
  reportPath: string,
  allLandmarks: ExtractedLandmark[],
  report: ProvinceExtractionReport[]
): void {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(allLandmarks, null, 2), 'utf8');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
}

async function main(): Promise<void> {
  const { onlyMissing, outPath, reportPath } = parseArgs(process.argv.slice(2));
  const allTargets = onlyMissing ? PROVINCES.filter((p) => !PILOT_PROVINCE_IDS.has(p.id)) : PROVINCES;

  // Resume support: a province already recorded with status 'ok' in a
  // previous (possibly interrupted) run at the same --out/--report paths is
  // skipped this time, so re-running after a partial failure doesn't waste
  // Overpass request budget re-fetching provinces that already succeeded.
  const previousReport = readJsonIfExists<ProvinceExtractionReport[]>(reportPath, []);
  const alreadyOk = new Set(previousReport.filter((r) => r.status === 'ok').map((r) => r.provinceId));
  const allLandmarks: ExtractedLandmark[] = readJsonIfExists<ExtractedLandmark[]>(outPath, []).filter((l) =>
    alreadyOk.has(l.provinceId)
  );
  const report: ProvinceExtractionReport[] = previousReport.filter((r) => alreadyOk.has(r.provinceId));
  const targetProvinces = allTargets.filter((p) => !alreadyOk.has(p.id));

  if (alreadyOk.size > 0) {
    console.log(`[extract-overpass-landmarks] Resuming: ${alreadyOk.size} province(s) already 'ok' from a previous run, skipping them.`);
  }

  console.log(`[extract-overpass-landmarks] Resolving admin boundary areas for ${PROVINCES.length} provinces...`);
  const adminAreas = await fetchAdminAreas();
  const areaMap = buildProvinceAreaMap(PROVINCES, adminAreas);
  console.log(`[extract-overpass-landmarks] Resolved ${areaMap.size}/${PROVINCES.length} province areas.`);
  console.log(`[extract-overpass-landmarks] Querying landmarks for ${targetProvinces.length} province(s)...`);

  for (const province of targetProvinces) {
    const areaId = areaMap.get(province.id);
    if (!areaId) {
      report.push({ provinceId: province.id, nameEn: province.nameEn, found: 0, status: 'area-not-found' });
      console.warn(`[extract-overpass-landmarks] ${province.nameEn}: area not found, skipping.`);
      writeProgress(outPath, reportPath, allLandmarks, report);
      continue;
    }

    try {
      const { landmarks, elementCount } = await extractProvince(province, areaId);
      allLandmarks.push(...landmarks);
      const status = reportStatus(landmarks.length, true);
      report.push({ provinceId: province.id, nameEn: province.nameEn, found: landmarks.length, status });
      console.log(
        `[extract-overpass-landmarks] ${province.nameEn}: ${landmarks.length} landmark(s) picked from ${elementCount} raw element(s) [${status}]`
      );
    } catch (err) {
      // A single province failing (after its retry) must never take down the
      // rest of the run or lose provinces that already succeeded (US-16 AC5).
      report.push({ provinceId: province.id, nameEn: province.nameEn, found: 0, status: 'request-failed' });
      console.error(`[extract-overpass-landmarks] ${province.nameEn}: request failed —`, (err as Error).message);
    }

    writeProgress(outPath, reportPath, allLandmarks, report);
    await sleep(DELAY_BETWEEN_PROVINCES_MS);
  }

  const needsReview = report.filter((r) => r.status !== 'ok');
  console.log(
    `\n[extract-overpass-landmarks] Done. ${allLandmarks.length} landmark(s) across ${report.length} province(s) written to ${outPath}.`
  );
  console.log(`[extract-overpass-landmarks] ${needsReview.length} province(s) need manual review (see ${reportPath}):`);
  for (const r of needsReview) {
    console.log(`  - ${r.nameEn} (${r.provinceId}): ${r.status}, found ${r.found}`);
  }
}

main().catch((err) => {
  console.error('[extract-overpass-landmarks] fatal error:', err);
  process.exitCode = 1;
});
