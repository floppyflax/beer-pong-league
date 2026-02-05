# Story 7.8: Tournament Player Limit Enforcement

Status: ready-for-dev

## Story

As a free user,
I want to see the player limit for my tournaments,
so that I understand the restriction and can upgrade if needed.

## Acceptance Criteria

1. **Given** a free user creates a tournament
   **When** they add players to the tournament
   **Then** player count is displayed (e.g., "3/6 joueurs")
   **And** when they try to add a 7th player
   **Then** upgrade modal is shown: "Limite de 6 joueurs atteinte. Passez Premium pour plus !"
   **And** upgrade button is available
   **And** they cannot add more than 6 players
   **And** limit is clearly communicated
   **When** a premium user creates a tournament
   **Then** no player limit is displayed
   **And** they can add unlimited players

## Tasks / Subtasks

- [ ] Task 1: Add player limit check (AC: 1)
  - [ ] Use PremiumService `getTournamentPlayerLimit()` method
  - [ ] Get limit (6 for free, null for premium)
  - [ ] Check limit when adding players
  - [ ] Block addition if limit exceeded
- [ ] Task 2: Display player count with limit (AC: 1)
  - [ ] Show current player count (e.g., "3/6 joueurs")
  - [ ] Show "Illimité" if premium user
  - [ ] Update count dynamically as players are added
  - [ ] Style limit indicator clearly
- [ ] Task 3: Show upgrade prompt when limit reached (AC: 1)
  - [ ] Display message: "Limite de 6 joueurs atteinte. Passez Premium pour plus !"
  - [ ] Show upgrade button
  - [ ] Open PaymentModal on upgrade click
  - [ ] Prevent player addition until premium
- [ ] Task 4: Integrate with tournament player management (AC: 1)
  - [ ] Find where players are added to tournaments
  - [ ] Add limit check before player addition
  - [ ] Update UI to show limit status
  - [ ] Handle premium status refresh after payment

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Player Management:**
- Find tournament player management code (likely in TournamentDashboard or TournamentJoin)
- Check limit before adding player
- Display limit in player list/management UI

**Limit Display Pattern:**
- Show count as "X/6" for free users
- Show "Illimité" or no limit indicator for premium users
- Update count in real-time as players are added/removed

**Upgrade Integration:**
- Show upgrade prompt when limit reached
- Open PaymentModal for upgrade
- Refresh premium status after payment
- Allow player addition after premium activation

### Source Tree Components to Touch

**Files to Modify:**
- Tournament player management component (likely `TournamentDashboard.tsx` or similar)
- Player addition logic

**Files to Reference:**
- `src/services/PremiumService.ts` (Story 7.2) - Get player limit
- `src/components/PaymentModal.tsx` (Story 7.11) - Upgrade modal

### Testing Standards Summary

**Unit Testing:**
- Test limit check with 0-6 players (free user)
- Test limit check with premium user (no limit)
- Test upgrade prompt display
- Test player addition blocking

**Integration Testing:**
- Test complete flow: add 6 players → try 7th → see limit → upgrade → add more
- Test premium user can add unlimited players

### Project Structure Notes

**Alignment with Unified Project Structure:**
- ✅ Follows existing tournament management patterns

### References

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Story-7.8] Story 7.8: Tournament Player Limit Enforcement

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_
