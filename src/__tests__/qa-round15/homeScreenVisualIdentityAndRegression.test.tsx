// Independent Tester coverage for US-36 (HomeScreen/Map3D/HeaderProgress/
// Legend/GlobalSearchBar redesign) — walks the REAL mounted render tree
// (`toJSON()`), not source-text regexes, to confirm:
//   1. The main HomeScreen components actually render with the NEW `COLORS`/
//      `RADIUS`/`SHADOWS` token VALUES at runtime (not just "imports theme.ts"
//      in source) — US-36 AC1/AC3.
//   2. None of the OLD hardcoded hex values from before round 15 leak into
//      the rendered tree anywhere — an independent, runtime-level companion
//      to the programmer's own source-text guard (T131).
//   3. The old prop contract of Map3D/ProvinceTile3D (76 tiles, accessibility
//      label shape, tap-to-navigate) still works exactly as before — US-36
//      AC4, no regression on US-1/US-2/US-3/US-14.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import HomeScreen from '../../screens/HomeScreen';
import ProvinceDetailScreen from '../../screens/ProvinceDetailScreen';
import Map3D from '../../components/Map3D';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';
import { PROVINCES } from '../../data/thailand-provinces';
import { COLORS, RADIUS, SHADOWS } from '../../theme';

jest.mock('../../storage/db');
const dbMock = require('../../storage/db');

jest.mock('../../services/wikipediaService', () => ({
  searchAttractionsGlobal: jest.fn().mockResolvedValue([]),
}));

const Stack = createNativeStackNavigator<RootStackParamList>();

function TestApp() {
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

// Flattens every `style` (array or object) found anywhere in a rendered
// `toJSON()` tree into one array of plain style objects, so we can assert on
// concrete resolved values (backgroundColor, borderRadius, shadow*) instead
// of re-implementing StyleSheet resolution ourselves.
function collectStyles(node: any, out: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (!node) return out;
  if (Array.isArray(node)) {
    node.forEach((n) => collectStyles(n, out));
    return out;
  }
  if (node.props && node.props.style) {
    const style = node.props.style;
    if (Array.isArray(style)) style.forEach((s) => s && out.push(s));
    else out.push(style);
  }
  if (node.children) collectStyles(node.children, out);
  return out;
}

function flatten(node: any): string {
  return JSON.stringify(node);
}

// Old hex values that were hardcoded anywhere in these files/screens BEFORE
// round 15 (per docs/dev-notes.md "รอบ 15" + docs/design-spec.md's "Deep
// Jade" before/after table) — must never appear in the live render output.
const OLD_HEX_THAT_MUST_BE_GONE = [
  '#1D9E75', // old unlockedTop/accent
  '#0F6E56', // old unlockedSide/accentDark
  '#D9D9D9', // old lockedTop
  '#E8E8E8', // old lockedTopLoading
  '#1A1A1A', // old textPrimary
  '#6B6B6B', // old textSecondary
  '#E5E5E5', // old trackBg
  '#E5B93C', // old gold
  '#EAF7F1', // old HomeScreen hintBanner background
  '#EDEDED', // old Legend chip border
];

describe('US-36 AC1/AC3 — HomeScreen render tree actually uses the new theme tokens', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
  });

  it('Map3D hero canvas card resolves to COLORS.mapCanvasBg / RADIUS.xl / SHADOWS.lg', async () => {
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByLabelText(/ภูเก็ต/)).toBeTruthy());
    const styles = collectStyles(screen.toJSON());
    // `mapCanvasBg` and `surface` are BOTH '#FFFFFF' (T125 decision), and
    // GlobalSearchBar's card also uses RADIUS.xl — so backgroundColor+
    // borderRadius alone is ambiguous between the two cards. SHADOWS.lg's
    // shadowRadius (24) is unique to the Map hero card in its default state
    // (GlobalSearchBar only reaches SHADOWS.lg once focused), so anchor on
    // that plus the padding values unique to Map3D's `styles.wrapper`.
    const mapCard = styles.find(
      (s) =>
        s.backgroundColor === COLORS.mapCanvasBg &&
        s.borderRadius === RADIUS.xl &&
        s.shadowRadius === SHADOWS.lg.shadowRadius
    );
    expect(mapCard).toBeTruthy();
    expect(mapCard).toMatchObject({
      shadowOpacity: SHADOWS.lg.shadowOpacity,
      shadowRadius: SHADOWS.lg.shadowRadius,
      elevation: SHADOWS.lg.elevation,
    });
  });

  it('HeaderProgress hero-stat card resolves to COLORS.accentSurface / RADIUS.xl / SHADOWS.md, with a real gradient fill', async () => {
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByText(/ปลดล็อกแล้ว 0 \/ 76 จังหวัด/)).toBeTruthy());
    const styles = collectStyles(screen.toJSON());
    const headerCard = styles.find(
      (s) => s.backgroundColor === COLORS.accentSurface && s.borderRadius === RADIUS.xl
    );
    expect(headerCard).toBeTruthy();
    expect(headerCard).toMatchObject({
      shadowOpacity: SHADOWS.md.shadowOpacity,
      shadowRadius: SHADOWS.md.shadowRadius,
      elevation: SHADOWS.md.elevation,
    });

    // Gradient fill (accent -> accentDark), not a flat single color.
    const treeStr = flatten(screen.toJSON());
    expect(treeStr).toContain('ExpoLinearGradient');
  });

  it('Legend chips resolve to COLORS.surface + SHADOWS.sm (solid chip, not the old 1px-bordered pill), and the Province Master (US-14) chip is still present', async () => {
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByText('ยังไม่ได้ไป')).toBeTruthy());
    const styles = collectStyles(screen.toJSON());
    const legendChip = styles.find(
      (s) => s.backgroundColor === COLORS.surface && s.shadowRadius === SHADOWS.sm.shadowRadius
    );
    expect(legendChip).toBeTruthy();
    // US-14 regression: the 3rd legend chip explaining Province Master is
    // still rendered untouched, only its chip surface styling changed.
    expect(screen.getByText('เที่ยวครบทุกที่แนะนำ')).toBeTruthy();
  });

  it('GlobalSearchBar card resolves to COLORS.surface / COLORS.border, and elevates to SHADOWS.lg when focused', async () => {
    await render(<TestApp />);
    const input = await screen.findByPlaceholderText('ค้นหาจังหวัด หรือสถานที่ท่องเที่ยว...');
    const styles = collectStyles(screen.toJSON());
    const searchCard = styles.find(
      (s) => s.backgroundColor === COLORS.surface && s.borderColor === COLORS.border
    );
    expect(searchCard).toBeTruthy();

    fireEvent(input, 'focus');
    // The focus->setIsFocused(true) state update is async (batched inside a
    // passive-effect flush) — poll via waitFor instead of reading toJSON()
    // synchronously right after fireEvent, which can observe the pre-update tree.
    await waitFor(() => {
      const focusedStyles = collectStyles(screen.toJSON());
      const focusedCard = focusedStyles.find(
        (s) => s.borderColor === COLORS.accent && s.shadowRadius === SHADOWS.lg.shadowRadius
      );
      expect(focusedCard).toBeTruthy();
    });
  });

  it('none of the pre-round-15 hardcoded hex values leak into the live render tree anywhere on Home', async () => {
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByLabelText(/ภูเก็ต/)).toBeTruthy());
    const treeStr = flatten(screen.toJSON());
    for (const oldHex of OLD_HEX_THAT_MUST_BE_GONE) {
      expect(treeStr).not.toContain(oldHex);
    }
  });
});

