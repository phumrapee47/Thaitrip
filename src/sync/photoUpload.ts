import * as db from '../storage/db';
import { getSupabaseClient } from '../lib/supabaseClient';

const BUCKET = 'trip-photos';

export interface PhotoUploadResult {
  attempted: number;
  uploaded: number;
  failed: number;
}

const EMPTY_RESULT: PhotoUploadResult = { attempted: 0, uploaded: 0, failed: 0 };

function isLocalUri(uri: string): boolean {
  return !/^https?:\/\//i.test(uri);
}

export interface PhotoUploadDeps {
  /** Injectable so tests can avoid real `fetch`/filesystem access (T41 test note). */
  fetchBlob?: (uri: string) => Promise<Blob>;
}

async function defaultFetchBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

/**
 * T41 / US-13: upload any not-yet-uploaded (local URI) entry photos to the
 * `trip-photos` Supabase Storage bucket, then rewrite the entry's photoUris
 * with the returned public URL. Local URIs are left untouched until upload
 * succeeds (US-13 AC1: local-first, never blocks on the network). Retries are
 * naturally deduplicated: once a URI is replaced with an `https://` URL it no
 * longer matches `isLocalUri` on the next pass, so it is never re-uploaded
 * (US-13 AC3 — "โดยไม่สร้างรูปซ้ำซ้อน"). Uses `{ upsert: true }` on a
 * deterministic per-photo storage path for the same reason.
 */
export async function uploadPendingPhotos(deps: PhotoUploadDeps = {}): Promise<PhotoUploadResult> {
  const client = getSupabaseClient();
  if (!client) return EMPTY_RESULT;

  const fetchBlob = deps.fetchBlob ?? defaultFetchBlob;
  const entries = await db.getEntriesWithLocalPhotos();
  const result: PhotoUploadResult = { attempted: 0, uploaded: 0, failed: 0 };

  for (const entry of entries) {
    const updatedUris = [...entry.photoUris];
    let changed = false;

    for (let i = 0; i < updatedUris.length; i++) {
      const uri = updatedUris[i];
      if (!isLocalUri(uri)) continue;
      result.attempted += 1;
      try {
        const blob = await fetchBlob(uri);
        const filename = uri.split('/').pop() ?? `photo-${i}.jpg`;
        const path = `${entry.id}/${i}-${filename}`;
        const { error: uploadError } = await client.storage.from(BUCKET).upload(path, blob, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = client.storage.from(BUCKET).getPublicUrl(path);
        if (!publicUrlData?.publicUrl) throw new Error('no public url returned');
        updatedUris[i] = publicUrlData.publicUrl;
        changed = true;
        result.uploaded += 1;
      } catch {
        result.failed += 1;
        // Leave this URI as-is; it will be retried on the next sync pass (US-13 AC3).
      }
    }

    if (changed) {
      await db.updatePhotoUris(entry.id, updatedUris);
    }
  }

  return result;
}
