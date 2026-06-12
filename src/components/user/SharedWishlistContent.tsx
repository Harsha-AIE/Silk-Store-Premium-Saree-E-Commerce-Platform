'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Saree } from '@/types/database';
import { fetchSharedWishlist } from '@/lib/wishlist/storage';
import ProductCard from './ProductCard';
import { buildWishlistShareUrl } from '@/lib/whatsapp';

export default function SharedWishlistContent({ shareToken }: { shareToken: string }) {
  const [sarees, setSarees] = useState<Saree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchSharedWishlist(shareToken).then(data => {
        setSarees(data);
        if (data.length === 0) setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [shareToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <p style={{ color: '#C8A96B', fontSize: '24px' }}>Loading shared wishlist...</p>
      </div>
    );
  }

  if (error || sarees.length === 0) {
    return (
      <div className="text-center py-40 px-6">
        <p style={{ fontSize: '28px', color: '#C8A96B' }}>Wishlist not found or empty</p>
        <Link href="/collections" className="no-underline inline-block mt-8" style={{ color: '#C8A96B' }}>
          Browse Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 style={{ fontSize: '48px', color: '#C8A96B', fontWeight: 300 }}>Shared Wishlist</h1>
        <p style={{ color: 'rgba(248,244,236,0.5)', marginTop: 8 }}>
          {sarees.length} {sarees.length === 1 ? 'saree' : 'sarees'} selected
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sarees.map(s => (
          <ProductCard key={s.id} saree={s} />
        ))}
      </div>
      <div className="flex justify-center mt-12">
        <a
          href={buildWishlistShareUrl(shareToken)}
          target="_blank"
          rel="noopener noreferrer"
          className="no-underline"
          style={{
            backgroundColor: '#C8A96B',
            color: '#0B0B0B',
            padding: '14px 36px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          Share Wishlist on WhatsApp
        </a>
      </div>
    </div>
  );
}
