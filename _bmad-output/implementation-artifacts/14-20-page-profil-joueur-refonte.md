# Story 14.20: Player profile page (overhaul)

Status: done

## Story

As a user,
I want the Player profile page aligned with the design system,
So that avatar, StatCards, streak and sections are consistent.

## Acceptance Criteria

1. Header: name + back
2. Avatar + info
3. StatCards (ELO, W/L, Win rate)
4. Streak card
5. Sections: ELO evolution, Stats per league, Head-to-head, Recent matches
6. Bottom nav visible
7. The page matches designs Frame 11

## Tasks / Subtasks

- [x] Task 1: Integrate StatCard, ListRow (AC: 3, 5)
- [x] Task 2: Avatar and streak card (AC: 2, 4)
- [x] Task 3: Header and layout (AC: 1, 6)
- [x] Task 4: Frame 11 alignment (AC: 7)

## Dev Notes

- **File:** `src/pages/PlayerProfile.tsx`
- design-system-convergence section 5.4

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#5.4]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Task 1: Replaced custom stats divs with StatCard (ELO accent, W/L, Win rate success). Integrated ListRow for Head-to-head opponents (clickable to navigate to opponent profile).
- Task 2: Added avatar section with initials (getInitials), player name, league name. Streak card kept with design tokens (bg-green-500/20, bg-red-500/20, border).
- Task 3: ContextualHeader with name + back. Content area uses pb-bottom-nav lg:pb-bottom-nav-lg for bottom nav clearance.
- Task 4: Applied design tokens (bg-slate-900, bg-slate-800, border-slate-700/50, rounded-xl), section titles text-lg font-bold, consistent spacing.
- Code review (2026-02-13): 6 fixes — removed dead edit modal, ListRow elo→matches, test assertion, error logging, getInitials util, streak=0 neutral state.
- Code review 2026-02-13 (adversarial): MatchEnrichedDisplay added to Recent matches for consistency with TournamentDashboard/LeagueDashboard.

### Senior Developer Review (AI)

- **Reviewer:** floppyflax (AI) — 2026-02-13
- **Outcome:** Approved (fixes applied)
- **Findings:** 1 CRITICAL, 3 HIGH, 2 MEDIUM, 1 LOW. All CRITICAL and HIGH fixed automatically.

### File List

- src/pages/PlayerProfile.tsx (modified)
- src/components/design-system/ListRow.tsx (modified — getInitials from @/utils/string)
- src/utils/string.ts (new — getInitials shared util)
- tests/unit/pages/PlayerProfile.test.tsx (new)
- tests/unit/utils/string.test.ts (new — getInitials unit tests)

## Change Log

- 2026-02-13: Story 14-20 implementation — PlayerProfile refonte design system (StatCard, ListRow, avatar, streak, pb-bottom-nav)
- 2026-02-13: Code review — 6 fixes (dead edit modal removed, ListRow elo→matches, test assertion, error logging, getInitials util, streak=0 neutral state)
