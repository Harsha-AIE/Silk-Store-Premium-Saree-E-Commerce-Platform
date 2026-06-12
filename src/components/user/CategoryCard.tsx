'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Category } from '@/types/database';
import { PLACEHOLDER_IMAGE } from '@/lib/utils';

export default function CategoryCard({ category }: { category: Category }) {
  const imgSrc = category.image_url ?? PLACEHOLDER_IMAGE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="shrink-0"
    >
      <Link
        href={`/collections?category=${encodeURIComponent(category.name)}`}
        className="no-underline block relative overflow-hidden rounded-lg group"
        style={{
          width: '280px',
          height: '380px',
          border: '1px solid rgba(200,169,107,0.2)',
        }}
      >
        <img src={imgSrc} alt={category.name} className="w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, #0B0B0B 0%, transparent 60%)' }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 p-5"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '22px',
            color: '#F8F4EC',
          }}
        >
          {category.name}
        </div>
      </Link>
    </motion.div>
  );
}
