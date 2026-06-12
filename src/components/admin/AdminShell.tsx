'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FolderOpen, Shirt, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const links = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/dashboard/categories', label: 'Categories', icon: FolderOpen },
  { href: '/admin/dashboard/sarees', label: 'Sarees', icon: Shirt },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0B0B0B', color: '#F8F4EC' }}>
      <aside
        className="hidden md:flex flex-col w-64 shrink-0 px-4 py-6"
        style={{ borderRight: '1px solid rgba(200,169,107,0.15)' }}
      >
        <Link href="/admin/dashboard" className="no-underline mb-8 px-2">
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', color: '#C8A96B' }}>
            Admin
          </span>
        </Link>
        <nav className="flex flex-col gap-1 flex-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="no-underline flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors"
              style={{
                backgroundColor: pathname === href ? 'rgba(200,169,107,0.12)' : 'transparent',
                color: pathname === href ? '#C8A96B' : 'rgba(248,244,236,0.7)',
                fontSize: '14px',
              }}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 mt-4 rounded-md w-full text-left"
          style={{ color: 'rgba(248,244,236,0.5)', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="md:hidden flex items-center justify-between px-4 h-14"
          style={{ borderBottom: '1px solid rgba(200,169,107,0.15)' }}
        >
          <span style={{ color: '#C8A96B', fontFamily: "'Cormorant Garamond', serif" }}>Admin</span>
          <button type="button" onClick={handleSignOut} style={{ color: 'rgba(248,244,236,0.5)', background: 'none', border: 'none' }}>
            <LogOut size={18} />
          </button>
        </header>
        <div className="md:hidden flex gap-1 px-2 py-2 overflow-x-auto">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="no-underline shrink-0 px-3 py-1.5 rounded-full text-xs"
              style={{
                backgroundColor: pathname === href ? '#C8A96B' : '#141414',
                color: pathname === href ? '#0B0B0B' : '#F8F4EC',
              }}
            >
              {label}
            </Link>
          ))}
        </div>
        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
