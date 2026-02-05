# Story 7.13: Adaptive Home Page - Complete Documentation

**Story ID**: 7.13  
**Title**: Adaptive Home Page with Three Distinct Action Buttons  
**Status**: Ready for Development  
**Created**: 2026-01-30  
**Epic**: 7 (Freemium Payment Model)

---

## Quick Start

**If you're implementing this story, start here:**

1. Read `7-13-adaptive-home-page-with-three-actions.md` (main story file)
2. Read `7-13-ARCHITECTURE-DECISION.md` (understand why this approach)
3. Follow `7-13-MIGRATION-GUIDE.md` (step-by-step implementation)

---

## Documentation Overview

This story includes comprehensive documentation across multiple files:

### 📋 Core Story Documentation

| File | Purpose | Read Priority |
|------|---------|---------------|
| `7-13-adaptive-home-page-with-three-actions.md` | Main story file with acceptance criteria and tasks | **MUST READ** |
| `7-13-ARCHITECTURE-DECISION.md` | Why we chose adaptive UI over modal approach | **MUST READ** |
| `7-13-IMPLEMENTATION-SUMMARY.md` | High-level implementation overview | Recommended |
| `7-13-MIGRATION-GUIDE.md` | Step-by-step code migration guide | **MUST READ** |
| `7-13-README.md` | This file - documentation index | Start here |

### 🔄 Related Story Updates

| File | Status | Notes |
|------|--------|-------|
| `7-5-home-page-ux-single-create-button.md` | **SUPERSEDED** | Replaced by Story 7.13 |
| `7-6-create-menu-modal-component.md` | **DEPRECATED** | Modal no longer needed |
| `sprint-status.yaml` | **UPDATED** | Reflects new story status |

---

## What This Story Does

### Problem Statement

The original approach (Stories 7.5 + 7.6) used a modal to let users choose between creating a tournament or league. This caused:
- Modal state juggling after authentication
- UI instability (modal jiggles and closes unexpectedly)
- Poor user experience with fragile sessionStorage orchestration

### Solution

**Adaptive Home Page**: The home page adapts based on authentication status, showing 3 distinct action buttons when connected:

1. **REJOINDRE UN TOURNOI** (always visible)
2. **CRÉER UN TOURNOI** (with freemium badge)
3. **CRÉER UNE LIGUE** (with premium badge)

**Benefits:**
- ✅ No modal complexity
- ✅ No sessionStorage juggling
- ✅ Freemium limitations visible immediately
- ✅ Stable, predictable user experience
- ✅ Cleaner, more maintainable code

---

## User Experience Flow

### Unauthenticated User

```
Home Page
├─ REJOINDRE UN TOURNOI → /tournament/join
└─ CRÉER TOURNOI / LIGUE → Opens AuthModal
    └─ After auth → Home re-renders with 3 buttons
```

### Authenticated User (Free)

```
Home Page
├─ REJOINDRE UN TOURNOI → /tournament/join
├─ CRÉER UN TOURNOI → /tournament/create (if within limit)
│   └─ Badge: "2/2 restants 🆓"
│   └─ If limit reached: Error toast + PaymentModal
└─ CRÉER UNE LIGUE → Opens PaymentModal
    └─ Badge: "🔒 Premium - 3€"
```

### Authenticated User (Premium)

```
Home Page
├─ REJOINDRE UN TOURNOI → /tournament/join
├─ CRÉER UN TOURNOI → /tournament/create (unlimited)
│   └─ Badge: "✨ Illimité"
└─ CRÉER UNE LIGUE → /league/create
    └─ Badge: "✨ Premium"
```

---

## Implementation Checklist

### Prerequisites

Before starting, ensure these are implemented:

- ✅ Story 7.2: PremiumService (methods: `isPremium()`, `getTournamentCount()`, `canCreateTournament()`)
- ✅ Story 7.11: PaymentModal component
- ✅ Epic 2: Authentication system (AuthContext, useIdentity hook)
- ✅ React Router navigation (`useNavigate`)
- ✅ Toast notifications (`react-hot-toast`)

