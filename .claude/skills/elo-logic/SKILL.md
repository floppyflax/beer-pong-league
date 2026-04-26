---
name: elo-logic
description: ELO rating calculations, match confirmation, and anti-cheat rules. Use when modifying scoring, match creation, ELO distribution, or confirmation flow. Trigger on changes to src/utils/elo.ts, match services, or ranking-related code.
---

# ELO logic — Beer Pong League

## Formule canonique

```
expected(Ra, Rb) = 1 / (1 + 10^((Rb - Ra) / 400))
delta = K * (actual - expected)    // actual = 1 pour win, 0 pour loss
```

Fichier source : `src/utils/elo.ts`. **Ne pas dupliquer** — importer depuis là.

## K-factor

- `K = 32` si `matches_played < 20` (nouveau joueur, variations rapides)
- `K = 16` sinon (joueur confirmé, variations lentes)

Ne pas inventer un K intermédiaire sans discussion produit.

## Team matches (2v2, 3v3)

1. ELO moyen de chaque team = moyenne simple des ELOs des joueurs.
2. Delta calculé sur les moyennes team A vs team B.
3. **Chaque joueur** de la team gagnante reçoit `+delta`, chaque joueur de la perdante `-delta`. Distribution identique, pas pondérée.

## Anti-cheat / confirmation

Table `matches` a : `status` (`pending` | `confirmed` | `rejected`), `confirmed_by_user_id` / `confirmed_by_anonymous_user_id`, `confirmed_at`.

Flag `anti_cheat_enabled` sur `leagues` et `tournaments`.

Règles :
- Si `anti_cheat_enabled = true` : match créé en `pending`, ELO **pas appliqué** tant que non `confirmed` par un joueur de la team adverse.
- Si `anti_cheat_enabled = false` : match direct `confirmed`, ELO appliqué immédiatement.
- `rejected` : pas d'ELO, match archivé pour audit.

L'ELO ne doit **jamais** être calculé côté client pour un match ranked confirmé — seulement côté serveur (edge function ou trigger SQL) pour éviter la manipulation.

## Granularité ELO — toujours locale au contexte

**L'ELO n'est jamais agrégé globalement.** Trois niveaux :

1. **Event ELO** — par event, stocké dans `tournament_memberships.elo` (mig 023). Mis à jour par chaque match de l'event. Inheritance : un player déjà membre de la ligue rattachée hérite de son ELO ligue ; sinon démarre à 1000.
2. **League ELO** — `league_memberships.elo`. Mis à jour par les matchs de league hors event ET, conditionnellement, par les matchs des events rattachés (toggle `tournaments.propagates_to_league_elo`, default TRUE).
3. **Stats lifetime** — agrégat `totalMatches` / `winRate` / `bestStreak`, calculé à la volée depuis `elo_history` **dédupliqué par `match_id`**. **Pas d'ELO moyen agrégé** : un ELO de cluster A et un ELO de cluster B ne sont pas comparables (graphe d'adversaires déconnecté).

Conséquence : ne **jamais** ajouter une colonne `users.elo` ou un champ `globalElo` quelque part. Les leaderboards cross-context (page `/leaderboard`) trient par activité (matchs / wins / win rate), pas par ELO.

## Calcul des deltas event vs league

Quand un match d'event est enregistré et que l'event propage vers la ligue, **deux deltas sont calculés indépendamment** :
- Event delta : utilise `tournament_memberships.elo` comme baseline.
- League delta : utilise `league_memberships.elo` comme baseline (peut différer du event ELO).

Les deux deltas s'appliquent à leur contexte respectif. Ce n'est PAS le même nombre dupliqué : si Florian a ELO 1200 dans l'event et 1500 dans la ligue, ses deltas sont calculés avec des expected scores différents et donnent des changes différents.

## Historique

Chaque match confirmé écrit dans `elo_history` : `match_id`, `tournament_id?`, `league_id?`, `player_id`, `elo_before`, `elo_after`, `elo_change`. Une ligne **par contexte** par joueur :
- Match d'event autonome : 1 ligne avec `tournament_id` set, `league_id` NULL.
- Match d'event lié sans propagation : 1 ligne avec `tournament_id` set, `league_id` NULL.
- Match d'event lié avec propagation : 2 lignes — une `tournament_id` only, une `league_id` only.
- Match de ligue hors event : 1 ligne avec `league_id` set, `tournament_id` NULL.

Immutable après écriture. Les agrégateurs lifetime (cf. `useHomeData`) doivent dédupliquer par `match_id`.

## Tests à lancer après modif

```bash
npm run test -- tests/unit/utils/elo.test.ts
```

Si la formule ou K change : **mettre à jour les fixtures** et documenter le changement dans `docs/architecture.md` (section ELO).
