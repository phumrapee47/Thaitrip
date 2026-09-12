// T68 / US-19 AC2, US-20 AC1/AC2: OSM Nominatim client module — the only
// runtime (in-app) network call this feature round adds. Deliberately kept
// separate from any UI: AddEntryScreen (T70) is the only caller and only
// ever sees `searchPlaces()` + `NominatimSearchError`, never fetch/AbortController
// details, so error/timeout handling stays isolated at this layer (US-20 AC1,
// T74 failure-boundary prep).
//
// OSM Nominatim Usage Policy (https://operations.osmfoundation.org/policies/nominatim/)
// requires a custom, identifying User-Agent on every request — never the
// default of whatever HTTP client is used. `USER_AGENT` below is a fixed
// value the dev team owns (not user-configurable, not personal data — see
// requirements.md "สมมติฐานเพิ่มเติม" ข้อ 4 รอบ OSM Data Integration).

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'THAITRIP-app/1.0 (Thai travel journal; contact: phumrapee47@gmail.com)';
const REQUEST_TIMEOUT_MS = 8000;

/** T20/US-20 AC2: client-level throttle floor — never fire two real Nominatim
 * requests less than this far apart, regardless of how fast the caller (the
 * debounced UI, T72) asks. This is a second, independent guarantee: even if a
 * future caller forgets to debounce, this module still can't hammer the API. */
export const THROTTLE_MS = 1000;

/** US-20 AC2 / design-spec: UI (T70/T72) debounces typing by this many ms
 * before calling `searchPlaces`. Exported so the UI and this module never
 * drift out of sync on the "official" debounce value. */
export const DEBOUNCE_MS = 1000;

/** US-20 AC2 / design-spec: UI does not call `searchPlaces` at all below this
 * many characters (kept here, not just in the UI, so any future caller gets
 * the same floor for free — see the early-return in `searchPlaces`). */
export const MIN_QUERY_LENGTH = 3;

export interface NominatimResult {
  /** Full `display_name` from Nominatim — shown as the secondary/context line (T70 Search Result Item). */
  displayName: string;
  /** `display_name` truncated at the first comma — shown as the primary line and used in the confirmation chip. */
  shortLabel: string;
  lat: number;
  lng: number;
}

/** Thrown for any failure mode (offline, HTTP error, timeout, malformed
 * response) — T70/T73 only need to know "it failed", not why (design-spec
 * ข้อเสนอแนะ ประเด็น D: opportunistic offline detection can't reliably tell
 * these apart anyway, so there is deliberately only one error shape). */
export class NominatimSearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NominatimSearchError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Module-level throttle state: a serialized chain so concurrent callers still
// end up spaced >= THROTTLE_MS apart, in call order.
let throttleChain: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

function runThrottled<T>(fn: () => Promise<T>): Promise<T> {
  const gated = throttleChain.then(async () => {
    const wait = Math.max(0, lastRequestAt + THROTTLE_MS - Date.now());
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
    return fn();
  });
  // Never let one caller's rejection break throttling for the next caller.
  throttleChain = gated.catch(() => undefined);
  return gated;
}

function toResult(raw: unknown): NominatimResult | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const displayName = typeof record.display_name === 'string' ? record.display_name : '';
  const lat = Number(record.lat);
  const lng = Number(record.lon);
  if (!displayName || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const shortLabel = displayName.split(',')[0]?.trim() || displayName;
  return { displayName, shortLabel, lat, lng };
}

async function performSearch(query: string, fetchImpl: typeof fetch): Promise<NominatimResult[]> {
  const url = `${NOMINATIM_SEARCH_URL}?format=json&countrycodes=th&q=${encodeURIComponent(query)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new NominatimSearchError(`Nominatim HTTP ${res.status}`);
    const data: unknown = await res.json();
    if (!Array.isArray(data)) throw new NominatimSearchError('Unexpected Nominatim response shape');
    const results: NominatimResult[] = [];
    for (const raw of data) {
      const result = toResult(raw);
      if (result) results.push(result);
    }
    return results;
  } catch (err) {
    if (err instanceof NominatimSearchError) throw err;
    // Covers: offline (fetch rejects), abort/timeout, malformed JSON, etc. —
    // deliberately a single generic error type/message per US-20 AC3 design
    // note (opportunistic detection can't distinguish these reliably).
    throw new NominatimSearchError(err instanceof Error ? err.message : 'Nominatim request failed');
  } finally {
    clearTimeout(timer);
  }
}

export interface SearchPlacesDeps {
  /** Injectable so tests never hit the real network (same pattern as
   * PhotoUploadDeps.fetchBlob in src/sync/photoUpload.ts). */
  fetchImpl?: typeof fetch;
}

/**
 * T68 / US-19 AC2: search Thai places via Nominatim. Returns `[]` for a
 * too-short query (caller doesn't need to special-case this — it's just an
 * empty result, not a "state"). Throttled to at most one real request per
 * `THROTTLE_MS`, queued/serialized so nothing is silently dropped. Throws
 * `NominatimSearchError` for any failure — callers (T70/T73) catch that and
 * render the generic "ค้นหาไม่ได้ในขณะนี้" message.
 */
export async function searchPlaces(query: string, deps: SearchPlacesDeps = {}): Promise<NominatimResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];
  const fetchImpl = deps.fetchImpl ?? fetch;
  return runThrottled(() => performSearch(trimmed, fetchImpl));
}

/** Test-only helper: reset throttle state between test cases. */
export function _resetThrottleForTests(): void {
  throttleChain = Promise.resolve();
  lastRequestAt = 0;
}
