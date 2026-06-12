import { createClient } from '@/lib/supabase/server';
import type { Category, DashboardStats, Saree } from '@/types/database';

const SAREE_SELECT = `
  *,
  category:categories(*),
  images:saree_images(*)
`;

async function getServerSupabase() {
  try {
    return await createClient();
  } catch {
    return null;
  }
}

/**
 * ONLINE MODE: All queries require database connection
 * Fallback data has been removed - website is now online-only
 */

export async function fetchPublishedSarees(): Promise<Saree[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('sarees')
      .select(SAREE_SELECT)
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching published sarees:', error.message);
      return [];
    }
    return (data as Saree[]) ?? [];
  } catch (err) {
    console.error('Exception fetching published sarees:', err);
    return [];
  }
}

export async function fetchFeaturedSarees(limit = 6): Promise<Saree[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('sarees')
      .select(SAREE_SELECT)
      .eq('published', true)
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching featured sarees:', error.message);
      return [];
    }
    return (data as Saree[]) ?? [];
  } catch (err) {
    console.error('Exception fetching featured sarees:', err);
    return [];
  }
}

export async function fetchSareeBySlug(slug: string): Promise<Saree | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('sarees')
      .select(SAREE_SELECT)
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching saree ${slug}:`, error.message);
      return null;
    }
    return (data as Saree) ?? null;
  } catch (err) {
    console.error(`Exception fetching saree ${slug}:`, err);
    return null;
  }
}

export async function fetchRelatedSarees(slug: string, categoryId: string | null, limit = 4): Promise<Saree[]> {
  const all = await fetchPublishedSarees();
  return all.filter(s => s.slug !== slug && s.category_id === categoryId).slice(0, limit);
}

export async function fetchAllCategories(): Promise<Category[]> {
  return fetchCategories();
}

export async function fetchCategories(): Promise<Category[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error.message);
      return [];
    }
    return (data as Category[]) ?? [];
  } catch (err) {
    console.error('Exception fetching categories:', err);
    return [];
  }
}

export async function fetchAllSareesAdmin(): Promise<Saree[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('sarees')
      .select(SAREE_SELECT)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin sarees:', error.message);
      return [];
    }
    return (data as Saree[]) ?? [];
  } catch (err) {
    console.error('Exception fetching admin sarees:', err);
    return [];
  }
}

export async function fetchSareeByIdAdmin(id: string): Promise<Saree | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('sarees')
      .select(SAREE_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching saree ${id}:`, error.message);
      return null;
    }
    return (data as Saree) ?? null;
  } catch (err) {
    console.error(`Exception fetching saree ${id}:`, err);
    return null;
  }
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = await getServerSupabase();
  
  const defaultStats: DashboardStats = {
    totalSarees: 0,
    totalCategories: 0,
    wishlistSaves: 0,
    recentlyAdded: 0,
  };

  if (!supabase) return defaultStats;

  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [sarees, categories, wishlistItems, recent] = await Promise.all([
      supabase.from('sarees').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('wishlist_items').select('id', { count: 'exact', head: true }),
      supabase
        .from('sarees')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString()),
    ]);

    return {
      totalSarees: sarees.count ?? 0,
      totalCategories: categories.count ?? 0,
      wishlistSaves: wishlistItems.count ?? 0,
      recentlyAdded: recent.count ?? 0,
    };
  } catch (err) {
    console.error('Exception fetching dashboard stats:', err);
    return defaultStats;
  }
}

