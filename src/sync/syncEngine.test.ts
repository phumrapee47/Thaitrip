// T39/T40 — sync engine unit tests against a mocked Supabase client + the
// in-memory db mock (src/storage/__mocks__/db.ts). No real network/Supabase
// project is used, per requirements.md ("การทดสอบรอบนี้ทดสอบผ่าน mocked/local
// Supabase client เท่านั้น").
import { syncPendingEntries, syncPendingCheckins, runSyncCycle } from './syncEngine';

jest.mock('../storage/db');
jest.mock('../lib/supabaseClient');

const dbMock = require('../storage/db');
const clientMock = require('../lib/supabaseClient');

interface SupabaseStubOverrides {
  selectResult?: { data: any; error: any };
  upsertResult?: { data: any; error: any };
  deleteResult?: { error: any };
}

function makeSupabaseStub(overrides: SupabaseStubOverrides = {}) {
  const selectResult = overrides.selectResult ?? { data: null, error: null };
  const upsertResult = overrides.upsertResult ?? { data: { id: 'cloud-1' }, error: null };
  const deleteResult = overrides.deleteResult ?? { error: null };

  const maybeSingle = jest.fn(() => Promise.resolve(selectResult));
  const eq = jest.fn(() => ({ maybeSingle, delete: () => ({ error: null }) }));
  const select = jest.fn(() => ({ eq }));

  const upsertMaybeSingle = jest.fn(() => Promise.resolve(upsertResult));
  const upsertSelect = jest.fn(() => ({ maybeSingle: upsertMaybeSingle }));
  const upsert = jest.fn(() => ({ select: upsertSelect }));

  const deleteEq = jest.fn(() => Promise.resolve(deleteResult));
  const del = jest.fn(() => ({ eq: deleteEq }));

  const from = jest.fn(() => ({ select, upsert, delete: del }));

  return { from, __internals: { select, eq, maybeSingle, upsert, upsertSelect, upsertMaybeSingle, del, deleteEq } };
}

