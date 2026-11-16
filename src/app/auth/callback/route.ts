import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const requestedNext = requestUrl.searchParams.get('next') || '/';
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//')
    ? requestedNext
    : '/';

  if (requestUrl.searchParams.has('error')) {
    const url = new URL(next, requestUrl.origin);
    url.searchParams.set('auth_error', 'Sign-in was cancelled or unsuccessful. Please try again.');
    return NextResponse.redirect(url);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const url = new URL(next, requestUrl.origin);
      url.searchParams.set('auth_error', 'We could not sign you in. Please try again.');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
