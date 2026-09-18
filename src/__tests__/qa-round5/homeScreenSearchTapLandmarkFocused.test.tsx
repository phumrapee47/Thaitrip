// Independent Tester (QA round 5) — see homeScreenScrollViewGuard.test.tsx
// for the full root-cause writeup and why this stays a single-scenario file.
// This test keeps the search TextInput focused for the whole interaction
// (never blurs it first) to match the real reported repro, then confirms the
// end-to-end outcome (navigation) that a real user would see once the fix is
// applied on a real device.

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

jest.mock('../../services/wikipediaService', () => ({
  fetchAttractionsForProvince: jest.fn().mockResolvedValue([]),
  searchAttractionsGlobal: jest.fn().mockResolvedValue([]),
  resolveRealPhotoForLandmark: jest.fn().mockResolvedValue(null),
  detectCategory: jest.fn().mockReturnValue('สถานที่ท่องเที่ยว'),
}));

const SEARCH_PLACEHOLDER = 'ค้นหาจังหวัด หรือสถานที่ท่องเที่ยว...';
const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeApp() {
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

describe('Bug fix 1 (รอบ 14): tapping a search result while still focused', () => {
  it('tapping a landmark result while the TextInput is still focused (not blurred first) navigates to the owning province', async () => {
    jest.useFakeTimers();
    try {
      dbMock.__seed([]);
      dbMock.__seedCheckins([]);

      await render(<HomeApp />);
      const input = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);

      fireEvent(input, 'focus');
      fireEvent.changeText(input, 'หาดป่าตอง');
      await waitFor(() => expect(screen.getByText('หาดป่าตอง')).toBeTruthy());

      // Deliberately do NOT fire a blur event here — the real bug happened
      // while focus was still active, so the test must keep it that way
      // instead of blurring first (which would not match the reported
      // repro).
      fireEvent.press(screen.getByText('หาดป่าตอง'));

      await waitFor(() => expect(screen.getByText('‹ กลับ')).toBeTruthy());
      expect(screen.getByText('ภูเก็ต')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });
});
