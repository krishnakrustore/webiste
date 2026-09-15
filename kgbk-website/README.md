# Krishna Gari Battala Kottu — Website

A premium fabric & saree product-catalogue website with a local admin panel.
No payments, no cart, no checkout, no backend — every product enquiry routes
to a WhatsApp conversation.

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (design tokens in `src/index.css`)
- Framer Motion (animations)
- React Router
- Lucide React (icons)
- IndexedDB for the product catalogue (no backend, no API keys)

## Getting started

```bash
npm install
npm run dev       # start local dev server
npm run build     # production build -> dist/
npm run preview   # preview the production build locally
```

Deploys as a static site to Vercel, Netlify or Cloudflare Pages (build command
`npm run build`, output directory `dist`).

## Before you launch

1. **WhatsApp number** — open `src/config/business.ts` and replace the
   placeholder `whatsapp` value with the client's real number
   (country code + number, digits only, e.g. `919876543210`). This single
   value drives every "Enquire on WhatsApp" button on the site.
2. **Product photography** — all product and category images currently use
   placeholder photography from picsum.photos so the site renders correctly
   out of the box. Replace them with real photography either by editing
   `src/data/products.ts` / `src/data/categories.ts`, or by using the Admin
   panel to add real products (their images are stored directly in the
   browser via IndexedDB).
3. **Business details** — address, hours, Instagram/Facebook links and the
   Google Maps link also live in `src/config/business.ts`.

## Admin panel

Visit `/admin/login`.

- Username: `admin`
- Password: `admin123`

These are **development-only credentials** with no real security — the login
check happens entirely in the browser. Do not rely on this for a production
deployment that needs real authentication; swap in a real auth provider
before handling sensitive data.

From the admin panel you can:
- View dashboard stats (total / featured / available products, categories used)
- Add, edit, and delete products, including drag-and-drop image upload and
  drag-to-reorder image ordering
- Update site settings (business name, phone, WhatsApp number, address, map
  link, social links) — stored in IndexedDB

Changes made in the admin panel save to the browser's IndexedDB and are
reflected on the public site automatically via `BroadcastChannel`, without a
page refresh, **as long as you're on the same browser and device**. This is a
local-only architecture — there is no server, so two different visitors on
two different devices won't see each other's admin edits. The storage layer
(`src/storage/ProductRepository.ts`, `src/storage/SettingsRepository.ts`) is
intentionally isolated behind a small repository interface so it can be
swapped for a real backend (Supabase, Firebase, or a custom API) later
without touching any page or component code.

## Project structure

```
src/
  admin/            Admin-only pages, components and hooks
  components/       Shared UI (layout, home sections, product cards, etc.)
  config/           Business info + WhatsApp link/message builders
  data/             Seed categories, occasions, fabric types, demo products
  hooks/            useProducts / useProduct (IndexedDB + live sync)
  layouts/          SiteLayout (public site chrome)
  pages/            Public-facing routes
  storage/          IndexedDB wrapper + repositories
  types/            Shared TypeScript types
```

## Notes on scope

This build focuses on the core premium catalogue + WhatsApp-enquiry
experience end to end (hero, category/occasion browsing, filtering & search,
product detail with gallery, admin CRUD with image upload). A few of the
more granular micro-interactions from the original brief (custom cursor
spotlighting, a top scroll-progress bar, toast notifications) were left out
to keep the codebase lean — the architecture (Framer Motion + Tailwind
tokens) makes them straightforward to add later if wanted.
