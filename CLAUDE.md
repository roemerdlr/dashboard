# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

This is the "Acme" invoicing dashboard from the official Next.js App Router course (https://nextjs.org/learn). The repo started from the course starter template and is being built up chapter by chapter, so many pieces exist as starter code before they are wired into routes. For example, `app/ui/invoices/*` and `app/ui/customers/*` exist, but the `/dashboard/invoices` and `/dashboard/customers` routes they belong to have not been created yet.

## Commands

The package manager is **pnpm** (`pnpm-lock.yaml`, `pnpm-workspace.yaml`).

- `pnpm dev`: dev server with Turbopack at http://localhost:3000
- `pnpm build` / `pnpm start`: production build and serve
- Type-check: `pnpm exec tsc --noEmit`

There is no lint script and no test framework.

`pnpm-workspace.yaml` sets `minimumReleaseAge: 2880`, so pnpm won't install package versions published less than 2 days ago. `bcrypt` must be allowed to run its install script, because that script downloads the native binding `bcrypt_lib.node`; without it, `/seed` (and the Vercel build) fails with "Cannot find module ... bcrypt_lib.node". It is allowed in two places: `allowBuilds` is read by the local pnpm (11+), and `onlyBuiltDependencies` is read by pnpm 10, which Vercel uses. Keep both in sync. After changing them locally, run `pnpm rebuild bcrypt`.

## Environment / database

- Copy `.env.example` to `.env.local`. It needs a Postgres connection (`POSTGRES_URL`, intended for Vercel Postgres/Neon) plus `AUTH_SECRET`/`AUTH_URL` for NextAuth v5 (beta).
- Seed the database by visiting `GET /seed` (`app/seed/route.ts`). It creates the `users`, `customers`, `invoices` and `revenue` tables and inserts data from `app/lib/placeholder-data.ts`. User passwords are hashed with bcrypt.
- `app/query/route.ts` is a scratch route from the course and can be deleted once you're done with it.

## Architecture

- **Data access**: `app/lib/data.ts` uses the `postgres` client (`sql` tagged templates, `ssl: 'require'`) directly from React Server Components. There is no ORM. Row shapes are declared by hand in `app/lib/definitions.ts`, so keep them in sync when you change a query.
- **Money is stored in cents** as integers. Format it for display with `formatCurrency` in `app/lib/utils.ts`, which divides by 100.
- **Routing**: everything is in `app/` (App Router). `app/dashboard/layout.tsx` wraps all dashboard pages with `SideNav`.
- **UI**: components live in `app/ui/`, grouped by feature (`dashboard/`, `invoices/`, `customers/`). Only components that need hooks are client components (e.g. `nav-links.tsx` uses `usePathname`). Styling uses Tailwind (`tailwind.config.ts`, `@tailwindcss/forms`) with `clsx` for conditional classes. CSS Modules (`home.module.css`) are used once, as a course example.
- **Fonts**: they're defined once in `app/ui/fonts.ts` with `next/font/google`. Inter is applied globally in the root layout, and Lusitana is used for headings.
- **Imports**: use the `@/*` path alias, which maps to the repo root, e.g. `@/app/ui/...` and `@/app/lib/...`.
- **Other libraries** already installed for later course chapters: `zod` (Server Action validation), `use-debounce` (search), and `next-auth` (auth).
