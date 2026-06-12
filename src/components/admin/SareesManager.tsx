'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import type { Category, Saree } from '@/types/database';
import { deleteSaree, updateSaree } from '@/lib/products/mutations';
import { formatPrice, getSareePrimaryImage } from '@/lib/utils';

export default function SareesManager({
  sarees: initial,
  categories,
}: {
  sarees: Saree[];
  categories: Category[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    let list = [...initial];
    if (categoryFilter !== 'all') {
      list = list.filter(s => s.category_id === categoryFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.title.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sort === 'newest' ? db - da : da - db;
    });
    return list;
  }, [initial, search, categoryFilter, sort]);

  async function togglePublished(saree: Saree) {
    setError('');
    const { error } = await updateSaree(saree.id, { published: !saree.published });
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this saree?')) return;
    setError('');
    const { error } = await deleteSaree(id);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 style={{ fontSize: '32px', color: '#C8A96B', fontWeight: 400 }}>Sarees</h1>
        <Link
          href="/admin/dashboard/sarees/new"
          className="no-underline inline-flex items-center gap-2 px-5 py-2.5 rounded-md"
          style={{ backgroundColor: '#C8A96B', color: '#0B0B0B', fontSize: '13px', textTransform: 'uppercase' }}
        >
          <Plus size={16} />
          Add Saree
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" color="rgba(248,244,236,0.4)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sarees..."
            className="w-full pl-10 pr-4 py-3 rounded-lg outline-none"
            style={{ backgroundColor: '#141414', border: '1px solid rgba(200,169,107,0.25)', color: '#F8F4EC' }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-4 py-3 rounded-lg outline-none"
          style={{ backgroundColor: '#141414', border: '1px solid rgba(200,169,107,0.25)', color: '#F8F4EC' }}
        >
          <option value="all">All categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as 'newest' | 'oldest')}
          className="px-4 py-3 rounded-lg outline-none"
          style={{ backgroundColor: '#141414', border: '1px solid rgba(200,169,107,0.25)', color: '#F8F4EC' }}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: '14px' }}>{error}</p>}

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <p style={{ color: 'rgba(248,244,236,0.5)', textAlign: 'center', padding: '48px 0' }}>No sarees found</p>
        ) : (
          filtered.map(s => (
            <div
              key={s.id}
              className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg items-start sm:items-center"
              style={{ backgroundColor: '#141414', border: '1px solid rgba(200,169,107,0.1)' }}
            >
              <img
                src={getSareePrimaryImage(s)}
                alt=""
                className="w-20 h-24 rounded object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: '18px' }}>{s.title}</p>
                <p style={{ color: '#C8A96B', fontSize: '14px' }}>{formatPrice(s.price)}</p>
                <p style={{ fontSize: '12px', color: 'rgba(248,244,236,0.4)' }}>
                  {s.category?.name ?? '—'} · {s.published ? 'Published' : 'Draft'}
                  {s.featured ? ' · Featured' : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => togglePublished(s)}
                  className="px-3 py-1.5 rounded text-xs"
                  style={{ border: '1px solid #C8A96B', color: '#C8A96B', background: 'transparent' }}
                >
                  {s.published ? 'Unpublish' : 'Publish'}
                </button>
                <Link
                  href={`/admin/dashboard/sarees/${s.id}/edit`}
                  className="no-underline inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs"
                  style={{ border: '1px solid rgba(248,244,236,0.2)', color: '#F8F4EC' }}
                >
                  <Pencil size={14} />
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs"
                  style={{ color: '#ef4444', background: 'none', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
