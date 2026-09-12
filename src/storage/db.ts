import * as SQLite from 'expo-sqlite';
import type { JournalEntry, NewJournalEntry } from '../types/entry';
import type { LandmarkCheckin } from '../types/landmark';

const DB_NAME = 'travel_journal.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Adds a column to an existing table if it doesn't already exist (non-destructive
 * upgrade path for v1 installs, T34). SQLite has no `ADD COLUMN IF NOT EXISTS`, so
 * we just attempt it and swallow the "duplicate column" error. */
async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string
): Promise<void> {
  try {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  } catch {
    // Column already exists — nothing to do.
  }
}

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS entries (
          id TEXT PRIMARY KEY NOT NULL,
          provinceId TEXT NOT NULL,
          date TEXT NOT NULL,
          title TEXT NOT NULL,
          notes TEXT NOT NULL DEFAULT '',
          photoUris TEXT NOT NULL DEFAULT '[]',
          tags TEXT NOT NULL DEFAULT '[]',
          updatedAt TEXT NOT NULL DEFAULT '',
          syncedAt TEXT,
          cloudId TEXT,
          retryCount INTEGER NOT NULL DEFAULT 0,
          placeLat REAL,
          placeLng REAL
        );
        CREATE INDEX IF NOT EXISTS idx_entries_provinceId ON entries(provinceId);

        CREATE TABLE IF NOT EXISTS landmark_checkins (
          landmarkId TEXT PRIMARY KEY NOT NULL,
          provinceId TEXT NOT NULL,
          visited INTEGER NOT NULL DEFAULT 0,
          updatedAt TEXT NOT NULL,
          syncedAt TEXT,
          cloudId TEXT,
          retryCount INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS sync_deletions (
          id TEXT PRIMARY KEY NOT NULL,
          tableName TEXT NOT NULL,
          cloudId TEXT NOT NULL,
          deletedAt TEXT NOT NULL,
          retryCount INTEGER NOT NULL DEFAULT 0
        );
      `);
      // T34 non-destructive upgrade path: a pre-existing v1 `entries` table (created
      // before this feature round) won't have these columns yet — add them defensively.
      await ensureColumn(db, 'entries', 'updatedAt', "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(db, 'entries', 'syncedAt', 'TEXT');
      await ensureColumn(db, 'entries', 'cloudId', 'TEXT');
      await ensureColumn(db, 'entries', 'retryCount', 'INTEGER NOT NULL DEFAULT 0');
      // T69 / US-19 AC3: Nominatim search-result metadata, added the same
      // non-destructive way as the T34 columns above.
      await ensureColumn(db, 'entries', 'placeLat', 'REAL');
      await ensureColumn(db, 'entries', 'placeLng', 'REAL');
      return db;
    });
  }
  return dbPromise;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

type EntryRow = {
  id: string;
  provinceId: string;
  date: string;
  title: string;
  notes: string;
  photoUris: string;
  tags: string;
  updatedAt: string | null;
  syncedAt: string | null;
  cloudId: string | null;
  retryCount: number | null;
  placeLat: number | null;
  placeLng: number | null;
};

function rowToEntry(row: EntryRow): JournalEntry {
  return {
    id: row.id,
    provinceId: row.provinceId,
    date: row.date,
    title: row.title,
    notes: row.notes,
    photoUris: safeJsonParseArray(row.photoUris),
    tags: safeJsonParseArray(row.tags),
    updatedAt: row.updatedAt || undefined,
    syncedAt: row.syncedAt ?? null,
    cloudId: row.cloudId ?? null,
    retryCount: row.retryCount ?? 0,
    placeLat: row.placeLat ?? null,
    placeLng: row.placeLng ?? null,
  };
}

function safeJsonParseArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Insert a new journal entry, returns the created entry (with generated id). */
export async function createEntry(entry: NewJournalEntry): Promise<JournalEntry> {
  const db = await getDb();
  const id = generateId();
  const updatedAt = entry.updatedAt ?? nowIso();
  await db.runAsync(
    `INSERT INTO entries (id, provinceId, date, title, notes, photoUris, tags, updatedAt, syncedAt, cloudId, retryCount, placeLat, placeLng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    entry.provinceId,
    entry.date,
    entry.title,
    entry.notes ?? '',
    JSON.stringify(entry.photoUris ?? []),
    JSON.stringify(entry.tags ?? []),
    updatedAt,
    entry.syncedAt ?? null,
    entry.cloudId ?? null,
    entry.retryCount ?? 0,
    entry.placeLat ?? null,
    entry.placeLng ?? null
  );
  return {
    id,
    ...entry,
    updatedAt,
    syncedAt: entry.syncedAt ?? null,
    cloudId: entry.cloudId ?? null,
    retryCount: entry.retryCount ?? 0,
    placeLat: entry.placeLat ?? null,
    placeLng: entry.placeLng ?? null,
  };
}

/** Update an existing entry by id (T28). Always bumps updatedAt (T40 last-write-wins
 * relies on this to know the record changed locally since its last sync). */
