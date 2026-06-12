'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Share2, Trash2 } from 'lucide-react';
import type { Saree } from '@/types/database';
import { fetchPublishedSareesClient } from '@/lib/products/client';
import { buildWishlistShareUrl } from '@/lib/whatsapp';
import { useWishlist } from './WishlistProvider';
import ProductCard from './ProductCard';
import { getSiteUrl } from '@/lib/config';

export default function WishlistPageContent() {
  const { sareeIds, shareToken, count, remove, syncShare, hydrated } = useWishlist();
  const [allSarees, setAllSarees] = useState<Saree[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublishedSareesClient().then(setAllSarees).finally(() => setLoading(false));
  }, []);

  const items = useMemo(
    () => allSarees.filter(s => sareeIds.includes(s.id)),
    [allSarees, sareeIds]
  );

  const shareLink = shareToken ? `${getSiteUrl()}/wishlist/${shareToken}` : '';

  async function handleShareWhatsApp() {
    await syncShare();
    if (!shareToken) return;
    window.open(buildWishlistShareUrl(shareToken), '_blank', 'noopener,noreferrer');
  }

  async function handleCopyLink() {
    await syncShare();
    if (shareLink) await navigator.clipboard.writeText(shareLink);
  }

  if (!hydrated || loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <p style={{ color: '#C8A96B', fontSize: '24px' }}>Loading wishlist...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div>
          <h1 style={{ fontSize: '48px', color: '#C8A96B', fontWeight: 300 }}>My Wishlist</h1>
          <p style={{ color: 'rgba(248,244,236,0.5)', marginTop: 8 }}>
            {count} {count === 1 ? 'saree' : 'sarees'} selected
          </p>
        </div>
        {count > 0 && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-5 py-3 rounded-md"
              style={{ border: '1px solid #C8A96B', color: '#C8A96B', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}
            >
              <Share2 size={16} />
              Copy Link
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center gap-2 px-5 py-3 rounded-md"
              style={{ backgroundColor: '#C8A96B', color: '#0B0B0B', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}
            >
              Share Wishlist on WhatsApp
            </button>
          </div>
        )}
      </div>

      {count === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
          <p style={{ fontSize: '28px', color: '#C8A96B', marginBottom: 16 }}>Your wishlist is empty</p>
          <p style={{ color: 'rgba(248,244,236,0.5)', marginBottom: 32 }}>Browse collections and save sarees you love</p>
          <Link href="/collections" className="no-underline" style={{ border: '1px solid #C8A96B', color: '#C8A96B', padding: '12px 32px', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '2px' }}>
            Explore Collections
          </Link>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(s => (
              <div key={s.id} className="relative">
                <ProductCard saree={s} />
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: 'rgba(11,11,11,0.85)', color: '#F8F4EC', fontSize: '11px' }}
                  aria-label="Remove from wishlist"
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>
            ))}
          </div>
          {shareLink && (
            <p className="mt-8 text-center text-sm" style={{ color: 'rgba(248,244,236,0.4)' }}>
              Share link: {shareLink}
            </p>
          )}
        </>
      )}
    </div>
  );
}
