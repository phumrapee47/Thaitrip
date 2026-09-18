// US-27 — TAT (Tourism Authority of Thailand) open-data extraction script —
// CLI entrypoint.
//
// *** Dev/build-time tool ONLY. Never imported from src/, never bundled into
// the app (same convention as scripts/extract-overpass-landmarks.ts). Run it
// by hand: ***
//
//   node scripts/extract-tat-landmarks.ts [--out <path>]
//
// Downloads the official TAT attraction catalog (~32MB raw JSON, ~8,600
// records covering 78 provinces — see scripts/lib/tat-extract-core.ts for the
// source URL and a note on its schema) and writes a small, per-province
// top-N extraction to --out, ready for scripts/merge-landmarks.ts.
//
// Targets every province EXCEPT:
//   - the 8 hand-curated pilot provinces (T35/T63) — never touched by any
//     automated merge, same hard rule as scripts/merge-landmarks.ts;
//   - two provinces several existing tests deliberately rely on staying
//     empty as the "not-curated-yet" fixture (chaiyaphum:
//     landmarkCheckin.test.tsx / landmarkMapIntegration.test.tsx; si-sa-ket:
//     LandmarkList.test.tsx / landmarkCardsWikipediaIntegration.test.tsx AC6)
//     — see docs/dev-notes.md US-27 for the exact grep used to confirm those
//     are the only two.
//
// Every other province is topped up to MAX_LANDMARKS_PER_PROVINCE *total*,
// counting whatever it already has from an earlier source (e.g. the 37
// provinces from the T60/T61 Overpass merge, which only ever got up to 5 thin
// entries with no description/category) — never past the cap, and never by
// touching/removing an existing entry. This is what surfaces well-known
// places like "หาดชะอำ" (Cha-am Beach, Phetchaburi) that the original
// Overpass-only data never had a chance to include (see docs/dev-notes.md
// "รอบ 13" for the real gap that motivated this).
//
// Pure selection logic lives in scripts/lib/tat-extract-core.ts and is
// unit-tested there without any network access (tat-extract-core.test.ts).
import fs from 'node:fs';
import path from 'node:path';
import { PROVINCES } from '../src/data/thailand-provinces.ts';
import { LANDMARKS as EXISTING_LANDMARKS } from '../src/data/thailand-landmarks.ts';
import { MAX_LANDMARKS_PER_PROVINCE, selectTopTatLandmarks, type TatRawRecord } from './lib/tat-extract-core.ts';

const TAT_DATASET_URL =
  'https://datacatalog.tat.or.th/dataset/87442079-88ec-42eb-b507-dcf135fc4301/resource/9348705e-18b4-4815-8d2c-0fd2f649e88e/download/attraction.json';
const USER_AGENT = 'THAITRIP-dev-extraction-script/1.0 (contact: phumrapee47@gmail.com)';

// The 8 pilot provinces already curated by hand in thailand-landmarks.ts
// (T35) — mirrors the same literal in scripts/extract-overpass-landmarks.ts.
// Kept as a plain literal (not imported) so this script has zero dependency
// on that file's shape.
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

// Deliberately kept empty forever as a "province with no curated landmarks"
// test fixture (see the file-level comment above for exactly which tests).
const KEEP_EMPTY_PROVINCE_IDS: ReadonlySet<string> = new Set(['chaiyaphum', 'si-sa-ket']);

function parseArgs(argv: string[]): { outPath: string } {
  const outIndex = argv.indexOf('--out');
  return { outPath: outIndex >= 0 ? argv[outIndex + 1] : 'scripts/output/tat-landmarks.json' };
}

async function fetchTatRecords(): Promise<TatRawRecord[]> {
  const res = await fetch(TAT_DATASET_URL, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`TAT dataset request failed with HTTP ${res.status}`);
  const data = await res.json();
  // The dataset's top-level JSON has exactly one key: the SQL query string
  // that produced it (an artifact of the CKAN export). Its value is the
  // actual record array.
  const key = Object.keys(data)[0];
  const records = data[key];
  if (!Array.isArray(records)) throw new Error('Unexpected TAT dataset shape: expected an array of records');
  return records as TatRawRecord[];
}

async function main(): Promise<void> {
  const { outPath } = parseArgs(process.argv.slice(2));

  const existingCountByProvince = new Map<string, number>();
  for (const l of EXISTING_LANDMARKS) {
    existingCountByProvince.set(l.provinceId, (existingCountByProvince.get(l.provinceId) ?? 0) + 1);
  }
  const targets = PROVINCES.filter(
    (p) => !PILOT_PROVINCE_IDS.has(p.id) && !KEEP_EMPTY_PROVINCE_IDS.has(p.id)
  );
  console.log(
    `[extract-tat-landmarks] ${targets.length} target province(s) (${PILOT_PROVINCE_IDS.size} pilot excluded, ${KEEP_EMPTY_PROVINCE_IDS.size} deliberately kept empty for tests). Each topped up to ${MAX_LANDMARKS_PER_PROVINCE} total, counting what it already has.`
  );

  console.log('[extract-tat-landmarks] Downloading TAT attraction catalog (~32MB)...');
  const records = await fetchTatRecords();
  console.log(`[extract-tat-landmarks] Downloaded ${records.length} raw record(s).`);

  const byProvinceName = new Map<string, TatRawRecord[]>();
  for (const record of records) {
    const name = record.PROVINCE_NAME_TH;
    if (!name) continue;
    if (!byProvinceName.has(name)) byProvinceName.set(name, []);
    byProvinceName.get(name)!.push(record);
  }

  const allExtracted = [];
  const report: Array<{ provinceId: string; nameTh: string; rawCount: number; extracted: number }> = [];
  for (const province of targets) {
    const remainingSlots = MAX_LANDMARKS_PER_PROVINCE - (existingCountByProvince.get(province.id) ?? 0);
    if (remainingSlots <= 0) {
      console.log(`[extract-tat-landmarks] ${province.nameTh} (${province.id}): already at cap, skipping.`);
      continue;
    }
    const raw = byProvinceName.get(province.nameTh) ?? [];
    const extracted = selectTopTatLandmarks(province.id, raw, remainingSlots);
    allExtracted.push(...extracted);
    report.push({ provinceId: province.id, nameTh: province.nameTh, rawCount: raw.length, extracted: extracted.length });
    console.log(
      `[extract-tat-landmarks] ${province.nameTh} (${province.id}): ${extracted.length} landmark(s) picked from ${raw.length} raw record(s) (${remainingSlots} slot(s) remaining before this batch).`
    );
  }

  const zeroResult = report.filter((r) => r.extracted === 0);
  if (zeroResult.length > 0) {
    console.warn(
      `[extract-tat-landmarks] ${zeroResult.length} target province(s) got 0 landmarks from the TAT dataset (name mismatch or no valid records): ${zeroResult.map((r) => r.nameTh).join(', ')}`
    );
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(allExtracted, null, 2), 'utf8');
  console.log(
    `\n[extract-tat-landmarks] Done. ${allExtracted.length} landmark(s) across ${targets.length - zeroResult.length} province(s) written to ${outPath}.`
  );
}

main().catch((err) => {
  console.error('[extract-tat-landmarks] fatal error:', err);
  process.exitCode = 1;
});
