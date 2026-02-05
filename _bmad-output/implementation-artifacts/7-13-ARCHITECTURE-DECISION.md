# Architecture Decision Record: Adaptive Home Page Approach

Date: 2026-01-30
Status: Accepted
Decision Makers: floppyflax, BMAD Agents (Sally, Winston, Paige)

## Context and Problem Statement

The original approach for the home page freemium UX (Stories 7.5 and 7.6) used a single "CRÉER TOURNOI / LIGUE" button that opened a modal (`CreateMenuModal`) to let users choose between creating a tournament or a league.

**Problem encountered:**
- After user authentication, the modal state was managed through `sessionStorage` and component re-renders
- This caused UI instability: "the modal jiggles, closes, and returns to the home page"
- The orchestration was fragile and created a poor user experience
- Users reported confusion and frustration with the modal behavior

**User feedback:**
> "Ça marche pas bien. La modale se jauge, puis elle se referme, puis je retourne sur la page en question."

## Decision Drivers

1. **User Experience**: Stable, predictable interface without unexpected closures
2. **Technical Simplicity**: Minimize state management complexity
3. **Transparency**: Show freemium limitations immediately without hidden gates
4. **Mobile-Friendly**: Clear, touch-friendly buttons with adequate spacing
5. **Maintainability**: Reduce fragile state orchestration code

## Considered Options

### Option 1: Fix the Modal Orchestration (Rejected)
**Approach**: Keep the CreateMenuModal approach, fix the sessionStorage juggling
- ✅ Minimal code changes
- ✅ Preserves existing Story 7.6 work
- ❌ Still relies on fragile state management
- ❌ Modal can still feel disconnected from auth flow
- ❌ Doesn't address root cause of instability

### Option 2: Separate Navigation Page (Rejected)
**Approach**: Create a new `/create` route that users navigate to after auth
- ✅ Clean URL-based state management
- ✅ No modal complexity
- ❌ Extra navigation step (Home → Auth → Create Page → Tournament/League)
- ❌ Introduces new route just for action selection
- ❌ User has to "leave" home to see options

### Option 3: Adaptive Home Page (Selected)
**Approach**: Home page adapts based on authentication state, showing 3 distinct buttons when authenticated
- ✅ No additional navigation or routes needed
- ✅ Eliminates modal and sessionStorage orchestration entirely
- ✅ Freemium limitations visible immediately on buttons
- ✅ Natural progression: connect → see options → choose action
- ✅ Cleaner, more maintainable code
- ✅ Better mobile UX (3 stacked buttons vs modal)
- ❌ Requires refactoring Home.tsx

## Decision Outcome

**Chosen option: Adaptive Home Page (Option 3)**

### Implementation Details

**Unauthenticated Home:**
```
┌─────────────────────────┐
│  BEER PONG LEAGUE       │
├─────────────────────────┤
│ 🔍 REJOINDRE UN TOURNOI │
├─────────────────────────┤
│ ➕ CRÉER TOURNOI/LIGUE  │ ← Opens AuthModal
└─────────────────────────┘
```

**Authenticated Home (Free User):**
```
┌─────────────────────────┐
│  BEER PONG LEAGUE       │
├─────────────────────────┤
│ 🔍 REJOINDRE UN TOURNOI │
├─────────────────────────┤
│ 🏆 CRÉER UN TOURNOI     │ ← Badge: "2/2 🆓"
├─────────────────────────┤
│ 👥 CRÉER UNE LIGUE      │ ← Badge: "🔒 Premium - 3€"
└─────────────────────────┘
```

**Authenticated Home (Premium User):**
```
┌─────────────────────────┐
│  BEER PONG LEAGUE       │
├─────────────────────────┤
│ 🔍 REJOINDRE UN TOURNOI │
├─────────────────────────┤
│ 🏆 CRÉER UN TOURNOI     │ ← Badge: "✨ Illimité"
├─────────────────────────┤
│ 👥 CRÉER UNE LIGUE      │ ← Badge: "✨ Premium"
└─────────────────────────┘
```

### Architectural Benefits

**State Management Simplification:**
```typescript
// BEFORE (Modal Approach):
const [showCreateMenu, setShowCreateMenu] = useState(false);
const [showAuthModal, setShowAuthModal] = useState(false);
const [pendingAction, setPendingAction] = useState<'create' | null>(null);
sessionStorage.setItem('pendingAction', 'create'); // Fragile!

// AFTER (Adaptive Approach):
const hasIdentity = isAuthenticated || localUser;
if (!hasIdentity) {
  return <HomeUnauthenticated />;
}
return <HomeAuthenticated />; // Clean, simple conditional rendering
```

**Navigation Flow:**
```
// BEFORE:
Home → Click CRÉER → AuthModal → sessionStorage → 
Home re-renders → Check sessionStorage → Open Modal → Choose option

// AFTER:
Home → Click CRÉER → AuthModal → 
Home re-renders (hasIdentity=true) → 3 buttons visible → Click → Direct navigation
```

### Consequences

**Positive:**
- Eliminates modal state complexity entirely
- No sessionStorage orchestration needed
- Freemium limitations visible at a glance
- Natural, predictable user experience
- Easier to test (no modal timing issues)
- More maintainable code

**Negative:**
- Story 7.6 (CreateMenuModal) work is deprecated
- `CreateMenuModal.tsx` file becomes unused (should be deleted)
- Requires refactor of existing Home.tsx implementation

**Neutral:**
- Story 7.13 replaces Stories 7.5 and 7.6
- Premium checks now happen on Home page instead of modal
- Button count increases from 2 to 3 (still manageable on mobile)

## Related Stories

- **Story 7.5**: Home Page UX with Single Create Button - **SUPERSEDED by 7.13**
- **Story 7.6**: Create Menu Modal Component - **DEPRECATED (not needed)**
- **Story 7.13**: Adaptive Home Page with Three Actions - **NEW (replaces 7.5 and 7.6)**
- Story 7.2: PremiumService Implementation - **DEPENDENCY (needed for limits)**
- Story 7.11: PaymentModal Component - **DEPENDENCY (needed for premium gate)**

## Notes

This decision was made collaboratively during a BMAD Party Mode session on 2026-01-30, involving:
- **Sally** (UX Designer): Identified UX benefits of adaptive approach
- **Winston** (Architect): Analyzed architectural simplification
- **Paige** (Technical Writer): Structured specifications

The user (floppyflax) approved this direction with:
> "C'est la page qu'on voit quand on est connecté. [...] Ça devient la home connectée, en fait."

## Implementation Plan

1. ✅ Create Story 7.13 with detailed acceptance criteria
2. ✅ Document this architecture decision
3. ⏳ Implement Story 7.13 (adaptive Home.tsx)
4. ⏳ Mark Story 7.5 as superseded
5. ⏳ Mark Story 7.6 as deprecated
6. ⏳ Delete `CreateMenuModal.tsx` after Story 7.13 is complete
7. ⏳ Update sprint status to reflect new story priorities
