// Independent Tester (QA round 5) — see homeScreenScrollViewGuard.test.tsx
// for the full root-cause writeup and why this stays a single-scenario file.
// Same shape as homeScreenSearchTapLandmarkFocused.test.tsx, but for a
// province match instead of a landmark match — both result types share the
// same dropdown ScrollView, so both need the same regression coverage.

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

describe('Bug fix 1 (รอบ 14): tapping a province search result while still focused', () => {
  it('tapping a province result (not just a landmark) while the TextInput is still focused navigates correctly', async () => {
    jest.useFakeTimers();
    try {
      dbMock.__seed([]);
      dbMock.__seedCheckins([]);

      await render(<HomeApp />);
      const input = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);

      fireEvent(input, 'focus');
      fireEvent.changeText(input, 'เชียงใหม่');
      await waitFor(() => expect(screen.getAllByText('เชียงใหม่').length).toBeGreaterThan(0));

      // No blur before pressing — same reasoning as the landmark-result test.
      fireEvent.press(screen.getAllByText('เชียงใหม่')[0]);

      await waitFor(() => expect(screen.getByText('‹ กลับ')).toBeTruthy());
    } finally {
      jest.useRealTimers();
    }
  });
});
