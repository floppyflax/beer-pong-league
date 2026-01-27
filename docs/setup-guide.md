# Beer Pong League - Setup Guide

**Date:** 2026-01-27

## Overview

This guide covers the complete setup for the Beer Pong League application, including Supabase configuration, authentication setup, and redirect URL configuration.

---

## Supabase Setup

### ✅ Configuration Completed

#### Migrations Applied

1. **001_initial_schema** - All tables created:
   - `users` - Global users (Supabase Auth)
   - `anonymous_users` - Local identities
   - `leagues` - Leagues
   - `league_players` - League ↔ Players association
   - `tournaments` - Tournaments
   - `tournament_players` - Tournament ↔ Players association
   - `matches` - Matches
   - `elo_history` - ELO history tracking
   - `user_identity_merges` - Identity merge audit trail

2. **002_add_anti_cheat** - Anti-cheat system with match confirmation

3. **RLS Policies** - Row Level Security enabled on all tables

#### Connection Information

- **Project URL**: `https://zsazjkhhqtmyvjsumgcq.supabase.co`
- **Publishable Key**: See `.env.local` (create this file if it doesn't exist)

### Environment Variables

Create a `.env.local` file at the project root:

```env
VITE_SUPABASE_URL=https://zsazjkhhqtmyvjsumgcq.supabase.co
VITE_SUPABASE_PUBLIC_KEY=<your-publishable-key-sb_publishable_xxx>
```

> **Note**: Supabase has migrated to a new API key system. The new **publishable key** (format `sb_publishable_xxx`) replaces the deprecated `anon key`. Get your publishable key from Supabase Dashboard → Project Settings → API → Publishable key.

### Files Created

- ✅ `src/lib/supabase.ts` - Configured Supabase client
- ✅ `src/types/supabase.ts` - Generated TypeScript types
- ✅ `package.json` - `@supabase/supabase-js` dependency added

### Initial Setup Steps

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Supabase Auth (see Authentication Configuration section below)

3. Start development server:
   ```bash
   npm run dev
   ```

### Verification

To verify everything is working:

```typescript
import { supabase } from './lib/supabase';

// Test connection
const { data, error } = await supabase.from('leagues').select('*').limit(1);
console.log('Supabase connected:', !error);
```

---

## Authentication Configuration

### Redirect URLs Configuration

For magic links to work correctly in both production (Vercel) and development (local), you must configure Redirect URLs in Supabase.

#### Configuration Steps

1. Go to your Supabase project: https://supabase.com/dashboard/project/zsazjkhhqtmyvjsumgcq
2. **Authentication** → **URL Configuration**
3. In **Redirect URLs**, add the following:

#### For Local Development

```
http://localhost:5173/auth/callback
http://localhost:5173/**
```

#### For Production (Vercel)

```
https://beer-pong-competition.vercel.app/auth/callback
https://beer-pong-league-floppyflaxs-projects.vercel.app/auth/callback
https://beer-pong-league-git-main-floppyflaxs-projects.vercel.app/auth/callback
```

**Note**: To allow all Vercel preview deployments, you can use a wildcard:

```
https://*.vercel.app/auth/callback
```

This will enable preview deployments (PRs, branches) to work as well.

#### Site URL (Optional but Recommended)

- **Development**: `http://localhost:5173`
- **Production**: `https://beer-pong-competition.vercel.app` (or your main domain)

### How It Works

The code automatically uses `window.location.origin` to construct the redirect URL:

```typescript
emailRedirectTo: `${window.location.origin}/auth/callback`;
```

This means:

- Locally: `http://localhost:5173/auth/callback`
- On Vercel: `https://your-domain.vercel.app/auth/callback`

**Important**: The URL must be in the list of authorized Redirect URLs in Supabase, otherwise the redirect will be blocked.

### Verification

To verify correct configuration:

1. Test locally: send a magic link and verify it redirects to `http://localhost:5173/auth/callback`
2. Test on Vercel: send a magic link and verify it redirects to your Vercel URL

### Troubleshooting

If the magic link doesn't redirect correctly:

1. Verify the URL is in the Redirect URLs list
2. Verify the URL doesn't have a trailing slash (unless configured)
3. Check Supabase logs for redirect errors
4. Ensure email provider is enabled in Supabase Dashboard → Authentication → Providers

---

## Next Steps

1. Review the [Deployment Guide](./deployment-guide.md) for production deployment
2. See [Development Guide](./development-guide.md) for development workflows
3. Check [Architecture](../_bmad-output/planning-artifacts/architecture.md) for architectural decisions

---

_Updated: 2026-01-27 - Consolidated from SUPABASE_SETUP.md and SUPABASE_REDIRECT_CONFIG.md_
