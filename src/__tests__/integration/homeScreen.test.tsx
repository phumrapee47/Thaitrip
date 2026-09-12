// US-1 AC4/AC5 (header progress + legend on the actual Home screen) end-to-end
// through JournalProvider, and the unlock-count-updates-immediately behavior.
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import HomeScreen from '../../screens/HomeScreen';
import ProvinceDetailScreen from '../../screens/ProvinceDetailScreen';
import { JournalProvider, useJournal } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';

jest.mock('../../storage/db');
const dbMock = require('../../storage/db');

const Stack = createNativeStackNavigator<RootStackParamList>();

function TestApp() {
  return (
    <JournalProvider>
      <CheckinProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="ProvinceDetail" component={ProvinceDetailScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </CheckinProvider>
    </JournalProvider>
  );
}

describe('HomeScreen (US-1 AC4/AC5)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
  });

  it('shows "ปลดล็อกแล้ว 0 / 76 จังหวัด" and the legend when nothing is unlocked yet (US-1 AC4/AC5)', async () => {
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByText('ปลดล็อกแล้ว 0 / 76 จังหวัด')).toBeTruthy());
    expect(screen.getByText('ยังไม่ได้ไป')).toBeTruthy();
    expect(screen.getByText('ไปแล้ว')).toBeTruthy();
  });

  it('updates the header count immediately once an entry is added for a new province (US-1 AC4)', async () => {
    let ctx: ReturnType<typeof useJournal> | null = null;
    function Capture() {
      ctx = useJournal();
      return null;
    }
    await render(
      <JournalProvider>
        <CheckinProvider>
          <Capture />
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Home" component={HomeScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </CheckinProvider>
      </JournalProvider>
    );
    await waitFor(() => expect(screen.getByText('ปลดล็อกแล้ว 0 / 76 จังหวัด')).toBeTruthy());

    await act(async () => {
      await ctx!.addEntry({
        provinceId: 'phuket',
        date: '2026-01-01',
        title: 'First trip',
        notes: '',
        photoUris: [],
        tags: [],
      });
    });

    await waitFor(() => expect(screen.getByText('ปลดล็อกแล้ว 1 / 76 จังหวัด')).toBeTruthy());
  });

  it('tapping a tile from Home navigates to the correct ProvinceDetail screen (US-2 AC1 end-to-end)', async () => {
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByLabelText(/ภูเก็ต/)).toBeTruthy());
    fireEvent.press(screen.getByLabelText(/ภูเก็ต/));
    await waitFor(() => expect(screen.getByText('ภูเก็ต')).toBeTruthy());
    expect(screen.getByText('ยังไม่มีบันทึกของจังหวัดนี้')).toBeTruthy();
  });
});
