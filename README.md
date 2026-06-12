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

3. In [Supabase](https://supabase.com/dashboard), run SQL from:
   - `supabase/migrations/001_schema.sql`
   - `supabase/seed.sql` (optional categories)

4. Create a **public** storage bucket named `saree-images`.

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

## Architecture

- `src/lib/supabase` — Browser & server Supabase clients + middleware session refresh
- `src/lib/products` — Data access with static fallback when DB is empty
- `src/lib/wishlist` — localStorage for guests + Supabase sync for shared links
- `src/components/user` — Shop UI (no admin chrome)
- `src/components/admin` — Protected admin panel

## WhatsApp behavior

- **Product page**: “Inquire on WhatsApp” shares the product link only
- **Wishlist**: “Share Wishlist on WhatsApp” shares the full wishlist URL
- **Contact** (navbar): general store WhatsApp chat
- Product cards do **not** open WhatsApp directly
