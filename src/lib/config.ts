import { getSupabaseAnonKey } from '@/lib/supabase/env';

export const SITE_NAME = 'Dhanunjaya Silk Sarees';

export function getSiteUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

export function getWhatsAppPhone(): string {
  return process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? '918639384118';
}

/** @deprecated Use getSupabaseAnonKey from @/lib/supabase/env */
export function getSupabaseKey(): string {
  return getSupabaseAnonKey();
}
