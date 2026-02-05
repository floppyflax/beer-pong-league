# Story 7.13 Implementation Summary

**Date**: 2026-01-30  
**Status**: Ready for Development  
**Story**: 7-13-adaptive-home-page-with-three-actions.md

---

## Executive Summary

Story 7.13 introduces a new approach for the home page UX that **replaces** the modal-based approach from Stories 7.5 and 7.6. The home page now adapts based on authentication status, showing 3 distinct action buttons when connected, eliminating the need for a modal and providing a more stable user experience.

---

## What Changed

### Before (Stories 7.5 + 7.6)
- **Single button**: "CRÉER TOURNOI / LIGUE"
- **Modal approach**: Clicking opened `CreateMenuModal` to choose action
- **Problem**: Modal state juggling after authentication caused UI instability

### After (Story 7.13)
- **Three buttons**: "REJOINDRE UN TOURNOI" + "CRÉER UN TOURNOI" + "CRÉER UNE LIGUE"
- **Adaptive UI**: Home page adapts based on authentication status
- **Benefit**: No modal, no state complexity, freemium limits visible immediately

---

## User Experience Flow

### Unauthenticated User

```
Home Page
├─ REJOINDRE UN TOURNOI → /tournament/join (no auth needed)
└─ CRÉER TOURNOI / LIGUE → Opens AuthModal
```

After authentication, page automatically re-renders to show authenticated view.

### Authenticated User (Free Tier)

```
Home Page
├─ REJOINDRE UN TOURNOI → /tournament/join
├─ CRÉER UN TOURNOI → /tournament/create (if limit not reached)
│   └─ Badge: "2/2 restants 🆓"
│   └─ If limit reached: Show error toast + optional PaymentModal
└─ CRÉER UNE LIGUE → Opens PaymentModal (premium required)
    └─ Badge: "🔒 Premium - 3€"
```

### Authenticated User (Premium)

```
Home Page
├─ REJOINDRE UN TOURNOI → /tournament/join
├─ CRÉER UN TOURNOI → /tournament/create (no limit)
│   └─ Badge: "✨ Illimité"
└─ CRÉER UNE LIGUE → /league/create
    └─ Badge: "✨ Premium"
```

---

## Technical Implementation

### Key Components

**Home.tsx** (refactored)
- Conditional rendering based on `hasIdentity` (isAuthenticated || localUser)
- `<HomeUnauthenticated />`: 2 buttons
- `<HomeAuthenticated />`: 3 buttons with premium logic

**PremiumService** (existing)
- `isPremium()`: Check user premium status
- `getTournamentCount()`: Get current tournament count
- `canCreateTournament()`: Check if user can create more tournaments
- `canCreateLeague()`: Check if user has premium access

**PaymentModal** (existing)
- Opens when free user tries to create a league
- Opens optionally when free user hits tournament limit

### State Management

**No sessionStorage orchestration needed**

```typescript
// Simple conditional rendering
const Home = () => {
  const hasIdentity = isAuthenticated || localUser;
  
  if (!hasIdentity) {
    return <HomeUnauthenticated />;
  }
  
  return <HomeAuthenticated />;
}
```

### Premium Checks

**On component mount:**
```typescript
const [isPremium, setIsPremium] = useState(false);
const [tournamentCount, setTournamentCount] = useState(0);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchPremiumStatus = async () => {
    const premium = await premiumService.isPremium(userId);
    const count = await premiumService.getTournamentCount(userId);
    setIsPremium(premium);
    setTournamentCount(count);
    setLoading(false);
  };
  
  if (hasIdentity) {
    fetchPremiumStatus();
  }
}, [hasIdentity, userId]);
```

**On button click:**
```typescript
const handleCreateTournament = async () => {
  const canCreate = await premiumService.canCreateTournament(userId);
  
  if (!canCreate) {
    toast.error("Limite de 2 tournois atteinte. Passe Premium pour créer sans limite !");
    // Optional: setShowPaymentModal(true);
    return;
  }
  
  navigate('/tournament/create');
};

const handleCreateLeague = async () => {
  const premium = await premiumService.isPremium(userId);
  
  if (!premium) {
    setShowPaymentModal(true);
    return;
  }
  
  navigate('/league/create');
};
```

---

## File Changes

### Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src/pages/Home.tsx` | Major Refactor | Conditional rendering, 3 buttons, premium logic |
| `src/components/AuthModal.tsx` | Cleanup | Remove sessionStorage pendingAction logic |

### Files to Deprecate/Delete

| File | Status | Reason |
|------|--------|--------|
| `src/components/CreateMenuModal.tsx` | Delete | Modal approach no longer used |

### Files to Reference (No Changes)

| File | Purpose |
|------|---------|
| `src/services/PremiumService.ts` | Premium status and limit checks |
| `src/components/PaymentModal.tsx` | Premium gate for leagues and limits |
| `src/context/AuthContext.tsx` | Authentication state |
| `src/hooks/useIdentity.ts` | Identity detection |

---

## Story Dependencies

