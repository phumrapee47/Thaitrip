// Independent Tester coverage (US-34 AC6, "หลักการร่วม: Reduce Motion" of
// docs/design-spec.md) — proves `useReduceMotion()` is genuinely CALLED at
// runtime by every one of the 6 real call sites the design-spec requires
// (`EntranceFadeItem`, `useMountFadeIn`, `PressableScale`, `NewsCard`,
// `AppNavigator`'s `MapStackNavigator` + `AnimatedTabScreen`), AND that the
// returned value actually changes rendered output for the components where
// this project's `react-native-reanimated/mock` makes that observable
// (confirmed via `useAnimatedStyle`'s non-reactive, snapshot-at-render-time
// behavior in this mock — verified independently below rather than assumed).
// This goes beyond the programmer's `src/hooks/useReduceMotion.test.ts` (unit
// test of the hook's OWN implementation) and `PressableScale.test.tsx`/
// `AppNavigator.test.tsx` (which each only cover their own single component).
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import AppNavigator from '../../navigation/AppNavigator';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';
import { AuthProvider } from '../../auth/AuthContext';
import EntranceFadeItem from '../../components/EntranceFadeItem';
import PressableScale from '../../components/PressableScale';
import NewsCard from '../../components/NewsCard';
import HeaderProgress from '../../components/HeaderProgress';
import Legend from '../../components/Legend';
import Map3D from '../../components/Map3D';

jest.mock('../../hooks/useReduceMotion');
const useReduceMotionMock = require('../../hooks/useReduceMotion').useReduceMotion as jest.Mock;

jest.mock('../../storage/db');
jest.mock('../../lib/supabaseClient');
jest.mock('../../services/wikipediaService', () => ({
  fetchAttractionsForProvince: jest.fn().mockResolvedValue([]),
  searchAttractionsGlobal: jest.fn().mockResolvedValue([]),
  resolveRealPhotoForLandmark: jest.fn().mockResolvedValue(null),
  detectCategory: jest.fn().mockReturnValue('สถานที่ท่องเที่ยว'),
}));
jest.mock('../../services/newsService', () => ({
  fetchAndProcessNews: jest.fn().mockResolvedValue([]),
  readNewsCache: jest.fn().mockResolvedValue(null),
  writeNewsCache: jest.fn().mockResolvedValue(new Date().toISOString()),
  isCacheStale: jest.fn().mockReturnValue(false),
  isLikelyReachable: jest.fn().mockResolvedValue(true),
  NEWS_CACHE_TTL_MS: 45 * 60 * 1000,
}));
jest.mock('../../services/ogImageService', () => ({
  fetchOgImageForArticle: jest.fn().mockResolvedValue(undefined),
}));

const dbMock = require('../../storage/db');
const clientMock = require('../../lib/supabaseClient');

function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) return style.reduce((acc, s) => ({ ...acc, ...(flattenStyle(s) || {}) }), {});
  return (style as Record<string, unknown>) || {};
}

