import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseRssXml, processNewsItems, type ParsedNewsItem } from './newsRssParser';

export interface NewsItem extends ParsedNewsItem {
  /** Stable key for FlatList — link when present (unique post-dedupe), else title. */
  id: string;
}

// T90 / US-29 AC1 (docs/tasks.md ประเด็น 19 — PM-approved fallback order):
// verified live 2026-09-13 via `curl` against the real endpoint — HTTP 200,
// `content-type: application/rss+xml`, well-formed RSS 2.0 XML with real
// <item> entries — so the BA's first-choice source is used as-is; the
// Bangkok Post / The Nation fallbacks were NOT needed. Full verification
// notes + the one caveat found (this feed's items carry no
// <enclosure>/<media:content>/<img>, so every card falls back to the News
// Card Placeholder Cover for now) are logged in docs/dev-notes.md "รอบ 7".
const RSS_FEED_URL = 'https://www.tatnews.org/feed/';
const FETCH_TIMEOUT_MS = 15000;
const USER_AGENT = 'TravelJournalThaiApp/1.0 (https://github.com/travel-journal-thai; dev@example.com)';

export class NewsFetchError extends Error {}

/** T97 / US-29 AC1, US-32 AC4: fetch the raw RSS XML, distinguishing network/timeout/HTTP errors (throws `NewsFetchError`) from a successful-but-empty response (handled by the parser, not here). */
export async function fetchNewsRssXml(): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    let res: Response;
    try {
      res = await fetch(RSS_FEED_URL, {
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
      });
    } catch (err) {
      // Network error, timeout (AbortError), DNS failure, etc.
      throw new NewsFetchError(
        err instanceof Error ? `RSS request failed: ${err.message}` : 'RSS request failed'
      );
    }

    if (!res.ok) {
      throw new NewsFetchError(`RSS request failed with HTTP ${res.status}`);
    }

    const xml = await res.text();
    if (!xml || !/<rss[\s>]|<feed[\s>]/i.test(xml)) {
      throw new NewsFetchError('RSS response was not valid RSS/Atom XML');
    }
    return xml;
  } finally {
    clearTimeout(timer);
  }
}

function toNewsItems(items: ParsedNewsItem[]): NewsItem[] {
  return items.map((item) => ({ ...item, id: item.link || item.title }));
}

/** T97+T98+T99 orchestrated together: fetch -> parse -> sort/dedupe -> stable ids. Throws `NewsFetchError` (or whatever parseRssXml/fetch throws) on real failure — callers (NewsScreen/newsService cache layer) decide what to show. */
export async function fetchAndProcessNews(): Promise<NewsItem[]> {
  const xml = await fetchNewsRssXml();
  const parsed = parseRssXml(xml);
  const processed = processNewsItems(parsed);
  return toNewsItems(processed);
}

// ---------------------------------------------------------------------------
// T100 / US-29 AC3,4, US-30: AsyncStorage cache layer, 45-minute TTL (PM
// decision ข้อ 19 — the midpoint of BA's suggested 30–60 min range).
// ---------------------------------------------------------------------------

const CACHE_KEY = 'news_cache_v1';
export const NEWS_CACHE_TTL_MS = 45 * 60 * 1000;

export interface NewsCachePayload {
  items: NewsItem[];
  /** ISO timestamp of the last successful fetch that populated this cache. */
  fetchedAt: string;
}

/** Returns the cached payload, or null if there is none / it's corrupt (never throws — a broken cache must never block the app, US-30). */
export async function readNewsCache(): Promise<NewsCachePayload | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NewsCachePayload;
    if (!parsed || !Array.isArray(parsed.items) || typeof parsed.fetchedAt !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Persists a freshly-fetched item list + "now" timestamp. Returns the timestamp written. Never throws — a failed cache write must not block showing the freshly fetched items in the current session. */
export async function writeNewsCache(items: NewsItem[]): Promise<string> {
  const fetchedAt = new Date().toISOString();
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ items, fetchedAt } as NewsCachePayload));
  } catch {
    // Non-fatal — see doc comment above.
  }
  return fetchedAt;
}

/** True once `fetchedAt` is older than the 45-minute TTL. */
export function isCacheStale(fetchedAt: string): boolean {
  return Date.now() - new Date(fetchedAt).getTime() > NEWS_CACHE_TTL_MS;
}

// ---------------------------------------------------------------------------
// T107 / US-31 AC4: opportunistic "do we have network right now" check, same
// philosophy as src/sync/SyncContext.tsx and T73 (docs/tasks.md ประเด็น
// reference) — no @react-native-community/netinfo dependency is installed, so
// rather than a separate unrelated ping endpoint, this fires a short, real
// HEAD request at the SAME article URL the user is about to open. A thrown
// error (network unreachable / DNS failure / timeout) means "offline"; any
// actual HTTP response (even a 404/500) still means the device has real
// network connectivity, so we still let the in-app browser open normally in
// that case (a broken article URL is a separate, already-covered case: T106 /
// US-31 AC3 handles empty/malformed links before this check ever runs).
// ---------------------------------------------------------------------------
const REACHABILITY_TIMEOUT_MS = 6000;

export async function isLikelyReachable(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REACHABILITY_TIMEOUT_MS);
  try {
    await fetch(url, { method: 'HEAD', signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
