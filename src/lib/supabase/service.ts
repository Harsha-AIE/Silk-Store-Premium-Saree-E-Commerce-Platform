import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl } from '@/lib/supabase/env';

/**
 * Server-only admin client (service role). Never import in client components.
 */
export function createServiceClient() {
  const url = getSupabaseUrl();
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function hasServiceRole(): boolean {
  return Boolean(
    (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim()) &&
      getSupabaseUrl()
  );
}
