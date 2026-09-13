// QA round 3 (US-18) — LandmarkMap exercised through the REAL, full
// ProvinceDetailScreen (not the isolated component tests in
// src/components/LandmarkMap.test.tsx, and not the pure-function tests in
// src/utils/landmarkMap.test.ts). This is the "component ทำงานถูกครบวงจร"
// check requested for this round: real dataset, real storage mock, real
// CheckinContext, tapping a map point end-to-end through to persisted
// check-in state and the list below.
//
// The degenerate-bounding-box (single-coordinate-landmark) case is covered
// separately in landmarkMapDegenerateBbox.test.tsx, which needs a *static*
// jest.mock of the dataset module (no real province currently ships with
// exactly one coordinate'd landmark) — keeping that in its own file avoids
// mixing a mocked dataset with the real one inside a single module graph.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import ProvinceDetailScreen from '../../screens/ProvinceDetailScreen';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';

jest.mock('../../storage/db');
const dbMock = require('../../storage/db');

// T87 / US-25: fetchAttractionsForProvince now throws on a real fetch
// failure instead of silently resolving to []. This suite runs against the
// real ProvinceDetailScreen without network access, so the Wikipedia
// enrichment call must be mocked to genuinely succeed with 0 results — this
// is what "chaiyaphum has zero curated landmarks" is actually testing here
// (the old empty array previously came from a swallowed fetch error, which
// coincidentally looked the same but is no longer the correct simulation).
jest.mock('../../services/wikipediaService');
const wikipediaServiceMock = require('../../services/wikipediaService');
wikipediaServiceMock.fetchAttractionsForProvince.mockResolvedValue([]);

const Stack = createNativeStackNavigator<RootStackParamList>();

function TestApp({ provinceId }: { provinceId: string }) {
  return (
    <JournalProvider>
      <CheckinProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProvinceDetail" component={ProvinceDetailScreen} initialParams={{ provinceId }} />
          </Stack.Navigator>
        </NavigationContainer>
      </CheckinProvider>
    </JournalProvider>
  );
}

describe('LandmarkMap wired through the real ProvinceDetailScreen (US-18)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
  });

  it('tapping a point on the map for a real curated province (krabi) toggles the SAME landmark id shown in the list, and persists it', async () => {
    await render(<TestApp provinceId="krabi" />);
    await waitFor(() => expect(screen.getByText('เช็คอินแล้ว 0/3 แห่ง')).toBeTruthy());

    // Advanced UI/UX upgrade: the map no longer renders by default (it would
    // crowd the photo cards in the first fold) — switch to map mode first via
    // the card/map toggle. Wait for the switch to actually commit (checked via
    // the toggle's own state, not a label shared with other elements) before
    // firing the next press — chaining state-changing presses back-to-back
    // without an intervening flush point has been observed to leave a later
    // press in this same test silently not-committed.
    fireEvent.press(screen.getByLabelText('มุมมองแผนที่'));
    await waitFor(() =>
      expect(screen.getByLabelText('มุมมองแผนที่').props.accessibilityState.selected).toBe(true)
    );

    // The map's point for หาดไร่เลย์ (kbi-railay-beach) — real coords from the
    // shipped dataset, not a mock.
    const mapPoint = screen.getByLabelText('หาดไร่เลย์, ยังไม่ได้เช็คอิน');
    fireEvent.press(mapPoint);

    // Progress indicator (fed by the SAME checkins state as the map, and
    // visible in both view modes) updates.
    await waitFor(() => expect(screen.getByText('เช็คอินแล้ว 1/3 แห่ง')).toBeTruthy());
    await waitFor(() => expect(screen.getByLabelText('หาดไร่เลย์, เช็คอินแล้ว')).toBeTruthy());

    // And the underlying storage mock recorded a check-in keyed by that exact id.
    const stored = dbMock.__getCheckinStore();
    expect(stored).toContainEqual(
      expect.objectContaining({ landmarkId: 'kbi-railay-beach', provinceId: 'krabi', visited: true })
    );

    // Switching to card mode proves the list reads the SAME underlying
    // checkins state the map just wrote — not a mismatched/different id.
    // Wait for the toggle's OWN (unambiguous) selected state, not the shared
    // "..., เช็คอินแล้ว" label — that label matches both the map circle and
    // the card's check-in button, so asserting on it here would pass even if
    // the mode switch itself hadn't actually committed yet.
    fireEvent.press(screen.getByLabelText('มุมมองการ์ด'));
    await waitFor(() =>
      expect(screen.getByLabelText('มุมมองการ์ด').props.accessibilityState.selected).toBe(true)
    );
    await waitFor(() => expect(screen.getByLabelText('หาดไร่เลย์, เช็คอินแล้ว')).toBeTruthy());

    // And toggling it back off from the card view (a plain title press, same
    // mechanism already covered by landmarkCheckin.test.tsx) confirms the
    // state genuinely round-trips both ways, not just one-directionally.
    fireEvent.press(screen.getByText('หาดไร่เลย์'));
    await waitFor(() => expect(screen.getByText('เช็คอินแล้ว 0/3 แห่ง')).toBeTruthy());
  });

  it('a province with zero curated landmarks (chaiyaphum) shows the US-8 not-curated empty state through the real screen, never the map fallback text, and never errors', async () => {
    await render(<TestApp provinceId="chaiyaphum" />);
    await waitFor(() =>
      expect(screen.getByText('ยังไม่มีข้อมูลสถานที่แนะนำสำหรับจังหวัดนี้')).toBeTruthy()
    );
    // LandmarkMap is never rendered at all in this branch (LandmarkList returns
    // early for landmarks.length === 0) — its own "no coordinates" fallback text
    // must NOT appear here; these are two different empty states for two
    // different reasons (US-8 AC4 vs US-18 AC2) and must not be conflated.
    expect(screen.queryByText('ยังไม่มีข้อมูลตำแหน่งสำหรับสถานที่แนะนำของจังหวัดนี้')).toBeNull();
  });
});
