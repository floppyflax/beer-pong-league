# Story 14.4: Composant ListRow

Status: review

## Story

As a developer,
I want un composant ListRow réutilisable,
So que les lignes de liste (joueur, tournoi, league) soient cohérentes.

## Acceptance Criteria

1. **Given** le design system (section 4.3)
   **When** j'utilise ListRow (joueur)
   **Then** avatar circulaire ou placeholder initiales
   **And** rang en pastille (1, 2, 3 avec or/argent/bronze)
   **And** nom + sous-texte (W/L, winrate)
   **And** ELO à droite + delta (vert/rouge)
   **And** chevron ou flèche droite

2. **When** j'utilise ListRow (carte tournoi/league)
   **Then** nom, date, statut (badge)
   **And** métriques : Matchs, Joueurs, Format
   **And** chevron droite

3. Le composant supporte variants et est cliquable

## Tasks / Subtasks

- [x] Task 1: Créer ListRow (variant player) (AC: 1)
  - [x] Avatar/initiales
  - [x] Rang pastille (or/argent/bronze pour 1,2,3)
  - [x] Nom + sous-texte
  - [x] ELO + delta
  - [x] Chevron
- [x] Task 2: ListRow (variant tournament/league) (AC: 2)
  - [x] Nom, date, badge statut
  - [x] Métriques
  - [x] Chevron
- [x] Task 3: Props et cliquabilité (AC: 3)
  - [x] onClick, variant
  - [x] Export et tests
- [x] Task 4: Design System showcase (Story 14-1b)
  - [x] Ajouter section ListRow dans DesignSystemShowcase (variants player, tournament, league)

## Dev Notes

- **Source:** design-system-convergence.md section 4.3
- **Fichier:** `src/components/design-system/ListRow.tsx`
- Props selon variant: player (avatar, rank, name, subtitle, elo, delta), tournament/league (name, date, status, metrics)
- Référence: screens Frame 3 (Mes tournois), Frame 7 (Mes leagues)

### Project Structure Notes

- `src/components/design-system/ListRow.tsx`
- Props union: ListRowPlayerProps | ListRowTournamentProps | ListRowLeagueProps

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#4.3]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Implémentation ListRow avec variants player, tournament, league (design-system-convergence.md 4.3)
- Props union typées : ListRowPlayerProps | ListRowTournamentProps | ListRowLeagueProps
- Variant player : avatar/initiales, rang pastille (or/argent/bronze), nom, subtitle, ELO, delta (vert/rouge), chevron
- Variant tournament/league : nom, date, badge statut, métriques (matchs, joueurs, format), chevron
- onClick optionnel pour cliquabilité
- 14 tests unitaires, section DesignSystemShowcase

### File List

- src/components/design-system/ListRow.tsx (new)
- src/components/design-system/index.ts (modified)
- src/pages/DesignSystemShowcase.tsx (modified)
- tests/unit/components/design-system/ListRow.test.tsx (new)
- tests/unit/pages/DesignSystemShowcase.test.tsx (modified)

## Change Log

- 2026-02-13: Story 14-4 implémentée — composant ListRow avec variants player, tournament, league
