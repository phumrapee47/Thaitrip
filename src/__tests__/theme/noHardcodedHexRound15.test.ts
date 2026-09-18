// T131 / US-36 AC1 (docs/tasks.md "รอบ 15"): source-level regression guard —
// none of the 6 files redesigned in T126-T129 (docs/design-spec.md "Color
// Palette & Layout Redesign") may hardcode a new hex/rgba color of their own;
// every color must come from `COLORS.*` (or `SHADOWS.*`, which itself only
// references `COLORS`-adjacent literals inside theme.ts) in `src/theme.ts`.
// Mirrors the existing source-text regex guard pattern this codebase already
// uses for other non-visually-assertable invariants (see
// `src/__tests__/motion/t120EntranceAnimationWiring.test.ts`).
import fs from 'fs';
import path from 'path';

const FILES = [
  'screens/HomeScreen.tsx',
  'components/Map3D.tsx',
  'components/ProvinceTile3D.tsx',
  'components/HeaderProgress.tsx',
  'components/Legend.tsx',
  'components/GlobalSearchBar.tsx',
] as const;

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(__dirname, '../../', relPath), 'utf-8');
}

// Matches a hex color literal (#abc, #aabbcc, #aabbccdd) or an rgb()/rgba()
// function call, wherever it appears in the file — these are the only two
// hardcoded-color shapes theme.ts itself and this codebase's history (e.g.
// the old Map3D tooltip's `rgba(26,26,26,0.88)`) have ever used.
const HEX_OR_RGBA_LITERAL = /#[0-9A-Fa-f]{3,8}\b|rgba?\([^)]*\)/g;

describe('T131 — no hardcoded hex/rgba colors outside theme.ts (รอบ 15)', () => {
  it.each(FILES)('%s has zero hardcoded hex/rgba color literals', (relPath) => {
    const source = readSrc(relPath);
    const matches = source.match(HEX_OR_RGBA_LITERAL) ?? [];
    expect(matches).toEqual([]);
  });
});
