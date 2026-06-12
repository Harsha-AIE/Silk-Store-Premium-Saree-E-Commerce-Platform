'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@/types/database';
import { createCategory, deleteCategory, uploadCategoryImage } from '@/lib/products/mutations';

export default function CategoriesManager({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await createCategory(name.trim());
    setLoading(false);
    if (!error) {
      setName('');
      router.refresh();
    } else {
      setError(error.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category?')) return;
    setError('');
    const { error } = await deleteCategory(id);
    if (error) {
      setError(error.message);
      return;
    }
    setCategories(c => c.filter(x => x.id !== id));
    router.refresh();
  }

  async function handleImageUpload(categoryId: string, file: File) {
    setError('');
    const { error } = await uploadCategoryImage(categoryId, file);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Bridal Silk"
          className="flex-1 px-4 py-3 rounded-lg outline-none"
          style={{ backgroundColor: '#141414', border: '1px solid rgba(200,169,107,0.25)', color: '#F8F4EC' }}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-md"
          style={{ backgroundColor: '#C8A96B', color: '#0B0B0B', fontSize: '13px', textTransform: 'uppercase' }}
        >
          Add Category
        </button>
      </form>
      {error && <p style={{ color: '#ef4444', fontSize: '14px' }}>{error}</p>}

      <div className="grid gap-4">
        {categories.map(cat => (
          <div
            key={cat.id}
            className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg"
            style={{ backgroundColor: '#141414', border: '1px solid rgba(200,169,107,0.1)' }}
          >
            {cat.image_url && (
              <img src={cat.image_url} alt="" className="w-16 h-16 rounded object-cover" />
            )}
            <div className="flex-1">
              <p style={{ fontSize: '18px', color: '#F8F4EC' }}>{cat.name}</p>
              <p style={{ fontSize: '12px', color: 'rgba(248,244,236,0.4)' }}>{cat.slug}</p>
            </div>
            <label className="cursor-pointer text-sm" style={{ color: '#C8A96B' }}>
              Upload image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(cat.id, file);
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => handleDelete(cat.id)}
              style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
