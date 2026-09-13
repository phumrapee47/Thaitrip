// Independent Tester integration coverage for US-24 AC4, end-to-end through the
// real HomeScreen -> ProvinceDetailScreen navigation stack (not just the
// isolated component). Kept as a single render/single `it()` — see
// globalSearchBarDropdown.test.tsx for why this file is split out.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import HomeScreen from '../../screens/HomeScreen';
import ProvinceDetailScreen from '../../screens/ProvinceDetailScreen';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';

jest.mock('../../storage/db');
const dbMock = require('../../storage/db');

// LandmarkList (mounted once navigation lands on ProvinceDetailScreen) calls the
// real Wikipedia service on mount; stub it so this test stays fully offline.
jest.mock('../../services/wikipediaService', () => ({
  fetchAttractionsForProvince: jest.fn().mockResolvedValue([]),
  searchAttractionsGlobal: jest.fn().mockResolvedValue([]),
  detectCategory: jest.fn().mockReturnValue('สถานที่ท่องเที่ยว'),
}));

const PLACEHOLDER = 'ค้นหาจังหวัด หรือสถานที่ท่องเที่ยว...';
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

describe('GlobalSearchBar wired into HomeScreen (US-24 AC1, AC4 end-to-end)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
  });

  it('is rendered as a floating bar above the 3D map, and tapping a landmark result navigates to the right province', async () => {
    await render(<TestApp />);

    // AC1: floating search bar is present above the map on the real HomeScreen.
    const input = screen.getByPlaceholderText(PLACEHOLDER);
    expect(input).toBeTruthy();

    fireEvent(input, 'focus');
    fireEvent.changeText(input, 'หาดป่าตอง');
    await waitFor(() => expect(screen.getByText('หาดป่าตอง')).toBeTruthy());
    fireEvent.press(screen.getByText('หาดป่าตอง'));

    // AC4: navigated to ProvinceDetailScreen for phuket (owning province of that landmark).
    await waitFor(() => expect(screen.getByText('‹ กลับ')).toBeTruthy());
    expect(screen.getByText('ภูเก็ต')).toBeTruthy();
  });
});
