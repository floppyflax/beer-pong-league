# Story 14.9: Icône identitaire BeerPongMatchIcon

Status: done

## Story

As a user,
I want the "Nouveau match" button to display an icon with a beer pong cup and ping-pong ball,
So that the app has a stronger visual identity and I immediately recognize the action.

## Acceptance Criteria

1. **Given** the dashboard tournoi or league
   **When** I view the "Nouveau match" button
   **Then** the button displays an icon showing a beer pong cup with a ping-pong ball

2. The icon is used for the action "Nouveau match" on both dashboards

3. The icon scales correctly (20–24px)

## Tasks / Subtasks

- [x] Task 1: Créer BeerPongMatchIcon.tsx (AC: 1, 3)
- [x] Task 2: Intégrer dans LeagueDashboard et TournamentDashboard (AC: 2)

## Dev Notes

- **Fichier:** `src/components/icons/BeerPongMatchIcon.tsx`
- **Source:** design-system-convergence.md section 2.3
- Implémenté : gobelet (trapèze) + balle (cercle)
- Props : size, className, ballColor, cupColor (currentColor par défaut)

### Implementation Summary

- Composant SVG créé avec forme gobelet (path trapèze) et balle (circle)
- Intégré dans ContextualHeader actions pour "NOUVEAU MATCH" sur LeagueDashboard et TournamentDashboard
- Remplace l'icône Zap (lucide-react) précédente

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#2.3]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Story complétée avant création du batch Epic 14 — icône déjà en production

### File List

- src/components/icons/BeerPongMatchIcon.tsx (créé)
- src/pages/LeagueDashboard.tsx (modifié)
- src/pages/TournamentDashboard.tsx (modifié)
