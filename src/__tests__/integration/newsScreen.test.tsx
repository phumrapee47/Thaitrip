// T101-T109 / US-29-US-32: NewsScreen integration tests. `newsService` is
// mocked at the module boundary (no real network/AsyncStorage) so each test
// can deterministically control cache/fetch outcomes and assert on the
// resulting UI state — loading skeleton, list, empty state, error state
// (distinct from empty), cache indicator, pull-to-refresh, and the
// open-in-browser / invalid-link / offline toast flows (US-31/US-32).
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import type { RootStackParamList } from '../../navigation/types';
import NewsScreen from '../../screens/NewsScreen';

jest.mock('../../services/newsService');
const newsServiceMock = require('../../services/newsService');

// T115 / US-33 (รอบ 14): NewsCard now lazily calls this on mount for any item
// with no native RSS image — mocked here so this suite's assertions stay
// scoped to the RSS fetch/cache pipeline it was written to test, undisturbed
// by the separate og-image feature (covered by its own tests instead: see
// `src/services/ogImageService.test.ts` and `src/components/NewsCard.test.tsx`).
jest.mock('../../services/ogImageService', () => ({
  fetchOgImageForArticle: jest.fn(),
}));
const ogImageServiceMock = require('../../services/ogImageService');

const Stack = createNativeStackNavigator<RootStackParamList>();

function TestApp() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="News" component={NewsScreen} />
        <Stack.Screen name="Stats" component={() => null} />
        <Stack.Screen name="Settings" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const ITEM_A = { id: 'https://x/a', title: 'ข่าว A', link: 'https://x/a', summary: 'สรุป A', pubDate: '2026-06-01T00:00:00.000Z' };
const ITEM_B = { id: 'https://x/b', title: 'ข่าว B', link: 'https://x/b', summary: 'สรุป B', pubDate: '2026-05-01T00:00:00.000Z' };

function setupDefaults() {
  newsServiceMock.readNewsCache.mockResolvedValue(null);
  newsServiceMock.writeNewsCache.mockResolvedValue(new Date().toISOString());
  newsServiceMock.isCacheStale.mockReturnValue(false);
  newsServiceMock.isLikelyReachable.mockResolvedValue(true);
  newsServiceMock.NEWS_CACHE_TTL_MS = 45 * 60 * 1000;
  // T115 / รอบ 14: `jest.resetAllMocks()` above clears this mock's resolved
  // value every test — re-set it here (same pattern as the newsService mocks
  // above) so NewsCard's `.then(...)` on this call never sees `undefined`
  // returned synchronously instead of a Promise.
  ogImageServiceMock.fetchOgImageForArticle.mockResolvedValue(undefined);
}

