// QA round 3 (US-20 AC2) — end-to-end debounce (hook, T72) + throttle
// (client, T68) working TOGETHER, using the REAL `useNominatimSearch` + REAL
// `searchPlaces` chain (not the mocked `searchImpl` the programmer's own
// useNominatimSearch.test.ts uses, and not the standalone client-only
// throttle test in nominatimClient.test.ts, which only calls `searchPlaces`
// directly with `Promise.all`, never through the hook/UI trigger path).
// Only `global.fetch` is stubbed so no real network call happens. This
// closes the layer-boundary gap: proving the client's throttle still serializes
// requests spaced >= THROTTLE_MS apart even when they are triggered via a UI
// action (`retry()`, the "ลองอีกครั้ง" link) that deliberately bypasses the
// hook's own debounce entirely — i.e. a user double-tapping retry can't
// hammer Nominatim any faster than a user retyping can.
import { act, renderHook } from '@testing-library/react-native';
import { useNominatimSearch } from '../../hooks/useNominatimSearch';
import { DEBOUNCE_MS, THROTTLE_MS, _resetThrottleForTests } from '../../lib/nominatimClient';

async function advance(ms: number): Promise<void> {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

describe('debounce (hook) + throttle (client) composed end-to-end, real searchPlaces chain (US-20 AC2)', () => {
  const originalFetch = global.fetch;
  let fetchCallTimes: number[];

  beforeEach(() => {
    jest.useFakeTimers({ now: 0 });
    _resetThrottleForTests();
    fetchCallTimes = [];
    global.fetch = jest.fn((..._args: Parameters<typeof fetch>) => {
      fetchCallTimes.push(Date.now());
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      } as unknown as Response);
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('double-tapping "retry" right after the initial debounced search (bypassing debounce entirely) still keeps every real fetch spaced >= THROTTLE_MS apart, in order', async () => {
    const { result } = await renderHook(() => useNominatimSearch());

    await act(async () => {
      result.current.onChangeQuery('bangkok temple');
    });
    await advance(DEBOUNCE_MS); // debounce fires -> fetch #1

    // Two rapid retry taps, back-to-back, with NO time advance between them —
    // retry() bypasses the debounce timer entirely (design-spec: re-runs the
    // last query without retyping), so only the client-level throttle guards
    // these two calls.
    await act(async () => {
      result.current.retry();
    });
    await act(async () => {
      result.current.retry();
    });

    // Let both throttled/serialized requests actually resolve.
    await advance(THROTTLE_MS);
    await advance(THROTTLE_MS);

    expect(fetchCallTimes.length).toBe(3); // initial + 2 retries, none dropped
    const gap1 = fetchCallTimes[1] - fetchCallTimes[0];
    const gap2 = fetchCallTimes[2] - fetchCallTimes[1];
    expect(gap1).toBeGreaterThanOrEqual(THROTTLE_MS);
    expect(gap2).toBeGreaterThanOrEqual(THROTTLE_MS);
  });

  it('never calls fetch at all while still within the debounce window, regardless of how many keystrokes land', async () => {
    const { result } = await renderHook(() => useNominatimSearch());
    for (const partial of ['p', 'ph', 'phu', 'phuk', 'phuket']) {
      await act(async () => {
        result.current.onChangeQuery(partial);
      });
      await advance(100); // keeps retyping well inside the debounce window
    }
    expect(fetchCallTimes.length).toBe(0); // nothing committed yet — still debouncing
    await advance(DEBOUNCE_MS);
    expect(fetchCallTimes.length).toBe(1); // only the FINAL query is ever searched
  });
});
