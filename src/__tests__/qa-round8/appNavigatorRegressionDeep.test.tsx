// Independent Tester coverage (รอบ 8) for US-28 — goes beyond
// `integration/appNavigatorBottomTabs.test.tsx` (written by the programmer)
// in two ways:
//  1. Exercises the FULL Home -> ProvinceDetail -> AddEntry push chain (not
//     just Home -> ProvinceDetail) through the real bottom-tab navigator, and
//     confirms AddEntry (two levels deep in the Map tab's nested stack) also
//     survives a tab switch away-and-back without resetting (US-28 AC5).
//  2. Independently probes the programmer-flagged "cross-tab deep-link"
//     caveat (docs/dev-notes.md รอบ 7): StatsScreen's `navigate('Home')`
//     button, when StatsScreen is reached from the News tab (whose nested
//     stack has no `Home` route), is claimed to be a "safe no-op". This test
//     verifies that claim directly instead of taking it on faith.
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
// News functionality itself is out of scope for this file (covered in
// newsScreenRealServiceIntegration.test.tsx) — mocked here purely so the
// News tab renders deterministically and doesn't fire real fetch()/
// AsyncStorage calls while this file is only exercising navigation.
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

describe('AppNavigator deep regression (US-28, independent Tester coverage)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
    clientMock._resetSupabaseClientForTests();
    clientMock.__setConfigured(false);
  });

  it('Home -> ProvinceDetail -> AddEntry all push correctly inside the Map tab stack, and AddEntry (2 levels deep) survives a tab switch away and back (US-28 AC2/AC5)', async () => {
    await render(<TestApp />);

    await waitFor(() => expect(screen.getByLabelText(/ภูเก็ต/)).toBeTruthy());
    fireEvent.press(screen.getByLabelText(/ภูเก็ต/));
    await waitFor(() => expect(screen.getByText('ภูเก็ต')).toBeTruthy());

    // Province has 0 entries, so the EmptyState CTA (not the header "+" button)
    // is what's on screen — press it to push AddEntry.
    fireEvent.press(screen.getByText('+ เพิ่มบันทึกใหม่'));
    await waitFor(() => expect(screen.getByText('วันที่ *')).toBeTruthy());
    expect(screen.getByText('ชื่อสถานที่ *')).toBeTruthy();

    // Switch away to News, then back to Map.
    fireEvent.press(screen.getByLabelText('แท็บข่าว'));
    await waitFor(() => expect(screen.getByText('ข่าวท่องเที่ยว')).toBeTruthy());
    expect(screen.queryByText('วันที่ *')).toBeNull(); // AddEntry not visible while on News tab

    fireEvent.press(screen.getByLabelText('แท็บแผนที่'));
    // Must still be on AddEntry (2 levels deep), NOT reset to Home or to ProvinceDetail.
    await waitFor(() => expect(screen.getByText('วันที่ *')).toBeTruthy());
    expect(screen.queryByText('Travel Journal ไทย')).toBeNull();
  });

  it('StatsScreen\'s "ไปที่แผนที่" button, reached from the News tab (which has no Home route), does not crash and stays a safe no-op — but leaves the user stuck on an empty Stats screen with no way back to the map from that button (cross-tab deep-link gap, docs/dev-notes.md รอบ 7)', async () => {
    await render(<TestApp />);

    fireEvent.press(screen.getByLabelText('แท็บข่าว'));
    await waitFor(() => expect(screen.getByText('ข่าวท่องเที่ยว')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('ดูสถิติการเดินทาง'));
    await waitFor(() => expect(screen.getByText('ยังไม่มีบันทึกการเดินทางเลย เริ่มบันทึกทริปแรกได้จากแผนที่')).toBeTruthy());

    // Tap the CTA that calls navigation.navigate('Home') — 'Home' is not a
    // screen in NewsStack (nor in the Tab navigator itself), so per React
    // Navigation semantics this action is unhandled.
    expect(() => {
      fireEvent.press(screen.getByText('ไปที่แผนที่'));
    }).not.toThrow();

    // Confirmed: no crash. But also confirmed: nothing happens — the user is
    // still stranded on the exact same empty Stats screen, the "ไปที่แผนที่"
    // button did NOT switch back to the Map tab. This matches "safe no-op"
    // as the programmer described it, but it is a real, user-facing dead-end
    // for anyone who opens the app straight into the News tab with 0 entries
    // and taps Stats -> "ไปที่แผนที่" — see summary notes for whether this
    // should be filed as a UX follow-up (no AC in US-28/US-29-32 requires
    // this button to work cross-tab, so it is NOT scored as an AC failure).
    await waitFor(() =>
      expect(screen.getByText('ยังไม่มีบันทึกการเดินทางเลย เริ่มบันทึกทริปแรกได้จากแผนที่')).toBeTruthy()
    );
    expect(screen.queryByText('ข่าวท่องเที่ยว')).toBeNull();
    expect(screen.queryByText('Travel Journal ไทย')).toBeNull();
  });
});
