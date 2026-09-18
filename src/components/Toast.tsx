import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { RADIUS, SPACING } from '../theme';

export interface ToastProps {
  /** null/undefined hides the toast entirely. */
  message: string | null | undefined;
  onHide: () => void;
  /** T106/T107 — PM decision ข้อ 23 (docs/tasks.md): ~4000ms, longer than the
   * ~2.5s design-spec originally proposed, so users are less likely to miss it
   * (especially the "offline" message). */
  duration?: number;
}

/**
 * T106/T107 / US-31 AC3,4: transient auto-dismiss toast (design-spec "News
 * Open-Failure Toast", Option A per PM decision ข้อ 23) — used for both the
 * "ไม่สามารถเปิดข่าวนี้ได้" (invalid/empty link) and "ต้องเชื่อมต่ออินเทอร์เน็ต..."
 * (offline) messages. No dedicated toast component existed in this codebase
 * before this round (the closest prior pattern, `Alert.alert` in
 * AddEntryScreen, is a blocking native dialog — not appropriate here per
 * design-spec, which explicitly wants a non-blocking transient message).
 */
export default function Toast({ message, onHide, duration = 4000 }: ToastProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!message) return;
    opacity.value = withTiming(1, { duration: 200 });
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) runOnJS(onHide)();
      });
    }, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, duration]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, animatedStyle]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.xl,
    right: SPACING.xl,
    bottom: SPACING.xxl,
    backgroundColor: 'rgba(26,26,26,0.92)',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  text: { color: '#FFFFFF', fontSize: 14, textAlign: 'center' },
});
