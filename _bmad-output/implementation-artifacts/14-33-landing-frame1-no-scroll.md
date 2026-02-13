# Story 14.33: Landing page Frame 1 — fit écran, sans header ni menu

Status: done

## Story

As a user,
I want the Landing page to match Frame 1 (PongELO) and fit entirely on one phone screen,
So that onboarding is clear and I can act without scrolling.

## Acceptance Criteria

1. **Given** I am on the Landing (logged out)
   **When** the page loads
   **Then** no header is displayed
   **And** no bottom navigation is displayed

2. **Given** the Frame 1 design (PongELO)
   **When** I am on the Landing
   **Then** the page matches the reference layout and styling

3. **Given** a phone viewport (~667px height)
   **When** I am on the Landing
   **Then** all content fits on one screen without scrolling

## Tasks / Subtasks

- [x] Task 1: Remove header and bottom nav on Landing
- [x] Task 2: Align layout with Frame 1 (branding, cards, CTAs)
- [x] Task 3: Compact layout for no-scroll fit on mobile

## Dev Notes

- **File:** `src/pages/LandingPage.tsx`
- **App routing:** `src/App.tsx` — ensure `isLandingPage` bypasses both header and ResponsiveLayout (bottom nav)
- Landing = unidentified visitor (design-system 2.1 exclusions)

### Frame 1 (PongELO) reference

- **Hero:** Circular icon (trophy + star), "PongELO" in yellow, tagline "Ton classement ELO entre amis"
- **Participer card:** Icon, title, description "Rejoins un tournoi en cours", CTA gradient blue→violet
- **Organiser card:** Icon, title, description "Crée tes propres compétitions", 2 stacked buttons (orange tournoi, green league)
- **Footer:** "Déjà membre ? Se connecter" (link style)

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#2.1]
- [Reference: assets/Capture Frame 1 PongELO]

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- Task 1: Header and bottom nav already excluded on Landing (App.tsx showHeader=false when isLandingPage, BottomTabMenu requires hasIdentity). Added test: no header/nav elements in LandingPage.
- Task 2: Frame 1 layout — Hero (PongELO, trophy + star icon, tagline), Participer card (LayoutGrid icon, "Rejoins un tournoi en cours", CTA gradient-cta-alt), Organiser card (Crown icon, "Crée tes propres compétitions", orange tournoi + green league buttons), footer link "Déjà membre ? Se connecter".
- Task 3: h-screen overflow-hidden, responsive spacing (space-y-3 sm:space-y-4, py-3 sm:py-4), min-h-[568px] max-h-[932px], min-h-0 for flex shrink on small viewports.

### File List

- src/pages/LandingPage.tsx (refactored Frame 1)
- tests/unit/pages/LandingPage.test.tsx (updated)
- tests/integration/LandingPage.integration.test.tsx (updated)

## Change Log

- 2026-02-13: Refonte Landing Frame 1 (14-33). PongELO, cartes Participer/Organiser, fit écran sans scroll, pas de header ni menu.
