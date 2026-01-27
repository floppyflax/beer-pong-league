# Story 2.4: Dual Identity State Management

Status: ready-for-dev

## Story

As a user,
I want the system to handle both authenticated and anonymous identities seamlessly,
So that I can switch between modes without losing functionality.

## Acceptance Criteria

**Given** the dual identity system
**When** user is authenticated
**Then** IdentityContext provides authenticated user data
**And** user can access all authenticated features
**When** user is anonymous
**Then** IdentityContext provides anonymous user data
**And** user can access guest features
**And** system handles identity switching smoothly
**And** localStorage and Supabase are synchronized correctly

## Tasks / Subtasks

- [ ] Review IdentityContext (AC: Context provides data)
  - [ ] Verify IdentityContext manages both identity types
  - [ ] Test getCurrentIdentity() returns correct type
  - [ ] Ensure context switches between types smoothly
  - [ ] Verify identity data is complete

- [ ] Test authenticated user mode (AC: Authenticated features)
  - [ ] Verify authenticated user data loads from Supabase
  - [ ] Test all authenticated features work
  - [ ] Ensure user profile is accessible
  - [ ] Verify user can create tournaments

- [ ] Test anonymous user mode (AC: Guest features)
  - [ ] Verify anonymous user data loads from localStorage
  - [ ] Test anonymous user can join tournaments
  - [ ] Ensure anonymous user can record matches
  - [ ] Verify stats are tracked correctly

- [ ] Test identity switching (AC: Switching smoothly)
  - [ ] Test anonymous → authenticated transition
  - [ ] Verify merge is triggered automatically
  - [ ] Ensure UI updates reflect new identity
  - [ ] Test authenticated → sign out → anonymous flow

- [ ] Test localStorage sync (AC: localStorage sync)
  - [ ] Verify localStorage stores current identity
  - [ ] Test data persists across page reloads
  - [ ] Ensure sync with Supabase works
  - [ ] Verify offline mode works for both types

- [ ] Test edge cases
  - [ ] Multiple devices with same anonymous user
  - [ ] Session expiration handling
  - [ ] Concurrent identity operations
  - [ ] Network offline/online transitions

## Dev Notes

### Existing Components

**IdentityContext.tsx:**
- Already exists in `src/context/IdentityContext.tsx`
- Manages both authenticated and anonymous users
- Should be reviewed and tested

**Context Structure:**

```typescript
interface IdentityContextType {
  // Current identity (authenticated or anonymous)
  identity: Identity | null;
  
  // Identity type
  identityType: 'authenticated' | 'anonymous' | null;
  
  // Loading states
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  refreshIdentity: () => Promise<void>;
  signOut: () => Promise<void>;
  mergeIdentity: () => Promise<void>;
}

type Identity = AuthenticatedIdentity | AnonymousIdentity;

interface AuthenticatedIdentity {
  type: 'authenticated';
  userId: string;
  email: string;
  displayName?: string;
  // ... other auth user fields
}

interface AnonymousIdentity {
  type: 'anonymous';
  anonymousUserId: string;
  deviceFingerprint: string;
  displayName?: string;
  // ... other anonymous fields
}
```

### Identity Management Flow

**1. On App Load:**
```typescript
// Check for authenticated session
const { data: { session } } = await supabase.auth.getSession();

if (session) {
  // Load authenticated user
  setIdentity({ type: 'authenticated', ...userData });
} else {
  // Check for anonymous user in localStorage
  const anonymousUserId = localStorage.getItem('anonymous_user_id');
  
  if (anonymousUserId) {
    // Load anonymous user
    const anonymousUser = await loadAnonymousUser(anonymousUserId);
    setIdentity({ type: 'anonymous', ...anonymousUser });
  } else {
    // No identity yet
    setIdentity(null);
  }
}
```

**2. On Authentication:**
```typescript
// User signs in with email + OTP
await supabase.auth.signInWithOtp({ email });

// On successful auth
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    // Check for anonymous user to merge
    const anonymousUserId = localStorage.getItem('anonymous_user_id');
    
    if (anonymousUserId) {
      // Trigger merge
      await IdentityMergeService.mergeAnonymousToAuth(
        anonymousUserId,
        session.user.id
      );
      
      // Clear anonymous user from localStorage
      localStorage.removeItem('anonymous_user_id');
    }
    
    // Set authenticated identity
    setIdentity({ type: 'authenticated', ...session.user });
  }
});
```

**3. On Tournament Join (Anonymous):**
```typescript
// User joins without account
if (!identity) {
  // Create anonymous user
  const anonymousUser = await AnonymousUserService.createAnonymousUser({
    device_fingerprint: await generateDeviceFingerprint(),
    display_name: userName
  });
  
  // Store in localStorage
  localStorage.setItem('anonymous_user_id', anonymousUser.id);
  
  // Set anonymous identity
  setIdentity({ type: 'anonymous', ...anonymousUser });
}
```

### Testing Checklist

**Manual Testing:**
1. Load app → No identity
2. Join tournament → Anonymous identity created
3. Play matches → Stats tracked
4. Sign in → Identity merged, authenticated
5. Sign out → Back to no identity
6. Reload page → Identity persists

**Edge Cases:**
- Session expires while playing
- Network goes offline mid-session
- Multiple tabs open (identity sync)
- Clear localStorage (identity lost)

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 2.4: Identity State Management]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture - Dual Identity]
- [Source: _bmad-output/planning-artifacts/prd.md#FR4.2: Gestion d'Identité Dual]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2: User Identity & Authentication]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Review/Test:**
- src/context/IdentityContext.tsx
- src/hooks/useIdentity.ts
- src/services/AnonymousUserService.ts
- src/services/AuthService.ts
- src/services/IdentityMergeService.ts
