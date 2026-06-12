'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import type { Saree } from '@/types/database';
import { formatPrice, getSareePrimaryImage } from '@/lib/utils';
import { buildProductInquiryUrl } from '@/lib/whatsapp';
import ProductCard from './ProductCard';
import { useWishlist } from './WishlistProvider';

export default function ProductDetail({
  saree,
  related,
}: {
  saree: Saree;
  related: Saree[];
}) {
  const images = saree.images?.length
    ? [...saree.images].sort((a, b) => {
        if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
        return a.sort_order - b.sort_order;
      })
    : [{ url: getSareePrimaryImage(saree), id: '0' }];

  const mainImg = images[0]?.url ?? getSareePrimaryImage(saree);
  const { isWishlisted, toggle, hydrated } = useWishlist();
  const wishlisted = hydrated && isWishlisted(saree.id);
  const whatsappUrl = buildProductInquiryUrl(saree.slug, saree.title);
  const tags = [saree.fabric, saree.occasion, ...(saree.colors ?? [])].filter(Boolean);

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="max-w-6xl mx-auto px-6 py-16 pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <div className="rounded-lg overflow-hidden" style={{ aspectRatio: '3/4' }}>
              <img src={mainImg} alt={saree.title} className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {images.slice(0, 4).map((img, i) => (
                  <div key={img.id ?? i} className="rounded-md overflow-hidden" style={{ aspectRatio: '1/1' }}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" style={{ opacity: i === 0 ? 1 : 0.5 }} />
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            {saree.category?.name && (
              <span
                className="inline-block"
                style={{
                  border: '1px solid #C8A96B',
                  color: '#C8A96B',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                }}
              >
                {saree.category.name}
              </span>
            )}

            <h1 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400, margin: '12px 0 8px' }}>
              {saree.title}
            </h1>
            <p style={{ color: '#C8A96B', fontSize: '32px', fontWeight: 600 }}>{formatPrice(saree.price)}</p>

            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    backgroundColor: '#141414',
                    border: '1px solid rgba(200,169,107,0.2)',
                    color: 'rgba(248,244,236,0.6)',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {saree.description && (
              <p className="mt-6" style={{ fontSize: '15px', color: 'rgba(248,244,236,0.8)', fontStyle: 'italic', lineHeight: 1.9 }}>
                {saree.description}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                type="button"
                onClick={() => toggle(saree.id)}
                className="flex items-center justify-center gap-2 py-4 px-6 transition-opacity"
                style={{
                  border: '1px solid #C8A96B',
                  color: wishlisted ? '#0B0B0B' : '#C8A96B',
                  backgroundColor: wishlisted ? '#C8A96B' : 'transparent',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  flex: 1,
                }}
              >
                <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
                {wishlisted ? 'In Wishlist' : 'Add to Wishlist'}
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline text-center py-4 transition-opacity flex-1"
                style={{
                  backgroundColor: '#C8A96B',
                  color: '#0B0B0B',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  fontWeight: 600,
                }}
              >
                Inquire on WhatsApp
              </a>
            </div>

            <Link href="/collections" className="no-underline inline-block mt-4" style={{ fontSize: '13px', color: 'rgba(248,244,236,0.5)' }}>
              ← Back to Collections
            </Link>
          </motion.div>
        </div>

        {related.length > 0 && (
          <div className="mt-20">
            <h2 style={{ fontSize: '36px', color: '#C8A96B', marginBottom: 32 }}>You May Also Like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map(s => (
                <ProductCard key={s.id} saree={s} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
