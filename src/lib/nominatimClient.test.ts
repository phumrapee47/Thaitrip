// T68 / US-19 AC2, US-20 AC1/AC2 — Nominatim client unit tests. `fetchImpl` is
// always injected so these never touch the real network (same pattern as
// PhotoUploadDeps.fetchBlob in src/sync/photoUpload.ts).
import { searchPlaces, NominatimSearchError, THROTTLE_MS, MIN_QUERY_LENGTH, _resetThrottleForTests } from './nominatimClient';

function fakeResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: () => Promise.resolve(body) } as unknown as Response;
}

describe('searchPlaces (T68)', () => {
  beforeEach(() => {
    _resetThrottleForTests();
  });

  it(`returns [] without calling fetch for a query shorter than MIN_QUERY_LENGTH (${MIN_QUERY_LENGTH})`, async () => {
    const fetchImpl = jest.fn();
    const result = await searchPlaces('ab', { fetchImpl });
    expect(result).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('sends a custom User-Agent header (OSM Usage Policy, US-20 AC1) and the countrycodes=th/q query params', async () => {
    const fetchImpl: typeof fetch = jest.fn((..._args: Parameters<typeof fetch>) => Promise.resolve(fakeResponse([])));
    await searchPlaces('bangkok temple', { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, options] = (fetchImpl as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect(String(url)).toContain('https://nominatim.openstreetmap.org/search');
    expect(String(url)).toContain('countrycodes=th');
    expect(String(url)).toContain(encodeURIComponent('bangkok temple'));
    const headers = options.headers as Record<string, string>;
    expect(headers['User-Agent']).toBeTruthy();
    expect(headers['User-Agent']).not.toBe(''); // never the HTTP client's default
  });

  it('maps raw Nominatim rows to { displayName, shortLabel, lat, lng }, short-labeling at the first comma', async () => {
    const fetchImpl = jest.fn(() =>
      Promise.resolve(
        fakeResponse([{ display_name: 'วัดพระธาตุดอยคำ, ตำบลแม่เหียะ, เชียงใหม่, ประเทศไทย', lat: '18.7', lon: '98.9' }])
      )
    );
    const result = await searchPlaces('วัดพระธาตุดอยคำ', { fetchImpl });
    expect(result).toEqual([
      { displayName: 'วัดพระธาตุดอยคำ, ตำบลแม่เหียะ, เชียงใหม่, ประเทศไทย', shortLabel: 'วัดพระธาตุดอยคำ', lat: 18.7, lng: 98.9 },
    ]);
  });

  it('drops malformed rows (missing/invalid lat, lon, or display_name) instead of throwing', async () => {
    const fetchImpl = jest.fn(() =>
      Promise.resolve(
        fakeResponse([
          { display_name: 'ok', lat: '1', lon: '2' },
          { display_name: 'no coords' },
          { lat: '1', lon: '2' }, // no display_name
          { display_name: 'bad coords', lat: 'not-a-number', lon: '2' },
        ])
      )
    );
    const result = await searchPlaces('query', { fetchImpl });
    expect(result).toEqual([{ displayName: 'ok', shortLabel: 'ok', lat: 1, lng: 2 }]);
  });

  it('throws NominatimSearchError on a non-ok HTTP response', async () => {
    const fetchImpl = jest.fn(() => Promise.resolve(fakeResponse([], false, 503)));
    await expect(searchPlaces('query', { fetchImpl })).rejects.toBeInstanceOf(NominatimSearchError);
  });

  it('throws NominatimSearchError when fetch itself rejects (offline)', async () => {
    const fetchImpl = jest.fn(() => Promise.reject(new Error('Network request failed')));
    await expect(searchPlaces('query', { fetchImpl })).rejects.toBeInstanceOf(NominatimSearchError);
  });

  it('throws NominatimSearchError on a malformed (non-array) response body', async () => {
    const fetchImpl = jest.fn(() => Promise.resolve(fakeResponse({ error: 'not an array' })));
    await expect(searchPlaces('query', { fetchImpl })).rejects.toBeInstanceOf(NominatimSearchError);
  });

  it('throttles concurrent calls to at least THROTTLE_MS apart (T72 client-level guard)', async () => {
    const fetchImpl = jest.fn(() => Promise.resolve(fakeResponse([])));
    const start = Date.now();
    const [gapA, gapB] = await Promise.all([
      searchPlaces('bangkok', { fetchImpl }).then(() => Date.now() - start),
      searchPlaces('phuket', { fetchImpl }).then(() => Date.now() - start),
    ]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(Math.abs(gapB - gapA)).toBeGreaterThanOrEqual(THROTTLE_MS - 50);
  }, 10000);
});
