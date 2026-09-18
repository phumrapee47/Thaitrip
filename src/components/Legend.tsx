import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useMountFadeIn } from '../hooks/useMountFadeIn';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

// T120 / US-34 AC2 + คำตัดสิน PM ข้อ 25: fades in once on mount, alongside
// (but independently of) HeaderProgress and the Home 3D map grid.
const LEGEND_FADE_IN_DURATION_MS = 220;

/** T23: static legend explaining locked vs unlocked tile colors, shown under the map. */
export default function Legend() {
  const fadeInStyle = useMountFadeIn(LEGEND_FADE_IN_DURATION_MS);
  return (
    <Animated.View style={[styles.container, fadeInStyle]}>
      <View style={styles.item}>
        <View style={[styles.swatch, { backgroundColor: COLORS.lockedTop }]} />
        <Text style={styles.label}>ยังไม่ได้ไป</Text>
      </View>
      <View style={styles.item}>
        <View style={styles.unlockedSwatchGroup}>
          <View style={[styles.swatch, styles.unlockedTop]} />
          <View style={[styles.swatch, styles.unlockedSide]} />
        </View>
        <Text style={styles.label}>ไปแล้ว</Text>
      </View>
      <View style={styles.item}>
        <View style={[styles.swatch, styles.masterSwatch]}>
          <Text style={styles.masterStar}>⭐</Text>
        </View>
        <Text style={styles.label}>เที่ยวครบทุกที่แนะนำ</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    rowGap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  // T129 / US-36 AC1 (docs/design-spec.md "Legend"): solid-surface chip +
  // SHADOWS.sm instead of the old thin 1px-bordered pill, to match the
  // upgraded HeaderProgress/Map hero cards elsewhere on the screen.
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.xxs,
    paddingHorizontal: SPACING.sm,
    ...SHADOWS.sm,
  },
  swatch: { width: 14, height: 14, borderRadius: 4 },
  unlockedSwatchGroup: { flexDirection: 'row' },
  unlockedTop: { backgroundColor: COLORS.unlockedTop, marginRight: 2 },
  unlockedSide: { backgroundColor: COLORS.unlockedSide },
  masterSwatch: {
    backgroundColor: COLORS.unlockedTop,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterStar: { fontSize: 8 },
  label: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
});
