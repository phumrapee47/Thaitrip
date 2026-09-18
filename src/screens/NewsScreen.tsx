import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  fetchAndProcessNews,
  isLikelyReachable,
  isCacheStale,
  readNewsCache,
  writeNewsCache,
  type NewsItem,
} from '../services/newsService';
import NewsCard from '../components/NewsCard';
import NewsLoadingSkeleton from '../components/NewsLoadingSkeleton';
import NewsCacheIndicator from '../components/NewsCacheIndicator';
import NewsErrorState from '../components/NewsErrorState';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import PressableScale from '../components/PressableScale';
import EntranceFadeItem from '../components/EntranceFadeItem';
import { useEntrancePlayedOnce } from '../hooks/useEntrancePlayedOnce';
import { COLORS, SPACING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'News'>;

const LINK_INVALID_MESSAGE = 'ไม่สามารถเปิดข่าวนี้ได้';
const OFFLINE_MESSAGE = 'ต้องเชื่อมต่ออินเทอร์เน็ตเพื่ออ่านข่าวเต็ม';

function isValidHttpUrl(url: string): boolean {
  return /^https?:\/\/.+/i.test(url.trim());
}

/**
 * T101-T108 / US-29-US-32: NewsScreen — the "ข่าว" tab's root screen.
 * Stale-while-revalidate: cache (if any) is shown immediately, then a live
 * fetch runs in the background (always on mount when there's no cache or the
 * cache is stale; always, unconditionally, on pull-to-refresh) and swaps the
 * list in on success without ever hiding already-visible items.
 */
export default function NewsScreen({ navigation }: Props) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loadingFirst, setLoadingFirst] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  // T88-style dedicated error flag (US-25 pattern reused per T103): true only
  // when a live fetch attempt actually threw AND there is nothing else to show.
  const [fetchError, setFetchError] = useState(false);
  const [isShowingCache, setIsShowingCache] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const itemsRef = useRef<NewsItem[]>([]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  /** T97-T100: single reusable "go fetch live now" action — used by the
   * initial stale-cache refresh, pull-to-refresh, and the error state's
   * "ลองอีกครั้ง" button alike (same pattern as LandmarkList's T89 retry). */
  const loadLive = useCallback(async () => {
    try {
      const fresh = await fetchAndProcessNews();
      if (!isMountedRef.current) return;
      setItems(fresh);
      itemsRef.current = fresh;
      setIsShowingCache(false);
      setFetchError(false);
      const fetchedAt = await writeNewsCache(fresh);
      if (isMountedRef.current) setCacheTimestamp(fetchedAt);
    } catch {
      if (!isMountedRef.current) return;
      if (itemsRef.current.length === 0) {
        setFetchError(true);
      } else {
        // US-30 AC2: keep showing what we already have, just flag it as cache.
        setIsShowingCache(true);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await readNewsCache();
      if (cancelled || !isMountedRef.current) return;
      if (cached && cached.items.length > 0) {
        setItems(cached.items);
        itemsRef.current = cached.items;
        setCacheTimestamp(cached.fetchedAt);
        setIsShowingCache(true);
      }
      const shouldFetch = !cached || cached.items.length === 0 || isCacheStale(cached.fetchedAt);
      if (shouldFetch) {
        await loadLive();
      }
      if (!cancelled && isMountedRef.current) setLoadingFirst(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePullToRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadLive();
    if (isMountedRef.current) setRefreshing(false);
  }, [loadLive]);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    await loadLive();
    if (isMountedRef.current) setRetrying(false);
  }, [loadLive]);

  // T105-T108 / US-31, US-32 AC2: tap a card -> open the source link in the
  // in-app browser. Validates the link and (opportunistically) network
  // reachability BEFORE opening, so a bad link/offline device never shows a
  // hung blank in-app browser (US-31 AC3/AC4) — errors surface as a transient
  // toast instead, and the list/scroll position underneath is untouched
  // either way (US-31 AC2), since none of this ever unmounts NewsScreen.
  const handleOpenNews = useCallback(async (item: NewsItem) => {
    const link = item.link?.trim();
    if (!link || !isValidHttpUrl(link)) {
      setToastMessage(LINK_INVALID_MESSAGE);
      return;
    }

    const reachable = await isLikelyReachable(link);
    if (!isMountedRef.current) return;
    if (!reachable) {
      setToastMessage(OFFLINE_MESSAGE);
      return;
    }

    try {
      await WebBrowser.openBrowserAsync(link);
    } catch {
      if (isMountedRef.current) setToastMessage(LINK_INVALID_MESSAGE);
    }
  }, []);

  const handleHideToast = useCallback(() => setToastMessage(null), []);

  const showCacheIndicator = isShowingCache && Boolean(cacheTimestamp) && items.length > 0;

  // T120 / US-34 AC2 (docs/design-spec.md §2.2): plays once, the first time the
  // list metadata (title/summary/date) has anything to show — independent of
  // whether each card's image (US-33 og:image) has resolved yet, so entrance
  // motion never waits on that separate, per-card fetch.
  const shouldPlayEntrance = useEntrancePlayedOnce(!loadingFirst && items.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>ข่าวท่องเที่ยว</Text>
        <View style={styles.topBarActions}>
          <PressableScale
            haptic="light"
            onPress={() => navigation.navigate('Stats')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="ดูสถิติการเดินทาง"
          >
            <Text style={styles.statsLink}>สถิติ</Text>
          </PressableScale>
          <PressableScale
            haptic="light"
            onPress={() => navigation.navigate('Settings')}
            hitSlop={8}
            style={styles.settingsButton}
            accessibilityRole="button"
            accessibilityLabel="ตั้งค่า"
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </PressableScale>
        </View>
      </View>

      {loadingFirst ? (
        <NewsLoadingSkeleton />
      ) : fetchError && items.length === 0 ? (
        <NewsErrorState retrying={retrying} onRetry={handleRetry} />
      ) : (
        <FlatList
          testID="news-list"
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) =>
            shouldPlayEntrance ? (
              <EntranceFadeItem index={index}>
                <NewsCard item={item} onPress={handleOpenNews} />
              </EntranceFadeItem>
            ) : (
              <NewsCard item={item} onPress={handleOpenNews} />
            )
          }
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
          ListHeaderComponent={showCacheIndicator && cacheTimestamp ? <NewsCacheIndicator fetchedAt={cacheTimestamp} /> : null}
          ListEmptyComponent={
            <EmptyState message="ยังไม่มีข่าวในขณะนี้" subtitle="ลากลงเพื่อรีเฟรช" />
          }
          contentContainerStyle={[styles.listContent, items.length === 0 && styles.listContentEmpty]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handlePullToRefresh} tintColor={COLORS.accent} colors={[COLORS.accent]} />
          }
        />
      )}

      <Toast message={toastMessage} onHide={handleHideToast} duration={4000} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xs,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  statsLink: { fontSize: 15, color: COLORS.accent, fontWeight: '600' },
  settingsButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { fontSize: 18 },
  listContent: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  listContentEmpty: { flexGrow: 1, justifyContent: 'center' },
});
