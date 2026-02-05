# Story 7.13: Adaptive Home Page with Three Distinct Action Buttons

Status: ready-for-dev

## Story

As a user,
I want the home page to adapt based on my authentication status,
so that I see clear action buttons (Rejoindre / Créer Tournoi / Créer Ligue) with freemium limitations displayed directly when I'm connected, eliminating the need for a modal and providing a more stable, transparent experience.

## Context

This story **replaces** the approach from Stories 7.5 and 7.6 (single create button + CreateMenuModal).

**Problem with previous approach:**
- Modal state juggling after authentication caused UI instability
- Modal could close unexpectedly, breaking the user flow
- sessionStorage orchestration was fragile

**New approach:**
- Home page adapts based on authentication status
- Unauthenticated: 2 buttons (Rejoindre + Créer)
- Authenticated: 3 buttons (Rejoindre + Créer Tournoi + Créer Ligue)
- Freemium limitations displayed directly on buttons (no modal needed)
- Cleaner navigation flow, no state management complexity

## Acceptance Criteria

### AC1: Unauthenticated Home Display
1. **Given** the home page
   **When** user is not authenticated
   **Then** "REJOINDRE UN TOURNOI" button is visible
   **And** "CRÉER TOURNOI / LIGUE" button is visible
   **And** clicking "CRÉER TOURNOI / LIGUE" opens AuthModal
   **And** after successful authentication, home re-renders with authenticated view

### AC2: Authenticated Home Display (Free User)
2. **Given** the home page
   **When** user is authenticated (free tier)
   **Then** "REJOINDRE UN TOURNOI" button is visible
   **And** "CRÉER UN TOURNOI" button is visible with badge "X/2 restants 🆓"
   **And** "CRÉER UNE LIGUE" button is visible with badge "🔒 Premium - 3€"
   **And** all three buttons are distinct and styled appropriately

### AC3: Authenticated Home Display (Premium User)
3. **Given** the home page
   **When** user is authenticated (premium)
   **Then** "REJOINDRE UN TOURNOI" button is visible
   **And** "CRÉER UN TOURNOI" button shows "✨ Illimité" badge
   **And** "CRÉER UNE LIGUE" button shows "✨ Premium" badge

### AC4: Tournament Creation Click Behavior
4. **Given** authenticated user on home page
   **When** user clicks "CRÉER UN TOURNOI"
   **And** user has not reached tournament limit (tournamentCount < 2)
   **Then** navigate to `/tournament/create`
   **When** user clicks "CRÉER UN TOURNOI"
   **And** user is free tier with limit reached (tournamentCount >= 2)
   **Then** display error toast "Limite de 2 tournois atteinte. Passe Premium pour créer sans limite !"
   **And** optionally open PaymentModal
   **When** user is premium
   **Then** always navigate to `/tournament/create` (no limit)

### AC5: League Creation Click Behavior
5. **Given** authenticated user on home page
   **When** user clicks "CRÉER UNE LIGUE"
   **And** user is free tier
   **Then** open PaymentModal
   **When** user clicks "CRÉER UNE LIGUE"
   **And** user is premium
   **Then** navigate to `/league/create`

### AC6: Rejoindre Action
6. **Given** user on home page (authenticated or not)
   **When** user clicks "REJOINDRE UN TOURNOI"
   **Then** navigate to `/tournament/join`

## Tasks / Subtasks

- [ ] Task 1: Refactor Home.tsx for conditional rendering (AC: 1, 2, 3)
  - [ ] Create `HomeUnauthenticated` component or section
  - [ ] Create `HomeAuthenticated` component or section
  - [ ] Add conditional logic based on `hasIdentity` state
  - [ ] Ensure smooth re-render when authentication state changes
  
- [ ] Task 2: Implement unauthenticated home buttons (AC: 1)
  - [ ] "REJOINDRE UN TOURNOI" button with QR icon
  - [ ] "CRÉER TOURNOI / LIGUE" button with Plus icon
  - [ ] Wire click handler for "CRÉER" to open AuthModal
  - [ ] Remove sessionStorage pending action logic (no longer needed)
  
- [ ] Task 3: Implement authenticated home buttons (AC: 2, 3, 4, 5, 6)
  - [ ] "REJOINDRE UN TOURNOI" button (same as unauthenticated)
  - [ ] "CRÉER UN TOURNOI" button with dynamic badge
  - [ ] "CRÉER UNE LIGUE" button with dynamic badge
  - [ ] Style buttons with appropriate colors (slate/orange/gold)
  - [ ] Ensure touch-friendly sizing (min 44px height)
  
- [ ] Task 4: Add premium status and limits loading (AC: 2, 3)
  - [ ] Use `PremiumService.isPremium()` to get premium status
  - [ ] Use `PremiumService.getTournamentCount()` to get count
  - [ ] Use `PremiumService.canCreateTournament()` to check limit
  - [ ] Add loading state while fetching premium data
  - [ ] Display badges dynamically based on fetched data
  
- [ ] Task 5: Implement tournament creation click logic (AC: 4)
  - [ ] Check `canCreateTournament` before navigation
  - [ ] If limit reached (free user), show error toast
  - [ ] Optionally open `PaymentModal` on limit reached
  - [ ] If allowed, navigate to `/tournament/create`
  
