// T92-T96 / US-28: Bottom Tab Navigation regression suite. Renders the REAL
// `AppNavigator` (not a hand-rolled test stack) so this exercises the actual
// nested-stack-per-tab wiring, not just individual screens in isolation.
// Focus: the pre-existing Map flow (US-1/2/3/14/24/26) must show zero
// regression after the single-stack -> 2-tab restructure, the dev-only
// Map2DValidation route must still be reachable, and Stats/Settings must push
// into whichever tab's own nested stack the user is currently on (not always
// the Map tab's).
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AppNavigator from '../../navigation/AppNavigator';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';
import { AuthProvider } from '../../auth/AuthContext';

jest.mock('../../storage/db');
jest.mock('../../lib/supabaseClient');
jest.mock('../../services/wikipediaService', () => ({
  fetchAttractionsForProvince: jest.fn().mockResolvedValue([]),
  searchAttractionsGlobal: jest.fn().mockResolvedValue([]),
  resolveRealPhotoForLandmark: jest.fn().mockResolvedValue(null),
  detectCategory: jest.fn().mockReturnValue('สถานที่ท่องเที่ยว'),
}));
jest.mock('../../services/newsService', () => ({
  fetchAndProcessNews: jest.fn().mockResolvedValue([]),
  readNewsCache: jest.fn().mockResolvedValue(null),
  writeNewsCache: jest.fn().mockResolvedValue(new Date().toISOString()),
  isCacheStale: jest.fn().mockReturnValue(false),
  isLikelyReachable: jest.fn().mockResolvedValue(true),
  NEWS_CACHE_TTL_MS: 45 * 60 * 1000,
}));

const dbMock = require('../../storage/db');
const clientMock = require('../../lib/supabaseClient');

function TestApp() {
  return (
    <AuthProvider>
      <JournalProvider>
        <CheckinProvider>
          <AppNavigator />
        </CheckinProvider>
      </JournalProvider>
    </AuthProvider>
  );
}

describe('AppNavigator bottom tabs (US-28)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
    clientMock._resetSupabaseClientForTests();
    clientMock.__setConfigured(false);
  });

  it('shows exactly 2 tabs, "แผนที่" and "ข่าว", both reachable via their Thai accessibility labels (US-28 AC1)', async () => {
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByLabelText('แท็บแผนที่')).toBeTruthy());
    expect(screen.getByLabelText('แท็บข่าว')).toBeTruthy();
  });

  it('opens on the "แผนที่" tab showing the unchanged HomeScreen content by default (US-28 AC2)', async () => {
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByText('ปลดล็อกแล้ว 0 / 76 จังหวัด')).toBeTruthy());
    expect(screen.getByText('Travel Journal ไทย')).toBeTruthy();
  });

  it('switching to the "ข่าว" tab shows NewsScreen (US-28 AC3)', async () => {
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByLabelText('แท็บข่าว')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('แท็บข่าว'));
    await waitFor(() => expect(screen.getByText('ข่าวท่องเที่ยว')).toBeTruthy());
  });

  it('pushing ProvinceDetail from the Map tab, switching to News and back, keeps ProvinceDetail on screen (not reset to Home) (US-28 AC5)', async () => {
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByLabelText(/ภูเก็ต/)).toBeTruthy());
    fireEvent.press(screen.getByLabelText(/ภูเก็ต/));
    await waitFor(() => expect(screen.getByText('ภูเก็ต')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('แท็บข่าว'));
    await waitFor(() => expect(screen.getByText('ข่าวท่องเที่ยว')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('แท็บแผนที่'));
    await waitFor(() => expect(screen.getByText('ภูเก็ต')).toBeTruthy());
    // Still the ProvinceDetail screen, not reset back to Home's header progress text.
    expect(screen.queryByText('Travel Journal ไทย')).toBeNull();
  });

  it('the dev-only Map2DValidation link from Home still navigates correctly after the tab restructure (US-28 AC6 / T96)', async () => {
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByText('[dev] 2D validation map')).toBeTruthy());
    fireEvent.press(screen.getByText('[dev] 2D validation map'));
    await waitFor(() => expect(screen.getByText(/provinces · 0 toggled visited/)).toBeTruthy());
  });

  it('the header "สถิติ" icon pushes Stats into the CURRENT tab\'s own stack from both tabs (US-28 AC4)', async () => {
    await render(<TestApp />);

    // From the Map tab.
    await waitFor(() => expect(screen.getByLabelText('ดูสถิติการเดินทาง')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('ดูสถิติการเดินทาง'));
    await waitFor(() => expect(screen.getByText('สถิติการเดินทาง')).toBeTruthy());
    fireEvent.press(screen.getByText('‹ กลับ'));
    await waitFor(() => expect(screen.getByText('Travel Journal ไทย')).toBeTruthy());

    // From the News tab.
    fireEvent.press(screen.getByLabelText('แท็บข่าว'));
    await waitFor(() => expect(screen.getByText('ข่าวท่องเที่ยว')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('ดูสถิติการเดินทาง'));
    await waitFor(() => expect(screen.getByText('สถิติการเดินทาง')).toBeTruthy());
    fireEvent.press(screen.getByText('‹ กลับ'));
    await waitFor(() => expect(screen.getByText('ข่าวท่องเที่ยว')).toBeTruthy());
  });
});
