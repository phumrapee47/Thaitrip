// Independent Tester follow-up (US-34 AC2 verify round 2). The custom
// `.child`/`.sibling` fiber-walk counter used in
// `entranceAnimationRealRender.test.tsx` reports `countEntranceFadeItems()
// === 0` for the REAL NewsScreen mounted through a real
// NavigationContainer/Stack.Navigator — dev-notes.md (bug-fix round 2)
// attributes this to react-navigation's Screen/Freeze wrapper defeating the
// walk. Independent probing in navigatorFiberWalkLimitationProbe.test.tsx
// and navigatorFiberWalkLimitationProbe2.test.tsx REFUTED that specific
// explanation: a bug-free plain-View screen AND a bug-free FlatList-based
// screen with an otherwise-identical navigator/prop shape are BOTH still
// correctly counted (2, not 0) through the exact same wrapper — so "the
// navigator wrapper" alone cannot be the true cause for the real NewsScreen.
//
// This file settles the actual question that matters for AC2 — is
// EntranceFadeItem genuinely mounted around both news items in the real,
// navigator-wrapped render, or not? — using `toJSON()`, RNTL's own official,
// stable snapshot API (ground truth, independent of any custom fiber-walk
// technique), instead of relying on the (now proven unreliable in this one
// specific case) custom walk OR on the programmer's own instrumentation.
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NewsScreen from '../../screens/NewsScreen';
import type { RootStackParamList } from '../../navigation/types';

jest.mock('../../storage/db');
const dbMock = require('../../storage/db');
jest.mock('../../services/wikipediaService', () => ({
  fetchAttractionsForProvince: jest.fn().mockResolvedValue([]),
  searchAttractionsGlobal: jest.fn().mockResolvedValue([]),
  resolveRealPhotoForLandmark: jest.fn().mockResolvedValue(null),
  detectCategory: jest.fn().mockReturnValue('สถานที่ท่องเที่ยว'),
}));
jest.mock('../../services/newsService');
const newsServiceMock = require('../../services/newsService');
jest.mock('../../services/ogImageService', () => ({
  fetchOgImageForArticle: jest.fn().mockResolvedValue(undefined),
}));

// EntranceFadeItem (src/components/EntranceFadeItem.tsx) renders exactly:
// `<Animated.View testID={testID} style={[style, animatedStyle]}>` where
// `animatedStyle` starts as `{ opacity: 0, transform: [{ translateY: 12 }] }`
// (reduceMotion off) on first paint before the timing animation advances.
// Counting host nodes in the `toJSON()` tree whose flattened style contains
// BOTH an `opacity` key and a `transform` array with a `translateY` entry is
// therefore a reliable, RNTL-native (not custom-fiber-walk) ground-truth
// signature for "an EntranceFadeItem wrapper is genuinely mounted here" —
// no other component in NewsScreen's tree produces that exact style shape.
function countEntranceFadeItemHostNodesViaJSON(node: any): number {
  if (!node) return 0;
  let count = 0;
  const style = node.props?.style;
  const flatStyle = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
  if (
    flatStyle &&
    typeof flatStyle === 'object' &&
    'opacity' in flatStyle &&
    Array.isArray(flatStyle.transform) &&
    flatStyle.transform.some((t: any) => t && typeof t === 'object' && 'translateY' in t)
  ) {
    count += 1;
  }
  const children = node.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      count += countEntranceFadeItemHostNodesViaJSON(child);
    }
  }
  return count;
}

const Stack = createNativeStackNavigator<RootStackParamList>();
function NewsTestApp() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="News" component={NewsScreen} />
        <Stack.Screen name="Stats" component={() => null} />
        <Stack.Screen name="Settings" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('US-34 AC2 verify round 2 — ground-truth check (toJSON, not the custom fiber-walk) for NewsScreen through a real navigator', () => {
  it('confirms via RNTL toJSON() (official API, independent of the project custom fiber-walk counter) that EntranceFadeItem Animated.View wrapper is genuinely mounted around BOTH news items when NewsScreen is rendered through a real NavigationContainer/Stack.Navigator - proving the fiber-walk 0-count in the sibling test file is a limitation of that ONE counting technique, not a remaining product bug', async () => {
    jest.clearAllMocks();
    dbMock.__seed?.([]);
    dbMock.__seedCheckins?.([]);
    newsServiceMock.readNewsCache.mockResolvedValue(null);
    newsServiceMock.writeNewsCache.mockResolvedValue(new Date().toISOString());
    newsServiceMock.isCacheStale.mockReturnValue(false);
    newsServiceMock.isLikelyReachable.mockResolvedValue(true);
    newsServiceMock.NEWS_CACHE_TTL_MS = 45 * 60 * 1000;
    newsServiceMock.fetchAndProcessNews.mockResolvedValue([
      { id: 'a', title: 'ข่าว A', link: 'https://x/a', summary: 'S', pubDate: '2026-06-01T00:00:00.000Z' },
      { id: 'b', title: 'ข่าว B', link: 'https://x/b', summary: 'S', pubDate: '2026-05-01T00:00:00.000Z' },
    ]);

    await render(<NewsTestApp />);
    await waitFor(() => expect(screen.getByText('ข่าว A')).toBeTruthy());
    await waitFor(() => expect(screen.getByText('ข่าว B')).toBeTruthy());

    const tree = screen.toJSON();
    const count = countEntranceFadeItemHostNodesViaJSON(tree);
    expect(count).toBe(2);
  });
});
