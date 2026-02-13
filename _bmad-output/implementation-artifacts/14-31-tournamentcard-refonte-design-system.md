# Story 14.31: TournamentCard refonte (design system 4.8)

Status: done

## Story

As a developer,
I want TournamentCard aligned with design-system-convergence section 4.8,
So that the card matches Frame 3 (gradient, structure, stats colonnes).

## Acceptance Criteria

1. **Given** design-system-convergence.md section 4.8
   **When** I view a tournament card
   **Then** background: `bg-gradient-card`

2. Header: [Titre gras blanc] [Badge ACTIF / TERMINÉ]

3. Milieu: Date du tournoi seule

4. Bas: 3 colonnes (Matchs, Joueurs, Format) + chevron décoratif. Format en bleu.

5. Container: `rounded-xl p-6 border border-slate-700/50`

6. Clic ou Enter/Space navigue vers `/tournament/:id` (keyboard accessible)

7. Prop `interactive` (optionnelle) : si false, carte en lecture seule (TournamentJoin display)

## Tasks / Subtasks

- [x] Task 1: Apply gradient and structure (AC: 1, 5)
  - [x] Replace bg-slate-800 with bg-gradient-card
  - [x] Add border-slate-700/50
- [x] Task 2: Header (AC: 2)
  - [x] Titre + Badge ACTIF (green) / TERMINÉ (grey)
- [x] Task 3: Body layout (AC: 3, 4)
  - [x] Date seule, puis 3 colonnes Matchs/Joueurs/Format + chevron
- [x] Task 4: Navigation et accessibilité (AC: 6)
  - [x] Clic + Enter/Space, role=button, tabIndex=0
- [x] Task 5: Mode display (AC: 7)
  - [x] Prop interactive=false pour TournamentJoin

## Dev Notes

- **Source:** design-system-convergence.md section 4.8
- **File:** `src/components/tournaments/TournamentCard.tsx`
- Badge actif: `bg-green-500/20 text-green-400` — "ACTIF"
- Badge terminé: `bg-slate-700 text-slate-300` — "TERMINÉ"
- Depends on Story 14-29 (gradient-card)

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#4.8]

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Senior Developer Review (AI)

- **Date:** 2026-02-13
- **Outcome:** Approve (after fixes)
- **Issues fixed:** 6 (1 CRITICAL, 2 HIGH, 3 MEDIUM)
- **Action items:** ACs alignés implémentation, File List tailwind.config.js, prop interactive documentée, accessibilité clavier, tests robustes (data-testid), test format Libre

### Completion Notes List

- TournamentCard aligned with design-system-convergence section 4.8
- Container: bg-gradient-card, rounded-xl p-6, border border-slate-700/50
- Header: title + badge ACTIF/TERMINÉ
- Body: date + 3 colonnes (Matchs, Joueurs, Format) + chevron décoratif
- Prop interactive pour mode display (TournamentJoin)
- Accessibilité clavier: role=button, tabIndex=0, Enter/Space
- Code review fixes: data-testid, test format Libre, tests robustes

### File List

- src/components/tournaments/TournamentCard.tsx
- tests/unit/components/tournaments/TournamentCard.test.tsx
- tailwind.config.js

## Change Log

- 2026-02-13: TournamentCard refonte design-system 4.8 — gradient-card, stats colonnes, chevron, prop interactive
- 2026-02-13: Code review — ACs alignés implémentation, accessibilité clavier, File List tailwind.config.js
