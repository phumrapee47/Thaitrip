import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { COLORS } from '../theme';
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
      <View style={styles.container}>
        <View style={[styles.skeletonText]} />
        <View style={styles.track}>
          <View style={styles.skeletonBar} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
  container: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.trackBg,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  skeletonText: {
    width: 160,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#EEEEEE',
    marginBottom: 6,
  },
  skeletonBar: {
    width: '40%',
    height: '100%',
    backgroundColor: '#EEEEEE',
  },
});
