// Independent Tester coverage for US-35 (Color Palette decision gate + apply)
// — a DIFFERENT angle from the programmer's own
// `src/__tests__/theme/noHardcodedHexRound15.test.ts` (which only regex-scans
// the 6 redesigned files for hex/rgba literals). This file:
//   1. Re-implements the WCAG relative-luminance/contrast formula from
//      scratch (no shared code with dev-notes.md's manual arithmetic or any
//      programmer test) and recomputes the 4 pairs named in US-35 AC2 /
//      requested by the orchestrator, independently confirming the numbers
//      claimed in docs/dev-notes.md "รอบ 15".
//   2. Scans the 6 redesigned files with a BROADER regex than T131's
//      (hex/rgba AND common CSS named colors) to catch anything the
//      programmer's own guard might have missed.
//   3. Confirms the "before/after" delta on the palette's pivot tokens is
//      substantial (US-35 AC5 — "ไม่ใช่ปรับ hex เพียงเล็กน้อยจนแทบมองไม่เห็น
//      ความต่าง"), and that each token's semantic hue family (green=unlocked,
//      gray=locked, gold=warning/master, red=danger) is preserved (US-35 AC4).
import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import HomeScreen from '../../screens/HomeScreen';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';
import { COLORS } from '../../theme';

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
          </Stack.Navigator>
        </NavigationContainer>
      </CheckinProvider>
    </JournalProvider>
  );
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full.slice(0, 6), 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function relLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hexA: string, hexB: string) {
  const lA = relLuminance(hexToRgb(hexA));
  const lB = relLuminance(hexToRgb(hexB));
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

// Composite a translucent rgba(...) color over an opaque background hex,
// returning an opaque hex — needed because `tooltipBg`/`mapAmbientShadow`
// are semi-transparent.
function compositeRgbaOverHex(rgba: string, bgHex: string): string {
  const m = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)/);
  if (!m) throw new Error(`not an rgba() string: ${rgba}`);
  const [, rS, gS, bS, aS] = m;
  const a = aS !== undefined ? parseFloat(aS) : 1;
  const bg = hexToRgb(bgHex);
  const r = Math.round(parseInt(rS, 10) * a + bg.r * (1 - a));
  const g = Math.round(parseInt(gS, 10) * a + bg.g * (1 - a));
  const b = Math.round(parseInt(bS, 10) * a + bg.b * (1 - a));
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

const WCAG_AA_NORMAL_TEXT = 4.5;

