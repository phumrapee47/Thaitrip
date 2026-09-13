import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import ShimmerBlock from './ShimmerBlock';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';
import { TOTAL_PROVINCES } from '../utils/derived';

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

  useEffect(() => {
    const pct = (unlockedCount / TOTAL_PROVINCES) * 100;
    fillPercent.value = withTiming(pct, { duration: 300 });
  }, [unlockedCount, fillPercent]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillPercent.value}%`,
  }));

  if (loading) {
    return (
      <View style={styles.card}>
        <ShimmerBlock style={styles.skeletonText} />
        <View style={styles.track}>
          <ShimmerBlock style={styles.skeletonBar} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>
        ปลดล็อกแล้ว {unlockedCount} / {TOTAL_PROVINCES} จังหวัด
      </Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.sm,
  },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  track: {
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.trackBg,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
  },
  skeletonText: {
    width: 160,
    height: 16,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  skeletonBar: {
    width: '40%',
    height: '100%',
    borderRadius: RADIUS.full,
  },
});
