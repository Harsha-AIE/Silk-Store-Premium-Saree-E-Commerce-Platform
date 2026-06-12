'use client';

import { useEffect, useState } from 'react';
import { LogIn, Mail, UserPlus, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'login' | 'signup' | 'magic';

const DISMISS_KEY = 'dhanunjaya-auth-prompt-dismissed-at';
const PROMPT_DELAY_MS = 180_000;
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

export default function AuthPrompt() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function schedulePrompt() {
      const { data } = await supabase.auth.getSession();
      if (data.session) return;

      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) return;

      timer = setTimeout(() => setOpen(true), PROMPT_DELAY_MS);
    }

    schedulePrompt();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setOpen(false);
        if (timer) clearTimeout(timer);
      }
    });

    return () => {
      if (timer) clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, []);

  function callbackUrl() {
    const path = `${window.location.pathname}${window.location.search}`;
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(path)}`;
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setOpen(false);
  }

  async function handleGoogle() {
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl(),
      },
    });
    if (googleError) {
      setError(googleError.message);
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    if (mode !== 'magic' && password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (mode === 'login') {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (loginError) setError(loginError.message);
      else {
        setMessage('Signed in successfully.');
        setOpen(false);
      }
    }

    if (mode === 'signup') {
      const { error: signupError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: callbackUrl(),
        },
      });
      if (signupError) setError(signupError.message);
      else setMessage('Check your email to confirm your account.');
    }

    if (mode === 'magic') {
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: callbackUrl(),
        },
      });
      if (magicError) setError(magicError.message);
      else setMessage('Check your email for the sign-in link.');
    }

    setLoading(false);
  }

  if (!open) return null;

  const inputStyle = {
    backgroundColor: '#141414',
    border: '1px solid rgba(200,169,107,0.25)',
    color: '#F8F4EC',
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.68)' }}>
      <div
        className="w-full max-w-md rounded-lg p-6 relative"
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
          <h2 style={{ color: '#C8A96B', fontSize: '28px', fontFamily: "'Cormorant Garamond', serif" }}>
            Join Dhanunjaya
          </h2>
          <p className="mt-1" style={{ color: 'rgba(248,244,236,0.65)', fontSize: '14px' }}>
            Sign in to keep your wishlist and receive collection updates.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="mt-5 w-full px-4 py-3 rounded-md inline-flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ backgroundColor: '#F8F4EC', color: '#0B0B0B', fontSize: '14px', fontWeight: 600 }}
        >
          <LogIn size={18} />
          Continue with Google
        </button>

        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { key: 'login' as const, label: 'Login', icon: LogIn },
            { key: 'signup' as const, label: 'Signup', icon: UserPlus },
            { key: 'magic' as const, label: 'Email Link', icon: Mail },
          ].map(item => {
            const Icon = item.icon;
            const active = mode === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setMode(item.key);
                  setError('');
                  setMessage('');
                }}
                className="px-2 py-2 rounded-md inline-flex items-center justify-center gap-1"
                style={{
                  backgroundColor: active ? '#C8A96B' : 'transparent',
                  color: active ? '#0B0B0B' : '#F8F4EC',
                  border: '1px solid rgba(200,169,107,0.25)',
                  fontSize: '12px',
                }}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleEmailSubmit} className="mt-4 space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full px-4 py-3 rounded-md outline-none"
            style={inputStyle}
          />
          {mode !== 'magic' && (
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-md outline-none"
              style={inputStyle}
            />
          )}

          {error && <p style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>}
          {message && <p style={{ color: '#C8A96B', fontSize: '13px' }}>{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-md disabled:opacity-60"
            style={{ backgroundColor: '#C8A96B', color: '#0B0B0B', fontSize: '14px', fontWeight: 600 }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login with Email' : mode === 'signup' ? 'Create Account' : 'Send Email Link'}
          </button>
        </form>

        <button
          type="button"
          onClick={dismiss}
          className="mt-3 w-full px-4 py-2"
          style={{ color: 'rgba(248,244,236,0.55)', fontSize: '13px' }}
        >
          Continue browsing
        </button>
      </div>
    </div>
  );
}
