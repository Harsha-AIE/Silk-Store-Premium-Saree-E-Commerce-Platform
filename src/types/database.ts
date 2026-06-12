export type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  created_at: string;
};

export type Saree = {
  id: string;
  slug: string;
  title: string;
  price: number;
  description: string | null;
  category_id: string | null;
  fabric: string | null;
  occasion: string | null;
  colors: string[];
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  images?: SareeImage[];
};

export type SareeImage = {
  id: string;
  saree_id: string;
  url: string;
  storage_path: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
};

export type Wishlist = {
  id: string;
  share_token: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type WishlistItem = {
  id: string;
  wishlist_id: string;
  saree_id: string;
  created_at: string;
  saree?: Saree;
};

export type AdminRecord = {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
};

export type DashboardStats = {
  totalSarees: number;
  totalCategories: number;
  wishlistSaves: number;
  recentlyAdded: number;
};

export type SareeFormInput = {
  title: string;
  price: number;
  description: string;
  category_id: string;
  fabric: string;
  occasion: string;
  colors: string[];
  featured: boolean;
  published: boolean;
};
