-- Customer profiles + authenticated, durable wishlists.
-- Run ONCE in Supabase SQL Editor after 001_schema.sql.

CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Populate profiles for future signups (email/password, Google, and magic link).
CREATE OR REPLACE FUNCTION public.create_customer_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.customer_profiles (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'), ''),
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.customer_profiles.full_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_customer_created ON auth.users;
CREATE TRIGGER on_auth_user_customer_created
  AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_customer_profile();

-- Include accounts registered before this migration.
INSERT INTO public.customer_profiles (id, email, full_name, created_at)
SELECT id, COALESCE(email, ''),
       NULLIF(COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'), ''), created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_customer_profiles_created ON public.customer_profiles(created_at DESC);
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_profiles_own_read" ON public.customer_profiles;
CREATE POLICY "customer_profiles_own_read" ON public.customer_profiles
  FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "customer_profiles_admin_read" ON public.customer_profiles;
CREATE POLICY "customer_profiles_admin_read" ON public.customer_profiles
  FOR SELECT TO authenticated USING (public.is_admin());
-- The trigger owns profile creation and email updates; customers cannot forge profile IDs.

-- Each signed-in customer has a single wishlist that survives browser/device changes.
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlists_owner_unique
  ON public.wishlists(user_id) WHERE user_id IS NOT NULL;

-- Replace legacy anonymous write access: guest hearts can no longer save anything.
DROP POLICY IF EXISTS "wishlists_insert" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_update" ON public.wishlists;
DROP POLICY IF EXISTS "wishlist_items_write" ON public.wishlist_items;

DROP POLICY IF EXISTS "wishlists_owner_insert" ON public.wishlists;
CREATE POLICY "wishlists_owner_insert" ON public.wishlists
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "wishlists_owner_update" ON public.wishlists;
CREATE POLICY "wishlists_owner_update" ON public.wishlists
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "wishlists_owner_delete" ON public.wishlists;
CREATE POLICY "wishlists_owner_delete" ON public.wishlists
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "wishlist_items_owner_insert" ON public.wishlist_items;
CREATE POLICY "wishlist_items_owner_insert" ON public.wishlist_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.wishlists w
            WHERE w.id = wishlist_id AND w.user_id = (SELECT auth.uid()))
  );
DROP POLICY IF EXISTS "wishlist_items_owner_update" ON public.wishlist_items;
CREATE POLICY "wishlist_items_owner_update" ON public.wishlist_items
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.wishlists w
                WHERE w.id = wishlist_id AND w.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.wishlists w
                     WHERE w.id = wishlist_id AND w.user_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS "wishlist_items_owner_delete" ON public.wishlist_items;
CREATE POLICY "wishlist_items_owner_delete" ON public.wishlist_items
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.wishlists w
            WHERE w.id = wishlist_id AND w.user_id = (SELECT auth.uid()))
  );

-- Existing public-read policies for /wishlist/[shareToken] stay intact.
-- For strictly private lists, replace the public share endpoints with a server-side token check.
