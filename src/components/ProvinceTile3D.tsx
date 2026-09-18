import React, { memo, useEffect } from 'react';
import { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { Province } from '../data/thailand-provinces';
import { COLORS } from '../theme';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Pseudo-3D "extrusion" depth in SVG units: the top face lifts up by this much,
// and the side face (same silhouette, darker fill) stays at the base to fake block thickness.
// (See dev-notes.md: full per-edge polygon extrusion was judged not worth the complexity
// for a stylized flat map; this layered top+side approach matches the visual AC.)
const LIFT_DEPTH = 6;

const SPRING_CONFIG = { damping: 8, mass: 0.6, stiffness: 120 };

export interface ProvinceTile3DProps {
  province: Province;
  isVisited: boolean;
  isJustUnlocked: boolean;
  /** T8 loading state: renders a lighter placeholder gray instead of the real locked color. */
  isLoading?: boolean;
  /** T52 / US-14: Province Master gold border + star, live-computed by the caller. */
  isProvinceMaster?: boolean;
  /** T52: transient shimmer played once when a tile becomes Province Master mid-session. */
  isJustMastered?: boolean;
  onUnlockAnimationDone: (provinceId: string) => void;
  onMasterAnimationDone?: (provinceId: string) => void;
  onPress: (provinceId: string) => void;
  onLongPress: (provinceId: string) => void;
  onPressOut: (provinceId: string) => void;
}

function ProvinceTile3DBase({
  province,
  isVisited,
  isJustUnlocked,
  isLoading = false,
  isProvinceMaster = false,
  isJustMastered = false,
  onUnlockAnimationDone,
  onMasterAnimationDone,
  onPress,
  onLongPress,
  onPressOut,
}: ProvinceTile3DProps) {
  const lift = useSharedValue(isVisited ? 1 : 0);
  const starOpacity = useSharedValue(isProvinceMaster ? 1 : 0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const shimmerOpacity = useSharedValue(1);

  useEffect(() => {
    if (isJustUnlocked) {
      // Advanced UI/UX: notify (not impact) haptic — the map tile turning "unlocked"
      // is a milestone moment, same weight as the Province Master badge (SKILL.md 3.2).
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Celebratory ring pulse, independent of the lift spring/onUnlockAnimationDone
      // contract below — purely decorative, never gates the callback.
      ringScale.value = 0;
      ringOpacity.value = 0.6;
      ringScale.value = withTiming(1, { duration: 550, easing: Easing.out(Easing.quad) });
      ringOpacity.value = withTiming(0, { duration: 550 });

      // T16/T17: play the spring/bounce only for the tile that just changed state.
      lift.value = 0;
      lift.value = withSpring(1, SPRING_CONFIG, (finished) => {
        if (finished) {
          runOnJS(onUnlockAnimationDone)(province.id);
        }
      });
    } else {
      // Already-unlocked (or still-locked) tiles snap directly, no replay of the animation.
      lift.value = isVisited ? 1 : 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisited, isJustUnlocked]);

  useEffect(() => {
    // Skeleton shimmer while the journal is still loading, matching the
    // ShimmerBlock pulse used everywhere else (SKILL.md 4.1) instead of a
    // flat static placeholder color.
    if (isLoading) {
      shimmerOpacity.value = withRepeat(
        withTiming(0.55, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      shimmerOpacity.value = withTiming(1, { duration: 200 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  useEffect(() => {
    if (isJustMastered) {
      // T52: short shimmer/sparkle (~600ms) distinct from the unlock spring, then settle.
      starOpacity.value = withSequence(
        withTiming(0.2, { duration: 120 }),
        withTiming(1, { duration: 120 }),
        withTiming(0.3, { duration: 120 }),
        withTiming(1, { duration: 140 }, (finished) => {
          if (finished && onMasterAnimationDone) {
            runOnJS(onMasterAnimationDone)(province.id);
          }
        })
      );
    } else {
      starOpacity.value = isProvinceMaster ? 1 : 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProvinceMaster, isJustMastered]);

  const topGroupProps = useAnimatedProps(() => ({
    translateY: -LIFT_DEPTH * lift.value,
  }));

  const lockedColor = isLoading ? COLORS.lockedTopLoading : COLORS.lockedTop;
  const topPathProps = useAnimatedProps(() => ({
    fill: interpolateColor(lift.value, [0, 1], [lockedColor, COLORS.unlockedTop]),
    opacity: shimmerOpacity.value,
  }));

  const sidePathProps = useAnimatedProps(() => ({
    opacity: lift.value,
  }));

  const starProps = useAnimatedProps(() => ({
    opacity: starOpacity.value,
  }));

  const ringProps = useAnimatedProps(() => ({
    r: 4 + ringScale.value * 14,
    opacity: ringOpacity.value,
  }));

  const accessibilityLabel = `${province.nameTh}, ${isVisited ? 'ไปแล้ว' : 'ยังไม่ได้ไป'}${
    isProvinceMaster ? ', ครบ Province Master' : ''
  }`;

  const handlePress = () => {
    // General-tap feedback per SKILL.md 3.2 ("เมื่อกดสลับตัวกรอง / แตะปุ่มทั่วไป").
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(province.id);
  };

  return (
    <G
      onPress={handlePress}
      onLongPress={() => onLongPress(province.id)}
      onPressOut={() => onPressOut(province.id)}
      delayLongPress={350}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {/* Side face: darker silhouette fixed at the base, fades in as the tile unlocks. */}
      <AnimatedPath d={province.path} fill={COLORS.unlockedSide} animatedProps={sidePathProps} />
      {/* Celebratory ring pulse, played once alongside the unlock spring. */}
      <AnimatedCircle
        cx={province.centroid[0]}
        cy={province.centroid[1]}
        fill="none"
        stroke={COLORS.unlockedTop}
        strokeWidth={1.5}
        animatedProps={ringProps}
      />
      {/* Top face: rises up from the base as `lift` animates 0 -> 1. */}
      <AnimatedG animatedProps={topGroupProps}>
        <AnimatedPath
          d={province.path}
          animatedProps={topPathProps}
          stroke={isProvinceMaster ? COLORS.gold : COLORS.textOnDark}
          strokeWidth={isProvinceMaster ? 1.6 : 0.4}
        />
        {isProvinceMaster ? (
          <AnimatedSvgText
            x={province.centroid[0]}
            y={province.centroid[1]}
            fontSize={9}
            textAnchor="middle"
            animatedProps={starProps}
          >
            ⭐
          </AnimatedSvgText>
        ) : null}
      </AnimatedG>
    </G>
  );
}

function areEqual(prev: ProvinceTile3DProps, next: ProvinceTile3DProps) {
  return (
    prev.province.id === next.province.id &&
    prev.isVisited === next.isVisited &&
    prev.isJustUnlocked === next.isJustUnlocked &&
    prev.isLoading === next.isLoading &&
    prev.isProvinceMaster === next.isProvinceMaster &&
    prev.isJustMastered === next.isJustMastered
  );
}

// Perf note (design-spec issue 2 / T30): memoized so only the tile(s) whose own
// isVisited/isJustUnlocked/isProvinceMaster prop actually changed re-render, not all 76 at once.
const ProvinceTile3D = memo(ProvinceTile3DBase, areEqual);
export default ProvinceTile3D;
