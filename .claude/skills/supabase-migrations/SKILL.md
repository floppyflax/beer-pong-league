---
name: supabase-migrations
description: Create or review Supabase SQL migrations for this project. Use when adding tables/columns, writing RLS policies, indexes, or DB functions. Trigger on requests touching supabase/migrations/* or schema changes.
---

# Supabase migrations — Beer Pong League

Companion skills :
- [`postgres-rpc`](../postgres-rpc/SKILL.md) — pour `CREATE FUNCTION`
  `SECURITY DEFINER`, locks, anti-replay, et le **bug du SQL Editor du
  Dashboard**.

## Conventions projet

- **Naming fichiers**: `NNN_short_description.sql` (`001_initial_schema.sql`,
  `025_elo_server_side.sql`, …). Incrémenter à partir du dernier fichier
  dans `supabase/migrations/`. **Numéros immutables** une fois mergés —
  une correction = nouvelle migration, pas édition de l'ancienne.
- **Casse**: tout en `snake_case` (tables, colonnes, fonctions, indexes).
- **PKs**: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
- **Timestamps**: `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at
  TIMESTAMPTZ` avec trigger `update_updated_at_column` si mutable.
- **FKs**: `ON DELETE CASCADE` ou `SET NULL` selon l'intention — jamais
  implicite.
- **Creator pattern (post mig 022)** : `creator_user_id UUID REFERENCES
  users(id)`. Plus de `creator_anonymous_user_id` — la table `users`
  unifiée porte un flag `is_anonymous BOOLEAN`. Idem pour
  `confirmed_by_user_id`, `created_by_user_id`.

## Schéma actuel (post mig 024)

Tables principales :

- `users` — identité unifiée (mig 022). Colonnes clés :
  `id`, `pseudo`, `avatar_url`, `auth_user_id` (FK `auth.users`, NULL si
  anonyme), `is_anonymous`, `device_fingerprint`, `is_premium`.
- `players` — entité de jeu (mig 022). `id`, `pseudo`, `avatar_url`,
  `user_id` (NULL = ghost), `archived_at`.
- `leagues` — `id`, `name`, `type` (`one-shot`/`season`),
  `creator_user_id`, `anti_cheat_enabled`, `join_code`.
- `events` — renommé depuis `tournaments` en mig 024. `id`, `name`,
  `date`, `league_id?`, `is_finished`, `creator_user_id`,
  `anti_cheat_enabled`, `propagates_to_league_elo` (mig 023),
  `format_type`, `team1_size`, `team2_size`, `max_players`,
  `is_private`, `status`, `mode`, `join_code`.
- `league_memberships` — pivot league ↔ player (mig 022). `id`,
  `league_id`, `player_id`, `pseudo_override`, `elo`, `wins`, `losses`,
  `matches_played`, `streak`, `joined_at`, `archived_at`.
- `event_memberships` — pivot event ↔ player. Même schéma que
  `league_memberships` avec `event_id` à la place de `league_id` (mig
  023 pour les colonnes ELO, mig 024 pour le rename).
- `matches` — `id`, `league_id?`, `event_id?`, `format` (`1v1`|`2v2`|`3v3`),
  `team_a_player_ids UUID[]`, `team_b_player_ids UUID[]`, `score_a`,
  `score_b`, `is_ranked`, `status` (`pending`|`confirmed`|`rejected`),
  `confirmed_by_user_id`, `confirmed_at`, `created_by_user_id`,
  `cups_remaining`, `photo_url`, `is_live`, `balloon_possession`,
  `is_match_point`, `created_at`.
- `elo_history` — `id`, `match_id`, `event_id?`, `league_id?`, `player_id`,
  `elo_before`, `elo_after`, `elo_change`, `created_at`.
- `achievements`, `player_achievements` — mig 010.
- `ghost_invite_tokens` — mig 015.

Tables **disparues** depuis mig 022 (n'existent plus) :
`anonymous_users`, `tournaments`, `league_players`, `tournament_players`,
`tournament_memberships`, `user_identity_merges`, `ghost_invite_tokens`
(non, celle-là a survécu).

Avant de créer une colonne, vérifier `supabase/migrations/0NN_*.sql`
qu'elle n'existe pas déjà — ne pas se baser sur l'inventaire ci-dessus
(qui peut dériver), ouvrir les fichiers.

## RLS — toujours activer

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
```

Patterns typiques :
- **Lecture publique** : `USING (true)`.
- **Écriture par créateur** : `USING (auth.uid() = creator_user_id)`. Plus
  besoin de gérer `creator_anonymous_user_id` séparément depuis mig 022 —
  les anonymous users ont aussi un `auth.uid()` virtuel via leur session.
- **Service role bypass** : RLS auto-bypassé avec `service_role` key
  (edge functions).
- **SECURITY DEFINER bypass** : les fonctions définies en `SECURITY
  DEFINER` bypassent aussi RLS — utiliser pour les chemins write
  authoritatifs (cf. `apply_match_elo` dans mig 025). Voir
  [`postgres-rpc`](../postgres-rpc/SKILL.md).

Tester RLS depuis SQL Editor :
```sql
SET ROLE authenticated;
SET request.jwt.claim.sub = '<uuid>';
-- run the query
RESET ROLE; RESET request.jwt.claim.sub;
```

## Indexes — règles

- Index sur toute FK utilisée en filtre.
- Index partiel (`WHERE …`) pour flags rares (ex. `WHERE status = 'pending'`).
- Index descendant sur `elo DESC`, `created_at DESC` (queries ordonnées).
- Ne pas indexer si table < 1000 lignes probables.

## ⚠️ Compatibilité Dashboard SQL Editor

Quand une migration définit des fonctions PL/pgSQL, le Dashboard SQL
Editor a un parser naïf qui peut casser le dollar-quoting. **Avant de
copier-coller dans le Dashboard**, lire la section "Workaround" du skill
[`postgres-rpc`](../postgres-rpc/SKILL.md). En résumé : remplacer tous
les `SELECT col INTO var FROM table WHERE …` par `var := (SELECT col
FROM table WHERE …)`.

L'alternative recommandée est `supabase db push` (CLI) qui évite ce
parser entièrement.

## Checklist avant de livrer une migration

1. [ ] Nom de fichier avec numéro suivant (regarde `ls supabase/migrations/`).
2. [ ] `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` pour idempotence.
3. [ ] RLS activé + policies définies sur toute nouvelle table.
4. [ ] Indexes sur FKs et colonnes filtrées.
5. [ ] Si `CREATE FUNCTION` : skill `postgres-rpc` pour le pattern + Dashboard workaround.
6. [ ] Types regénérés : si `npm run supabase:types` existe, le lancer ; sinon noter dans la PR.
7. [ ] Rollback mental : la migration peut-elle être appliquée sur prod sans downtime ?
8. [ ] Aucun `DROP TABLE` ou `DROP COLUMN` sans accord utilisateur explicite.
9. [ ] `BEGIN; … COMMIT;` pour les migrations complexes (le runner Supabase wrappe déjà, mais explicite si plusieurs `ALTER` interdépendants).
