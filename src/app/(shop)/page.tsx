import { fetchAllCategories, fetchFeaturedSarees } from '@/lib/products/queries';
import HomeContent from '@/components/user/HomeContent';

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    fetchAllCategories(),
    fetchFeaturedSarees(6),
  ]);

  return <HomeContent categories={categories} featured={featured} />;
}
