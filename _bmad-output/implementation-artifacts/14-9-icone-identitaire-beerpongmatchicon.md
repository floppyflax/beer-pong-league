# Story 14.9: Identity icon BeerPongMatchIcon

Status: done

## Story

As a user,
I want the "New match" button to display an icon with a beer pong cup and ping-pong ball,
So that the app has a stronger visual identity and I immediately recognize the action.

## Acceptance Criteria

1. **Given** the tournament or league dashboard
   **When** I view the "New match" button
   **Then** the button displays an icon showing a beer pong cup with a ping-pong ball

2. The icon is used for the "New match" action on both dashboards

3. The icon scales correctly (20–24px)

## Tasks / Subtasks

- [x] Task 1: Create BeerPongMatchIcon.tsx (AC: 1, 3)
- [x] Task 2: Integrate in LeagueDashboard and TournamentDashboard (AC: 2)

## Dev Notes

- **File:** `src/components/icons/BeerPongMatchIcon.tsx`
- **Source:** design-system-convergence.md section 2.3
- Implemented: cup (trapezoid) + ball (circle)
- Props: size, className, ballColor, cupColor (currentColor by default)

### Implementation Summary

- SVG component created with cup shape (trapezoid path) and ball (circle)
- Integrated in ContextualHeader actions for "NEW MATCH" on LeagueDashboard and TournamentDashboard
- Replaces previous Zap icon (lucide-react)

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#2.3]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Story completed before Epic 14 batch creation — icon already in production

### File List

- src/components/icons/BeerPongMatchIcon.tsx (created)
- src/pages/LeagueDashboard.tsx (modified)
- src/pages/TournamentDashboard.tsx (modified)