export async function updateEntry(id: string, entry: NewJournalEntry): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE entries SET provinceId = ?, date = ?, title = ?, notes = ?, photoUris = ?, tags = ?, updatedAt = ?, placeLat = ?, placeLng = ? WHERE id = ?`,
    entry.provinceId,
    entry.date,
    entry.title,
    entry.notes ?? '',
    JSON.stringify(entry.photoUris ?? []),
    JSON.stringify(entry.tags ?? []),
    nowIso(),
    entry.placeLat ?? null,
    entry.placeLng ?? null,
    id
  );
}

/** Delete an entry by id (T29). If it had already been synced at least once, queue a
 * cloud-side deletion (T40/US-12) so the delete propagates on the next sync cycle. */
export async function deleteEntry(id: string): Promise<void> {
  const db = await getDb();
  const existing = await getEntryById(id);
  if (existing?.cloudId) {
    await db.runAsync(
      `INSERT OR REPLACE INTO sync_deletions (id, tableName, cloudId, deletedAt, retryCount) VALUES (?, ?, ?, ?, 0)`,
      generateId(),
      'entries',
      existing.cloudId,
      nowIso()
    );
  }
  await db.runAsync(`DELETE FROM entries WHERE id = ?`, id);
}

/** Get all entries for a single province, unordered (caller sorts as needed). */
export async function getEntriesByProvince(provinceId: string): Promise<JournalEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<EntryRow>(`SELECT * FROM entries WHERE provinceId = ?`, provinceId);
  return rows.map(rowToEntry);
}

/** Get every entry across all provinces (used for stats/timeline). */
export async function getAllEntries(): Promise<JournalEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<EntryRow>(`SELECT * FROM entries`);
  return rows.map(rowToEntry);
}

/** Get a single entry by id (used for edit screen, T28). */
export async function getEntryById(id: string): Promise<JournalEntry | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<EntryRow>(`SELECT * FROM entries WHERE id = ?`, id);
  return row ? rowToEntry(row) : null;
}

/** Distinct set of provinceIds that have at least one entry (used to derive unlocked state). */
export async function getVisitedProvinceIds(): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ provinceId: string }>(
    `SELECT DISTINCT provinceId FROM entries`
  );
  return new Set(rows.map((r) => r.provinceId));
}

/** Test/dev helper: wipe all rows (not exposed in UI). */
export async function _clearAllEntries(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`DELETE FROM entries;`);
}

// ---------------------------------------------------------------------------
// T39/T40/T41 — sync engine support (entries)
// ---------------------------------------------------------------------------

/** Entries never synced, or edited locally since their last successful sync (T39). */
export async function getPendingSyncEntries(): Promise<JournalEntry[]> {
  const all = await getAllEntries();
  return all.filter((e) => !e.syncedAt || (e.updatedAt ?? '') > e.syncedAt);
}

/** Entries that still have at least one non-uploaded (local URI) photo (T41). */
export async function getEntriesWithLocalPhotos(): Promise<JournalEntry[]> {
  const all = await getAllEntries();
  return all.filter((e) => e.photoUris.some((uri) => !/^https?:\/\//i.test(uri)));
}

/** Replace an entry's photoUris (e.g. after uploading to Supabase Storage, T41).
 * Bumps updatedAt like a normal edit so the new cloud URLs get pushed on the next sync. */
export async function updatePhotoUris(id: string, photoUris: string[]): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE entries SET photoUris = ?, updatedAt = ? WHERE id = ?`, JSON.stringify(photoUris), nowIso(), id);
}

/** Mark an entry as successfully synced (T39): winner data already matches local, just
 * stamp syncedAt/cloudId and reset the retry counter. */
export async function markEntrySynced(id: string, syncedAt: string, cloudId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE entries SET syncedAt = ?, cloudId = ?, retryCount = 0 WHERE id = ?`, syncedAt, cloudId, id);
}

/** Increment the consecutive-failure counter for an entry (T39/T51 retry-issue state). */
export async function incrementEntryRetryCount(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE entries SET retryCount = retryCount + 1 WHERE id = ?`, id);
}

/** T40: local was the LWW loser — overwrite it with the winning remote record's data,
 * then stamp it as synced (both sides now agree). */
