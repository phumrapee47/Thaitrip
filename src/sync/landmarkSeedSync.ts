// T66 / US-17 AC3: Supabase `landmarks` table schema + seed/sync logic.
//
// Schema (documented here since there is no migrations/ dir in this project
// yet — same "design + mocked-client-tested only" approach as US-12/US-13,
// per requirements.md "สมมติฐานเพิ่มเติม" ข้อ 3 and PM decision ประเด็น 8):
//
//   create table public.landmarks (
//     id text primary key,
//     province_id text not null,
//     name_th text not null,
//     lat double precision,  -- nullable: matches Landmark.lat being optional (T62)
//     lng double precision,  -- nullable: matches Landmark.lng being optional (T62)
//     updated_at timestamptz not null default now()
//   );
//   create index if not exists idx_landmarks_province_id on public.landmarks(province_id);
//
// Unlike entries/landmark_checkins (user-authored data synced bidirectionally
// with last-write-wins, T39/T40), `landmarks` is a read-mostly reference table
// seeded FROM the app's bundled local dataset (thailand-landmarks.ts, T35/T62)
// TO Supabase — one-directional, idempotent upsert keyed on `id`. There is no
// local SQLite table for this (LANDMARKS is a static in-memory array, not
// user data), so there is nothing to pull back down; the app always reads
// landmarks from the bundled dataset (US-17 AC2 — 100% offline).
import { getSupabaseClient } from '../lib/supabaseClient';
import { LANDMARKS, type Landmark } from '../data/thailand-landmarks';

export interface LandmarkSeedResult {
  attempted: number;
  synced: number;
  failed: boolean;
}

const EMPTY_RESULT: LandmarkSeedResult = { attempted: 0, synced: 0, failed: false };

export interface RemoteLandmarkRow {
  id: string;
  province_id: string;
  name_th: string;
  lat: number | null;
  lng: number | null;
}

export function landmarkToRemoteRow(landmark: Landmark): RemoteLandmarkRow {
  return {
    id: landmark.id,
    province_id: landmark.provinceId,
    name_th: landmark.nameTh,
    lat: landmark.lat ?? null,
    lng: landmark.lng ?? null,
  };
}

/**
 * T66: push the full local landmark dataset to Supabase whenever a client is
 * configured/reachable. Always an upsert on `id` — safe to call repeatedly
 * (e.g. every sync cycle alongside T39) since re-seeding unchanged rows is a
 * no-op server-side. Never throws (T33 graceful degradation): unconfigured or
 * failed requests just report `failed: true`/an empty result instead of
 * crashing the sync loop.
 */
export async function seedLandmarksToSupabase(): Promise<LandmarkSeedResult> {
  const client = getSupabaseClient();
  if (!client) return EMPTY_RESULT;

  const rows = LANDMARKS.map(landmarkToRemoteRow);
  if (rows.length === 0) return { attempted: 0, synced: 0, failed: false };

  try {
    const { error } = await client.from('landmarks').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    return { attempted: rows.length, synced: rows.length, failed: false };
  } catch {
    return { attempted: rows.length, synced: 0, failed: true };
  }
}
