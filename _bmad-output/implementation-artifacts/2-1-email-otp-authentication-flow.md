# Story 2.1: Email + OTP Authentication Flow

Status: ready-for-dev

## Story

As a user,
I want to authenticate with email + OTP,
So that I can create an account without managing passwords and preserve my stats across devices.

## Acceptance Criteria

**Given** a user wants to create an account
**When** they enter their email in the auth modal
**Then** OTP is sent via Supabase Auth
**And** user receives email with magic link
**And** clicking the link authenticates the user
**And** user session is maintained
**And** user profile is created in Supabase `users` table
**And** user can sign out

## Tasks / Subtasks

- [ ] Verify Supabase Auth configuration (AC: OTP sent)
  - [ ] Check Supabase project has Email provider enabled
  - [ ] Verify email templates are configured
  - [ ] Test OTP/magic link email delivery
  - [ ] Ensure redirect URLs are configured

- [ ] Review and test AuthModal component (AC: Email entry)
  - [ ] Verify AuthModal accepts email input
  - [ ] Ensure Zod validation for email format
  - [ ] Test AuthModal triggers OTP request
  - [ ] Verify error handling for invalid emails

- [ ] Review and test AuthService (AC: Authentication)
  - [ ] Verify AuthService.signInWithOTP() works
  - [ ] Test magic link authentication flow
  - [ ] Ensure session is created and persisted
  - [ ] Test session refresh works

- [ ] Verify user profile creation (AC: Profile created)
  - [ ] Confirm user record is created on first auth
  - [ ] Verify user_id is properly set
  - [ ] Test profile data is accessible
  - [ ] Ensure created_at timestamp is correct

- [ ] Test sign-out functionality (AC: Sign out)
  - [ ] Verify AuthService.signOut() works
  - [ ] Test session is cleared
  - [ ] Ensure user is redirected appropriately
  - [ ] Verify localStorage is cleaned up

- [ ] End-to-end authentication testing
  - [ ] Test complete flow from email to authenticated
  - [ ] Verify session persistence across page reloads
  - [ ] Test authentication on mobile devices
  - [ ] Ensure error messages are user-friendly

## Dev Notes

### Existing Components

**AuthModal.tsx:**
- Already exists in `src/components/AuthModal.tsx`
- Uses AuthService for authentication
- Should be reviewed and tested

**AuthService.ts:**
- Already exists in `src/services/AuthService.ts`
- Handles Supabase Auth operations
- Should be reviewed and tested

**AuthContext.tsx:**
- Already exists in `src/context/AuthContext.tsx`
- Provides authentication state
- Should be reviewed and tested

### Supabase Configuration

**Email Provider Settings:**
- Go to Supabase Dashboard → Authentication → Providers
- Ensure Email provider is enabled
- Configure email templates (Confirm signup, Magic Link)
- Set redirect URLs: `https://your-domain.vercel.app/auth/callback`

**Test Authentication:**
```typescript
import { supabase } from '@/lib/supabase';

// Sign in with OTP
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});

// Get session
const { data: { session } } = await supabase.auth.getSession();

// Sign out
await supabase.auth.signOut();
```

### Testing Checklist

**Manual Testing:**
1. Enter valid email → Receive OTP email
2. Click magic link → User authenticated
3. Session persists across page reloads
4. Sign out → Session cleared
5. Invalid email → Error message displayed

**Edge Cases:**
- Email doesn't exist (should still send OTP)
- User cancels before clicking link
- Link expires (default: 1 hour)
- Multiple OTP requests

### Project Structure Notes

**Authentication Flow:**
1. User enters email in AuthModal
2. AuthService calls Supabase Auth signInWithOtp
3. Supabase sends magic link to email
4. User clicks link → redirected to /auth/callback
5. AuthCallback page exchanges token for session
6. AuthContext updates with authenticated user
7. User is redirected to intended page

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 2.1: Authentication Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns - Authentication Flow]
- [Source: _bmad-output/planning-artifacts/prd.md#FR4.1: Authentification Optionnelle]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2: User Identity & Authentication]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Review/Test:**
- src/components/AuthModal.tsx
- src/services/AuthService.ts
- src/context/AuthContext.tsx
- src/pages/AuthCallback.tsx

**Configuration to Verify:**
- Supabase Dashboard → Authentication → Providers (Email)
- Supabase Dashboard → Authentication → URL Configuration
- Environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLIC_KEY)