### Development Steps

Follow these steps in order:

1. **Understand the approach** (30 mins)
   - [ ] Read `7-13-ARCHITECTURE-DECISION.md`
   - [ ] Read `7-13-adaptive-home-page-with-three-actions.md`
   - [ ] Understand why modal was abandoned

2. **Review current code** (30 mins)
   - [ ] Check if CreateMenuModal exists in codebase
   - [ ] Review current Home.tsx implementation
   - [ ] Identify sessionStorage usage

3. **Follow migration guide** (4-6 hours)
   - [ ] Open `7-13-MIGRATION-GUIDE.md`
   - [ ] Follow Step 1: Remove modal logic
   - [ ] Follow Step 2: Add premium state management
   - [ ] Follow Step 3: Update button click handlers
   - [ ] Follow Step 4: Update JSX structure
   - [ ] Follow Step 5: Update AuthModal
   - [ ] Follow Step 6: Delete CreateMenuModal

4. **Test implementation** (2-3 hours)
   - [ ] Manual testing (unauthenticated, free, premium)
   - [ ] Unit tests
   - [ ] Integration tests
   - [ ] E2E tests with Playwright

5. **Code review** (1-2 hours)
   - [ ] Self-review using checklist in migration guide
   - [ ] Address linter errors
   - [ ] Verify all acceptance criteria met

6. **Mark story complete**
   - [ ] Update `sprint-status.yaml`: `7-13-adaptive-home-page-with-three-actions: done`
   - [ ] Delete `CreateMenuModal.tsx` if it exists
   - [ ] Create pull request

---

## File Changes Summary

### Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src/pages/Home.tsx` | Major Refactor | Conditional rendering, 3 buttons, premium logic |
| `src/components/AuthModal.tsx` | Cleanup | Remove sessionStorage logic |

### Files to Delete

| File | When to Delete | Why |
|------|----------------|-----|
| `src/components/CreateMenuModal.tsx` | After Story 7.13 is complete | Modal no longer needed |

### Files to Reference (No Changes)

| File | Purpose |
|------|---------|
| `src/services/PremiumService.ts` | Premium checks (isPremium, getTournamentCount, canCreateTournament) |
| `src/components/PaymentModal.tsx` | Premium gate for leagues and tournament limits |
| `src/context/AuthContext.tsx` | Authentication state |
| `src/hooks/useIdentity.ts` | Identity detection (authenticated or local user) |

---

## Testing Strategy

### Manual Testing Checklist

**Unauthenticated User**
- [ ] Home shows 2 buttons (Rejoindre, Créer)
- [ ] "CRÉER" opens AuthModal
- [ ] After auth, Home shows 3 buttons

**Authenticated Free User**
- [ ] Home shows 3 buttons
- [ ] Tournament badge: "X/2 restants 🆓"
- [ ] League badge: "🔒 Premium - 3€"
- [ ] Click tournament (within limit) → navigates
- [ ] Click tournament (limit reached) → error toast
- [ ] Click league → PaymentModal opens

**Authenticated Premium User**
- [ ] Tournament badge: "✨ Illimité"
- [ ] League badge: "✨ Premium"
- [ ] Click tournament → always navigates
- [ ] Click league → navigates to /league/create

### Automated Testing

**Unit Tests**: `src/pages/Home.test.tsx`
```bash
npm test src/pages/Home.test.tsx
```

**E2E Tests**: Playwright
```bash
npm run test:e2e
```

---

## Acceptance Criteria Mapping

| AC | Description | Test Method |
|----|-------------|-------------|
| AC1 | Unauthenticated home shows 2 buttons | Manual + E2E |
| AC2 | Authenticated free shows 3 buttons with limits | Manual + Unit + E2E |
| AC3 | Authenticated premium shows unlimited badges | Manual + Unit + E2E |
| AC4 | Tournament creation enforces limit | Manual + Integration |
| AC5 | League creation requires premium | Manual + Integration |
| AC6 | Rejoindre always works | Manual + E2E |

