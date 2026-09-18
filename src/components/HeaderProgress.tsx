import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import ShimmerBlock from './ShimmerBlock';
import { useMountFadeIn } from '../hooks/useMountFadeIn';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';
import { TOTAL_PROVINCES } from '../utils/derived';

// T120 / US-34 AC2 + คำตัดสิน PM ข้อ 25: header (unlocked count + progress
// bar) fades in once on mount, independently of the Home 3D map grid's own
// fade (docs/design-spec.md §2.4 "ทางเลือก A" ~200ms range).
const HEADER_FADE_IN_DURATION_MS = 220;

export interface HeaderProgressProps {
  unlockedCount: number;
  loading: boolean;
}

/**
 * T10: "ปลดล็อกแล้ว X / 76 จังหวัด" + progress bar, animates the fill smoothly (~300ms)
 * whenever unlockedCount changes, instead of snapping instantly.
 */
export default function HeaderProgress({ unlockedCount, loading }: HeaderProgressProps) {
  const fillPercent = useSharedValue(0);
  const fadeInStyle = useMountFadeIn(HEADER_FADE_IN_DURATION_MS);

  useEffect(() => {
    const pct = (unlockedCount / TOTAL_PROVINCES) * 100;
    fillPercent.value = withTiming(pct, { duration: 300 });
  }, [unlockedCount, fillPercent]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillPercent.value}%`,
  }));

  if (loading) {
    return (
      <Animated.View style={[styles.card, fadeInStyle]}>
        <ShimmerBlock style={styles.skeletonText} />
        <View style={styles.track}>
          <ShimmerBlock style={styles.skeletonBar} />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, fadeInStyle]}>
      {/* T129 / US-36 AC1 (docs/design-spec.md "HeaderProgress"): the count
          segment is visually promoted ("hero stat") via a larger, bolder
          nested <Text>, while staying INSIDE the same outer <Text> so the
          accessible/queryable text is still the one unbroken sentence
          "ปลดล็อกแล้ว {n} / 76 จังหวัด" — unchanged for a11y and existing
          getByText(...) assertions (see src/__tests__/integration/homeScreen.test.tsx). */}
      <Text style={styles.label}>
        ปลดล็อกแล้ว <Text style={styles.labelCount}>{unlockedCount} / {TOTAL_PROVINCES}</Text> จังหวัด
      </Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// T129 / US-36 AC1 (docs/design-spec.md "HeaderProgress"): "hero stat bento"
// treatment — accent-tinted surface instead of flat white, bigger padding,
// a gradient (not flat) fill, and a slightly taller track.
const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.accentSurface,
    ...SHADOWS.md,
  },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  labelCount: { fontSize: 22, fontWeight: '800', color: COLORS.accentDark },
  track: {
    height: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.trackBg,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  skeletonText: {
    width: 160,
    height: 16,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.lockedTopLoading,
  },
  skeletonBar: {
    width: '40%',
    height: '100%',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.lockedTopLoading,
  },
});
