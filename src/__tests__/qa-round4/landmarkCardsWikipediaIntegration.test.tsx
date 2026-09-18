// Independent Tester integration coverage for US-22/US-23 (รอบ 5: Landmark Cards
// & Media Integration). wikipediaService.test.ts only unit-tests the service with
// mocked `fetch` — it never renders LandmarkCard/LandmarkList through a real
// screen. These tests close that gap by mocking the service module itself and
// exercising ProvinceDetailScreen -> LandmarkList -> LandmarkCard end-to-end.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import ProvinceDetailScreen from '../../screens/ProvinceDetailScreen';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';
import type { Landmark } from '../../data/thailand-landmarks';
import { FALLBACK_LANDMARK_IMAGE } from '../../theme';

jest.mock('../../storage/db');
const dbMock = require('../../storage/db');

jest.mock('../../services/wikipediaService');
const wikipediaServiceMock = require('../../services/wikipediaService');

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

const WIKI_LANDMARK: Landmark = {
  id: 'wiki-phuket-hat-kata',
  provinceId: 'phuket',
  nameTh: 'หาดกะตะ',
  description: 'หาดทรายขาวยอดนิยมทางใต้ของเกาะภูเก็ต',
  imageUrl: 'https://upload.wikimedia.org/wiki/kata-beach.jpg',
  category: 'ทะเลและชายหาด',
};

const WIKI_LANDMARK_NO_IMAGE: Landmark = {
  id: 'wiki-phuket-some-museum',
  provinceId: 'phuket',
  nameTh: 'พิพิธภัณฑ์ไข่มุกภูเก็ต',
  description: '',
  imageUrl: undefined,
  category: 'ประวัติศาสตร์และวัฒนธรรม',
};

describe('LandmarkList + LandmarkCard Wikipedia integration (US-22)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
    jest.clearAllMocks();
  });

  it('shows Wikipedia-sourced cards alongside the existing local seed landmarks, not replacing them (AC1)', async () => {
    wikipediaServiceMock.fetchAttractionsForProvince.mockResolvedValue([WIKI_LANDMARK]);
    await render(<TestApp provinceId="phuket" />);

    // Local seed landmark for phuket (thailand-landmarks.ts) must still be present.
    await waitFor(() => expect(screen.getByText('หาดป่าตอง')).toBeTruthy());
    // Wikipedia-sourced card appears alongside it.
    await waitFor(() => expect(screen.getByText('หาดกะตะ')).toBeTruthy());
  });

  it('renders image, category badge, and description on a Wikipedia card (AC2)', async () => {
    wikipediaServiceMock.fetchAttractionsForProvince.mockResolvedValue([WIKI_LANDMARK]);
    await render(<TestApp provinceId="phuket" />);

    await waitFor(() => expect(screen.getByText('หาดกะตะ')).toBeTruthy());
    // 'ทะเลและชายหาด' appears both as the category filter chip and as the card's category badge.
    expect(screen.getAllByText('ทะเลและชายหาด').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('หาดทรายขาวยอดนิยมทางใต้ของเกาะภูเก็ต')).toBeTruthy();
  });

  it('shows a real landscape placeholder photo (not a broken/blank area) for a card with no image at all (AC3)', async () => {
    wikipediaServiceMock.fetchAttractionsForProvince.mockResolvedValue([WIKI_LANDMARK_NO_IMAGE]);
    await render(<TestApp provinceId="phuket" />);

    await waitFor(() => expect(screen.getByText('พิพิธภัณฑ์ไข่มุกภูเก็ต')).toBeTruthy());
    // Advanced UI/UX upgrade: LandmarkCard falls back to a real Wikimedia
    // landscape photo (FALLBACK_LANDMARK_IMAGE) instead of a bare icon box
    // when imageUrl is absent, so the card never reads as broken/empty.
    const images = screen.getAllByTestId('landmark-card-image');
    expect(images.some((img) => img.props.source?.uri === FALLBACK_LANDMARK_IMAGE)).toBe(true);
  });

  it('check-in button toggles CheckinContext and exposes an accessible switch role (AC4)', async () => {
    wikipediaServiceMock.fetchAttractionsForProvince.mockResolvedValue([WIKI_LANDMARK]);
    await render(<TestApp provinceId="phuket" />);

    await waitFor(() => expect(screen.getByText('หาดกะตะ')).toBeTruthy());
    const checkinButton = screen.getByLabelText('หาดกะตะ, ยังไม่ได้เช็คอิน');
    expect(checkinButton.props.accessibilityRole).toBe('switch');
    expect(checkinButton.props.accessibilityState).toEqual({ checked: false });

    fireEvent.press(checkinButton);

    await waitFor(() => expect(screen.getByLabelText('หาดกะตะ, เช็คอินแล้ว')).toBeTruthy());
    const stored = dbMock.__getCheckinStore();
    expect(stored.find((c: any) => c.landmarkId === 'wiki-phuket-hat-kata')?.visited).toBe(true);
  });

  it('falls back to local-only landmarks (no crash, no infinite loading) when the Wikipedia fetch fails (AC5)', async () => {
    wikipediaServiceMock.fetchAttractionsForProvince.mockRejectedValue(new Error('network down'));
    await render(<TestApp provinceId="phuket" />);

    // Local seed landmarks must still render.
    await waitFor(() => expect(screen.getByText('หาดป่าตอง')).toBeTruthy());
    expect(screen.getByText('พระใหญ่ภูเก็ต')).toBeTruthy();
    // No leftover Wikipedia loading indicator stuck forever.
    await waitFor(() => expect(screen.queryByText('กำลังค้นหารูปภาพและสถานที่เพิ่มเติม...')).toBeNull());
  });

  it('still shows the old US-8 empty state for a province with no local seed data and no Wikipedia results (AC6)', async () => {
    wikipediaServiceMock.fetchAttractionsForProvince.mockResolvedValue([]);
    // "si-sa-ket" has zero curated/OSM landmark entries in thailand-landmarks.ts.
    await render(<TestApp provinceId="si-sa-ket" />);

    await waitFor(() => expect(screen.getByText('ยังไม่มีข้อมูลสถานที่แนะนำสำหรับจังหวัดนี้')).toBeTruthy());
  });
});

