import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

export interface ShimmerBlockProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Perceived-performance skeleton per advanced-mobile-uiux SKILL.md 4.1:
 * pulse fade 0.4 <-> 0.9 instead of a bare ActivityIndicator, sized to match
 * the real content it stands in for (no layout shift on data arrival).
 */
export default function ShimmerBlock({ style }: ShimmerBlockProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.9, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[{ backgroundColor: '#EAEAEA', borderRadius: 12 }, style, animatedStyle]} />;
}
