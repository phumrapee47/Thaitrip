// T37/T38 / US-11 — anonymous auth bootstrap + email-link unit tests.
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  bootstrapSession,
  linkEmail,
  hasSeenAnonWarning,
  markAnonWarningSeen,
  getStoredSession,
} from './authService';

jest.mock('../lib/supabaseClient');
const clientMock = require('../lib/supabaseClient');

describe('bootstrapSession (T37 / US-11 AC1)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    clientMock._resetSupabaseClientForTests();
  });

  it('creates a new anonymous session via Supabase when configured', async () => {
    clientMock.__setMockClient({
      auth: { signInAnonymously: jest.fn(() => Promise.resolve({ data: { user: { id: 'sb-user-1' } }, error: null })) },
    });

    const { session, isNewSession } = await bootstrapSession();

    expect(isNewSession).toBe(true);
    expect(session).toEqual({ userId: 'sb-user-1', isAnonymous: true, email: null });
  });

  it('falls back to a local-only anonymous id without throwing when Supabase is unconfigured (T33)', async () => {
    clientMock.__setConfigured(false);

    const { session, isNewSession } = await bootstrapSession();

    expect(isNewSession).toBe(true);
    expect(session.isAnonymous).toBe(true);
    expect(session.userId).toMatch(/^local-/);
  });

  it('falls back to a local-only id without throwing when the Supabase call itself throws', async () => {
    clientMock.__setMockClient({
      auth: { signInAnonymously: jest.fn(() => Promise.reject(new Error('network down'))) },
    });

    const { session } = await bootstrapSession();

    expect(session.userId).toMatch(/^local-/);
  });

  it('reuses the existing session on subsequent calls instead of creating a new one', async () => {
    clientMock.__setConfigured(false);
    const first = await bootstrapSession();
    expect(first.isNewSession).toBe(true);

    const second = await bootstrapSession();
    expect(second.isNewSession).toBe(false);
    expect(second.session).toEqual(first.session);
  });
});

describe('anon warning flag (T50 one-time modal)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('is unseen by default, then seen after marking', async () => {
    expect(await hasSeenAnonWarning()).toBe(false);
    await markAnonWarningSeen();
    expect(await hasSeenAnonWarning()).toBe(true);
  });
});

describe('linkEmail (T38 / US-11 AC2/AC4)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    clientMock._resetSupabaseClientForTests();
    clientMock.__setConfigured(true);
    await bootstrapSessionOffline();
  });

  async function bootstrapSessionOffline() {
    clientMock.__setConfigured(false);
    await bootstrapSession();
    clientMock.__setConfigured(true);
  }

  it('succeeds and updates the stored session to non-anonymous with the linked email', async () => {
    clientMock.__setMockClient({
      auth: { updateUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'u1' } }, error: null })) },
    });

    const result = await linkEmail('me@example.com', 'strongpass123');

    expect(result.ok).toBe(true);
    const session = await getStoredSession();
    expect(session?.isAnonymous).toBe(false);
    expect(session?.email).toBe('me@example.com');
  });

  it('classifies a duplicate-email server error and leaves the session untouched (still anonymous)', async () => {
    const before = await getStoredSession();
    clientMock.__setMockClient({
      auth: { updateUser: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Email already registered' } })) },
    });

    const result = await linkEmail('taken@example.com', 'strongpass123');

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('duplicate-email');
    const after = await getStoredSession();
    expect(after).toEqual(before); // untouched / still usable
  });

  it('classifies a weak-password server error', async () => {
    clientMock.__setMockClient({
      auth: { updateUser: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Password is too weak' } })) },
    });

    const result = await linkEmail('me@example.com', 'strongpass123');
    expect(result.errorCode).toBe('weak-password');
  });

  it('rejects an obviously short password client-side before ever calling Supabase', async () => {
    const client = { auth: { updateUser: jest.fn() } };
    clientMock.__setMockClient(client);

    const result = await linkEmail('me@example.com', '123');

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('weak-password');
    expect(client.auth.updateUser).not.toHaveBeenCalled();
  });

  it('classifies an unexpected/network failure as generic-failure without throwing', async () => {
    clientMock.__setMockClient({
      auth: { updateUser: jest.fn(() => Promise.reject(new Error('boom'))) },
    });

    const result = await linkEmail('me@example.com', 'strongpass123');
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('generic-failure');
  });

  it('returns generic-failure (not a throw) when Supabase is unconfigured', async () => {
    clientMock.__setConfigured(false);
    const result = await linkEmail('me@example.com', 'strongpass123');
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('generic-failure');
  });
});
