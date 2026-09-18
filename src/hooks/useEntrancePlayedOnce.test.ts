// T120/T123 / US-34 AC2, updated in bug-fix round 2 (qa-result.md รอบ 9 บั๊ก 1):
// returns `true` starting from the render pass where `hasData` first becomes
// `true`, and STAYS `true` across any subsequent re-render as long as
// `hasData` remains `true` — it must NOT flip back to `false` just because
// another, unrelated re-render happened (that was the AC2 bug: it tore down
// the `EntranceFadeItem` wrapper before the animation could play). It only
// resets once `hasData` itself goes back to `false`, so a later transition
// back to `true` is treated as a fresh entrance "epoch".
import { act, renderHook } from '@testing-library/react-native';
import { useEntrancePlayedOnce } from './useEntrancePlayedOnce';

describe('useEntrancePlayedOnce', () => {
  it('returns false while hasData is false', async () => {
    const { result } = await renderHook(({ hasData }: { hasData: boolean }) => useEntrancePlayedOnce(hasData), {
      initialProps: { hasData: false },
    });
    expect(result.current).toBe(false);
  });

  it('returns true on the exact render pass hasData first becomes true', async () => {
    const { result, rerender } = await renderHook(({ hasData }: { hasData: boolean }) => useEntrancePlayedOnce(hasData), {
      initialProps: { hasData: false },
    });
    expect(result.current).toBe(false);

    await act(async () => {
      rerender({ hasData: true });
    });
    expect(result.current).toBe(true);
  });

  it('keeps returning true on subsequent re-renders while hasData stays true (list grows, checkin toggles, an unrelated parent effect firing right after mount, etc.) — regression guard for US-34 AC2 bug 1', async () => {
    const { result, rerender } = await renderHook(({ hasData }: { hasData: boolean }) => useEntrancePlayedOnce(hasData), {
      initialProps: { hasData: true },
    });
    expect(result.current).toBe(true);

    await act(async () => {
      rerender({ hasData: true });
    });
    expect(result.current).toBe(true);

    await act(async () => {
      rerender({ hasData: true });
    });
    expect(result.current).toBe(true);
  });

  it('"re-arms" (returns true again) if hasData goes back to false and then true again — a genuinely fresh data epoch', async () => {
    const { result, rerender } = await renderHook(({ hasData }: { hasData: boolean }) => useEntrancePlayedOnce(hasData), {
      initialProps: { hasData: true },
    });
    expect(result.current).toBe(true);

    await act(async () => {
      rerender({ hasData: false });
    });
    expect(result.current).toBe(false);

    await act(async () => {
      rerender({ hasData: true });
    });
    expect(result.current).toBe(true);
  });
});
