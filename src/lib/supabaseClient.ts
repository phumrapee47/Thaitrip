// T33: Supabase client init module.
//
// Env-var approach: `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`,
// read via `process.env` directly. This project's Expo SDK (57) inlines any
// `EXPO_PUBLIC_*` env var into the bundle at build time via babel-preset-expo —
// no extra dependency (e.g. expo-constants) is needed for this, and none is
// currently installed in package.json, so this is the idiomatic choice for this
// SDK version per the PM/BA assumption that "SUPABASE_URL/SUPABASE_ANON_KEY จะถูก
// ส่งมาเป็น environment config ภายหลัง".
//
// No real Supabase project exists in this environment (see requirements.md
// "สมมติฐานเพิ่มเติม" ข้อ 3). `isSupabaseConfigured` is false whenever the env
// vars are unset OR left as an obvious placeholder, so every caller (auth,
// sync engine, photo upload) can check it and fail gracefully into an
// offline/pending/retry-issue state instead of throwing.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

function looksLikePlaceholder(value: string): boolean {
  const lower = value.toLowerCase();
  return lower.includes('your-') || lower.includes('placeholder') || lower.includes('example');
}

export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 &&
  SUPABASE_ANON_KEY.length > 0 &&
  !looksLikePlaceholder(SUPABASE_URL) &&
  !looksLikePlaceholder(SUPABASE_ANON_KEY);

let cachedClient: SupabaseClient | null = null;

/**
 * Returns a shared Supabase client instance, or `null` when unconfigured.
 * Callers (auth/sync/photo-upload) MUST treat `null` as "go offline" rather
 * than throwing, per T33's non-negotiable graceful-degradation requirement.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!cachedClient) {
    cachedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return cachedClient;
}

/** Test-only helper: force-reset the cached client (e.g. between test cases). */
export function _resetSupabaseClientForTests(): void {
  cachedClient = null;
}
