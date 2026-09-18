// Independent Tester debug probe (US-34 AC2 verify round 2), continuation of
// navigatorFiberWalkLimitationProbe.test.tsx. That file proved a bug-free
// FlatList screen with a SINGLE Stack.Screen mounted through
// NavigationContainer/Stack.Navigator IS correctly counted (2, not 0) by the
// fiber-walk technique — refuting "the navigator wrapper" and "FlatList" as
// standalone explanations for NewsScreen's real 0-count. This file narrows
// further by replicating NewsScreen's EXACT navigator shape (3 Stack.Screen
// entries: News/Stats/Settings) and EXACT FlatList prop shape
// (RefreshControl, ItemSeparatorComponent, ListHeaderComponent,
// ListEmptyComponent, SafeAreaView from 'react-native') with dummy content,
// to find out whether any of THOSE specifics (not present in the simpler
// probe) is what actually defeats the fiber walk.
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { View, Text, FlatList, SafeAreaView, RefreshControl } from 'react-native';
import EntranceFadeItem from '../../components/EntranceFadeItem';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

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

function dumpFiberTypeNames(rootFiber: unknown): string[] {
  const names: string[] = [];
  function nameOf(type: any): string {
    if (type == null) return String(type);
    if (typeof type === 'string') return type;
    if (type === EntranceFadeItem) return 'EntranceFadeItem(REF-MATCH)';
    if (typeof type === 'function') return `fn:${type.displayName || type.name || '(anon)'}`;
    if (typeof type === 'object') {
      const inner = type.type || type.render;
      return `obj:${type.$$typeof ? String(type.$$typeof) : 'unknown'}:${inner ? (inner.displayName || inner.name || '(anon-inner)') : '(no-inner)'}`;
    }
    return String(type);
  }
  function walk(fiber: any, depth: number) {
    if (!fiber || depth > 500) return;
    names.push(`[d${depth}] ${nameOf(fiber.type)}`);
    walk(fiber.child, depth + 1);
    walk(fiber.sibling, depth);
  }
  walk(rootFiber, 0);
  return names;
}

const Stack = createNativeStackNavigator<RootStackParamList>();

// Replicates NewsScreen.tsx's render tree shape as closely as possible with
// dummy data, bug-free (EntranceFadeItem unconditionally rendered per item).
function FullMimicProbeScreen() {
  const items = ['probe-item-a', 'probe-item-b'];
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View>
        <Text>ข่าวท่องเที่ยว</Text>
      </View>
      <FlatList
        testID="news-list"
        data={items}
        keyExtractor={(item) => item}
        renderItem={({ item, index }) => (
          <EntranceFadeItem index={index}>
            <Text>{item}</Text>
          </EntranceFadeItem>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListHeaderComponent={null}
        ListEmptyComponent={<Text>empty</Text>}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}
      />
    </SafeAreaView>
  );
}

function FullMimicProbeApp() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="News" component={FullMimicProbeScreen} />
        <Stack.Screen name="Stats" component={() => null} />
        <Stack.Screen name="Settings" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('US-34 AC2 verify round 2 — narrowing down NewsScreen-through-navigator\'s 0-count with an exact structural mimic', () => {
  it('control: the exact-structure mimic (SafeAreaView + FlatList + RefreshControl + ItemSeparator + ListHeader/Empty) is correctly counted OUTSIDE a navigator', async () => {
    await render(<FullMimicProbeScreen />);
    await waitFor(() => expect(screen.getByText('probe-item-a')).toBeTruthy());
    expect(countEntranceFadeItems()).toBe(2);
  });

  it('the exact-structure mimic, mounted through the EXACT same 3-screen (News/Stats/Settings) NavigationContainer/Stack.Navigator shape as the real NewsTestApp', async () => {
    await render(<FullMimicProbeApp />);
    await waitFor(() => expect(screen.getByText('probe-item-a')).toBeTruthy());
    // eslint-disable-next-line no-console
    console.log('FullMimic count through 3-screen navigator:', countEntranceFadeItems());
    expect(countEntranceFadeItems()).toBe(2);
  });

  it('DEBUG: dumps the fiber tree for the mimic through the navigator, to compare directly against the real NewsScreen dump', async () => {
    await render(<FullMimicProbeApp />);
    await waitFor(() => expect(screen.getByText('probe-item-a')).toBeTruthy());
    const dump = dumpFiberTypeNames(screen.root?.unstable_fiber);
    // eslint-disable-next-line no-console
    console.log('MIMIC FIBER DUMP:' + String.fromCharCode(10) + dump.join(String.fromCharCode(10)));
    expect(dump.some((n) => n.includes('EntranceFadeItem'))).toBe(true);
  });
});
