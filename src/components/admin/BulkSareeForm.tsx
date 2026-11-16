'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Images } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createSaree, createSareeImageUpload, saveSareeImageRecord } from '@/lib/products/mutations';
import { parsePriceInput } from '@/lib/utils';
import type { Category, SareeFormInput } from '@/types/database';
import { useToast } from '@/components/ui/ToastProvider';

type Item = {
  id: number;
  title: string;
  price: string;
  description: string;
  fabric: string;
  occasion: string;
  colors: string;
  featured: boolean;
  published: boolean;
  photos: File[];
  createdId?: string;
  uploadedCount: number;
  status: 'ready' | 'saving' | 'done' | 'error';
  error?: string;
};

let nextId = 0;
const newItem = (): Item => ({
  id: ++nextId, title: '', price: '', description: '', fabric: '', occasion: '',
  colors: '', featured: false, published: true, photos: [], uploadedCount: 0, status: 'ready',
});

const inputStyle = {
  backgroundColor: '#0B0B0B', border: '1px solid rgba(200,169,107,0.3)',
  color: '#F8F4EC', fontSize: '14px',
};

function FilePreviews({ files }: { files: File[] }) {
  const urls = useMemo(() => files.map(file => URL.createObjectURL(file)), [files]);
  useEffect(() => () => urls.forEach(url => URL.revokeObjectURL(url)), [urls]);
  return <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
    {urls.map((src, i) => <img key={`${src}-${i}`} src={src} alt={`Selected photo ${i + 1}`} className="w-full aspect-square rounded object-cover" />)}
  </div>;
}

