# Story 7.10: Premium Status Display in Profile

Status: ready-for-dev

## Story

As a premium user,
I want to see my premium status in my profile,
so that I can confirm my premium access.

## Acceptance Criteria

1. **Given** a user views their profile
   **When** they are a premium user
   **Then** premium badge is displayed (e.g., "✨ Premium")
   **And** purchase date is shown (if tracked)
   **And** premium features are highlighted
   **When** they are a free user
   **Then** upgrade prompt is shown
   **And** upgrade button links to payment flow
   **And** benefits of premium are explained

## Tasks / Subtasks

- [ ] Task 1: Add premium status display (AC: 1)
  - [ ] Import PremiumService or usePremium hook
  - [ ] Get premium status for current user
  - [ ] Display premium badge if premium
  - [ ] Style badge consistently
- [ ] Task 2: Add upgrade prompt for free users (AC: 1)
  - [ ] Show upgrade section if not premium
  - [ ] Display premium benefits list
  - [ ] Add upgrade button
  - [ ] Link to PaymentModal
- [ ] Task 3: Add purchase date (optional, AC: 1)
  - [ ] Query purchase date from database (if purchases table exists)
  - [ ] Display purchase date if available
  - [ ] Format date appropriately
- [ ] Task 4: Style premium section (AC: 1)
  - [ ] Use consistent styling with profile page
  - [ ] Ensure premium badge is prominent
  - [ ] Make upgrade CTA clear and actionable

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Profile Display Pattern:**
- Follow existing UserProfile.tsx structure
- Add premium section to profile layout
- Use consistent styling with existing profile elements

**Premium Badge Design:**
- Use emoji (✨) or icon for premium indicator
- Style with primary color or gold/amber
- Make it visually distinct

**Upgrade CTA:**
- Show clear benefits list
- Prominent upgrade button
- Link to PaymentModal

### Source Tree Components to Touch

**Files to Modify:**
- `src/pages/UserProfile.tsx` - Add premium status display

**Files to Reference:**
- `src/services/PremiumService.ts` (Story 7.2) - Premium status
- `src/components/PaymentModal.tsx` (Story 7.11) - Payment modal

### Testing Standards Summary

**Unit Testing:**
- Test premium badge display for premium users
- Test upgrade prompt display for free users
- Test purchase date display (if implemented)

**Integration Testing:**
- Test upgrade flow from profile page
- Test premium status refresh after payment

### Project Structure Notes

**Alignment with Unified Project Structure:**
- ✅ Follows existing UserProfile.tsx patterns

### References

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Story-7.10] Story 7.10: Premium Status Display in Profile

**Component Patterns:**
- [Source: src/pages/UserProfile.tsx] UserProfile - Current implementation

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_
