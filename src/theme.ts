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
