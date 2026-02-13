# Story 14.34: Bouton de déconnexion complète

Status: done

## Story

As a user,
I want a disconnect button that fully clears my identity (auth + anonymous),
So that I return to the Landing page as if I had never used the app.

## Acceptance Criteria

1. **Given** I have an identity (authenticated OR anonymous)
   **When** I click the disconnect button
   **Then** my Supabase session is signed out (if authenticated)

2. **Given** I have an identity
   **When** I click the disconnect button
   **Then** my local/anonymous identity is cleared (`bpl_local_user`)

3. **Given** I have an identity
   **When** I click the disconnect button
   **Then** sessionStorage is cleared (`authReturnTo` and any auth-related keys)

4. **Given** I have an identity
   **When** I click the disconnect button
   **Then** I am redirected to `/` and see the Landing page (no header, no bottom nav)

5. **Given** I am on the Landing (no identity)
   **When** I reload the page
   **Then** I still see the Landing (no identity restored from storage)

## Tasks / Subtasks

- [x] Task 1: Create full disconnect service/hook
- [x] Task 2: Add disconnect button to Mon profil (auth + anonymous)

## Dev Notes

- **Identity sources:** `isAuthenticated` (Supabase) + `localUser` (useIdentity → bpl_local_user)
- **hasIdentity** = `isAuthenticated || localUser` (App.tsx)
- **Landing** shown when `path === "/" && !hasIdentity`
- **Button placement:** Mon profil only (page profil)

### Full disconnect sequence

1. **Supabase auth:** `authService.signOut()` → clears Supabase session (sb-\* keys in localStorage)
2. **Local identity:** `localUserService.clearLocalUser()` → removes `bpl_local_user`
3. **Session:** `sessionStorage.removeItem('authReturnTo')`
4. **LeagueContext cache:** Clear `bpl_leagues`, `bpl_tournaments`, `bpl_current_league_id`, `bpl_current_tournament_id`
5. **Navigate:** `navigate("/", { replace: true })`

### References

- `src/context/AuthContext.tsx`
- `src/hooks/useIdentity.ts` (clearIdentity)
- `src/hooks/useFullDisconnect.ts` (new)
- `src/services/LocalUserService.ts` (clearLocalUser)
- `src/services/AuthService.ts` (signOut)
- `src/App.tsx` (hasIdentity, isLandingPage)

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- Task 1: Created useFullDisconnect hook — signOut + clearIdentity + sessionStorage (AUTH_SESSION_KEYS) + localStorage cache + window.location.replace("/").
- Task 2: UserProfile — disconnect button shown for (isAuthenticated || localUser), calls fullDisconnect. Loading state "Déconnexion…" during async.

### File List

- src/hooks/useFullDisconnect.ts (new)
- src/pages/UserProfile.tsx (modified)
- tests/unit/hooks/useFullDisconnect.test.ts (new)
- tests/unit/pages/UserProfile.test.tsx (updated)

## Change Log

- 2026-02-13: Bouton déconnexion complète (14-34). useFullDisconnect, Mon profil uniquement.
- 2026-02-13: Code review fixes — AUTH_SESSION_KEYS for sessionStorage, localStorage test added, UserProfile tests (anonymous-only, no-identity).
