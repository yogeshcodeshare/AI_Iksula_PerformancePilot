import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Optional Supabase client (decisions.md D005, architecture/database-sop.md).
 * Returns null when the public URL/key are not configured: every database
 * feature is then OFF and the app behaves exactly like the browser-only version.
 *
 * Only the public (anon) key is ever used here. Access is enforced by Row
 * Level Security in supabase/migrations. Never put the service-role key in env.
 */
let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (typeof window === 'undefined' || !url || !key) {
    client = null;
    return client;
  }
  client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'pp-auth' },
  });
  return client;
}

export function isSupabaseEnabled(): boolean {
  return getSupabase() !== null;
}

/** @internal test hook */
export function __setSupabaseForTests(c: SupabaseClient | null | undefined) {
  client = c;
}
