// T119-T123 / US-34 "หลักการร่วม: Reduce Motion" (docs/design-spec.md): central
// hook every animation added in รอบ 14 must consult. Verifies the actual
// implementation (not a mock of it, unlike PressableScale.test.tsx /
// AppNavigator.test.tsx which mock this hook away) — default-false on first
// render, flips to the real OS value once the async check resolves, and
// stays in sync with a live `reduceMotionChanged` event without needing a
// remount.
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { useReduceMotion } from './useReduceMotion';

describe('useReduceMotion', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('defaults to false on first render, before the async OS check resolves', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(new Promise(() => {}));
    const { result } = await renderHook(() => useReduceMotion());
    expect(result.current).toBe(false);
  });

  it('flips to true once isReduceMotionEnabled() resolves true', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const { result } = await renderHook(() => useReduceMotion());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('stays false if isReduceMotionEnabled() resolves false', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const { result } = await renderHook(() => useReduceMotion());
    await waitFor(() => expect(result.current).toBe(false));
    expect(result.current).toBe(false);
  });

  it('updates mid-session when the OS fires reduceMotionChanged, without remounting', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    let changeHandler: ((enabled: boolean) => void) | undefined;
    jest
      .spyOn(AccessibilityInfo, 'addEventListener')
      .mockImplementation(((event: string, handler: (enabled: boolean) => void) => {
        if (event === 'reduceMotionChanged') changeHandler = handler;
        return { remove: jest.fn() };
      }) as unknown as typeof AccessibilityInfo.addEventListener);

    const { result } = await renderHook(() => useReduceMotion());
    await waitFor(() => expect(result.current).toBe(false));

    await act(async () => {
      changeHandler?.(true);
    });
    expect(result.current).toBe(true);

    await act(async () => {
      changeHandler?.(false);
    });
    expect(result.current).toBe(false);
  });

  it('never throws even if isReduceMotionEnabled rejects', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockRejectedValue(new Error('not implemented'));
    const { result } = await renderHook(() => useReduceMotion());
    // Give the rejected promise's .catch a tick to run.
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('removes the event subscription on unmount', async () => {
    const remove = jest.fn();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove } as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>);

    const { unmount } = await renderHook(() => useReduceMotion());
    await act(async () => {
      unmount();
    });
    expect(remove).toHaveBeenCalled();
  });
});
