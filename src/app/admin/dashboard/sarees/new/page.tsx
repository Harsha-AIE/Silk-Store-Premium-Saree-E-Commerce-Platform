import { fetchAllCategories } from '@/lib/products/queries';
import SareeForm from '@/components/admin/SareeForm';

export default async function NewSareePage() {
  const categories = await fetchAllCategories();

  return (
    <div>
      <h1 className="mb-6" style={{ fontSize: '32px', color: '#C8A96B', fontWeight: 400 }}>
        New Saree
      </h1>
      <SareeForm categories={categories} />
    </div>
  );
}
