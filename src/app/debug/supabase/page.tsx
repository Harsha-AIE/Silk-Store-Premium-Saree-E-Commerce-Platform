import Link from 'next/link';
import { diagnoseSupabaseEnv } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

export default function SupabaseDebugPage() {
  if (process.env.NODE_ENV === 'production') {
    return (
      <div style={{ padding: 48, background: '#0B0B0B', color: '#F8F4EC', minHeight: '100vh' }}>
        Not available in production.
      </div>
    );
  }

  const diag = diagnoseSupabaseEnv();

  return (
    <div style={{ padding: 48, background: '#0B0B0B', color: '#F8F4EC', minHeight: '100vh', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#C8A96B', fontWeight: 400 }}>Supabase debug</h1>
      <p style={{ color: diag.ok ? '#4ade80' : '#ef4444', marginBottom: 24 }}>
        {diag.ok ? 'Configuration OK — URL and anon key match.' : diag.error}
      </p>
      <pre
        style={{
          background: '#141414',
          padding: 16,
          borderRadius: 8,
          border: '1px solid rgba(200,169,107,0.25)',
          overflow: 'auto',
          fontSize: 13,
        }}
      >
        {JSON.stringify(diag, null, 2)}
      </pre>
      <p style={{ marginTop: 24, fontSize: 14, color: 'rgba(248,244,236,0.6)' }}>
        JSON API:{' '}
        <a href="/api/debug/supabase-env" style={{ color: '#C8A96B' }}>
          /api/debug/supabase-env
        </a>
      </p>
      <Link href="/admin/login" style={{ color: '#C8A96B', display: 'inline-block', marginTop: 16 }}>
        ← Admin login
      </Link>
    </div>
  );
}
