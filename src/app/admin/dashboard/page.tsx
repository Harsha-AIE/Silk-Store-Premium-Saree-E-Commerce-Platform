import Link from 'next/link';
import { fetchDashboardStats } from '@/lib/products/queries';
import StatCard from '@/components/admin/StatCard';

export default async function AdminDashboardPage() {
  const stats = await fetchDashboardStats();

  return (
    <div className="space-y-8">
      <h1 style={{ fontSize: '32px', color: '#C8A96B', fontWeight: 400 }}>Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Sarees" value={stats.totalSarees} />
        <StatCard label="Categories" value={stats.totalCategories} />
        <StatCard label="Wishlist Saves" value={stats.wishlistSaves} />
        <StatCard label="Added This Week" value={stats.recentlyAdded} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/dashboard/sarees/new"
          className="no-underline px-5 py-2.5 rounded-md"
          style={{ backgroundColor: '#C8A96B', color: '#0B0B0B', fontSize: '13px', textTransform: 'uppercase' }}
        >
          Add New Saree
        </Link>
        <Link
          href="/admin/dashboard/categories"
          className="no-underline px-5 py-2.5 rounded-md"
          style={{ border: '1px solid #C8A96B', color: '#C8A96B', fontSize: '13px', textTransform: 'uppercase' }}
        >
          Manage Categories
        </Link>
      </div>
    </div>
  );
}
