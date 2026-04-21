---
name: supabase-migrations
description: Create or review Supabase SQL migrations for this project. Use when adding tables/columns, writing RLS policies, indexes, or DB functions. Trigger on requests touching supabase/migrations/* or schema changes.
---

# Supabase migrations — Beer Pong League

## Conventions projet

- **Naming fichiers**: `NNN_short_description.sql` (001_initial_schema.sql, 002_add_anti_cheat.sql, ...). Incrémenter à partir du dernier fichier dans `supabase/migrations/`.
- **Casse**: tout en `snake_case` (tables, colonnes, fonctions, indexes).
- **PKs**: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
- **Timestamps**: `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ` avec trigger si mutable.
- **FKs**: `ON DELETE CASCADE` ou `SET NULL` selon l'intention — jamais implicite.
- **Creator pattern**: `creator_user_id UUID REFERENCES users(id)` + `creator_anonymous_user_id UUID REFERENCES anonymous_users(id)` avec CHECK XOR.

## Tables existantes (ne pas dupliquer)

`users`, `anonymous_users`, `leagues`, `league_players`, `tournaments`, `tournament_players`, `matches`, `elo_history`, `user_identity_merges`.

Avant de créer une colonne, vérifier `supabase/migrations/00*.sql` qu'elle n'existe pas déjà.

## RLS — toujours activer

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
```

Patterns typiques :
- **Lecture publique** pour leagues/tournaments : `USING (true)`
- **Écriture par créateur** : `USING (auth.uid() = creator_user_id OR creator_anonymous_user_id IN (SELECT id FROM anonymous_users WHERE ...))`
- **Service role bypass** : RLS est auto-bypassé avec `service_role` key (edge functions).

Tester RLS avec `SET ROLE authenticated; SET request.jwt.claim.sub = '<uuid>';`.

## Indexes — règles

- Index sur toute FK utilisée en filtre.
- Index partiel (`WHERE ...`) pour flags rares (ex. `WHERE status = 'pending'`).
- Index descendant sur `elo DESC`, `created_at DESC` (queries ordonnées).
- Ne pas indexer si table < 1000 lignes probables.

## Checklist avant de livrer une migration

1. [ ] Nom de fichier avec numéro suivant
2. [ ] `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` pour idempotence
3. [ ] RLS activé + policies définies
4. [ ] Indexes sur FKs et colonnes filtrées
5. [ ] Types générés à regénérer : `npm run supabase:types` (si script existe)
6. [ ] Rollback mental : la migration peut-elle être appliquée sur prod sans downtime ?
7. [ ] Aucun `DROP` sans accord utilisateur explicite