export default function BulkSareeForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { notify } = useToast();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [items, setItems] = useState<Item[]>(() => [newItem(), newItem()]);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState('');

  function patch(id: number, change: Partial<Item>) {
    setItems(current => current.map(item => item.id === id ? { ...item, ...change } : item));
  }

  function onPhotos(id: number, selected: FileList | null) {
    if (!selected) return;
    const files = Array.from(selected);
    if (files.some(file => !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type))) {
      notify('Use JPG, PNG, WebP or AVIF images.', 'error'); return;
    }
    if (files.some(file => file.size > 10 * 1024 * 1024)) {
      notify('Each image must be 10 MB or smaller.', 'error'); return;
    }
    const current = items.find(item => item.id === id);
    if (!current || current.photos.length + files.length > 10) {
      notify('Maximum 10 photos per saree.', 'error'); return;
    }
    patch(id, { photos: [...current.photos, ...files], status: 'ready' });
  }

  async function saveAll() {
    if (busy) return;
    if (!categoryId) { notify('Select a category first.', 'error'); return; }
    const pending = items.filter(item => item.status !== 'done');
    if (!pending.length) { notify('All sarees have already been saved.', 'success'); return; }
    for (const item of pending) {
      if (!item.title.trim() || !item.price.trim() || !Number.isFinite(parsePriceInput(item.price)) || parsePriceInput(item.price) <= 0) {
        notify(`Enter a title and valid price for saree ${items.indexOf(item) + 1}.`, 'error'); return;
      }
      if (!item.photos.length) {
        notify(`Add at least one photo for saree ${items.indexOf(item) + 1}.`, 'error'); return;
      }
    }
    setBusy(true);
    setSummary('Saving sarees one at a time. Keep this page open.');
    let done = 0;
    let errors = 0;
    let stopped = false;
    try {
      const supabase = createClient();
      for (const item of pending) {
        if (stopped) break;
        patch(item.id, { status: 'saving', error: undefined });
        try {
          let sareeId = item.createdId;
          if (!sareeId) {
            const payload: SareeFormInput = {
              title: item.title.trim(), price: parsePriceInput(item.price),
              category_id: categoryId, description: item.description,
              fabric: item.fabric, occasion: item.occasion,
              colors: item.colors.split(',').map(color => color.trim()).filter(Boolean),
              featured: item.featured, published: item.published,
            };
            const { data, error } = await createSaree(payload);
            if (error || !data) throw new Error(error?.message ?? 'Unable to create saree');
            sareeId = data.id;
            patch(item.id, { createdId: sareeId });
          }
          // Preserve the product id and progress on failure, so Retry cannot duplicate a product.
          for (let i = item.uploadedCount; i < item.photos.length; i++) {
            const file = item.photos[i];
            const { data: signed, error: signError } = await createSareeImageUpload(sareeId, file.name, file.type);
            if (signError || !signed) throw new Error(signError?.message ?? 'Unable to start image upload');
            const { error: uploadError } = await supabase.storage.from('saree_images')
              .uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type, cacheControl: '3600' });
            if (uploadError) throw new Error(uploadError.message);
            const { error: recordError } = await saveSareeImageRecord(sareeId, signed.path, i, i === 0);
            if (recordError) throw new Error(recordError.message);
            patch(item.id, { uploadedCount: i + 1 });
          }
          patch(item.id, { status: 'done', error: undefined });
          done++;
        } catch (err) {
          errors++;
          const message = err instanceof Error ? err.message : 'Unknown error';
          patch(item.id, { status: 'error', error: message });
          // Stop on an error: records already created remain accessible, and retry resumes safely.
          stopped = true;
          notify(`Failed to save “${item.title}”: ${message}`, 'error');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to connect to Supabase';
      errors++;
      notify(message, 'error');
    } finally {
      setBusy(false);
      setSummary(errors ? `${done} saree(s) saved this attempt. Fix the error and click Retry remaining. Previously saved sarees will not be duplicated.` : `${done} saree(s) saved. All completed entries are marked Saved.`);
      if (!errors) notify(`${done} saree(s) uploaded successfully.`, 'success');
      router.refresh();
    }
  }

  return <div className="max-w-5xl space-y-6">
    <div className="rounded-xl p-5 space-y-3" style={{ background: '#141414', border: '1px solid rgba(200,169,107,0.3)' }}>
      <label htmlFor="bulk-category" className="block font-semibold" style={{ color: '#C8A96B' }}>Shared category for all sarees *</label>
      <select id="bulk-category" required disabled={busy || items.some(item => !!item.createdId)} value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-3 py-3 rounded" style={inputStyle}>
        {categories.length === 0 && <option value="">Create a category first</option>}
        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
      </select>
      <p className="text-sm opacity-70">All entries below use this category. Each saree gets its own title, price, photos and product page. Category is locked after saving begins.</p>
    </div>
    {items.map((item, index) => <section key={item.id} className="p-4 sm:p-5 rounded-xl space-y-3" style={{ background: '#141414', border: '1px solid rgba(200,169,107,0.2)' }}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg" style={{ color: '#C8A96B' }}>Saree {index + 1} {item.status === 'done' && <span className="text-sm text-green-400">· Saved</span>}</h2>
        <button type="button" disabled={busy || !!item.createdId || items.length === 1} onClick={() => setItems(current => current.filter(x => x.id !== item.id))} className="inline-flex gap-1 items-center text-sm disabled:opacity-30" style={{ color: '#f87171' }}><Trash2 size={15} /> Remove row</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="space-y-1 text-sm">Title *<input required disabled={busy || !!item.createdId} value={item.title} onChange={e => patch(item.id, { title: e.target.value })} className="w-full px-3 py-2 rounded" style={inputStyle} placeholder="Kanchipuram Red Silk Saree" /></label>
        <label className="space-y-1 text-sm">Price (₹) *<input required inputMode="decimal" disabled={busy || !!item.createdId} value={item.price} onChange={e => patch(item.id, { price: e.target.value })} className="w-full px-3 py-2 rounded" style={inputStyle} placeholder="12500" /></label>
        <label className="space-y-1 text-sm">Fabric<input disabled={busy || !!item.createdId} value={item.fabric} onChange={e => patch(item.id, { fabric: e.target.value })} className="w-full px-3 py-2 rounded" style={inputStyle} /></label>
        <label className="space-y-1 text-sm">Occasion<input disabled={busy || !!item.createdId} value={item.occasion} onChange={e => patch(item.id, { occasion: e.target.value })} className="w-full px-3 py-2 rounded" style={inputStyle} /></label>
      </div>
      <label className="block space-y-1 text-sm">Description<textarea disabled={busy || !!item.createdId} value={item.description} onChange={e => patch(item.id, { description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded" style={inputStyle} /></label>
      <label className="block space-y-1 text-sm">Colors (comma-separated)<input disabled={busy || !!item.createdId} value={item.colors} onChange={e => patch(item.id, { colors: e.target.value })} className="w-full px-3 py-2 rounded" style={inputStyle} placeholder="Red, Gold" /></label>
      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" disabled={busy || !!item.createdId} checked={item.published} onChange={e => patch(item.id, { published: e.target.checked })} /> Publish immediately</label>
        <label className="flex items-center gap-2"><input type="checkbox" disabled={busy || !!item.createdId} checked={item.featured} onChange={e => patch(item.id, { featured: e.target.checked })} /> Featured</label>
      </div>
      <label className="block text-sm cursor-pointer" style={{ color: '#C8A96B' }}><span className="flex items-center gap-2 mb-2"><Images size={18} /> Saree photos * (1–10)</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={busy || !!item.createdId || item.status === 'done'} onChange={e => { onPhotos(item.id, e.target.files); e.target.value = ''; }} className="block w-full text-sm" /></label>
      {!!item.photos.length && <FilePreviews files={item.photos} />}
      {item.status === 'saving' && <p className="text-sm" style={{ color: '#C8A96B' }}>Saving saree and uploading photos…</p>}
      {item.status === 'error' && <p role="alert" className="text-sm text-red-400">Upload failed: {item.error}. Retry remaining to resume.</p>}
    </section>)}
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={busy || items.length >= 20} onClick={() => setItems(current => [...current, newItem()])} className="px-4 py-3 inline-flex items-center gap-2 rounded border disabled:opacity-40" style={{ borderColor: '#C8A96B', color: '#C8A96B' }}><Plus size={17} /> Add another saree</button>
      <button type="button" disabled={busy || !categoryId || items.every(item => item.status === 'done')} onClick={saveAll} className="px-5 py-3 rounded disabled:opacity-40" style={{ background: '#C8A96B', color: '#0B0B0B' }}>{busy ? 'Saving…' : items.some(item => item.status === 'error') ? 'Retry remaining' : 'Save all sarees'}</button>
    </div>
    {summary && <p role="status" className="text-sm" style={{ color: '#C8A96B' }}>{summary}</p>}
    <p className="text-xs opacity-60">Maximum 20 sarees per batch. If an image upload fails, the current row retains its product ID and successful photo count for retry; already saved sarees are skipped.</p>
  </div>;
}
