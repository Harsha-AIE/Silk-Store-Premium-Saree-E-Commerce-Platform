'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, MessageCircle, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buildContactUrl } from '@/lib/whatsapp';
import { useWishlist } from './WishlistProvider';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Collections', href: '/collections' },
  { label: 'Bridal', href: '/collections?category=Bridal+Silk' },
  { label: 'Designer', href: '/collections?category=Designer+Silk' },
  { label: 'Wishlist', href: '/wishlist' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { count, hydrated } = useWishlist();
  const contactUrl = buildContactUrl();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-400"
        style={{
          backgroundColor: scrolled ? '#0B0B0B' : 'transparent',
          borderBottom: scrolled ? '1px solid rgba(200,169,107,0.1)' : '1px solid transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '28px',
                color: '#C8A96B',
                fontWeight: 400,
                letterSpacing: '0.12em',
              }}
            >
              Dhanunjaya
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.label}
                href={link.href}
                className="no-underline"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  color: '#F8F4EC',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                }}
              >
                {link.label}
              </Link>
            ))}
            <a
              href={contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                color: '#F8F4EC',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              Contact
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/wishlist" className="relative no-underline" style={{ color: '#C8A96B' }}>
              <Heart size={22} />
              {hydrated && count > 0 && (
                <span
                  className="absolute -top-2 -right-2 flex items-center justify-center rounded-full text-xs"
                  style={{
                    backgroundColor: '#C8A96B',
                    color: '#0B0B0B',
                    width: 18,
                    height: 18,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {count}
                </span>
              )}
            </Link>
            <a
              href={contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline flex items-center justify-center w-10 h-10 rounded-full"
              style={{ color: '#25D366' }}
            >
              <MessageCircle size={22} />
            </a>
          </div>

          <button
            type="button"
            className="md:hidden flex items-center justify-center w-10 h-10"
            onClick={() => setDrawerOpen(true)}
            style={{ color: '#C8A96B' }}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col"
              style={{
                backgroundColor: '#0B0B0B',
                borderLeft: '1px solid rgba(200,169,107,0.2)',
              }}
            >
              <div className="flex items-center justify-between px-6 h-16">
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', color: '#C8A96B' }}>
                  Menu
                </span>
                <button type="button" onClick={() => setDrawerOpen(false)} style={{ color: '#C8A96B' }}>
                  <X size={22} />
                </button>
              </div>
              <div className="flex flex-col gap-1 px-6 mt-4">
                {[...navLinks, { label: 'Contact', href: contactUrl, external: true }].map((link, i) =>
                  'external' in link && link.external ? (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block py-3 no-underline"
                      style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', color: '#F8F4EC' }}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="block py-3 no-underline"
                      style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', color: '#F8F4EC' }}
                    >
                      {link.label}
                    </Link>
                  )
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
