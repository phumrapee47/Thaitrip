import { getSyncStatus, pickWinner, RETRY_ISSUE_THRESHOLD } from './syncStatus';

describe('getSyncStatus (T39/T51 — 3-state sync badge)', () => {
  it('returns "pending" when never synced (syncedAt null/undefined)', () => {
    expect(getSyncStatus({ updatedAt: '2026-01-01T00:00:00.000Z', syncedAt: null, retryCount: 0 })).toBe(
      'pending'
    );
    expect(getSyncStatus({ updatedAt: '2026-01-01T00:00:00.000Z', retryCount: 0 })).toBe('pending');
  });

  it('returns "pending" when edited after the last successful sync', () => {
    expect(
      getSyncStatus({
        updatedAt: '2026-02-01T00:00:00.000Z',
        syncedAt: '2026-01-01T00:00:00.000Z',
        retryCount: 0,
      })
    ).toBe('pending');
  });

  it('returns "synced" when syncedAt is at or after the last edit', () => {
    expect(
      getSyncStatus({
        updatedAt: '2026-01-01T00:00:00.000Z',
        syncedAt: '2026-01-01T00:00:00.000Z',
        retryCount: 0,
      })
    ).toBe('synced');
    expect(
      getSyncStatus({
        updatedAt: '2026-01-01T00:00:00.000Z',
        syncedAt: '2026-02-01T00:00:00.000Z',
        retryCount: 0,
      })
    ).toBe('synced');
  });

  it('returns "retry-issue" once retryCount reaches the threshold, even if never synced', () => {
    expect(
      getSyncStatus({ updatedAt: '2026-01-01T00:00:00.000Z', syncedAt: null, retryCount: RETRY_ISSUE_THRESHOLD })
    ).toBe('retry-issue');
    expect(
      getSyncStatus({
        updatedAt: '2026-01-01T00:00:00.000Z',
        syncedAt: null,
        retryCount: RETRY_ISSUE_THRESHOLD + 5,
      })
    ).toBe('retry-issue');
  });

  it('does not flag retry-issue below the threshold', () => {
    expect(
      getSyncStatus({
        updatedAt: '2026-01-01T00:00:00.000Z',
        syncedAt: null,
        retryCount: RETRY_ISSUE_THRESHOLD - 1,
      })
    ).toBe('pending');
  });
});

describe('pickWinner (T40 — whole-record last-write-wins)', () => {
  it('local wins when there is no remote row yet (never synced before)', () => {
    const local = { updatedAt: '2026-01-01T00:00:00.000Z', title: 'local' };
    const result = pickWinner(local, null);
    expect(result.source).toBe('local');
    expect(result.winner).toBe(local);
  });

  it('remote wins when it is strictly newer than local', () => {
    const local = { updatedAt: '2026-01-01T00:00:00.000Z', title: 'local' };
    const remote = { updatedAt: '2026-02-01T00:00:00.000Z', title: 'remote' };
    const result = pickWinner(local, remote);
    expect(result.source).toBe('remote');
    expect(result.winner).toBe(remote);
  });

  it('local wins when it is newer than or equal to remote', () => {
    const newerLocal = { updatedAt: '2026-03-01T00:00:00.000Z', title: 'local' };
    const olderRemote = { updatedAt: '2026-01-01T00:00:00.000Z', title: 'remote' };
    expect(pickWinner(newerLocal, olderRemote).source).toBe('local');

    const tie = '2026-01-01T00:00:00.000Z';
    const localTie = { updatedAt: tie, title: 'local' };
    const remoteTie = { updatedAt: tie, title: 'remote' };
    expect(pickWinner(localTie, remoteTie).source).toBe('local');
  });
});
