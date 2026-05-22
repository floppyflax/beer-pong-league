---
name: elo-logic
description: ELO rating calculations, match confirmation, and anti-cheat rules. Use when modifying scoring, match creation, ELO distribution, or confirmation flow. Trigger on changes to src/utils/elo.ts, MatchesRepository, EloRecalcService, the apply_match_elo / recalculate_league_elo RPCs, or ranking-related code.
---

# ELO logic — Beer Pong League

## Server-side calc since mig 025 (audit wave 2.1)

ELO is **computed by the database**, not the client. Two `SECURITY DEFINER`
RPCs in `supabase/migrations/025_elo_server_side.sql` own every write to
`elo_history` / `*_memberships.elo`:

- **`apply_match_elo(p_match_id UUID)`** — recomputes the deltas from the
  match scores and team-average ELOs, writes the history row(s) and
  updates membership stats. Idempotent (anti-replay), refuses non-ranked
  matches, refuses pending matches when anti-cheat is enabled.
- **`recalculate_league_elo(p_league_id UUID)`** — admin recovery: wipes
  the league's `elo_history` + resets memberships, then replays every
  ranked match in chrono order via `apply_match_elo`. Returns count.

**Client never writes elo_history / memberships stats directly.**
`MatchesRepository.recordMatch` and `recordEventMatch` insert the match
row, then call `supabase.rpc('apply_match_elo', { p_match_id })`.
`EloRecalcService` is a thin wrapper around `recalculate_league_elo`.

When you touch the formula or the K-factor, update **both**:
- `apps/web/src/utils/elo.ts` (kept for the optimistic preview UI —
  EloChangeDisplay shows the predicted delta before the RPC settles).
- `supabase/migrations/<NNN>_*.sql` — a NEW migration that
  `CREATE OR REPLACE FUNCTION public.apply_match_elo` with the same
  formula. Don't edit mig 025 in place — write a follow-up migration.

If the two diverge, the client preview will lie about the persisted
result. Add a fixture-based test in `tests/integration/elo-server-side.test.ts`.

## Formule canonique

```
expected(Ra, Rb) = 1 / (1 + 10^((Rb - Ra) / 400))
delta = K * (actual - expected)    // actual = 1 pour win, 0 pour loss
```

Source-of-truth client : `apps/web/src/utils/elo.ts`. **Ne pas dupliquer**
— importer depuis là pour la preview.

Source-of-truth serveur : `public.apply_match_elo` + `_apply_elo_for_player`
dans `025_elo_server_side.sql` ; K-factor contextuel
`public.elo_k_factor(matches_played, context)` dans
`033_elo_context_k_factor.sql`.

## K-factor (contextuel depuis mig 033)

Le K dépend du **contexte** ELO :

- **event** → `K = 64` **fixe**. Events courts (~10-15 matchs/joueur) : le
  palier 20 ne mord jamais, un K élevé étale le classement (show d'un soir).
  Le K est un **facteur d'échelle** — il dilate les écarts sans changer
  l'ordre ni la justesse (les renversements/le spectacle dépendent du format
  et du nombre de matchs, pas du K).
