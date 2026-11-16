'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Category, Saree, SareeFormInput } from '@/types/database';
import { parsePriceInput } from '@/lib/utils';
import {
  createSaree,
  updateSaree,
  createSareeImageUpload,
  saveSareeImageRecord,
  deleteSareeImage,
} from '@/lib/products/mutations';
import { createClient } from '@/lib/supabase/client';
import ImageUploader from './ImageUploader';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import type { SareeImage } from '@/types/database';

type Props = {
  categories: Category[];
  saree?: Saree;
};

export default function SareeForm({ categories, saree }: Props) {
  const router = useRouter();
  const { notify } = useToast();
  const [existingImages, setExistingImages] = useState<SareeImage[]>(() => [...(saree?.images ?? [])].sort((a, b) => a.sort_order - b.sort_order));
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
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

  const previews = useMemo(
    () => pendingFiles.map(file => URL.createObjectURL(file)),
    [pendingFiles]
  );

  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  async function removeExistingPhoto(image: SareeImage) {
    if (!window.confirm('Remove this photo from the saree?')) return;
    setDeletingImageId(image.id);
    try {
      const { error } = await deleteSareeImage(image.id, image.storage_path);
      if (error) throw new Error(error.message);
      setExistingImages(current => current.filter(item => item.id !== image.id));
      notify('Saree photo removed successfully.', 'success');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to remove photo.';
      setError(message);
      notify(`Photo removal failed: ${message}`, 'error');
    } finally {
      setDeletingImageId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const input: SareeFormInput = {
      ...form,
      price: parsePriceInput(priceInput),
      colors: colorInput
        .split(',')
        .map(c => c.trim())
        .filter(Boolean),
    };

    try {
      let sareeId: string;
      const existingImageCount = existingImages.length ? Math.max(...existingImages.map(img => img.sort_order)) + 1 : 0;

      if (saree) {
        const { error: updateError } = await updateSaree(saree.id, input);

        if (updateError) {
          throw new Error(updateError.message);
        }

        sareeId = saree.id;
      } else {
        const { data, error: createError } = await createSaree(input);

        if (createError || !data) {
          throw new Error(createError?.message ?? 'Failed to create saree');
        }

        sareeId = data.id;
      }

      const supabase = createClient();

      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];

        const { data: signedUpload, error: signedError } = await createSareeImageUpload(
          sareeId,
          file.name,
          file.type
        );

        if (signedError || !signedUpload) {
          throw new Error(signedError?.message ?? 'Failed to generate upload token');
        }

        const { error: uploadError } = await supabase.storage
          .from('saree_images')
          .uploadToSignedUrl(signedUpload.path, signedUpload.token, file, {
            contentType: file.type,
            cacheControl: '3600',
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { error: saveError } = await saveSareeImageRecord(
          sareeId,
          signedUpload.path,
          existingImageCount + i,
          i === 0 && existingImageCount === 0
        );

        if (saveError) {
          throw new Error(saveError.message);
        }
      }

      notify(saree ? 'Saree updated successfully.' : 'Saree created successfully.', 'success');
      router.push('/admin/dashboard/sarees');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      notify(`Saree could not be saved: ${message}`, 'error');
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
        {existingImages.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-sm" style={{ color: '#C8A96B' }}>Current saree photos ({existingImages.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {existingImages.map((image, i) => (
                <div key={image.id} className="relative rounded-lg overflow-hidden aspect-square" style={{ border: image.is_primary ? '2px solid #C8A96B' : '1px solid #333' }}>
                  <img src={image.url} alt={`Existing saree photo ${i + 1}`} className="w-full h-full object-cover" />
                  {image.is_primary && <span className="absolute bottom-1 left-1 text-xs px-2 py-1 rounded" style={{ background: '#111', color: '#C8A96B' }}>Main photo</span>}
                  <button type="button" aria-label={`Delete photo ${i + 1}`} disabled={deletingImageId !== null} onClick={() => void removeExistingPhoto(image)} className="absolute top-2 right-2 p-2 rounded-full disabled:opacity-50" style={{ background: 'rgba(0,0,0,0.8)', color: '#fff' }}><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="text-xs mb-2" style={{ color: 'rgba(248,244,236,0.55)' }}>Add more photos below; existing photos remain unless you remove them.</p>
        <ImageUploader
          onFiles={files => setPendingFiles(prev => [...prev, ...files])}
          previews={previews}
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
