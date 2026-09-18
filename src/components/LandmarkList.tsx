import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Landmark } from '../data/thailand-landmarks';
import { getLandmarksForProvince } from '../data/thailand-landmarks';
import { getLandmarkProgress } from '../utils/landmarkDerived';
import { fetchAttractionsForProvince, resolveRealPhotoForLandmark, searchAttractionsGlobal } from '../services/wikipediaService';
import { PROVINCES } from '../data/thailand-provinces';
import LandmarkCard from './LandmarkCard';
import LandmarkProgressIndicator from './LandmarkProgressIndicator';
import LandmarkMap from './LandmarkMap';
import EmptyStateLandmarks from './EmptyStateLandmarks';
import ShimmerBlock from './ShimmerBlock';
import PressableScale from './PressableScale';
import EntranceFadeItem from './EntranceFadeItem';
import { useEntrancePlayedOnce } from '../hooks/useEntrancePlayedOnce';
import { COLORS, CATEGORY_COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

export interface LandmarkListProps {
  provinceId: string;
  provinceNameTh?: string;
  checkins: Record<string, boolean>;
  loading: boolean;
  onToggle: (landmarkId: string, provinceId: string) => void;
}

const CATEGORIES = [
  'ทั้งหมด',
  'ธรรมชาติและภูเขา',
  'วัดและศาสนสถาน',
  'ทะเลและชายหาด',
  'ประวัติศาสตร์และวัฒนธรรม',
  'ช้อปปิ้งและสันทนาการ',
];

export default function LandmarkList({
  provinceId,
  provinceNameTh: propProvinceNameTh,
  checkins,
  loading,
  onToggle,
}: LandmarkListProps) {
  const initialLandmarks = useMemo(() => getLandmarksForProvince(provinceId), [provinceId]);
  const [landmarks, setLandmarks] = useState<Landmark[]>(initialLandmarks);
  const [isFetchingWiki, setIsFetchingWiki] = useState(false);
  // T88 / US-25 AC1,2,4: distinct from EmptyStateLandmarks — set only when
  // fetchAttractionsForProvince (T87) actually throws/rejects (real network,
  // HTTP, timeout or parse error), never when it resolves with 0 results.
  const [fetchError, setFetchError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  // Advanced UI/UX Upgrade v3: map/card view toggle
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');
  // Track which landmark IDs are currently resolving their real photo
  const [resolvingPhotos, setResolvingPhotos] = useState<Set<string>>(new Set());
  // Live universal search results (from Wikipedia) — separate from landmarks
  const [liveResults, setLiveResults] = useState<Landmark[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Derive province name if not passed directly
  const provinceNameTh = useMemo(() => {
    if (propProvinceNameTh) return propProvinceNameTh;
    return PROVINCES.find((p) => p.id === provinceId)?.nameTh || '';
  }, [propProvinceNameTh, provinceId]);

  // Sync with initial landmarks if province changes
  useEffect(() => {
    setLandmarks(getLandmarksForProvince(provinceId));
    setSearchQuery('');
    setSelectedCategory('ทั้งหมด');
    setFetchError(false);
    setViewMode('cards');
  }, [provinceId]);

  const handleSelectViewMode = useCallback((mode: 'cards' | 'map') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode(mode);
  }, []);

  // T87-T89 / US-25: dynamically enrich and load attractions from Wikipedia.
  // Extracted into a stable callback (not just an effect body) so the T89
  // retry action can invoke exactly the same fetch logic on demand, without
  // leaving the province screen.
  const loadWikipediaAttractions = useCallback(async () => {
    if (!provinceNameTh) return;

    // Guard against stale responses (province switched, or a second retry
    // fired before the first one settled) overwriting newer state.
    const requestId = ++fetchIdRef.current;
    setIsFetchingWiki(true);
    try {
      const wikiPlaces = await fetchAttractionsForProvince(provinceNameTh, provinceId);
      if (!isMountedRef.current || fetchIdRef.current !== requestId) return;

      setFetchError(false);
      setLandmarks((prev) => {
        const combined = [...prev];
        const seenNames = new Set(prev.map((p) => p.nameTh.trim()));

        for (const wp of wikiPlaces) {
          const cleanName = wp.nameTh.trim();
          const existingIndex = combined.findIndex(
            (c) => c.nameTh.includes(cleanName) || cleanName.includes(c.nameTh)
          );

          if (existingIndex >= 0) {
            if (!combined[existingIndex].imageUrl && wp.imageUrl) {
              combined[existingIndex] = {
                ...combined[existingIndex],
                imageUrl: wp.imageUrl,
                category: combined[existingIndex].category || wp.category,
                description: combined[existingIndex].description || wp.description,
              };
            }
          } else if (!seenNames.has(cleanName)) {
            seenNames.add(cleanName);
            combined.push(wp);
          }
        }
        return combined;
      });
    } catch {
      // T87/T88: fetchAttractionsForProvince threw a real error (network,
      // HTTP, timeout, parse) — keep existing (local seed) landmarks
      // untouched (US-25 AC4 / US-22 regression guard) and surface a
      // distinct error state instead of silently doing nothing.
      if (isMountedRef.current && fetchIdRef.current === requestId) setFetchError(true);
    } finally {
      if (isMountedRef.current && fetchIdRef.current === requestId) setIsFetchingWiki(false);
    }
  }, [provinceId, provinceNameTh]);

  useEffect(() => {
    loadWikipediaAttractions();
  }, [loadWikipediaAttractions]);

  // After Wikipedia attractions load, resolve real photos for landmarks that
  // still have no imageUrl (seed items without Wikipedia coverage).
  useEffect(() => {
    const noImageLandmarks = landmarks.filter((l) => !l.imageUrl);
    if (noImageLandmarks.length === 0) return;

    const batchSize = 3;
    let cancelled = false;

    (async () => {
      for (let i = 0; i < noImageLandmarks.length; i += batchSize) {
        if (cancelled || !isMountedRef.current) break;
        const batch = noImageLandmarks.slice(i, i + batchSize);

        // Mark as resolving
        setResolvingPhotos((prev) => {
          const next = new Set(prev);
          batch.forEach((l) => next.add(l.id));
          return next;
        });

        await Promise.allSettled(
          batch.map(async (lm) => {
            const url = await resolveRealPhotoForLandmark(lm.nameTh, provinceNameTh);
            if (url && !cancelled && isMountedRef.current) {
              setLandmarks((prev) =>
                prev.map((item) => (item.id === lm.id && !item.imageUrl ? { ...item, imageUrl: url } : item))
              );
            }
            if (!cancelled && isMountedRef.current) {
              setResolvingPhotos((prev) => {
                const next = new Set(prev);
                next.delete(lm.id);
                return next;
              });
            }
          })
        );
      }
    })();

    return () => {
      cancelled = true;
    };
    // Only re-run when provinceId or provinceNameTh changes (not on every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceId, provinceNameTh]);

  // Live Universal Search — debounced Wikipedia query across all of Thailand
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      setLiveResults([]);

      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      const trimmed = text.trim();
      if (trimmed.length < 2) {
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      searchTimerRef.current = setTimeout(async () => {
        try {
          // Nationwide, not scoped to the current province — see wikipediaService.ts:
          // scoping this query to provinceNameTh used to silently defeat "search ทั่วไทย".
          const results = await searchAttractionsGlobal(trimmed);
          if (isMountedRef.current) {
            setLiveResults(results);
          }
        } catch {
          // silently ignore search errors
        } finally {
          if (isMountedRef.current) setIsSearching(false);
        }
      }, 450);
    },
    []
  );

  const progress = getLandmarkProgress(provinceId, landmarks, checkins);

  // T120 / US-34 AC2 (docs/design-spec.md §2.1): plays exactly once, the first
  // time this province has any landmarks to show — never re-triggers on later
  // re-renders (checkin toggles, Wikipedia enrichment appending more items).
  const shouldPlayEntrance = useEntrancePlayedOnce(landmarks.length > 0);

  const handleToggle = useCallback(
    (landmarkId: string, pId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onToggle(landmarkId, pId);
    },
    [onToggle]
  );

  const handleSelectCategory = useCallback((cat: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(cat);
  }, []);

  // When searchQuery has input: merge local filter + live Wikipedia results
  const filteredLandmarks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // No query — apply only category filter on all landmarks
      return selectedCategory === 'ทั้งหมด'
        ? landmarks
        : landmarks.filter((l) => l.category === selectedCategory);
    }

    const localMatches = landmarks.filter((item) => {
      const matchQuery =
        item.nameTh.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q));
      const matchCategory =
        selectedCategory === 'ทั้งหมด' || item.category === selectedCategory;
      return matchQuery && matchCategory;
    });

    // Merge live Wikipedia results, deduplicating by nameTh
    const seenNames = new Set(localMatches.map((l) => l.nameTh.trim()));
    const liveMerged = liveResults.filter((r) => !seenNames.has(r.nameTh.trim()));

    return [...localMatches, ...liveMerged];
  }, [landmarks, liveResults, searchQuery, selectedCategory]);


  // T88 / US-25 AC1,2,5: a real fetch failure (T87 threw) with nothing else
  // to show — distinct component/copy from EmptyStateLandmarks, with a T89
  // retry action. Must NOT fire for the "resolved successfully with 0
  // results" case (fetchError stays false there). Stays visible (as a
  // loading variant) while a retry is in-flight, per T89.
  if (fetchError && landmarks.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>สถานที่แนะนำ</Text>
        <LandmarkFetchErrorState retrying={isFetchingWiki} onRetry={loadWikipediaAttractions} />
      </View>
    );
  }

  if (landmarks.length === 0 && (loading || isFetchingWiki)) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>สถานที่แนะนำ</Text>
        <ShimmerBlock style={styles.skeletonHero} />
        <View style={styles.skeletonGridRow}>
          <ShimmerBlock style={styles.skeletonTile} />
          <ShimmerBlock style={styles.skeletonTile} />
        </View>
      </View>
    );
  }

  if (landmarks.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>สถานที่แนะนำ</Text>
        <EmptyStateLandmarks />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>สถานที่แนะนำ</Text>

      {/* T88/T89 / US-25 AC4: local seed landmarks below are always rendered
          normally; this is a supplementary banner only, never a replacement. */}
      {fetchError && <LandmarkFetchErrorState retrying={isFetchingWiki} onRetry={loadWikipediaAttractions} compact />}

      {/* View Mode Toggle: Card / Map — keeps the map out of the first fold by
          default so it never crowds the photo cards (advanced-mobile-uiux
          upgrade). Progress indicator stays visible in both modes. */}
      <View style={styles.modeToggleRow}>
        <PressableScale
          haptic="none"
          style={[styles.modeToggleBtn, viewMode === 'cards' && styles.modeToggleBtnActive]}
          onPress={() => handleSelectViewMode('cards')}
          accessibilityRole="button"
          accessibilityState={{ selected: viewMode === 'cards' }}
          accessibilityLabel="มุมมองการ์ด"
        >
          <Text style={[styles.modeToggleText, viewMode === 'cards' && styles.modeToggleTextActive]}>
            🖼️ การ์ด
          </Text>
        </PressableScale>
        <PressableScale
          haptic="none"
          style={[styles.modeToggleBtn, viewMode === 'map' && styles.modeToggleBtnActive]}
          onPress={() => handleSelectViewMode('map')}
          accessibilityRole="button"
          accessibilityState={{ selected: viewMode === 'map' }}
          accessibilityLabel="มุมมองแผนที่"
        >
          <Text style={[styles.modeToggleText, viewMode === 'map' && styles.modeToggleTextActive]}>
            🗺️ แผนที่
          </Text>
        </PressableScale>
      </View>

      {/* Progress Indicator (shared context across both modes) */}
      <LandmarkProgressIndicator checkedInCount={progress.checkedInCount} totalCount={progress.totalCount} />

      {viewMode === 'map' ? (
        <LandmarkMap landmarks={landmarks} checkins={checkins} onToggle={handleToggle} />
      ) : (
        <>
          {/* In-Province Search Bar */}
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={`ค้นหาสถานที่ใน ${provinceNameTh} หรือทั่วไทย...`}
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {isSearching ? (
              <ActivityIndicator size="small" color={COLORS.accent} style={styles.clearBtn} />
            ) : searchQuery.length > 0 ? (
              <Pressable onPress={() => handleSearchChange('')} hitSlop={8} style={styles.clearBtn}>
                <Text style={styles.clearText}>✕</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Category Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              const catColor = CATEGORY_COLORS[cat];
              return (
                <PressableScale
                  key={cat}
                  haptic="none"
                  style={[
                    styles.categoryChip,
                    active && (catColor ? { backgroundColor: catColor.fg } : styles.categoryChipActive),
                  ]}
                  onPress={() => handleSelectCategory(cat)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`หมวดหมู่ ${cat}${active ? ', กำลังเลือกอยู่' : ''}`}
                >
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{cat}</Text>
                </PressableScale>
              );
            })}
          </ScrollView>

          {/* Loading Indicator (enrichment in progress, initial content already visible). */}
          {isFetchingWiki && !fetchError && landmarks.length <= initialLandmarks.length && (
            <View style={styles.loadingBox}>
              <ShimmerBlock style={styles.loadingDot} />
              <Text style={styles.loadingText}>กำลังค้นหารูปภาพและสถานที่เพิ่มเติม...</Text>
            </View>
          )}

          {/* Cards: Bento Grid (Hero + 2-col compact) per advanced-mobile-uiux SKILL.md 2.1 */}
          {filteredLandmarks.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📍</Text>
              <Text style={styles.emptyText}>
                {isSearching ? 'กำลังค้นหาสถานที่ทั่วประเทศไทย...' : 'ไม่พบสถานที่ที่ตรงกับการค้นหา'}
              </Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {shouldPlayEntrance ? (
                <EntranceFadeItem index={0}>
                  <LandmarkCard
                    key={filteredLandmarks[0].id}
                    landmark={filteredLandmarks[0]}
                    visited={Boolean(checkins[filteredLandmarks[0].id])}
                    onToggle={() => handleToggle(filteredLandmarks[0].id, filteredLandmarks[0].provinceId || provinceId)}
                    variant="hero"
                    imageLoading={resolvingPhotos.has(filteredLandmarks[0].id)}
                  />
                </EntranceFadeItem>
              ) : (
                <LandmarkCard
                  key={filteredLandmarks[0].id}
                  landmark={filteredLandmarks[0]}
                  visited={Boolean(checkins[filteredLandmarks[0].id])}
                  onToggle={() => handleToggle(filteredLandmarks[0].id, filteredLandmarks[0].provinceId || provinceId)}
                  variant="hero"
                  imageLoading={resolvingPhotos.has(filteredLandmarks[0].id)}
                />
              )}
              <View style={styles.grid}>
                {filteredLandmarks.slice(1).map((landmark, i) =>
                  shouldPlayEntrance ? (
                    // Note: the wrapper (not the card) owns the 48.5% grid-column
                    // width here — the card itself is told to fill 100% of it —
                    // because a percentage width on the card alone would be
                    // relative to an as-yet-unsized Animated.View wrapper.
                    <EntranceFadeItem key={landmark.id} index={i + 1} style={styles.gridItemWrap}>
                      <LandmarkCard
                        landmark={landmark}
                        visited={Boolean(checkins[landmark.id])}
                        onToggle={() => handleToggle(landmark.id, landmark.provinceId || provinceId)}
                        variant="compact"
                        imageLoading={resolvingPhotos.has(landmark.id)}
                        style={styles.gridItemCardFill}
                      />
                    </EntranceFadeItem>
                  ) : (
                    <LandmarkCard
                      key={landmark.id}
                      landmark={landmark}
                      visited={Boolean(checkins[landmark.id])}
                      onToggle={() => handleToggle(landmark.id, landmark.provinceId || provinceId)}
                      variant="compact"
                      imageLoading={resolvingPhotos.has(landmark.id)}
                    />
                  )
                )}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

/**
 * T88/T89 / US-25 AC1,2,3,5,6: dedicated error state — visually and textually
 * distinct from EmptyStateLandmarks — with an inline retry action. Reused in
 * two spots: (a) full-block when there are no landmarks to show at all, and
 * (b) a `compact` supplementary banner above an already-populated list
 * (local seed landmarks) so it never hides/replaces existing content.
 */
function LandmarkFetchErrorState({
  retrying,
  onRetry,
  compact,
}: {
  retrying: boolean;
  onRetry: () => void;
  compact?: boolean;
}) {
  return (
    <View
      style={[styles.errorBox, compact && styles.errorBoxCompact]}
      accessibilityRole="alert"
      accessibilityLabel="โหลดข้อมูลสถานที่ไม่สำเร็จ"
    >
      {!compact && <Text style={styles.errorIcon}>⚠️</Text>}
      <Text style={styles.errorText}>โหลดข้อมูลสถานที่ไม่สำเร็จ</Text>
      {retrying ? (
        <ShimmerBlock style={styles.errorRetryShimmer} />
      ) : (
        <Pressable
          onPress={onRetry}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="ลองโหลดข้อมูลสถานที่อีกครั้ง"
        >
          <Text style={styles.retryLink}>ลองอีกครั้ง</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: '#FAFCFB',
    borderWidth: 1,
    borderColor: '#E8EFEA',
  },
  heading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  skeletonHero: {
    height: 220,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  skeletonGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonTile: {
    width: '48.5%',
    height: 180,
    borderRadius: RADIUS.lg,
  },
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F0',
    borderRadius: RADIUS.full,
    padding: 3,
    marginBottom: SPACING.xs,
  },
  modeToggleBtn: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
  },
  modeToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    ...SHADOWS.sm,
  },
  modeToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modeToggleTextActive: {
    color: COLORS.textPrimary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8E4',
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 2,
  },
  clearText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '700',
  },
  categoryScroll: {
    paddingBottom: 10,
    gap: 6,
  },
  categoryChip: {
    paddingHorizontal: SPACING.sm,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    backgroundColor: '#EEF2F0',
    marginRight: SPACING.xxs,
  },
  categoryChipActive: {
    backgroundColor: COLORS.accent,
  },
  categoryChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  loadingBox: {
    paddingVertical: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  loadingDot: {
    width: 14,
    height: 14,
    borderRadius: RADIUS.full,
  },
  loadingText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  emptyBox: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 24,
    marginBottom: SPACING.xxs,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  errorBox: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xxs,
  },
  errorBoxCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.xs,
    backgroundColor: '#FDF2F2',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#F3D6D6',
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  errorIcon: {
    fontSize: 22,
    marginBottom: SPACING.xxs,
  },
  errorText: {
    fontSize: 12,
    color: '#B3261E',
    textAlign: 'center',
  },
  retryLink: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '700',
  },
  errorRetryShimmer: {
    width: 60,
    height: 16,
    borderRadius: RADIUS.full,
  },
  cardList: {
    marginTop: SPACING.xxs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  // T120: the entrance-animated grid item owns the 2-col width itself so the
  // wrapped LandmarkCard (told to fill 100% via `gridItemCardFill`) doesn't
  // resolve a nested percentage against an unsized parent.
  gridItemWrap: {
    width: '48.5%',
  },
  gridItemCardFill: {
    width: '100%',
  },
});
