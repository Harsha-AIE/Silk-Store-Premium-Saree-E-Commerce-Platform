import { getSupabaseAnonKey } from '@/lib/supabase/env';

export const SITE_NAME = 'Dhanunjaya Silk Sarees';

export function getSiteUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') || 'https://dhanunjaya-sarees.vercel.app').replace(/\/$/, '');
}

export function getWhatsAppPhone(): string {
  return (process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '919885186881').replace(/\D/g, '');
}

/** @deprecated Use getSupabaseAnonKey from @/lib/supabase/env */
export function getSupabaseKey(): string {
  return getSupabaseAnonKey();
}
