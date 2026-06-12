'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import type { Saree } from '@/types/database';
import { formatPrice, getSareePrimaryImage } from '@/lib/utils';
import { useWishlist } from './WishlistProvider';

export default function ProductCard({ saree }: { saree: Saree }) {
  const imgSrc = getSareePrimaryImage(saree);
  const { isWishlisted, toggle, hydrated } = useWishlist();
  const wishlisted = hydrated && isWishlisted(saree.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="group flex flex-col"
    >
      <div className="relative">
        <Link
          href={`/product/${saree.slug}`}
          className="no-underline block relative overflow-hidden rounded-lg"
          style={{ aspectRatio: '3/4' }}
        >
          <img
            src={imgSrc}
            alt={saree.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
            style={{
              background:
                'linear-gradient(135deg, rgba(200,169,107,0.3) 0%, transparent 50%, rgba(200,169,107,0.15) 100%)',
            }}
          />
        </Link>
        <button
          type="button"
          onClick={() => toggle(saree.id)}
          className="absolute top-3 right-3 flex items-center justify-center w-10 h-10 rounded-full transition-all"
          style={{
            backgroundColor: wishlisted ? '#C8A96B' : 'rgba(11,11,11,0.7)',
            color: wishlisted ? '#0B0B0B' : '#C8A96B',
            border: '1px solid rgba(200,169,107,0.4)',
          }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <Link href={`/product/${saree.slug}`} className="no-underline">
          <h3
            className="m-0 leading-snug"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '20px',
              color: '#F8F4EC',
              fontWeight: 500,
            }}
          >
            {saree.title}
          </h3>
        </Link>
        <span className="font-semibold" style={{ color: '#C8A96B', fontSize: '16px' }}>
          {formatPrice(saree.price)}
        </span>
        {saree.fabric && (
          <span style={{ color: 'rgba(248,244,236,0.5)', fontSize: '12px', fontFamily: "'Inter', sans-serif" }}>
            {saree.fabric}
          </span>
        )}
      </div>

      <Link
        href={`/product/${saree.slug}`}
        className="no-underline mt-3 block text-center py-2.5 rounded-md transition-all duration-300"
        style={{
          border: '1px solid #C8A96B',
          color: '#C8A96B',
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          fontWeight: 500,
        }}
      >
        View Details
      </Link>
    </motion.div>
  );
}
