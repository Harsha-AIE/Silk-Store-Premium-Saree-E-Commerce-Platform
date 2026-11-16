import Link from 'next/link';
import BulkSareeForm from '@/components/admin/BulkSareeForm';
import { fetchAllCategories } from '@/lib/products/queries';

export default async function BulkSareesPage() {
  const categories = await fetchAllCategories();
  return <div className="space-y-5">
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div><h1 style={{ fontSize: '32px', color: '#C8A96B' }}>Bulk add sarees</h1>
        <p className="text-sm opacity-70 mt-1">Post several sarees in the same category in one batch.</p></div>
      <Link className="underline text-sm" href="/admin/dashboard/sarees">Back to sarees</Link>
    </div>
    {categories.length ? <BulkSareeForm categories={categories} /> :
      <p>Create a category first in <Link className="underline" href="/admin/dashboard/categories">Categories</Link>.</p>}
  </div>;
}
