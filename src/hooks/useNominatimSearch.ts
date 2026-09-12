// T70/T72/T73/T74 / US-19, US-20: encapsulates the Search Place Field's state
// machine (idle/typing/loading/results/empty/error) + debounce, so
// AddEntryScreen (T70) stays a thin consumer. All Nominatim failures are
// caught here and turned into the 'error' status — nothing thrown by this
// hook ever propagates up into AddEntryScreen's render/save path (T74
// isolate failure boundary).
import { useCallback, useEffect, useRef, useState } from 'react';
import { searchPlaces, DEBOUNCE_MS, MIN_QUERY_LENGTH, type NominatimResult } from '../lib/nominatimClient';

export type SearchStatus = 'idle' | 'typing' | 'loading' | 'results' | 'empty' | 'error';

const MAX_RESULTS_SHOWN = 5; // design-spec: "แสดงผลลัพธ์สูงสุด 5 แถวแรก...ตัดที่ 5 ฝั่ง UI"

export interface UseNominatimSearchDeps {
  /** Injectable for tests — defaults to the real client (T68). */
  searchImpl?: typeof searchPlaces;
}

export interface UseNominatimSearchResult {
  query: string;
  status: SearchStatus;
  results: NominatimResult[];
  onChangeQuery: (text: string) => void;
  /** design-spec "ลองอีกครั้ง" link: re-runs the last query without retyping. */
  retry: () => void;
  /** Clears query/results and returns to idle (called after a selection collapses the field). */
  reset: () => void;
}

export function useNominatimSearch(deps: UseNominatimSearchDeps = {}): UseNominatimSearchResult {
  const searchImpl = deps.searchImpl ?? searchPlaces;
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards against a slow, now-stale request overwriting a newer one's state.
  const requestIdRef = useRef(0);

  const runSearch = useCallback(
    async (trimmedQuery: string) => {
      const requestId = ++requestIdRef.current;
      setStatus('loading');
      try {
        const found = await searchImpl(trimmedQuery);
        if (requestIdRef.current !== requestId) return; // a newer search superseded this one
        setResults(found.slice(0, MAX_RESULTS_SHOWN));
        setStatus(found.length > 0 ? 'results' : 'empty');
      } catch {
        if (requestIdRef.current !== requestId) return;
        setResults([]);
        setStatus('error'); // T74: swallowed here, AddEntryScreen never sees this rejection.
      }
    },
    [searchImpl]
  );

  const onChangeQuery = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      const trimmed = text.trim();
      if (trimmed.length < MIN_QUERY_LENGTH) {
        requestIdRef.current += 1; // invalidate any in-flight search
        setStatus('idle');
        setResults([]);
        return;
      }

      setStatus('typing');
      debounceTimer.current = setTimeout(() => runSearch(trimmed), DEBOUNCE_MS);
    },
    [runSearch]
  );

  const retry = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    runSearch(trimmed);
  }, [query, runSearch]);

  const reset = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    requestIdRef.current += 1;
    setQuery('');
    setStatus('idle');
    setResults([]);
  }, []);

  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    },
    []
  );

  return { query, status, results, onChangeQuery, retry, reset };
}
