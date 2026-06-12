import { Suspense } from 'react';
import { fetchPublishedSarees, fetchAllCategories } from '@/lib/products/queries';
import CollectionsContent from '@/components/user/CollectionsContent';

function CollectionsSkeleton() {
  return (
    <div className="flex items-center justify-center py-40">
      <p style={{ color: '#C8A96B', fontSize: '24px' }}>Loading collections...</p>
    </div>
  );
}

async function CollectionsData() {
  const [sarees, categories] = await Promise.all([
    fetchPublishedSarees(),
    fetchAllCategories(),
  ]);
  return <CollectionsContent sarees={sarees} categories={categories} />;
}

export default function CollectionsPage() {
  return (
    <Suspense fallback={<CollectionsSkeleton />}>
      <CollectionsData />
    </Suspense>
  );
}
