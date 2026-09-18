// Independent Tester (QA round 5) — regression sanity check alongside the
// รอบ 14 scroll-container fix: an empty province (no entries, no curated
// landmarks) must still render fine inside the new ScrollView wrapper, not
// just the "content overflows" case covered elsewhere in this folder.

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
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

// chaiyaphum is documented in dev-notes.md (T65) as a province Overpass
// confirmed has genuinely 0 landmarks, so this also naturally exercises the
// "no landmarks" empty state, not just "no entries".
const PROVINCE_ID = 'chaiyaphum';

describe('Bug fix 2 (รอบ 14): empty province still renders inside the scroll container', () => {
  it('empty-state province (no entries, no landmarks) renders without crashing', async () => {
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

    await waitFor(() => expect(screen.getByText('ยังไม่มีบันทึกของจังหวัดนี้')).toBeTruthy());
  });
});
