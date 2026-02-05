# Story 7.9: League Creation Premium Requirement

Status: ready-for-dev

## Story

As a free user,
I want to understand that leagues are a premium feature,
so that I know I need to upgrade to create leagues.

## Acceptance Criteria

1. **Given** a free user wants to create a league
   **When** they click "NOUVELLE LIGUE" in CreateMenuModal
   **Then** PaymentModal opens with upgrade offer
   **And** modal explains: "Les ligues sont une fonctionnalité premium. Débloquez-les pour 3€ !"
   **And** upgrade button is prominent
   **And** they can complete payment to unlock
   **And** after payment, they can create leagues
   **When** a premium user clicks "NOUVELLE LIGUE"
   **Then** they navigate directly to create league page
   **And** no payment modal is shown

## Tasks / Subtasks

- [ ] Task 1: Add premium check in CreateLeague page (AC: 1)
  - [ ] Import PremiumService or usePremium hook
  - [ ] Check `canCreateLeague()` on component mount
  - [ ] Redirect to payment if not premium
  - [ ] Allow creation if premium
- [ ] Task 2: Update CreateMenuModal league option (AC: 1)
  - [ ] Check premium status for league option
  - [ ] Show "🔒 Premium - 3€" if free
  - [ ] Show "✨ Premium" if premium
  - [ ] Open PaymentModal if free user clicks
  - [ ] Navigate to create page if premium user clicks
- [ ] Task 3: Integrate PaymentModal (AC: 1)
  - [ ] Open PaymentModal when free user tries to create league
  - [ ] Show message: "Les ligues sont une fonctionnalité premium. Débloquez-les pour 3€ !"
  - [ ] Handle payment success
  - [ ] Redirect to create league page after payment
- [ ] Task 4: Update CreateLeague page (AC: 1)
  - [ ] Remove existing auth check (if any) or keep it
  - [ ] Add premium check before allowing creation
  - [ ] Show premium requirement message if not premium
  - [ ] Allow creation if premium

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Premium Check Pattern:**
- Check premium status on component mount
- Use PremiumService `canCreateLeague()` method
- Redirect to payment or show upgrade prompt if not premium

**Navigation Pattern:**
- Use `useNavigate` for navigation
- Store intended destination (create league) for post-payment redirect
- Navigate after successful payment

**Modal Integration:**
- Open PaymentModal from CreateMenuModal or CreateLeague page
- Pass context (upgrading for leagues)
- Handle payment success callback

### Source Tree Components to Touch

**Files to Modify:**
- `src/pages/CreateLeague.tsx` - Add premium check
- `src/components/CreateMenuModal.tsx` (Story 7.6) - League option handling

**Files to Reference:**
- `src/services/PremiumService.ts` (Story 7.2) - Premium check
- `src/components/PaymentModal.tsx` (Story 7.11) - Payment modal

### Testing Standards Summary

**Unit Testing:**
- Test premium check for free vs premium users
- Test PaymentModal opening for free users
- Test navigation for premium users

**Integration Testing:**
- Test complete flow: free user → click league → payment → create league
- Test premium user can create leagues directly

### Project Structure Notes

**Alignment with Unified Project Structure:**
- ✅ Follows existing CreateLeague.tsx patterns

### References

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Story-7.9] Story 7.9: League Creation Premium Requirement

**Component Patterns:**
- [Source: src/pages/CreateLeague.tsx] CreateLeague - Current implementation

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_
