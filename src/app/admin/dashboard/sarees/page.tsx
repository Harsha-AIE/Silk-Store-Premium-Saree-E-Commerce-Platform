import { fetchAllSareesAdmin, fetchAllCategories } from '@/lib/products/queries';
import SareesManager from '@/components/admin/SareesManager';

export default async function AdminSareesPage() {
  const [sarees, categories] = await Promise.all([
    fetchAllSareesAdmin(),
    fetchAllCategories(),
  ]);

  return <SareesManager sarees={sarees} categories={categories} />;
}
