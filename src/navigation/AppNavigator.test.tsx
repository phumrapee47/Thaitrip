// T119/T123 / US-34 AC1,6: verifies the screen-transition config values from
// docs/design-spec.md §1 are actually present in `AppNavigator.tsx`'s source
// — the transition itself is native-stack's own OS-level animation, which
// RNTL cannot meaningfully assert on visually, so (matching the existing
// source-level guard pattern already used in this codebase for a similar
// "prove a specific config constant is wired in" case — see
// `src/__tests__/qa-round8/newsToastDuration.test.tsx`) this reads the
// component source directly and checks for the exact `animation`/
// `animationDuration`/`presentation` values docs/design-spec.md §1.1-1.3
// specifies, plus the Reduce Motion fallback wiring.
import fs from 'fs';
import path from 'path';

describe('AppNavigator screen transition config (T119 / US-34 AC1)', () => {
  const source = fs.readFileSync(path.resolve(__dirname, './AppNavigator.tsx'), 'utf-8');

  it('ProvinceDetail push uses slide_from_right, 280ms (docs/design-spec.md §1.1)', () => {
    expect(source).toMatch(/animation:\s*'slide_from_right'\s*as const,\s*animationDuration:\s*280/);
  });

  it('AddEntry push uses slide_from_bottom, 300ms, presentation: modal (docs/design-spec.md §1.2)', () => {
    expect(source).toMatch(
      /animation:\s*'slide_from_bottom'\s*as const,\s*animationDuration:\s*300,\s*presentation:\s*'modal'\s*as const/
    );
  });

  it('the tab cross-fade uses withTiming(1, { duration: 180 }) per docs/design-spec.md §1.3', () => {
    expect(source).toMatch(/withTiming\(1,\s*\{\s*duration:\s*180\s*\}\)/);
  });

  it('Reduce Motion fallback replaces every transition above with a 120ms fade (docs/design-spec.md "หลักการร่วม: Reduce Motion")', () => {
    expect(source).toMatch(/animation:\s*'fade'\s*as const,\s*animationDuration:\s*120/);
    expect(source).toMatch(/reduceMotion \? REDUCE_MOTION_TRANSITION/);
    expect(source).toMatch(/withTiming\(1,\s*\{\s*duration:\s*120\s*\}\)/);
  });

  it('both ProvinceDetail and AddEntry screens actually consume the reduceMotion-aware options (not hardcoded to the non-reduced values)', () => {
    expect(source).toMatch(/options=\{reduceMotion \? REDUCE_MOTION_TRANSITION : PROVINCE_DETAIL_TRANSITION\}/);
    expect(source).toMatch(/reduceMotion\s*\n?\s*\?\s*\{\s*\.\.\.REDUCE_MOTION_TRANSITION,\s*presentation:\s*'modal'\s*\}\s*\n?\s*:\s*ADD_ENTRY_TRANSITION/);
  });

  it('MapStackNavigator and the tab cross-fade wrapper both call the shared useReduceMotion hook', () => {
    const occurrences = source.match(/useReduceMotion\(\)/g) || [];
    expect(occurrences.length).toBeGreaterThanOrEqual(2);
  });
});