- [ ] Task 6: Implement league creation click logic (AC: 5)
  - [ ] Check `isPremium` status
  - [ ] If free tier, open `PaymentModal`
  - [ ] If premium, navigate to `/league/create`
  
- [ ] Task 7: Remove CreateMenuModal integration (cleanup)
  - [ ] Remove `CreateMenuModal` import from Home.tsx
  - [ ] Remove modal state management (showCreateMenu)
  - [ ] Clean up any modal-related handlers
  - [ ] Mark `CreateMenuModal.tsx` file for deletion (Story 7.6 deprecated)

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Adaptive UI Pattern:**
- Conditional rendering based on authentication state
- Single component (`Home.tsx`) with two distinct views
- No additional routes needed, just UI adaptation
- Clean separation between authenticated/unauthenticated logic

**State Management:**
- Use `useAuthContext` for authentication status
- Use `useIdentity` for local user detection
- Use `PremiumService` methods for premium status/limits
- Use `useState` for loading states and PaymentModal visibility
- No sessionStorage orchestration needed (simpler flow)

**Navigation Pattern:**
- Direct navigation to create pages when allowed
- Toast notifications for limit enforcement
- PaymentModal for premium gate (leagues and tournament limits)

**Button Styling Guidelines:**
```typescript
// Rejoindre: Secondary style
bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-accent

// Créer Tournoi: Primary gradient
bg-gradient-to-r from-primary to-accent hover:from-amber-600 hover:to-red-600

// Créer Ligue: Premium gradient
bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700
```

**Badge Display Logic:**
```typescript
// Tournament badge
tournamentCount < 2 && !isPremium: "X/2 restants 🆓"
tournamentCount >= 2 && !isPremium: "2/2 🆓 - Limite atteinte"
isPremium: "✨ Illimité"

// League badge
!isPremium: "🔒 Premium - 3€"
isPremium: "✨ Premium"
```

### Source Tree Components to Touch

**Files to Modify:**
- `src/pages/Home.tsx` - Complete refactor for adaptive UI
- `src/components/AuthModal.tsx` - Remove sessionStorage pendingAction logic

**Files to Reference:**
- `src/services/PremiumService.ts` (Story 7.2) - Premium checks
- `src/components/PaymentModal.tsx` (Story 7.11) - Payment gate
- `src/context/AuthContext.tsx` - Authentication state
- `src/hooks/useIdentity.ts` - Identity detection

**Files to Deprecate/Delete:**
- `src/components/CreateMenuModal.tsx` (Story 7.6) - No longer needed

**Dependencies:**
- Story 7.2 (PremiumService) - Must be implemented ✅
- Story 7.11 (PaymentModal) - Must be implemented ✅
- Authentication system (Epic 2) - Must be functional ✅

### Testing Standards Summary

**Unit Testing:**
- Test `HomeUnauthenticated` renders correct buttons
- Test `HomeAuthenticated` renders 3 buttons with correct badges
- Test premium badge displays "Illimité" and "Premium" correctly
- Test free badge displays "X/2 restants" and "Premium - 3€" correctly
- Test button click handlers call correct navigation/modal functions
- Test tournament limit enforcement logic
- Test league premium gate logic

**Integration Testing:**
- Test full auth flow: unauthenticated → click CRÉER → auth → see 3 buttons
- Test tournament creation flow for free user (within limit)
- Test tournament creation blocked for free user (limit reached)
- Test league creation opens PaymentModal for free user
- Test league creation navigates for premium user
- Test premium status updates after payment success

**E2E Testing:**
- Verify unauthenticated user sees 2 buttons
- Verify authenticated free user sees correct badges
- Verify authenticated premium user sees premium badges
- Verify tournament limit enforcement with toast message
- Verify league premium gate with PaymentModal
- Verify navigation to create pages works correctly

### Project Structure Notes

**Alignment with Unified Project Structure:**
- ✅ Page location: `src/pages/Home.tsx` (consistent)
- ✅ Component naming: PascalCase
- ✅ Service usage: PremiumService for business logic
- ✅ Context usage: AuthContext, IdentityContext
- ✅ Styling: Tailwind CSS with consistent patterns

**Responsive Design:**
- Mobile-first approach (vertical stack of buttons)
- Touch-friendly button sizes (min 44px height)
- Clear spacing between buttons (gap-3 or gap-4)
- Readable badge text on small screens

### References

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-7] Epic 7: Freemium Payment Model
- [Source: _bmad-output/planning-artifacts/epics.md#Story-7.5] Story 7.5: Home Page UX (REPLACED by 7.13)
- [Source: _bmad-output/planning-artifacts/epics.md#Story-7.6] Story 7.6: Create Menu Modal (DEPRECATED)

**Component Patterns:**
- [Source: src/pages/Home.tsx] Current home implementation
- [Source: src/services/PremiumService.ts] Premium service methods
- [Source: src/components/PaymentModal.tsx] Payment modal component

**Design Decisions:**
- [Discussion: 2026-01-30] Party mode discussion on adaptive UI approach
- [Issue: Modal juggling after auth] sessionStorage fragility led to this refactor

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_
