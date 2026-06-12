import { notFound } from 'next/navigation';
import { fetchSareeBySlug, fetchRelatedSarees } from '@/lib/products/queries';
import ProductDetail from '@/components/user/ProductDetail';

type Props = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const saree = await fetchSareeBySlug(slug);

  if (!saree) notFound();

  const related = await fetchRelatedSarees(slug, saree.category_id, 4);

  return <ProductDetail saree={saree} related={related} />;
}
