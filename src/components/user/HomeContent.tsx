'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, MessageCircle, Star, Zap } from 'lucide-react';
import type { Category, Saree } from '@/types/database';
import MarqueeTicker from './MarqueeTicker';
import CategoryCard from './CategoryCard';
import ProductCard from './ProductCard';
import { buildContactUrl } from '@/lib/whatsapp';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.15 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9 } },
};

const whyCards = [
  { icon: Sparkles, title: 'Curated Premium Collections', sub: 'Handpicked for every grand occasion' },
  { icon: MessageCircle, title: 'Direct WhatsApp Ordering', sub: 'Inquire on sarees or share your wishlist' },
  { icon: Star, title: 'Exclusive Designer Selections', sub: "Styles you won't find elsewhere" },
  { icon: Zap, title: 'Fast Inquiry Process', sub: 'Browse, pick, and inquire in minutes' },
];

export default function HomeContent({
  categories,
  featured,
}: {
  categories: Category[];
  featured: Saree[];
}) {
  const contactUrl = buildContactUrl();

  return (
    <div>
      <section
        className="flex items-center justify-center text-center px-6"
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(ellipse at center, #3d0a10 0%, #0B0B0B 70%)',
        }}
      >
        <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-2xl">
          <motion.p
            variants={fadeUp}
            style={{
              color: '#C8A96B',
              fontSize: '11px',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              marginBottom: '24px',
            }}
          >
            Est. 2017 — Dharmavaram
          </motion.p>
          <motion.h1
            variants={fadeUp}
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(36px, 6vw, 80px)',
              fontWeight: 300,
              lineHeight: 1.1,
            }}
          >
            Designed For Grand Celebrations
          </motion.h1>
          <motion.p
            variants={fadeUp}
            style={{
              fontSize: '16px',
              color: 'rgba(248,244,236,0.7)',
              lineHeight: 1.8,
              marginTop: '24px',
            }}
          >
            Handpicked luxury silk sarees for weddings, occasions, and modern elegance.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4 mt-10">
            <Link
              href="/collections"
              className="no-underline"
              style={{
                backgroundColor: '#C8A96B',
                color: '#0B0B0B',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: 500,
                padding: '12px 32px',
              }}
            >
              Explore Collections
            </Link>
            <Link
              href="/wishlist"
              className="no-underline"
              style={{
                border: '1px solid #C8A96B',
                color: '#C8A96B',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: 500,
                padding: '12px 32px',
              }}
            >
              My Wishlist
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <MarqueeTicker />

      <section className="py-24">
        <h2 className="text-center mb-4" style={{ fontSize: '48px', color: '#C8A96B', fontWeight: 400 }}>
          Shop By Collection
        </h2>
        <p className="text-center mb-12" style={{ fontSize: '15px', color: 'rgba(248,244,236,0.5)' }}>
          Curated collections for every occasion
        </p>
        <div className="flex gap-5 px-6 overflow-x-auto" style={{ scrollSnapType: 'x mandatory' }}>
          {categories.map(cat => (
            <div key={cat.id} style={{ scrollSnapAlign: 'start' }}>
              <CategoryCard category={cat} />
            </div>
          ))}
        </div>
      </section>

      <section className="py-24" style={{ backgroundColor: '#0a0a0a' }}>
        <h2 className="text-center mb-12" style={{ fontSize: '48px', color: '#C8A96B', fontWeight: 400 }}>
          Featured Sarees
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-6 max-w-7xl mx-auto">
          {featured.map(s => (
            <ProductCard key={s.id} saree={s} />
          ))}
        </div>
        <div className="flex justify-center mt-12">
          <Link
            href="/collections"
            className="no-underline"
            style={{
              border: '1px solid #C8A96B',
              color: '#C8A96B',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              padding: '12px 40px',
            }}
          >
            View All Sarees
          </Link>
        </div>
      </section>

      <section className="py-24">
        <h2 className="text-center mb-12" style={{ fontSize: '42px', color: '#C8A96B' }}>
          Why Shop With Us
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto px-6">
          {whyCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-lg"
              style={{ backgroundColor: '#141414', border: '1px solid rgba(200,169,107,0.15)' }}
            >
              <card.icon size={28} color="#C8A96B" />
              <h3 style={{ fontSize: '22px', margin: '16px 0 8px' }}>{card.title}</h3>
              <p style={{ fontSize: '14px', color: 'rgba(248,244,236,0.5)' }}>{card.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section
        className="py-20 px-6 text-center"
        style={{ background: 'linear-gradient(135deg, #1a0505, #0B0B0B)' }}
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="inline-flex rounded-full animate-pulse-dot" style={{ width: 12, height: 12, backgroundColor: '#ef4444' }} />
          <span style={{ color: '#ef4444', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 600 }}>
            Live
          </span>
        </div>
        <h2 style={{ fontSize: '48px', fontWeight: 300, marginBottom: 16 }}>Join Our Live Saree Showcase</h2>
        <p style={{ fontSize: '15px', color: 'rgba(248,244,236,0.5)', marginBottom: 32 }}>
          Next Live: Saturdays 6PM IST — browse and inquire in real time
        </p>
        <a
          href={contactUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="no-underline inline-block"
          style={{
            backgroundColor: '#C8A96B',
            color: '#0B0B0B',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            padding: '16px 40px',
          }}
        >
          Contact Us on WhatsApp
        </a>
      </section>
    </div>
  );
}
