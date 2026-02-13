# Code Review — Story 14-19: Create tournament page (overhaul)

**Reviewer:** Senior Developer (Adversarial)  
**Date:** 2026-02-13  
**Story:** 14-19-page-creer-tournoi-refonte  
**Status:** findings documented

---

## Git vs Story Discrepancies

- **Story File List:** src/pages/CreateTournament.tsx, tests/unit/pages/CreateTournament.test.tsx
- **Git status:** Both files modified (M)
- **Discrepancy count:** 0

---

## Issues Found

**Summary:** 1 High, 2 Medium, 1 Low

---

## 🔴 HIGH

### 1. PaymentModal never shown when limit reached [CreateTournament.tsx:239-259]

**Problem:** When `!canCreate`, the component returns early with the "Limite atteinte" UI. That UI has a button "PASSER PREMIUM" that calls `setShowPaymentModal(true)`. But the `PaymentModal` is only rendered in the main form return (line 369-372). When at limit, we never render PaymentModal — so clicking the button does nothing visible.

**Impact:** User at tournament limit cannot open the payment modal to upgrade.

**Fix:** Add PaymentModal to the limit-reached return block.

---

## 🟡 MEDIUM

### 2. Path aliases not used (project-context violation) [CreateTournament.tsx:15-22]

**Problem:** CreateTournament uses relative imports (`../context/`, `../components/`, `../services/`) instead of `@/` per project-context. CreateLeague uses `@/`.

**Fix:** Replace with `@/context/`, `@/components/`, `@/services/`, `@/utils/`.

### 3. Missing tests [CreateTournament.test.tsx]

**Problem:**
- No test for limit-reached scenario (canCreate=false)
- No test for premium user (isPremium badge)
- No test for player limit validation when hasPlayerLimit and invalid value

---

## 🟢 LOW

### 4. Premium badge plural typo [CreateTournament.tsx:279-281]

**Problem:** "restant" vs "restants" — when remainingTournaments is 0, we get "0 tournoi restant" (correct). But the logic `remainingTournaments > 1` means 0 and 1 both use singular. For 0, "0 tournoi restant" is acceptable. Minor.

---

## Acceptance Criteria Validation

| AC | Status | Evidence |
|----|--------|----------|
| AC1: Header title + back | ✅ | ContextualHeader with title, onBack |
| AC2: Fields with labels, inline validation | ✅ | Labels, errors.name, errors.playerLimit |
| AC3: Primary CTA at bottom | ✅ | fixed bottom-16, form="create-tournament-form" |
| AC4: Frame 10 alignment | ✅ | CTA sticky, design tokens |

## Task Completion Audit

| Task | Status | Evidence |
|------|--------|----------|
| Task 1: Apply tokens and styles | ✅ | rounded-xl, text-red-400, gradient CTA |
| Task 2: Header and layout | ✅ | ContextualHeader, pb-24 |
| Task 3: Frame 10 alignment | ✅ | CTA sticky bottom-16 |
