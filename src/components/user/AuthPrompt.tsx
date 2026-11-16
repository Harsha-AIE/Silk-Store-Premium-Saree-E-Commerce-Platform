'use client';

import { useEffect, useState } from 'react';
import { LogIn, UserPlus, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useWishlist } from './WishlistProvider';
import { useToast } from '@/components/ui/ToastProvider';

type Mode = 'login' | 'signup';

// Show Google only after OAuth is enabled in Supabase and Google Cloud.
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === 'true';

const DISMISS_KEY = 'dhanunjaya-auth-prompt-dismissed-at';
const PROMPT_DELAY_MS = 10_000;
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

export default function AuthPrompt() {
  const { user, authReady, authOpen, requestLogin, dismissLogin } = useWishlist();
  const { notify } = useToast();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authReady || user) return;
    const dismissedRecently = () => {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      return dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_TTL_MS;
    };
    if (dismissedRecently()) return;

    const timer = window.setTimeout(() => {
      if (!dismissedRecently()) requestLogin();
    }, PROMPT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [authReady, user?.id, requestLogin]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const message = url.searchParams.get('auth_error');
    if (!message) return;
    setError(message);
    requestLogin();
    url.searchParams.delete('auth_error');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, [requestLogin]);

  function callbackUrl() {
    const path = `${window.location.pathname}${window.location.search}`;
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(path)}`;
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    dismissLogin();
    setError('');
    setMessage('');
  }

  async function handleGoogle() {
    setLoading(true);
    setError('');
    try {
      const { error: googleError } = await createClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl() },
      });
      if (googleError) { setError(googleError.message); notify(googleError.message, 'error'); }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed.';
      setError(message);
      notify(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Email is required.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      if (mode === 'login') {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (loginError) { setError(loginError.message); notify(loginError.message, 'error'); }
        else notify('Logged in successfully.', 'success');
        // Session listener closes the dialog and saves the pending heart.
      } else if (mode === 'signup') {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (signupError) { setError(signupError.message); notify(signupError.message, 'error'); }
        else if (data.session) {
          setMessage('Your account is ready. You are now signed in.');
          notify('Account created successfully.', 'success');
        } else {
          // Supabase requires Confirm email to be disabled in Auth > Providers > Email.
          setError('Signup requires email confirmation in your Supabase settings. Turn off Confirm email under Authentication → Providers → Email, then try again.');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      setError(message);
      notify(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  if (!authOpen || user) return null;

  const inputStyle = {
    backgroundColor: '#141414',
    border: '1px solid rgba(200,169,107,0.25)',
    color: '#F8F4EC',
  };

  return (
    <div role="presentation" className="fixed inset-0 z-[80] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.68)' }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-login-title"
        className="w-full max-w-md rounded-lg p-6 relative max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: '#0B0B0B', border: '1px solid rgba(200,169,107,0.35)' }}
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 w-9 h-9 inline-flex items-center justify-center"
          style={{ color: '#C8A96B' }}
          aria-label="Close sign in prompt"
        >
          <X size={20} />
        </button>

        <div className="pr-10">
          <h2 id="customer-login-title" style={{ color: '#C8A96B', fontSize: '28px', fontFamily: "'Cormorant Garamond', serif" }}>
            Join Dhanunjaya
          </h2>
          <p className="mt-1" style={{ color: 'rgba(248,244,236,0.65)', fontSize: '14px' }}>
            Sign in to save your wishlist securely and find it again on your next visit.
          </p>
        </div>

        {GOOGLE_ENABLED && <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="mt-5 w-full px-4 py-3 rounded-md inline-flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ backgroundColor: '#F8F4EC', color: '#0B0B0B', fontSize: '14px', fontWeight: 600 }}
        >
          <LogIn size={18} />
          Continue with Google
        </button>}

        <div className="grid grid-cols-2 gap-2 mt-4">
          {[
            { key: 'login' as const, label: 'Login', icon: LogIn },
            { key: 'signup' as const, label: 'Signup', icon: UserPlus },
          ].map(item => {
            const Icon = item.icon;
            const active = mode === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => { setMode(item.key); setError(''); setMessage(''); }}
                className="px-2 py-2 rounded-md inline-flex items-center justify-center gap-1"
                style={{
                  backgroundColor: active ? '#C8A96B' : 'transparent',
                  color: active ? '#0B0B0B' : '#F8F4EC',
                  border: '1px solid rgba(200,169,107,0.25)', fontSize: '12px',
                }}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleEmailSubmit} className="mt-4 space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name (optional)"
              autoComplete="name"
              className="w-full px-4 py-3 rounded-md outline-none"
              style={inputStyle}
            />
          )}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            autoComplete="email"
            required
            className="w-full px-4 py-3 rounded-md outline-none"
            style={inputStyle}
          />
          {(
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              className="w-full px-4 py-3 rounded-md outline-none"
              style={inputStyle}
            />
          )}

          {error && <p role="alert" style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>}
          {message && <p role="status" style={{ color: '#C8A96B', fontSize: '13px' }}>{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-md disabled:opacity-60"
            style={{ backgroundColor: '#C8A96B', color: '#0B0B0B', fontSize: '14px', fontWeight: 600 }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login with Email' : 'Create Account'}
          </button>
        </form>

        <button type="button" onClick={dismiss} className="mt-3 w-full px-4 py-2"
          style={{ color: 'rgba(248,244,236,0.55)', fontSize: '13px' }}>
          Continue browsing
        </button>
      </div>
    </div>
  );
}
