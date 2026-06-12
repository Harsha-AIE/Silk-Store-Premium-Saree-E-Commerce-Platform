'use server';

import { normalizeAuthEmail } from '@/lib/auth/normalize';
import { createServiceClient, hasServiceRole } from '@/lib/supabase/service';

export type BootstrapResult = {
  ok: boolean;
  error?: string;
  userId?: string;
  message?: string;
};

export async function bootstrapAdminAction(
  email: string,
  password: string
): Promise<BootstrapResult> {
  if (process.env.NODE_ENV === 'production') {
    return { ok: false, error: 'Not available in production' };
  }

  if (!hasServiceRole()) {
    return {
      ok: false,
      error:
        'Missing SUPABASE_SERVICE_ROLE_KEY in .env.local. Copy from Supabase → Settings → API → service_role (secret). Restart npm run dev.',
    };
  }

  const normalized = normalizeAuthEmail(email);
  if (!normalized || password.length < 6) {
    return { ok: false, error: 'Valid email and password (min 6 chars) required' };
  }

  const supabase = createServiceClient()!;

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });

  if (listError) {
    return { ok: false, error: `listUsers: ${listError.message}` };
  }

  const existing = listData.users.find(u => u.email?.toLowerCase() === normalized);
  let userId: string;

  if (existing) {
    const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
      existing.id,
      {
        password,
        email_confirm: true,
      }
    );

    if (updateError) {
      return { ok: false, error: `updateUser: ${updateError.message}` };
    }
    userId = updated.user.id;
  } else {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: normalized,
      password,
      email_confirm: true,
    });

    if (createError) {
      return { ok: false, error: `createUser: ${createError.message}` };
    }
    userId = created.user.id;
  }

  const { error: adminError } = await supabase.from('admins').upsert(
    { user_id: userId, email: normalized },
    { onConflict: 'user_id' }
  );

  if (adminError) {
    return {
      ok: false,
      error: `admins table: ${adminError.message}. Run supabase/migrations/001_schema.sql first.`,
      userId,
    };
  }

  return {
    ok: true,
    userId,
    message: existing
      ? `Password reset for ${normalized}. Sign in at /admin/login with this password.`
      : `Created ${normalized}. Sign in at /admin/login.`,
  };
}