describe('LandmarkList in-province search & category filter (US-23)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
    jest.clearAllMocks();
    wikipediaServiceMock.fetchAttractionsForProvince.mockResolvedValue([WIKI_LANDMARK, WIKI_LANDMARK_NO_IMAGE]);
    // Live Universal Search (added after this test file): the real
    // searchAttractionsGlobal always resolves to an array (it catches its own
    // errors internally), but jest's auto-mock defaults an unstubbed export to
    // a plain `jest.fn()` returning `undefined` — which crashes
    // `liveResults.filter(...)` in LandmarkList once the search debounce fires.
    wikipediaServiceMock.searchAttractionsGlobal.mockResolvedValue([]);
  });

  it('filters the visible cards in real time by name as the user types, scoped to this province only (AC1)', async () => {
    await render(<TestApp provinceId="phuket" />);
    await waitFor(() => expect(screen.getByText('หาดกะตะ')).toBeTruthy());

    fireEvent.changeText(screen.getByPlaceholderText(/ค้นหาสถานที่ใน/), 'กะตะ');

    await waitFor(() => {
      expect(screen.getByText('หาดกะตะ')).toBeTruthy();
      expect(screen.queryByText('หาดป่าตอง')).toBeNull();
      expect(screen.queryByText('พิพิธภัณฑ์ไข่มุกภูเก็ต')).toBeNull();
    });
  });

  it('combines category filter with search text using AND condition (AC2)', async () => {
    await render(<TestApp provinceId="phuket" />);
    await waitFor(() => expect(screen.getByText('หาดกะตะ')).toBeTruthy());

    // Pick the "ทะเลและชายหาด" category chip (first match is the filter chip itself) — only the beach card should remain.
    fireEvent.press(screen.getAllByText('ทะเลและชายหาด')[0]);
    await waitFor(() => {
      expect(screen.getByText('หาดกะตะ')).toBeTruthy();
      expect(screen.queryByText('พิพิธภัณฑ์ไข่มุกภูเก็ต')).toBeNull();
    });

    // Now add a search term that does not match the remaining category-filtered card.
    fireEvent.changeText(screen.getByPlaceholderText(/ค้นหาสถานที่ใน/), 'พิพิธภัณฑ์');
    await waitFor(() => expect(screen.getByText('ไม่พบสถานที่ที่ตรงกับการค้นหา')).toBeTruthy());
  });

  it('shows a distinct "no results for this search/filter" empty state, separate from the AC6 no-data empty state (AC3)', async () => {
    await render(<TestApp provinceId="phuket" />);
    await waitFor(() => expect(screen.getByText('หาดกะตะ')).toBeTruthy());

    fireEvent.changeText(screen.getByPlaceholderText(/ค้นหาสถานที่ใน/), 'ไม่มีสถานที่แบบนี้แน่นอน');

    await waitFor(() => expect(screen.getByText('ไม่พบสถานที่ที่ตรงกับการค้นหา')).toBeTruthy());
    // Distinct from the "province has zero landmark data at all" empty state copy.
    expect(screen.queryByText('ยังไม่มีข้อมูลสถานที่แนะนำ')).toBeNull();
  });

  it('search/filter does not affect the checked-in progress count, which still reflects the full unfiltered list (AC3 of US-23)', async () => {
    await render(<TestApp provinceId="phuket" />);
    await waitFor(() => expect(screen.getByText('หาดกะตะ')).toBeTruthy());

    // 4 local seed landmarks for phuket + 2 wiki landmarks = 6 total.
    await waitFor(() => expect(screen.getByText('เช็คอินแล้ว 0/6 แห่ง')).toBeTruthy());

    fireEvent.changeText(screen.getByPlaceholderText(/ค้นหาสถานที่ใน/), 'กะตะ');

    // Progress indicator text must remain based on the full list, not the filtered view.
    await waitFor(() => expect(screen.getByText('เช็คอินแล้ว 0/6 แห่ง')).toBeTruthy());
  });
});