describe('US-36 AC4 — no functional regression on Map3D/ProvinceTile3D prop contract (US-1, US-2, US-3, US-14)', () => {
  it('still renders exactly 76 province tiles, each with the original accessibilityLabel shape', async () => {
    await render(
      <Map3D
        loading={false}
        isVisited={() => false}
        justUnlockedProvinceId={null}
        onUnlockAnimationDone={jest.fn()}
        onPressProvince={jest.fn()}
      />
    );
    expect(PROVINCES.length).toBe(76);
    for (const province of PROVINCES) {
      const label = screen.getByLabelText(new RegExp(`^${province.nameTh}, `));
      expect(label.props.accessibilityLabel).toBe(`${province.nameTh}, ยังไม่ได้ไป`);
    }
  });

  it('accessibilityLabel still appends ", ครบ Province Master" only when isProvinceMaster is true for that tile', async () => {
    await render(
      <Map3D
        loading={false}
        isVisited={(id) => id === 'phuket'}
        justUnlockedProvinceId={null}
        onUnlockAnimationDone={jest.fn()}
        onPressProvince={jest.fn()}
        isProvinceMaster={(id) => id === 'phuket'}
      />
    );
    const phuketTile = screen.getByLabelText(/^ภูเก็ต, /);
    expect(phuketTile.props.accessibilityLabel).toBe('ภูเก็ต, ไปแล้ว, ครบ Province Master');
    const otherTile = screen.getByLabelText(/^เชียงใหม่, /);
    expect(otherTile.props.accessibilityLabel).toBe('เชียงใหม่, ยังไม่ได้ไป');
  });

  it('tapping a province tile from the real Home screen still calls onPressProvince / navigates to ProvinceDetail (US-2 AC1 end-to-end)', async () => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByLabelText(/^ภูเก็ต, /)).toBeTruthy());
    fireEvent.press(screen.getByLabelText(/^ภูเก็ต, /));
    await waitFor(() => expect(screen.getByText('ภูเก็ต')).toBeTruthy());
    expect(screen.getByText('ยังไม่มีบันทึกของจังหวัดนี้')).toBeTruthy();
  });

  it('search result selection from the real Home screen still navigates to the correct province (US-24/US-26 end-to-end, unaffected by the new search-bar card styling)', async () => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
    await render(<TestApp />);
    const input = await screen.findByPlaceholderText('ค้นหาจังหวัด หรือสถานที่ท่องเที่ยว...');
    fireEvent(input, 'focus');
    fireEvent.changeText(input, 'เชียงใหม่');
    await waitFor(() => expect(screen.getByText(/จังหวัด \(Chiang Mai\)/)).toBeTruthy());
    fireEvent.press(screen.getByText('เชียงใหม่'));
    await waitFor(() => expect(screen.getByText('เชียงใหม่')).toBeTruthy());
  });
});

