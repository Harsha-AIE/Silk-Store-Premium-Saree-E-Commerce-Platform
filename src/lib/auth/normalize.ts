/** Supabase Auth stores emails lowercase — normalize before sign-in/sign-up. */
export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}
