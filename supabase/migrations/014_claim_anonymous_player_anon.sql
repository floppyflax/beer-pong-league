-- Migration 014 — Claim anonymous player as ANOTHER anonymous user
--
-- Context: migration 012 (`claim_anonymous_player`) only allows authenticated
-- users (`auth.uid() = p_user_id`) to claim a guest row. But the product flow
-- requires both anonymous and authenticated users arriving via a join code or
-- invite link to be able to say "C'est moi" on a ghost player.
--
-- This migration adds the parallel function for anonymous-only claim. The
-- caller passes their own `anonymous_user_id`; the source guest row is
-- reassigned to that anonymous user (NOT to a Supabase auth user). Matches
-- and elo_history scoped to the context are reassigned accordingly.
--
-- Anti-abuse (POC tier, accepted by product):
--   - Capability-based: caller must know both UUIDs (own anonymous_user_id +
--     target player_id). The player_id is only surfaced to clients that have
--     already entered the join code, so this is acceptable for the launch.
--   - Refuses to operate on already-merged source identity.
--   - Refuses if the calling anonymous user already has a row in this
--     context (would trip UNIQUE).
--   - Refuses if caller's anonymous user is itself already merged to a
--     Supabase auth account (in that case they should sign in and use the
--     authenticated RPC).
--
-- Mirrors `claim_anonymous_player` (migration 012) for the reassignment
-- mechanics; the only differences are the auth check and the destination
-- columns (anonymous_user_id stays, user_id stays NULL).

