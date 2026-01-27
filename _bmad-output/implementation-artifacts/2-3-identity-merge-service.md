# Story 2.3: Identity Merge Service

Status: ready-for-dev

## Story

As a user,
I want my anonymous data merged when I create an account,
So that I don't lose my stats and match history.

## Acceptance Criteria

**Given** an anonymous user has played matches
**When** they create an account with email + OTP
**Then** IdentityMergeService merges anonymous data to authenticated user
**And** all league_players records are migrated
**And** all tournament_players records are migrated
**And** all matches are updated with new user_id
**And** all elo_history records are migrated
**And** merge is logged in `user_identity_merges` table
**And** anonymous user record is marked as merged
**And** user sees their complete stats after merge

## Tasks / Subtasks

- [ ] Review IdentityMergeService (AC: Merge service)
  - [ ] Verify IdentityMergeService.mergeAnonymousToAuth() exists
  - [ ] Review merge logic for all data types
  - [ ] Ensure transactional integrity
  - [ ] Test rollback on failure

- [ ] Test league_players migration (AC: League players migrated)
  - [ ] Verify league_players records update user_id
  - [ ] Test anonymous_user_id is cleared
  - [ ] Ensure no duplicate records created
  - [ ] Verify ELO and stats are preserved

- [ ] Test tournament_players migration (AC: Tournament players migrated)
  - [ ] Verify tournament_players records update user_id
  - [ ] Test anonymous_user_id is cleared
  - [ ] Ensure participation history is preserved
  - [ ] Verify tournament associations are correct

- [ ] Test matches migration (AC: Matches updated)
  - [ ] Verify match_players records update user_id
  - [ ] Test match history is preserved
  - [ ] Ensure team associations are maintained
  - [ ] Verify match scores and results are intact

- [ ] Test elo_history migration (AC: ELO history migrated)
  - [ ] Verify elo_history records update user_id
  - [ ] Test ELO progression is preserved
  - [ ] Ensure timestamps are maintained
  - [ ] Verify no data loss in history

- [ ] Test merge logging (AC: Merge logged)
  - [ ] Verify user_identity_merges record is created
  - [ ] Test merge timestamp is recorded
  - [ ] Ensure anonymous_user_id and user_id are logged
  - [ ] Verify merge can be audited

- [ ] Test anonymous user marking (AC: Anonymous marked merged)
  - [ ] Verify anonymous_users.merged_to_user_id is set
  - [ ] Test anonymous_users.merged_at timestamp is recorded
  - [ ] Ensure anonymous user cannot be reused
  - [ ] Verify merged user is excluded from queries

- [ ] Test UI update after merge (AC: User sees stats)
  - [ ] Verify IdentityContext updates after merge
  - [ ] Test stats display shows complete history
  - [ ] Ensure UI reflects merged data
  - [ ] Verify success message is displayed

## Dev Notes

### Existing Components

**IdentityMergeService.ts:**
- Already exists in `src/services/IdentityMergeService.ts`
- Handles merging anonymous data to authenticated users
- Should be reviewed and tested

**Migration Strategy:**

```typescript
// Merge flow triggered on authentication
async function mergeAnonymousToAuthenticated(
  anonymousUserId: string,
  authenticatedUserId: string
) {
  // 1. Start transaction
  const { data, error } = await supabase.rpc('merge_anonymous_identity', {
    p_anonymous_user_id: anonymousUserId,
    p_authenticated_user_id: authenticatedUserId
  });
  
  // 2. Update league_players
  // UPDATE league_players 
  // SET user_id = p_authenticated_user_id, anonymous_user_id = NULL
  // WHERE anonymous_user_id = p_anonymous_user_id
  
  // 3. Update tournament_players
  // UPDATE tournament_players 
  // SET user_id = p_authenticated_user_id, anonymous_user_id = NULL
  // WHERE anonymous_user_id = p_anonymous_user_id
  
  // 4. Update match_players
  // UPDATE match_players 
  // SET user_id = p_authenticated_user_id, anonymous_user_id = NULL
  // WHERE anonymous_user_id = p_anonymous_user_id
  
  // 5. Update elo_history
  // UPDATE elo_history 
  // SET user_id = p_authenticated_user_id, anonymous_user_id = NULL
  // WHERE anonymous_user_id = p_anonymous_user_id
  
  // 6. Log merge
  // INSERT INTO user_identity_merges (anonymous_user_id, user_id, merged_at)
  
  // 7. Mark anonymous user as merged
  // UPDATE anonymous_users 
  // SET merged_to_user_id = p_authenticated_user_id, merged_at = NOW()
  // WHERE id = p_anonymous_user_id
  
  // 8. Commit or rollback
  return { success: true, error: null };
}
```

### Database Function

**Create Postgres function for atomic merge:**
```sql
CREATE OR REPLACE FUNCTION merge_anonymous_identity(
  p_anonymous_user_id UUID,
  p_authenticated_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Update league_players
  UPDATE league_players 
  SET user_id = p_authenticated_user_id, 
      anonymous_user_id = NULL,
      updated_at = NOW()
  WHERE anonymous_user_id = p_anonymous_user_id;
  
  -- Update tournament_players
  UPDATE tournament_players 
  SET user_id = p_authenticated_user_id, 
      anonymous_user_id = NULL,
      updated_at = NOW()
  WHERE anonymous_user_id = p_anonymous_user_id;
  
  -- Update match_players
  UPDATE match_players 
  SET user_id = p_authenticated_user_id, 
      anonymous_user_id = NULL,
      updated_at = NOW()
  WHERE anonymous_user_id = p_anonymous_user_id;
  
  -- Update elo_history
  UPDATE elo_history 
  SET user_id = p_authenticated_user_id, 
      anonymous_user_id = NULL
  WHERE anonymous_user_id = p_anonymous_user_id;
  
  -- Log merge
  INSERT INTO user_identity_merges (
    anonymous_user_id, 
    user_id, 
    merged_at
  ) VALUES (
    p_anonymous_user_id, 
    p_authenticated_user_id, 
    NOW()
  );
  
  -- Mark anonymous user as merged
  UPDATE anonymous_users 
  SET merged_to_user_id = p_authenticated_user_id, 
      merged_at = NOW()
  WHERE id = p_anonymous_user_id;
  
  v_result := json_build_object('success', true);
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Merge failed: %', SQLERRM;
END;
$$;
```

### Testing Checklist

**Manual Testing:**
1. Create anonymous user → Play matches
2. Authenticate → Merge triggered
3. Verify all stats preserved
4. Check database records updated
5. Ensure no data loss

**Edge Cases:**
- Anonymous user with no data
- Anonymous user with extensive history
- Multiple leagues/tournaments
- Concurrent merge attempts
- Partial merge failure (rollback)

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 2.3: Identity Merge Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture - Identity Merge]
- [Source: _bmad-output/planning-artifacts/prd.md#FR4.2: Gestion d'Identité Dual]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2: User Identity & Authentication]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Review/Test:**
- src/services/IdentityMergeService.ts
- src/context/IdentityContext.tsx

**Database Changes:**
- Create merge_anonymous_identity() Postgres function
- Verify user_identity_merges table exists
- Test RLS policies allow merge operations
