// T64 / US-17 AC1/AC5: merge the Overpass extraction output (T60/T61) into
// `src/data/thailand-landmarks.ts` — SUPPLEMENT ONLY.
//
// *** Dev/build-time tool ONLY, run by hand once per extraction batch: ***
//   node scripts/merge-landmarks.ts [--in <path>]
//
// Hard constraint (PM decision ประเด็น 12): this script REFUSES to touch any
// of the 8 pilot provinces (T35/T63) even if the input file somehow contains
// entries for them — it only ever appends landmarks for provinceIds that are
// NOT already present anywhere in the current LANDMARKS array. Existing `id`
// values are never modified/removed; this only ever inserts new array
// elements before the closing `];` of `export const LANDMARKS: Landmark[] = [...]`.
import fs from 'node:fs';
import { PROVINCES } from '../src/data/thailand-provinces.ts';
import { LANDMARKS as EXISTING_LANDMARKS } from '../src/data/thailand-landmarks.ts';

interface ExtractedLandmark {
  id: string;
  provinceId: string;
  nameTh: string;
  lat: number;
  lng: number;
}

const DATA_FILE = 'src/data/thailand-landmarks.ts';

function parseArgs(argv: string[]): { inPath: string } {
  const inIndex = argv.indexOf('--in');
  return { inPath: inIndex >= 0 ? argv[inIndex + 1] : 'scripts/output/overpass-landmarks.json' };
}

function formatLandmarkLiteral(l: ExtractedLandmark): string {
  // JSON.stringify handles Thai text / quote escaping safely; lat/lng rounded
  // to 7 decimal places (~1cm precision — more than enough, keeps the file tidy).
  return `  { id: ${JSON.stringify(l.id)}, provinceId: ${JSON.stringify(l.provinceId)}, nameTh: ${JSON.stringify(l.nameTh)}, lat: ${round(l.lat)}, lng: ${round(l.lng)} },`;
}

function round(n: number): number {
  return Math.round(n * 1e7) / 1e7;
}

function main(): void {
  const { inPath } = parseArgs(process.argv.slice(2));
  const extracted: ExtractedLandmark[] = JSON.parse(fs.readFileSync(inPath, 'utf8'));

  const existingProvinceIds = new Set(EXISTING_LANDMARKS.map((l) => l.provinceId));
  const eligible = extracted.filter((l) => !existingProvinceIds.has(l.provinceId));
  const skippedPilot = extracted.length - eligible.length;
  if (skippedPilot > 0) {
    console.warn(
      `[merge-landmarks] Refused to touch ${skippedPilot} landmark(s) whose provinceId already has entries (pilot provinces) — supplement-only per PM decision ประเด็น 12.`
    );
  }

  if (eligible.length === 0) {
    console.log('[merge-landmarks] Nothing new to merge (0 eligible provinces in the input file).');
    return;
  }

  // Group by provinceId, in the same order PROVINCES lists them (stable,
  // human-reviewable diff instead of whatever order the JSON happened to have).
  const byProvince = new Map<string, ExtractedLandmark[]>();
  for (const l of eligible) {
    if (!byProvince.has(l.provinceId)) byProvince.set(l.provinceId, []);
    byProvince.get(l.provinceId)!.push(l);
  }

  const blocks: string[] = [];
  for (const province of PROVINCES) {
    const group = byProvince.get(province.id);
    if (!group || group.length === 0) continue;
    blocks.push(`\n  // ${province.nameTh} (${province.id}) — T60/T61 Overpass extraction`);
    for (const l of group) blocks.push(formatLandmarkLiteral(l));
  }
  const insertion = blocks.join('\n');

  const original = fs.readFileSync(DATA_FILE, 'utf8');
  const marker = '\n];\n\n/** All landmarks for one province';
  const markerIndex = original.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`[merge-landmarks] Could not find the expected closing marker in ${DATA_FILE} — aborting without writing anything.`);
  }
  const updated = original.slice(0, markerIndex) + insertion + original.slice(markerIndex);
  fs.writeFileSync(DATA_FILE, updated, 'utf8');

  console.log(
    `[merge-landmarks] Merged ${eligible.length} landmark(s) across ${byProvince.size} province(s) into ${DATA_FILE}.`
  );
}

main();
