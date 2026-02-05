# Story 7.5: Home Page UX with Single Create Button

Status: **SUPERSEDED** by Story 7.13

> **⚠️ IMPORTANT**: This story has been superseded by Story 7.13 (Adaptive Home Page with Three Actions).
> 
> **Reason**: Modal-based approach caused UI instability after authentication. New approach uses adaptive home page with 3 distinct buttons, eliminating modal complexity.
> 
> **See**: 
> - `7-13-adaptive-home-page-with-three-actions.md` (replacement story)
> - `7-13-ARCHITECTURE-DECISION.md` (decision rationale)
> - `7-13-IMPLEMENTATION-SUMMARY.md` (implementation guide)
>
> **Do not implement this story.** Refer to Story 7.13 instead.

## Story

As a user,
I want a single "Create Tournament/League" button on the home page,
so that the interface is simpler and I can choose what to create after clicking.

## Acceptance Criteria

1. **Given** the home page
   **When** user is not authenticated
   **Then** "REJOINDRE UN TOURNOI" button is visible
   **And** "CRÉER NOUVEAU TOURNOI/LIGUE" button is visible
   **And** clicking "CRÉER NOUVEAU TOURNOI/LIGUE" opens AuthModal
   **And** after authentication, user is redirected to create menu
   **When** user is authenticated (free)
   **Then** "REJOINDRE UN TOURNOI" button is visible
   **And** "CRÉER NOUVEAU TOURNOI/LIGUE" button is visible
   **And** clicking opens CreateMenuModal with two options
   **And** menu shows "NOUVEAU TOURNOI (X/2 restants) 🆓"
   **And** menu shows "NOUVELLE LIGUE 🔒 Premium - 3€"
   **And** menu displays limitations clearly
   **When** user is authenticated (premium)
   **Then** clicking opens CreateMenuModal
   **And** menu shows "NOUVEAU TOURNOI ✨ Illimité"
   **And** menu shows "NOUVELLE LIGUE ✨ Premium"
   **And** no limitations are displayed

## Tasks / Subtasks

- [ ] Task 1: Modify Home.tsx button structure (AC: 1)
  - [ ] Replace two separate buttons with single "CRÉER NOUVEAU TOURNOI/LIGUE" button
  - [ ] Keep "REJOINDRE UN TOURNOI" button (if exists or add it)
  - [ ] Add button click handler
  - [ ] Style button consistently with existing design
- [ ] Task 2: Add authentication check logic (AC: 1)
  - [ ] Check if user is authenticated using `useAuthContext`
  - [ ] If not authenticated, open AuthModal on click
  - [ ] Store pending action (create menu) for after authentication
  - [ ] Redirect to create menu after successful authentication
- [ ] Task 3: Integrate CreateMenuModal (AC: 1)
  - [ ] Import CreateMenuModal component (Story 7.6)
  - [ ] Add state to control modal visibility
  - [ ] Open modal when authenticated user clicks create button
  - [ ] Pass premium status and limits to modal
- [ ] Task 4: Add premium status checking (AC: 1)
  - [ ] Use PremiumContext (Story 7.12) or PremiumService (Story 7.2)
  - [ ] Get tournament count and remaining limit
  - [ ] Get premium status
  - [ ] Pass data to CreateMenuModal

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Component Pattern:**
- Follow existing Home.tsx structure and styling
- Use Tailwind CSS classes consistent with existing design
- Maintain responsive design (mobile-first)
- Use lucide-react icons if needed

**State Management:**
- Use React hooks (useState) for modal state
- Use context hooks (useAuthContext, usePremium) for user data
- Handle loading states appropriately

**Navigation Pattern:**
- Use `useNavigate` from react-router-dom
- Handle authentication flow with AuthModal
- Store pending action for post-authentication redirect

**Button Styling:**
- Follow existing button styles from Home.tsx
- Use consistent colors (primary for leagues, accent for tournaments)
- Ensure minimum 44px touch target (mobile-friendly)
- Use hover and active states

### Source Tree Components to Touch

**Files to Modify:**
- `src/pages/Home.tsx` - Replace two buttons with single button, add modal integration

**Files to Reference:**
- `src/components/AuthModal.tsx` - Authentication modal pattern
- `src/components/CreateMenuModal.tsx` (Story 7.6) - Create menu modal
- `src/context/PremiumContext.tsx` (Story 7.12) - Premium status context
- `src/services/PremiumService.ts` (Story 7.2) - Premium service

**Dependencies:**
- Story 7.6 (CreateMenuModal) - Modal component must exist
- Story 7.12 (Premium Context) - Context for premium status (or use PremiumService directly)

### Testing Standards Summary

**Unit Testing:**
- Test button rendering for authenticated/unauthenticated users
- Test button click opens AuthModal when not authenticated
- Test button click opens CreateMenuModal when authenticated
- Test premium status is passed correctly to modal

**Integration Testing:**
- Test complete flow: click button → authenticate → redirect to menu
- Test premium vs free user experience
- Test tournament count display

### Project Structure Notes

**Alignment with Unified Project Structure:**
- ✅ Page location: `src/pages/` (consistent)
- ✅ Component naming: PascalCase
- ✅ Follows existing Home.tsx patterns

### References

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Story-7.5] Story 7.5: Home Page UX with Single Create Button

**Component Patterns:**
- [Source: src/pages/Home.tsx] Home page current implementation
- [Source: src/components/AuthModal.tsx] AuthModal component

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_
