// T42 / US-15 — v1 -> cloud migration idempotency tests.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrateLegacyEntries, hasMigrationRun } from './migration';

jest.mock('../storage/db');
const dbMock = require('../storage/db');

describe('migrateLegacyEntries (T42 / US-15)', () => {
  beforeEach(async () => {
    dbMock.__seed([]);
    await AsyncStorage.clear();
  });

  it('marks every pre-existing v1 entry (no updatedAt) as pending sync', async () => {
    dbMock.__seed([
      { id: 'legacy-1', provinceId: 'phuket', date: '2025-01-01', title: 'Old trip 1', notes: '', photoUris: [], tags: [] },
      { id: 'legacy-2', provinceId: 'krabi', date: '2025-02-01', title: 'Old trip 2', notes: '', photoUris: [], tags: [] },
    ]);

    const result = await migrateLegacyEntries();

    expect(result.migratedCount).toBe(2);
    const store = dbMock.__getStore();
    expect(store.every((e: any) => Boolean(e.updatedAt))).toBe(true);
    // Still pending (not synced yet) — just entered the queue, per US-15 AC1.
    expect(store.every((e: any) => !e.syncedAt)).toBe(true);
  });

  it('does not touch entries that already have sync metadata (post-feature entries)', async () => {
    dbMock.__seed([
      {
        id: 'new-1',
        provinceId: 'phuket',
        date: '2026-01-01',
        title: 'New trip',
        notes: '',
        photoUris: [],
        tags: [],
        updatedAt: '2026-01-01T00:00:00.000Z',
        syncedAt: '2026-01-02T00:00:00.000Z',
        cloudId: 'cloud-1',
        retryCount: 0,
      },
    ]);

    const result = await migrateLegacyEntries();

    expect(result.migratedCount).toBe(0);
    expect(dbMock.__getStore()[0].syncedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('is idempotent: running twice never duplicates entries or re-marks already-migrated rows', async () => {
    dbMock.__seed([
      { id: 'legacy-1', provinceId: 'phuket', date: '2025-01-01', title: 'Old trip', notes: '', photoUris: [], tags: [] },
    ]);

    const first = await migrateLegacyEntries();
    expect(first.migratedCount).toBe(1);
    expect(dbMock.__getStore()).toHaveLength(1);

    const second = await migrateLegacyEntries();
    expect(second.migratedCount).toBe(0);
    expect(dbMock.__getStore()).toHaveLength(1); // no duplicates created

    expect(await hasMigrationRun()).toBe(true);
  });

  it('leaves partially-migrated data safe to resume: a fresh legacy row added later still gets migrated', async () => {
    dbMock.__seed([
      { id: 'legacy-1', provinceId: 'phuket', date: '2025-01-01', title: 'Old trip', notes: '', photoUris: [], tags: [] },
    ]);
    await migrateLegacyEntries();

    // Simulate a second legacy row surfacing later (e.g. restored from an older backup).
    const current = dbMock.__getStore();
    dbMock.__seed([
      ...current,
      { id: 'legacy-2', provinceId: 'krabi', date: '2025-03-01', title: 'Another old trip', notes: '', photoUris: [], tags: [] },
    ]);

    const result = await migrateLegacyEntries();
    expect(result.migratedCount).toBe(1); // only the new legacy row, not re-processing legacy-1
    expect(dbMock.__getStore().every((e: any) => Boolean(e.updatedAt))).toBe(true);
  });
});
