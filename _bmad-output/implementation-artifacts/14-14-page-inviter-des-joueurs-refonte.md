# Story 14.14: Invite players page (overhaul)

Status: done

## Story

As a user,
I want the Invite page aligned with the design system,
So that QR code, link and sharing are consistent.

## Acceptance Criteria

1. Header: title + back
2. Tournament recap card
3. QR code (large, readable)
4. Link + Copy / Share
5. "How does it work?" block
6. Bottom nav visible
7. The page matches designs Frame 5

## Tasks / Subtasks

- [x] Task 1: Layout and components (AC: 1, 2, 6)
- [x] Task 2: QR code and sharing (AC: 3, 4)
- [x] Task 3: Help block (AC: 5)
- [x] Task 4: Frame 5 alignment (AC: 7)

## Dev Notes

- **Source:** design-system-convergence.md section 5.5
- Tournament invitation page (from TournamentDashboard)
- Existing QRCodeDisplay

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#5.5]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Task 1: Header (ContextualHeader) + TournamentCard for tournament recap + navigationHelpers updated so bottom nav visible on /tournament/:id/invite and /tournament/:id/join
- Task 2: QR code 220px mobile / 300px desktop, link + Copy/Share buttons with design tokens
- Task 3: "Comment ça marche ?" block with HelpCard (variante aide/tuto)
- Task 4: Page aligned with design-system-convergence 5.5 (bg-slate-900, rounded-xl, border-slate-700/50)

### File List

- src/pages/TournamentInvite.tsx (refactored)
- src/components/design-system/HelpCard.tsx (new)
- src/components/design-system/index.ts (export HelpCard)
- src/pages/DesignSystemShowcase.tsx (HelpCard section)
- src/utils/navigationHelpers.ts (added invite/join patterns)
- tests/unit/pages/TournamentInvite.test.tsx (new)
- tests/unit/components/design-system/HelpCard.test.tsx (new)
- tests/unit/utils/navigationHelpers.test.ts (updated)

## Senior Developer Review (AI)

**Date:** 2026-02-13  
**Outcome:** Changes Requested → Fixed

**Issues addressed:**
- [x] File List completed (HelpCard, index, DesignSystemShowcase, HelpCard.test)
- [x] Completion Notes and Change Log updated (TournamentCard + HelpCard)
- [x] aria-labels added to Copy/Share buttons
- [x] HelpCard: key with index, role="region"
- [x] Tests: handleShare fallback, clipboard failure, cleanup after clipboard mock

## Change Log

- 2026-02-13: Refonte page Inviter des joueurs (design-system 5.5). TournamentCard, HelpCard, QR code agrandi, bottom nav visible sur invite/join.
- 2026-02-13: Code review – 5 issues corrigés (File List, doc, accessibilité, tests).
