// QA (Tester) — independent integration test for US-15.
//
// The programmer's own migration.test.ts checks the migration function in
// isolation (unit-level) and AuthContext.test.tsx checks that migration is
// *called* again on every bootstrap, but nothing renders the real
// AuthProvider + JournalProvider + StatsScreen/AddEntryScreen stack together
// to prove the USER-VISIBLE claims of US-15: (a) AC2 — the entry count shown
// on Stats doesn't change/drop across a migration run, and (b) AC3 — the
// user can still add a brand-new entry while an old legacy row is (slowly)
// migrating, without it blocking or corrupting anything.
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import HomeScreen from '../../screens/HomeScreen';
import StatsScreen from '../../screens/StatsScreen';
import AddEntryScreen from '../../screens/AddEntryScreen';
import { AuthProvider } from '../../auth/AuthContext';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';

jest.mock('../../storage/db');
jest.mock('../../lib/supabaseClient');

const dbMock = require('../../storage/db');
const clientMock = require('../../lib/supabaseClient');

const Stack = createNativeStackNavigator<RootStackParamList>();

function TestApp({ initialRouteName = 'Home' as keyof RootStackParamList }) {
  return (
    <AuthProvider>
      <JournalProvider>
        <CheckinProvider>
          <NavigationContainer>
            <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Stats" component={StatsScreen} />
              <Stack.Screen name="AddEntry" component={AddEntryScreen} initialParams={{ provinceId: 'krabi' }} />
            </Stack.Navigator>
          </NavigationContainer>
        </CheckinProvider>
      </JournalProvider>
    </AuthProvider>
  );
}

const LEGACY_ENTRIES = [
  { id: 'legacy-1', provinceId: 'phuket', date: '2024-01-01', title: 'ทริปเก่า 1', notes: '', photoUris: [], tags: [] },
  { id: 'legacy-2', provinceId: 'krabi', date: '2024-02-01', title: 'ทริปเก่า 2', notes: '', photoUris: [], tags: [] },
  { id: 'legacy-3', provinceId: 'krabi', date: '2024-03-01', title: 'ทริปเก่า 3', notes: '', photoUris: [], tags: [] },
];

describe('v1 -> cloud migration on app open (US-15)', () => {
  beforeEach(() => {
    dbMock.__seed(JSON.parse(JSON.stringify(LEGACY_ENTRIES)));
    dbMock.__seedCheckins([]);
    clientMock.__setConfigured(false); // offline: migration should still mark rows pending regardless of network
  });

  it('does not change the entry count shown on the Stats screen across a migration run (US-15 AC2)', async () => {
    render(<TestApp />);
    await waitFor(() => screen.getByText('Travel Journal ไทย'));

    fireEvent.press(screen.getByText('สถิติ'));
    await waitFor(() => expect(screen.getByText('บันทึกทั้งหมด 3 รายการ')).toBeTruthy());

    // Give the fire-and-forget migration effect (AuthContext) a moment to run,
    // then confirm the count is still exactly 3 (no loss, no duplication) and
    // every previously-legacy row is now correctly flagged as migrated/pending.
    await waitFor(() => expect(dbMock.__getStore().every((e: any) => Boolean(e.updatedAt))).toBe(true));
    expect(dbMock.__getStore()).toHaveLength(3);
    expect(screen.getByText('บันทึกทั้งหมด 3 รายการ')).toBeTruthy();
  });

  it('lets the user add a brand-new entry while a legacy row is still being migrated, without blocking or corrupting existing data (US-15 AC3)', async () => {
    // Simulate a slow migration write for one legacy row so migration is
    // still genuinely "in flight" while the user interacts with AddEntry.
    const realMarkPending = dbMock.markEntryPendingSync;
    let unblock: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      unblock = resolve;
    });
    dbMock.markEntryPendingSync = jest.fn(async (id: string) => {
      if (id === 'legacy-1') await gate; // hang this one on purpose
      return realMarkPending(id);
    });

    render(<TestApp initialRouteName="AddEntry" />);
    await waitFor(() => expect(screen.getByText('ชื่อสถานที่ *')).toBeTruthy());

    // legacy-1's migration write is still pending (gated) at this point.
    expect(dbMock.__getStore().find((e: any) => e.id === 'legacy-1')?.updatedAt).toBeFalsy();

    // The user must still be able to add a brand-new entry right now.
    fireEvent.changeText(screen.getByPlaceholderText('ชื่อสถานที่'), 'ทริปใหม่ระหว่าง migrate');
    await waitFor(() => expect(screen.getByDisplayValue('ทริปใหม่ระหว่าง migrate')).toBeTruthy());
    fireEvent.press(screen.getByText('บันทึก'));

    await waitFor(() =>
      expect(dbMock.__getStore().some((e: any) => e.title === 'ทริปใหม่ระหว่าง migrate')).toBe(true)
    );
    // Existing legacy rows must still be intact (not lost/duplicated) even
    // though one of their migration writes hadn't resolved yet.
    expect(dbMock.__getStore()).toHaveLength(4);

    unblock();
    await waitFor(() => expect(dbMock.__getStore().find((e: any) => e.id === 'legacy-1')?.updatedAt).toBeTruthy());
    dbMock.markEntryPendingSync = realMarkPending;
  });
});
