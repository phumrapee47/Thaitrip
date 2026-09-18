// Shared theme constants (docs/design-spec.md "โทนสี").
// รอบ 15 / US-35: "Deep Jade" palette — evolves the original mint-green
// (#1D9E75/#0F6E56) into a more saturated jewel-tone emerald, on a warmer
// mint-white background instead of flat white. See docs/design-spec.md
// "ตัวเลือก A: Deep Jade" for the full before/after token table and
// docs/tasks.md "T125 — ผลตัดสินใจ" for the Decision Gate sign-off. This file
// is the SINGLE place these values are defined — no other file should
// hardcode a hex color for anything covered by a token here.
export const COLORS = {
  lockedTop: '#CBD3CF',
  lockedTopLoading: '#E3E8E5', // slightly lighter placeholder used only during initial data load
  unlockedTop: '#15A87A',
  unlockedSide: '#0B5C46',
  accent: '#15A87A',
  accentDark: '#0B5C46',
  trackBg: '#DCE4E0',
  textPrimary: '#122019',
  textSecondary: '#5B6B63',
  danger: '#D9534F',
  background: '#F6F9F7',
  // Landmark & Supabase Integration round (docs/design-spec.md "โทนภาพรวมเพิ่มเติม").
  amber: '#F5A623', // data-loss warning — "แจ้งให้ทราบ" not an error
  amberBg: '#FDF3E3',
  gold: '#D8A93B', // Province Master reward accent
  syncPending: '#9B9B9B',
  syncSynced: '#5CB88A',
  // รอบ 15 / US-36 (Color Palette & Layout Redesign, HomeScreen): additional
  // surface/utility tokens introduced while redesigning HomeScreen.tsx,
  // Map3D.tsx, ProvinceTile3D.tsx, HeaderProgress.tsx, Legend.tsx and
  // GlobalSearchBar.tsx — added here so those files never need to hardcode a
  // new hex value of their own (T126/T131).
  surface: '#FFFFFF', // plain white card/dropdown/legend-chip surfaces
  accentSurface: '#E3F5EF', // soft accent-tinted surface for the HeaderProgress "hero stat" card + hint banner
  // T125 decision on `mapCanvasBg` (docs/tasks.md "T125 — ผลตัดสินใจ"): "ทางเลือก
  // B" — a light tint, NOT a dark hero canvas, since Deep Jade is an all-light
  // palette. Kept equal to `surface` (pure white) so the Map3D hero card reads
  // as "white canvas on a soft mint page" — the simplest way to satisfy that
  // brief without inventing a new arbitrary in-between tint.
  mapCanvasBg: '#FFFFFF',
  mapAmbientShadow: 'rgba(11,92,70,0.16)', // soft ground-shadow ellipse under the tilted 3D tile grid (derived from accentDark)
  tooltipBg: 'rgba(18,32,25,0.88)', // Map3D long-press tooltip pill (derived from textPrimary; replaces the old hardcoded rgba(26,26,26,0.88))
  textOnDark: '#FFFFFF', // text/stroke placed on dark surfaces (tooltip label, tile top-face edge highlight)
  border: '#E8ECE9', // standard hairline border for cards/inputs (search bar, dropdown)
  borderLight: '#F0F3F1', // lighter hairline for list-row dividers (search dropdown rows)
  muted: '#8C9B95', // placeholder text / muted icons (search placeholder, clear ✕, dropdown ›)
} as const;

// Advanced UI/UX Upgrade round (docs/design-spec.md "ส่วนเพิ่มเติม: Advanced UI/UX Upgrade").
// 8pt spatial grid — never use arbitrary spacing values, always reference these.
export const SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#0F2A1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F2A1D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F2A1D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

// Category color semantic — matches CATEGORIES in LandmarkList.tsx exactly.
export const CATEGORY_COLORS: Record<string, { fg: string; bg: string }> = {
  'ธรรมชาติและภูเขา': { fg: '#10B981', bg: '#ECFDF5' },
  'วัดและศาสนสถาน': { fg: '#F59E0B', bg: '#FFFBEB' },
  'ทะเลและชายหาด': { fg: '#0284C7', bg: '#F0F9FF' },
  'ประวัติศาสตร์และวัฒนธรรม': { fg: '#7C3AED', bg: '#F5F3FF' },
  'ช้อปปิ้งและสันทนาการ': { fg: '#E11D48', bg: '#FFF1F2' },
};
export const CATEGORY_COLOR_FALLBACK = { fg: '#64748B', bg: '#F1F5F9' };

// Fallback cover photo for LandmarkCard when a Wikipedia article has no
// thumbnail (or its `imageUrl` fails to load) — Wikimedia Commons'
// `Special:FilePath` endpoint renders on demand at any requested width and is
// meant for exactly this kind of hotlinking (verified reachable at ?width=800,
// unlike guessing an `upload.wikimedia.org/.../NNNpx-*` path directly, which
// 400s for widths the thumbnail cache hasn't already rendered).
export const FALLBACK_LANDMARK_IMAGE =
  'https://commons.wikimedia.org/wiki/Special:FilePath/From_a_Beach_in_Phi_Phi_Don.jpg?width=800';
