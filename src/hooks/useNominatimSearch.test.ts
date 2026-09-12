// T70/T72/T73/T74 / US-19, US-20: state-machine + debounce tests for the
// Search Place Field's hook. `searchImpl` is always injected — the real
// Nominatim client (T68) already has its own unit tests.
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useNominatimSearch } from './useNominatimSearch';
import { DEBOUNCE_MS, MIN_QUERY_LENGTH, NominatimSearchError } from '../lib/nominatimClient';

// Every state-changing call (onChangeQuery / advancing the debounce timer /
// retry / reset) is wrapped in its own `await act(async () => ...)` — mixing
// sync and un-awaited async act() calls with fake timers produces "overlapping
// act()" warnings and flaky renderHook state, so this file is disciplined
// about always awaiting.
async function typeQuery(onChangeQuery: (text: string) => void, text: string): Promise<void> {
  await act(async () => {
    onChangeQuery(text);
  });
}

async function advance(ms: number): Promise<void> {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

describe('useNominatimSearch (T70/T72/T73)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it(`stays 'idle' and never calls searchImpl below MIN_QUERY_LENGTH (${MIN_QUERY_LENGTH})`, async () => {
    const searchImpl = jest.fn();
    const { result } = await renderHook(() => useNominatimSearch({ searchImpl }));

    await typeQuery(result.current.onChangeQuery, 'ab');

    expect(result.current.status).toBe('idle');
    await advance(DEBOUNCE_MS + 100);
    expect(searchImpl).not.toHaveBeenCalled();
  });

  it(`goes 'typing' immediately, then debounces ${DEBOUNCE_MS}ms before calling searchImpl (US-20 AC2)`, async () => {
    const searchImpl = jest.fn(() => Promise.resolve([]));
    const { result } = await renderHook(() => useNominatimSearch({ searchImpl }));

    await typeQuery(result.current.onChangeQuery, 'bangkok');
    expect(result.current.status).toBe('typing');
    expect(searchImpl).not.toHaveBeenCalled();

    await advance(DEBOUNCE_MS - 1);
    expect(searchImpl).not.toHaveBeenCalled();

    await advance(1);
    expect(searchImpl).toHaveBeenCalledWith('bangkok');
  });

  it('re-typing resets the debounce timer (only the final query is searched)', async () => {
    const searchImpl = jest.fn(() => Promise.resolve([]));
    const { result } = await renderHook(() => useNominatimSearch({ searchImpl }));

    await typeQuery(result.current.onChangeQuery, 'bang');
    await advance(DEBOUNCE_MS - 100);
    await typeQuery(result.current.onChangeQuery, 'bangkok');
    await advance(DEBOUNCE_MS - 100);
    expect(searchImpl).not.toHaveBeenCalled();

    await advance(200);
    expect(searchImpl).toHaveBeenCalledTimes(1);
    expect(searchImpl).toHaveBeenCalledWith('bangkok');
  });

  it('transitions loading -> results with up to 5 results (dropdown cap)', async () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ displayName: `Place ${i}`, shortLabel: `Place ${i}`, lat: i, lng: i }));
    const searchImpl = jest.fn(() => Promise.resolve(many));
    const { result } = await renderHook(() => useNominatimSearch({ searchImpl }));

    await typeQuery(result.current.onChangeQuery, 'wat pho');
    await advance(DEBOUNCE_MS);

    await waitFor(() => expect(result.current.status).toBe('results'));
    expect(result.current.results).toHaveLength(5);
  });

  it('transitions loading -> empty when no results are found', async () => {
    const searchImpl = jest.fn(() => Promise.resolve([]));
    const { result } = await renderHook(() => useNominatimSearch({ searchImpl }));

    await typeQuery(result.current.onChangeQuery, 'xyzxyzxyz');
    await advance(DEBOUNCE_MS);

    await waitFor(() => expect(result.current.status).toBe('empty'));
  });

  it('transitions loading -> error when the client throws, without leaking the rejection (T74)', async () => {
    const searchImpl = jest.fn(() => Promise.reject(new NominatimSearchError('offline')));
    const { result } = await renderHook(() => useNominatimSearch({ searchImpl }));

    await typeQuery(result.current.onChangeQuery, 'bangkok');
    await advance(DEBOUNCE_MS);

    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('retry() re-runs the last query without requiring the user to retype it', async () => {
    const searchImpl = jest
      .fn()
      .mockRejectedValueOnce(new NominatimSearchError('offline'))
      .mockResolvedValueOnce([{ displayName: 'Found', shortLabel: 'Found', lat: 1, lng: 1 }]);
    const { result } = await renderHook(() => useNominatimSearch({ searchImpl }));

    await typeQuery(result.current.onChangeQuery, 'bangkok');
    await advance(DEBOUNCE_MS);
    await waitFor(() => expect(result.current.status).toBe('error'));

    await act(async () => {
      result.current.retry();
    });
    await waitFor(() => expect(result.current.status).toBe('results'));
    expect(searchImpl).toHaveBeenCalledTimes(2);
    expect(searchImpl).toHaveBeenNthCalledWith(2, 'bangkok');
  });

  it('reset() clears the query/results and returns to idle', async () => {
    const searchImpl = jest.fn(() => Promise.resolve([{ displayName: 'Found', shortLabel: 'Found', lat: 1, lng: 1 }]));
    const { result } = await renderHook(() => useNominatimSearch({ searchImpl }));

    await typeQuery(result.current.onChangeQuery, 'bangkok');
    await advance(DEBOUNCE_MS);
    await waitFor(() => expect(result.current.status).toBe('results'));

    await act(async () => {
      result.current.reset();
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
  });

  it("a stale in-flight search never overwrites a newer one's result (race guard)", async () => {
    let resolveFirst: (v: unknown) => void = () => {};
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const searchImpl = jest
      .fn()
      .mockImplementationOnce(() => firstPromise)
      .mockImplementationOnce(() => Promise.resolve([{ displayName: 'Second', shortLabel: 'Second', lat: 2, lng: 2 }]));

    const { result } = await renderHook(() => useNominatimSearch({ searchImpl }));

    await typeQuery(result.current.onChangeQuery, 'first query');
    await advance(DEBOUNCE_MS);

    await typeQuery(result.current.onChangeQuery, 'second query');
    await advance(DEBOUNCE_MS);
    await waitFor(() => expect(result.current.status).toBe('results'));
    expect(result.current.results[0].shortLabel).toBe('Second');

    // The slow first request finally resolves — must NOT clobber the second's results.
    await act(async () => {
      resolveFirst([{ displayName: 'First (stale)', shortLabel: 'First (stale)', lat: 1, lng: 1 }]);
    });
    expect(result.current.results[0].shortLabel).toBe('Second');
  });
});
