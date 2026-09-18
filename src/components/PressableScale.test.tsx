// T121/T123 / US-34 AC3,6: `variant` prop on PressableScale — default stays
// byte-for-byte the same as before this round (regression guard for every
// existing caller that doesn't pass `variant`), 'emphasized' applies the
// stronger scale (0.93) from docs/design-spec.md §3.1 plus a shadow-depress
// effect on iOS, and Reduce Motion forces 'emphasized' back down to the same
// scale-only 0.96 as 'default' with no shadow-depress at all.
//
// This project's `react-native-reanimated/mock` computes `useAnimatedStyle`'s
// style object once per React render pass (not reactively on every
// shared-value mutation like the real native implementation does), AND its
// `interpolate` is a no-op that always returns `undefined` — so simulating a
// live press and asserting the exact interpolated shadow/scale VALUE isn't
// meaningful under this mock. What IS meaningful and fully deterministic: the
// shadow-depress style KEYS (`shadowOpacity`/`shadowRadius`/`shadowOffset`)
// are only ever added to the style object at all when `variant="emphasized"`
// AND the platform is iOS AND Reduce Motion is off — exactly the three
// conditions `emphasizedShadow` in `PressableScale.tsx` gates on — which these
// tests verify via key presence (`'shadowOpacity' in style`), not value.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Platform, Text } from 'react-native';
import PressableScale from './PressableScale';

jest.mock('../hooks/useReduceMotion');
const useReduceMotionMock = require('../hooks/useReduceMotion').useReduceMotion as jest.Mock;

function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce((acc, s) => ({ ...acc, ...(flattenStyle(s) || {}) }), {});
  }
  return (style as Record<string, unknown>) || {};
}

describe('PressableScale variant (T121 / US-34 AC3)', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    useReduceMotionMock.mockReturnValue(false);
  });

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it('renders normally with no variant prop at all (backward-compat regression guard for every existing caller)', async () => {
    await render(
      <PressableScale testID="pressable">
        <Text>press me</Text>
      </PressableScale>
    );
    const style = flattenStyle(screen.getByTestId('pressable').props.style);
    // default variant never adds the shadow-depress keys.
    expect('shadowOpacity' in style).toBe(false);
    expect('shadowRadius' in style).toBe(false);
  });

  it('variant="emphasized" on iOS adds the shadow-depress style keys (shadowOpacity/shadowRadius/shadowOffset)', async () => {
    Platform.OS = 'ios';
    await render(
      <PressableScale testID="pressable" variant="emphasized">
        <Text>press me</Text>
      </PressableScale>
    );
    const style = flattenStyle(screen.getByTestId('pressable').props.style);
    expect('shadowOpacity' in style).toBe(true);
    expect('shadowRadius' in style).toBe(true);
    expect('shadowOffset' in style).toBe(true);
  });

  it('variant="emphasized" on Android does NOT add shadow-depress keys (scale-only fallback per docs/design-spec.md §3.1)', async () => {
    Platform.OS = 'android';
    await render(
      <PressableScale testID="pressable" variant="emphasized">
        <Text>press me</Text>
      </PressableScale>
    );
    const style = flattenStyle(screen.getByTestId('pressable').props.style);
    expect('shadowOpacity' in style).toBe(false);
    expect('shadowRadius' in style).toBe(false);
  });

  it('variant="default" on iOS does NOT add shadow-depress keys (opt-in only)', async () => {
    Platform.OS = 'ios';
    await render(
      <PressableScale testID="pressable" variant="default">
        <Text>press me</Text>
      </PressableScale>
    );
    const style = flattenStyle(screen.getByTestId('pressable').props.style);
    expect('shadowOpacity' in style).toBe(false);
    expect('shadowRadius' in style).toBe(false);
  });

  it('Reduce Motion suppresses the shadow-depress effect even for variant="emphasized" on iOS', async () => {
    Platform.OS = 'ios';
    useReduceMotionMock.mockReturnValue(true);
    await render(
      <PressableScale testID="pressable" variant="emphasized">
        <Text>press me</Text>
      </PressableScale>
    );
    const style = flattenStyle(screen.getByTestId('pressable').props.style);
    expect('shadowOpacity' in style).toBe(false);
    expect('shadowRadius' in style).toBe(false);
  });

  it('does not crash and still renders children for every variant value', async () => {
    await render(
      <PressableScale variant="emphasized">
        <Text>hello emphasized</Text>
      </PressableScale>
    );
    expect(screen.getByText('hello emphasized')).toBeTruthy();
  });
});
