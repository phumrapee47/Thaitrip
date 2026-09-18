import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useReduceMotion } from '../hooks/useReduceMotion';

export interface EntranceFadeItemProps {
  /** Position within the list — drives the stagger delay (index * 40ms, capped at 320ms). */
  index: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  testID?: string;
}

const ITEM_DURATION_MS = 260;
const START_TRANSLATE_Y = 12;
const STAGGER_STEP_MS = 40;
const STAGGER_CAP_MS = 320;

/**
 * T120 / US-34 AC2 (docs/design-spec.md §2): fade (opacity 0->1) + translateY
 * (12pt -> 0), 260ms per item, `Easing.out(Easing.cubic)`, staggered by
 * `index * 40ms` capped at 320ms. Plays once on mount — callers only render
 * this wrapper for the render pass where the list's entrance should actually
 * play (see `useEntrancePlayedOnce`); items rendered without it appear
 * statically. Never blocks touches (opacity/transform only, no
 * `pointerEvents="none"`), so users can scroll/tap mid-animation.
 */
export default function EntranceFadeItem({ index, style, children, testID }: EntranceFadeItemProps) {
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const translateY = useSharedValue(reduceMotion ? 0 : START_TRANSLATE_Y);

  useEffect(() => {
    if (reduceMotion) {
      // US-34 Reduce Motion fallback: no stagger, opacity snaps to 1 immediately.
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    const delay = Math.min(index * STAGGER_STEP_MS, STAGGER_CAP_MS);
    const easing = Easing.out(Easing.cubic);
    opacity.value = withDelay(delay, withTiming(1, { duration: ITEM_DURATION_MS, easing }));
    translateY.value = withDelay(delay, withTiming(0, { duration: ITEM_DURATION_MS, easing }));
    // Only re-run if index or the reduce-motion setting itself changes — never
    // on unrelated re-renders of the parent list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View testID={testID} style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
