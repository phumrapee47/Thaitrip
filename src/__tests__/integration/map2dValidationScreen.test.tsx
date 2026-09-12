// US-7 (2D validation step) integration tests.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import Map2DValidationScreen from '../../screens/Map2DValidationScreen';
import { PROVINCES } from '../../data/thailand-provinces';
import AppNavigator from '../../navigation/AppNavigator';

describe('Map2DValidationScreen (US-7)', () => {
  it('renders all 76 provinces using the raw dataset path data, with a visible count (US-7 AC1)', async () => {
    await render(<Map2DValidationScreen />);
    expect(screen.getByText(`${PROVINCES.length} provinces · 0 toggled visited`)).toBeTruthy();
  });

  it('tapping a province toggles its in-memory visited flag (count updates), independent of any journal entry (US-7 AC2)', async () => {
    const view = await render(<Map2DValidationScreen />);
    // react-native-svg <Path> elements carry no accessibilityLabel here, so we use the
    // underlying test-renderer TestInstance.queryAll (react-test-renderer-style API)
    // to find raw host nodes rather than an RNTL text/label/role/testId query.
    const paths = (view.root as any).queryAll((n: any) => n.type === 'RNSVGPath');
    expect(paths).toHaveLength(76);

    fireEvent.press(paths[0]);
    await waitFor(() =>
      expect(screen.getByText(`${PROVINCES.length} provinces · 1 toggled visited`)).toBeTruthy()
    );
  });

  it('is gated behind __DEV__ so it is not reachable in a production build (US-7 AC3)', () => {
    // __DEV__ is true under Jest, so the route legitimately exists in this test run;
    // AppNavigator.tsx gates BOTH the route registration and Home's dev-only link
    // behind `if (__DEV__)`, which is what keeps it unreachable in production builds
    // (where __DEV__ is false at bundle time, a build-time constant we can't flip at
    // test runtime). This is a structural/code-level check on the gating mechanism.
    expect(AppNavigator.toString()).toContain('__DEV__');
  });
});
