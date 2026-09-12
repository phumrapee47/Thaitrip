import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { runSyncCycle } from './syncEngine';
import { uploadPendingPhotos } from './photoUpload';
import { useJournal } from '../storage/JournalContext';
import { useCheckins } from '../storage/CheckinContext';

interface SyncContextValue {
  isSyncing: boolean;
  lastSyncAt: string | null;
  /** Manual trigger (e.g. pull-to-refresh in the future); also runs on mount + interval. */
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

// No @react-native-community/netinfo dependency is installed in this project (see
// docs/dev-notes.md), so there is no true "on network reconnect" event to hook into.
// Instead we opportunistically retry on an interval; every call is a no-op when
// Supabase is unconfigured or offline (T33), so this never spams errors.
const SYNC_INTERVAL_MS = 20000;

/**
 * T39: background, non-blocking sync loop. Must be rendered *inside* both
 * JournalProvider and CheckinProvider so it can refresh their cached state
 * after each cycle (so Sync Status Badges flip from pending -> synced live,
 * per US-12 AC without the user needing to pull-to-refresh or reopen a screen).
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const inFlight = useRef(false);
  const { refresh: refreshEntries } = useJournal();
  const { refresh: refreshCheckins } = useCheckins();

  const triggerSync = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsSyncing(true);
    try {
      await runSyncCycle();
      await uploadPendingPhotos();
      setLastSyncAt(new Date().toISOString());
    } catch {
      // T33: a sync failure must never crash the app — per-record retry state is
      // already tracked inside syncEngine/photoUpload.
    } finally {
      await Promise.all([refreshEntries(), refreshCheckins()]);
      inFlight.current = false;
      setIsSyncing(false);
    }
  }, [refreshEntries, refreshCheckins]);

  useEffect(() => {
    triggerSync();
    const interval = setInterval(triggerSync, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SyncContext.Provider value={{ isSyncing, lastSyncAt, triggerSync }}>{children}</SyncContext.Provider>
  );
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within a SyncProvider');
  return ctx;
}
