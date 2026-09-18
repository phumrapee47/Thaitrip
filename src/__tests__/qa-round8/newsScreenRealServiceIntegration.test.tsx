// Independent Tester coverage (รอบ 8) for US-29/US-30/US-32. Unlike
// `integration/newsScreen.test.tsx` (written by the programmer, which mocks
// `../../services/newsService` entirely at the module boundary), this file
// renders NewsScreen against the REAL `newsService` + `newsRssParser`
// pipeline — only `global.fetch` and AsyncStorage are faked — so it actually
// exercises the fetch -> XML-parse -> dedupe/sort -> cache -> render chain
// end to end, the way a real device would. This is the closest thing to a
// true e2e test achievable in this Jest/RNTL environment.
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import NewsScreen from '../../screens/NewsScreen';
import { writeNewsCache, NEWS_CACHE_TTL_MS } from '../../services/newsService';

// รอบ 14 (US-33) addition: NewsCard now lazily calls this on mount for any
// item with no native RSS image, using the SAME `global.fetch` this file
// mocks for the RSS pipeline itself — left un-mocked, every no-image item in
// `REALISTIC_FEED_WITH_EDGE_CASES` would add extra `global.fetch` calls this
// file's `toHaveBeenCalledTimes(1)` / `not.toHaveBeenCalled()` assertions
// (about the RSS fetch specifically) never anticipated. Mocked out here so
// this suite stays focused on the real RSS fetch -> parse -> cache pipeline
// it was written to test; the og-image feature has its own dedicated tests.
jest.mock('../../services/ogImageService', () => ({
  fetchOgImageForArticle: jest.fn().mockResolvedValue(undefined),
}));

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

const NEWS_CACHE_KEY = 'news_cache_v1'; // mirrors the private CACHE_KEY constant in newsService.ts

async function clearStorage() {
  const AsyncStorage = require('@react-native-async-storage/async-storage');
  await (AsyncStorage.default ?? AsyncStorage).clear();
}

function mockFetchOnce(xml: string, opts: { ok?: boolean; status?: number } = {}) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    text: async () => xml,
  }) as any;
}

const REALISTIC_FEED_WITH_EDGE_CASES = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
<title>Mock TAT Feed</title>
<item>
  <title><![CDATA[เทศกาลอาหารอัมพวา &amp; ตลาดน้ำ]]></title>
  <link>https://example.com/news/1</link>
  <pubDate>Sat, 12 Sep 2026 02:16:28 +0000</pubDate>
  <description><![CDATA[<p>รายละเอียด <b>เทศกาล</b> ที่อัมพวา</p>]]></description>
  <media:content url="https://example.com/img1.jpg" medium="image"/>
</item>
<item>
  <title>ข่าวซ้ำจากอีกหมวดหนึ่ง (ต้องถูก dedupe ทิ้ง)</title>
  <link>https://example.com/news/1</link>
  <pubDate>Sat, 12 Sep 2026 05:00:00 +0000</pubDate>
  <description>ลิงก์ซ้ำกับรายการแรกเป๊ะ ๆ — ต้องไม่แสดงซ้ำ</description>
</item>
<item>
  <title>ข่าวไม่มีรูปภาพเลย</title>
  <link>https://example.com/news/2</link>
  <pubDate>Fri, 11 Sep 2026 10:00:00 +0000</pubDate>
  <description>ไม่มี enclosure ไม่มี media:content ไม่มี img ใน description เลย</description>
</item>
<item>
  <title>ข่าวไม่มีวันที่เผยแพร่ที่ parse ได้</title>
  <link>https://example.com/news/3</link>
  <description>pubDate ขาดไปทั้ง tag — ต้องอยู่ท้ายสุดของลิสต์ ไม่ทำให้ล่ม</description>