---

## Dependencies and Blockers

### Dependencies (Required)

- ✅ Story 7.2: PremiumService Implementation
- ✅ Story 7.11: PaymentModal Component
- ✅ Epic 2: Authentication System

### Blockers

**None** - All dependencies are satisfied.

---

## Timeline Estimate

| Phase | Estimated Time |
|-------|----------------|
| Understanding & Planning | 1 hour |
| Home.tsx Refactor | 4-6 hours |
| Testing | 2-3 hours |
| Code Review & Fixes | 1-2 hours |
| **Total** | **8-12 hours** (1-2 days) |

**Story Points**: 5

---

## Success Criteria

Story is complete when:

- ✅ All acceptance criteria met (AC1-AC6)
- ✅ Unauthenticated users see 2 buttons
- ✅ Authenticated users see 3 buttons with correct badges
- ✅ Premium badges display correctly for free and premium users
- ✅ Tournament limit enforcement works (toast + optional PaymentModal)
- ✅ League premium gate works (PaymentModal opens)
- ✅ Navigation flows work correctly
- ✅ No modal juggling or UI instability
- ✅ All tests pass (unit + integration + E2E)
- ✅ CreateMenuModal deleted (if it existed)
- ✅ Code reviewed and approved

---

## Common Questions

### Q1: What if CreateMenuModal doesn't exist yet?

**A**: Even better! You don't need to delete anything. Just implement the adaptive Home page directly.

### Q2: What if Story 7.5 or 7.6 were already partially implemented?

**A**: Follow the migration guide to remove modal-related code and replace it with the adaptive UI approach. See `7-13-MIGRATION-GUIDE.md` Step 1.

### Q3: How do I handle the tournament limit enforcement?

**A**: Use `premiumService.canCreateTournament(userId)`. If it returns `false`, show an error toast and optionally open the PaymentModal. See `7-13-MIGRATION-GUIDE.md` Step 3.

### Q4: Do I need to create a new page/route?

**A**: No! The Home page (`/`) adapts based on authentication status. No new routes needed.

### Q5: What about mobile responsiveness?

**A**: The 3 buttons should stack vertically on mobile (grid-cols-1). Ensure min 44px height for touch-friendly targets. See `7-13-adaptive-home-page-with-three-actions.md` Dev Notes.

---

## Related Stories

### Superseded by Story 7.13
- ❌ Story 7.5: Home Page UX with Single Create Button
- ❌ Story 7.6: Create Menu Modal Component

### Can Be Done in Parallel
- Story 7.7: Tournament Creation Limit Enforcement
- Story 7.8: Tournament Player Limit Enforcement
- Story 7.9: League Creation Premium Requirement

### Required Before Story 7.13
- ✅ Story 7.2: PremiumService Implementation
- ✅ Story 7.11: PaymentModal Component

---

## Contact and Support

**Questions or Issues?**

1. Review this README and related documentation
2. Check `7-13-MIGRATION-GUIDE.md` for common issues
3. Review `7-13-ARCHITECTURE-DECISION.md` for context
4. Consult team lead or scrum master

**Documentation Files:**

All documentation is in `_bmad-output/implementation-artifacts/`:
- `7-13-adaptive-home-page-with-three-actions.md`
- `7-13-ARCHITECTURE-DECISION.md`
- `7-13-IMPLEMENTATION-SUMMARY.md`
- `7-13-MIGRATION-GUIDE.md`
- `7-13-README.md` (this file)

---

**Ready to start?** → Open `7-13-MIGRATION-GUIDE.md` and follow Step 1!

**Last Updated**: 2026-01-30  
**Story Status**: Ready for Development  
**Next Step**: Begin implementation using migration guide
