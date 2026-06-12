'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { bootstrapAdminAction } from './actions';

export default function SetupAdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupResult, setLookupResult] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLookupResult('Checking...');
    const res = await fetch(
      `/api/debug/auth-lookup?email=${encodeURIComponent(lookupEmail.trim())}`,
      { cache: 'no-store' }
    );
    const json = await res.json();
    setLookupResult(JSON.stringify(json, null, 2));
  }

  async function handleBootstrap(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const out = await bootstrapAdminAction(email, password);
    setResult(JSON.stringify(out, null, 2));
    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0B0B0B',
        color: '#F8F4EC',
        padding: '2rem',
        fontFamily: 'system-ui',
        maxWidth: 560,
        margin: '0 auto',
      }}
    >
      <h1 style={{ color: '#C8A96B', fontWeight: 400 }}>Setup admin (dev only)</h1>
      <p style={{ fontSize: 14, color: 'rgba(248,244,236,0.6)', marginBottom: 24 }}>
        Fixes <code>invalid_credentials</code> by creating or resetting the Auth user on project{' '}
        <strong>mjxsisdjmogseodmjxyc</strong> and adding the <code>admins</code> row.
      </p>

      <ol style={{ fontSize: 14, color: 'rgba(248,244,236,0.7)', marginBottom: 24, paddingLeft: 20 }}>
        <li>
          Add to <code>.env.local</code>:{' '}
          <code>SUPABASE_SERVICE_ROLE_KEY=...</code> (from Supabase → Settings → API → service_role)
        </li>
        <li>Restart <code>npm run dev</code></li>
        <li>Use the form below with the email/password you want for login</li>
      </ol>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, color: '#C8A96B' }}>1. Check if email exists</h2>
        <form onSubmit={handleLookup} className="flex gap-2 flex-wrap">
          <input
            type="email"
            value={lookupEmail}
            onChange={e => setLookupEmail(e.target.value)}
            placeholder="Email to check"
            required
            style={inputStyle}
            className="flex-1 min-w-[200px]"
          />
          <button type="submit" style={buttonStyle}>
            Lookup
          </button>
        </form>
        {lookupResult && (
          <pre style={preStyle}>{lookupResult}</pre>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 18, color: '#C8A96B' }}>2. Create / reset admin</h2>
        <form onSubmit={handleBootstrap} className="space-y-3 flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Admin email"
            required
            style={inputStyle}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="New password (min 6 chars)"
            required
            minLength={6}
            style={inputStyle}
          />
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Working...' : 'Create / reset admin'}
          </button>
        </form>
        {result && <pre style={preStyle}>{result}</pre>}
      </section>

      <Link href="/admin/login" style={{ color: '#C8A96B', display: 'inline-block', marginTop: 24 }}>
        ← Try admin login
      </Link>
    </div>
  );
}

const inputStyle: CSSProperties = {
  padding: '12px 16px',
  borderRadius: 8,
  border: '1px solid rgba(200,169,107,0.25)',
  background: '#141414',
  color: '#F8F4EC',
  width: '100%',
};

const buttonStyle: CSSProperties = {
  padding: '12px 20px',
  background: '#C8A96B',
  color: '#0B0B0B',
  border: 'none',
  borderRadius: 8,
  fontWeight: 600,
  cursor: 'pointer',
};

const preStyle: CSSProperties = {
  marginTop: 12,
  padding: 12,
  background: '#141414',
  borderRadius: 8,
  fontSize: 12,
  overflow: 'auto',
};
