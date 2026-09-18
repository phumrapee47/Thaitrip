// T120/T123 / US-34 AC2 (docs/design-spec.md §2, §2.4 + คำตัดสิน PM ข้อ 25,
// docs/tasks.md รอบ 14): proves the entrance-animation wiring is actually
// present in each of the 4 required spots' source, not left at RN's plain
// default rendering. Mirrors the existing source-level guard pattern this
// codebase already uses for OS-level motion that RNTL can't meaningfully
// assert on visually (see `src/navigation/AppNavigator.test.tsx` for T119).
import fs from 'fs';
import path from 'path';

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(__dirname, '../../', relPath), 'utf-8');
}

describe('T120 entrance animation wiring (US-34 AC2)', () => {
  describe('EntranceFadeItem — shared parameters (docs/design-spec.md §2)', () => {
    const source = readSrc('components/EntranceFadeItem.tsx');

    it('uses the standard per-item duration (260ms) and start translateY (12pt)', () => {
      expect(source).toMatch(/ITEM_DURATION_MS\s*=\s*260/);
      expect(source).toMatch(/START_TRANSLATE_Y\s*=\s*12/);
    });

    it('uses the standard stagger step (40ms) capped at 320ms', () => {
      expect(source).toMatch(/STAGGER_STEP_MS\s*=\s*40/);
      expect(source).toMatch(/STAGGER_CAP_MS\s*=\s*320/);
      expect(source).toMatch(/Math\.min\(index \* STAGGER_STEP_MS,\s*STAGGER_CAP_MS\)/);
    });

    it('never blocks touches during entrance (no pointerEvents="none" on the returned JSX)', () => {
      const returnBlock = source.slice(source.indexOf('return ('));
      expect(returnBlock).not.toMatch(/pointerEvents=["']none["']/);
    });

    it('falls back to a snap-to-final-state (opacity 1, translateY 0) under Reduce Motion, with no stagger', () => {
      expect(source).toMatch(/if \(reduceMotion\) \{[\s\S]*opacity\.value = 1;[\s\S]*translateY\.value = 0;/);
    });
  });

  describe('LandmarkList.tsx (docs/design-spec.md §2.1)', () => {
    const source = readSrc('components/LandmarkList.tsx');

    it('imports EntranceFadeItem and useEntrancePlayedOnce', () => {
      expect(source).toMatch(/import EntranceFadeItem from '\.\/EntranceFadeItem'/);
      expect(source).toMatch(/import \{ useEntrancePlayedOnce \} from '\.\.\/hooks\/useEntrancePlayedOnce'/);
    });

    it('gates the hero + grid cards on shouldPlayEntrance, indexing the grid items after the hero card', () => {
      expect(source).toMatch(/shouldPlayEntrance \?[\s\S]*<EntranceFadeItem index=\{0\}>/);
      expect(source).toMatch(/<EntranceFadeItem key=\{landmark\.id\} index=\{i \+ 1\}/);
    });
  });

  describe('NewsScreen.tsx (docs/design-spec.md §2.2)', () => {
    const source = readSrc('screens/NewsScreen.tsx');

    it('imports EntranceFadeItem and useEntrancePlayedOnce', () => {
      expect(source).toMatch(/import EntranceFadeItem from '\.\.\/components\/EntranceFadeItem'/);
      expect(source).toMatch(/import \{ useEntrancePlayedOnce \} from '\.\.\/hooks\/useEntrancePlayedOnce'/);
    });

    it('gates entrance on metadata readiness, independent of per-card image resolution (US-33 og:image must not block it)', () => {
      expect(source).toMatch(/useEntrancePlayedOnce\(!loadingFirst && items\.length > 0\)/);
    });

    it('wraps each NewsCard in EntranceFadeItem keyed by its FlatList index when entrance should play', () => {
      expect(source).toMatch(/shouldPlayEntrance \? \(\s*<EntranceFadeItem index=\{index\}>/);
    });
  });

  describe('StatsScreen.tsx timeline (docs/design-spec.md §2.3, T26)', () => {
    const source = readSrc('screens/StatsScreen.tsx');

    it('imports EntranceFadeItem and useEntrancePlayedOnce', () => {
      expect(source).toMatch(/import EntranceFadeItem from '\.\.\/components\/EntranceFadeItem'/);
      expect(source).toMatch(/import \{ useEntrancePlayedOnce \} from '\.\.\/hooks\/useEntrancePlayedOnce'/);
    });

    it('gates the timeline entries on shouldPlayEntrance', () => {
      expect(source).toMatch(/shouldPlayEntrance \?\s*\(\s*<EntranceFadeItem index=\{index\}>/);
    });
  });

  describe('HomeScreen 4th point — Map3D grid + Legend + HeaderProgress (docs/design-spec.md §2.4, คำตัดสิน PM ข้อ 25)', () => {
    it('Map3D.tsx fades in the WHOLE grid container once via useMountFadeIn — never per-tile', () => {
      const source = readSrc('components/Map3D.tsx');
      expect(source).toMatch(/import \{ useMountFadeIn \} from '\.\.\/hooks\/useMountFadeIn'/);
      expect(source).toMatch(/const fadeInStyle = useMountFadeIn\(GRID_FADE_IN_DURATION_MS\)/);
      expect(source).toMatch(/<Animated\.View style=\{\[styles\.wrapper, fadeInStyle\]\}>/);
      // Regression guard (PM decision #25): no per-tile animated wrapper —
      // ProvinceTile3D must be mapped directly, not through EntranceFadeItem
      // or a per-item useMountFadeIn/useSharedValue call.
      expect(source).not.toMatch(/EntranceFadeItem/);
      const provinceTileMapBlock = source.slice(
        source.indexOf('PROVINCES.map((province)'),
        source.indexOf('PROVINCES.map((province)') + 400
      );
      expect(provinceTileMapBlock).not.toMatch(/useSharedValue|useAnimatedStyle|useMountFadeIn/);
    });

    it('Legend.tsx fades in independently via useMountFadeIn', () => {
      const source = readSrc('components/Legend.tsx');
      expect(source).toMatch(/import \{ useMountFadeIn \} from '\.\.\/hooks\/useMountFadeIn'/);
      expect(source).toMatch(/const fadeInStyle = useMountFadeIn\(LEGEND_FADE_IN_DURATION_MS\)/);
    });

    it('HeaderProgress.tsx fades in independently via useMountFadeIn', () => {
      const source = readSrc('components/HeaderProgress.tsx');
      expect(source).toMatch(/import \{ useMountFadeIn \} from '\.\.\/hooks\/useMountFadeIn'/);
      expect(source).toMatch(/const fadeInStyle = useMountFadeIn\(HEADER_FADE_IN_DURATION_MS\)/);
    });
  });

  describe('useMountFadeIn.ts (docs/design-spec.md §2.4)', () => {
    const source = readSrc('hooks/useMountFadeIn.ts');

    it('starts fully transparent unless Reduce Motion is on (which starts fully opaque, no fade)', () => {
      expect(source).toMatch(/useSharedValue\(reduceMotion \? 1 : 0\)/);
    });

    it('only re-runs the fade when reduceMotion or duration changes, not on every re-render', () => {
      expect(source).toMatch(/\[reduceMotion, durationMs\]/);
    });
  });
});
