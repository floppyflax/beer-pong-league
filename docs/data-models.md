# Beer Pong League - Data Models

**Date:** 2026-01-22  
**Source:** `supabase/migrations/` (PostgreSQL + Supabase Auth)

## Overview

Schema supports leagues, tournaments, matches, ELO, and dual identity (authenticated users + anonymous users with optional merge).

## Tables

### `public.users`

Extends `auth.users`. Profile for signed-in users.

| Column      | Type      | Description                    |
|-------------|-----------|--------------------------------|
| id          | UUID (PK) | References `auth.users(id)`    |
| pseudo      | TEXT      | Display name                   |
| avatar_url  | TEXT      | Optional avatar                |
| created_at  | TIMESTAMPTZ | Default NOW()                |
| updated_at  | TIMESTAMPTZ | Default NOW()                |

### `public.anonymous_users`

Players without an account (device-bound).

| Column             | Type      | Description                          |
|--------------------|-----------|--------------------------------------|
| id                 | UUID (PK) | gen_random_uuid()                    |
| pseudo             | TEXT      | Display name                         |
| device_fingerprint | TEXT      | Device identifier                    |
| created_at         | TIMESTAMPTZ | Default NOW()                      |
| merged_to_user_id  | UUID (FK) | Set when merged to `users`           |
| merged_at          | TIMESTAMPTZ | When merge happened                |

### `public.leagues`

Leagues (event or season).

| Column                    | Type      | Description                    |
|---------------------------|-----------|--------------------------------|
| id                        | UUID (PK) | gen_random_uuid()              |
| name                      | TEXT      | League name                    |
| type                      | TEXT      | `'event'` \| `'season'`        |
| creator_user_id           | UUID (FK) | Optional, refs `users`         |
| creator_anonymous_user_id | UUID (FK) | Optional, refs `anonymous_users` |
| created_at, updated_at    | TIMESTAMPTZ |                            |
| anti_cheat_enabled        | BOOLEAN   | Default FALSE (from 002)       |

Exactly one of `creator_user_id` or `creator_anonymous_user_id` must be set.

### `public.league_players`

Players in a league, with ELO stats.

| Column             | Type      | Description                    |
|--------------------|-----------|--------------------------------|
| id                 | UUID (PK) |                                |
| league_id          | UUID (FK) | → `leagues`                    |
| user_id            | UUID (FK) | → `users` (optional)           |
| anonymous_user_id  | UUID (FK) | → `anonymous_users` (optional) |
| pseudo_in_league   | TEXT      |                                |
| elo                | INTEGER   | Default 1000                   |
| wins, losses       | INTEGER   | Default 0                      |
| matches_played     | INTEGER   | Default 0                      |
| streak             | INTEGER   | Default 0                      |
| joined_at          | TIMESTAMPTZ |                            |

One of `user_id` or `anonymous_user_id` per row. Unique per (league, user) or (league, anonymous_user).

### `public.tournaments`

Tournaments, optionally linked to a league.

| Column                    | Type      | Description                    |
|---------------------------|-----------|--------------------------------|
| id                        | UUID (PK) |                                |
| league_id                 | UUID (FK) | → `leagues` (optional)         |
| name                      | TEXT      |                                |
| date                      | DATE      |                                |
| creator_user_id           | UUID (FK) | optional                       |
| creator_anonymous_user_id | UUID (FK) | optional                       |
| is_finished               | BOOLEAN   | Default FALSE                  |
| created_at, updated_at    | TIMESTAMPTZ |                            |
| anti_cheat_enabled        | BOOLEAN   | Default FALSE                  |

### `public.tournament_players`

Players in a tournament.

| Column             | Type      | Description                    |
|--------------------|-----------|--------------------------------|
| id                 | UUID (PK) |                                |
| tournament_id      | UUID (FK) | → `tournaments`                |
| user_id            | UUID (FK) | optional                       |
| anonymous_user_id  | UUID (FK) | optional                       |
| pseudo_in_tournament | TEXT    |                                |
| joined_at          | TIMESTAMPTZ |                            |

### `public.matches`

Matches (tournament and/or league), with optional confirmation for anti-cheat.

| Column                      | Type      | Description                    |
|-----------------------------|-----------|--------------------------------|
| id                          | UUID (PK) |                                |
| tournament_id               | UUID (FK) | optional                       |
| league_id                   | UUID (FK) | optional                       |
| format                      | TEXT      | `'1v1'` \| `'2v2'` \| `'3v3'` |
| team_a_player_ids           | UUID[]    |                                |
| team_b_player_ids           | UUID[]    |                                |
| score_a, score_b            | INTEGER   |                                |
| is_ranked                   | BOOLEAN   | Default TRUE                   |
| created_at                  | TIMESTAMPTZ |                            |
| created_by_user_id          | UUID (FK) | optional                       |
| created_by_anonymous_user_id| UUID (FK) | optional                       |
| status                      | TEXT      | `'pending'` \| `'confirmed'` \| `'rejected'` (default `'confirmed'`) |
| confirmed_by_*              | UUID (FK) | optional                       |
| confirmed_at                | TIMESTAMPTZ | optional                     |

At least one of `tournament_id` or `league_id`. Migration `002_add_anti_cheat` adds status and confirmation fields.

## Relationships

- **users** ← league/tournament creators, league_players, tournament_players, match creators and confirmers
- **anonymous_users** — same roles, with merge support into `users`
- **leagues** → league_players, tournaments (optional), matches
- **tournaments** → tournament_players, matches

## Migrations

- `001_initial_schema.sql` — tables, RLS, triggers, indexes
- `002_add_anti_cheat.sql` — `anti_cheat_enabled` on leagues/tournaments; match `status` and confirmation fields; indexes for pending matches and anti-cheat

## TypeScript Types

Generated Supabase types live in `src/types/supabase.ts`. Shared app types in `src/types.ts`.

---

_Generated using BMAD Method `document-project` workflow_
