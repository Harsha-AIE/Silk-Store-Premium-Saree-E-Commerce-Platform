'use client';

import { createClient } from '@/lib/supabase/client';
import { generateShareToken } from '@/lib/utils';
import type { Saree } from '@/types/database';

const STORAGE_KEY = 'dhanunjaya_wishlist';
const TOKEN_KEY = 'dhanunjaya_wishlist_token';

export type LocalWishlist = {
  sareeIds: string[];
  shareToken: string;
};

export function getLocalWishlist(): LocalWishlist {
  if (typeof window === 'undefined') {
    return { sareeIds: [], shareToken: '' };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const token = localStorage.getItem(TOKEN_KEY) ?? generateShareToken();
    if (!localStorage.getItem(TOKEN_KEY)) {
      localStorage.setItem(TOKEN_KEY, token);
    }

    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      return { sareeIds: parsed, shareToken: token };
    }
    return { sareeIds: [], shareToken: token };
  } catch {
    return { sareeIds: [], shareToken: generateShareToken() };
  }
}

export function saveLocalWishlist(sareeIds: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sareeIds));
}

export function getShareToken(): string {
  const { shareToken } = getLocalWishlist();
  return shareToken;
}

export function toggleLocalWishlist(sareeId: string): string[] {
  const { sareeIds, shareToken } = getLocalWishlist();
  const next = sareeIds.includes(sareeId)
    ? sareeIds.filter(id => id !== sareeId)
    : [...sareeIds, sareeId];
  saveLocalWishlist(next);
  if (!localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(TOKEN_KEY, shareToken);
  }
  return next;
}

export function isInLocalWishlist(sareeId: string): boolean {
  return getLocalWishlist().sareeIds.includes(sareeId);
}

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function syncWishlistToSupabase(sareeIds: string[], shareToken: string) {
  const validIds = sareeIds.filter(isUuid);
  if (validIds.length === 0 && sareeIds.length > 0) return;

  const supabase = createClient();

  const { data: existing } = await supabase
    .from('wishlists')
    .select('id')
    .eq('share_token', shareToken)
    .maybeSingle();

  let wishlistId = existing?.id;

  if (!wishlistId) {
    const { data: created, error } = await supabase
      .from('wishlists')
      .insert({ share_token: shareToken })
      .select('id')
      .single();

    if (error || !created) return;
    wishlistId = created.id;
  }

  await supabase.from('wishlist_items').delete().eq('wishlist_id', wishlistId);

  if (validIds.length > 0) {
    await supabase.from('wishlist_items').insert(
      validIds.map(saree_id => ({ wishlist_id: wishlistId, saree_id }))
    );
  }
}

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

  const ids = items.map(i => i.saree_id);
  const { data: sarees } = await supabase
    .from('sarees')
    .select(`
      *,
      category:categories(*),
      images:saree_images(*)
    `)
    .in('id', ids)
    .eq('published', true);

  return (sarees as Saree[]) ?? [];
}

export async function mergeAuthWishlist(userId: string) {
  const { sareeIds, shareToken } = getLocalWishlist();
  if (sareeIds.length === 0) return;

  const supabase = createClient();

  const { data: existing } = await supabase
    .from('wishlists')
    .select('id, share_token')
    .eq('user_id', userId)
    .maybeSingle();

  let wishlistId = existing?.id;
  const token = existing?.share_token ?? shareToken;

  if (!wishlistId) {
    const { data: created } = await supabase
      .from('wishlists')
      .insert({ share_token: token, user_id: userId })
      .select('id')
      .single();
    wishlistId = created?.id;
  }

  if (!wishlistId) return;

  for (const sareeId of sareeIds) {
    await supabase
      .from('wishlist_items')
      .upsert({ wishlist_id: wishlistId, saree_id: sareeId }, { onConflict: 'wishlist_id,saree_id' });
  }

  localStorage.setItem(TOKEN_KEY, token);
}
