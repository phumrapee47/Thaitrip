// QA (Tester) — independent integration test for US-14.
//
// The programmer's own suite never exercises HomeScreen's Province Master
// wiring at all (no test file references ProvinceMasterBadge/isJustMastered/
// "ครบ Province Master" from HomeScreen or Map3D — verified by grep before
// writing this file). This test drives real landmark check-ins through
// CheckinContext while HomeScreen stays mounted, to verify the AC3
// requirement that the map effect updates live, without navigating away and
// back or remounting the app.
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import HomeScreen from '../../screens/HomeScreen';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider, useCheckins } from '../../storage/CheckinContext';
import { getLandmarksForProvince } from '../../data/thailand-landmarks';

jest.mock('../../storage/db');
const dbMock = require('../../storage/db');

const Stack = createNativeStackNavigator<RootStackParamList>();

function CheckinCapture({ captureRef }: { captureRef: { current: ReturnType<typeof useCheckins> | null } }) {
  captureRef.current = useCheckins();
  return null;
}

function TestApp({ captureRef }: { captureRef: { current: any } }) {
  return (
    <JournalProvider>
      <CheckinProvider>
        <CheckinCapture captureRef={captureRef} />
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </CheckinProvider>
    </JournalProvider>
  );
}

describe('HomeScreen 3D map Province Master live feedback (US-14)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
  });

  it('updates the krabi tile to Province Master live, while the user stays on Home, then reverts live when un-checked (US-14 AC1/AC2/AC3)', async () => {
    const krabiLandmarks = getLandmarksForProvince('krabi');
    expect(krabiLandmarks.length).toBeGreaterThan(0); // sanity: krabi is one of the 8 pilot provinces

    const captureRef: { current: any } = { current: null };
    render(<TestApp captureRef={captureRef} />);

    await waitFor(() => expect(captureRef.current).not.toBeNull());
    await waitFor(() => expect(captureRef.current.loading).toBe(false));

    // Before checking anything in: krabi's tile must show plain (non-master) state.
    expect(screen.getByLabelText(/^กระบี่, /)).toBeTruthy();
    expect(screen.queryByLabelText(/^กระบี่, .*ครบ Province Master/)).toBeNull();

    // Check in every krabi landmark one at a time, without ever leaving Home.
    for (const landmark of krabiLandmarks) {
      // eslint-disable-next-line no-await-in-loop
      await act(async () => {
        await captureRef.current.setCheckedIn(landmark.id, 'krabi', true);
      });
    }

    // US-14 AC1/AC3: the tile flips to the Province Master label live, same mount.
    await waitFor(() => expect(screen.getByLabelText(/^กระบี่, .*ครบ Province Master/)).toBeTruthy());

    // A different pilot province with landmarks but not fully checked in must
    // NOT show the Province Master label (US-14 AC2 — no bleed-over).
    expect(screen.queryByLabelText(/^ภูเก็ต, .*ครบ Province Master/)).toBeNull();

    // Un-checking one landmark must revoke the effect live too (mirrors US-9 AC2).
    await act(async () => {
      await captureRef.current.setCheckedIn(krabiLandmarks[0].id, 'krabi', false);
    });
    await waitFor(() => expect(screen.queryByLabelText(/^กระบี่, .*ครบ Province Master/)).toBeNull());
  });

  it('does not require the province to be journal-unlocked for the Province Master label to appear (documented edge case, not a hard AC)', async () => {
    // No journal entries seeded at all -> every province is "locked"/grey.
    const krabiLandmarks = getLandmarksForProvince('krabi');
    const captureRef: { current: any } = { current: null };
    render(<TestApp captureRef={captureRef} />);
    await waitFor(() => expect(captureRef.current?.loading).toBe(false));

    for (const landmark of krabiLandmarks) {
      // eslint-disable-next-line no-await-in-loop
      await act(async () => {
        await captureRef.current.setCheckedIn(landmark.id, 'krabi', true);
      });
    }

    // Tile label ends up "locked" (still no journal entry) AND "Province Master"
    // at the same time. Neither US-9 nor US-14's AC text explicitly forbids
    // this combination (Province Master is derived purely from landmark
    // check-ins, independent of journal entries/isVisited) — flagged in the
    // test report as a UX consistency question for PM/UIUX, not a blocking bug.
    await waitFor(() => expect(screen.getByLabelText(/^กระบี่, ยังไม่ได้ไป, ครบ Province Master/)).toBeTruthy());
  });
});
