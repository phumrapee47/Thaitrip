import AsyncStorage from '@react-native-async-storage/async-storage';
import { extractOgImage, fetchOgImageForArticle, OG_IMAGE_CACHE_TTL_MS } from './ogImageService';

const ARTICLE_URL = 'https://www.tatnews.org/2026/09/example-article/';

describe('extractOgImage (T114 / US-33 AC1,2)', () => {
  it('extracts the content URL from a standard `property="og:image"` meta tag', () => {
    const html = `<html><head><meta property="og:image" content="https://example.com/cover.jpg" /></head></html>`;
    expect(extractOgImage(html)).toBe('https://example.com/cover.jpg');
  });

  it('also matches the less common `name="og:image"` variant', () => {
    const html = `<html><head><meta name="og:image" content="https://example.com/alt-cover.jpg"></head></html>`;
    expect(extractOgImage(html)).toBe('https://example.com/alt-cover.jpg');
  });

  it('matches regardless of attribute order (`content` before `property`)', () => {
    const html = `<meta content="https://example.com/reordered.jpg" property="og:image" />`;
    expect(extractOgImage(html)).toBe('https://example.com/reordered.jpg');
  });

  it('returns undefined when there is no og:image meta tag at all', () => {
    const html = `<html><head><meta property="og:title" content="Some title" /></head><body>No image here</body></html>`;
    expect(extractOgImage(html)).toBeUndefined();
  });

  it('returns undefined for empty/non-string input', () => {
    expect(extractOgImage('')).toBeUndefined();
    expect(extractOgImage(undefined as unknown as string)).toBeUndefined();
  });

  it('picks the FIRST og:image tag when a page has more than one', () => {
    const html = `
      <meta property="og:image" content="https://example.com/first.jpg" />
      <meta property="og:image" content="https://example.com/second.jpg" />
    `;
    expect(extractOgImage(html)).toBe('https://example.com/first.jpg');
  });
});

describe('fetchOgImageForArticle (T114 / US-33 AC1,3,4)', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await AsyncStorage.clear();
  });

  it('resolves with the og:image URL on a successful fetch', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '<meta property="og:image" content="https://example.com/real-photo.jpg" />',
    } as any);

    const url = await fetchOgImageForArticle(ARTICLE_URL);
    expect(url).toBe('https://example.com/real-photo.jpg');
  });

  it('resolves with undefined (never throws) when the article has no og:image', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => '<html><body>no meta at all</body></html>' } as any);
    await expect(fetchOgImageForArticle(ARTICLE_URL)).resolves.toBeUndefined();
  });

  it('resolves with undefined (never throws) on a network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));
    await expect(fetchOgImageForArticle(ARTICLE_URL)).resolves.toBeUndefined();
  });

  it('resolves with undefined (never throws) on a timeout (AbortError)', async () => {
    global.fetch = jest.fn().mockImplementation(
      () => new Promise((_resolve, reject) => {
        // Simulates the fetch() call rejecting the way a real timed-out
        // AbortController-driven request would, without needing fake timers
        // (jest.setup.js's async-storage mock already runs on real timers).
        reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
      })
    );
    await expect(fetchOgImageForArticle(ARTICLE_URL)).resolves.toBeUndefined();
  });

  it('resolves with undefined (never throws) on a non-2xx HTTP response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, text: async () => '' } as any);
    await expect(fetchOgImageForArticle(ARTICLE_URL)).resolves.toBeUndefined();
  });

  it('resolves with undefined for an empty/invalid link, without calling fetch at all', async () => {
    global.fetch = jest.fn();
    expect(await fetchOgImageForArticle('')).toBeUndefined();
    expect(await fetchOgImageForArticle('not-a-url')).toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('caches a successful result so a second call for the SAME link does not fetch again', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '<meta property="og:image" content="https://example.com/cached.jpg" />',
    } as any);
    global.fetch = fetchMock;

    const first = await fetchOgImageForArticle(ARTICLE_URL);
    const second = await fetchOgImageForArticle(ARTICLE_URL);

    expect(first).toBe('https://example.com/cached.jpg');
    expect(second).toBe('https://example.com/cached.jpg');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('caches a "no image found" result too, so a known-imageless article is not re-fetched every render', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, text: async () => '<html>no og:image</html>' } as any);
    global.fetch = fetchMock;

    const first = await fetchOgImageForArticle(ARTICLE_URL);
    const second = await fetchOgImageForArticle(ARTICLE_URL);

    expect(first).toBeUndefined();
    expect(second).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('a failure for one article link never affects a fetch for a different link (isolated per-item)', async () => {
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() => Promise.reject(new Error('network down')))
      .mockImplementationOnce(() =>
        Promise.resolve({ ok: true, text: async () => '<meta property="og:image" content="https://example.com/other.jpg" />' } as any)
      );

    const failed = await fetchOgImageForArticle('https://www.tatnews.org/article-a/');
    const succeeded = await fetchOgImageForArticle('https://www.tatnews.org/article-b/');

    expect(failed).toBeUndefined();
    expect(succeeded).toBe('https://example.com/other.jpg');
  });

  it('re-fetches once the cached entry is older than the TTL', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, text: async () => '<meta property="og:image" content="https://example.com/old.jpg" />' } as any)
      .mockResolvedValueOnce({ ok: true, text: async () => '<meta property="og:image" content="https://example.com/new.jpg" />' } as any);
    global.fetch = fetchMock;

    const realDateNow = Date.now;
    let now = realDateNow();
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    const first = await fetchOgImageForArticle(ARTICLE_URL);
    now += OG_IMAGE_CACHE_TTL_MS + 1000;
    const second = await fetchOgImageForArticle(ARTICLE_URL);

    expect(first).toBe('https://example.com/old.jpg');
    expect(second).toBe('https://example.com/new.jpg');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    (Date.now as jest.Mock).mockRestore?.();
    Date.now = realDateNow;
  });
});
