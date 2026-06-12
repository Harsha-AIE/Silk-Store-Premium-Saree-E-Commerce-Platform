'use client';

import { useState } from 'react';
import { adminLoginAction, type AdminLoginResult } from '@/app/admin/login/actions';

export default function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result: AdminLoginResult = await adminLoginAction(email, password);
      if (!result.ok) {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0B0B0B' }}>
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 style={{ fontSize: '32px', color: '#C8A96B', fontFamily: "'Cormorant Garamond', serif", marginBottom: '8px' }}>
            Admin Portal
          </h1>
          <p style={{ color: 'rgba(248,244,236,0.6)', fontSize: '14px' }}>
            Sign in with your admin account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={{ display: 'block', color: '#F8F4EC', marginBottom: '8px', fontSize: '14px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-4 py-2 rounded-lg outline-none"
              style={{
                backgroundColor: '#141414',
                border: '1px solid rgba(200,169,107,0.25)',
                color: '#F8F4EC',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#F8F4EC', marginBottom: '8px', fontSize: '14px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-lg outline-none"
              style={{
                backgroundColor: '#141414',
                border: '1px solid rgba(200,169,107,0.25)',
                color: '#F8F4EC',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#C8A96B',
              color: '#0B0B0B',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
