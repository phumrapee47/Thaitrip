// US-1 (map overview), US-2 (navigate to detail), US-3 (unlock animation) integration tests.
//
// Caveat (documented in test-report.md): react-native-reanimated's jest mock treats
// `createAnimatedComponent` as an identity function and `useAnimatedProps` as a
// plain synchronous callback invocation (not a native-prop merge), so animated
// visual props (fill color interpolation, translateY lift) set via
// `animatedProps={...}` cannot be asserted on the rendered SVG node in this
// environment. We instead assert on the deterministic, non-animated signal that
// really drives the same state: the `isVisited`-derived accessibilityLabel, and the
// `onUnlockAnimationDone` callback contract (which IS driven by the mocked
// withSpring completion callback, called synchronously by the mock).
//
// Test isolation note: each test does exactly one render + one interaction. Doing
// two `fireEvent.press` calls against the same rendered tree in one test was found
// to corrupt the next test's render (container becomes null) — a quirk of this
// RN 0.86 / reanimated 4 / testing-library 14 combination unrelated to app logic,
// so we render fresh per interaction to keep tests independent.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import Map3D from '../../components/Map3D';
import { PROVINCES } from '../../data/thailand-provinces';

type MapProps = React.ComponentProps<typeof Map3D>;

function renderMap(overrides: Partial<MapProps> = {}) {
  const onPressProvince = jest.fn();
  const onUnlockAnimationDone = jest.fn();
  const props: MapProps = {
    loading: false,
    isVisited: () => false,
    justUnlockedProvinceId: null,
    onUnlockAnimationDone,
    onPressProvince,
    ...overrides,
  };
  return { onPressProvince, onUnlockAnimationDone, props };
}

