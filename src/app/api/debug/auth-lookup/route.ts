import { NextResponse } from 'next/server';
import { normalizeAuthEmail } from '@/lib/auth/normalize';
import { createServiceClient, hasServiceRole } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * Dev-only: check if an email exists in Supabase Auth for THIS project.
 * GET /api/debug/auth-lookup?email=you@example.com
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const email = new URL(request.url).searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Pass ?email=your@email.com' }, { status: 400 });
  }

  const normalized = normalizeAuthEmail(email);

  if (!hasServiceRole()) {
    return NextResponse.json({
      ok: false,
      email: normalized,
      exists: null,
      error:
        'Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Dashboard → Settings → API → service_role). Or use /debug/setup-admin.',
    });
  }

  const supabase = createServiceClient()!;
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const match = data.users.find(u => u.email?.toLowerCase() === normalized);

  return NextResponse.json({
    ok: true,
    email: normalized,
    exists: Boolean(match),
    userId: match?.id ?? null,
    emailConfirmed: match?.email_confirmed_at ?? null,
    lastSignIn: match?.last_sign_in_at ?? null,
    hint: match
      ? 'User exists — reset password in Dashboard or use /debug/setup-admin with the same email.'
      : 'No user with this email on mjxsisdjmogseodmjxyc — create one via /debug/setup-admin.',
  });
}
