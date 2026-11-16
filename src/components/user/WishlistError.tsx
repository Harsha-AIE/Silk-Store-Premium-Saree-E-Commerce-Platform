'use client';

import { X } from 'lucide-react';
import { useWishlist } from './WishlistProvider';

export default function WishlistError() {
  const { wishlistError, clearWishlistError } = useWishlist();
  if (!wishlistError) return null;
  return (
    <div role="alert" className="fixed bottom-5 right-5 z-[90] flex items-start gap-3 rounded-md p-4 max-w-sm"
      style={{ backgroundColor: '#281010', color: '#F8F4EC', border: '1px solid #ef4444' }}>
      <span className="text-sm">{wishlistError}</span>
      <button type="button" aria-label="Dismiss error" onClick={clearWishlistError}><X size={18} /></button>
    </div>
  );
}
