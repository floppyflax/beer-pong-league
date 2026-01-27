# Story 2.2: Anonymous User Support

Status: ready-for-dev

## Story

As a user,
I want to play without creating an account,
So that I can start playing immediately without any friction.

## Acceptance Criteria

**Given** a user wants to play without account
**When** they join a tournament
**Then** anonymous user is created with device fingerprint
**And** anonymous user data is stored in `anonymous_users` table
**And** anonymous user can play and record matches
**And** anonymous user data is stored in localStorage
**And** anonymous user can later create account to preserve stats

## Tasks / Subtasks

- [ ] Review AnonymousUserService (AC: Anonymous user created)
  - [ ] Verify AnonymousUserService.createAnonymousUser() works
  - [ ] Test device fingerprint generation
  - [ ] Ensure anonymous_users table insert works
  - [ ] Verify anonymous_user_id is generated correctly

- [ ] Test device fingerprinting (AC: Device fingerprint)
  - [ ] Verify deviceFingerprint.ts utility works
  - [ ] Test fingerprint is unique per device
  - [ ] Ensure fingerprint is stable across sessions
  - [ ] Test on multiple browsers/devices

- [ ] Verify anonymous user data storage (AC: Data stored)
  - [ ] Test anonymous user data saves to Supabase
  - [ ] Verify localStorage fallback works
  - [ ] Ensure data syncs when online
  - [ ] Test offline mode works

- [ ] Test anonymous user gameplay (AC: Can play)
  - [ ] Verify anonymous user can join tournaments
  - [ ] Test anonymous user can record matches
  - [ ] Ensure anonymous user stats are tracked
  - [ ] Verify anonymous user appears in leaderboards

- [ ] Test account creation flow (AC: Create account later)
  - [ ] Verify anonymous user can access auth modal
  - [ ] Test identity merge is triggered on auth
  - [ ] Ensure stats are preserved after merge
  - [ ] Verify anonymous user sees upgrade prompt

## Dev Notes

### Existing Components

**AnonymousUserService.ts:**
- Already exists in `src/services/AnonymousUserService.ts`
- Handles anonymous user creation and management
- Should be reviewed and tested

**deviceFingerprint.ts:**
- Already exists in `src/utils/deviceFingerprint.ts`
- Generates unique device identifier
- Should be reviewed and tested

**IdentityContext.tsx:**
- Already exists in `src/context/IdentityContext.tsx`
- Manages both authenticated and anonymous users
- Should be reviewed and tested

### Database Schema

**anonymous_users table:**
```sql
CREATE TABLE anonymous_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_fingerprint TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  merged_to_user_id UUID REFERENCES auth.users(id),
  merged_at TIMESTAMP WITH TIME ZONE
);
```

### Anonymous User Flow

**1. User Joins Tournament:**
```typescript
// Check if user has identity
const identity = IdentityContext.getCurrentIdentity();

if (!identity) {
  // Create anonymous user
  const fingerprint = await generateDeviceFingerprint();
  const anonymousUser = await AnonymousUserService.createAnonymousUser({
    device_fingerprint: fingerprint,
    display_name: userEnteredName
  });
  
  // Store in localStorage
  localStorage.setItem('anonymous_user_id', anonymousUser.id);
  
  // Update IdentityContext
  IdentityContext.setAnonymousUser(anonymousUser);
}
```

**2. Anonymous User Plays:**
- All tournament_players records use anonymous_user_id
- All matches reference anonymous_user_id
- All stats tracked in league_players with anonymous_user_id
- Data stored in localStorage with Supabase sync

**3. User Creates Account:**
- Identity merge flow triggered (Story 2.3)
- All anonymous data migrated to authenticated user
- Anonymous user marked as merged

### Testing Checklist

**Manual Testing:**
1. Join tournament without account → Anonymous user created
2. Play matches → Stats tracked
3. Go offline → Data saved to localStorage
4. Come back online → Data synced
5. Create account → Stats preserved

**Edge Cases:**
- Multiple devices (same user, different fingerprints)
- Browser private mode (new fingerprint each time)
- Clear localStorage (fingerprint regenerated)
- Offline for extended period

### Project Structure Notes

**Dual Identity System:**
- IdentityContext manages both auth users and anonymous users
- All services check identity type before operations
- localStorage used as offline fallback for both types
- Supabase used for persistence when online

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 2.2: Anonymous User Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture - Anonymous Users]
- [Source: _bmad-output/planning-artifacts/prd.md#FR4.2: Gestion d'Identité Dual]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2: User Identity & Authentication]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Review/Test:**
- src/services/AnonymousUserService.ts
- src/utils/deviceFingerprint.ts
- src/context/IdentityContext.tsx
- src/services/LocalUserService.ts

**Database Tables:**
- anonymous_users (verify schema and RLS policies)
