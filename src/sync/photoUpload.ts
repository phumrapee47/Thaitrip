import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
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
  /**
   * Injectable so tests can avoid real filesystem access (T41 test note).
   * Returns the raw file contents base64-encoded (no `data:` prefix).
   *
   * Bug fix note: `fetch(uri).blob()` is unreliable for local `file://` URIs
   * on iOS (surfaces as a 400 from Supabase Storage on upload — the blob body
   * ends up empty/truncated) so photos are read as base64 via
   * `expo-file-system` and decoded into an ArrayBuffer instead, which
   * Supabase Storage accepts directly.
   */
  readAsBase64?: (uri: string) => Promise<string>;
}

async function defaultReadAsBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
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

  const readAsBase64 = deps.readAsBase64 ?? defaultReadAsBase64;
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
        const base64 = await readAsBase64(uri);
        const arrayBuffer = decode(base64);
        const filename = uri.split('/').pop() ?? `photo-${i}.jpg`;
        const path = `${entry.id}/${i}-${filename}`;
        const { error: uploadError } = await client.storage
          .from(BUCKET)
          .upload(path, arrayBuffer, { upsert: true, contentType: 'image/jpeg' });
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
