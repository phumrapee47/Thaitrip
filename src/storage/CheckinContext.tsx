import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as db from './db';
import type { LandmarkCheckin } from '../types/landmark';

interface CheckinContextValue {
  /** landmarkId -> visited, for O(1) lookups (T36/T43/T44). */
  checkins: Record<string, boolean>;
  /** Raw records (with sync metadata) — used for the Settings pending-sync count (T51). */
  records: LandmarkCheckin[];
  loading: boolean;
  isCheckedIn: (landmarkId: string) => boolean;
  toggleCheckin: (landmarkId: string, provinceId: string) => Promise<void>;
  /** T48: AddEntry auto check-in sets visited=true directly (idempotent if already visited). */
  setCheckedIn: (landmarkId: string, provinceId: string, visited: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

const CheckinContext = createContext<CheckinContextValue | undefined>(undefined);

export function CheckinProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<LandmarkCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const all = await db.getAllCheckins();
    setRecords(all);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const checkins = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const r of records) map[r.landmarkId] = r.visited;
    return map;
  }, [records]);

  const isCheckedIn = useCallback((landmarkId: string) => Boolean(checkins[landmarkId]), [checkins]);

  const setCheckedIn = useCallback(
    async (landmarkId: string, provinceId: string, visited: boolean) => {
      await db.setLandmarkVisited(landmarkId, provinceId, visited);
      await refresh();
    },
    [refresh]
  );

  const toggleCheckin = useCallback(
    async (landmarkId: string, provinceId: string) => {
      const current = checkins[landmarkId] ?? false;
      await setCheckedIn(landmarkId, provinceId, !current);
    },
    [checkins, setCheckedIn]
  );

  const value = useMemo<CheckinContextValue>(
    () => ({ checkins, records, loading, isCheckedIn, toggleCheckin, setCheckedIn, refresh }),
    [checkins, records, loading, isCheckedIn, toggleCheckin, setCheckedIn, refresh]
  );

  return <CheckinContext.Provider value={value}>{children}</CheckinContext.Provider>;
}

export function useCheckins(): CheckinContextValue {
  const ctx = useContext(CheckinContext);
  if (!ctx) throw new Error('useCheckins must be used within a CheckinProvider');
  return ctx;
}
