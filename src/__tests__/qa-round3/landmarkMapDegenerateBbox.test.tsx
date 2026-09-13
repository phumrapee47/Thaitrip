// QA round 3 (US-18 AC1) — degenerate bounding box (a province whose ONLY
// coordinate'd landmark is a single point) exercised through the REAL,
// full ProvinceDetailScreen, not just the pure `normalizePoint` unit tests
// in src/utils/landmarkMap.test.ts. No real province in the shipped dataset
// currently has exactly one coordinate'd landmark (every curated province
// has >= 2 — verified in landmarkDataIntegrity.test.ts), so this is only
// reachable today by injecting one synthetic landmark for an otherwise
// uncurated real province id (chaiyaphum, confirmed 0 real landmarks). This
// still exercises the full LandmarkList -> LandmarkMap -> normalizePoint
// wiring end-to-end — matching what will happen for real the day a content
// reviewer manually adds a province's very first landmark (see the T62/US-17
// AC4 note at the top of thailand-landmarks.ts: lat/lng stay optional
// forever, not just during a migration window).
//
// A static (hoisted) jest.mock is used here — not jest.doMock/resetModules —
// specifically because mixing those with @testing-library/react-native under
// React 19 was found to corrupt the module graph (a different React instance
// gets picked up mid-file, producing "Cannot read properties of null
// (reading 'useState')"). Keeping the mocked dataset in its own file, applied
// once at the top like every other jest.mock in this codebase, avoids that
// entirely and keeps this test's setup consistent with the rest of the suite.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import ProvinceDetailScreen from '../../screens/ProvinceDetailScreen';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';

jest.mock('../../storage/db');

jest.mock('../../data/thailand-landmarks', () => {
  const actual = jest.requireActual('../../data/thailand-landmarks');
  const ONE = [
    { id: 'chaiyaphum-solo-landmark', provinceId: 'chaiyaphum', nameTh: 'จุดเดียวของจังหวัด', lat: 15.8, lng: 102.0 },
  ];
  return {
    ...actual,
    LANDMARKS: ONE,
    getLandmarksForProvince: (provinceId: string) => ONE.filter((l) => l.provinceId === provinceId),
  };
});

const dbMock = require('../../storage/db');

const Stack = createNativeStackNavigator<RootStackParamList>();

function TestApp() {
  return (
    <JournalProvider>
      <CheckinProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="ProvinceDetail"
              component={ProvinceDetailScreen}
              initialParams={{ provinceId: 'chaiyaphum' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </CheckinProvider>
    </JournalProvider>
  );
}

describe('LandmarkMap degenerate bounding box (single-point province) through the real screen (US-18)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
  });

  it('renders the single point without crashing/NaN (dead-centered, per normalizePoint’s degenerate branch) and tapping it toggles check-in correctly', async () => {
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByText('เช็คอินแล้ว 0/1 แห่ง')).toBeTruthy());

    // Advanced UI/UX upgrade: the map is behind a card/map toggle now, not
    // shown in the first fold by default.
    fireEvent.press(screen.getByLabelText('มุมมองแผนที่'));

    const point = screen.getByLabelText('จุดเดียวของจังหวัด, ยังไม่ได้เช็คอิน');
    expect(point).toBeTruthy(); // rendered at all — no NaN/crash for a single-landmark bounding box

    fireEvent.press(point);
    await waitFor(() => expect(screen.getByText('เช็คอินแล้ว 1/1 แห่ง')).toBeTruthy());
    await waitFor(() => expect(screen.getByLabelText('จุดเดียวของจังหวัด, เช็คอินแล้ว')).toBeTruthy());

    // Cross-checked against the underlying storage mock, keyed by the same id.
    expect(dbMock.__getCheckinStore()).toContainEqual(
      expect.objectContaining({ landmarkId: 'chaiyaphum-solo-landmark', provinceId: 'chaiyaphum', visited: true })
    );

    // Switching to card mode shows the SAME checked-in state via the list row.
    fireEvent.press(screen.getByLabelText('มุมมองการ์ด'));
    await waitFor(() => expect(screen.getByLabelText('จุดเดียวของจังหวัด, เช็คอินแล้ว')).toBeTruthy());
  });
});
