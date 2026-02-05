# Migration Guide: Home.tsx Refactor (Story 7.13)

**Target**: Story 7.13 - Adaptive Home Page with Three Actions  
**Date**: 2026-01-30  
**Developer Guide**: Step-by-step migration from modal approach to adaptive UI

---

## Overview

This guide provides a detailed, step-by-step approach to refactor `Home.tsx` from the modal-based approach (Stories 7.5/7.6) to the adaptive UI approach (Story 7.13).

---

## Step 1: Remove Existing Modal Logic

### Files to Check

First, verify what's currently in the codebase:

```bash
# Check if CreateMenuModal was already created
ls src/components/CreateMenuModal.tsx

# Check current Home.tsx implementation
cat src/pages/Home.tsx
```

### Remove from Home.tsx

**Remove these imports:**
```typescript
import { CreateMenuModal } from "../components/CreateMenuModal";  // DELETE
```

**Remove these state variables:**
```typescript
const [showCreateMenu, setShowCreateMenu] = useState(false);  // DELETE
const [pendingAction, setPendingAction] = useState<'create' | null>(null);  // DELETE
```

**Remove sessionStorage logic:**
```typescript
// DELETE this entire useEffect
useEffect(() => {
  const pendingActionFromStorage = sessionStorage.getItem('pendingAction');
  if (pendingActionFromStorage === 'create' && hasIdentity) {
    sessionStorage.removeItem('pendingAction');
    setShowCreateMenu(true);
  }
}, [hasIdentity]);

// DELETE sessionStorage.setItem in handleCreateClick
sessionStorage.setItem('pendingAction', 'create');  // DELETE
```

**Remove modal JSX:**
```typescript
{/* DELETE this entire block */}
<CreateMenuModal
  isOpen={showCreateMenu}
  onClose={() => setShowCreateMenu(false)}
/>
```

---

## Step 2: Add Premium State Management

### Add New Imports

```typescript
import { useState, useEffect } from "react";
import { Plus, QrCode, Trophy, Users } from "lucide-react";  // Add Trophy, Users
import { premiumService } from "../services/PremiumService";
import { toast } from "react-hot-toast";  // For error messages
import { PaymentModal } from "../components/PaymentModal";  // For premium gate
```

### Add Premium State Variables

```typescript
const [isPremium, setIsPremium] = useState(false);
const [tournamentCount, setTournamentCount] = useState(0);
const [loadingPremium, setLoadingPremium] = useState(true);
const [showPaymentModal, setShowPaymentModal] = useState(false);
```

### Add Premium Data Fetching

```typescript
// Fetch premium status when user is authenticated
useEffect(() => {
  const fetchPremiumStatus = async () => {
    if (!hasIdentity) {
      setLoadingPremium(false);
      return;
    }
    
    try {
      setLoadingPremium(true);
      
      // Get user ID from auth or local identity
      const userId = isAuthenticated 
        ? (await supabase.auth.getUser()).data.user?.id 
        : localUser?.id;
      
      if (!userId) {
        setLoadingPremium(false);
        return;
      }
      
      // Fetch premium status and tournament count
      const premium = await premiumService.isPremium(userId);
      const count = await premiumService.getTournamentCount(userId);
      
      setIsPremium(premium);
      setTournamentCount(count);
      setLoadingPremium(false);
    } catch (error) {
      console.error('Error fetching premium status:', error);
      setLoadingPremium(false);
    }
  };
  
  fetchPremiumStatus();
}, [hasIdentity, isAuthenticated, localUser?.id]);
```

---

## Step 3: Update Button Click Handlers

### Replace handleCreateClick

**Old (Single Button):**
```typescript
const handleCreateClick = () => {
  if (!hasIdentity) {
    sessionStorage.setItem('pendingAction', 'create');
    setShowAuthModal(true);
  } else {
    setShowCreateMenu(true);
  }
};
```

**New (Unauthenticated Button):**
```typescript
const handleUnauthenticatedCreateClick = () => {
  setShowAuthModal(true);
  // No sessionStorage needed - page will re-render after auth
};
```

### Add New Handlers for Authenticated Buttons

