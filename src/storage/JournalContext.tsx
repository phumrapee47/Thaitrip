import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { JournalEntry, NewJournalEntry } from '../types/entry';
import * as db from './db';
import { isVisited as isVisitedFn } from '../utils/derived';

interface JournalContextValue {
  entries: JournalEntry[];
  loading: boolean;
  isVisited: (provinceId: string) => boolean;
  addEntry: (entry: NewJournalEntry) => Promise<{ entry: JournalEntry; wasFirstEntryForProvince: boolean }>;
  editEntry: (id: string, entry: NewJournalEntry) => Promise<void>;
  removeEntry: (id: string) => Promise<{ provinceLocked: boolean; provinceId: string }>;
  refresh: () => Promise<void>;
  /** provinceId that just became unlocked (for the Home map unlock animation), or null. */
  justUnlockedProvinceId: string | null;
  clearJustUnlocked: () => void;
}

const JournalContext = createContext<JournalContextValue | undefined>(undefined);

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [justUnlockedProvinceId, setJustUnlockedProvinceId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const all = await db.getAllEntries();
    setEntries(all);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const isVisited = useCallback((provinceId: string) => isVisitedFn(provinceId, entries), [entries]);

  const addEntry = useCallback(
    async (entry: NewJournalEntry) => {
      const wasFirstEntryForProvince = !isVisitedFn(entry.provinceId, entries);
      const created = await db.createEntry(entry);
      await refresh();
      if (wasFirstEntryForProvince) {
        setJustUnlockedProvinceId(entry.provinceId);
      }
      return { entry: created, wasFirstEntryForProvince };
    },
    [entries, refresh]
  );

  const editEntry = useCallback(
    async (id: string, entry: NewJournalEntry) => {
      await db.updateEntry(id, entry);
      await refresh();
    },
    [refresh]
  );

  const removeEntry = useCallback(
    async (id: string) => {
      const target = entries.find((e) => e.id === id);
      const provinceId = target?.provinceId ?? '';
      await db.deleteEntry(id);
      await refresh();
      const remaining = entries.filter((e) => e.id !== id && e.provinceId === provinceId);
      return { provinceLocked: remaining.length === 0, provinceId };
    },
    [entries, refresh]
  );

  const clearJustUnlocked = useCallback(() => setJustUnlockedProvinceId(null), []);

  const value = useMemo<JournalContextValue>(
    () => ({
      entries,
      loading,
      isVisited,
      addEntry,
      editEntry,
      removeEntry,
      refresh,
      justUnlockedProvinceId,
      clearJustUnlocked,
    }),
    [entries, loading, isVisited, addEntry, editEntry, removeEntry, refresh, justUnlockedProvinceId, clearJustUnlocked]
  );

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useJournal(): JournalContextValue {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error('useJournal must be used within a JournalProvider');
  return ctx;
}