describe('NewsScreen (US-29-US-32)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupDefaults();
  });

  it('shows the loading skeleton first, then the fetched list once resolved (US-29 AC1,4)', async () => {
    // Deliberately-pending promise (instead of an immediately-resolved mock)
    // so the "loading-first" state is actually observable in this test,
    // rather than settling before the first assertion runs.
    let resolveFetch!: (items: unknown[]) => void;
    newsServiceMock.fetchAndProcessNews.mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve; })
    );
    await render(<TestApp />);

    expect(screen.getByTestId('news-loading-skeleton')).toBeTruthy();

    await act(async () => {
      resolveFetch([ITEM_A, ITEM_B]);
    });

    await waitFor(() => expect(screen.getByText('ข่าว A')).toBeTruthy());
    expect(screen.getByText('ข่าว B')).toBeTruthy();
    expect(screen.queryByTestId('news-loading-skeleton')).toBeNull();
  });

  it('shows the Empty State (not the Error State) when the feed resolves with zero items (US-32 AC1)', async () => {
    newsServiceMock.fetchAndProcessNews.mockResolvedValue([]);
    await render(<TestApp />);

    await waitFor(() => expect(screen.getByText('ยังไม่มีข่าวในขณะนี้')).toBeTruthy());
    expect(screen.queryByText('ดึงข่าวไม่สำเร็จ ตรวจสอบการเชื่อมต่อเน็ตแล้วลองใหม่')).toBeNull();
  });

  it('shows the Error State (not the Empty State) when the fetch really fails and there is no cache (US-32 AC4)', async () => {
    newsServiceMock.fetchAndProcessNews.mockRejectedValue(new Error('network down'));
    await render(<TestApp />);

    await waitFor(() => expect(screen.getByText('ดึงข่าวไม่สำเร็จ ตรวจสอบการเชื่อมต่อเน็ตแล้วลองใหม่')).toBeTruthy());
    expect(screen.queryByText('ยังไม่มีข่าวในขณะนี้')).toBeNull();

    // Retry action re-invokes the same fetch (T89-style reusable retry).
    newsServiceMock.fetchAndProcessNews.mockResolvedValue([ITEM_A]);
    fireEvent.press(screen.getByLabelText('ลองอีกครั้ง'));
    await waitFor(() => expect(screen.getByText('ข่าว A')).toBeTruthy());
  });

  it('shows cached items immediately plus a Cache Indicator when a fresh fetch attempt fails (US-30 AC2)', async () => {
    const fetchedAt = '2026-06-01T10:30:00.000Z';
    newsServiceMock.readNewsCache.mockResolvedValue({ items: [ITEM_A], fetchedAt });
    newsServiceMock.isCacheStale.mockReturnValue(true); // stale -> triggers a background refetch attempt
    newsServiceMock.fetchAndProcessNews.mockRejectedValue(new Error('offline'));

    await render(<TestApp />);

    await waitFor(() => expect(screen.getByText('ข่าว A')).toBeTruthy());
    expect(screen.getByText(/กำลังแสดงข่าวจากแคช/)).toBeTruthy();
  });

  it('does not show the Cache Indicator once a live fetch succeeds (US-30 AC2 "hidden" state)', async () => {
    newsServiceMock.readNewsCache.mockResolvedValue({ items: [ITEM_A], fetchedAt: '2026-06-01T10:30:00.000Z' });
    newsServiceMock.isCacheStale.mockReturnValue(true);
    newsServiceMock.fetchAndProcessNews.mockResolvedValue([ITEM_A, ITEM_B]);

    await render(<TestApp />);

    await waitFor(() => expect(screen.getByText('ข่าว B')).toBeTruthy());
    expect(screen.queryByText(/กำลังแสดงข่าวจากแคช/)).toBeNull();
  });

  it('pull-to-refresh forces a live fetch regardless of TTL (US-29 AC3, US-30 AC4)', async () => {
    newsServiceMock.readNewsCache.mockResolvedValue({ items: [ITEM_A], fetchedAt: new Date().toISOString() });
    newsServiceMock.isCacheStale.mockReturnValue(false); // fresh cache -> no auto-fetch on mount
    newsServiceMock.fetchAndProcessNews.mockResolvedValue([ITEM_A, ITEM_B]);

    await render(<TestApp />);
    await waitFor(() => expect(screen.getByText('ข่าว A')).toBeTruthy());
    expect(newsServiceMock.fetchAndProcessNews).not.toHaveBeenCalled();

    const onRefresh = screen.getByTestId('news-list').props.refreshControl.props.onRefresh;
    await act(async () => {
      await onRefresh();
    });

    await waitFor(() => expect(newsServiceMock.fetchAndProcessNews).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText('ข่าว B')).toBeTruthy());
  });

  it('tapping a card with a valid link + reachable network opens the in-app browser at that link (US-31 AC1)', async () => {
    newsServiceMock.fetchAndProcessNews.mockResolvedValue([ITEM_A]);
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByText('ข่าว A')).toBeTruthy());

    fireEvent.press(screen.getByText('ข่าว A'));
    await waitFor(() => expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://x/a'));
  });

  it('shows the "ไม่สามารถเปิดข่าวนี้ได้" toast and never opens the browser when the link is empty/invalid (US-31 AC3)', async () => {
    newsServiceMock.fetchAndProcessNews.mockResolvedValue([{ ...ITEM_A, link: '' }]);
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByText('ข่าว A')).toBeTruthy());

    fireEvent.press(screen.getByText('ข่าว A'));
    await waitFor(() => expect(screen.getByText('ไม่สามารถเปิดข่าวนี้ได้')).toBeTruthy());
    expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
  });

  it('shows the offline toast and never opens the browser when there is no network at tap time (US-31 AC4)', async () => {
    newsServiceMock.fetchAndProcessNews.mockResolvedValue([ITEM_A]);
    newsServiceMock.isLikelyReachable.mockResolvedValue(false);
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByText('ข่าว A')).toBeTruthy());

    fireEvent.press(screen.getByText('ข่าว A'));
    await waitFor(() => expect(screen.getByText('ต้องเชื่อมต่ออินเทอร์เน็ตเพื่ออ่านข่าวเต็ม')).toBeTruthy());
    expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
  });

  it('shows a placeholder cover (not a broken image) for a news item with no image at all (US-32 AC2)', async () => {
    newsServiceMock.fetchAndProcessNews.mockResolvedValue([{ ...ITEM_A, imageUrl: undefined }]);
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByText('ข่าว A')).toBeTruthy());
    expect(screen.getByTestId('news-card-placeholder')).toBeTruthy();
  });
});
