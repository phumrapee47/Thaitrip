import type { SyncMetaLike, SyncStatus } from '../types/sync';

// PM decision ประเด็น 9 (docs/tasks.md): 3rd state "retry-issue" after this many
// consecutive sync failures for the same record. Not a full activity log — just
// a threshold + counter, per the PM's "เล็กน้อย" effort framing.
export const RETRY_ISSUE_THRESHOLD = 3;

/**
 * T39 (note)/T51: derive a record's sync status live from its metadata.
 * Never cached — always recomputed from updatedAt/syncedAt/retryCount so the
 * badge can't drift out of sync with reality.
 */
export function getSyncStatus(meta: SyncMetaLike): SyncStatus {
  const retryCount = meta.retryCount ?? 0;
  if (retryCount >= RETRY_ISSUE_THRESHOLD) return 'retry-issue';
  if (!meta.syncedAt) return 'pending';
  if (!meta.updatedAt) return 'synced';
  return meta.updatedAt > meta.syncedAt ? 'pending' : 'synced';
}

export interface LwwRecord {
  updatedAt: string;
}

export interface LwwResult<T> {
  winner: T;
  source: 'local' | 'remote';
}

/**
 * T40 / PM decision ประเด็น 7: whole-record last-write-wins by comparing `updatedAt`.
 * No remote row (never synced before) => local always wins. Equal timestamps => local
 * wins (arbitrary but deterministic tie-break; avoids needless overwrite round-trips).
 * Field-level merge is explicitly out of scope for this round.
 */
export function pickWinner<T extends LwwRecord>(local: T, remote: T | null): LwwResult<T> {
  if (!remote) return { winner: local, source: 'local' };
  if (remote.updatedAt > local.updatedAt) return { winner: remote, source: 'remote' };
  return { winner: local, source: 'local' };
}
