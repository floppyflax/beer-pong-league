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

## Historique

Chaque match confirmé écrit dans `elo_history` : `match_id`, `player_id`, `elo_before`, `elo_after`, `elo_change`. Immutable après écriture.

## Tests à lancer après modif

```bash
npm run test -- tests/unit/utils/elo.test.ts
```

Si la formule ou K change : **mettre à jour les fixtures** et documenter le changement dans `docs/architecture.md` (section ELO).
