// Independent Tester debug probe (US-34 AC2 verify round 2) — follow-up to
// navigatorFiberWalkLimitationProbe.test.tsx, which REFUTED the "navigator
// wrapper generically blocks the fiber walk" and "FlatList blocks the fiber
// walk" explanations (both a plain-View screen and a FlatList-based screen,
// bug-free, mounted through the exact same NavigationContainer/Stack.Navigator
// wrapper as NewsScreen, were correctly counted as 2, not 0).
//
// This means the 0-count for the REAL NewsScreen through a real navigator
// needs a different explanation. This file spies on the REAL
// `useEntrancePlayedOnce` hook (not a fake/mocked implementation — the
// genuine module, just wrapped to record every call's argument and return
// value) while mounting NewsScreen through the exact same NavigationContainer
// wrapper as the programmer's own test, to see directly whether
// `shouldPlayEntrance` is ever actually `false` at the moment content settles
// — which would mean a REAL leftover bug (the ternary legitimately renders
// the plain/non-animated branch), as opposed to the fiber-walk merely failing
// to SEE an EntranceFadeItem that is genuinely mounted.
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

// Spy on the REAL hook: delegate to the actual implementation, just record
// every (args, returnValue) pair so we can inspect the true sequence of
// hasData/armed transitions NewsScreen's own hook calls went through, from
// inside the real navigator-wrapped tree.
const callLog: Array<{ hasData: boolean; returned: boolean }> = [];
jest.mock('../../hooks/useEntrancePlayedOnce', () => {
  const actual = jest.requireActual('../../hooks/useEntrancePlayedOnce');
  return {
    __esModule: true,
    useEntrancePlayedOnce: (hasData: boolean) => {
      const returned = actual.useEntrancePlayedOnce(hasData);
      callLog.push({ hasData, returned });
      return returned;
    },
  };
});

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

describe('US-34 AC2 verify round 2 — is NewsScreen-through-navigator\'s 0-count a real bug or a fiber-walk artifact?', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    callLog.length = 0;
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
  });

  it('records every real useEntrancePlayedOnce(hasData) call NewsScreen makes while mounted through a real NavigationContainer, and asserts the LAST recorded value (the one actually used for the settled render) is `true` — i.e. shouldPlayEntrance is genuinely true when content is on screen, not just "the fiber walk failed to find it"', async () => {
    await render(<NewsTestApp />);
    await waitFor(() => expect(screen.getByText('ข่าว A')).toBeTruthy());

    // eslint-disable-next-line no-console
    console.log('useEntrancePlayedOnce call log (NewsScreen via real navigator):', JSON.stringify(callLog));

    expect(callLog.length).toBeGreaterThan(0);
    const last = callLog[callLog.length - 1];
    expect(last.hasData).toBe(true);
    // This is the crux: if `returned` were `false` here, NewsScreen's OWN
    // render would have genuinely chosen the non-animated ternary branch —
    // a real bug, not a test-tooling artifact. If `true`, the component
    // really did render EntranceFadeItem, and the fiber-walk counter's 0 in
    // the sibling test file is confirmed to be a counting-technique
    // limitation, not evidence of a remaining product bug.
    expect(last.returned).toBe(true);

    // Also assert it never regressed to false at any point AFTER data first
    // became available (i.e. no unrelated re-render tore it down mid-flight,
    // which is exactly the original AC2 bug this whole round exists to fix).
    const firstTrueIndex = callLog.findIndex((c) => c.hasData === true && c.returned === true);
    expect(firstTrueIndex).toBeGreaterThanOrEqual(0);
    for (let i = firstTrueIndex; i < callLog.length; i++) {
      if (callLog[i].hasData === true) {
        expect(callLog[i].returned).toBe(true);
      }
    }
  });
});
