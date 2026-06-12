import { notFound } from 'next/navigation';
import { fetchSareeByIdAdmin, fetchAllCategories } from '@/lib/products/queries';
import SareeForm from '@/components/admin/SareeForm';

type Props = { params: Promise<{ id: string }> };

export default async function EditSareePage({ params }: Props) {
  const { id } = await params;
  const [saree, categories] = await Promise.all([
    fetchSareeByIdAdmin(id),
    fetchAllCategories(),
  ]);

  if (!saree) notFound();

  return (
    <div>
      <h1 className="mb-6" style={{ fontSize: '32px', color: '#C8A96B', fontWeight: 400 }}>
        Edit Saree
      </h1>
      <SareeForm categories={categories} saree={saree} />
    </div>
  );
}
