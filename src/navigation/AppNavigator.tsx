import React from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import ProvinceDetailScreen from '../screens/ProvinceDetailScreen';
import AddEntryScreen from '../screens/AddEntryScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import Map2DValidationScreen from '../screens/Map2DValidationScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Imperative nav ref (T50): lets App.tsx's AnonWarningGate jump straight to Settings
 * ("ผูกอีเมลตอนนี้เลย") from outside the navigator's own component tree. */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ProvinceDetail" component={ProvinceDetailScreen} />
        <Stack.Screen name="AddEntry" component={AddEntryScreen} />
        <Stack.Screen name="Stats" component={StatsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        {/*
          T22: Map2DValidation is a dev-only route (US-7 validation step) and must
          never be reachable from production nav/UI. We still register the route
          (so `__DEV__` builds and manual QA can reach it) but no production
          screen ever renders a link/button to it — only HomeScreen's dev-only
          affordance below does, and that is itself gated on `__DEV__`.
        */}
        {__DEV__ ? <Stack.Screen name="Map2DValidation" component={Map2DValidationScreen} /> : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