CREATE OR REPLACE FUNCTION claim_anonymous_player_anon(
  p_kind TEXT,                          -- 'tournament' | 'league'
  p_player_id UUID,                     -- tournament_players.id OR league_players.id
  p_claimer_anonymous_user_id UUID      -- caller's own anonymous_users.id
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_source_anonymous_user_id UUID;
  v_context_id UUID;
  v_existing_row UUID;
  v_match_count INT := 0;
  v_elo_count INT := 0;
  v_remaining_refs INT := 0;
  v_source_already_merged BOOLEAN;
  v_claimer_merged_to UUID;
BEGIN
  IF p_kind NOT IN ('tournament', 'league') THEN
    RAISE EXCEPTION 'Invalid kind: %, expected tournament|league', p_kind;
  END IF;

  -- Caller's anonymous identity must exist and must NOT already be merged to
  -- an authenticated user. If it is, they should sign in and use the auth RPC.
  SELECT merged_to_user_id INTO v_claimer_merged_to
    FROM anonymous_users
    WHERE id = p_claimer_anonymous_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Claimer anonymous identity not found';
  END IF;

  IF v_claimer_merged_to IS NOT NULL THEN
    RAISE EXCEPTION 'Claimer is already merged to an account; sign in first';
  END IF;

  -- ──────────────────────────────────────────────────────────────────────
  -- 1. Locate source row + context, lock it
  -- ──────────────────────────────────────────────────────────────────────
  IF p_kind = 'tournament' THEN
    SELECT anonymous_user_id, tournament_id
      INTO v_source_anonymous_user_id, v_context_id
    FROM tournament_players
    WHERE id = p_player_id
    FOR UPDATE;
  ELSE
    SELECT anonymous_user_id, league_id
      INTO v_source_anonymous_user_id, v_context_id
    FROM league_players
    WHERE id = p_player_id
    FOR UPDATE;
  END IF;

  IF v_context_id IS NULL THEN
    RAISE EXCEPTION 'Player row not found';
  END IF;

  IF v_source_anonymous_user_id IS NULL THEN
    RAISE EXCEPTION 'Player row is already user-owned, nothing to claim';
  END IF;

  -- No-op if caller already owns the row
  IF v_source_anonymous_user_id = p_claimer_anonymous_user_id THEN
    RETURN json_build_object(
      'success', true,
      'kind', p_kind,
      'player_id', p_player_id,
      'matches_migrated', 0,
      'elo_history_migrated', 0,
      'anonymous_fully_consumed', false,
      'noop', true
    );
  END IF;

  -- ──────────────────────────────────────────────────────────────────────
  -- 2. Source must not be merged elsewhere
  -- ──────────────────────────────────────────────────────────────────────
  SELECT (merged_to_user_id IS NOT NULL)
    INTO v_source_already_merged
  FROM anonymous_users
  WHERE id = v_source_anonymous_user_id;

  IF v_source_already_merged THEN
    RAISE EXCEPTION 'Source anonymous identity is already merged';
  END IF;

  -- ──────────────────────────────────────────────────────────────────────
  -- 3. Caller must not already have a row in this context
  -- ──────────────────────────────────────────────────────────────────────
  IF p_kind = 'tournament' THEN
    SELECT id INTO v_existing_row
    FROM tournament_players
    WHERE tournament_id = v_context_id
      AND anonymous_user_id = p_claimer_anonymous_user_id
    LIMIT 1;
  ELSE
    SELECT id INTO v_existing_row
    FROM league_players
    WHERE league_id = v_context_id
      AND anonymous_user_id = p_claimer_anonymous_user_id
    LIMIT 1;
  END IF;

  IF v_existing_row IS NOT NULL THEN
    RAISE EXCEPTION 'You are already registered in this context';
  END IF;

  -- ──────────────────────────────────────────────────────────────────────
  -- 4. Reassign player row (anonymous → anonymous)
  -- ──────────────────────────────────────────────────────────────────────
  IF p_kind = 'tournament' THEN
    UPDATE tournament_players
       SET anonymous_user_id = p_claimer_anonymous_user_id
     WHERE id = p_player_id;
  ELSE
    UPDATE league_players
       SET anonymous_user_id = p_claimer_anonymous_user_id
     WHERE id = p_player_id;
  END IF;

  -- ──────────────────────────────────────────────────────────────────────
  -- 5. Reassign matches scoped to this context
  -- ──────────────────────────────────────────────────────────────────────
  IF p_kind = 'tournament' THEN
    UPDATE matches
       SET team_a_player_ids = array_replace(team_a_player_ids, v_source_anonymous_user_id::text, p_claimer_anonymous_user_id::text),
           team_b_player_ids = array_replace(team_b_player_ids, v_source_anonymous_user_id::text, p_claimer_anonymous_user_id::text)
     WHERE tournament_id = v_context_id
       AND (v_source_anonymous_user_id::text = ANY(team_a_player_ids)
         OR v_source_anonymous_user_id::text = ANY(team_b_player_ids));
  ELSE
    UPDATE matches
       SET team_a_player_ids = array_replace(team_a_player_ids, v_source_anonymous_user_id::text, p_claimer_anonymous_user_id::text),
           team_b_player_ids = array_replace(team_b_player_ids, v_source_anonymous_user_id::text, p_claimer_anonymous_user_id::text)
     WHERE league_id = v_context_id
       AND (v_source_anonymous_user_id::text = ANY(team_a_player_ids)
         OR v_source_anonymous_user_id::text = ANY(team_b_player_ids));
  END IF;

  GET DIAGNOSTICS v_match_count = ROW_COUNT;

  -- ──────────────────────────────────────────────────────────────────────
  -- 6. Reassign elo_history scoped to this context
  -- ──────────────────────────────────────────────────────────────────────
  IF p_kind = 'tournament' THEN
    UPDATE elo_history
       SET anonymous_user_id = p_claimer_anonymous_user_id
     WHERE anonymous_user_id = v_source_anonymous_user_id
       AND tournament_id = v_context_id;
  ELSE
    UPDATE elo_history
       SET anonymous_user_id = p_claimer_anonymous_user_id
     WHERE anonymous_user_id = v_source_anonymous_user_id
       AND league_id = v_context_id;
  END IF;

  GET DIAGNOSTICS v_elo_count = ROW_COUNT;

  -- ──────────────────────────────────────────────────────────────────────
  -- 7. Mark source anonymous as fully consumed if no remaining refs.
  --    Note: we mark it merged to NULL user (only merged_at is set; the FK
  --    column merged_to_user_id stays NULL because the destination is itself
  --    anonymous). Audit table user_identity_merges is auth-only so we skip.
  -- ──────────────────────────────────────────────────────────────────────
  SELECT
    (SELECT COUNT(*) FROM tournament_players WHERE anonymous_user_id = v_source_anonymous_user_id)
    + (SELECT COUNT(*) FROM league_players  WHERE anonymous_user_id = v_source_anonymous_user_id)
    + (SELECT COUNT(*) FROM elo_history     WHERE anonymous_user_id = v_source_anonymous_user_id)
    + (SELECT COUNT(*) FROM leagues         WHERE creator_anonymous_user_id = v_source_anonymous_user_id)
    + (SELECT COUNT(*) FROM tournaments     WHERE creator_anonymous_user_id = v_source_anonymous_user_id)
    + (SELECT COUNT(*) FROM matches         WHERE created_by_anonymous_user_id = v_source_anonymous_user_id)
  INTO v_remaining_refs;

  IF v_remaining_refs = 0 THEN
    UPDATE anonymous_users
       SET merged_at = NOW()
     WHERE id = v_source_anonymous_user_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'kind', p_kind,
    'player_id', p_player_id,
    'matches_migrated', v_match_count,
    'elo_history_migrated', v_elo_count,
    'anonymous_fully_consumed', (v_remaining_refs = 0)
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Anon claim failed: %', SQLERRM;
END;
$$;

-- Anonymous claim must be callable WITHOUT auth, so grant to anon role too.
GRANT EXECUTE ON FUNCTION claim_anonymous_player_anon TO anon, authenticated;

COMMENT ON FUNCTION claim_anonymous_player_anon IS
'Lets an anonymous (non-authenticated) caller claim a single guest player row in a tournament or league by passing their own anonymous_user_id. Reassigns row + scoped matches + elo_history; marks source consumed if no remaining refs. Capability-based security: caller must already know both UUIDs (acceptable for POC).';
