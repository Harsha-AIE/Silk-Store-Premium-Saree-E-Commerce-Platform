'use server';

import { signInAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';

export type AdminLoginResult = {
  ok: boolean;
  error?: string;
};

export async function adminLoginAction(
  email: string,
  password: string
): Promise<AdminLoginResult> {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPassword = password.trim();

  if (!trimmedEmail || !trimmedPassword) {
    return { ok: false, error: 'Email and password are required' };
  }

  const { error } = await signInAdmin(trimmedEmail, trimmedPassword);

  if (error) {
    return { ok: false, error };
  }

  redirect('/admin/dashboard');
}
