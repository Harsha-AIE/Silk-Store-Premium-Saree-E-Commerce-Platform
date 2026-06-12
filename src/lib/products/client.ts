'use client';

import { createClient } from '@/lib/supabase/client';
import { getFallbackSarees } from '@/data/fallback';
import type { Saree } from '@/types/database';

const SAREE_SELECT = `
  *,
  category:categories(*),
  images:saree_images(*)
`;

export async function fetchPublishedSareesClient(): Promise<Saree[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('sarees')
      .select(SAREE_SELECT)
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error || !data?.length) return getFallbackSarees().filter(s => s.published);
    return data as Saree[];
  } catch {
    return getFallbackSarees().filter(s => s.published);
  }
}
