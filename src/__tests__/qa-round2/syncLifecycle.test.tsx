// QA (Tester) — independent integration test for US-12/US-13.
//
// The programmer's own tests exercise syncEngine.ts and photoUpload.ts as
// pure functions directly (src/sync/syncEngine.test.ts, photoUpload.test.ts)
// but never mount `SyncProvider` (src/sync/SyncContext.tsx) itself — there is
// no test file for SyncContext.tsx at all. That means the actual wiring the
// end-user experiences (an entry/photo written locally, then automatically
// flipping its on-screen sync badge from "pending" to "synced" without any
// manual action, per US-12 AC2/AC4 and US-13 AC2) was never verified end to
// end. This file fills that gap by rendering the real provider stack
// (JournalProvider + CheckinProvider + SyncProvider) around a real screen.
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import ProvinceDetailScreen from '../../screens/ProvinceDetailScreen';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';
import { SyncProvider, useSync } from '../../sync/SyncContext';

jest.mock('../../storage/db');
jest.mock('../../lib/supabaseClient');

// Bug fix (HEIC/400 upload): photoUpload.ts now reads local photo URIs via
// expo-file-system's readAsStringAsync (base64) + base64-arraybuffer's decode,
// instead of fetch(uri).blob(). This suite exercises SyncContext's real,
// un-injected uploadPendingPhotos() call, so the default expo-file-system
// binding needs a working mock here (its auto-mock resolves to `undefined`,
// which `decode()` can't handle) — content doesn't matter, only that it
// resolves to a valid base64 string so the upload path completes.
jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(() => Promise.resolve('ZmFrZS1waG90by1ieXRlcw==')),
}));

const dbMock = require('../../storage/db');
const clientMock = require('../../lib/supabaseClient');

const Stack = createNativeStackNavigator<RootStackParamList>();


function SyncCapture({ captureRef }: { captureRef: { current: ReturnType<typeof useSync> | null } }) {
  captureRef.current = useSync();
  return null;
}

function TestApp({ provinceId, captureRef }: { provinceId: string; captureRef: { current: any } }) {
  return (
    <JournalProvider>
      <CheckinProvider>
        <SyncProvider>
          <SyncCapture captureRef={captureRef} />
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="ProvinceDetail" component={ProvinceDetailScreen} initialParams={{ provinceId }} />
            </Stack.Navigator>
          </NavigationContainer>
        </SyncProvider>
      </CheckinProvider>
    </JournalProvider>
  );
}

function makeWorkingSupabaseStub() {
  const maybeSingle = jest.fn(() => Promise.resolve({ data: null, error: null }));
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ eq }));
  const upsertMaybeSingle = jest.fn(() => Promise.resolve({ data: { id: 'cloud-1' }, error: null }));
  const upsertSelect = jest.fn(() => ({ maybeSingle: upsertMaybeSingle }));
  const upsert = jest.fn(() => ({ select: upsertSelect }));
  const del = jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ error: null })) }));
  const upload = jest.fn(() => Promise.resolve({ error: null }));
  const getPublicUrl = jest.fn(() => ({ data: { publicUrl: 'https://cdn.example.com/uploaded.jpg' } }));
  const storageFrom = jest.fn(() => ({ upload, getPublicUrl }));
  return {
    from: jest.fn(() => ({ select, upsert, delete: del })),
    storage: { from: storageFrom },
    __internals: { upsert, upload, getPublicUrl, storageFrom },
  };
}

function makeFailingSupabaseStub() {
  const maybeSingle = jest.fn(() => Promise.resolve({ data: null, error: null }));
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ eq }));
  const upsertMaybeSingle = jest.fn(() => Promise.resolve({ data: null, error: { message: 'network down' } }));
  const upsertSelect = jest.fn(() => ({ maybeSingle: upsertMaybeSingle }));
  const upsert = jest.fn(() => ({ select: upsertSelect }));
  const del = jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ error: null })) }));
  return { from: jest.fn(() => ({ select, upsert, delete: del })) };
}

