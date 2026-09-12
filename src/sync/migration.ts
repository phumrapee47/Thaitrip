import AsyncStorage from '@react-native-async-storage/async-storage';
import * as db from '../storage/db';

const MIGRATION_FLAG_KEY = 'travel_journal_v1_migration_done_v1';

export interface MigrationResult {
  migratedCount: number;
}

/**
 * T42 / US-15: mark every pre-existing v1 (local-only, no sync metadata) journal
 * entry as pending-sync so it flows into the normal sync queue (T39) automatically,
 * without the user doing anything.
 *
 * Idempotent / safe to call on every app open (US-15 AC3 "resume ได้ถ้าล้มเหลวบางส่วน"):
 * - It never creates or duplicates rows — it only stamps `updatedAt` onto entries
 *   that don't have one yet, which is exactly what identifies a "legacy" v1 row
 *   (see db.getLegacyEntries). Once stamped, an entry is no longer legacy, so a
 *   second run naturally finds nothing left to migrate (migratedCount = 0) whether
 *   or not the whole batch finished last time — a half-finished run just leaves
 *   the remaining legacy rows to be picked up on the next call.
 * - The AsyncStorage flag is only a fast-path hint for callers, not a correctness
 *   requirement, so a corrupted/missing flag can never cause duplicate data.
 */
export async function migrateLegacyEntries(): Promise<MigrationResult> {
  const legacy = await db.getLegacyEntries();
  for (const entry of legacy) {
    // eslint-disable-next-line no-await-in-loop -- intentionally sequential; each
    // entry is an independent, non-blocking-to-the-UI async write (US-15 AC3).
    await db.markEntryPendingSync(entry.id);
  }
  await AsyncStorage.setItem(MIGRATION_FLAG_KEY, new Date().toISOString());
  return { migratedCount: legacy.length };
}

/** Whether migration has ever completed at least one run on this device (informational only). */
export async function hasMigrationRun(): Promise<boolean> {
  return (await AsyncStorage.getItem(MIGRATION_FLAG_KEY)) !== null;
}
