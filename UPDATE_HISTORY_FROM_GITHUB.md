# Silk Store — Update History from Original GitHub Archive

**Source repository (reference):** https://github.com/Harsha-AIE/Silk-Store-Premium-Saree-E-Commerce-Platform

**Baseline used:** the user-supplied `Silk-Store-Premium-Saree-E-Commerce-Platform-main.zip`. This archive is treated as the starting GitHub snapshot. **Previous updated version:** the user-supplied `Silk_Store_Updated_Full_Project_2026-11-14.zip`. **Current version:** the contents of this ZIP, prepared on November 16, 2026.

This document describes observed source-code differences and requested changes. It is **not** a Git commit log and cannot establish changes outside the uploaded snapshots. Live database migrations, OAuth settings and runtime operations must be checked separately.

## Version 0 — Original uploaded GitHub source

- Next.js App Router storefront and admin dashboard; TypeScript, Tailwind and Supabase.
- Saree/category CRUD, storage-backed saree photos, single-saree galleries, WhatsApp inquiries, existing wishlist infrastructure and admin login.
- SQL `supabase/migrations/001_schema.sql`, optional seed file, initial `.env.local.example`.

## Version 1 — November 14, 2026: customer accounts and authentication

**Changed:** `src/components/user/AuthPrompt.tsx`, `src/components/user/WishlistProvider.tsx`, `src/lib/wishlist/storage.ts`, `src/lib/supabase/{client,server,env}.ts`, `src/app/auth/callback/route.ts`, `src/components/user/Navbar.tsx`, `src/components/user/ProductCard.tsx`.

- Customer email/password signup and login, 10-second sign-in reminder for guests, and login required when a guest likes/saves a wishlist item.
- Customer profile and wishlist persistence, linked through Supabase Auth user IDs.
- Added database migration `supabase/migrations/002_customer_accounts.sql` for profiles, migration policies and wishlist relationships.
- Removed customer email magic-link workflow following localhost redirect problems. Customer email confirmation is an independent Supabase dashboard setting (must be disabled to skip verification). Google login is hidden unless OAuth is configured.
- Improved browser/public-key handling for Supabase; production still needs correct environment variables and a fresh build.

## Version 2 — November 14, 2026: product/admin images and user feedback

**Changed:** `src/components/user/ProductDetail.tsx`, `src/components/admin/SareeForm.tsx`, `src/components/admin/SareesManager.tsx`, `src/components/admin/CategoriesManager.tsx`, `src/components/user/WishlistPageContent.tsx`, `src/app/layout.tsx`.

**Added:** `src/components/ui/ToastProvider.tsx`, `src/components/user/WishlistError.tsx`, `src/app/admin/dashboard/customers/page.tsx`.

- Product detail thumbnails switch the currently selected photo. Full-screen photo viewer is available through an icon rather than a long text button; previous/next navigation provided.
- Admin edit form displays previously uploaded photos and permits removal.
- Feedback notifications for sharing/copying links, product changes, categories, sign-in and wishlist actions.
- Admin customer list includes saved wishlist data when the database is configured.
- WhatsApp contact changed to **+91 9885186881**. Production `NEXT_PUBLIC_WHATSAPP_PHONE` can override the configured default.

## Version 3 — November 16, 2026: bulk saree posting and category theme image

| Path | Change | Reason |
|---|---|---|
| `src/app/admin/dashboard/sarees/bulk/page.tsx` | **New** admin page | Bulk-entry route under authenticated dashboard |
| `src/components/admin/BulkSareeForm.tsx` | **New** bulk entry form | Create multiple independently priced/photographed sarees in one shared category |
| `src/components/admin/SareesManager.tsx` | **Updated** | Prominent **Bulk add (same category)** button |
| `src/lib/products/mutations.ts` | **Updated** | Unique product URL fallback when two sarees share a title |
| `src/components/admin/CategoriesManager.tsx` | **Updated** | **Change category theme image** heading, current preview, clearly labeled button, success/error feedback |
| `README.md` | **Updated** | Current setup, bulk workflow, category theme-image instructions |
| `UPDATE_HISTORY_FROM_GITHUB.md` | **New** | This change record |

### Bulk workflow and failure recovery

- One shared category applies to every product in a batch (limit: 20).
- Each product gets separate metadata and 1–10 selected images. Images are uploaded using the project's existing signed upload endpoints, preserving server-side admin authorization.
- Products are saved sequentially. An interrupted batch can leave successfully created records in Supabase. The form stores created product IDs and uploaded-image counts **while the page remains open** so Retry does not create duplicates. **Do not reload the page during a failed partial upload** unless you first check Admin → Sarees for already-created records.
- Duplicate titles are allowed: if a requested slug already exists, an eight-character random suffix is added. Existing records and URLs are not renamed by bulk mode.
- This release requires no new database tables beyond the existing migrations.

### Category image behavior

- Admin → Categories shows the current category theme image and a highly visible **Change theme image** upload control.
- This updates `categories.image_url` (and public storage) and does not replace images for the sarees inside the category.

## Verification and remaining setup

- Build/type checking: run `npm ci && npm run typecheck && npm run build` in a network-connected Node environment before deployment.
- Required external settings: Supabase URL/key, service secret, storage bucket, migrations, Auth email-confirmation toggle, production redirect configuration and Vercel Production environment variables.
- This archive does **not** claim changes are pushed to GitHub or deployed to Vercel. It is the code package to commit/release.

## Changes relative to the original ZIP

The November 14 working snapshot had **20 modified existing files, 4 added files and no removed files** relative to the supplied original GitHub ZIP (file contents compared, excluding archive directory entries). Version 3 adds the files listed above, plus its own documentation, to that working snapshot.