describe('SyncProvider end-to-end (US-12): pending -> synced badge flip with zero user action', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
    dbMock.__seedDeletions([]);
    clientMock._resetSupabaseClientForTests();
  });

  it('automatically flips an unsynced entry to "synced" on the real ProvinceDetailScreen list without any manual pull-to-refresh (US-12 AC2/AC4)', async () => {
    clientMock.__setMockClient(makeWorkingSupabaseStub());
    dbMock.__seed([
      {
        id: 'e1',
        provinceId: 'krabi',
        date: '2026-01-01',
        title: 'ทริปกระบี่',
        notes: '',
        photoUris: [],
        tags: [],
        updatedAt: '2026-01-01T00:00:00.000Z',
        syncedAt: null,
        cloudId: null,
        retryCount: 0,
      },
    ]);

    const captureRef: { current: any } = { current: null };
    render(<TestApp provinceId="krabi" captureRef={captureRef} />);

    await waitFor(() => expect(screen.getByText('ทริปกระบี่')).toBeTruthy());

    // Badge must reach "synced" purely from SyncProvider's own mount-time sync pass.
    await waitFor(() =>
      expect(screen.getByLabelText('สถานะซิงก์: ซิงก์ขึ้น cloud แล้ว')).toBeTruthy()
    );
    expect(dbMock.__getStore()[0].syncedAt).not.toBeNull();
  });

  it('reaches "retry-issue" in the UI after repeated sync failures for the same record (US-12 AC4 floor: must not silently look "lost")', async () => {
    clientMock.__setMockClient(makeFailingSupabaseStub());
    dbMock.__seed([
      {
        id: 'e1',
        provinceId: 'krabi',
        date: '2026-01-01',
        title: 'ทริปที่ sync ไม่ผ่าน',
        notes: '',
        photoUris: [],
        tags: [],
        updatedAt: '2026-01-01T00:00:00.000Z',
        syncedAt: null,
        cloudId: null,
        retryCount: 0,
      },
    ]);

    const captureRef: { current: any } = { current: null };
    render(<TestApp provinceId="krabi" captureRef={captureRef} />);
    await waitFor(() => expect(screen.getByText('ทริปที่ sync ไม่ผ่าน')).toBeTruthy());

    // Mount already fired one attempt; drive two more full cycles manually to
    // cross RETRY_ISSUE_THRESHOLD (3) without waiting a real 40s for the interval.
    await waitFor(() => expect(dbMock.__getStore()[0].retryCount).toBeGreaterThanOrEqual(1));
    await act(async () => {
      await captureRef.current.triggerSync();
    });
    await act(async () => {
      await captureRef.current.triggerSync();
    });

    expect(dbMock.__getStore()[0].retryCount).toBeGreaterThanOrEqual(3);
    await waitFor(() =>
      expect(screen.getByLabelText('สถานะซิงก์: จะลองใหม่อัตโนมัติเมื่อมีเน็ต')).toBeTruthy()
    );
  });
});

describe('SyncProvider end-to-end (US-13): local photo replaced with cloud URL, no duplicate upload', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
    clientMock._resetSupabaseClientForTests();
  });

  it('renders the entry with its local photo URI wired up (US-13 AC1 groundwork), then swaps to the cloud URL after the background sync, without re-uploading on the next cycle', async () => {
    const stub = makeWorkingSupabaseStub();
    clientMock.__setMockClient(stub);
    dbMock.__seed([
      {
        id: 'e1',
        provinceId: 'krabi',
        date: '2026-01-01',
        title: 'ทริปมีรูป',
        notes: '',
        photoUris: ['file:///local/photo.jpg'],
        tags: [],
        updatedAt: '2026-01-01T00:00:00.000Z',
        syncedAt: null,
        cloudId: null,
        retryCount: 0,
      },
    ]);

    const captureRef: { current: any } = { current: null };
    await render(<TestApp provinceId="krabi" captureRef={captureRef} />);
    await waitFor(() => expect(screen.getByText('ทริปมีรูป')).toBeTruthy());

    // NOTE: this jest environment resolves the mocked upload's promises on the
    // same microtask flush as mount (no real network delay), so the transient
    // "still showing the local URI before upload finishes" moment (US-13 AC1)
    // cannot be reliably frozen/observed here — see Coverage gaps in the test
    // report. What *is* verified end-to-end below is the AC2/AC3 outcome.

    // US-13 AC2: background sync uploads it and rewrites the entry with the cloud URL.
    await waitFor(() => expect(dbMock.__getStore()[0].photoUris[0]).toBe('https://cdn.example.com/uploaded.jpg'));

    // US-13 AC3: a second full sync cycle must not re-upload the now-cloud URL.
    await act(async () => {
      await captureRef.current.triggerSync();
    });
    expect(stub.__internals.upload).toHaveBeenCalledTimes(1);
  });
});
