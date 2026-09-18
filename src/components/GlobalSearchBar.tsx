import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PROVINCES, type Province } from '../data/thailand-provinces';
import { LANDMARKS } from '../data/thailand-landmarks';
import { TAT_SEARCH_INDEX } from '../data/tat-search-index';
import { searchAttractionsGlobal } from '../services/wikipediaService';
import PressableScale from './PressableScale';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

const SEARCH_DEBOUNCE_MS = 450;

export interface GlobalSearchBarProps {
  onSelectProvince: (provinceId: string) => void;
}

interface SearchResultItem {
  id: string;
  type: 'province' | 'landmark';
  title: string;
  subtitle: string;
  provinceId: string;
}

export default function GlobalSearchBar({ onSelectProvince }: GlobalSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  // US-24 AC5 (revised): province/curated-landmark matches from the local
  // dataset must still appear instantly, with zero network access. Anything
  // beyond that local set is layered on top via a debounced Wikipedia search
  // (see docs/requirements.md US-26) instead of being out of scope entirely.
  const [liveResults, setLiveResults] = useState<SearchResultItem[]>([]);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(
    () => () => {
      isMountedRef.current = false;
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    },
    []
  );

  const localResults = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const items: SearchResultItem[] = [];

    // 1. Search Provinces
    for (const prov of PROVINCES) {
      if (prov.nameTh.toLowerCase().includes(q) || prov.nameEn.toLowerCase().includes(q)) {
        items.push({
          id: `prov-${prov.id}`,
          type: 'province',
          title: prov.nameTh,
          subtitle: `จังหวัด (${prov.nameEn})`,
          provinceId: prov.id,
        });
      }
      if (items.length >= 5) break;
    }

    // 2. Search curated Landmarks (thailand-landmarks.ts — the small "top
    // picks" list shown when browsing a province)
    const seenLandmarkIds = new Set<string>();
    for (const lm of LANDMARKS) {
      if (lm.nameTh.toLowerCase().includes(q)) {
        seenLandmarkIds.add(lm.id);
        const prov = PROVINCES.find((p) => p.id === lm.provinceId);
        items.push({
          id: `lm-${lm.id}`,
          type: 'landmark',
          title: lm.nameTh,
          subtitle: prov ? `สถานที่ใน ${prov.nameTh}` : 'สถานที่ท่องเที่ยว',
          provinceId: lm.provinceId,
        });
      }
      if (items.length >= 15) break;
    }

    // 3. Search the full TAT open-data index (src/data/tat-search-index.ts —
    // every real place TAT has on record for non-pilot provinces, not just
    // the capped "top picks"; no ranking heuristic can reliably predict which
    // 15 a search should have found, e.g. หาดชะอำ/Cha-am Beach has no
    // curated highlight text yet is one of Thailand's best-known beaches —
    // see scripts/lib/tat-extract-core.ts buildSearchIndexEntries). Skips
    // anything already matched above so the same real place never appears twice.
    if (items.length < 15) {
      for (const lm of TAT_SEARCH_INDEX) {
        if (seenLandmarkIds.has(lm.id)) continue;
        if (lm.nameTh.toLowerCase().includes(q)) {
          const prov = PROVINCES.find((p) => p.id === lm.provinceId);
          items.push({
            id: `lm-${lm.id}`,
            type: 'landmark',
            title: lm.nameTh,
            subtitle: prov ? `สถานที่ใน ${prov.nameTh}` : 'สถานที่ท่องเที่ยว',
            provinceId: lm.provinceId,
          });
        }
        if (items.length >= 15) break;
      }
    }

    return items;
  }, [query]);

  // Debounced nationwide Wikipedia search, layered on top of the instant
  // local matches above — finds landmarks that were never curated into
  // thailand-landmarks.ts, not just the popular pre-selected ones.
  useEffect(() => {
    setLiveResults([]);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setIsSearchingWeb(false);
      return;
    }

    setIsSearchingWeb(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const found = await searchAttractionsGlobal(trimmed);
        if (!isMountedRef.current) return;

        const seenTitles = new Set(localResults.map((r) => r.title.trim()));
        const mapped: SearchResultItem[] = found
          // Can't navigate to a province we couldn't resolve, and skip
          // anything already shown via the instant local match above.
          .filter((lm) => lm.provinceId && !seenTitles.has(lm.nameTh.trim()))
          .map((lm) => {
            const prov = PROVINCES.find((p) => p.id === lm.provinceId);
            return {
              id: `wiki-${lm.id}`,
              type: 'landmark' as const,
              title: lm.nameTh,
              subtitle: prov ? `สถานที่ใน ${prov.nameTh}` : 'สถานที่ท่องเที่ยว',
              provinceId: lm.provinceId,
            };
          });
        setLiveResults(mapped);
      } finally {
        if (isMountedRef.current) setIsSearchingWeb(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const results = useMemo(() => [...localResults, ...liveResults], [localResults, liveResults]);

  function handleSelect(provinceId: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    setQuery('');
    setIsFocused(false);
    onSelectProvince(provinceId);
  }

  function handleClear() {
    setQuery('');
  }

  return (
    <View style={styles.wrapper}>
      {/* Input Box */}
      <View style={[styles.container, isFocused && styles.containerFocused]}>
        <Text style={styles.icon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="ค้นหาจังหวัด หรือสถานที่ท่องเที่ยว..."
          placeholderTextColor={COLORS.muted}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {isSearchingWeb ? (
          <ActivityIndicator size="small" color={COLORS.accent} style={styles.clearBtn} />
        ) : (
          query.length > 0 && (
            <Pressable onPress={handleClear} hitSlop={8} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </Pressable>
          )
        )}
      </View>

      {/* Floating Suggestions Dropdown */}
      {isFocused && (results.length > 0 || isSearchingWeb) && (
        <View style={styles.dropdown}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={styles.dropdownScroll}
            showsVerticalScrollIndicator={false}
          >
            {results.map((item) => (
              <PressableScale
                key={item.id}
                haptic="none"
                style={styles.resultRow}
                onPress={() => handleSelect(item.provinceId)}
              >
                <Text style={styles.resultIcon}>{item.type === 'province' ? '📍' : '🏛️'}</Text>
                <View style={styles.resultTextCol}>
                  <Text style={styles.resultTitle}>{item.title}</Text>
                  <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.arrowIcon}>›</Text>
              </PressableScale>
            ))}
            {isSearchingWeb && (
              <View style={styles.searchingRow}>
                <ActivityIndicator size="small" color={COLORS.accent} />
                <Text style={styles.searchingText}>กำลังค้นหาทั่วประเทศไทย...</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// T127/T129 / US-36 AC1,3,4 (docs/design-spec.md "GlobalSearchBar"): wrapped
// as its own floating card (RADIUS.xl, SHADOWS.md) with a SPACING.lg gap
// below it to the next section, instead of the old flat SPACING.xs-spaced
// bar. Focused state elevates further with SHADOWS.lg.
const styles = StyleSheet.create({
  wrapper: {
    zIndex: 100,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    ...SHADOWS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  containerFocused: {
    borderColor: COLORS.accent,
    ...SHADOWS.lg,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '700',
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 250,
    overflow: 'hidden',
  },
  dropdownScroll: {
    paddingVertical: SPACING.xxs,
  },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  searchingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    minHeight: 44,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderLight,
  },
  resultIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  resultTextCol: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  resultSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 18,
    color: COLORS.muted,
  },
});
