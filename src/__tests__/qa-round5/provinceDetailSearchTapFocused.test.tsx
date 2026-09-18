// Independent Tester (QA round 5) — see provinceDetailScrollContainer.test.tsx
// for the scroll-container root-cause writeup, and
// homeScreenScrollViewGuard.test.tsx for why this stays a single-scenario
// file (fake-timer/act-queue interaction across `it()`s in one file).
//
// This is the same class of bug as bug 1 (GlobalSearchBar), just on
// ProvinceDetailScreen's own in-province search box (LandmarkList): before
// the fix, the entire body (including this TextInput and the landmark cards
// below it) had no gesture-safe scroll ancestor at all, so the same "focused
// TextInput swallows the first tap on a sibling result" failure mode was
// possible here too. Now guarded by the same ScrollView fix.

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
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

const PROVINCE_ID = 'bangkok-metropolis';

describe('Bug fix 2 (รอบ 14): landmark card tap while in-province search is focused', () => {
  it('landmark card can still be tapped while the in-province search TextInput is focused (no blur first)', async () => {
    jest.useFakeTimers();
    try {
      dbMock.__seedCheckins([]);
      dbMock.__seed([]);

      await render(
        <JournalProvider>
          <CheckinProvider>
            <NavigationContainer>
              <ProvinceDetailScreen
                route={{ key: 'pd', name: 'ProvinceDetail', params: { provinceId: PROVINCE_ID } } as any}
                navigation={{ navigate: jest.fn(), goBack: jest.fn() } as any}
              />
            </NavigationContainer>
          </CheckinProvider>
        </JournalProvider>
      );

      // Baseline: 0 of 5 curated Bangkok landmarks checked in.
      await waitFor(() => expect(screen.getByText('เช็คอินแล้ว 0/5 แห่ง')).toBeTruthy());

      const searchInput = await screen.findByPlaceholderText(/ค้นหาสถานที่ใน/);
      fireEvent(searchInput, 'focus');
      fireEvent.changeText(searchInput, 'วัดโพธิ์');

      await waitFor(() => expect(screen.getByText('วัดโพธิ์')).toBeTruthy());

      // Deliberately keep the search TextInput focused (no blur) before
      // tapping the filtered card below it.
      fireEvent.press(screen.getByText('วัดโพธิ์'));

      // If the tap had been swallowed by an ancestor without
      // keyboardShouldPersistTaps="handled" (old bug class), the checkin
      // would never persist and this count would stay 0.
      await waitFor(() => expect(screen.getByText('เช็คอินแล้ว 1/5 แห่ง')).toBeTruthy());
    } finally {
      jest.useRealTimers();
    }
  });
});