```typescript
const handleCreateTournament = async () => {
  try {
    const userId = isAuthenticated 
      ? (await supabase.auth.getUser()).data.user?.id 
      : localUser?.id;
    
    if (!userId) return;
    
    // Check if user can create more tournaments
    const canCreate = await premiumService.canCreateTournament(userId);
    
    if (!canCreate) {
      toast.error("Limite de 2 tournois atteinte. Passe Premium pour créer sans limite !", {
        duration: 4000,
      });
      // Optionally open payment modal
      setShowPaymentModal(true);
      return;
    }
    
    // Navigate to tournament creation
    navigate('/tournament/create');
  } catch (error) {
    console.error('Error checking tournament limit:', error);
    toast.error("Erreur lors de la vérification. Réessaye.");
  }
};

const handleCreateLeague = async () => {
  try {
    const userId = isAuthenticated 
      ? (await supabase.auth.getUser()).data.user?.id 
      : localUser?.id;
    
    if (!userId) return;
    
    // Check if user is premium
    const premium = await premiumService.isPremium(userId);
    
    if (!premium) {
      // Open payment modal for premium gate
      setShowPaymentModal(true);
      return;
    }
    
    // Navigate to league creation
    navigate('/league/create');
  } catch (error) {
    console.error('Error checking premium status:', error);
    toast.error("Erreur lors de la vérification. Réessaye.");
  }
};
```

---

## Step 4: Update JSX Structure

### Unauthenticated View

**Replace existing button section with:**

```typescript
{!hasIdentity && !hasData && (
  <>
    <div className="flex flex-col items-center justify-center flex-grow space-y-8 py-12 px-6">
      <div className="space-y-4 text-center">
        <h1 className="text-5xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
          BEER PONG
          <br />
          LEAGUE
        </h1>
        <p className="text-slate-400 text-lg max-w-xs mx-auto">
          Deviens une légende. <br />
          Gère tes tournois et écrase tes potes.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {/* Bouton Rejoindre */}
        <button
          onClick={handleJoinTournament}
          className="w-full bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-accent text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 group"
        >
          <QrCode size={24} className="group-hover:scale-110 transition-transform" />
          <span>REJOINDRE UN TOURNOI</span>
        </button>

        {/* Bouton Créer (opens AuthModal) */}
        <button
          onClick={handleUnauthenticatedCreateClick}
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-amber-600 hover:to-red-600 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 group shadow-lg"
        >
          <Plus size={24} className="group-hover:rotate-90 transition-transform" />
          <span>CRÉER TOURNOI / LIGUE</span>
        </button>

        <p className="text-xs text-slate-500 text-center pt-2">
          Tu peux rejoindre sans compte, ou te connecter pour créer tes propres tournois
        </p>
      </div>
    </div>

    {/* Modals */}
    <AuthModal
      isOpen={showAuthModal}
      onClose={() => setShowAuthModal(false)}
      onSuccess={() => setShowAuthModal(false)}
    />
  </>
)}
```

### Authenticated View

**Add this section after existing tournaments/leagues lists:**

```typescript
{hasIdentity && (
  <>
    <div className="flex flex-col items-center justify-center flex-grow space-y-10 py-12 px-6">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
          BEER PONG
          <br />
          LEAGUE
        </h1>
        <p className="text-slate-400 text-lg max-w-xs mx-auto">
          Deviens une légende. <br />
          Gère tes tournois et écrase tes potes.
        </p>
      </div>

      <div className="w-full max-w-2xl space-y-4">
        {/* Existing tournaments list */}
        {tournaments.length > 0 && (
          <div className="pt-4 w-full">
            {/* ... existing tournament list JSX ... */}
          </div>
        )}

        {/* Existing leagues list */}
        {leagues.length > 0 && (
          <div className="pt-4 w-full">
            {/* ... existing leagues list JSX ... */}
          </div>
        )}

        {/* NEW: 3 Action Buttons */}
        <div className="grid grid-cols-1 gap-3 pt-6">
          {/* Bouton 1: Rejoindre un Tournoi */}
          <button
            onClick={handleJoinTournament}
            className="bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-accent text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 group"
          >
            <QrCode size={24} className="group-hover:scale-110 transition-transform" />
            <span>REJOINDRE UN TOURNOI</span>
          </button>

          {/* Bouton 2: Créer un Tournoi */}
          <button
            onClick={handleCreateTournament}
            disabled={loadingPremium}
            className="bg-gradient-to-r from-primary to-accent hover:from-amber-600 hover:to-red-600 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-between group shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <Trophy size={24} className="group-hover:scale-110 transition-transform" />
              <span>CRÉER UN TOURNOI</span>
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded">
              {loadingPremium ? "..." : isPremium ? "✨ Illimité" : `${tournamentCount}/2 restants 🆓`}
            </span>
          </button>

          {/* Bouton 3: Créer une Ligue */}
          <button
            onClick={handleCreateLeague}
            disabled={loadingPremium}
            className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-between group shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <Users size={24} className="group-hover:scale-110 transition-transform" />
              <span>CRÉER UNE LIGUE</span>
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded">
              {loadingPremium ? "..." : isPremium ? "✨ Premium" : "🔒 Premium - 3€"}
            </span>
          </button>
        </div>
      </div>
    </div>

    {/* Modals */}
    <PaymentModal
      isOpen={showPaymentModal}
      onClose={() => setShowPaymentModal(false)}
    />
  </>
)}
```

