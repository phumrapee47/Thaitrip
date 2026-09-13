// Shared theme constants (docs/design-spec.md "โทนสี").
export const COLORS = {
  lockedTop: '#D9D9D9',
  lockedTopLoading: '#E8E8E8', // slightly lighter placeholder used only during initial data load
  unlockedTop: '#1D9E75',
  unlockedSide: '#0F6E56',
  accent: '#1D9E75',
  accentDark: '#0F6E56',
  trackBg: '#E5E5E5',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  danger: '#D9534F',
  background: '#FFFFFF',
  // Landmark & Supabase Integration round (docs/design-spec.md "โทนภาพรวมเพิ่มเติม").
  amber: '#F5A623', // data-loss warning — "แจ้งให้ทราบ" not an error
  amberBg: '#FDF3E3',
  gold: '#E5B93C', // Province Master reward accent
  syncPending: '#9B9B9B',
  syncSynced: '#5CB88A',
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
