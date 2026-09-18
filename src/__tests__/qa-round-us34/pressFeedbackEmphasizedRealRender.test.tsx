// Independent Tester coverage (US-34 AC3) — different angle from the
// programmer's own `src/components/PressableScale.test.tsx` (which tests the
// `PressableScale` component in isolation with a hand-written `variant` prop).
// This file instead renders the REAL call sites (`LandmarkCard`, `NewsCard`,
// `ProvinceDetailScreen`, `LandmarkList`, `SettingsScreen`) and inspects the
// ACTUAL `variant` prop each one passes to its mounted `PressableScale`
// instances — by locating a specific interactive element via its visible
// text and walking UP the real React fiber tree (`fiber.return`, which
// includes composite ancestors, unlike the host-only `TestInstance.parent`)
// to its nearest `PressableScale` ancestor. This proves the prop is actually
// wired at the real call site, not just present somewhere in the file text.
//
// *** THIS FILE SURFACES A REAL AC3 GAP — see docs/test-report.md for the
// full writeup. Summary: ProvinceDetailScreen has TWO separate "+
// เพิ่มบันทึกใหม่" buttons with the exact literal label AC3 names — the header
// CTA (shown once a province already has >=1 entry) DOES get
// `variant="emphasized"`, but the `EmptyState` CTA (shown for a
// brand-new/empty province — the more common first-time scenario) does NOT,
// because it goes through the generic, unmodified `EmptyState` component. ***
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PressableScale from '../../components/PressableScale';
import LandmarkCard from '../../components/LandmarkCard';
import NewsCard from '../../components/NewsCard';
import ProvinceDetailScreen from '../../screens/ProvinceDetailScreen';
import SettingsScreen from '../../screens/SettingsScreen';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';
import { AuthProvider } from '../../auth/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import type { Landmark } from '../../data/thailand-landmarks';

jest.mock('../../storage/db');
jest.mock('../../lib/supabaseClient');
const dbMock = require('../../storage/db');
const clientMock = require('../../lib/supabaseClient');

jest.mock('../../services/wikipediaService', () => ({
  fetchAttractionsForProvince: jest.fn().mockResolvedValue([]),
  searchAttractionsGlobal: jest.fn().mockResolvedValue([]),
  resolveRealPhotoForLandmark: jest.fn().mockResolvedValue(null),
  detectCategory: jest.fn().mockReturnValue('สถานที่ท่องเที่ยว'),
}));

jest.mock('../../services/ogImageService', () => ({
  fetchOgImageForArticle: jest.fn().mockResolvedValue(undefined),
}));

/** Locates the nearest `PressableScale` ANCESTOR (via the real fiber
 * `.return` chain, which — unlike RNTL's host-only `TestInstance.parent` —
 * includes composite component fibers) of the element matching `text`, and
 * returns the `variant` prop it was actually mounted with (`undefined` if the
 * caller never passed one, i.e. real `default` behavior). Throws descriptively
 * if no `PressableScale` ancestor exists at all, so a typo'd `text` fails
 * loudly instead of silently returning `undefined` and being misread as
 * "variant not set".
 */
function findVariantForText(text: string | RegExp): string | undefined {
  const inst = screen.getByText(text);
  let fiber: any = inst.unstable_fiber;
  while (fiber) {
    if (fiber.type === PressableScale) return fiber.memoizedProps?.variant;
    fiber = fiber.return;
  }
  throw new Error(`No PressableScale ancestor found for text: ${text}`);
}

const SAMPLE_LANDMARK: Landmark = {
  id: 'test-landmark-1',
  provinceId: 'phuket',
  nameTh: 'ทดสอบแลนด์มาร์ค',
  category: 'ธรรมชาติและภูเขา',
  description: 'คำอธิบายทดสอบ',
  imageUrl: 'https://example.com/photo.jpg',
};

