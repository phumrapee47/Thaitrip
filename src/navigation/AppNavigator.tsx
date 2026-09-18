import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { NavigationContainer, createNavigationContainerRef, useIsFocused } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { RootStackParamList, RootTabParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import ProvinceDetailScreen from '../screens/ProvinceDetailScreen';
import AddEntryScreen from '../screens/AddEntryScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import Map2DValidationScreen from '../screens/Map2DValidationScreen';
import NewsScreen from '../screens/NewsScreen';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { COLORS, SHADOWS, SPACING } from '../theme';

// T119 / US-34 §1 (docs/design-spec.md): push-transition durations/animations.
// Reduce Motion (§ "หลักการร่วม") replaces every one of these with a plain
// 120ms cross-fade instead of the slide, per the shared reduce-motion rule.
const PROVINCE_DETAIL_TRANSITION = { animation: 'slide_from_right' as const, animationDuration: 280 };
const ADD_ENTRY_TRANSITION = { animation: 'slide_from_bottom' as const, animationDuration: 300, presentation: 'modal' as const };
const REDUCE_MOTION_TRANSITION = { animation: 'fade' as const, animationDuration: 120 };

// T119 / US-34 §1.3: bottom-tab cross-fade — react-navigation's bottom-tabs
// has no built-in duration-tunable transition, so each tab's stack is wrapped
// in this thin reanimated opacity layer instead: fade OUT the tab losing focus
// to 0.3 over 100ms, then fade the newly-focused tab IN to 1 over 180ms
// (~180-220ms felt duration total). Re-triggers (interrupts) on every focus
// change via `useIsFocused`, and never blocks touches (opacity-only).
function AnimatedTabScreen({ Component }: { Component: React.ComponentType }) {
  const isFocused = useIsFocused();
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!isFocused) return;
    if (reduceMotion) {
      opacity.value = withTiming(1, { duration: 120 });
      return;
    }
    opacity.value = 0.3;
    opacity.value = withTiming(1, { duration: 180 });
  }, [isFocused, reduceMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value, flex: 1 }));

  return (
    <Animated.View style={animatedStyle}>
      <Component />
    </Animated.View>
  );
}

// T92 / US-28: two independent nested native-stack navigators — one per tab —
// both typed against the SAME `RootStackParamList` (see navigation/types.ts
// for why). MapStack is the pre-existing single stack, byte-for-byte the same
// screen set/initialRouteName/options it had before this round; NewsStack is
// new and only registers the 3 screens design-spec/T92 call for.
const MapStack = createNativeStackNavigator<RootStackParamList>();
const NewsStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

/** Imperative nav ref (T50): lets App.tsx's AnonWarningGate jump straight to Settings
 * ("ผูกอีเมลตอนนี้เลย") from outside the navigator's own component tree.
 * Unchanged by the bottom-tab restructure (T92): react-navigation resolves a
 * bare `navigate('Settings')` against the currently focused navigator branch,
 * so this still lands on the Settings screen nested in whichever tab's stack
 * is active — same effective behavior as the old single-stack navigator. */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** T92: nested stack for the "แผนที่" tab — identical screen set, initial
 * route, and screenOptions to the pre-tab-bar single stack (US-28 AC2/AC5):
 * Home is still the first screen shown, ProvinceDetail/AddEntry still push on
 * top of it exactly as before, and the dev-only Map2DValidation route (US-7,
 * T22, T96) is still gated behind `__DEV__` in the same way. */
export function MapStackNavigator() {
  const reduceMotion = useReduceMotion();
  return (
    <MapStack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
      <MapStack.Screen name="Home" component={HomeScreen} />
      <MapStack.Screen
        name="ProvinceDetail"
        component={ProvinceDetailScreen}
        options={reduceMotion ? REDUCE_MOTION_TRANSITION : PROVINCE_DETAIL_TRANSITION}
      />
      <MapStack.Screen
        name="AddEntry"
        component={AddEntryScreen}
        options={
          reduceMotion
            ? { ...REDUCE_MOTION_TRANSITION, presentation: 'modal' }
            : ADD_ENTRY_TRANSITION
        }
      />
      <MapStack.Screen name="Stats" component={StatsScreen} />
      <MapStack.Screen name="Settings" component={SettingsScreen} />
      {__DEV__ ? <MapStack.Screen name="Map2DValidation" component={Map2DValidationScreen} /> : null}
    </MapStack.Navigator>
  );
}

/** T92 / US-29-US-32: nested stack for the "ข่าว" tab. Its own Stats/Settings
 * screen instances so header icon taps from NewsScreen push into *this* tab's
 * stack (US-28 AC4), not the Map tab's. */
function NewsStackNavigator() {
  return (
    <NewsStack.Navigator initialRouteName="News" screenOptions={{ headerShown: false }}>
      <NewsStack.Screen name="News" component={NewsScreen} />
      <NewsStack.Screen name="Stats" component={StatsScreen} />
      <NewsStack.Screen name="Settings" component={SettingsScreen} />
    </NewsStack.Navigator>
  );
}

const TAB_ICON: Record<keyof RootTabParamList, string> = {
  MapTab: '🗺️',
  NewsTab: '📰',
};

const TAB_LABEL: Record<keyof RootTabParamList, string> = {
  MapTab: 'แผนที่',
  NewsTab: 'ข่าว',
};

const TAB_A11Y_LABEL: Record<keyof RootTabParamList, string> = {
  MapTab: 'แท็บแผนที่',
  NewsTab: 'แท็บข่าว',
};

// T119 §1.3: each tab's `component` is wrapped once here (not inline in JSX)
// so react-navigation sees a stable component reference across renders.
function MapTabScreen() {
  return <AnimatedTabScreen Component={MapStackNavigator} />;
}

function NewsTabScreen() {
  return <AnimatedTabScreen Component={NewsStackNavigator} />;
}

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Tab.Navigator
        initialRouteName="MapTab"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarStyle: styles.tabBar,
          tabBarAccessibilityLabel: TAB_A11Y_LABEL[route.name as keyof RootTabParamList],
          tabBarIcon: ({ color }) => (
            <Text style={styles.tabIcon}>{TAB_ICON[route.name as keyof RootTabParamList]}</Text>
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text style={[styles.tabLabel, { color, fontWeight: focused ? '700' : '500' }]}>
              {TAB_LABEL[route.name as keyof RootTabParamList]}
            </Text>
          ),
        })}
      >
        <Tab.Screen
          name="MapTab"
          component={MapTabScreen}
          listeners={({ navigation }) => ({
            tabPress: () => {
              if (!navigation.isFocused()) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            },
          })}
        />
        <Tab.Screen
          name="NewsTab"
          component={NewsTabScreen}
          listeners={({ navigation }) => ({
            tabPress: () => {
              if (!navigation.isFocused()) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            },
          })}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.background,
    borderTopWidth: 0,
    ...SHADOWS.sm,
  },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 11, marginBottom: 2 },
});