describe('Map3D (US-1 AC1/AC2/AC3, US-2 AC1/AC2, US-3 AC1/AC2/AC3)', () => {
  it('renders all 76 provinces from the dataset, one tile each (US-1 AC1)', async () => {
    const { props } = renderMap();
    await render(<Map3D {...props} />);
    for (const p of PROVINCES) {
      expect(screen.getByLabelText(new RegExp(p.nameTh))).toBeTruthy();
    }
  });

  it('marks a province with no entries as locked ("ยังไม่ได้ไป") (US-1 AC2)', async () => {
    const { props } = renderMap({ isVisited: () => false });
    await render(<Map3D {...props} />);
    const amnat = PROVINCES.find((p) => p.id === 'amnat-charoen')!;
    expect(screen.getByLabelText(new RegExp(`${amnat.nameTh}, ยังไม่ได้ไป`))).toBeTruthy();
  });

  it('marks a province with an entry as unlocked ("ไปแล้ว") (US-1 AC3)', async () => {
    const { props } = renderMap({ isVisited: (id: string) => id === 'phuket' });
    await render(<Map3D {...props} />);
    const phuket = PROVINCES.find((p) => p.id === 'phuket')!;
    const amnat = PROVINCES.find((p) => p.id === 'amnat-charoen')!;
    expect(screen.getByLabelText(new RegExp(`${phuket.nameTh}, ไปแล้ว`))).toBeTruthy();
    expect(screen.getByLabelText(new RegExp(`${amnat.nameTh}, ยังไม่ได้ไป`))).toBeTruthy();
  });

  it('tapping a locked tile reports the exact province.id tapped (US-2 AC1)', async () => {
    const { props, onPressProvince } = renderMap();
    await render(<Map3D {...props} />);
    const amnat = PROVINCES.find((p) => p.id === 'amnat-charoen')!;
    fireEvent.press(screen.getByLabelText(new RegExp(amnat.nameTh)));
    expect(onPressProvince).toHaveBeenCalledWith('amnat-charoen');
  });

  it('tapping an unlocked tile reports the exact province.id tapped (US-2 AC1)', async () => {
    const { props, onPressProvince } = renderMap({ isVisited: (id: string) => id === 'phuket' });
    await render(<Map3D {...props} />);
    const phuket = PROVINCES.find((p) => p.id === 'phuket')!;
    fireEvent.press(screen.getByLabelText(new RegExp(phuket.nameTh)));
    expect(onPressProvince).toHaveBeenCalledWith('phuket');
  });

  it('renders a distinct, individually-tappable tile for a small-area province (Samut Songkhram) (US-2 AC2)', async () => {
    const { props, onPressProvince } = renderMap();
    await render(<Map3D {...props} />);
    const samutSongkhram = PROVINCES.find((p) => p.id === 'samut-songkhram')!;
    fireEvent.press(screen.getByLabelText(new RegExp(samutSongkhram.nameTh)));
    expect(onPressProvince).toHaveBeenCalledWith('samut-songkhram');
    expect(onPressProvince).toHaveBeenCalledTimes(1);
  });

  it('calls onUnlockAnimationDone for the tile that just unlocked (US-3 AC1)', async () => {
    const { props, onUnlockAnimationDone } = renderMap({
      isVisited: (id: string) => id === 'phuket',
      justUnlockedProvinceId: 'phuket',
    });
    await render(<Map3D {...props} />);
    await waitFor(() => expect(onUnlockAnimationDone).toHaveBeenCalledWith('phuket'));
  });

  it('does not fire the unlock-animation-done callback for a province that was already unlocked before (no replay) (US-3 AC2)', async () => {
    const { props, onUnlockAnimationDone } = renderMap({
      isVisited: (id: string) => id === 'phuket' || id === 'chiang-mai',
      justUnlockedProvinceId: 'phuket', // only phuket just changed state
    });
    await render(<Map3D {...props} />);
    await waitFor(() => expect(onUnlockAnimationDone).toHaveBeenCalledWith('phuket'));
    expect(onUnlockAnimationDone).not.toHaveBeenCalledWith('chiang-mai');
  });

  it('keeps the map container tilted between 30-40deg at all times, not only during animation (US-3 AC3)', async () => {
    const { props } = renderMap();
    const view = await render(<Map3D {...props} />);
    const tree = view.toJSON();

    function findRotateX(node: any): number | null {
      if (!node) return null;
      const style = Array.isArray(node.props?.style) ? node.props.style : [node.props?.style];
      for (const s of style) {
        const transform = s?.transform;
        if (Array.isArray(transform)) {
          for (const t of transform) {
            if (t && typeof t.rotateX === 'string') {
              return parseFloat(t.rotateX);
            }
          }
        }
      }
      if (Array.isArray(node.children)) {
        for (const child of node.children) {
          const found = findRotateX(child);
          if (found !== null) return found;
        }
      }
      return null;
    }

    const rotateXDeg = findRotateX(tree);
    expect(rotateXDeg).not.toBeNull();
    expect(rotateXDeg as number).toBeGreaterThanOrEqual(30);
    expect(rotateXDeg as number).toBeLessThanOrEqual(40);
  });

  // NOT RUNNABLE IN THIS ENVIRONMENT: react-native-svg implements onPress/onLongPress
  // via its own native touch-responder wiring rather than passing them through as
  // plain, directly-invokable props (confirmed: the queried element's `.props.onLongPress`
  // is `undefined` even though the JSX sets it, and `fireEvent(el, 'longPress')` is a
  // silent no-op as a result — before/after DOM snapshots are identical). Simulating a
  // true long-press gesture would require driving react-native-svg's native responder
  // state machine, which needs a real device/simulator. See coverage-gaps in
  // docs/test-report.md. Code review confirms the wiring exists (Map3D.tsx /
  // ProvinceTile3D.tsx: onLongPress + delayLongPress={350} on the same <G> as onPress,
  // tooltip rendered conditionally on tooltipProvinceId state) but it is unverified by
  // an automated test here.
  it.skip('long-pressing a tile shows a nameTh tooltip and does NOT navigate (T32 behavior backing US-2) — requires real device/simulator', async () => {
    const { props, onPressProvince } = renderMap();
    await render(<Map3D {...props} />);
    const phuket = PROVINCES.find((p) => p.id === 'phuket')!;
    fireEvent(screen.getByLabelText(new RegExp(phuket.nameTh)), 'longPress');
    expect(screen.getByText(phuket.nameTh)).toBeTruthy();
    expect(onPressProvince).not.toHaveBeenCalled();
  });
});
