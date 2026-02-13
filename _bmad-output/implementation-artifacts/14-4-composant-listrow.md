# Story 14.4: ListRow component

Status: review

## Story

As a developer,
I want a reusable ListRow component,
So that list rows (player, tournament, league) are consistent.

## Acceptance Criteria

1. **Given** the design system (section 4.3)
   **When** I use ListRow (player)
   **Then** circular avatar or initials placeholder
   **And** rank badge (1, 2, 3 with gold/silver/bronze)
   **And** name + subtitle (W/L, winrate)
   **And** optional 5 circles for last match results (green=win, red=loss)
   **And** ELO on the right + delta (green/red)
   **And** chevron or right arrow
   **And** full width (`w-full`)

2. **When** I use ListRow (tournament/league card)
   **Then** name, date, status (badge)
   **And** metrics: Matches, Players, Format
   **And** right chevron

3. The component supports variants and is clickable

## Tasks / Subtasks

- [x] Task 1: Create ListRow (player variant) (AC: 1)
  - [x] Avatar/initials
  - [x] Rank badge (gold/silver/bronze for 1,2,3)
  - [x] Name + subtitle
  - [x] recentResults: 5 cercles vert/rouge (derniers matchs)
  - [x] ELO + delta
  - [x] Chevron
  - [x] Full width (w-full)
- [x] Task 2: ListRow (tournament/league variant) (AC: 2)
  - [x] Name, date, status badge
  - [x] Metrics
  - [x] Chevron
- [x] Task 3: Props and clickability (AC: 3)
  - [x] onClick, variant
  - [x] Export and tests
- [x] Task 4: Design System showcase (Story 14-1b)
  - [x] Add ListRow section in DesignSystemShowcase (player, tournament, league variants)

## Dev Notes

- **Source:** design-system-convergence.md section 4.3
- **File:** `src/components/design-system/ListRow.tsx`
- Props per variant: player (avatar, rank, name, subtitle, elo, delta, recentResults?), tournament/league (name, date, status, metrics)
- Reference: screens Frame 3 (My tournaments), Frame 7 (My leagues)

### Project Structure Notes

- `src/components/design-system/ListRow.tsx`
- Props union: ListRowPlayerProps | ListRowTournamentProps | ListRowLeagueProps

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#4.3]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- ListRow implementation with player, tournament, league variants (design-system-convergence.md 4.3)
- Typed props union: ListRowPlayerProps | ListRowTournamentProps | ListRowLeagueProps
- Player variant: avatar/initials, rank badge (gold/silver/bronze), name, subtitle, recentResults (5 cercles vert/rouge), ELO, delta (green/red), chevron, full width
- Tournament/league variant: name, date, status badge, metrics (matches, players, format), chevron
- Optional onClick for clickability
- 15 unit tests (incl. recentResults), DesignSystemShowcase section

### File List

- src/components/design-system/ListRow.tsx (new)
- src/components/design-system/index.ts (modified)
- src/pages/DesignSystemShowcase.tsx (modified)
- tests/unit/components/design-system/ListRow.test.tsx (new)
- tests/unit/pages/DesignSystemShowcase.test.tsx (modified)

## Change Log

- 2026-02-13: Story 14-4 implemented — ListRow component with player, tournament, league variants
- 2026-02-13: Ajout recentResults (5 cercles vert/rouge), full width (w-full)
