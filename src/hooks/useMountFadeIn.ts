import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useReduceMotion } from './useReduceMotion';

/**
 * T120 / US-34 AC2 + คำตัดสิน PM ข้อ 25 (docs/tasks.md, รอบ 14): single-opacity
 * fade-in played exactly once when the owning component mounts — used for the
 * HomeScreen 3D map grid container and its header/legend, NOT per-tile
 * animation (deliberately no stagger/translate here, just one opacity value).
 * Reduce Motion -> resolves to fully opaque immediately, no fade at all.
 */
export function useMountFadeIn(durationMs: number) {
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      return;
    }
    opacity.value = withTiming(1, { duration: durationMs });
    // Intentionally only re-runs if reduceMotion flips (e.g. mid-session
    // accessibility change) or the caller passes a different duration —
    // NOT on every re-render, so this never re-plays on unrelated state updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, durationMs]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}
