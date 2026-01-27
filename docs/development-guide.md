# Beer Pong League - Development Guide

**Date:** 2026-01-22

## Prerequisites

- **Node.js** 18+ (or per project requirements)
- **npm** (or compatible package manager)
- **Supabase** project for auth and database
- **Git** for version control

## Environment Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/floppyflax/beer-pong-league.git
   cd beer-pong-league
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   Create `.env.local` at project root:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLIC_KEY=sb_publishable_xxx
   ```

   Use your Supabase project URL and publishable key from the Supabase dashboard (Project Settings → API → Publishable key).

## Key Commands

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Start Vite dev server          |
| `npm run build`| TypeScript + Vite build        |
| `npm run lint` | Run ESLint                     |
| `npm run preview` | Preview production build    |

## Local Development

```bash
npm run dev
```

- Dev server runs (default Vite port, e.g. 5173).
- Hot reload for `src/` changes.
- Uses `VITE_SUPABASE_*` from `.env.local`.

## Build

```bash
npm run build
```

- Runs `tsc` then `vite build`.
- Output in `dist/`.
- Use `npm run preview` to test the production build locally.

## Linting

```bash
npm run lint
```

- ESLint on `.ts` / `.tsx`.
- Config: `eslint` in `package.json`; TypeScript + React rules.

## Project Structure

- **`src/`** — Application code (components, pages, context, services, etc.).
- **`supabase/migrations/`** — DB migrations; apply via Supabase CLI or dashboard.
- **`docs/`** — Project documentation (this guide, architecture, etc.).

See [source-tree-analysis.md](./source-tree-analysis.md) and [architecture.md](./architecture.md) for details.

## Database Migrations

- Migrations are in `supabase/migrations/` (e.g. `001_initial_schema.sql`, `002_add_anti_cheat.sql`).
- Apply via Supabase CLI (`supabase db push`) or run SQL in the Supabase SQL editor.
- Ensure Supabase project is set up and linked; see [SUPABASE_SETUP.md](../SUPABASE_SETUP.md) if present.

## Common Tasks

- **Change env:** Edit `.env.local` and restart `npm run dev`.
- **Add deps:** `npm install <package>`; use `dependencies` or `devDependencies` as appropriate.
- **Type generation:** If using Supabase codegen, run the project’s Supabase type-generation command (if configured).

## Troubleshooting

- **Build errors:** Run `npm run build` and fix TypeScript/ESLint issues.
- **Supabase connection:** Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLIC_KEY`; check Supabase project status and RLS. Make sure you're using the new publishable key (format `sb_publishable_xxx`).
- **Offline behavior:** App falls back to localStorage when Supabase is unavailable; ensure env is correct when testing online behavior.

---

_Generated using BMAD Method `document-project` workflow_
