'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getLocalWishlist,
  getShareToken,
  saveLocalWishlist,
  syncWishlistToSupabase,
  toggleLocalWishlist,
} from '@/lib/wishlist/storage';

type WishlistContextValue = {
  sareeIds: string[];
  shareToken: string;
  count: number;
  isWishlisted: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  syncShare: () => Promise<void>;
  hydrated: boolean;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [sareeIds, setSareeIds] = useState<string[]>([]);
  const [shareToken, setShareToken] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const local = getLocalWishlist();
    setSareeIds(local.sareeIds);
    setShareToken(local.shareToken);
    setHydrated(true);
  }, []);

  const toggle = useCallback((id: string) => {
    const next = toggleLocalWishlist(id);
    setSareeIds(next);
    const token = getShareToken();
    setShareToken(token);
    syncWishlistToSupabase(next, token);
  }, []);

  const remove = useCallback((id: string) => {
    const next = sareeIds.filter(s => s !== id);
    saveLocalWishlist(next);
    setSareeIds(next);
    syncWishlistToSupabase(next, shareToken || getShareToken());
  }, [sareeIds, shareToken]);

  const syncShare = useCallback(async () => {
    const token = shareToken || getShareToken();
    await syncWishlistToSupabase(sareeIds, token);
  }, [sareeIds, shareToken]);

  const value = useMemo(
    () => ({
      sareeIds,
      shareToken,
      count: sareeIds.length,
      isWishlisted: (id: string) => sareeIds.includes(id),
      toggle,
      remove,
      syncShare,
      hydrated,
    }),
    [sareeIds, shareToken, toggle, remove, syncShare, hydrated]
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
