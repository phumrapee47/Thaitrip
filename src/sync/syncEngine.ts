import * as db from '../storage/db';
import { getSupabaseClient } from '../lib/supabaseClient';
import { pickWinner } from '../utils/syncStatus';
import type { JournalEntry } from '../types/entry';
import type { LandmarkCheckin } from '../types/landmark';

export interface SyncResult {
  attempted: number;
  synced: number;
  failed: number;
}

const EMPTY_RESULT: SyncResult = { attempted: 0, synced: 0, failed: 0 };

/**
 * T57: dev-only debug log so a developer can observe last-write-wins behavior
 * during a real conflict (never shown to end users, never runs in production —
 * `__DEV__` is stripped/false in release builds).
 */
function logLwwDebug(
  table: 'entries' | 'landmark_checkins',
  id: string,
  localUpdatedAt: string,
  remoteUpdatedAt: string,
  source: 'local' | 'remote'
): void {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log(
    `[sync/LWW] ${table} id=${id} local.updatedAt=${localUpdatedAt} remote.updatedAt=${remoteUpdatedAt} -> winner=${source}`
  );
}

type RemoteEntryRow = {
  id: string;
  provinceId: string;
  date: string;
  title: string;
  notes: string;
  photoUris: string[];
  tags: string[];
  updatedAt: string;
};

function entryToRemoteRow(entry: JournalEntry): RemoteEntryRow {
  return {
    id: entry.cloudId ?? entry.id,
    provinceId: entry.provinceId,
    date: entry.date,
    title: entry.title,
    notes: entry.notes,
    photoUris: entry.photoUris,
    tags: entry.tags,
    updatedAt: entry.updatedAt ?? new Date(0).toISOString(),
  };
}

/**
 * T39/T40: push every pending journal entry (never synced, or edited locally
 * since its last successful sync) to Supabase, resolving any conflict against
 * the remote row with whole-record last-write-wins on `updatedAt` (T40 / PM
 * decision ประเด็น 7 — no field-level merge).
 *
 * Never throws: T33 requires the app to degrade gracefully (stay "pending"/
 * increment retry count) when Supabase is unconfigured or a request fails,
 * rather than crashing.
 */
export async function syncPendingEntries(): Promise<SyncResult> {
  const client = getSupabaseClient();
  if (!client) return EMPTY_RESULT;

  const pending = await db.getPendingSyncEntries();
  const result: SyncResult = { attempted: pending.length, synced: 0, failed: 0 };

  for (const entry of pending) {
    try {
      const lookupId = entry.cloudId ?? entry.id;
      const { data: remoteData } = await client.from('entries').select('*').eq('id', lookupId).maybeSingle();
      const remote: RemoteEntryRow | null = remoteData ?? null;

      const localRow = entryToRemoteRow(entry);
      const { winner, source } = pickWinner(localRow, remote);
      if (remote) logLwwDebug('entries', entry.id, localRow.updatedAt, remote.updatedAt, source);

      if (source === 'remote' && remote) {
        // Local was the LWW loser: overwrite it with the winning remote data.
        await db.applyRemoteEntry(
          entry.id,
          {
            date: remote.date,
            title: remote.title,
            notes: remote.notes,
            photoUris: remote.photoUris,
            tags: remote.tags,
            updatedAt: remote.updatedAt,
          },
          new Date().toISOString(),
          remote.id
        );
      } else {
        const { data: upserted, error } = await client
          .from('entries')
          .upsert(winner, { onConflict: 'id' })
          .select()
          .maybeSingle();
        if (error) throw error;
        await db.markEntrySynced(entry.id, new Date().toISOString(), upserted?.id ?? winner.id);
      }
      result.synced += 1;
    } catch {
      await db.incrementEntryRetryCount(entry.id);
      result.failed += 1;
    }
  }

  await syncPendingDeletions(client);
  return result;
}

async function syncPendingDeletions(client: NonNullable<ReturnType<typeof getSupabaseClient>>): Promise<void> {
  const deletions = await db.getPendingDeletions();
  for (const deletion of deletions) {
    try {
      const { error } = await client.from(deletion.tableName).delete().eq('id', deletion.cloudId);
      if (error) throw error;
      await db.clearPendingDeletion(deletion.id);
    } catch {
      await db.incrementDeletionRetry(deletion.id);
    }
  }
}

type RemoteCheckinRow = {
  id: string;
  provinceId: string;
  visited: boolean;
  updatedAt: string;
};

function checkinToRemoteRow(checkin: LandmarkCheckin): RemoteCheckinRow {
  return {
    id: checkin.cloudId ?? checkin.landmarkId,
    provinceId: checkin.provinceId,
    visited: checkin.visited,
    updatedAt: checkin.updatedAt,
  };
}

/** T39/T40 for landmark check-ins — same pending-detection + LWW strategy as entries. */
export async function syncPendingCheckins(): Promise<SyncResult> {
  const client = getSupabaseClient();
  if (!client) return EMPTY_RESULT;

  const pending = await db.getPendingSyncCheckins();
  const result: SyncResult = { attempted: pending.length, synced: 0, failed: 0 };

  for (const checkin of pending) {
    try {
      const lookupId = checkin.cloudId ?? checkin.landmarkId;
      const { data: remoteData } = await client.from('landmark_checkins').select('*').eq('id', lookupId).maybeSingle();
      const remote: RemoteCheckinRow | null = remoteData ?? null;

      const localRow = checkinToRemoteRow(checkin);
      const { winner, source } = pickWinner(localRow, remote);
      if (remote) logLwwDebug('landmark_checkins', checkin.landmarkId, localRow.updatedAt, remote.updatedAt, source);

      if (source === 'remote' && remote) {
        await db.applyRemoteCheckin(
          checkin.landmarkId,
          { visited: remote.visited, updatedAt: remote.updatedAt },
          new Date().toISOString(),
          remote.id
        );
      } else {
        const { data: upserted, error } = await client
          .from('landmark_checkins')
          .upsert(winner, { onConflict: 'id' })
          .select()
          .maybeSingle();
        if (error) throw error;
        await db.markCheckinSynced(checkin.landmarkId, new Date().toISOString(), upserted?.id ?? winner.id);
      }
      result.synced += 1;
    } catch {
      await db.incrementCheckinRetryCount(checkin.landmarkId);
      result.failed += 1;
    }
  }

  return result;
}

export interface SyncCycleResult {
  entries: SyncResult;
  checkins: SyncResult;
}

/** T39: one full opportunistic sync pass, safe to call repeatedly/on an interval
 * (idempotent per-record thanks to pending detection). Never blocks the UI thread
 * beyond normal async/await (no synchronous long-running work). */
export async function runSyncCycle(): Promise<SyncCycleResult> {
  const [entries, checkins] = await Promise.all([syncPendingEntries(), syncPendingCheckins()]);
  return { entries, checkins };
}
