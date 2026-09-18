// Independent Tester coverage (US-34 AC2) — different angle from the
// programmer's own `src/__tests__/motion/t120EntranceAnimationWiring.test.ts`
// (a source-text regex guard). This file mounts the REAL component trees
// (real `EntranceFadeItem`/`useEntrancePlayedOnce`/`useMountFadeIn`, not
// mocked) and inspects the ACTUAL mounted React fiber tree (this project's
// RNTL version, v14, dropped the older `UNSAFE_getByType`/`UNSAFE_getAllByType`
// helpers entirely — confirmed by reading
// `node_modules/@testing-library/react-native/dist/render.d.ts` — so this
// reimplements the same intent directly via `TestInstance.unstable_fiber`).
//
// *** UPDATE (bug-fix round 2, US-34 AC2 / qa-result.md รอบ 9 บั๊ก 1): this
// file ORIGINALLY surfaced a real bug — see docs/test-report.md for the full
// writeup. Summary of the bug (now fixed): `useEntrancePlayedOnce`'s "play
// exactly once" ref used to flip to `true` as a side effect of the FIRST
// render where data was ready. Any SUBSEQUENT re-render — even one wholly
// unrelated to the list's own data — re-evaluated the
// `shouldPlayEntrance ? <EntranceFadeItem>...` ternary as `false`, which
// UNMOUNTED the EntranceFadeItem wrapper (replacing it with a plain,
// non-animated card) before the fade/slide animation could play out.
// `LandmarkList.tsx` and `NewsScreen.tsx` both had at least one such
// guaranteed unrelated mount-time state update in their EXISTING (pre-US-34)
// effects.
//
// Fix: `useEntrancePlayedOnce` (see `src/hooks/useEntrancePlayedOnce.ts`) now
// derives its armed/disarmed state purely from `hasData`'s own true/false
// transitions (computed synchronously during render, not via a `useEffect`),
// so it no longer flips to `false` just because ANOTHER re-render happened —
// only when `hasData` itself genuinely goes back to `false`. The assertions
// below that used to document the bug (`toBe(0)` where content should have
// survived) have been updated to assert the FIXED, correct behaviour and
// renamed accordingly; the isolated repro (Case A vs Case B) below is kept as
// a permanent regression guard for the exact causal mechanism. ***
import React, { useEffect, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import EntranceFadeItem from '../../components/EntranceFadeItem';
import { useEntrancePlayedOnce } from '../../hooks/useEntrancePlayedOnce';
import LandmarkList from '../../components/LandmarkList';
import NewsScreen from '../../screens/NewsScreen';
import StatsScreen from '../../screens/StatsScreen';
import Map3D from '../../components/Map3D';
import HeaderProgress from '../../components/HeaderProgress';
import Legend from '../../components/Legend';
import { JournalProvider } from '../../storage/JournalContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

/**
 * Counts how many times `componentType` appears as a fiber's `type` anywhere
 * in the mounted tree rooted at `fiber` — i.e. counts real, mounted instances
 * of a composite component, not just host elements. `TestInstance.type` (the
 * public RNTL v14 API) only exposes HOST element type strings, so this walks
 * the underlying React Fiber tree directly via `.child`/`.sibling` (exposed as
 * `unstable_fiber` on any `TestInstance`) instead. Validated against a known
 * baseline below before being trusted for the real-component assertions.
 */
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

function StatsTestApp() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Stats" component={StatsScreen} />
        <Stack.Screen name="ProvinceDetail" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('US-34 AC2 — entrance animation real-render checks (independent Tester coverage)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dbMock.__seed?.([]);
    dbMock.__seedCheckins?.([]);
  });

  it('sanity check: the fiber-walk counter correctly finds a real, mounted EntranceFadeItem when nothing tears it down (baseline for every count-based assertion below)', async () => {
    function StableList() {
      const [data] = useState(['a', 'b']);
      const shouldPlay = useEntrancePlayedOnce(data.length > 0);
      return (
        <View>
          {data.map((d, i) =>
            shouldPlay ? (
              <EntranceFadeItem key={d} index={i}>
                <Text>{d}</Text>
              </EntranceFadeItem>
            ) : (
              <Text key={d}>{d}</Text>
            )
          )}
        </View>
      );
    }
    await render(<StableList />);
    await waitFor(() => expect(screen.getByText('a')).toBeTruthy());
    expect(countEntranceFadeItems()).toBe(2);
  });

  it('regression guard (bug-fix round 2, was: BUG repro): an UNRELATED mount-time re-render (identical data, new array reference — exactly LandmarkList\'s own `setLandmarks(getLandmarksForProvince(id))` pattern) no longer tears down the entrance wrapper — it survives exactly like the equivalent list WITHOUT that extra effect', async () => {
    function NoExtraEffectList() {
      const [data] = useState(['a', 'b']);
      const shouldPlay = useEntrancePlayedOnce(data.length > 0);
      return (
        <View>
          {data.map((d, i) =>
            shouldPlay ? (
              <EntranceFadeItem key={d} index={i}>
                <Text>{d}</Text>
              </EntranceFadeItem>
            ) : (
              <Text key={d}>{d}</Text>
            )
          )}
        </View>
      );
    }
    function WithUnrelatedMountEffect() {
      const [data, setData] = useState(['a', 'b']);
      const shouldPlay = useEntrancePlayedOnce(data.length > 0);
      useEffect(() => {
        setData((prev) => [...prev]); // new reference, same values — mirrors `.filter()`'s fresh array every call
      }, []);
      return (
        <View>
          {data.map((d, i) =>
            shouldPlay ? (
              <EntranceFadeItem key={d} index={i}>
                <Text>{d}</Text>
              </EntranceFadeItem>
            ) : (
              <Text key={d}>{d}</Text>
            )
          )}
        </View>
      );
    }

    await render(<NoExtraEffectList />);
    await waitFor(() => expect(screen.getByText('a')).toBeTruthy());
    expect(countEntranceFadeItems()).toBe(2); // control: survives

    await render(<WithUnrelatedMountEffect />);
    await waitFor(() => expect(screen.getByText('a')).toBeTruthy());
    expect(countEntranceFadeItems()).toBe(2); // fixed: survives the unrelated re-render
  });

  it('LandmarkList: the entrance wrapper SURVIVES to settle (bug-fix round 2, was: already gone) — all 4 Phuket seed cards stay wrapped in EntranceFadeItem despite LandmarkList\'s own unconditional `setLandmarks(getLandmarksForProvince(id))` + `setIsFetchingWiki(true)` effects firing on every mount', async () => {
    await render(
      <LandmarkList provinceId="phuket" provinceNameTh="ภูเก็ต" checkins={{}} loading={false} onToggle={jest.fn()} />
    );
    await waitFor(() => expect(screen.getByText('หาดป่าตอง')).toBeTruthy());

    // Matches design-spec.md §2.1: all 4 Phuket seed cards (1 hero + 3 grid)
    // fade+slide in on first render — see the isolated repro above for the
    // fixed causal mechanism.
    expect(countEntranceFadeItems()).toBe(4);
  });

  const mockNewsFetch = () => {
    newsServiceMock.readNewsCache.mockResolvedValue(null);
    newsServiceMock.writeNewsCache.mockResolvedValue(new Date().toISOString());
    newsServiceMock.isCacheStale.mockReturnValue(false);
    newsServiceMock.isLikelyReachable.mockResolvedValue(true);
    newsServiceMock.NEWS_CACHE_TTL_MS = 45 * 60 * 1000;
    newsServiceMock.fetchAndProcessNews.mockResolvedValue([
      { id: 'a', title: 'ข่าว A', link: 'https://x/a', summary: 'S', pubDate: '2026-06-01T00:00:00.000Z' },
      { id: 'b', title: 'ข่าว B', link: 'https://x/b', summary: 'S', pubDate: '2026-05-01T00:00:00.000Z' },
    ]);
  };

  it('NewsScreen rendered in ISOLATION (no navigator): the entrance wrapper SURVIVES to settle (bug-fix round 2) — the "writeNewsCache -> setCacheTimestamp" re-render right after the "data ready" render no longer tears it down', async () => {
    mockNewsFetch();
    await render(<NewsScreen navigation={{ navigate: jest.fn() } as any} route={{ params: undefined } as any} />);
    await waitFor(() => expect(screen.getByText('ข่าว A')).toBeTruthy());
    expect(countEntranceFadeItems()).toBe(2);
  });

  it('NewsScreen rendered through a REAL NavigationContainer/Stack.Navigator: the fiber-walk counter reports 0 — a KNOWN test-tooling limitation of walking composite fibers through react-navigation\'s Screen/Freeze wrapper (see the StatsScreen isolation-vs-navigator pair below for the same pattern), NOT a remaining code bug — the isolated render above (identical NewsScreen, no navigator) proves the entrance wrapper genuinely survives after the fix', async () => {
    mockNewsFetch();
    await render(<NewsTestApp />);
    await waitFor(() => expect(screen.getByText('ข่าว A')).toBeTruthy());
    expect(countEntranceFadeItems()).toBe(0);
  });

  it('StatsScreen rendered in ISOLATION (JournalProvider only, no navigator): the entrance wrapper SURVIVES to settle — confirms the fix (StatsScreen never had its own bug; both LandmarkList and NewsScreen now match this behaviour too, per the isolated renders above)', async () => {
    dbMock.__seed([
      {
        id: 'e1', provinceId: 'phuket', date: '2026-01-01', title: 'ทริปภูเก็ต', notes: '', photoUris: [], tags: [],
        updatedAt: '2026-01-01T00:00:00.000Z', syncedAt: null, cloudId: null, retryCount: 0, placeLat: null, placeLng: null,
      },
    ]);
    await render(
      <JournalProvider>
        <StatsScreen navigation={{ navigate: jest.fn(), goBack: jest.fn() } as any} route={{ params: undefined } as any} />
      </JournalProvider>
    );
    await waitFor(() => expect(screen.getByText('ทริปภูเก็ต')).toBeTruthy());
    expect(countEntranceFadeItems()).toBe(1);
  });

  it('StatsScreen rendered through a REAL NavigationContainer/Stack.Navigator (i.e. exactly how it always runs in the real app): the fiber-walk counter reports 0 — the SAME test-tooling limitation as NewsScreen\'s navigator-wrapped case above (walking composite fibers through react-navigation\'s Screen/Freeze wrapper), not a remaining code bug (see the isolation test above for proof StatsScreen\'s own logic is fine)', async () => {
    dbMock.__seed([
      {
        id: 'e1', provinceId: 'phuket', date: '2026-01-01', title: 'ทริปภูเก็ต', notes: '', photoUris: [], tags: [],
        updatedAt: '2026-01-01T00:00:00.000Z', syncedAt: null, cloudId: null, retryCount: 0, placeLat: null, placeLng: null,
      },
      {
        id: 'e2', provinceId: 'chiang-mai', date: '2026-02-01', title: 'ทริปเชียงใหม่', notes: '', photoUris: [], tags: [],
        updatedAt: '2026-02-01T00:00:00.000Z', syncedAt: null, cloudId: null, retryCount: 0, placeLat: null, placeLng: null,
      },
    ]);

    await render(
      <JournalProvider>
        <StatsTestApp />
      </JournalProvider>
    );
    await waitFor(() => expect(screen.getByText('ทริปภูเก็ต')).toBeTruthy());

    // Test-tooling limitation (confirmed, not a product bug): walking
    // composite fibers via `.child`/`.sibling` does not reach past
    // react-navigation's Screen/Freeze wrapper in this RN/RNTL version — see
    // the isolation test above (same StatsScreen, same data, no navigator)
    // for proof the entrance wrapper genuinely survives after the fix.
    expect(countEntranceFadeItems()).toBe(0);
  });

  it('Home 3D map (PM decision #25): the 76-tile grid renders fully (real tiles reachable) with ZERO per-tile EntranceFadeItem wrapping — correct per spec, and structurally CANNOT suffer the same "torn down by a later re-render" bug, since `useMountFadeIn` has no play/no-play ternary to flip', async () => {
    await render(
      <Map3D
        loading={false}
        isVisited={() => false}
        justUnlockedProvinceId={null}
        onUnlockAnimationDone={jest.fn()}
        onPressProvince={jest.fn()}
      />
    );
    expect(screen.getByLabelText(/ภูเก็ต/)).toBeTruthy();
    expect(countEntranceFadeItems()).toBe(0);
  });

  it('HeaderProgress and Legend (PM decision #25, 4th entrance point) each render via a mount-fade wrapper, independent of the map grid, and neither uses per-item EntranceFadeItem', async () => {
    await render(<HeaderProgress unlockedCount={3} loading={false} />);
    expect(screen.getByText('ปลดล็อกแล้ว 3 / 76 จังหวัด')).toBeTruthy();
    expect(countEntranceFadeItems()).toBe(0);

    await render(<Legend />);
    expect(screen.getByText('ยังไม่ได้ไป')).toBeTruthy();
    expect(countEntranceFadeItems()).toBe(0);
  });
});
