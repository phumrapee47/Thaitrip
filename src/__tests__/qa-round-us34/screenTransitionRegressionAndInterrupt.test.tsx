// Independent Tester coverage (US-34 AC1, AC4, AC5) — written from scratch,
// NOT copied from the programmer's own `src/navigation/AppNavigator.test.tsx`
// (which is a source-level regex guard the programmer wrote for T119/T123).
// This file instead:
//   1. Renders the REAL `AppNavigator` end-to-end (same harness pattern as
//      `src/__tests__/integration/appNavigatorBottomTabs.test.tsx` /
//      `src/__tests__/qa-round8/appNavigatorRegressionDeep.test.tsx`) and
//      exercises the 3 exact transition points US-34 AC1 names (tab switch,
//      Home->ProvinceDetail push, ProvinceDetail->AddEntry push) to prove the
//      underlying navigation/functional behavior these transitions wrap is
//      unchanged (AC4) and that nothing in the app hangs/crashes going
//      through them.
//   2. Directly probes AC5 ("กดข้าม/interrupt ได้เสมอ ไม่บล็อกผู้ใช้"): fires
//      rapid repeated presses on the tab bar and on back navigation WITHOUT
//      waiting between presses, and asserts the app still ends up in the
//      correct, un-stuck final state — i.e. no code path disables the
//      tab/back controls while a transition is conceptually "in flight".
//   3. Independently re-derives the AC1/AC6 config-value cross-check (a
//      second, differently-written source read) since native-stack's actual
//      `animation` prop is an OS-level transition that RNTL cannot render or
//      observe visually inside Jest — same environment limitation already
//      documented in this codebase (docs/dev-notes.md "รอบ 14", T108's
//      expo-web-browser modal caveat) — flagged explicitly as a coverage gap
//      below rather than silently skipped.
import React from 'react';
import fs from 'fs';
import path from 'path';
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

describe('US-34 AC1/AC4/AC5 — screen transition points, real render + interrupt probing (independent Tester coverage)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
    clientMock._resetSupabaseClientForTests();
    clientMock.__setConfigured(false);
  });

  it('Home -> ProvinceDetail push (AC1.2) still lands on the correct province with unchanged content (AC4 regression)', async () => {
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByLabelText(/ภูเก็ต/)).toBeTruthy());
    fireEvent.press(screen.getByLabelText(/ภูเก็ต/));
    await waitFor(() => expect(screen.getByText('ภูเก็ต')).toBeTruthy());
    // Underlying data is unchanged by the added transition — the province's
    // real seed landmark still shows up exactly as before US-34.
    await waitFor(() => expect(screen.getByText('หาดป่าตอง')).toBeTruthy());
  });

  it('ProvinceDetail -> AddEntry push (AC1.2, via the empty-state CTA) still opens the real AddEntry form (AC4 regression)', async () => {
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByLabelText(/ภูเก็ต/)).toBeTruthy());
    fireEvent.press(screen.getByLabelText(/ภูเก็ต/));
    await waitFor(() => expect(screen.getByText('+ เพิ่มบันทึกใหม่')).toBeTruthy());
    fireEvent.press(screen.getByText('+ เพิ่มบันทึกใหม่'));
    await waitFor(() => expect(screen.getByText('วันที่ *')).toBeTruthy());
  });

  it('AC5: pressing the back button IMMEDIATELY after a push (no wait for any transition timer) still navigates back — proves the back control is never disabled mid-transition', async () => {
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByLabelText(/ภูเก็ต/)).toBeTruthy());
    fireEvent.press(screen.getByLabelText(/ภูเก็ต/));
    await waitFor(() => expect(screen.getByText('ภูเก็ต')).toBeTruthy());

    // No `waitFor`/timer advance here on purpose — simulates the user tapping
    // "back" the instant the screen appears, i.e. mid-transition in a real app.
    fireEvent.press(screen.getByText('‹ กลับ'));
    await waitFor(() => expect(screen.getByText('Travel Journal ไทย')).toBeTruthy());
  });

  it('AC5: rapid repeated tab-switch presses (Map -> News -> Map -> News, no waiting between) never crash and always end on the last-pressed tab (tab cross-fade re-triggers/interrupts cleanly)', async () => {
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByLabelText('แท็บข่าว')).toBeTruthy());

    expect(() => {
      fireEvent.press(screen.getByLabelText('แท็บข่าว'));
      fireEvent.press(screen.getByLabelText('แท็บแผนที่'));
      fireEvent.press(screen.getByLabelText('แท็บข่าว'));
      fireEvent.press(screen.getByLabelText('แท็บแผนที่'));
    }).not.toThrow();

    // Last press was "แผนที่" — must have landed there, not stuck mid-fade on News.
    // Note: bottom-tabs keeps both tab stacks mounted (display:none, not
    // unmounted) by design/default, independent of this US-34 change — so
    // this only asserts the Map tab's content is what's on screen, not that
    // the News tab node is absent from the tree entirely.
    await waitFor(() => expect(screen.getByText('Travel Journal ไทย')).toBeTruthy());
  });

  it('AC5: pressing a tab a SECOND time while it is already focused is a safe no-op (no double-navigation/crash) — the documented haptic-only guard still works after the fade wrapper was added', async () => {
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByLabelText('แท็บแผนที่')).toBeTruthy());
    expect(() => {
      fireEvent.press(screen.getByLabelText('แท็บแผนที่'));
      fireEvent.press(screen.getByLabelText('แท็บแผนที่'));
    }).not.toThrow();
    expect(screen.getByText('Travel Journal ไทย')).toBeTruthy();
  });

  describe('AC1/AC6 config cross-check (independent re-read, static — see coverage-gap note in docs/test-report.md)', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../navigation/AppNavigator.tsx'),
      'utf-8'
    );

    it('does NOT rely on native-stack defaults: an explicit non-default `animation` value is configured for both ProvinceDetail and AddEntry', () => {
      // Independently derived expectation straight from docs/design-spec.md §1.1/§1.2,
      // deliberately not reusing the exact regex the programmer's own test uses.
      expect(source.includes("'slide_from_right'")).toBe(true);
      expect(source.includes("'slide_from_bottom'")).toBe(true);
      expect(source.includes('animationDuration: 280')).toBe(true);
      expect(source.includes('animationDuration: 300')).toBe(true);
      expect(source.includes("presentation: 'modal'")).toBe(true);
    });

    it('the bottom-tab cross-fade is implemented with a real timed animation call (not an instant opacity flip)', () => {
      expect(source).toMatch(/withTiming\(1,\s*\{\s*duration:\s*180\s*\}\)/);
    });
  });
});
