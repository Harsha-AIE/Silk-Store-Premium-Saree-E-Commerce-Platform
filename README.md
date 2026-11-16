# Dhanunjaya Silk Sarees

Luxury silk saree showcase and inquiry platform built with **Next.js App Router**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.local.example .env.local
```

3. In [Supabase](https://supabase.com/dashboard), run `supabase/migrations/001_schema.sql` **only if the baseline schema has not been installed yet**, followed by `supabase/migrations/002_customer_accounts.sql`. You may also run `supabase/seed.sql` for sample categories.

4. Create a **public** storage bucket named `saree_images`.

5. Create an admin user in Supabase Auth, then:

```sql
INSERT INTO admins (user_id, email)
VALUES ('<your-auth-user-uuid>', 'admin@example.com');
```

6. Start the dev server:

```bash
npm run dev
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home — collections & featured sarees |
| `/collections` | Browse & filter sarees |
| `/product/[slug]` | Saree detail + WhatsApp inquiry |
| `/wishlist` | Personal wishlist |
| `/wishlist/[shareToken]` | Public shared wishlist |
| `/admin/login` | Admin authentication |
| `/admin/dashboard` | Admin overview & CRUD |
| `/admin/dashboard/sarees/bulk` | Bulk create multiple sarees in one selected category |
| `/admin/dashboard/categories` | Manage categories and their theme images |
| `/admin/dashboard/customers` | Customer profiles and saved wishlists |

## Architecture

- `src/lib/supabase` — Browser & server Supabase clients + middleware session refresh
- `src/lib/products` — Data access with static fallback when DB is empty
- `src/lib/wishlist` — signed-in customer wishlist persistence and shared links
- `src/components/user` — Shop UI (no admin chrome)
- `src/components/admin` — Protected admin panel

## WhatsApp behavior

- **Product page**: “Inquire on WhatsApp” shares the product link only
- **Wishlist**: “Share Wishlist on WhatsApp” shares the full wishlist URL
- **Contact** (navbar): general store WhatsApp chat
- Product cards do **not** open WhatsApp directly


## Current features (November 16, 2026)

- Admin-managed sarees and categories, product gallery, image uploads and WhatsApp inquiries.
- Customers can sign up and sign in with email/password. The app intentionally **does not use email magic links**. Email confirmation must be disabled in Supabase Auth → Providers → Email for immediate signup without verification. Google OAuth is hidden unless configured and enabled.
- Guest login prompt appears after 10 seconds; saving a wishlist item requires a signed-in customer. Profiles, wishlist records and item relationships are persisted in Supabase.
- Admin → Customers shows customer details and wishlist items after database migrations are applied.
- Saree gallery has selectable photo thumbnails and an icon-only full-screen control. Admin edit shows existing uploaded photos.
- Share link, save, update and delete operations show success/error notifications.
- WhatsApp contact: **+91 9885186881** (production environment variable may override this).

### Admin: add several sarees of the same category (NEW)

1. Sign in to the admin dashboard and go to **Sarees**.
2. Click **Bulk add (same category)**. Direct route: `/admin/dashboard/sarees/bulk`.
3. Select the shared category once. Enter a **title, price, and at least one photo for each saree**; optionally provide fabric, occasion, description, colors, featured and published flags.
4. Click **Add another saree** to add rows (up to 20 total). Select as many as 10 photos per saree (JPEG, PNG, WebP, AVIF; each up to 10 MB).
5. Click **Save all sarees**. Each saree is created as its own product with its own gallery. The button changes to **Retry remaining** after an error; already-saved rows are skipped and a partially uploaded row resumes without creating a duplicate product.

Keep the page open while uploading. Save completes one saree at a time and is **not a single atomic transaction**; earlier successful uploads are not rolled back if a later upload fails. Duplicate titles receive unique URLs automatically. The category cannot be changed after a batch starts saving.

### Admin: change category theme image (NEW, clearly labeled)

1. Go to **Admin Dashboard → Categories** (`/admin/dashboard/categories`).
2. Locate the category you want; its current category picture appears beside its name.
3. Click **Change theme image**, select a picture and wait for **Category theme image updated successfully**.
4. The image is used for that **collection/category theme** on the storefront, not for any individual saree gallery.

### Database and deployment

1. Install dependencies: `npm ci` (or `npm install` if updating the lockfile).
2. Copy `.env.local.example` to `.env.local`, then configure the public URL/key and server-only Supabase secret. Never commit real credentials.
3. Apply `supabase/migrations/001_schema.sql` if the schema is not already installed, then `supabase/migrations/002_customer_accounts.sql` on the **same Supabase project**. Do not blindly rerun the initial non-idempotent policies.
4. Create the public `saree_images` storage bucket and configure admin roles in `admins`.
5. Set Supabase Auth → Providers → Email → **Confirm email OFF** if immediate password signup without verification is desired.
6. Set Supabase Auth → URL Configuration → Site URL to `https://dhanunjaya-sarees.vercel.app` and allow `https://dhanunjaya-sarees.vercel.app/auth/callback`. Avoid production localhost redirects.
7. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or a valid public anon key), `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_PHONE=919885186881` for **Production** in Vercel. Public variables are baked into client code at build time: redeploy after changing them.
8. Test signup, login, a saved wishlist and the admin customer view against the real database; the TypeScript build alone does not prove live Supabase configuration.

For a file-level baseline comparison and dated version summaries, see [`UPDATE_HISTORY_FROM_GITHUB.md`](./UPDATE_HISTORY_FROM_GITHUB.md).
