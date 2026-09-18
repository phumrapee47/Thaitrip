// T92 / US-28: kept as ONE flat param list (unchanged shape/keys from before the
// bottom-tab restructure, plus `News`) and reused to type BOTH nested stack
// navigators (MapStack and NewsStack in AppNavigator.tsx), instead of splitting
// into two separate per-stack param list types. This is a deliberate choice:
// every existing screen file (Home/ProvinceDetail/AddEntry/Stats/Settings/
// Map2DValidation) keeps typing itself against `RootStackParamList` exactly as
// before — zero prop-type changes, zero regression risk to US-1/2/3/14/24/26 —
// and `navigationRef` (used by App.tsx's AnonWarningGate to jump straight to
// Settings) keeps working unchanged too. The one accepted trade-off: since both
// nested stacks share this same type, TypeScript will not flag a call like
// `navigation.navigate('ProvinceDetail')` from inside StatsScreen as invalid
// even when StatsScreen happens to be mounted inside NewsStack (which does NOT
// register a `ProvinceDetail` screen) — see docs/dev-notes.md "รอบ 7" for the
// runtime behavior in that specific edge case (safe no-op, not a crash) and why
// it's out of scope to fully solve here.
export type RootStackParamList = {
  Home: undefined;
  ProvinceDetail: { provinceId: string };
  AddEntry: { provinceId: string; entryId?: string };
  Stats: undefined;
  Settings: undefined; // T49 — account status, data-loss warning, email link
  Map2DValidation: undefined; // dev-only (US-7), hidden from production nav — see T22
  News: undefined; // T92 / US-28-US-32: NewsScreen, root screen of the "ข่าว" tab's NewsStack
};

/** T92 / US-28: the actual root navigator is now this 2-tab Bottom Tab
 * Navigator; each tab value is itself a nested stack (see AppNavigator.tsx). */
export type RootTabParamList = {
  MapTab: undefined;
  NewsTab: undefined;
};