---

## Step 5: Update AuthModal (Remove sessionStorage)

### File: `src/components/AuthModal.tsx`

**Find and remove:**

```typescript
// DELETE this entire useEffect
useEffect(() => {
  const pendingActionFromStorage = sessionStorage.getItem('pendingAction');
  if (pendingActionFromStorage === 'create' && hasIdentity) {
    sessionStorage.removeItem('pendingAction');
    setShowCreateMenu(true);
  }
}, [hasIdentity]);
```

**Find and simplify:**

```typescript
// OLD
const handleAuthSuccess = () => {
  setShowAuthModal(false);
  // Check sessionStorage for pending action
  const pendingAction = sessionStorage.getItem('pendingAction');
  if (pendingAction === 'create') {
    sessionStorage.removeItem('pendingAction');
    setShowCreateMenu(true);
  }
};

// NEW
const handleAuthSuccess = () => {
  setShowAuthModal(false);
  // Home will automatically re-render to show authenticated view
  // No manual orchestration needed
};
```

---

## Step 6: Delete CreateMenuModal (If It Exists)

```bash
# Check if file exists
ls src/components/CreateMenuModal.tsx

# If it exists, delete it
rm src/components/CreateMenuModal.tsx
```

---

## Step 7: Testing Checklist

### Manual Testing

- [ ] **Unauthenticated user**:
  - [ ] See 2 buttons (Rejoindre, Créer)
  - [ ] Click "CRÉER" opens AuthModal
  - [ ] After auth, page shows 3 buttons

- [ ] **Authenticated free user**:
  - [ ] See 3 buttons with correct badges
  - [ ] Tournament badge shows "X/2 restants 🆓"
  - [ ] League badge shows "🔒 Premium - 3€"
  - [ ] Click tournament (within limit) → navigates to `/tournament/create`
  - [ ] Click tournament (limit reached) → shows error toast
  - [ ] Click league → opens PaymentModal

- [ ] **Authenticated premium user**:
  - [ ] Tournament badge shows "✨ Illimité"
  - [ ] League badge shows "✨ Premium"
  - [ ] Click tournament → always navigates (no limit)
  - [ ] Click league → navigates to `/league/create`

### Unit Tests

Run existing tests and update as needed:

```bash
npm test src/pages/Home.test.tsx
```

### E2E Tests

Run Playwright tests:

```bash
npm run test:e2e
```

---

## Step 8: Code Review Checklist

Before submitting for review:

- [ ] All sessionStorage logic removed
- [ ] CreateMenuModal not imported anywhere
- [ ] Premium status fetching works correctly
- [ ] Tournament limit enforcement works
- [ ] League premium gate works
- [ ] Navigation flows work correctly
- [ ] Loading states handled properly
- [ ] Error handling with toast messages
- [ ] Responsive design maintained
- [ ] All tests pass

---

## Common Issues and Solutions

### Issue 1: Premium status not loading

**Symptom**: Badges show "..." indefinitely

**Solution**: Check that `PremiumService.isPremium()` and `getTournamentCount()` are working correctly. Verify user ID is being passed.

```typescript
console.log('User ID:', userId);
console.log('Premium status:', await premiumService.isPremium(userId));
console.log('Tournament count:', await premiumService.getTournamentCount(userId));
```

### Issue 2: Tournament count not updating after creation

**Symptom**: Badge still shows old count after creating tournament

**Solution**: Add refresh logic in useEffect or re-fetch premium status on navigation back to Home:

```typescript
// In Home.tsx
useEffect(() => {
  fetchPremiumStatus(); // Refetch when component mounts
}, []);
```

### Issue 3: Toast messages not showing

**Symptom**: No error message when limit is reached

**Solution**: Ensure `react-hot-toast` is installed and `<Toaster />` is rendered in App.tsx:

```bash
npm install react-hot-toast
```

```typescript
// In App.tsx
import { Toaster } from 'react-hot-toast';

<Toaster position="top-center" />
```

---

## Rollback Plan

If issues occur, rollback strategy:

1. Revert Home.tsx to previous version: `git checkout HEAD~1 src/pages/Home.tsx`
2. Restore CreateMenuModal if needed
3. Restore sessionStorage logic in AuthModal
4. Report issues and debug before re-attempting

---

## Success Metrics

✅ No modal juggling or UI instability  
✅ Clear, predictable user experience  
✅ Freemium limitations visible immediately  
✅ All navigation flows work correctly  
✅ All tests pass  
✅ Code is cleaner and more maintainable  

---

**Migration Complete**: Mark Story 7.13 as **done** in sprint-status.yaml