export async function applyRemoteEntry(
  id: string,
  remote: Pick<JournalEntry, 'date' | 'title' | 'notes' | 'photoUris' | 'tags' | 'updatedAt'>,
  syncedAt: string,
  cloudId: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE entries SET date = ?, title = ?, notes = ?, photoUris = ?, tags = ?, updatedAt = ?, syncedAt = ?, cloudId = ?, retryCount = 0 WHERE id = ?`,
    remote.date,
    remote.title,
    remote.notes,
    JSON.stringify(remote.photoUris ?? []),
    JSON.stringify(remote.tags ?? []),
    remote.updatedAt ?? syncedAt,
    syncedAt,
    cloudId,
    id
  );
}

// ---------------------------------------------------------------------------
// T42 — v1 migration support
// ---------------------------------------------------------------------------

/** Entries with no updatedAt yet — i.e. rows created by the v1 schema before this
 * feature round existed. Used by the migration to find "legacy" local-only data. */
export async function getLegacyEntries(): Promise<JournalEntry[]> {
  const all = await getAllEntries();
  return all.filter((e) => !e.updatedAt);
}

/** Stamp a legacy entry with sync metadata so it enters the normal pending-sync queue
 * (T42/US-15). Deliberately does NOT touch syncedAt/cloudId (stays null => "pending"). */
export async function markEntryPendingSync(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE entries SET updatedAt = ? WHERE id = ? AND (updatedAt IS NULL OR updatedAt = '')`, nowIso(), id);
}

// ---------------------------------------------------------------------------
// Deletion queue (propagating local deletes to Supabase, T40/US-12)
// ---------------------------------------------------------------------------

export interface PendingDeletion {
  id: string;
  tableName: string;
  cloudId: string;
  retryCount: number;
}

export async function getPendingDeletions(): Promise<PendingDeletion[]> {
  const db = await getDb();
  return db.getAllAsync<PendingDeletion>(`SELECT id, tableName, cloudId, retryCount FROM sync_deletions`);
}

export async function clearPendingDeletion(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM sync_deletions WHERE id = ?`, id);
}

export async function incrementDeletionRetry(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE sync_deletions SET retryCount = retryCount + 1 WHERE id = ?`, id);
}

// ---------------------------------------------------------------------------
// T34/T36/T43 — landmark check-ins
// ---------------------------------------------------------------------------

type CheckinRow = {
  landmarkId: string;
  provinceId: string;
  visited: number;
  updatedAt: string;
  syncedAt: string | null;
  cloudId: string | null;
  retryCount: number | null;
};

function rowToCheckin(row: CheckinRow): LandmarkCheckin {
  return {
    landmarkId: row.landmarkId,
    provinceId: row.provinceId,
    visited: Boolean(row.visited),
    updatedAt: row.updatedAt,
    syncedAt: row.syncedAt ?? null,
    cloudId: row.cloudId ?? null,
    retryCount: row.retryCount ?? 0,
  };
}

/** Every landmark check-in record (used to hydrate CheckinContext on app start, T43). */
export async function getAllCheckins(): Promise<LandmarkCheckin[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CheckinRow>(`SELECT * FROM landmark_checkins`);
  return rows.map(rowToCheckin);
}

/** Set (not just toggle) a landmark's visited flag — used both by the manual switch
 * (T43) and by AddEntry's auto check-in on save (T48). Upserts + always bumps
 * updatedAt so it enters the sync queue like any other locally-changed record. */
export async function setLandmarkVisited(landmarkId: string, provinceId: string, visited: boolean): Promise<void> {
  const db = await getDb();
  const existing = await db.getFirstAsync<CheckinRow>(`SELECT * FROM landmark_checkins WHERE landmarkId = ?`, landmarkId);
  if (existing) {
    await db.runAsync(
      `UPDATE landmark_checkins SET visited = ?, updatedAt = ? WHERE landmarkId = ?`,
      visited ? 1 : 0,
      nowIso(),
      landmarkId
    );
  } else {
    await db.runAsync(
      `INSERT INTO landmark_checkins (landmarkId, provinceId, visited, updatedAt, syncedAt, cloudId, retryCount) VALUES (?, ?, ?, ?, NULL, NULL, 0)`,
      landmarkId,
      provinceId,
      visited ? 1 : 0,
      nowIso()
    );
  }
}

/** Landmark check-ins never synced, or edited since their last successful sync (T39). */
export async function getPendingSyncCheckins(): Promise<LandmarkCheckin[]> {
  const all = await getAllCheckins();
  return all.filter((c) => !c.syncedAt || c.updatedAt > c.syncedAt);
}

export async function markCheckinSynced(landmarkId: string, syncedAt: string, cloudId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE landmark_checkins SET syncedAt = ?, cloudId = ?, retryCount = 0 WHERE landmarkId = ?`,
    syncedAt,
    cloudId,
    landmarkId
  );
}

export async function incrementCheckinRetryCount(landmarkId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE landmark_checkins SET retryCount = retryCount + 1 WHERE landmarkId = ?`, landmarkId);
}

export async function applyRemoteCheckin(
  landmarkId: string,
  remote: Pick<LandmarkCheckin, 'visited' | 'updatedAt'>,
  syncedAt: string,
  cloudId: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE landmark_checkins SET visited = ?, updatedAt = ?, syncedAt = ?, cloudId = ?, retryCount = 0 WHERE landmarkId = ?`,
    remote.visited ? 1 : 0,
    remote.updatedAt,
    syncedAt,
    cloudId,
    landmarkId
  );
}

/** Test/dev helper: wipe all check-in rows (not exposed in UI). */
export async function _clearAllCheckins(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`DELETE FROM landmark_checkins;`);
}
