// T43-T46 / US-8, US-9 — landmark list, check-in persistence, progress, empty
// state for un-curated provinces, and live Province Master badge behavior.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import ProvinceDetailScreen from '../../screens/ProvinceDetailScreen';
import AddEntryScreen from '../../screens/AddEntryScreen';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';

jest.mock('../../storage/db');
const dbMock = require('../../storage/db');

const Stack = createNativeStackNavigator<RootStackParamList>();

function TestApp({ provinceId }: { provinceId: string }) {
  return (
    <JournalProvider>
      <CheckinProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProvinceDetail" component={ProvinceDetailScreen} initialParams={{ provinceId }} />
            <Stack.Screen name="AddEntry" component={AddEntryScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </CheckinProvider>
    </JournalProvider>
  );
}

describe('Landmark check-in on ProvinceDetailScreen (US-8/US-9)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
  });

  it('shows the not-curated empty state for a province with no seeded landmarks (US-8 AC4)', async () => {
    // chaiyaphum: confirmed empty in scripts/output/overpass-landmarks-report.json
    // (T60/T61 real Overpass run legitimately returned 0 results for it — not a
    // network-failure gap). amnat-charoen is no longer a valid example here since
    // T64 merged real landmarks into it.
    await render(<TestApp provinceId="chaiyaphum" />);
    await waitFor(() =>
      expect(screen.getByText('ยังไม่มีข้อมูลสถานที่แนะนำสำหรับจังหวัดนี้')).toBeTruthy()
    );
  });

  it('lists landmarks with a progress indicator for a curated (pilot) province (US-8 AC1/AC3)', async () => {
    await render(<TestApp provinceId="krabi" />);
    await waitFor(() => expect(screen.getByText('เช็คอินแล้ว 0/3 แห่ง')).toBeTruthy());
    expect(screen.getByText('หาดไร่เลย์')).toBeTruthy();
  });

  it('toggling a landmark switch persists immediately and updates the progress count (US-8 AC2/AC3)', async () => {
    await render(<TestApp provinceId="krabi" />);
    await waitFor(() => expect(screen.getByText('เช็คอินแล้ว 0/3 แห่ง')).toBeTruthy());

    fireEvent.press(screen.getByText('หาดไร่เลย์'));

    await waitFor(() => expect(screen.getByText('เช็คอินแล้ว 1/3 แห่ง')).toBeTruthy());
    expect(dbMock.__getCheckinStore().find((c: any) => c.landmarkId === 'kbi-railay-beach')?.visited).toBe(true);
  });

  it('shows the Province Master badge once every landmark is checked in, and hides it again when un-checked (US-9 AC1/AC2)', async () => {
    await render(<TestApp provinceId="krabi" />);
    await waitFor(() => expect(screen.getByText('เช็คอินแล้ว 0/3 แห่ง')).toBeTruthy());

    fireEvent.press(screen.getByText('หาดไร่เลย์'));
    await waitFor(() => expect(screen.getByText('เช็คอินแล้ว 1/3 แห่ง')).toBeTruthy());
    fireEvent.press(screen.getByText('ทัวร์ 4 เกาะกระบี่'));
    await waitFor(() => expect(screen.getByText('เช็คอินแล้ว 2/3 แห่ง')).toBeTruthy());
    fireEvent.press(screen.getByText('สระมรกต'));

    await waitFor(() => expect(screen.getByText('Province Master ⭐')).toBeTruthy());

    // Un-check one — badge must disappear immediately (live-computed, not cached).
    fireEvent.press(screen.getByText('สระมรกต'));
    await waitFor(() => expect(screen.queryByText('Province Master ⭐')).toBeNull());
  });
});
