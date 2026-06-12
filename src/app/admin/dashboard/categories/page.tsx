import { fetchAllCategories } from '@/lib/products/queries';
import CategoriesManager from '@/components/admin/CategoriesManager';

export default async function AdminCategoriesPage() {
  const categories = await fetchAllCategories();

  return (
    <div>
      <h1 className="mb-6" style={{ fontSize: '32px', color: '#C8A96B', fontWeight: 400 }}>
        Categories
      </h1>
      <CategoriesManager initialCategories={categories} />
    </div>
  );
}
