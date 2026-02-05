# Story 7.6: CreateMenuModal Component

Status: **DEPRECATED** (Not Needed)

> **⚠️ IMPORTANT**: This story has been deprecated and should not be implemented.
> 
> **Reason**: Modal-based approach abandoned in favor of adaptive home page (Story 7.13). The CreateMenuModal component is no longer needed as the home page now displays 3 distinct action buttons directly.
> 
> **Impact**: If `CreateMenuModal.tsx` was already created, it should be deleted after Story 7.13 is implemented.
> 
> **See**: 
> - `7-13-adaptive-home-page-with-three-actions.md` (replacement approach)
> - `7-13-ARCHITECTURE-DECISION.md` (why modal was abandoned)
> - `7-13-IMPLEMENTATION-SUMMARY.md` (implementation guide)
>
> **Do not implement this story.**

## Story

As a user,
I want a menu to choose between creating a tournament or league,
so that I can easily access the creation flow for either feature.

## Acceptance Criteria

1. **Given** a user clicks "CRÉER NOUVEAU TOURNOI/LIGUE"
   **When** CreateMenuModal opens
   **Then** modal displays two options: Tournament and League
   **And** tournament option shows remaining count if free (X/2)
   **And** tournament option shows "Illimité" if premium
   **And** league option shows "🔒 Premium - 3€" if free
   **And** league option shows "✨ Premium" if premium
   **And** clicking tournament option navigates to create tournament page
   **And** clicking league option navigates to create league page (if premium) or opens payment modal (if free)
   **And** modal can be closed with X button or backdrop click
   **And** modal is responsive and mobile-friendly

## Tasks / Subtasks

- [ ] Task 1: Create CreateMenuModal component structure (AC: 1)
  - [ ] Create `src/components/CreateMenuModal.tsx`
  - [ ] Add modal props (isOpen, onClose)
  - [ ] Implement modal UI with backdrop and content area
  - [ ] Add close button (X icon)
  - [ ] Style consistently with existing modals
- [ ] Task 2: Add tournament option (AC: 1)
  - [ ] Display "NOUVEAU TOURNOI" button/option
  - [ ] Show remaining count if free (e.g., "1/2 restants")
  - [ ] Show "✨ Illimité" if premium
  - [ ] Add click handler to navigate to `/create-tournament`
  - [ ] Style with appropriate colors (accent/red)
- [ ] Task 3: Add league option (AC: 1)
  - [ ] Display "NOUVELLE LIGUE" button/option
  - [ ] Show "🔒 Premium - 3€" if free
  - [ ] Show "✨ Premium" if premium
  - [ ] Add click handler (navigate if premium, open PaymentModal if free)
  - [ ] Style with appropriate colors (primary/amber)
- [ ] Task 4: Integrate premium status (AC: 1)
  - [ ] Use PremiumContext or PremiumService to get premium status
  - [ ] Get tournament count and remaining limit
  - [ ] Pass data to display correct badges and messages
- [ ] Task 5: Integrate PaymentModal (AC: 1)
  - [ ] Import PaymentModal component (Story 7.11)
  - [ ] Open PaymentModal when free user clicks league option
  - [ ] Handle payment success (refresh premium status, close modals)
- [ ] Task 6: Add responsive design (AC: 1)
  - [ ] Ensure modal works on mobile (320px+)
  - [ ] Ensure touch targets are 44px minimum
  - [ ] Test on tablet and desktop

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Modal Pattern:**
- Follow existing modal patterns from `AuthModal.tsx`, `CreateIdentityModal.tsx`
- Use backdrop with click-to-close
- Use X button in top-right corner
- Use lucide-react icons (X, Trophy, Calendar)
- Use Tailwind CSS for styling

**Component Structure:**
- Props: `{ isOpen: boolean, onClose: () => void }`
- Conditional rendering: `if (!isOpen) return null`
- Use portal for modal (optional, but recommended)

**Navigation Pattern:**
- Use `useNavigate` from react-router-dom
- Navigate to `/create-tournament` for tournament option
- Navigate to `/create-league` for league option (if premium)
- Open PaymentModal for league option (if free)

**Premium Status Integration:**
- Use `usePremium` hook from PremiumContext (Story 7.12)
- Or use `premiumService` directly
- Get: `isPremium`, `canCreateTournament()`, `canCreateLeague()`

**Styling:**
- Tournament option: Use accent color (red) - consistent with existing "NOUVEAU TOURNOI" button
- League option: Use primary color (amber) - consistent with existing "NOUVELLE LIGUE" button
- Badges: Use emoji or icons for visual indicators
- Ensure high contrast for readability

### Source Tree Components to Touch

**Files to Create:**
- `src/components/CreateMenuModal.tsx` - New modal component

**Files to Reference:**
- `src/components/AuthModal.tsx` - Modal structure and patterns
- `src/components/CreateIdentityModal.tsx` - Modal patterns
- `src/components/PaymentModal.tsx` (Story 7.11) - Payment modal integration
- `src/context/PremiumContext.tsx` (Story 7.12) - Premium status context

**Files That Will Use This Component:**
- `src/pages/Home.tsx` (Story 7.5) - Will open this modal

### Testing Standards Summary

**Unit Testing:**
- Test modal rendering when isOpen is true/false
- Test close button functionality
- Test backdrop click to close
- Test tournament option click navigation
- Test league option click (premium vs free)
- Test premium status display

**Integration Testing:**
- Test complete flow: open modal → click option → navigate
- Test payment modal integration for free users
- Test premium user experience

### Project Structure Notes

**Alignment with Unified Project Structure:**
- ✅ Component location: `src/components/` (consistent)
- ✅ Component naming: PascalCase
- ✅ Follows existing modal patterns

### References

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Story-7.6] Story 7.6: CreateMenuModal Component

**Component Patterns:**
- [Source: src/components/AuthModal.tsx] AuthModal - Modal structure
- [Source: src/components/CreateIdentityModal.tsx] CreateIdentityModal - Modal patterns

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_
