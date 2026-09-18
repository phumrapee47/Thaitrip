/**
 * T114 / US-33 (docs/requirements.md, รอบ 14) — คำตัดสิน PM ข้อ 24: fetch each
 * news article's `og:image` (its page's Open Graph meta tag) lazily, as a
 * fallback image source for articles the RSS feed itself carries no image for
 * (T113 verified `tatnews.org` articles genuinely have no `<enclosure>`/
 * `<media:content>`/`<img>` in the feed at all — see docs/dev-notes.md
 * "รอบ 14" for the full verification numbers/response times).
 *
 * Deliberately regex/string-based (same rationale as `newsRssParser.ts` / PM
 * decision ข้อ 21 — no DOMParser in React Native), with a short timeout and a
 * per-link AsyncStorage cache so re-rendering the same article never re-fetches
 * it. Every failure mode (network error, timeout, HTTP error, no og:image tag
 * found) resolves to `undefined` rather than throwing — a failed/slow fetch
 * for one article must never affect any other article or block the news list
 * itself (US-33 AC4).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const OG_IMAGE_FETCH_TIMEOUT_MS = 7000;
const USER_AGENT = 'TravelJournalThaiApp/1.0 (https://github.com/travel-journal-thai; dev@example.com)';

// Images attached to already-published articles never change — a much longer
// TTL than the 45-minute news list cache (T100) is safe and avoids re-fetching
// the same article's HTML on every app open.
export const OG_IMAGE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_KEY_PREFIX = 'og_image_cache_v1:';

interface OgImageCacheEntry {
  /** The resolved image URL, or `null` when we previously confirmed there is none (still worth caching, to avoid re-fetching a known-imageless article repeatedly). */
  imageUrl: string | null;
  fetchedAt: string;
}

function cacheKeyFor(link: string): string {
  return `${CACHE_KEY_PREFIX}${link}`;
}

async function readCache(link: string): Promise<OgImageCacheEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKeyFor(link));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OgImageCacheEntry;
    if (!parsed || typeof parsed.fetchedAt !== 'string') return null;
    if (Date.now() - new Date(parsed.fetchedAt).getTime() > OG_IMAGE_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeCache(link: string, imageUrl: string | null): Promise<void> {
  try {
    const entry: OgImageCacheEntry = { imageUrl, fetchedAt: new Date().toISOString() };
    await AsyncStorage.setItem(cacheKeyFor(link), JSON.stringify(entry));
  } catch {
    // Non-fatal — a failed cache write must not block returning the result
    // that was already successfully fetched for THIS render.
  }
}

/** Extracts the first `<meta property="og:image" content="...">` (or the less common `name="og:image"` variant some sites use) from an HTML string. Attribute order (`property`/`content` vs `content`/`property`) is not assumed. */
export function extractOgImage(html: string): string | undefined {
  if (!html || typeof html !== 'string') return undefined;

  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of metaTags) {
    const isOgImage = /(?:property|name)\s*=\s*["']og:image["']/i.test(tag);
    if (!isOgImage) continue;
    const contentMatch = tag.match(/content\s*=\s*["']([^"']+)["']/i);
    if (contentMatch && contentMatch[1].trim()) return contentMatch[1].trim();
  }
  return undefined;
}

/** Fetches `link`'s HTML and extracts its `og:image`, with a short timeout — never throws (network/timeout/HTTP/parse failures all resolve to `undefined`), per US-33 AC3/AC4. */
async function fetchOgImageUncached(link: string): Promise<string | undefined> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OG_IMAGE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(link, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) return undefined;
    const html = await res.text();
    return extractOgImage(html);
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * T114: the lazy, cached entry point `NewsCard` calls on mount. Returns
 * `undefined` when there is no image to show (article has none, or the fetch
 * failed/timed out) — callers fall back to the existing US-32 placeholder.
 */
export async function fetchOgImageForArticle(link: string): Promise<string | undefined> {
  const trimmed = link?.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return undefined;

  const cached = await readCache(trimmed);
  if (cached) return cached.imageUrl ?? undefined;

  const imageUrl = await fetchOgImageUncached(trimmed);
  await writeCache(trimmed, imageUrl ?? null);
  return imageUrl;
}
