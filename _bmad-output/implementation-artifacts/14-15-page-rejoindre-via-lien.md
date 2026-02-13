# Story 14.15: Join page (via link)

Status: done

## Story

As a user,
I want the Join (link) page aligned with the design system,
So that the flow is consistent with the designs.

## Acceptance Criteria

1. **Given** the design system
   **When** I join via link
   **Then** the page is aligned with Frame 6
2. Bottom nav visible if relevant

## Tasks / Subtasks

- [x] Task 1: Identify Join via link page/flow
- [x] Task 2: Apply design system
- [x] Task 3: Frame 6 alignment

## Dev Notes

- Join flow via link (vs QR scan)
- Frame 6: reference design

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md]

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- TournamentJoin (`/tournament/:id/join`) identified as "Rejoindre via lien" page
- Applied design system: bg-slate-900, InfoCard, bg-gradient-card, gradient CTA buttons (from-blue-500 to-violet-600)
- Added "Comment ça marche ?" block (Frame 6 alignment)
- Bottom nav already visible via CORE_ROUTE_PATTERNS (navigationHelpers)
- Content padding pb-20 for bottom nav clearance
- Tests updated and 3 new tests added for Story 14-15

### File List

- src/pages/TournamentJoin.tsx
- src/pages/TournamentDashboard.tsx (fix: join URL in QR codes)
- src/components/QRCodeDisplay.tsx (fix: join URL)
- tests/unit/pages/TournamentJoin.test.tsx

### Senior Developer Review (AI)

**Reviewer:** floppyflax  
**Date:** 2026-02-13

**Issues fixed:**
1. **CRITICAL** TournamentDashboard + QRCodeDisplay: Wrong join URL (`/tournament/join/:id` → `/tournament/:id/join`)
2. **CRITICAL** Added test for "join as existing player" flow
3. **MEDIUM** TournamentJoin: Use `getContentPaddingBottom` instead of hardcoded padding
4. **MEDIUM** Test describe block: Renamed from "Story 4.1" to "Story 4.1 + 14-15"