</item>
</channel>
</rss>`;

const EMPTY_FEED = `<?xml version="1.0"?><rss version="2.0"><channel><title>Empty</title></channel></rss>`;

describe('NewsScreen + real newsService/newsRssParser (independent Tester e2e coverage)', () => {
  beforeEach(async () => {
    await clearStorage();
  });

  it('fetches a realistic mocked RSS response and renders it end-to-end: entity-decoded/HTML-stripped text, dedupe by link, missing-image placeholder, and the no-pubDate item sorted last (US-29 AC1,2,5 / US-32 AC2,3,5)', async () => {
    // Note: unlike the programmer's own newsScreen.test.tsx (which uses a
    // deliberately-pending mock promise to observe the loading skeleton),
    // this file uses an already-resolved fetch mock, and `await render()`
    // flushes effects fully — so the skeleton state is not independently
    // observable here. Skeleton visibility itself is already covered by the
    // programmer's test; this test's focus is the real parse/dedupe/sort
    // pipeline below.
    mockFetchOnce(REALISTIC_FEED_WITH_EDGE_CASES);
    await render(<TestApp />);

    await waitFor(() => expect(screen.getByText('เทศกาลอาหารอัมพวา & ตลาดน้ำ')).toBeTruthy());
    // Entity decoded (&amp; -> &) and HTML-stripped summary text, not raw HTML.
    expect(screen.getByText('รายละเอียด เทศกาล ที่อัมพวา')).toBeTruthy();

    // Deduped: the second item sharing the same link must NOT render.
    expect(screen.queryByText('ข่าวซ้ำจากอีกหมวดหนึ่ง (ต้องถูก dedupe ทิ้ง)')).toBeNull();

    // No-image item shows the placeholder, not a broken/empty image.
    expect(screen.getByText('ข่าวไม่มีรูปภาพเลย')).toBeTruthy();

    // No-pubDate item still renders (does not break the whole list).
    expect(screen.getByText('ข่าวไม่มีวันที่เผยแพร่ที่ parse ได้')).toBeTruthy();

    // Exactly 2 of the 3 rendered items have no image -> 2 placeholders.
    expect(screen.getAllByTestId('news-card-placeholder')).toHaveLength(2);
    expect(screen.getByTestId('news-card-image')).toBeTruthy();

    // Order check: item /1 (Sep 12 02:16) before item /2 (Sep 11 10:00)
    // before item /3 (no date, sorted last) — verified via FlatList data order.
    const list = screen.getByTestId('news-list');
    const ids = list.props.data.map((i: { id: string }) => i.id);
    expect(ids).toEqual(['https://example.com/news/1', 'https://example.com/news/2', 'https://example.com/news/3']);

    expect(screen.queryByTestId('news-loading-skeleton')).toBeNull();
  });

  it('a feed that parses successfully but has zero <item> entries shows the Empty State, distinct from the Error State (US-32 AC1)', async () => {
    mockFetchOnce(EMPTY_FEED);
    await render(<TestApp />);

    await waitFor(() => expect(screen.getByText('ยังไม่มีข่าวในขณะนี้')).toBeTruthy());
    expect(screen.queryByText('ดึงข่าวไม่สำเร็จ ตรวจสอบการเชื่อมต่อเน็ตแล้วลองใหม่')).toBeNull();
  });

  it('no cache + real fetch failure (HTTP 503) shows the Error State, and retry with a working fetch recovers the list (US-32 AC4)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, text: async () => '' }) as any;
    await render(<TestApp />);

    await waitFor(() => expect(screen.getByText('ดึงข่าวไม่สำเร็จ ตรวจสอบการเชื่อมต่อเน็ตแล้วลองใหม่')).toBeTruthy());

    mockFetchOnce(REALISTIC_FEED_WITH_EDGE_CASES);
    fireEvent.press(screen.getByLabelText('ลองอีกครั้ง'));
    await waitFor(() => expect(screen.getByText('เทศกาลอาหารอัมพวา & ตลาดน้ำ')).toBeTruthy());
  });

  it('an existing STALE cache (older than the 45-min TTL) is shown immediately while offline, with the cache indicator visible, when the background refresh attempt fails (US-30 AC2,4)', async () => {
    const staleItems = [
      { id: 'https://example.com/old', title: 'ข่าวเก่าจากแคช', link: 'https://example.com/old', summary: 'สรุปเก่า' },
    ];
    const staleTimestamp = new Date(Date.now() - NEWS_CACHE_TTL_MS - 5 * 60 * 1000).toISOString();
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    await (AsyncStorage.default ?? AsyncStorage).setItem(
      NEWS_CACHE_KEY,
      JSON.stringify({ items: staleItems, fetchedAt: staleTimestamp })
    );

    global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed')) as any;
    await render(<TestApp />);

    // Cache shown immediately without waiting for the (failing) network call.
    await waitFor(() => expect(screen.getByText('ข่าวเก่าจากแคช')).toBeTruthy());
    expect(screen.getByText(/กำลังแสดงข่าวจากแคช/)).toBeTruthy();
    expect(screen.queryByText('ดึงข่าวไม่สำเร็จ ตรวจสอบการเชื่อมต่อเน็ตแล้วลองใหม่')).toBeNull();
  });

  it('[POTENTIAL AC GAP] a FRESH cache (written moments ago, well within the 45-min TTL) still shows the cache indicator on a normal reopen — even though no fetch was attempted and nothing failed (US-30 AC2 ties the indicator to the offline/failed-fetch fallback case, not to "any time we are technically reading from storage")', async () => {
    const freshItems = [
      { id: 'https://example.com/fresh', title: 'ข่าวสดใหม่จากแคชปัจจุบัน', link: 'https://example.com/fresh', summary: 'สรุปใหม่' },
    ];
    await writeNewsCache(freshItems as any); // fetchedAt = now, well inside the TTL

    global.fetch = jest.fn(); // must NOT be called — cache is fresh, no auto-fetch should fire
    await render(<TestApp />);

    await waitFor(() => expect(screen.getByText('ข่าวสดใหม่จากแคชปัจจุบัน')).toBeTruthy());
    expect(global.fetch).not.toHaveBeenCalled();

    // This assertion documents ACTUAL current behavior (it passes) — the cache
    // indicator shows even on a routine, fully-up-to-date reopen with no
    // error at all. See docs/test-report.md รอบ 8 for why this is flagged as
    // a UX-level discrepancy worth a PM/BA decision, not scored as a hard AC
    // failure (no AC explicitly says the indicator must be hidden when the
    // cache is still within TTL and no fetch attempt occurred).
    expect(screen.getByText(/กำลังแสดงข่าวจากแคช/)).toBeTruthy();
  });

  it('pull-to-refresh against the real service performs a genuine new fetch() call and clears the cache indicator on success (US-29 AC3, US-30 AC2 "hidden" state)', async () => {
    const freshItems = [
      { id: 'https://example.com/fresh', title: 'ข่าวสดใหม่จากแคชปัจจุบัน', link: 'https://example.com/fresh', summary: 'สรุปใหม่' },
    ];
    await writeNewsCache(freshItems as any);
    mockFetchOnce(REALISTIC_FEED_WITH_EDGE_CASES);

    await render(<TestApp />);
    await waitFor(() => expect(screen.getByText('ข่าวสดใหม่จากแคชปัจจุบัน')).toBeTruthy());
    expect(global.fetch).not.toHaveBeenCalled();

    const onRefresh = screen.getByTestId('news-list').props.refreshControl.props.onRefresh;
    await act(async () => {
      await onRefresh();
    });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText('เทศกาลอาหารอัมพวา & ตลาดน้ำ')).toBeTruthy());
    expect(screen.queryByText(/กำลังแสดงข่าวจากแคช/)).toBeNull();
  });
});
