// Manual mock for src/lib/supabaseClient.ts used by sync/auth unit tests.
// Real supabaseClient.ts wraps @supabase/supabase-js against a project that
// doesn't exist in this environment (see requirements.md assumption). Tests
// inject a fake client shaped like the subset of the Supabase JS SDK that
// syncEngine/authService/photoUpload actually call, via __setMockClient.

let mockClient: any = null;
let configured = true;

export function getSupabaseClient(): any {
  return configured ? mockClient : null;
}

export const isSupabaseConfigured = true;

export function __setMockClient(client: any): void {
  mockClient = client;
}

export function __setConfigured(value: boolean): void {
  configured = value;
}

export function _resetSupabaseClientForTests(): void {
  mockClient = null;
  configured = true;
}
