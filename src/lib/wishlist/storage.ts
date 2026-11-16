'use client';

import { createClient } from '@/lib/supabase/client';
import { generateShareToken } from '@/lib/utils';
import type { Saree } from '@/types/database';

export type CustomerWishlist = { sareeIds: string[]; shareToken: string };

function requireUuid(value: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error('This item is not available for saving yet.');
  }
}

/** The owner's saved products are retrieved each time they sign in. */
export async function loadCustomerWishlist(userId: string): Promise<CustomerWishlist> {
  const supabase = createClient();
  const { data: wishlist, error } = await supabase
    .from('wishlists')
    .select('id, share_token')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!wishlist) return { sareeIds: [], shareToken: '' };

  const { data: items, error: itemsError } = await supabase
    .from('wishlist_items')
    .select('saree_id')
    .eq('wishlist_id', wishlist.id);
  if (itemsError) throw itemsError;

  return { sareeIds: (items ?? []).map(item => item.saree_id), shareToken: wishlist.share_token };
}

async function getOrCreateWishlist(userId: string) {
  const supabase = createClient();
  const { data: existing, error: findError } = await supabase
    .from('wishlists')
    .select('id, share_token')
    .eq('user_id', userId)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing;

  const { data: created, error: createError } = await supabase
    .from('wishlists')
    .insert({ user_id: userId, share_token: generateShareToken() })
    .select('id, share_token')
    .single();
  if (createError) {
    // Another browser tab may have created the customer's wishlist concurrently.
    const { data: concurrent, error: retryError } = await supabase
      .from('wishlists')
      .select('id, share_token')
      .eq('user_id', userId)
      .maybeSingle();
    if (retryError || !concurrent) throw createError;
    return concurrent;
  }
  return created;
}

/** No guest saves: DB writes are always performed using an authenticated owner. */
export async function saveCustomerWishlistItem(userId: string, sareeId: string, add: boolean): Promise<string> {
  requireUuid(sareeId);
  const supabase = createClient();
  const wishlist = await getOrCreateWishlist(userId);

  if (add) {
    const { error } = await supabase.from('wishlist_items').upsert(
      { wishlist_id: wishlist.id, saree_id: sareeId },
      { onConflict: 'wishlist_id,saree_id' }
    );
    if (error) throw error;
  } else {
    const { error } = await supabase.from('wishlist_items')
      .delete()
      .eq('wishlist_id', wishlist.id)
      .eq('saree_id', sareeId);
    if (error) throw error;
  }
  return wishlist.share_token;
}

/** Public share links continue to work, but only owners may modify their lists. */
export async function fetchSharedWishlist(shareToken: string): Promise<Saree[]> {
  const supabase = createClient();

  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('id')
    .eq('share_token', shareToken)
    .maybeSingle();
  if (!wishlist) return [];

  const { data: items } = await supabase
    .from('wishlist_items')
    .select('saree_id')
    .eq('wishlist_id', wishlist.id);
  if (!items?.length) return [];

  const { data: sarees } = await supabase
    .from('sarees')
    .select('*, category:categories(*), images:saree_images(*)')
    .in('id', items.map(item => item.saree_id))
    .eq('published', true);
  return (sarees as Saree[]) ?? [];
}