describe('US-34 AC3 — press-feedback `variant="emphasized"` real call-site checks (independent Tester coverage)', () => {
  it('LandmarkCard (hero variant): BOTH the whole-card wrapper and the check-in button are mounted with variant="emphasized"', async () => {
    await render(
      <View>
        <LandmarkCard landmark={SAMPLE_LANDMARK} visited={false} onToggle={jest.fn()} variant="hero" />
      </View>
    );
    expect(findVariantForText('ทดสอบแลนด์มาร์ค')).toBe('emphasized'); // the card wrapper (hero title lives directly inside it)
    expect(findVariantForText('+ กดเช็คอิน')).toBe('emphasized'); // the check-in button
  });

  it('LandmarkCard (compact variant, e.g. grid cards): both PressableScale sites are still emphasized', async () => {
    await render(
      <View>
        <LandmarkCard landmark={SAMPLE_LANDMARK} visited={true} onToggle={jest.fn()} variant="compact" />
      </View>
    );
    expect(findVariantForText('ทดสอบแลนด์มาร์ค')).toBe('emphasized'); // compact title lives directly inside the card wrapper
    expect(findVariantForText('✓ เช็คอินแล้ว')).toBe('emphasized');
  });

  it('NewsCard: mounted with variant="emphasized"', async () => {
    await render(
      <View>
        <NewsCard
          item={{ id: 'n1', title: 'ข่าวทดสอบ', link: 'https://x/n1', summary: 'สรุปข่าว', pubDate: '2026-01-01T00:00:00.000Z' }}
          onPress={jest.fn()}
        />
      </View>
    );
    expect(findVariantForText('ข่าวทดสอบ')).toBe('emphasized');
  });

  describe('ProvinceDetailScreen — the two distinct "+ เพิ่มบันทึกใหม่" buttons AC3 names', () => {
    function ProvinceDetailTestApp({ provinceId }: { provinceId: string }) {
      const Stack = createNativeStackNavigator<RootStackParamList>();
      return (
        <AuthProvider>
          <JournalProvider>
            <CheckinProvider>
              <NavigationContainer>
                <Stack.Navigator
                  screenOptions={{ headerShown: false }}
                  initialRouteName="ProvinceDetail"
                >
                  <Stack.Screen name="ProvinceDetail" component={ProvinceDetailScreen} initialParams={{ provinceId }} />
                  <Stack.Screen name="AddEntry" component={() => null} />
                </Stack.Navigator>
              </NavigationContainer>
            </CheckinProvider>
          </JournalProvider>
        </AuthProvider>
      );
    }

    beforeEach(() => {
      dbMock.__seed([]);
      dbMock.__seedCheckins([]);
      clientMock._resetSupabaseClientForTests();
      clientMock.__setConfigured(false);
    });

    it('the HEADER "+ เพิ่มบันทึกใหม่" CTA (shown once a province already has >=1 entry) IS variant="emphasized"', async () => {
      dbMock.__seed([
        {
          id: 'e1', provinceId: 'phuket', date: '2026-01-01', title: 'ทริปภูเก็ต', notes: '', photoUris: [], tags: [],
          updatedAt: '2026-01-01T00:00:00.000Z', syncedAt: null, cloudId: null, retryCount: 0, placeLat: null, placeLng: null,
        },
      ]);
      await render(<ProvinceDetailTestApp provinceId="phuket" />);
      await waitFor(() => expect(screen.getByText('+ เพิ่มบันทึกใหม่')).toBeTruthy());
      expect(findVariantForText('+ เพิ่มบันทึกใหม่')).toBe('emphasized');
    });

    it('AC3 GAP: the EmptyState "+ เพิ่มบันทึกใหม่" CTA (shown for a brand-new province with 0 entries — the common first-run case) is NOT variant="emphasized" (still plain default press feedback)', async () => {
      // 0 entries for this province -> ProvinceDetailScreen renders the
      // `EmptyState` CTA instead of its own header CTA (see
      // src/screens/ProvinceDetailScreen.tsx lines ~88-105).
      await render(<ProvinceDetailTestApp provinceId="phuket" />);
      await waitFor(() => expect(screen.getByText('+ เพิ่มบันทึกใหม่')).toBeTruthy());
      // This is the CURRENT (unenhanced) behavior — asserting it explicitly
      // documents the gap rather than letting a silent `undefined` slip by.
      expect(findVariantForText('+ เพิ่มบันทึกใหม่')).toBeUndefined();
    });
  });

  describe('Regression guard: PressableScale call sites OUTSIDE US-34 AC3\'s scope still render with plain default variant (no scope creep)', () => {
    it('LandmarkList\'s view-mode toggle and category-pill buttons stay variant="default" (undefined)', async () => {
      const LandmarkList = require('../../components/LandmarkList').default;
      await render(
        <LandmarkList provinceId="phuket" provinceNameTh="ภูเก็ต" checkins={{}} loading={false} onToggle={jest.fn()} />
      );
      await waitFor(() => expect(screen.getByText('🖼️ การ์ด')).toBeTruthy());
      expect(findVariantForText('🖼️ การ์ด')).toBeUndefined();
      expect(findVariantForText('ทั้งหมด')).toBeUndefined();
    });

    it('ProvinceDetailScreen\'s own "‹ กลับ" back button stays variant="default" (undefined)', async () => {
      dbMock.__seed([]);
      dbMock.__seedCheckins([]);
      clientMock._resetSupabaseClientForTests();
      clientMock.__setConfigured(false);
      const Stack = createNativeStackNavigator<RootStackParamList>();
      await render(
        <AuthProvider>
          <JournalProvider>
            <CheckinProvider>
              <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="ProvinceDetail">
                  <Stack.Screen name="ProvinceDetail" component={ProvinceDetailScreen} initialParams={{ provinceId: 'phuket' }} />
                </Stack.Navigator>
              </NavigationContainer>
            </CheckinProvider>
          </JournalProvider>
        </AuthProvider>
      );
      await waitFor(() => expect(screen.getByText('‹ กลับ')).toBeTruthy());
      expect(findVariantForText('‹ กลับ')).toBeUndefined();
    });

    it('SettingsScreen\'s back button stays variant="default" (undefined)', async () => {
      const Stack = createNativeStackNavigator<RootStackParamList>();
      await render(
        <AuthProvider>
          <JournalProvider>
            <CheckinProvider>
              <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Settings">
                  <Stack.Screen name="Settings" component={SettingsScreen} />
                </Stack.Navigator>
              </NavigationContainer>
            </CheckinProvider>
          </JournalProvider>
        </AuthProvider>
      );
      await waitFor(() => expect(screen.getByText('‹ กลับ')).toBeTruthy());
      expect(findVariantForText('‹ กลับ')).toBeUndefined();
    });
  });
});
