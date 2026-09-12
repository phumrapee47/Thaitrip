// Shared sync-related types (T39/T40/T51 — Landmark & Supabase Integration round).

/** PM decision ประเด็น 9: 3 states instead of the AC's minimum 2. */
export type SyncStatus = 'pending' | 'synced' | 'retry-issue';

/** Minimal shape needed to derive a SyncStatus (see src/utils/syncStatus.ts). */
export interface SyncMetaLike {
  updatedAt?: string | null;
  syncedAt?: string | null;
  retryCount?: number | null;
}
