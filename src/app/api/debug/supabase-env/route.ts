import { NextResponse } from 'next/server';
import { diagnoseSupabaseEnv } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

/** Dev-only: verify URL and anon JWT reference the same Supabase project. */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const diag = diagnoseSupabaseEnv();
  const accept = request.headers.get('accept') ?? '';

  if (accept.includes('text/html')) {
    const body = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Supabase env debug</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b0b0b; color: #f8f4ec; padding: 2rem; max-width: 720px; margin: 0 auto; }
    h1 { color: #c8a96b; font-weight: 400; }
    pre { background: #141414; border: 1px solid rgba(200,169,107,0.25); padding: 1rem; overflow: auto; border-radius: 8px; }
    .ok { color: #4ade80; }
    .bad { color: #ef4444; }
    a { color: #c8a96b; }
  </style>
</head>
<body>
  <h1>Supabase environment</h1>
  <p class="${diag.ok ? 'ok' : 'bad'}">${diag.ok ? 'Configuration OK' : `Problem: ${diag.error ?? 'unknown'}`}</p>
  <pre>${JSON.stringify(diag, null, 2)}</pre>
  <p><a href="/admin/login">← Admin login</a></p>
</body>
</html>`;
    return new NextResponse(body, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  return NextResponse.json(diag, {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
