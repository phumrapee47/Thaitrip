// Data model for a single landmark check-in (US-8/US-9, T34).
export interface LandmarkCheckin {
  landmarkId: string;
  provinceId: string;
  visited: boolean;
  updatedAt: string;
  syncedAt: string | null;
  cloudId: string | null;
  retryCount: number;
}
