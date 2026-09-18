// Independent Tester (QA round 5) coverage for the "search result tap ค้าง"
// bug fixed in "รอบ 14" (docs/dev-notes.md). Root cause: HomeScreen's outer
// ScrollView (wrapping GlobalSearchBar + the 3D map) was missing
// `keyboardShouldPersistTaps="handled"`, so while the search TextInput was
// focused, the FIRST tap on a dropdown result was swallowed by the outer
// ScrollView to dismiss the keyboard instead of reaching the result's
// onPress. Fix: added `keyboardShouldPersistTaps="handled"` to that
// ScrollView.
//
// IMPORTANT LIMITATION (documented up front, not hidden): React Native
// Testing Library (react-test-renderer under the hood) does NOT implement
// RN's native touch-responder negotiation between nested ScrollViews. This is
// exactly why the programmer's original test suite (`fireEvent.press` calling
// onPress directly) passed even with the bug present — `fireEvent.press`
// invokes the target's onPress handler directly, bypassing the ancestor
// ScrollView arbitration the bug lives in. There is no way, from this
// tooling, to make `fireEvent` reproduce "ancestor ScrollView swallows the
// first tap to dismiss the keyboard". This test instead verifies the fix at
// the structural level named by the root-cause analysis itself: every
// ScrollView that can sit between a focused TextInput and a tappable result
// must declare `keyboardShouldPersistTaps="handled"`. This WILL fail if the
// fix is ever reverted, unlike the old suite. True confirmation that the
// swallow bug is gone requires a real device/emulator manual pass — flagged
// as outstanding in docs/test-report.md.
//
// NOTE on file-per-scenario + fake timers: kept as a single render/single
// `it()` file (like qa-round4's GlobalSearchBar suite already does, for a
// related reason documented in globalSearchBarDropdown.test.tsx). Empirically
// while writing this suite, combining multiple GlobalSearchBar
// focus+type interactions across several `it()`s in one file — even with
// `jest.useFakeTimers()` — left later tests in the same file unable to find
// any rendered output at all (the debounced live-Wikipedia-search timer from
// an earlier test appears to corrupt the shared react-test-renderer act()
// queue for subsequent tests in the same file). Splitting one scenario per
// file sidesteps it entirely, matching the established convention here.

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import HomeScreen from '../../screens/HomeScreen';
import ProvinceDetailScreen from '../../screens/ProvinceDetailScreen';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';

// Recursively walk the react-test-renderer JSON tree (from `.toJSON()`) and
// collect every host node, so this test can inspect real rendered props of
// native components (ScrollView, FlatList's underlying VirtualizedList, etc.)
// instead of only what our own component code passed in JSX.
function collectHostNodes(node: any, acc: any[] = []): any[] {
  if (!node) return acc;
  if (Array.isArray(node)) {
    node.forEach((n) => collectHostNodes(n, acc));
    return acc;
  }
  if (node.type) acc.push(node);
  if (node.children) collectHostNodes(node.children, acc);
  return acc;
}


jest.mock('../../storage/db');
const dbMock = require('../../storage/db');

jest.mock('../../services/wikipediaService', () => ({
  fetchAttractionsForProvince: jest.fn().mockResolvedValue([]),
  searchAttractionsGlobal: jest.fn().mockResolvedValue([]),
  resolveRealPhotoForLandmark: jest.fn().mockResolvedValue(null),
  detectCategory: jest.fn().mockReturnValue('สถานที่ท่องเที่ยว'),
}));

const SEARCH_PLACEHOLDER = 'ค้นหาจังหวัด หรือสถานที่ท่องเที่ยว...';
const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeApp() {
  return (
    <JournalProvider>
      <CheckinProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="ProvinceDetail" component={ProvinceDetailScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </CheckinProvider>
    </JournalProvider>
  );
}

describe('Bug fix 1 (รอบ 14): HomeScreen ScrollView keyboardShouldPersistTaps', () => {
  it('every ScrollView ancestor in the tree that can sit between a focused TextInput and a tappable result declares keyboardShouldPersistTaps="handled" (regression guard for the exact root cause)', async () => {
    jest.useFakeTimers();
    try {
      dbMock.__seed([]);
      dbMock.__seedCheckins([]);

      const utils = await render(<HomeApp />);
      const input = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);

      // Reproduce the real repro sequence: focus the input (as the user
      // would while typing a search), then open the dropdown by typing a
      // query that matches a landmark, so BOTH ScrollViews in play
      // (HomeScreen's outer one and GlobalSearchBar's dropdown one) are
      // mounted simultaneously.
      fireEvent(input, 'focus');
      fireEvent.changeText(input, 'หาดป่าตอง');
      await waitFor(() => expect(screen.getByText('หาดป่าตอง')).toBeTruthy());

      const hostNodes = collectHostNodes(utils.toJSON());
      const scrollViews = hostNodes.filter((n) => /scrollview/i.test(n.type));

      // Must find both: HomeScreen's own ScrollView, and GlobalSearchBar's
      // dropdown ScrollView — if either is missing this assertion is
      // testing the wrong tree.
      expect(scrollViews.length).toBeGreaterThanOrEqual(2);
      for (const sv of scrollViews) {
        expect(sv.props.keyboardShouldPersistTaps).toBe('handled');
      }
    } finally {
      jest.useRealTimers();
    }
  });
});
