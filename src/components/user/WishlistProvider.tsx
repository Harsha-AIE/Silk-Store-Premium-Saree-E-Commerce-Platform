'use client';

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { loadCustomerWishlist, saveCustomerWishlistItem } from '@/lib/wishlist/storage';
import { useToast } from '@/components/ui/ToastProvider';

type WishlistContextValue = {
  sareeIds: string[];
  shareToken: string;
  count: number;
  isWishlisted: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  syncShare: () => Promise<boolean>;
  hydrated: boolean;
  user: User | null;
  authReady: boolean;
  authOpen: boolean;
  requestLogin: () => void;
  dismissLogin: () => void;
  signOut: () => Promise<void>;
  wishlistError: string;
  clearWishlistError: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const PENDING_KEY = 'dhanunjaya-pending-wishlist-id';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { notify } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [sareeIds, setSareeIds] = useState<string[]>([]);
  const [shareToken, setShareToken] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [wishlistError, setWishlistError] = useState('');
  const pendingItem = useRef<string | null>(null);
  const saving = useRef(false);

  useEffect(() => {
    let active = true;
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch (error) {
      // A missing or malformed public Supabase configuration must never crash
      // the whole storefront. Keep products browsable and surface a useful error.
      const message = error instanceof Error ? error.message : 'Customer login is unavailable.';
      setWishlistError(message);
      setAuthReady(true);
      setHydrated(true);
      return;
    }
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    supabase.auth.getSession()
      .then(({ data }) => {
        if (active) {
          setUser(data.session?.user ?? null);
          setAuthReady(true);
        }
      })
      .catch(() => { if (active) setAuthReady(true); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    let active = true;
    if (!user) {
      setSareeIds([]);
      setShareToken('');
      setHydrated(true);
      return;
    }

    setHydrated(false);
    // A Google/email redirect remounts the page; keep only the *intent*, not a guest wishlist.
    pendingItem.current = pendingItem.current || sessionStorage.getItem(PENDING_KEY);
    loadCustomerWishlist(user.id)
      .then(async current => {
        const requested = pendingItem.current;
        if (requested && !current.sareeIds.includes(requested)) {
          const token = await saveCustomerWishlistItem(user.id, requested, true);
          current = { sareeIds: [...current.sareeIds, requested], shareToken: token };
        }
        if (!active) return;
        pendingItem.current = null;
        sessionStorage.removeItem(PENDING_KEY);
        setSareeIds(current.sareeIds);
        if (requested) notify('Saree saved to your wishlist.', 'success');
        setShareToken(current.shareToken);
        setWishlistError('');
        setAuthOpen(false);
      })
      .catch(error => {
        if (active) {
          pendingItem.current = null;
          sessionStorage.removeItem(PENDING_KEY);
          const message = error instanceof Error ? error.message : 'Unable to load your wishlist.';
          setWishlistError(message);
          notify(message, 'error');
        }
      })
      .finally(() => { if (active) setHydrated(true); });
    return () => { active = false; };
  }, [authReady, user?.id, notify]);

  const requestLogin = useCallback(() => {
    if (!user) setAuthOpen(true);
  }, [user]);

  const dismissLogin = useCallback(() => {
    pendingItem.current = null;
    sessionStorage.removeItem(PENDING_KEY);
    setAuthOpen(false);
  }, []);

  const signOut = useCallback(async () => {
    pendingItem.current = null;
    sessionStorage.removeItem(PENDING_KEY);
    const { error } = await createClient().auth.signOut();
    if (error) { setWishlistError(error.message); notify(`Sign out failed: ${error.message}`, 'error'); }
    else {
      setSareeIds([]);
      setShareToken('');
      setUser(null);
      setAuthOpen(false);
      notify('Signed out successfully.', 'success');
    }
  }, [notify]);

  const updateItem = useCallback(async (id: string, add: boolean) => {
    if (!user) {
      pendingItem.current = add ? id : null;
      if (add) sessionStorage.setItem(PENDING_KEY, id);
      else sessionStorage.removeItem(PENDING_KEY);
      setAuthOpen(true); // A heart click bypasses the 10-second/dismissed prompt delay.
      return;
    }
    if (!hydrated || saving.current) return;

    saving.current = true;
    setWishlistError('');
    try {
      const token = await saveCustomerWishlistItem(user.id, id, add);
      setShareToken(token);
      notify(add ? 'Saree added to your wishlist.' : 'Saree removed from your wishlist.', 'success');
      setSareeIds(current => add
        ? (current.includes(id) ? current : [...current, id])
        : current.filter(item => item !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save your wishlist.';
      setWishlistError(message);
      notify(message, 'error');
    } finally {
      saving.current = false;
    }
  }, [hydrated, user, notify]);

  const toggle = useCallback((id: string) => {
    void updateItem(id, !sareeIds.includes(id));
  }, [sareeIds, updateItem]);

  const remove = useCallback((id: string) => {
    void updateItem(id, false);
  }, [updateItem]);

  const syncShare = useCallback(async () => {
    if (!user) { setAuthOpen(true); return false; }
    return Boolean(shareToken) && !saving.current;
  }, [user, shareToken]);

  const value = useMemo(() => ({
    sareeIds, shareToken, count: sareeIds.length,
    isWishlisted: (id: string) => sareeIds.includes(id),
    toggle, remove, syncShare, hydrated,
    user, authReady, authOpen, requestLogin, dismissLogin, signOut,
    wishlistError, clearWishlistError: () => setWishlistError(''),
  }), [sareeIds, shareToken, toggle, remove, syncShare, hydrated, user,
    authReady, authOpen, requestLogin, dismissLogin, signOut, wishlistError]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
