# Story 7.7: Tournament Creation Limit Enforcement

Status: ready-for-dev

## Story

As a free user,
I want to see my tournament creation limit,
so that I understand when I need to upgrade to create more tournaments.

## Acceptance Criteria

1. **Given** a free user wants to create a tournament
   **When** they have created less than 2 tournaments
   **Then** they can create a tournament normally
   **And** tournament count is displayed (e.g., "1/2 tournois créés")
   **And** limit indicator is visible in create menu
   **When** they have created 2 tournaments
   **Then** tournament creation is blocked
   **And** message displays: "Limite de 2 tournois atteinte. Passez Premium pour plus !"
   **And** upgrade button is shown
   **And** clicking upgrade opens PaymentModal
   **And** after premium purchase, they can create unlimited tournaments

## Tasks / Subtasks

- [ ] Task 1: Add limit check in CreateTournament page (AC: 1)
  - [ ] Import PremiumService or usePremium hook
  - [ ] Check `canCreateTournament()` on component mount
  - [ ] Check limit before form submission
  - [ ] Display limit status
- [ ] Task 2: Display tournament count (AC: 1)
  - [ ] Get tournament count from PremiumService
  - [ ] Display count in CreateMenuModal (e.g., "1/2 restants")
  - [ ] Display count in CreateTournament page (optional)
  - [ ] Update count after tournament creation
- [ ] Task 3: Block creation when limit reached (AC: 1)
  - [ ] Disable form submission if limit reached
  - [ ] Show error message: "Limite de 2 tournois atteinte. Passez Premium pour plus !"
  - [ ] Display upgrade button/prompt
  - [ ] Prevent navigation to create page if limit reached (optional)
- [ ] Task 4: Integrate PaymentModal (AC: 1)
  - [ ] Open PaymentModal when upgrade button clicked
  - [ ] Handle payment success
  - [ ] Refresh premium status after payment
  - [ ] Allow tournament creation after premium activation
- [ ] Task 5: Update CreateMenuModal display (AC: 1)
  - [ ] Show "❌ Limite atteinte (2/2)" if limit reached
  - [ ] Disable tournament option if limit reached
  - [ ] Show upgrade prompt in menu

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Limit Checking Pattern:**
- Check limit on component mount using `useEffect`
- Check limit before form submission in `handleSubmit`
- Use PremiumService `canCreateTournament()` method
- Handle async premium status checking

**Error Display Pattern:**
- Use react-hot-toast for error messages
- Display inline error in form
- Show upgrade prompt with clear CTA
- Use consistent error styling

**Form Validation Pattern:**
- Add limit check to existing validation in `CreateTournament.tsx`
- Prevent submission if `canCreateTournament().allowed === false`
- Show validation error before submission attempt

**State Management:**
- Use React state for limit status
- Refresh limit status after tournament creation
- Refresh limit status after premium purchase

### Source Tree Components to Touch

**Files to Modify:**
- `src/pages/CreateTournament.tsx` - Add limit checking and display
- `src/components/CreateMenuModal.tsx` (Story 7.6) - Display limit status

**Files to Reference:**
- `src/services/PremiumService.ts` (Story 7.2) - Premium service for limit checking
- `src/context/PremiumContext.tsx` (Story 7.12) - Premium context hook
- `src/components/PaymentModal.tsx` (Story 7.11) - Payment modal for upgrade

### Testing Standards Summary

**Unit Testing:**
- Test limit check with 0, 1, 2 tournaments created
- Test form submission blocking when limit reached
- Test error message display
- Test upgrade button functionality

**Integration Testing:**
- Test complete flow: create 2 tournaments → try to create 3rd → see limit message
- Test upgrade flow: click upgrade → pay → create tournament
- Test premium user can create unlimited tournaments

### Project Structure Notes

**Alignment with Unified Project Structure:**
- ✅ Follows existing CreateTournament.tsx patterns
- ✅ Uses existing validation patterns

### References

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Story-7.7] Story 7.7: Tournament Creation Limit Enforcement

**Component Patterns:**
- [Source: src/pages/CreateTournament.tsx] CreateTournament - Form validation patterns

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_
