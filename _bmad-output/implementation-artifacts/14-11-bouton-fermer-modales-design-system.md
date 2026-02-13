# Story 14.11: Modal close button (design system)

Status: done

## Story

As a user,
I want an X button on all modals,
So that I can always close without being blocked.

## Acceptance Criteria

1. **Given** any modal in the app
   **When** the modal is displayed
   **Then** X button visible in top right

2. Clicking X closes the modal

3. Modals concerned: New match, Enter code, Limit reached, Add player, etc.

## Tasks / Subtasks

- [x] Task 1: Audit modals (AC: 3)
  - [x] MatchRecordingForm
  - [x] CodeInputModal
  - [x] PaymentModal
  - [x] AddPlayerModal (LeagueDashboard, TournamentDashboard)
  - [x] Other modals (AuthModal, CreateIdentityModal, IdentityModal, PlayerProfile Edit, QRScanner, QRCodeDisplay)
- [x] Task 2: Add/ensure X button (AC: 1, 2)
  - [x] X in top right on each modal
  - [x] onClick calls onClose
- [x] Task 3: Verification
  - [x] Test each modal

## Dev Notes

- **Source:** design-system-convergence.md section 6.1
- Always an X even if other buttons (e.g. "Later")
- Icon: lucide-react X

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#6]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Senior Developer Review (AI)

**Review:** 2026-02-13
**Outcome:** APPROVE (all issues fixed)

**Findings addressed:**

- [HIGH] PaymentModal success state - Added X button
- [HIGH] Task 3 test coverage - Added CreateIdentityModal.test, IdentityModal.test, PaymentModal success X test
- [MEDIUM] Escape key handling - Added to PlayerProfile, LeagueDashboard, TournamentDashboard, AuthModal, CreateIdentityModal, IdentityModal, PaymentModal, MatchRecordingForm
- [LOW] X icon styling - Added text-slate-400 to AuthModal, CreateIdentityModal, IdentityModal, PaymentModal main

### Completion Notes List

- ✅ Added X button to PlayerProfile Edit modal (was missing)
- ✅ Added X button to PaymentModal close confirmation dialog
- ✅ Added X button to PaymentModal success state (code review fix)
- ✅ Added aria-label="Fermer" to AuthModal, CreateIdentityModal, IdentityModal, LeagueDashboard Add Player/Record Match, TournamentDashboard Add Player
- ✅ Added text-slate-400 to X icons for consistency (code review fix)
- ✅ Added Escape key handling to all custom modals (code review fix)
- ✅ Updated AuthModal test to use getByLabelText('Fermer')
- ✅ Added PaymentModal test for X button dismissing confirmation
- ✅ Added PaymentModal test for X button in success state
- ✅ Added MatchRecordingForm test for X close button (Story 14.11)
- ✅ Added CreateIdentityModal.test.tsx and IdentityModal.test.tsx (code review fix)

### File List

- src/pages/PlayerProfile.tsx
- src/components/PaymentModal.tsx
- src/components/AuthModal.tsx
- src/components/CreateIdentityModal.tsx
- src/components/IdentityModal.tsx
- src/components/MatchRecordingForm.tsx
- src/pages/LeagueDashboard.tsx
- src/pages/TournamentDashboard.tsx
- tests/unit/components/AuthModal.test.tsx
- tests/unit/components/PaymentModal.test.tsx
- tests/unit/components/MatchRecordingForm.test.tsx
- tests/unit/components/CreateIdentityModal.test.tsx
- tests/unit/components/IdentityModal.test.tsx
