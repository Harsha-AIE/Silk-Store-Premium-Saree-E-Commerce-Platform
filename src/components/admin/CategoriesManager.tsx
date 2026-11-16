'use client';

import { useEffect, useState } from 'react';
import { ImagePlus, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';
import type { Category } from '@/types/database';
import { createCategory, deleteCategory, uploadCategoryImage } from '@/lib/products/mutations';

export default function CategoriesManager({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const { notify } = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => setCategories(initialCategories), [initialCategories]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await createCategory(name.trim());
    setLoading(false);
    if (!error) {
      notify('Category created successfully.', 'success');
      setName('');
      router.refresh();
    } else {
      setError(error.message);
      notify(error.message, 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category?')) return;
    setError('');
    const { error } = await deleteCategory(id);
    if (error) {
      setError(error.message);
      notify(error.message, 'error');
      return;
    }
    notify('Category deleted successfully.', 'success');
    setCategories(c => c.filter(x => x.id !== id));
    router.refresh();
  }

  async function handleImageUpload(categoryId: string, file: File) {
    setError('');
    setUploadingId(categoryId);
    try {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
        throw new Error('Please choose a JPG, PNG, WebP or AVIF image.');
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Theme images must be 10 MB or smaller.');
      }
      const { data, error } = await uploadCategoryImage(categoryId, file);
      if (error) throw new Error(error.message);
      if (data && typeof data === 'object' && 'image_url' in data) {
        setCategories(current => current.map(cat => cat.id === categoryId ? { ...cat, image_url: String(data.image_url) } : cat));
      }
      notify('Category theme image updated successfully.', 'success');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Category image upload failed';
      setError(message);
      notify(message, 'error');
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="p-5 rounded-xl" style={{ background: '#141414', border: '1px solid rgba(200,169,107,0.4)' }}>
        <div className="flex items-center gap-2 mb-2" style={{ color: '#C8A96B' }}><ImagePlus size={21} /><h2 className="text-lg font-semibold">Change category theme image</h2></div>
        <p className="text-sm opacity-80">Use the <strong>Change theme image</strong> button beside any category below to replace the picture displayed for that collection on the customer website. This does not change individual saree photos.</p>
      </div>
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
            {cat.image_url ? (
              <img src={cat.image_url} alt={`${cat.name} collection theme`} className="w-24 h-24 rounded object-cover" />
            ) : <div className="w-24 h-24 rounded flex items-center justify-center" style={{ background: '#242424', color: '#C8A96B' }}><ImagePlus size={26} /></div>}
            <div className="flex-1">
              <p style={{ fontSize: '18px', color: '#F8F4EC' }}>{cat.name}</p>
              <p style={{ fontSize: '12px', color: 'rgba(248,244,236,0.4)' }}>{cat.slug}</p>
              <p className="text-xs mt-1" style={{ color: '#C8A96B' }}>Current category theme image {cat.image_url ? 'shown at left' : 'not set'}</p>
            </div>
            <label className="cursor-pointer text-sm inline-flex gap-2 items-center px-4 py-3 rounded-md" style={{ background: '#C8A96B', color: '#0B0B0B', opacity: uploadingId === cat.id ? 0.6 : 1 }}>
              <Upload size={16} /> {uploadingId === cat.id ? 'Uploading…' : 'Change theme image'}
              <input disabled={!!uploadingId}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) void handleImageUpload(cat.id, file);
                  e.target.value = '';
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