- **league** → `K = 32` si `matches_played < 20`, `K = 16` sinon. Classement
  durable et stable du vrai niveau sur la saison (monter le K en ligue
  n'ajouterait que du bruit).

Helper DB : `public.elo_k_factor(matches_played INT, context TEXT) RETURNS INT`
(`'event'` → 64 ; `'league'` → 32/16), routé par `_apply_elo_for_player` via
`p_event_id` / `p_league_id`. Client : `calculateEloChange(teamA, teamB,
winner, context)`. Ne pas inventer d'autre K sans discussion produit.

## Team matches (2v2, 3v3)

1. ELO moyen de chaque team = moyenne simple des ELOs des joueurs **dans
   le contexte du match** (event_memberships pour un event match,
   league_memberships pour un league match).
2. Delta calculé sur les moyennes team A vs team B.
3. Chaque joueur de la team applique son propre K au même `actual − expected`
   (le `expected` est commun — calculé sur la moyenne d'équipe). En **league**,
   le K dépend du `matches_played` de chaque joueur : un débutant (<20, K=32) et
   un confirmé (K=16) gagnent donc des deltas différents pour le même match. En
   **event**, K=64 pour tous → deltas identiques entre coéquipiers.

## Anti-cheat / confirmation

Table `matches` a : `status` (`pending` | `confirmed` | `rejected`),
`confirmed_by_user_id` (anon ou auth depuis mig 022), `confirmed_at`.

Flag `anti_cheat_enabled` sur `leagues` et `events` (renommé depuis
`tournaments` en mig 024).

Règles enforced dans `apply_match_elo` :
- `is_ranked = false` → refuse (`ERRCODE check_violation`).
- `status = 'rejected'` → refuse.
- `(events.anti_cheat_enabled OR leagues.anti_cheat_enabled) AND
  status <> 'confirmed'` → refuse.
- `score_a = score_b` → refuse (no winner).
- `elo_history` contient déjà des lignes pour ce `match_id` → refuse
  (anti-replay, `ERRCODE unique_violation`).

Quand anti-cheat est OFF (default), `matches.status` = `'confirmed'`
direct, ELO appliqué immédiatement après l'INSERT du match via la RPC.

## Granularité ELO — toujours locale au contexte

**L'ELO n'est jamais agrégé globalement.** Trois niveaux :

1. **Event ELO** — par event, stocké dans `event_memberships.elo` (mig
   023, table renommée en mig 024). Mis à jour par chaque match de
   l'event. Inheritance : un player déjà membre de la ligue rattachée
   hérite de son ELO ligue ; sinon démarre à 1000.
2. **League ELO** — `league_memberships.elo`. Mis à jour par les matchs
   de league hors event ET, conditionnellement, par les matchs des events
   rattachés (toggle `events.propagates_to_league_elo`, default TRUE).
3. **Stats lifetime** — agrégat `totalMatches` / `winRate` / `bestStreak`,
   calculé à la volée depuis `elo_history` **dédupliqué par `match_id`**.
   **Pas d'ELO moyen agrégé** : un ELO de cluster A et un ELO de cluster
   B ne sont pas comparables (graphe d'adversaires déconnecté).

Conséquence : ne **jamais** ajouter une colonne `users.elo` ou un champ
`globalElo` quelque part. Les leaderboards cross-context (page
`/leaderboard`) trient par activité (matchs / wins / win rate), pas par
ELO.

## Calcul des deltas event vs league

Quand un match d'event est enregistré et que l'event propage vers la
ligue, **deux deltas sont calculés indépendamment** par `apply_match_elo`
en parcourant les deux contextes :

- Event delta : utilise `event_memberships.elo` comme baseline.
- League delta : utilise `league_memberships.elo` comme baseline (peut
  différer du event ELO).

Les deux deltas s'appliquent à leur contexte respectif. Ce n'est PAS le
même nombre dupliqué : si Florian a ELO 1200 dans l'event et 1500 dans la
ligue, ses deltas sont calculés avec des expected scores différents et
donnent des changes différents.

## Historique

Chaque match confirmé écrit dans `elo_history` : `match_id`, `event_id?`,
`league_id?`, `player_id`, `elo_before`, `elo_after`, `elo_change`. Une
ligne **par contexte** par joueur :

- Match d'event autonome : 1 ligne avec `event_id` set, `league_id` NULL.
- Match d'event lié sans propagation : 1 ligne avec `event_id` set,
  `league_id` NULL.
- Match d'event lié avec propagation : 2 lignes — une `event_id` only,
  une `league_id` only.
- Match de ligue hors event : 1 ligne avec `league_id` set, `event_id`
  NULL.

Immutable après écriture (le seul nettoyage légitime est via
`recalculate_league_elo` qui DELETE puis replay). Les agrégateurs
lifetime (cf. `useHomeData`) doivent dédupliquer par `match_id`.

## Tests à lancer après modif

```bash
npm run test -- tests/unit/utils/elo.test.ts                 # client preview formula
npm run test -- tests/integration/elo-server-side.test.ts    # RPC contract / no direct stat writes
```

Si la formule ou K change : **mettre à jour les fixtures** + `utils/elo.ts`
+ une nouvelle migration `CREATE OR REPLACE FUNCTION public.apply_match_elo`
+ documenter le changement dans `docs/architecture.md` (section ELO).

## Skills associés

- [`postgres-rpc`](../postgres-rpc/SKILL.md) — pattern d'écriture des RPCs
  `SECURITY DEFINER` (locks, anti-replay, Dashboard SQL Editor workaround).
- [`supabase-migrations`](../supabase-migrations/SKILL.md) — naming +
  RLS pour les migrations.
