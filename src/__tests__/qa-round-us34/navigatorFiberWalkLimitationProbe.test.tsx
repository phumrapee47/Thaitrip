// Independent Tester probe (US-34 AC2 verify round 2) — does NOT trust the
// programmer's claim in dev-notes.md that `countEntranceFadeItems() === 0`
// for NewsScreen/StatsScreen rendered through a real NavigationContainer is
// a generic fiber-walk tooling limitation (Screen/Freeze wrapper) rather
// than a leftover product bug. This file isolates the variables one at a
// time: navigator wrapper alone (plain View), then FlatList alone (no
// navigator), then FlatList + navigator together (matches NewsScreen's own
// structure) — to find out WHICH variable actually causes the 0-count,
// rather than accepting "it's the navigator wrapper" at face value.
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { View, Text, FlatList } from 'react-native';
import EntranceFadeItem from '../../components/EntranceFadeItem';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

function countComponentInstances(rootFiber: unknown, componentType: unknown): number {
  let count = 0;
  function walk(fiber: any) {
    if (!fiber) return;
    if (fiber.type === componentType) count += 1;
    walk(fiber.child);
    walk(fiber.sibling);
  }
  walk(rootFiber);
  return count;
}

function countEntranceFadeItems(): number {
  return countComponentInstances(screen.root?.unstable_fiber, EntranceFadeItem);
}

type ProbeParamList = { Probe: undefined };
const Stack = createNativeStackNavigator<ProbeParamList>();

// Variant 1: plain View, no FlatList — deliberately bug-free (unconditional
// EntranceFadeItem, no hook, no ternary).
function ViewProbeScreen() {
  return (
    <View>
      <EntranceFadeItem index={0}>
        <Text>probe-item-a</Text>
      </EntranceFadeItem>
      <EntranceFadeItem index={1}>
        <Text>probe-item-b</Text>
      </EntranceFadeItem>
    </View>
  );
}

// Variant 2: FlatList-based — matches NewsScreen's own rendering structure
// (NewsScreen.tsx:197 uses `<FlatList renderItem={...}>` with
// `shouldPlayEntrance ? <EntranceFadeItem>...` inside `renderItem`).
// Deliberately bug-free here too: EntranceFadeItem always rendered, no
// ternary, no hook — isolates whether FlatList's virtualization/CellRenderer
// wrapper itself is what the naive `.child`/`.sibling` walk cannot see
// through, independent of any navigator.
function FlatListProbeScreen() {
  return (
    <FlatList
      data={['probe-item-a', 'probe-item-b']}
      keyExtractor={(d) => d}
      renderItem={({ item, index }) => (
        <EntranceFadeItem index={index}>
          <Text>{item}</Text>
        </EntranceFadeItem>
      )}
    />
  );
}

function ViewProbeApp() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Probe" component={ViewProbeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function FlatListProbeApp() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Probe" component={FlatListProbeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('US-34 AC2 verify round 2 — probing the "navigator fiber-walk tooling limitation" claim', () => {
  it('control: an unconditional, hook-free EntranceFadeItem usage is correctly counted OUTSIDE a navigator, in a plain View (sanity baseline)', async () => {
    await render(<ViewProbeScreen />);
    await waitFor(() => expect(screen.getByText('probe-item-a')).toBeTruthy());
    expect(countEntranceFadeItems()).toBe(2);
  });

  it('REFUTES the "navigator wrapper generically blocks the fiber walk" claim: a bug-free plain-View screen (no FlatList, no ternary, no hook) mounted through the SAME NavigationContainer/Stack.Navigator wrapper as NewsScreen IS still correctly counted (2, not 0)', async () => {
    await render(<ViewProbeApp />);
    await waitFor(() => expect(screen.getByText('probe-item-a')).toBeTruthy());
    // dev-notes.md round 2 explicitly claims the navigator's Screen/Freeze
    // wrapper is why the walk cannot reach past it. If that were true in
    // general, this would report 0 too. It does not — so "the navigator
    // wrapper" alone is NOT a sufficient explanation for NewsScreen's 0.
    expect(countEntranceFadeItems()).toBe(2);
  });

  it('control: a bug-free FlatList-based screen (matches NewsScreen\'s own rendering structure) is correctly counted OUTSIDE a navigator', async () => {
    await render(<FlatListProbeScreen />);
    await waitFor(() => expect(screen.getByText('probe-item-a')).toBeTruthy());
    expect(countEntranceFadeItems()).toBe(2);
  });

  it('isolates FlatList (not the navigator) as the real variable: a bug-free FlatList-based screen mounted through NavigationContainer/Stack.Navigator', async () => {
    await render(<FlatListProbeApp />);
    await waitFor(() => expect(screen.getByText('probe-item-a')).toBeTruthy());
    expect(countEntranceFadeItems()).toBe(2);
  });
});
