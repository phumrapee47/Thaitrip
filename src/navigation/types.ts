export type RootStackParamList = {
  Home: undefined;
  ProvinceDetail: { provinceId: string };
  AddEntry: { provinceId: string; entryId?: string };
  Stats: undefined;
  Settings: undefined; // T49 — account status, data-loss warning, email link
  Map2DValidation: undefined; // dev-only (US-7), hidden from production nav — see T22
};
