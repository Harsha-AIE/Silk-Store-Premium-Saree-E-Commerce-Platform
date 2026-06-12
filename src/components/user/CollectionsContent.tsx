'use client';

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { Category, Saree } from '@/types/database';
import ProductCard from './ProductCard';

export default function CollectionsContent({
  sarees,
  categories,
}: {
  sarees: Saree[];
  categories: Category[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const activeCategory = searchParams?.get('category') || 'All';

  const filtered = useMemo(() => {
    return sarees.filter(s => {
      const catName = s.category?.name ?? '';
      if (activeCategory !== 'All' && catName !== activeCategory) return false;
      if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [sarees, activeCategory, search]);

  function setCategory(cat: string) {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (cat === 'All') params.delete('category');
    else params.set('category', cat);
    router.push(`/collections?${params.toString()}`);
  }

  const pills = ['All', ...categories.map(c => c.name)];

  return (
    <div style={{ minHeight: '100vh' }}>
      <div
        className="text-center py-16 pt-24"
        style={{ background: 'linear-gradient(135deg, #3d0a10 0%, #0B0B0B 100%)' }}
      >
        <h1 style={{ fontSize: '56px', fontWeight: 300 }}>Our Collections</h1>
      </div>

      <div className="flex flex-wrap justify-center gap-3 py-6 px-6">
        {pills.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            style={{
              padding: '8px 20px',
              borderRadius: '9999px',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              border: '1px solid #C8A96B',
              cursor: 'pointer',
              backgroundColor: activeCategory === cat ? '#C8A96B' : 'transparent',
              color: activeCategory === cat ? '#0B0B0B' : '#C8A96B',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="max-w-md mx-auto px-6 mt-4 mb-10">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search sarees by name..."
          className="w-full px-5 py-3 rounded-lg outline-none"
          style={{
            backgroundColor: '#141414',
            border: '1px solid rgba(200,169,107,0.3)',
            color: '#F8F4EC',
            fontSize: '14px',
          }}
        />
      </div>

      <div className="px-6 pb-24 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
              style={{ fontSize: '28px', color: '#C8A96B' }}
            >
              No sarees found
            </motion.p>
          ) : (
            <motion.div key="grid" layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(s => (
                <motion.div key={s.id} layout>
                  <ProductCard saree={s} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
