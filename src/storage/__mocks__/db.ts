// Manual mock for src/storage/db.ts used by integration tests.
// Real db.ts uses expo-sqlite (a native module) which cannot run inside Jest/jsdom
// without a device/emulator. This in-memory fake implements the exact same
// async CRUD contract (including the sync-metadata additions from T34) so
// JournalContext, the sync engine, and screens can all be exercised end-to-end.
import type { JournalEntry, NewJournalEntry } from '../../types/entry';
import type { LandmarkCheckin } from '../../types/landmark';
import type { PendingDeletion } from '../db';

let store: JournalEntry[] = [];
let checkinStore: LandmarkCheckin[] = [];
let deletionStore: PendingDeletion[] = [];
let idCounter = 0;
let deletionIdCounter = 0;

function generateId(): string {
  idCounter += 1;
  return `mock-id-${idCounter}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function createEntry(entry: NewJournalEntry): Promise<JournalEntry> {
  const created: JournalEntry = {
    id: generateId(),
    ...entry,
    updatedAt: entry.updatedAt ?? nowIso(),
    syncedAt: entry.syncedAt ?? null,
    cloudId: entry.cloudId ?? null,
    retryCount: entry.retryCount ?? 0,
    placeLat: entry.placeLat ?? null,
    placeLng: entry.placeLng ?? null,
  };
  store.push(created);
  return created;
}

export async function updateEntry(id: string, entry: NewJournalEntry): Promise<void> {
  store = store.map((e) =>
    e.id === id
      ? { ...e, ...entry, updatedAt: nowIso(), placeLat: entry.placeLat ?? null, placeLng: entry.placeLng ?? null }
      : e
  );
}

export async function deleteEntry(id: string): Promise<void> {
  const existing = store.find((e) => e.id === id);
  if (existing?.cloudId) {
    deletionIdCounter += 1;
    deletionStore.push({
      id: `mock-deletion-${deletionIdCounter}`,
      tableName: 'entries',
      cloudId: existing.cloudId,
      retryCount: 0,
    });
  }
  store = store.filter((e) => e.id !== id);
}

export async function getEntriesByProvince(provinceId: string): Promise<JournalEntry[]> {
  return store.filter((e) => e.provinceId === provinceId);
}

export async function getAllEntries(): Promise<JournalEntry[]> {
  return [...store];
}

export async function getEntryById(id: string): Promise<JournalEntry | null> {
  return store.find((e) => e.id === id) ?? null;
}

export async function getVisitedProvinceIds(): Promise<Set<string>> {
  return new Set(store.map((e) => e.provinceId));
}

export async function _clearAllEntries(): Promise<void> {
  store = [];
}

// --- T39/T40/T41 sync engine support -------------------------------------

export async function getPendingSyncEntries(): Promise<JournalEntry[]> {
  return store.filter((e) => !e.syncedAt || (e.updatedAt ?? '') > (e.syncedAt ?? ''));
}

export async function getEntriesWithLocalPhotos(): Promise<JournalEntry[]> {
  return store.filter((e) => e.photoUris.some((uri) => !/^https?:\/\//i.test(uri)));
}

export async function updatePhotoUris(id: string, photoUris: string[]): Promise<void> {
  store = store.map((e) => (e.id === id ? { ...e, photoUris, updatedAt: nowIso() } : e));
}

export async function markEntrySynced(id: string, syncedAt: string, cloudId: string): Promise<void> {
  store = store.map((e) => (e.id === id ? { ...e, syncedAt, cloudId, retryCount: 0 } : e));
}

export async function incrementEntryRetryCount(id: string): Promise<void> {
  store = store.map((e) => (e.id === id ? { ...e, retryCount: (e.retryCount ?? 0) + 1 } : e));
}

export async function applyRemoteEntry(
  id: string,
  remote: Pick<JournalEntry, 'date' | 'title' | 'notes' | 'photoUris' | 'tags' | 'updatedAt'>,
  syncedAt: string,
  cloudId: string
): Promise<void> {
  store = store.map((e) =>
    e.id === id
      ? {
          ...e,
          date: remote.date,
          title: remote.title,
          notes: remote.notes,
          photoUris: remote.photoUris,
          tags: remote.tags,
          updatedAt: remote.updatedAt ?? syncedAt,
          syncedAt,
          cloudId,
          retryCount: 0,
        }
      : e
  );
}

// --- T42 migration support -------------------------------------------------

export async function getLegacyEntries(): Promise<JournalEntry[]> {
  return store.filter((e) => !e.updatedAt);
}

export async function markEntryPendingSync(id: string): Promise<void> {
  store = store.map((e) => (e.id === id && !e.updatedAt ? { ...e, updatedAt: nowIso() } : e));
}

// --- deletion queue ----------------------------------------------------------

export async function getPendingDeletions(): Promise<PendingDeletion[]> {
  return [...deletionStore];
}

export async function clearPendingDeletion(id: string): Promise<void> {
  deletionStore = deletionStore.filter((d) => d.id !== id);
}

export async function incrementDeletionRetry(id: string): Promise<void> {
  deletionStore = deletionStore.map((d) => (d.id === id ? { ...d, retryCount: d.retryCount + 1 } : d));
}

// --- T34/T36/T43 landmark check-ins ------------------------------------------

export async function getAllCheckins(): Promise<LandmarkCheckin[]> {
  return [...checkinStore];
}

export async function setLandmarkVisited(landmarkId: string, provinceId: string, visited: boolean): Promise<void> {
  const existing = checkinStore.find((c) => c.landmarkId === landmarkId);
  if (existing) {
    checkinStore = checkinStore.map((c) => (c.landmarkId === landmarkId ? { ...c, visited, updatedAt: nowIso() } : c));
  } else {
    checkinStore.push({
      landmarkId,
      provinceId,
      visited,
      updatedAt: nowIso(),
      syncedAt: null,
      cloudId: null,
      retryCount: 0,
    });
  }
}

export async function getPendingSyncCheckins(): Promise<LandmarkCheckin[]> {
  return checkinStore.filter((c) => !c.syncedAt || c.updatedAt > c.syncedAt);
}

export async function markCheckinSynced(landmarkId: string, syncedAt: string, cloudId: string): Promise<void> {
  checkinStore = checkinStore.map((c) => (c.landmarkId === landmarkId ? { ...c, syncedAt, cloudId, retryCount: 0 } : c));
}

export async function incrementCheckinRetryCount(landmarkId: string): Promise<void> {
  checkinStore = checkinStore.map((c) =>
    c.landmarkId === landmarkId ? { ...c, retryCount: c.retryCount + 1 } : c
  );
}

export async function applyRemoteCheckin(
  landmarkId: string,
  remote: Pick<LandmarkCheckin, 'visited' | 'updatedAt'>,
  syncedAt: string,
  cloudId: string
): Promise<void> {
  checkinStore = checkinStore.map((c) =>
    c.landmarkId === landmarkId
      ? { ...c, visited: remote.visited, updatedAt: remote.updatedAt, syncedAt, cloudId, retryCount: 0 }
      : c
  );
}

export async function _clearAllCheckins(): Promise<void> {
  checkinStore = [];
}

// --- Test-only helpers (not part of the real db.ts API) ---------------------

export function __seed(entries: JournalEntry[]): void {
  store = [...entries];
  idCounter = 0;
}

export function __getStore(): JournalEntry[] {
  return [...store];
}

export function __seedCheckins(checkins: LandmarkCheckin[]): void {
  checkinStore = [...checkins];
}

export function __getCheckinStore(): LandmarkCheckin[] {
  return [...checkinStore];
}

export function __seedDeletions(deletions: PendingDeletion[]): void {
  deletionStore = [...deletions];
  deletionIdCounter = 0;
}

export function __getDeletionStore(): PendingDeletion[] {
  return [...deletionStore];
}
