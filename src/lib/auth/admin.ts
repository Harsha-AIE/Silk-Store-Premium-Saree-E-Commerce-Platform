import { createClient } from '@/lib/supabase/server';

export async function getAdminSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, admin: null };

  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return { user, admin };
}

export async function signInAdmin(email: string, password: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  if (!data.user) return { error: 'Sign in failed' };

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    return { error: 'You do not have admin access' };
  }

  return { error: null };
}

export async function signOutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
