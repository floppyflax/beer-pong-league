# Beer Pong League - API Contracts

**Date:** 2026-01-22  
**Backend:** Supabase (PostgreSQL + Auth + Realtime)

## Overview

The app uses the **Supabase JS client** (`@supabase/supabase-js`) for Auth, Database, and optional Realtime. There are no custom REST endpoints; all data access goes through Supabase.

## Configuration

- **Base URL:** `VITE_SUPABASE_URL` (e.g. `https://<project>.supabase.co`)
- **Publishable key:** `VITE_SUPABASE_PUBLIC_KEY` (format `sb_publishable_xxx`)
- **Client:** `src/lib/supabase.ts` — single export used across the app.

## Authentication (Supabase Auth)

- **Methods used:** Email + OTP (passwordless).
- **Flows:** Sign-in, sign-out, OTP verify; session handling via `AuthContext` and `AuthService`.
- **Callback:** `AuthCallback` page handles OAuth/OTP redirects.

## Database Access

All DB access is through Supabase client (Postgres over HTTP):

- **Tables:** `users`, `anonymous_users`, `leagues`, `league_players`, `tournaments`, `tournament_players`, `matches`.
- **Operations:** CRUD via `.from('table')`, `.select()`, `.insert()`, `.update()`, `.upsert()`, `.delete()`.
- **RLS:** Row Level Security enforced in Postgres; app uses publishable key and optional user JWT.

## Service Layer

- **`DatabaseService`** — league, tournament, match, player, ELO operations.
- **`AuthService`** — Supabase Auth wrappers.
- **`LocalUserService`** — local/profile handling.
- **`AnonymousUserService`** — anonymous users and device fingerprint.
- **`IdentityMergeService`** — merge anonymous → authenticated user.
- **`MigrationService`** — DB migrations / schema updates.

## Realtime (Optional)

Supabase Realtime can be used for live updates (e.g. display view). Config and usage depend on feature flags and app code.

## Local Fallback

When Supabase is unavailable, the app falls back to **localStorage** for leagues, tournaments, matches, and players. Sync logic lives in services and `LeagueContext`.

## Error Handling

- Supabase client errors surface as thrown exceptions or promise rejections.
- UI uses `react-hot-toast` for user feedback; services may log or rethrow.

## Summary

| Layer        | Technology        | Notes                                  |
|-------------|-------------------|----------------------------------------|
| Auth        | Supabase Auth     | Email + OTP                            |
| Database    | Supabase Postgres | RLS, types in `src/types/supabase.ts`  |
| Offline     | localStorage      | Fallback when Supabase unavailable     |
| HTTP client | Supabase JS       | Single client from `src/lib/supabase`  |

---

_Generated using BMAD Method `document-project` workflow_
