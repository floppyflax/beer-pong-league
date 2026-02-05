# Story 7.12: Premium Status Context Integration

Status: ready-for-dev

## Story

As a developer,
I want premium status available throughout the app via context,
so that all components can check premium status consistently.

## Acceptance Criteria

1. **Given** the need for premium status access
   **When** I implement premium context
   **Then** `PremiumContext` is created in `src/context/PremiumContext.tsx`
   **And** context provides `isPremium` boolean
   **And** context provides `canCreateTournament` function
   **And** context provides `canCreateLeague` function
   **And** context provides `getTournamentPlayerLimit` function
   **And** context provides `refreshPremiumStatus` function
   **And** context is integrated with PremiumService
   **And** context updates after premium purchase
   **And** context is available to all components via `usePremium` hook

## Tasks / Subtasks

- [ ] Task 1: Create PremiumContext structure (AC: 1)
  - [ ] Create `src/context/PremiumContext.tsx`
  - [ ] Define context type interface
  - [ ] Create context with createContext
  - [ ] Export usePremium hook
- [ ] Task 2: Create PremiumProvider component (AC: 1)
  - [ ] Create PremiumProvider component
  - [ ] Integrate with PremiumService
  - [ ] Manage premium status state
  - [ ] Provide context value
- [ ] Task 3: Implement context methods (AC: 1)
  - [ ] Implement `isPremium` getter
  - [ ] Implement `canCreateTournament` method
  - [ ] Implement `canCreateLeague` method
  - [ ] Implement `getTournamentPlayerLimit` method
  - [ ] Implement `refreshPremiumStatus` method
- [ ] Task 4: Add state management (AC: 1)
  - [ ] Use useState for premium status
  - [ ] Use useEffect to load initial status
  - [ ] Cache status to avoid excessive queries
  - [ ] Handle loading and error states
- [ ] Task 5: Integrate with PremiumService (AC: 1)
  - [ ] Use PremiumService methods internally
  - [ ] Handle async operations
  - [ ] Cache results appropriately
- [ ] Task 6: Add refresh mechanism (AC: 1)
  - [ ] Implement refreshPremiumStatus method
  - [ ] Call refresh after payment success
  - [ ] Update state after refresh
- [ ] Task 7: Wrap app with PremiumProvider (AC: 1)
  - [ ] Add PremiumProvider to App.tsx
  - [ ] Ensure it wraps components that need premium status
  - [ ] Place after AuthProvider (needs user identity)
- [ ] Task 8: Handle offline scenarios (AC: 1)
  - [ ] Fallback to localStorage if Supabase unavailable
  - [ ] Sync status when online
  - [ ] Handle offline gracefully

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Context Pattern:**
- Follow existing context patterns from `AuthContext.tsx`, `LeagueContext.tsx`
- Use React Context API
- Provide custom hook (usePremium) for easy access
- Export Provider and hook

**State Management:**
- Use useState for premium status
- Use useEffect for initial load and refresh
- Cache status to avoid excessive queries
- Handle loading and error states

**Integration with PremiumService:**
- Context wraps PremiumService
- Context provides React-friendly interface
- Service handles business logic
- Context handles React state

**Refresh Pattern:**
- Call refreshPremiumStatus after payment
- Poll for status update after webhook (optional)
- Update state after refresh
- Notify components of status change

### Source Tree Components to Touch

**Files to Create:**
- `src/context/PremiumContext.tsx` - Premium context

**Files to Modify:**
- `src/App.tsx` - Add PremiumProvider

**Files to Reference:**
- `src/context/AuthContext.tsx` - Context pattern
- `src/context/LeagueContext.tsx` - Context pattern
- `src/services/PremiumService.ts` (Story 7.2) - Premium service

**Files That Will Use This Context:**
- All components that need premium status (Home, CreateTournament, CreateLeague, etc.)

### Testing Standards Summary

**Unit Testing:**
- Test PremiumContext creation
- Test usePremium hook
- Test context methods
- Test refresh mechanism

**Integration Testing:**
- Test context with PremiumService
- Test status update after payment
- Test offline fallback

### Project Structure Notes

**Alignment with Unified Project Structure:**
- ✅ Context location: `src/context/` (consistent)
- ✅ Follows existing context patterns

### References

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Story-7.12] Story 7.12: Premium Status Context Integration

**Context Patterns:**
- [Source: src/context/AuthContext.tsx] AuthContext - Context structure
- [Source: src/context/LeagueContext.tsx] LeagueContext - Context patterns

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_
