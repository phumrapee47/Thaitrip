// T140 / US-37 AC1 (docs/tasks.md "รอบ 18 — เฟส 2"): source-level regression
// guard — none of the 6 screens/components redesigned in T133-T138 may
// hardcode a new hex/rgba color of their own; every brand color must come
// from `COLORS.*` in `src/theme.ts`. Mirrors the phase-1 guard
// (`src/__tests__/theme/noHardcodedHexRound15.test.ts`).
//
// `LandmarkCard.tsx` keeps a documented, intentional exception (see
// docs/dev-notes.md "รอบ 18" T135): generic black photo-dimming scrim/text-shadow
// overlays that aren't part of the brand palette and have no matching token in
// theme.ts. Those exact literals are allow-listed below instead of excluding
// the whole file, so any *other* new hardcoded color in that file still fails.
import fs from 'fs';
import path from 'path';

const FILES = [
  'components/LandmarkCard.tsx',
  'screens/ProvinceDetailScreen.tsx',
  'screens/AddEntryScreen.tsx',
  'screens/StatsScreen.tsx',
  'screens/SettingsScreen.tsx',
  'screens/NewsScreen.tsx',
  'components/NewsCard.tsx',
] as const;

const ALLOWED_LITERALS: Partial<Record<(typeof FILES)[number], string[]>> = {
  'components/LandmarkCard.tsx': [
    'rgba(0,0,0,0.7)', // hero photo scrim (generic black overlay, not brand palette)
    'rgba(0,0,0,0.25)', // compact photo scrim
    'rgba(0,0,0,0.5)', // heroTitle text-shadow
    // `withAlpha()`'s own template-literal body — a hex→rgba conversion
    // helper, not a hardcoded color. The regex below can't tell a template
    // literal from a real value, so its rendered shape is allow-listed here.
    'rgba(${r}, ${g}, ${b}, ${alpha})',
    // withAlpha()'s own doc-comment ("-> `rgba(...)` string") — plain prose,
    // not a color literal, but matches the same regex shape.
    'rgba(...)',
  ],
};

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(__dirname, '../../', relPath), 'utf-8');
}

const HEX_OR_RGBA_LITERAL = /#[0-9A-Fa-f]{3,8}\b|rgba?\([^)]*\)/g;

describe('T140 — no hardcoded hex/rgba colors outside theme.ts (เฟส 2, รอบ 18)', () => {
  it.each(FILES)('%s has zero unexpected hardcoded hex/rgba color literals', (relPath) => {
    const source = readSrc(relPath);
    const matches = source.match(HEX_OR_RGBA_LITERAL) ?? [];
    const allowed = ALLOWED_LITERALS[relPath] ?? [];
    const unexpected = matches.filter((m) => !allowed.includes(m));
    expect(unexpected).toEqual([]);
  });
});