describe('US-35 AC2 — WCAG AA contrast, computed independently from scratch', () => {
  it('textPrimary on background >= 4.5:1', () => {
    expect(contrastRatio(COLORS.textPrimary, COLORS.background)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
  });

  it('textSecondary on background >= 4.5:1', () => {
    expect(contrastRatio(COLORS.textSecondary, COLORS.background)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
  });

  it('accentDark (hint text) on accentSurface (HeaderProgress/hint banner) >= 4.5:1', () => {
    expect(contrastRatio(COLORS.accentDark, COLORS.accentSurface)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
  });

  it('textOnDark on tooltipBg, composited over the lightest realistic backdrop (mapCanvasBg, white) >= 4.5:1', () => {
    const compositedTooltip = compositeRgbaOverHex(COLORS.tooltipBg, COLORS.mapCanvasBg);
    expect(contrastRatio(COLORS.textOnDark, compositedTooltip)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
  });

  // Round 16 finding (see docs/qa-result.md "รอบ 16"): the topBar "สถิติ"
  // link on HomeScreen used to read `styles.statsLink.color: COLORS.accent`,
  // which measures only ~2.87:1 against `background` — a real WCAG AA
  // failure on real screen text, not a false positive. Programmer fix
  // (docs/dev-notes.md "รอบ 16"): repoint the *usage site*
  // (`HomeScreen.tsx` `styles.statsLink.color`) at `COLORS.accentDark`
  // instead of changing the `accent` token itself (which stays in use
  // elsewhere, e.g. gradients/icons, where its own contrast rules differ).
  //
  // This block is rewritten (round-2 verify) to test what actually reaches
  // the screen — mounting the real `HomeScreen` and reading the resolved
  // style off the real "สถิติ" `Text` node — instead of re-checking the raw
  // `COLORS.accent` token in isolation (which the fix intentionally left
  // untouched, so a token-only check would still fail forever regardless of
  // whether the on-screen bug is fixed).
  describe('[US-35/US-36 round-16 fix, verified round 2] topBar "สถิติ" link text contrast', () => {
    beforeEach(() => {
      dbMock.__seed([]);
      dbMock.__seedCheckins([]);
    });

    it('COLORS.accentDark on COLORS.background is >= 4.5:1 (the token pair now in use)', () => {
      const ratio = contrastRatio(COLORS.accentDark, COLORS.background);
      // eslint-disable-next-line no-console
      console.log(`accentDark-on-background measured contrast: ${ratio.toFixed(2)}:1 (AA normal-text threshold is 4.5:1)`);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    });

    it('the real mounted "สถิติ" Text node resolves its color style to COLORS.accentDark, not COLORS.accent', async () => {
      await render(<TestApp />);
      await waitFor(() => expect(screen.getByText('สถิติ')).toBeTruthy());
      const node = screen.getByText('สถิติ');
      const style = Array.isArray(node.props.style)
        ? Object.assign({}, ...node.props.style.filter(Boolean))
        : node.props.style;
      expect(style.color).toBe(COLORS.accentDark);
      expect(style.color).not.toBe(COLORS.accent);
    });
  });
});

const SIX_FILES = [
  'screens/HomeScreen.tsx',
  'components/Map3D.tsx',
  'components/ProvinceTile3D.tsx',
  'components/HeaderProgress.tsx',
  'components/Legend.tsx',
  'components/GlobalSearchBar.tsx',
] as const;

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(__dirname, '../../', relPath), 'utf-8');
}

describe('US-35 AC2 / US-36 AC1 — independent (broader) hardcoded-color scan', () => {
  // Same hex/rgba literal shape T131 already checks, re-verified independently.
  const HEX_OR_RGBA = /#[0-9A-Fa-f]{3,8}\b|rgba?\([^)]*\)/g;
  // T131's regex cannot catch CSS *named* colors (e.g. 'white', 'gray',
  // 'transparent') used as a `backgroundColor`/`color`/`borderColor`/`tintColor`
  // string literal — check for those too, since they are just as much a
  // "hardcoded color outside theme.ts" as a hex literal would be.
  const NAMED_COLOR_AS_STYLE_VALUE =
    /(?:backgroundColor|color|borderColor|tintColor|shadowColor|stroke|fill)\s*[:=]\s*['"](white|black|red|green|blue|gray|grey|yellow|orange|purple|pink|cyan|magenta|silver|navy|teal|lime|maroon|olive|transparent)['"]/gi;

  it.each(SIX_FILES)('%s: zero hex/rgba literals', (relPath) => {
    const matches = readSrc(relPath).match(HEX_OR_RGBA) ?? [];
    expect(matches).toEqual([]);
  });

  it.each(SIX_FILES)('%s: zero CSS named-color literals used as a color-ish style value', (relPath) => {
    const matches = readSrc(relPath).match(NAMED_COLOR_AS_STYLE_VALUE) ?? [];
    expect(matches).toEqual([]);
  });

  it.each(SIX_FILES)('%s: every COLORS-shaped identifier used actually exists on the COLORS export (no typo\'d/nonexistent token)', (relPath) => {
    const src = readSrc(relPath);
    const used = [...src.matchAll(/COLORS\.([A-Za-z0-9_]+)/g)].map((m) => m[1]);
    const missing = used.filter((key) => !(key in COLORS));
    expect(missing).toEqual([]);
  });
});

describe('US-35 AC4 — semantic color-family preserved despite new hex values', () => {
  it('unlocked colors (unlockedTop/accent, unlockedSide/accentDark) are still green-family (G channel dominant)', () => {
    for (const hex of [COLORS.unlockedTop, COLORS.accent, COLORS.unlockedSide, COLORS.accentDark]) {
      const { r, g, b } = hexToRgb(hex);
      expect(g).toBeGreaterThan(r);
      expect(g).toBeGreaterThan(b * 0.9); // side/dark shade has g~=b so allow a small margin
    }
  });

  it('locked color is still a neutral gray family (R/G/B channels close together, low saturation)', () => {
    const { r, g, b } = hexToRgb(COLORS.lockedTop);
    const maxSpread = Math.max(r, g, b) - Math.min(r, g, b);
    expect(maxSpread).toBeLessThanOrEqual(20);
  });

  it('gold (Province Master) is still a warm yellow/gold family (R > G > B)', () => {
    const { r, g, b } = hexToRgb(COLORS.gold);
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b);
  });

  it('danger is still a red family (R channel dominant)', () => {
    const { r, g, b } = hexToRgb(COLORS.danger);
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
  });
});

describe('US-35 AC5 — before/after delta on pivot tokens is substantial, not a 1-2 unit nudge', () => {
  // Old values taken from docs/design-spec.md "ตัวเลือก A: Deep Jade" table
  // (the pre-round-15 baseline), independent of any programmer note.
  const OLD = {
    unlockedTop: '#1D9E75',
    unlockedSide: '#0F6E56',
    lockedTop: '#D9D9D9',
    background: '#FFFFFF',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B6B6B',
    trackBg: '#E5E5E5',
    gold: '#E5B93C',
  } as const;

  function channelDistance(hexA: string, hexB: string) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
  }

  it.each(Object.entries(OLD))('%s changed by more than a trivial 1-2 brightness unit nudge', (key, oldHex) => {
    const newHex = (COLORS as Record<string, string>)[key];
    expect(channelDistance(oldHex, newHex)).toBeGreaterThan(6); // >6 total channel units, well past a 1-2 unit nudge
  });
});
