import {
  fetchNewsRssXml,
  fetchAndProcessNews,
  readNewsCache,
  writeNewsCache,
  isCacheStale,
  isLikelyReachable,
  NEWS_CACHE_TTL_MS,
  NewsFetchError,
} from './newsService';

const VALID_RSS = `<?xml version="1.0"?><rss version="2.0"><channel><title>Feed</title>
<item><title>A</title><link>https://example.com/a</link><pubDate>Sat, 12 Sep 2026 00:00:00 +0000</pubDate><description>Desc</description></item>
</channel></rss>`;

describe('fetchNewsRssXml (T97 / US-29 AC1, US-32 AC4)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('resolves with the raw XML text on a successful, valid-RSS response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, text: async () => VALID_RSS } as any);
    const xml = await fetchNewsRssXml();
    expect(xml).toBe(VALID_RSS);
  });

  it('throws NewsFetchError on a network error (fetch rejects)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));
    await expect(fetchNewsRssXml()).rejects.toThrow(NewsFetchError);
  });

  it('throws NewsFetchError on a non-2xx HTTP response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, text: async () => '' } as any);
    await expect(fetchNewsRssXml()).rejects.toThrow(/HTTP 503/);
  });

  it('throws NewsFetchError when the response body is not valid RSS/Atom XML', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '<html>not rss</html>' } as any);
    await expect(fetchNewsRssXml()).rejects.toThrow(NewsFetchError);
  });
});

describe('fetchAndProcessNews (T97+T98+T99 orchestration)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('returns processed items with stable ids derived from link', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, text: async () => VALID_RSS } as any);
    const items = await fetchAndProcessNews();
    expect(items).toEqual([
      expect.objectContaining({ id: 'https://example.com/a', title: 'A', link: 'https://example.com/a' }),
    ]);
  });

  it('propagates a real fetch failure to the caller (US-32 AC4)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
    await expect(fetchAndProcessNews()).rejects.toThrow(NewsFetchError);
  });
});

describe('news cache (T100 / US-30)', () => {
  beforeEach(async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    await (AsyncStorage.default ?? AsyncStorage).clear();
  });

  it('readNewsCache returns null when nothing has been cached yet', async () => {
    expect(await readNewsCache()).toBeNull();
  });

  it('writeNewsCache then readNewsCache round-trips items + a fetchedAt timestamp', async () => {
    const items = [{ id: 'https://x/a', title: 'A', link: 'https://x/a', summary: '' }];
    const fetchedAt = await writeNewsCache(items as any);
    const cached = await readNewsCache();
    expect(cached).not.toBeNull();
    expect(cached!.items).toEqual(items);
    expect(cached!.fetchedAt).toBe(fetchedAt);
  });

  it('isCacheStale is false right after writing, true once the TTL has elapsed', () => {
    const now = Date.now();
    expect(isCacheStale(new Date(now).toISOString())).toBe(false);
    expect(isCacheStale(new Date(now - NEWS_CACHE_TTL_MS - 1000).toISOString())).toBe(true);
  });
});

describe('isLikelyReachable (T107 / US-31 AC4 — opportunistic network check)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true when the HEAD request resolves (any response, including non-2xx, still means "online")', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 } as any);
    expect(await isLikelyReachable('https://example.com/article')).toBe(true);
  });

  it('returns false when the request throws (offline/DNS failure/timeout)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));
    expect(await isLikelyReachable('https://example.com/article')).toBe(false);
  });
});
