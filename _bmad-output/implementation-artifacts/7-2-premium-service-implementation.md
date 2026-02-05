# Story 7.2: PremiumService Implementation

Status: ready-for-dev

## Story

As a developer,
I want a centralized service to check premium status and limits,
so that all features can consistently enforce freemium restrictions.

## Acceptance Criteria

1. **Given** the need for premium limit checking
   **When** I implement PremiumService
   **Then** `src/services/PremiumService.ts` is created
   **And** service has `isPremium(userId, isAnonymous)` method
   **And** service has `canCreateTournament(userId, isAnonymous)` method that returns `{ allowed: boolean, remaining?: number, reason?: string, message?: string }`
   **And** service has `canCreateLeague(userId, isAnonymous)` method that returns boolean
   **And** service has `getTournamentPlayerLimit(userId, isAnonymous)` method that returns `number | null` (6 for free, null for premium)
   **And** service has `getTournamentCount(userId, isAnonymous)` method to count user's tournaments
   **And** service checks database for premium status
   **And** service enforces limit of 2 tournaments for free users
   **And** service enforces limit of 6 players per tournament for free users
   **And** service blocks league creation for free users
   **And** all methods handle both authenticated and anonymous users

## Tasks / Subtasks

- [ ] Task 1: Create PremiumService class structure (AC: 1)
  - [ ] Create `src/services/PremiumService.ts`
  - [ ] Import supabase client and types
  - [ ] Create PremiumService class following existing service patterns
  - [ ] Export singleton instance
- [ ] Task 2: Implement isPremium method (AC: 1)
  - [ ] Query `users.is_premium` for authenticated users
  - [ ] Query `anonymous_users.is_premium` for anonymous users
  - [ ] Handle offline scenario with localStorage fallback
  - [ ] Return boolean result
- [ ] Task 3: Implement getTournamentCount method (AC: 1)
  - [ ] Query tournaments by `creator_user_id` for authenticated users
  - [ ] Query tournaments by `creator_anonymous_user_id` for anonymous users
  - [ ] Count tournaments created by user
  - [ ] Handle offline scenario
  - [ ] Return count number
- [ ] Task 4: Implement canCreateTournament method (AC: 1)
  - [ ] Check if user is premium (if yes, return `{ allowed: true }`)
  - [ ] Get tournament count using `getTournamentCount`
  - [ ] If count >= 2, return `{ allowed: false, reason: 'limit_reached', message: '...' }`
  - [ ] If count < 2, return `{ allowed: true, remaining: 2 - count }`
  - [ ] Handle both authenticated and anonymous users
- [ ] Task 5: Implement canCreateLeague method (AC: 1)
  - [ ] Check if user is premium using `isPremium`
  - [ ] Return boolean (true if premium, false otherwise)
  - [ ] Handle both authenticated and anonymous users
- [ ] Task 6: Implement getTournamentPlayerLimit method (AC: 1)
  - [ ] Check if user is premium using `isPremium`
  - [ ] Return `null` if premium (unlimited)
  - [ ] Return `6` if free user
  - [ ] Handle both authenticated and anonymous users
- [ ] Task 7: Add offline support (AC: 1)
  - [ ] Check Supabase availability
  - [ ] Fallback to localStorage for premium status
  - [ ] Fallback to localStorage for tournament count
  - [ ] Ensure graceful degradation

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Service Pattern:**
- Follow existing service patterns from `DatabaseService.ts`, `AuthService.ts`, `IdentityMergeService.ts`
- Use singleton pattern: `export const premiumService = new PremiumService()`
- Service should be stateless (no internal state)
- Methods should be async and return promises
- Handle Supabase unavailability gracefully with localStorage fallback

**Database Query Pattern:**
- Use Supabase client: `supabase.from('table').select('column').eq('id', userId)`
- Query `users` table for authenticated users: `creator_user_id = userId`
- Query `anonymous_users` table for anonymous users: `creator_anonymous_user_id = anonymousUserId`
- Use `.count()` for counting tournaments
- Handle null/undefined cases gracefully

**Offline Support Pattern:**
- Check `supabase !== null` before querying
- Fallback to localStorage for premium status: `localStorage.getItem('bpl_premium_status')`
- Fallback to localStorage for tournament count: count from `localStorage.getItem('bpl_tournaments')`
- Follow pattern from `DatabaseService.isSupabaseAvailable()`

**Return Type Patterns:**
- `isPremium`: `Promise<boolean>`
- `canCreateTournament`: `Promise<{ allowed: boolean, remaining?: number, reason?: string, message?: string }>`
- `canCreateLeague`: `Promise<boolean>`
- `getTournamentPlayerLimit`: `Promise<number | null>`
- `getTournamentCount`: `Promise<number>`

**Error Handling:**
- Services throw errors, contexts handle user feedback
- Log errors to console for debugging
- Return sensible defaults on error (e.g., assume free user if query fails)

### Source Tree Components to Touch

**Files to Create:**
- `src/services/PremiumService.ts` - New service file

**Files to Reference (for pattern consistency):**
- `src/services/DatabaseService.ts` - Service structure, offline support pattern
- `src/services/AuthService.ts` - Service singleton pattern
- `src/services/IdentityMergeService.ts` - Service method patterns
- `src/lib/supabase.ts` - Supabase client import

**Files That Will Use This Service:**
- `src/context/PremiumContext.tsx` (Story 7.12) - Will consume PremiumService
- `src/pages/Home.tsx` (Story 7.5) - Will check premium status
- `src/components/CreateMenuModal.tsx` (Story 7.6) - Will check limits
- `src/pages/CreateTournament.tsx` (Story 7.7) - Will enforce tournament limit
- `src/pages/CreateLeague.tsx` (Story 7.9) - Will enforce league premium requirement

### Testing Standards Summary

**Unit Testing:**
- Test `isPremium` with authenticated and anonymous users
- Test `getTournamentCount` with various tournament counts
- Test `canCreateTournament` with different scenarios (premium, free with 0/1/2 tournaments)
- Test `canCreateLeague` with premium and free users
- Test `getTournamentPlayerLimit` with premium and free users
- Test offline fallback scenarios
- Mock Supabase client for testing

**Integration Testing:**
- Test service with actual Supabase queries
- Test localStorage fallback when Supabase unavailable
- Test error handling when database query fails

### Project Structure Notes

**Alignment with Unified Project Structure:**
- ✅ Service location: `src/services/` (consistent with existing services)
- ✅ Service naming: `PremiumService.ts` (PascalCase class, camelCase file)
- ✅ Singleton export pattern: `export const premiumService = new PremiumService()`
- ✅ TypeScript strict mode compliance
- ✅ Follows existing service architecture patterns

**Detected Conflicts or Variances:**
- None - this follows established service patterns

### References

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-7] Epic 7: Freemium Payment Model & Premium Features
- [Source: _bmad-output/planning-artifacts/epics.md#Story-7.2] Story 7.2: PremiumService Implementation

**Service Patterns:**
- [Source: src/services/DatabaseService.ts] DatabaseService - Service structure, offline support
- [Source: src/services/AuthService.ts] AuthService - Singleton pattern, async methods
- [Source: src/services/IdentityMergeService.ts] IdentityMergeService - Service method patterns

**Database Schema:**
- [Source: supabase/migrations/005_add_premium_status.sql] Premium status columns in users and anonymous_users tables
- [Source: supabase/migrations/001_initial_schema.sql] Tournaments table structure with creator fields

**Architecture Patterns:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Service-Boundaries] Service layer pattern and boundaries
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Boundaries] Data access patterns

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_