### Required (Must be Implemented)
- ✅ Story 7.2: PremiumService Implementation
- ✅ Story 7.11: PaymentModal Component
- ✅ Epic 2: Authentication System

### Superseded (No Longer Needed)
- ❌ Story 7.5: Home Page UX with Single Create Button (superseded by 7.13)
- ❌ Story 7.6: Create Menu Modal Component (deprecated)

### Related (Can be Done in Parallel)
- Story 7.7: Tournament Creation Limit Enforcement
- Story 7.8: Tournament Player Limit Enforcement
- Story 7.9: League Creation Premium Requirement

---

## Testing Strategy

### Unit Tests

**HomeUnauthenticated**
- ✅ Renders 2 buttons correctly
- ✅ "REJOINDRE" navigates to `/tournament/join`
- ✅ "CRÉER" opens AuthModal

**HomeAuthenticated (Free User)**
- ✅ Renders 3 buttons correctly
- ✅ Tournament badge shows "X/2 restants 🆓"
- ✅ League badge shows "🔒 Premium - 3€"
- ✅ Tournament click navigates if limit not reached
- ✅ Tournament click shows error toast if limit reached
- ✅ League click opens PaymentModal

**HomeAuthenticated (Premium User)**
- ✅ Tournament badge shows "✨ Illimité"
- ✅ League badge shows "✨ Premium"
- ✅ Tournament click always navigates (no limit)
- ✅ League click always navigates (no gate)

### Integration Tests

- ✅ Auth flow: unauthenticated → click CRÉER → auth → see 3 buttons
- ✅ Premium status updates after payment success
- ✅ Tournament count updates after tournament creation

### E2E Tests

- ✅ Full user journey: connect → see options → create tournament
- ✅ Limit enforcement: free user creates 2 tournaments, 3rd blocked
- ✅ Premium gate: free user tries to create league, sees payment modal

---

## Design Guidelines

### Button Styling

**Rejoindre (Secondary)**
```css
bg-slate-800 hover:bg-slate-700
border-2 border-slate-700 hover:border-accent
text-white font-bold py-4 px-6 rounded-xl
```

**Créer Tournoi (Primary)**
```css
bg-gradient-to-r from-primary to-accent
hover:from-amber-600 hover:to-red-600
text-white font-bold py-4 px-6 rounded-xl shadow-lg
```

**Créer Ligue (Premium)**
```css
bg-gradient-to-r from-amber-500 to-yellow-600
hover:from-amber-600 hover:to-yellow-700
text-white font-bold py-4 px-6 rounded-xl shadow-lg
```

### Responsive Design

**Mobile (< 768px)**
- Vertical stack of 3 buttons
- Full width buttons (w-full)
- Gap between buttons (gap-3)

**Desktop (≥ 768px)**
- Can remain vertical or use grid (2 columns)
- Maintain min 44px touch target height

### Badge Display

**Position**: Top-right of button or below button text  
**Size**: text-xs (12px)  
**Style**: Inline with icon or separate line

---

## Migration Notes

### For Developers Currently Working on Story 7.5 or 7.6

**Stop work on:**
- Story 7.5 (Home Page UX with Single Create Button)
- Story 7.6 (Create Menu Modal Component)

**Switch to:**
- Story 7.13 (Adaptive Home Page with Three Actions)

**Key Differences:**
- No modal needed
- No sessionStorage orchestration
- Premium checks on Home page instead of modal
- Direct navigation instead of modal selection

### For Code Reviewers

**Check for:**
- ✅ CreateMenuModal not imported or used
- ✅ No sessionStorage pendingAction logic
- ✅ Conditional rendering based on hasIdentity
- ✅ Premium badges display correctly
- ✅ Limit enforcement works correctly
- ✅ PaymentModal integration works

---

## Timeline Estimate

**Story Points**: 5  
**Estimated Duration**: 1-2 days  

**Breakdown:**
- Home.tsx refactor: 4-6 hours
- Premium logic integration: 2-3 hours
- Testing: 2-3 hours
- Code review and fixes: 1-2 hours

---

## Success Criteria

✅ Unauthenticated users see 2 buttons  
✅ Authenticated users see 3 buttons with correct badges  
✅ Premium badges display correctly for free and premium users  
✅ Tournament limit enforcement works (error toast on limit)  
✅ League premium gate works (PaymentModal opens)  
✅ Navigation flows work correctly  
✅ No modal juggling or UI instability  
✅ All tests pass (unit, integration, E2E)  
✅ CreateMenuModal deleted after successful implementation  

---

## References

- **Story File**: `7-13-adaptive-home-page-with-three-actions.md`
- **Architecture Decision**: `7-13-ARCHITECTURE-DECISION.md`
- **Sprint Status**: `sprint-status.yaml` (7-5: superseded, 7-6: deprecated, 7-13: ready-for-dev)
- **Party Mode Discussion**: 2026-01-30 (Sally, Winston, Paige)

---

**Ready for Implementation**: Yes ✅  
**Blockers**: None  
**Dependencies**: All satisfied (PremiumService ✅, PaymentModal ✅, Auth ✅)
