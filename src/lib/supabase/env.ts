/**
 * Validates Supabase URL + public key configuration.
 * JWT anon keys can be checked against the project ref. Publishable keys cannot
 * be decoded locally, so those are validated by live API checks.
 */
export function getProjectRefFromAnonKey(anonKey: string): string | null {
  const parts = anonKey.split('.');
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json =
      typeof Buffer !== 'undefined'
        ? Buffer.from(base64, 'base64').toString('utf8')
        : atob(base64);
    const payload = JSON.parse(json) as { ref?: string };
    return payload.ref ?? null;
  } catch {
    return null;
  }
}

export function getProjectRefFromUrl(url: string): string | null {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

export type SupabaseEnvDiagnostics = {
  ok: boolean;
  url: string | undefined;
  urlRef: string | null;
  keyRef: string | null;
  keyType: 'jwt-anon' | 'publishable' | 'missing' | 'unknown';
  error?: string;
};

export function diagnoseSupabaseEnv(): SupabaseEnvDiagnostics {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

  const key = anonKey || publishableKey;
  const urlRef = url ? getProjectRefFromUrl(url) : null;

  let keyType: SupabaseEnvDiagnostics['keyType'] = 'missing';
  if (anonKey.startsWith('eyJ')) keyType = 'jwt-anon';
  else if (anonKey.startsWith('sb_') || publishableKey.startsWith('sb_')) keyType = 'publishable';

  const keyRef = anonKey.startsWith('eyJ') ? getProjectRefFromAnonKey(anonKey) : null;

  if (!url || !key) {
    return { ok: false, url, urlRef, keyRef, keyType, error: 'Missing NEXT_PUBLIC_SUPABASE_URL or anon key' };
  }

  if (urlRef && keyRef && urlRef !== keyRef) {
    return {
      ok: false,
      url,
      urlRef,
      keyRef,
      keyType,
      error: `Project mismatch: URL is "${urlRef}" but anon key is for "${keyRef}". Copy both from the same Supabase project.`,
    };
  }

  return { ok: true, url, urlRef, keyRef, keyType };
}

/** Public key used by browser/server SSR Supabase clients. */
export function getSupabaseAnonKey(): string {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
  if (anon.startsWith('eyJ')) return anon;

  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';
  if (publishable.startsWith('sb_publishable_')) return publishable;

  return '';
}

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
}