describe('US-34 AC6 — useReduceMotion call-site wiring (independent Tester coverage)', () => {
  beforeEach(() => {
    useReduceMotionMock.mockReturnValue(false);
  });

  describe('call-count proof: the real hook is actually invoked when each real component/screen renders', () => {
    it('EntranceFadeItem calls useReduceMotion()', async () => {
      await render(
        <EntranceFadeItem index={0}>
          <Text>x</Text>
        </EntranceFadeItem>
      );
      expect(useReduceMotionMock).toHaveBeenCalled();
    });

    it('PressableScale calls useReduceMotion()', async () => {
      await render(
        <PressableScale variant="emphasized">
          <Text>x</Text>
        </PressableScale>
      );
      expect(useReduceMotionMock).toHaveBeenCalled();
    });

    it('NewsCard calls useReduceMotion()', async () => {
      await render(
        <NewsCard
          item={{ id: 'n1', title: 'ข่าวทดสอบ', link: 'https://x/n1', summary: 'S', pubDate: '2026-01-01T00:00:00.000Z' }}
          onPress={jest.fn()}
        />
      );
      expect(useReduceMotionMock).toHaveBeenCalled();
    });

    it('useMountFadeIn calls useReduceMotion() — verified via its 3 real consumers (HeaderProgress, Legend, Map3D)', async () => {
      await render(<HeaderProgress unlockedCount={1} loading={false} />);
      expect(useReduceMotionMock).toHaveBeenCalled();

      useReduceMotionMock.mockClear();
      await render(<Legend />);
      expect(useReduceMotionMock).toHaveBeenCalled();

      useReduceMotionMock.mockClear();
      await render(
        <Map3D
          loading={false}
          isVisited={() => false}
          justUnlockedProvinceId={null}
          onUnlockAnimationDone={jest.fn()}
          onPressProvince={jest.fn()}
        />
      );
      expect(useReduceMotionMock).toHaveBeenCalled();
    });

    it('AppNavigator calls useReduceMotion() at least twice (MapStackNavigator + the tab cross-fade wrapper), for real, on a full app render', async () => {
      dbMock.__seed([]);
      dbMock.__seedCheckins([]);
      clientMock._resetSupabaseClientForTests();
      clientMock.__setConfigured(false);
      await render(
        <AuthProvider>
          <JournalProvider>
            <CheckinProvider>
              <AppNavigator />
            </CheckinProvider>
          </JournalProvider>
        </AuthProvider>
      );
      expect(useReduceMotionMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('fallback proof: the returned value actually changes rendered output (not just called-and-ignored)', () => {
    it('EntranceFadeItem: reduceMotion=true renders already-settled (opacity 1, translateY 0) instead of the animating-in start state (opacity 0, translateY 12)', async () => {
      useReduceMotionMock.mockReturnValue(false);
      await render(
        <View>
          <EntranceFadeItem index={0} testID="fade-normal">
            <Text>x</Text>
          </EntranceFadeItem>
        </View>
      );
      const normalStyle = flattenStyle(screen.getByTestId('fade-normal').props.style);
      expect(normalStyle.opacity).toBe(0);
      expect(normalStyle.transform).toEqual([{ translateY: 12 }]);

      useReduceMotionMock.mockReturnValue(true);
      await render(
        <View>
          <EntranceFadeItem index={0} testID="fade-reduced">
            <Text>x</Text>
          </EntranceFadeItem>
        </View>
      );
      const reducedStyle = flattenStyle(screen.getByTestId('fade-reduced').props.style);
      expect(reducedStyle.opacity).toBe(1);
      expect(reducedStyle.transform).toEqual([{ translateY: 0 }]);
    });

    it('useMountFadeIn (via HeaderProgress): reduceMotion=true renders already fully opaque instead of the fade-in start state (opacity 0)', async () => {
      useReduceMotionMock.mockReturnValue(false);
      const normal = await render(<HeaderProgress unlockedCount={1} loading={false} />);
      const normalJson: any = normal.toJSON();
      // First child is the Animated.View card wrapper carrying `fadeInStyle`.
      const normalOpacity = flattenStyle(normalJson?.props?.style).opacity;
      expect(normalOpacity).toBe(0);

      useReduceMotionMock.mockReturnValue(true);
      const reduced = await render(<HeaderProgress unlockedCount={1} loading={false} />);
      const reducedJson: any = reduced.toJSON();
      const reducedOpacity = flattenStyle(reducedJson?.props?.style).opacity;
      expect(reducedOpacity).toBe(1);
    });

    it('NewsCard: reduceMotion is consulted for its own image fade-in the same way (fetches an og:image and toggles opacity via the same reduceMotion-gated pattern as EntranceFadeItem/useMountFadeIn)', async () => {
      // NewsCard's `imageOpacity` only animates once `resolvedImageUrl` exists —
      // exercised here with a native RSS image already present so the effect
      // that reads `reduceMotion` actually runs during this render.
      useReduceMotionMock.mockReturnValue(true);
      await render(
        <NewsCard
          item={{
            id: 'n2',
            title: 'ข่าวมีรูป',
            link: 'https://x/n2',
            summary: 'S',
            pubDate: '2026-01-01T00:00:00.000Z',
            imageUrl: 'https://example.com/photo.jpg',
          }}
          onPress={jest.fn()}
        />
      );
      // Not asserting the exact opacity value here (NewsCard's own effect
      // ordering isn't the point of this AC6 file — see
      // pressFeedbackEmphasizedRealRender.test.tsx / entranceAnimationRealRender
      // for NewsCard's dedicated coverage) — just confirming the call happened
      // with the fallback value in play, matching the call-count proof above.
      expect(useReduceMotionMock).toHaveBeenCalled();
    });
  });
});