describe('syncPendingEntries (T39/T40)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedDeletions([]);
    clientMock._resetSupabaseClientForTests();
  });

  it('does nothing and never throws when Supabase is unconfigured (T33 graceful degradation)', async () => {
    clientMock.__setConfigured(false);
    dbMock.__seed([
      { id: 'e1', provinceId: 'phuket', date: '2026-01-01', title: 'A', notes: '', photoUris: [], tags: [], updatedAt: '2026-01-01T00:00:00.000Z', syncedAt: null, cloudId: null, retryCount: 0 },
    ]);
    const result = await syncPendingEntries();
    expect(result).toEqual({ attempted: 0, synced: 0, failed: 0 });
    // Entry stays untouched/pending — no crash, no partial mutation.
    expect(dbMock.__getStore()[0].syncedAt).toBeNull();
  });

  it('pushes a never-synced local entry to Supabase and marks it synced (no remote row yet — local wins)', async () => {
    const stub = makeSupabaseStub({ selectResult: { data: null, error: null } });
    clientMock.__setMockClient(stub);
    dbMock.__seed([
      {
        id: 'e1',
        provinceId: 'phuket',
        date: '2026-01-01',
        title: 'Trip',
        notes: '',
        photoUris: [],
        tags: [],
        updatedAt: '2026-01-01T00:00:00.000Z',
        syncedAt: null,
        cloudId: null,
        retryCount: 0,
      },
    ]);

    const result = await syncPendingEntries();

    expect(result).toEqual({ attempted: 1, synced: 1, failed: 0 });
    expect(stub.__internals.upsert).toHaveBeenCalled();
    const updated = dbMock.__getStore()[0];
    expect(updated.syncedAt).not.toBeNull();
    expect(updated.cloudId).toBe('cloud-1');
    expect(updated.retryCount).toBe(0);
  });

  it('increments retryCount and does not mark synced when the upsert fails', async () => {
    const stub = makeSupabaseStub({ upsertResult: { data: null, error: { message: 'network down' } } });
    clientMock.__setMockClient(stub);
    dbMock.__seed([
      {
        id: 'e1',
        provinceId: 'phuket',
        date: '2026-01-01',
        title: 'Trip',
        notes: '',
        photoUris: [],
        tags: [],
        updatedAt: '2026-01-01T00:00:00.000Z',
        syncedAt: null,
        cloudId: null,
        retryCount: 0,
      },
    ]);

    const result = await syncPendingEntries();

    expect(result).toEqual({ attempted: 1, synced: 0, failed: 1 });
    const updated = dbMock.__getStore()[0];
    expect(updated.syncedAt).toBeNull();
    expect(updated.retryCount).toBe(1);
  });

  it('reaches retry-issue territory after repeated failures (T39 note / T51)', async () => {
    const stub = makeSupabaseStub({ upsertResult: { data: null, error: { message: 'down' } } });
    clientMock.__setMockClient(stub);
    dbMock.__seed([
      {
        id: 'e1',
        provinceId: 'phuket',
        date: '2026-01-01',
        title: 'Trip',
        notes: '',
        photoUris: [],
        tags: [],
        updatedAt: '2026-01-01T00:00:00.000Z',
        syncedAt: null,
        cloudId: null,
        retryCount: 0,
      },
    ]);

    await syncPendingEntries();
    await syncPendingEntries();
    await syncPendingEntries();

    expect(dbMock.__getStore()[0].retryCount).toBe(3);
  });

  it('applies the winning remote record locally when remote is newer (T40 last-write-wins, remote wins)', async () => {
    const remoteRow = {
      id: 'e1',
      provinceId: 'phuket',
      date: '2026-05-01',
      title: 'Remote wins',
      notes: 'from another device',
      photoUris: [],
      tags: [],
      updatedAt: '2026-06-01T00:00:00.000Z', // newer than local
    };
    const stub = makeSupabaseStub({ selectResult: { data: remoteRow, error: null } });
    clientMock.__setMockClient(stub);
    dbMock.__seed([
      {
        id: 'e1',
        provinceId: 'phuket',
        date: '2026-01-01',
        title: 'Local (stale)',
        notes: '',
        photoUris: [],
        tags: [],
        updatedAt: '2026-01-01T00:00:00.000Z', // older than remote
        syncedAt: '2025-12-01T00:00:00.000Z',
        cloudId: 'e1',
        retryCount: 0,
      },
    ]);

    const result = await syncPendingEntries();

    expect(result.synced).toBe(1);
    expect(stub.__internals.upsert).not.toHaveBeenCalled(); // local lost, never pushed
    const updated = dbMock.__getStore()[0];
    expect(updated.title).toBe('Remote wins');
    expect(updated.date).toBe('2026-05-01');
    expect(updated.syncedAt).not.toBeNull();
  });

  it('pushes local when local is newer than the fetched remote row (T40 local wins)', async () => {
    const remoteRow = {
      id: 'e1',
      provinceId: 'phuket',
      date: '2026-01-01',
      title: 'Stale remote',
      notes: '',
      photoUris: [],
      tags: [],
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const stub = makeSupabaseStub({ selectResult: { data: remoteRow, error: null } });
    clientMock.__setMockClient(stub);
    dbMock.__seed([
      {
        id: 'e1',
        provinceId: 'phuket',
        date: '2026-06-01',
        title: 'Fresh local',
        notes: '',
        photoUris: [],
        tags: [],
        updatedAt: '2026-06-01T00:00:00.000Z',
        syncedAt: '2025-12-01T00:00:00.000Z',
        cloudId: 'e1',
        retryCount: 0,
      },
    ]);

    await syncPendingEntries();

    expect(stub.__internals.upsert).toHaveBeenCalled();
    expect(dbMock.__getStore()[0].title).toBe('Fresh local');
  });

  it('processes queued deletions against the cloud and clears them on success', async () => {
    const stub = makeSupabaseStub();
    clientMock.__setMockClient(stub);
    dbMock.__seedDeletions([{ id: 'del-1', tableName: 'entries', cloudId: 'cloud-abc', retryCount: 0 }]);

    await syncPendingEntries();

    expect(dbMock.__getDeletionStore()).toHaveLength(0);
  });
});

describe('syncPendingCheckins (T39/T40 for landmark check-ins)', () => {
  beforeEach(() => {
    dbMock.__seedCheckins([]);
    clientMock._resetSupabaseClientForTests();
  });

  it('pushes a pending checkin and marks it synced', async () => {
    const stub = makeSupabaseStub();
    clientMock.__setMockClient(stub);
    dbMock.__seedCheckins([
      {
        landmarkId: 'hkt-patong-beach',
        provinceId: 'phuket',
        visited: true,
        updatedAt: '2026-01-01T00:00:00.000Z',
        syncedAt: null,
        cloudId: null,
        retryCount: 0,
      },
    ]);

    const result = await syncPendingCheckins();

    expect(result).toEqual({ attempted: 1, synced: 1, failed: 0 });
    expect(dbMock.__getCheckinStore()[0].syncedAt).not.toBeNull();
  });
});

describe('runSyncCycle', () => {
  it('runs both entry and checkin sync passes and returns their results', async () => {
    clientMock._resetSupabaseClientForTests();
    clientMock.__setConfigured(false);
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);

    const result = await runSyncCycle();

    expect(result).toEqual({
      entries: { attempted: 0, synced: 0, failed: 0 },
      checkins: { attempted: 0, synced: 0, failed: 0 },
    });
  });
});
