// T37/T50 — AuthProvider bootstraps a session and drives the one-time warning modal flag.
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './AuthContext';
import { hasSeenAnonWarning } from './authService';

jest.mock('../lib/supabaseClient'); // defaults to "unconfigured" -> local anonymous session
jest.mock('../storage/db'); // migrateLegacyEntries touches db.getLegacyEntries via migration.ts

const clientMock = require('../lib/supabaseClient');
const dbMock = require('../storage/db');

function Probe() {
  const { loading, session, showAnonWarningModal } = useAuth();
  return (
    <>
      <Text testID="loading">{String(loading)}</Text>
      <Text testID="anonymous">{String(session?.isAnonymous)}</Text>
      <Text testID="modal">{String(showAnonWarningModal)}</Text>
    </>
  );
}

describe('AuthProvider (T37 bootstrap, T50 one-time warning)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    clientMock._resetSupabaseClientForTests();
    clientMock.__setConfigured(false);
    dbMock.__seed([]);
  });

  it('bootstraps an anonymous session and shows the one-time warning modal on first launch (US-11 AC1, T50)', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loading').props.children).toBe('false'));
    expect(screen.getByTestId('anonymous').props.children).toBe('true');
    expect(screen.getByTestId('modal').props.children).toBe('true');
  });

  it('does not re-show the modal on a subsequent app open once dismissed (T50 "shown-once" state)', async () => {
    let ctx: ReturnType<typeof useAuth> | null = null;
    function Capture() {
      ctx = useAuth();
      return <Probe />;
    }
    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('modal').props.children).toBe('true'));

    await act(async () => {
      await ctx!.dismissAnonWarningModal();
    });
    expect(screen.getByTestId('modal').props.children).toBe('false');

    // The flag that gates a future app open's modal is now persisted.
    expect(await hasSeenAnonWarning()).toBe(true);
  });

  it('re-attempts migration on every app open, not just the very first session (T55 resume-after-partial-failure)', async () => {
    // Simulate an existing (already-bootstrapped) session, as if the app had been opened before.
    await AsyncStorage.setItem(
      'travel_journal_session_v1',
      JSON.stringify({ userId: 'local-existing', isAnonymous: true, email: null })
    );
    dbMock.__seed([
      { id: 'legacy-1', provinceId: 'phuket', date: '2025-01-01', title: 'Old trip', notes: '', photoUris: [], tags: [] },
    ]);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loading').props.children).toBe('false'));
    await waitFor(() => expect(dbMock.__getStore()[0].updatedAt).toBeTruthy());
  });
});
