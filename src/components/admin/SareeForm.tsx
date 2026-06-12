'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category, Saree, SareeFormInput } from '@/types/database';
import { parsePriceInput } from '@/lib/utils';
import { createSaree, updateSaree, uploadSareeImage } from '@/lib/products/mutations';
import ImageUploader from './ImageUploader';

type Props = {
  categories: Category[];
  saree?: Saree;
};

export default function SareeForm({ categories, saree }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const [form, setForm] = useState<SareeFormInput>({
    title: saree?.title ?? '',
    price: saree?.price ?? 0,
    description: saree?.description ?? '',
    category_id: saree?.category_id ?? categories[0]?.id ?? '',
    fabric: saree?.fabric ?? '',
    occasion: saree?.occasion ?? '',
    colors: saree?.colors ?? [],
    featured: saree?.featured ?? false,
    published: saree?.published ?? false,
  });
  const [colorInput, setColorInput] = useState((saree?.colors ?? []).join(', '));
  const [priceInput, setPriceInput] = useState(saree?.price?.toString() ?? '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const input: SareeFormInput = {
      ...form,
      price: parsePriceInput(priceInput),
      colors: colorInput.split(',').map(c => c.trim()).filter(Boolean),
    };

    try {
      if (saree) {
        const { error: err } = await updateSaree(saree.id, input);
        if (err) throw new Error(err.message);
        for (let i = 0; i < pendingFiles.length; i++) {
          const { error: uploadError } = await uploadSareeImage(
            saree.id,
            pendingFiles[i],
            i,
            i === 0 && !saree.images?.length
          );
          if (uploadError) throw new Error(uploadError.message);
        }
        router.push('/admin/dashboard/sarees');
        router.refresh();
      } else {
        const { data, error: err } = await createSaree(input);
        if (err || !data) throw new Error(err?.message ?? 'Failed to create');
        for (let i = 0; i < pendingFiles.length; i++) {
          const { error: uploadError } = await uploadSareeImage(data.id, pendingFiles[i], i, i === 0);
          if (uploadError) throw new Error(uploadError.message);
        }
        router.push('/admin/dashboard/sarees');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    backgroundColor: '#141414',
    border: '1px solid rgba(200,169,107,0.25)',
    color: '#F8F4EC',
    fontSize: '14px',
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {error && <p style={{ color: '#ef4444', fontSize: '14px' }}>{error}</p>}

      <div>
        <label className="block mb-1 text-sm" style={{ color: 'rgba(248,244,236,0.6)' }}>Title</label>
        <input
          required
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full px-4 py-3 rounded-lg outline-none"
          style={inputStyle}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-sm" style={{ color: 'rgba(248,244,236,0.6)' }}>Price (INR)</label>
          <input
            required
            value={priceInput}
            onChange={e => setPriceInput(e.target.value)}
            className="w-full px-4 py-3 rounded-lg outline-none"
            style={inputStyle}
            placeholder="45000"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm" style={{ color: 'rgba(248,244,236,0.6)' }}>Category</label>
          <select
            required
            value={form.category_id}
            onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg outline-none"
            style={inputStyle}
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block mb-1 text-sm" style={{ color: 'rgba(248,244,236,0.6)' }}>Description</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="w-full px-4 py-3 rounded-lg outline-none resize-y"
          style={inputStyle}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-sm" style={{ color: 'rgba(248,244,236,0.6)' }}>Fabric</label>
          <input
            value={form.fabric}
            onChange={e => setForm(f => ({ ...f, fabric: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block mb-1 text-sm" style={{ color: 'rgba(248,244,236,0.6)' }}>Occasion</label>
          <input
            value={form.occasion}
            onChange={e => setForm(f => ({ ...f, occasion: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label className="block mb-1 text-sm" style={{ color: 'rgba(248,244,236,0.6)' }}>Colors (comma-separated)</label>
        <input
          value={colorInput}
          onChange={e => setColorInput(e.target.value)}
          className="w-full px-4 py-3 rounded-lg outline-none"
          style={inputStyle}
          placeholder="Deep Red, Gold"
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
          />
          <span style={{ fontSize: '14px' }}>Featured</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.published}
            onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
          />
          <span style={{ fontSize: '14px' }}>Published</span>
        </label>
      </div>

      <div>
        <label className="block mb-2 text-sm" style={{ color: 'rgba(248,244,236,0.6)' }}>Images</label>
        <ImageUploader
          onFiles={files => setPendingFiles(prev => [...prev, ...files])}
          previews={pendingFiles.map(f => URL.createObjectURL(f))}
          onRemovePreview={i => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto px-8 py-3 rounded-md disabled:opacity-50"
        style={{ backgroundColor: '#C8A96B', color: '#0B0B0B', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}
      >
        {loading ? 'Saving...' : saree ? 'Update Saree' : 'Create Saree'}
      </button>
    </form>
  );
}
