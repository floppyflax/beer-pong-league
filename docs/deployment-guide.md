# Beer Pong League - Deployment Guide

**Date:** 2026-01-22

## Overview

The app is deployed as a **static SPA** on **Vercel**. Backend is **Supabase** (Auth, Postgres, optional Realtime). This guide covers app deployment; database setup is in [SUPABASE_SETUP.md](../SUPABASE_SETUP.md) and [DEPLOYMENT.md](../DEPLOYMENT.md).

## Infrastructure

| Layer    | Technology | Notes                          |
|----------|------------|--------------------------------|
| Frontend | Vercel     | SPA, serverless                |
| Backend  | Supabase   | Auth, Postgres, Realtime       |
| Env      | Vercel     | `VITE_SUPABASE_*` at build     |

## Prerequisites

- Vercel account
- Supabase project with URL and anon key
- Git repository (e.g. GitHub) connected to Vercel

## Deployment Process

### 1. Connect Repository

1. Open [vercel.com](https://vercel.com) and sign in.
2. **Add New Project** → **Import Git Repository**.
3. Select `floppyflax/beer-pong-league` (or your fork).

### 2. Project Settings

- **Framework Preset:** Vite  
- **Root Directory:** `./`  
- **Build Command:** `npm run build`  
- **Output Directory:** `dist`  
- **Install Command:** `npm install`

### 3. Environment Variables

In Vercel project **Settings → Environment Variables**, add:

| Name                   | Value                    | Environments   |
|------------------------|--------------------------|----------------|
| `VITE_SUPABASE_URL`    | `https://<project>.supabase.co` | Production, Preview |
| `VITE_SUPABASE_PUBLIC_KEY` | Your Supabase publishable key (sb_publishable_xxx) | Production, Preview |

> **Note**: Use the new **publishable key** (format `sb_publishable_xxx`) from Supabase Dashboard. The old `anon key` is deprecated. These are baked into the client build.

### 4. Deploy

- **Production:** Push to `main` (or your production branch) → automatic deploy.
- **Preview:** Push to other branches or open PRs → preview deployments.

### 5. Post-Deploy Checks

- Open the Vercel URL and confirm the app loads.
- Test auth (email + OTP) and a few key flows.
- Ensure Supabase RLS and CORS allow the Vercel domain if needed.

## CI/CD

- Vercel builds on each push/PR.
- No extra CI config required for basic deploy.
- Optional: add GitHub Actions for lint/test before merge.

## Database Migrations

- Run migrations against your **Supabase** project (not Vercel).
- Use Supabase CLI (`supabase db push`) or run SQL in the Supabase SQL editor.
- See `supabase/migrations/` and [SUPABASE_SETUP.md](../SUPABASE_SETUP.md).

## Rollbacks

- Vercel: redeploy a previous deployment from the dashboard or revert the Git branch and push.
- Supabase: migrations are forward-only; plan backwards-compatible changes.

## Security Notes

- Use only the **anon** key in frontend env; never expose the service role key.
- Restrict Supabase RLS and, if needed, CORS/redirect URLs to your Vercel domain(s).

---

## Git and GitHub Setup

### Pushing to GitHub

There are several ways to push your code to GitHub:

#### Option 1: GitHub CLI (Recommended)

If you have GitHub CLI installed:

```bash
gh auth login
gh repo set-default floppyflax/beer-pong-league
git push -u origin main
```

#### Option 2: Personal Access Token

##### Step 1: Create a GitHub Token

1. Go to GitHub.com
2. Click on your avatar (top right)
3. **Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**
4. Click **Generate new token** > **Generate new token (classic)**
5. Give it a name: `beer-pong-league`
6. Select permissions:
   - ✅ `repo` (all permissions)
7. Click **Generate token**
8. **COPY THE TOKEN** (you won't be able to see it again)

##### Step 2: Use the Token to Push

```bash
git push -u origin main
```

When Git prompts you:
- **Username**: `floppyflax`
- **Password**: Paste your **Personal Access Token** (not your GitHub password)

#### Option 3: Configure Git Credential Helper (To Avoid Retyping)

After a successful push with the token, configure the credential helper:

```bash
# macOS
git config --global credential.helper osxkeychain

# Then push (it will ask once, then save)
git push -u origin main
```

### Verification

After pushing, verify on GitHub:
- https://github.com/floppyflax/beer-pong-league

You should see all your files.

### Connecting to Vercel

Once the code is on GitHub:

1. Go to your Vercel project
2. **Settings** > **Git**
3. If not already connected, click **Connect Git Repository**
4. Select `floppyflax/beer-pong-league`
5. Vercel will automatically detect changes and deploy

---

_Generated using BMAD Method `document-project` workflow_  
_Updated: 2026-01-27 - Added Git and GitHub setup from GITHUB_PUSH.md_
