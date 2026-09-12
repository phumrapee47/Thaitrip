import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient } from '../lib/supabaseClient';

const SESSION_KEY = 'travel_journal_session_v1';
const ANON_WARNING_SEEN_KEY = 'travel_journal_anon_warning_seen_v1';

export interface AppSession {
  userId: string;
  isAnonymous: boolean;
  email: string | null;
}

function generateLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getStoredSession(): Promise<AppSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppSession;
  } catch {
    return null;
  }
}

async function persistSession(session: AppSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * T37 / US-11 AC1: create (or reuse) a session the first time the app opens.
 * Never throws, even when Supabase is unreachable/unconfigured (T33 requirement)
 * — falls back to a local-only anonymous id so the app stays fully usable
 * offline; sync will simply remain "pending" until a real Supabase project is
 * configured.
 */
export async function bootstrapSession(): Promise<{ session: AppSession; isNewSession: boolean }> {
  const existing = await getStoredSession();
  if (existing) return { session: existing, isNewSession: false };

  let userId: string | null = null;
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.auth.signInAnonymously();
      if (!error && data?.user?.id) userId = data.user.id;
    } catch {
      userId = null;
    }
  }

  const session: AppSession = { userId: userId ?? generateLocalId(), isAnonymous: true, email: null };
  await persistSession(session);
  return { session, isNewSession: true };
}

/** T50: has the one-time Data-Loss Warning Modal already been acknowledged on this device? */
export async function hasSeenAnonWarning(): Promise<boolean> {
  return (await AsyncStorage.getItem(ANON_WARNING_SEEN_KEY)) === 'true';
}

export async function markAnonWarningSeen(): Promise<void> {
  await AsyncStorage.setItem(ANON_WARNING_SEEN_KEY, 'true');
}

export type LinkEmailErrorCode = 'duplicate-email' | 'weak-password' | 'generic-failure';

export interface LinkEmailResult {
  ok: boolean;
  email?: string;
  errorCode?: LinkEmailErrorCode;
  message?: string;
}

const ERROR_MESSAGES: Record<LinkEmailErrorCode, string> = {
  'duplicate-email': 'อีเมลนี้ถูกใช้งานแล้ว ลองใช้อีเมลอื่น หรือเข้าสู่ระบบด้วยอีเมลนี้แทน',
  'weak-password': 'รหัสผ่านไม่ตรงตามเงื่อนไข กรุณาตั้งรหัสผ่านใหม่',
  'generic-failure': 'เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง',
};

export const MIN_PASSWORD_LENGTH = 6;

function classifyAuthError(error: { message?: string } | null | undefined): LinkEmailErrorCode {
  const msg = (error?.message ?? '').toLowerCase();
  if (msg.includes('already') || msg.includes('registered') || msg.includes('duplicate') || msg.includes('exists')) {
    return 'duplicate-email';
  }
  if (msg.includes('password')) return 'weak-password';
  return 'generic-failure';
}

/**
 * T38 / US-11 AC2/AC4: link email+password to the existing anonymous session.
 * On any failure the anonymous session is left completely untouched (still
 * fully usable, no data lost) — this function only ever writes to storage on
 * the success path.
 */
export async function linkEmail(email: string, password: string): Promise<LinkEmailResult> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, errorCode: 'weak-password', message: ERROR_MESSAGES['weak-password'] };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, errorCode: 'generic-failure', message: ERROR_MESSAGES['generic-failure'] };
  }

  try {
    const { data, error } = await client.auth.updateUser({ email, password });
    if (error || !data?.user) {
      const code = classifyAuthError(error);
      return { ok: false, errorCode: code, message: ERROR_MESSAGES[code] };
    }
    const existing = await getStoredSession();
    const updated: AppSession = {
      userId: existing?.userId ?? data.user.id,
      isAnonymous: false,
      email,
    };
    await persistSession(updated);
    return { ok: true, email };
  } catch {
    return { ok: false, errorCode: 'generic-failure', message: ERROR_MESSAGES['generic-failure'] };
  }
}

/** Test/dev helper: clear the stored session + warning flag (not exposed in UI). */
export async function _clearSessionForTests(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
  await AsyncStorage.removeItem(ANON_WARNING_SEEN_KEY);
}
