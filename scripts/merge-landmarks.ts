// T64 / US-17 AC1/AC5 (extended by US-27 to also accept TAT extraction output):
// merge an extraction batch into `src/data/thailand-landmarks.ts` — SUPPLEMENT ONLY.
//
// *** Dev/build-time tool ONLY, run by hand once per extraction batch: ***
//   node scripts/merge-landmarks.ts [--in <path>] [--label <text>]
//
// Hard constraint (PM decision ประเด็น 12): this script REFUSES to touch any
// of the 8 pilot provinces (T35/T63) even if the input file somehow contains
// entries for them — checked explicitly by provinceId, not inferred from
// "already has entries" (see US-27 รอบ 13: a province CAN legitimately already
// have entries from an earlier non-pilot batch — e.g. the T60/T61 Overpass
// merge — and still be a valid target for topping up further, up to the
// caller's own per-province cap). Existing `id` values are never
// modified/removed; eligibility is instead checked per-id (a landmark whose
// exact `id` already exists anywhere in LANDMARKS is silently skipped,
// making a re-run of the same extraction batch a safe no-op) — this only
// ever inserts new array elements before the closing `];` of
// `export const LANDMARKS: Landmark[] = [...]`.
import fs from 'node:fs';
import { PROVINCES } from '../src/data/thailand-provinces.ts';
import { LANDMARKS as EXISTING_LANDMARKS } from '../src/data/thailand-landmarks.ts';

// Mirrors the same literal in scripts/extract-overpass-landmarks.ts and
// scripts/extract-tat-landmarks.ts — kept as a plain literal here too (not
// imported) so this script has zero dependency on those files' shape.
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

interface ExtractedLandmark {
  id: string;
  provinceId: string;
  nameTh: string;
  lat: number;
  lng: number;
  /** US-27: present for TAT-sourced input, absent for the older Overpass-only shape. */
  description?: string;
  category?: string;
}

const DATA_FILE = 'src/data/thailand-landmarks.ts';

function parseArgs(argv: string[]): { inPath: string; label: string } {
  const inIndex = argv.indexOf('--in');
  const labelIndex = argv.indexOf('--label');
  return {
    inPath: inIndex >= 0 ? argv[inIndex + 1] : 'scripts/output/overpass-landmarks.json',
    label: labelIndex >= 0 ? argv[labelIndex + 1] : 'T60/T61 Overpass extraction',
  };
}

function formatLandmarkLiteral(l: ExtractedLandmark): string {
  // JSON.stringify handles Thai text / quote escaping safely; lat/lng rounded
  // to 7 decimal places (~1cm precision — more than enough, keeps the file tidy).
  const fields = [
    `id: ${JSON.stringify(l.id)}`,
    `provinceId: ${JSON.stringify(l.provinceId)}`,
    `nameTh: ${JSON.stringify(l.nameTh)}`,
    `lat: ${round(l.lat)}`,
    `lng: ${round(l.lng)}`,
  ];
  if (l.description) fields.push(`description: ${JSON.stringify(l.description)}`);
  if (l.category) fields.push(`category: ${JSON.stringify(l.category)}`);
  return `  { ${fields.join(', ')} },`;
}

function round(n: number): number {
  return Math.round(n * 1e7) / 1e7;
}

function main(): void {
  const { inPath, label } = parseArgs(process.argv.slice(2));
  const extracted: ExtractedLandmark[] = JSON.parse(fs.readFileSync(inPath, 'utf8'));

  const existingIds = new Set(EXISTING_LANDMARKS.map((l) => l.id));
  const skippedPilot = extracted.filter((l) => PILOT_PROVINCE_IDS.has(l.provinceId));
  const skippedDuplicateId = extracted.filter(
    (l) => !PILOT_PROVINCE_IDS.has(l.provinceId) && existingIds.has(l.id)
  );
  const eligible = extracted.filter(
    (l) => !PILOT_PROVINCE_IDS.has(l.provinceId) && !existingIds.has(l.id)
  );

  if (skippedPilot.length > 0) {
    console.warn(
      `[merge-landmarks] Refused to touch ${skippedPilot.length} landmark(s) targeting a pilot province — supplement-only per PM decision ประเด็น 12.`
    );
  }
  if (skippedDuplicateId.length > 0) {
    console.log(
      `[merge-landmarks] Skipped ${skippedDuplicateId.length} landmark(s) whose id already exists (safe no-op re-run of an already-merged batch).`
    );
  }

  if (eligible.length === 0) {
    console.log('[merge-landmarks] Nothing new to merge (0 eligible landmarks in the input file).');
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
    blocks.push(`\n  // ${province.nameTh} (${province.id}) — ${label}`);
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
