import React from 'react';
import type { GestureResponderEvent, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Platform, Pressable } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useReduceMotion } from '../hooks/useReduceMotion';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = { damping: 12, stiffness: 150 };

// T121 / US-34 §3.1 (docs/design-spec.md): baseline = SHADOWS.md, press-in
// target is the "flattened" shadow. iOS-only (see below) — shadowOpacity/
// shadowRadius don't interpolate smoothly via `elevation` on Android.
const SHADOW_REST = { opacity: 0.08, radius: 14, y: 6 };
const SHADOW_PRESSED = { opacity: 0.03, radius: 6, y: 2 };

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  haptic?: 'light' | 'medium' | 'none';
  scaleTo?: number;
  /**
   * T121 / US-34 AC3: 'default' (unchanged, scale 0.96, no shadow-depress) —
   * every existing caller keeps today's behavior. 'emphasized' opts a
   * touch target into the stronger scale 0.93 + shadow-depress effect for
   * the handful of elements US-34 calls out (check-in button, Landmark card,
   * News card, "+ เพิ่มบันทึกใหม่"). Optional + defaults to 'default' so this
   * is purely additive — no existing caller needs to change.
   */
  variant?: 'default' | 'emphasized';
}

/**
 * Physics-based press feedback per advanced-mobile-uiux SKILL.md 3.1/3.2:
 * scale 0.96 on press-in, spring back (damping 12 / stiffness 150) on release,
 * paired with a haptic tick. T121 adds an opt-in `variant="emphasized"` on
 * top of that baseline (deeper scale + shadow-depress), gated by Reduce Motion
 * and Android's lack of smooth shadow interpolation (docs/design-spec.md §3.1).
 */
export default function PressableScale({
  style,
  haptic = 'light',
  scaleTo,
  variant = 'default',
  onPressIn,
  onPress,
  children,
  ...rest
}: PressableScaleProps) {
  const reduceMotion = useReduceMotion();
  // Reduce Motion: emphasized falls back to the same scale-only 0.96 as
  // 'default' (docs/design-spec.md "หลักการร่วม: Reduce Motion") — no deeper
  // scale, no shadow-depress.
  const emphasized = variant === 'emphasized' && !reduceMotion;
  const emphasizedShadow = emphasized && Platform.OS === 'ios';
  const effectiveScaleTo = scaleTo ?? (emphasized ? 0.93 : 0.96);

  const scale = useSharedValue(1);
  const depress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const base: Record<string, unknown> = { transform: [{ scale: scale.value }] };
    if (emphasizedShadow) {
      base.shadowOpacity = interpolate(depress.value, [0, 1], [SHADOW_REST.opacity, SHADOW_PRESSED.opacity]);
      base.shadowRadius = interpolate(depress.value, [0, 1], [SHADOW_REST.radius, SHADOW_PRESSED.radius]);
      base.shadowOffset = { width: 0, height: interpolate(depress.value, [0, 1], [SHADOW_REST.y, SHADOW_PRESSED.y]) };
    }
    return base;
  });

  const handlePressIn = (e: GestureResponderEvent) => {
    scale.value = withSpring(effectiveScaleTo, SPRING_CONFIG);
    if (emphasizedShadow) depress.value = withSpring(1, SPRING_CONFIG);
    onPressIn?.(e);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
    if (emphasizedShadow) depress.value = withSpring(0, SPRING_CONFIG);
  };

  const handlePress = (e: GestureResponderEvent) => {
    if (haptic === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (haptic === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.(e);
  };

  return (
    <AnimatedPressableBase
      style={[style, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      {...rest}
    >
      {children}
    </AnimatedPressableBase>
  );
}
