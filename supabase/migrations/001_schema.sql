-- Dhanunjaya Silk Sarees — production schema
-- Run in Supabase SQL Editor

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sarees
CREATE TABLE IF NOT EXISTS sarees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  fabric TEXT,
  occasion TEXT,
  colors TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saree images
CREATE TABLE IF NOT EXISTS saree_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saree_id UUID NOT NULL REFERENCES sarees(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT,
  sort_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin users (link to auth.users)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlist items
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  saree_id UUID NOT NULL REFERENCES sarees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (wishlist_id, saree_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sarees_published ON sarees(published);
CREATE INDEX IF NOT EXISTS idx_sarees_category ON sarees(category_id);
CREATE INDEX IF NOT EXISTS idx_sarees_featured ON sarees(featured);
CREATE INDEX IF NOT EXISTS idx_wishlists_token ON wishlists(share_token);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist ON wishlist_items(wishlist_id);

-- Admin check helper
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  );
$$;

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sarees ENABLE ROW LEVEL SECURITY;
ALTER TABLE saree_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- Categories: public read, admin write
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_write" ON categories FOR ALL USING (is_admin());

-- Sarees: public read published, admin full
CREATE POLICY "sarees_public_read" ON sarees FOR SELECT USING (published = true OR is_admin());
CREATE POLICY "sarees_admin_write" ON sarees FOR ALL USING (is_admin());

-- Images: follow saree visibility
CREATE POLICY "saree_images_public_read" ON saree_images FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM sarees s
    WHERE s.id = saree_id AND (s.published = true OR is_admin())
  )
);
CREATE POLICY "saree_images_admin_write" ON saree_images FOR ALL USING (is_admin());

-- Admins: only admins can read admin table
CREATE POLICY "admins_self_read" ON admins FOR SELECT USING (user_id = auth.uid() OR is_admin());

-- Wishlists: public read by token, anyone can create/update guest lists
CREATE POLICY "wishlists_public_read" ON wishlists FOR SELECT USING (true);
CREATE POLICY "wishlists_insert" ON wishlists FOR INSERT WITH CHECK (true);
CREATE POLICY "wishlists_update" ON wishlists FOR UPDATE USING (true);

-- Wishlist items
CREATE POLICY "wishlist_items_public_read" ON wishlist_items FOR SELECT USING (true);
CREATE POLICY "wishlist_items_write" ON wishlist_items FOR ALL USING (true);

-- Storage bucket (run in dashboard or):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('saree-images', 'saree-images', true);

-- After creating admin user in Auth, add to admins:
-- INSERT INTO admins (user_id, email) VALUES ('<auth-user-uuid>', 'admin@example.com');
