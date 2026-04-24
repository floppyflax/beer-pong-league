-- Migration 012 — Claim anonymous player (guest)
--
-- Context: an admin can manually add "guest" players (ghosts without a real
-- account) to a tournament/league via addGuestPlayerToTournament. Each guest
-- gets its own anonymous_users row with a fresh UUID so the unique constraint
-- (tournament_id, anonymous_user_id) holds for multiple guests per event.
--
-- This migration adds an atomic RPC that lets an *authenticated* user claim
-- such a guest entry: "I am ‹pseudo›, give me ownership of that row + its
-- matches + its ELO history within this context".
--
-- Scope:
--   - Reassigns ONE tournament_players or league_players row to p_user_id.
--   - Reassigns matches scoped to that single context where the source
--     anonymous_user_id appears in team arrays.
--   - Reassigns elo_history rows scoped to that single context.
--   - If, after the claim, the source anonymous_user has no more references
--     anywhere, mark it merged (typical for guests). Otherwise leave it.
--   - Audit row in user_identity_merges.
--
-- Anti-abuse: the RPC requires auth.uid() = p_user_id (caller can only claim
-- on their own behalf). Knowledge of the player_id (UUID) acts as a
-- secondary capability; UI surfaces it only on pages where the user has
-- access to the context (tournament/league code already shared).
--
-- Refusal cases:
--   - row already user-owned (anonymous_user_id IS NULL)
--   - source anonymous_user already merged
--   - p_user_id already has a row in the same context (would trip
--     UNIQUE (context_id, user_id)). UI must surface this and bail out.

CREATE OR REPLACE FUNCTION claim_anonymous_player(
  p_kind TEXT,                    -- 'tournament' | 'league'
  p_player_id UUID,               -- tournament_players.id OR league_players.id
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_anonymous_user_id UUID;
  v_context_id UUID;             -- tournament_id or league_id of the row
  v_existing_user_row UUID;
  v_match_count INT := 0;
  v_elo_count INT := 0;
  v_remaining_refs INT := 0;
  v_anonymous_already_merged BOOLEAN;
BEGIN
  -- Caller authentication check
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: caller must claim on their own behalf';
  END IF;

  IF p_kind NOT IN ('tournament', 'league') THEN
    RAISE EXCEPTION 'Invalid kind: %, expected tournament|league', p_kind;
  END IF;

  -- ──────────────────────────────────────────────────────────────────────
  -- 1. Locate the source row + its context, lock it to prevent races
  -- ──────────────────────────────────────────────────────────────────────
  IF p_kind = 'tournament' THEN
    SELECT anonymous_user_id, tournament_id
      INTO v_anonymous_user_id, v_context_id
    FROM tournament_players
    WHERE id = p_player_id
    FOR UPDATE;
  ELSE
    SELECT anonymous_user_id, league_id
      INTO v_anonymous_user_id, v_context_id
    FROM league_players
    WHERE id = p_player_id
    FOR UPDATE;
  END IF;

  IF v_context_id IS NULL THEN
    RAISE EXCEPTION 'Player row not found';
  END IF;

  IF v_anonymous_user_id IS NULL THEN
    RAISE EXCEPTION 'Player row is already user-owned, nothing to claim';
  END IF;

  -- ──────────────────────────────────────────────────────────────────────
  -- 2. Check that the source anonymous user isn't already merged elsewhere
  -- ──────────────────────────────────────────────────────────────────────
  SELECT (merged_to_user_id IS NOT NULL)
    INTO v_anonymous_already_merged
  FROM anonymous_users
  WHERE id = v_anonymous_user_id;

  IF v_anonymous_already_merged THEN
    RAISE EXCEPTION 'Source anonymous identity is already merged';
  END IF;

  -- ──────────────────────────────────────────────────────────────────────
  -- 3. Refuse if the calling user already has a row in this context
  --    (would trip UNIQUE(context_id, user_id))
  -- ──────────────────────────────────────────────────────────────────────
  IF p_kind = 'tournament' THEN
    SELECT id INTO v_existing_user_row
    FROM tournament_players
    WHERE tournament_id = v_context_id AND user_id = p_user_id
    LIMIT 1;
  ELSE
    SELECT id INTO v_existing_user_row
    FROM league_players
    WHERE league_id = v_context_id AND user_id = p_user_id
    LIMIT 1;
  END IF;

  IF v_existing_user_row IS NOT NULL THEN
    RAISE EXCEPTION 'You are already registered in this context under your account';
  END IF;

  -- ──────────────────────────────────────────────────────────────────────
  -- 4. Reassign the player row itself
  -- ──────────────────────────────────────────────────────────────────────
  IF p_kind = 'tournament' THEN
    UPDATE tournament_players
       SET user_id = p_user_id,
           anonymous_user_id = NULL
     WHERE id = p_player_id;
  ELSE
    UPDATE league_players
       SET user_id = p_user_id,
           anonymous_user_id = NULL
     WHERE id = p_player_id;
  END IF;

  -- ──────────────────────────────────────────────────────────────────────
  -- 5. Reassign matches scoped to this context
  --    team_a/b_player_ids store the *anonymous_user_id* (or user_id) UUIDs
  --    as TEXT — server-side array_replace keeps anti-cheat invariant.
  -- ──────────────────────────────────────────────────────────────────────
  IF p_kind = 'tournament' THEN
    UPDATE matches
       SET team_a_player_ids = array_replace(team_a_player_ids, v_anonymous_user_id::text, p_user_id::text),
           team_b_player_ids = array_replace(team_b_player_ids, v_anonymous_user_id::text, p_user_id::text)
     WHERE tournament_id = v_context_id
       AND (v_anonymous_user_id::text = ANY(team_a_player_ids)
         OR v_anonymous_user_id::text = ANY(team_b_player_ids));
  ELSE
    UPDATE matches
       SET team_a_player_ids = array_replace(team_a_player_ids, v_anonymous_user_id::text, p_user_id::text),
           team_b_player_ids = array_replace(team_b_player_ids, v_anonymous_user_id::text, p_user_id::text)
     WHERE league_id = v_context_id
       AND (v_anonymous_user_id::text = ANY(team_a_player_ids)
         OR v_anonymous_user_id::text = ANY(team_b_player_ids));
  END IF;

  GET DIAGNOSTICS v_match_count = ROW_COUNT;

  -- ──────────────────────────────────────────────────────────────────────
  -- 6. Reassign elo_history scoped to this context
  -- ──────────────────────────────────────────────────────────────────────
  IF p_kind = 'tournament' THEN
    UPDATE elo_history
       SET user_id = p_user_id,
           anonymous_user_id = NULL
     WHERE anonymous_user_id = v_anonymous_user_id
       AND tournament_id = v_context_id;
  ELSE
    UPDATE elo_history
       SET user_id = p_user_id,
           anonymous_user_id = NULL
     WHERE anonymous_user_id = v_anonymous_user_id
       AND league_id = v_context_id;
  END IF;

  GET DIAGNOSTICS v_elo_count = ROW_COUNT;

  -- ──────────────────────────────────────────────────────────────────────
  -- 7. If the source anonymous_user has no more refs anywhere, mark merged.
  --    Guests created via addGuestPlayerToTournament always satisfy this
  --    because each guest has its own dedicated anonymous_users row.
  -- ──────────────────────────────────────────────────────────────────────
  SELECT
    (SELECT COUNT(*) FROM tournament_players WHERE anonymous_user_id = v_anonymous_user_id)
    + (SELECT COUNT(*) FROM league_players  WHERE anonymous_user_id = v_anonymous_user_id)
    + (SELECT COUNT(*) FROM elo_history     WHERE anonymous_user_id = v_anonymous_user_id)
    + (SELECT COUNT(*) FROM leagues         WHERE creator_anonymous_user_id = v_anonymous_user_id)
    + (SELECT COUNT(*) FROM tournaments     WHERE creator_anonymous_user_id = v_anonymous_user_id)
    + (SELECT COUNT(*) FROM matches         WHERE created_by_anonymous_user_id = v_anonymous_user_id)
  INTO v_remaining_refs;

  IF v_remaining_refs = 0 THEN
    UPDATE anonymous_users
       SET merged_to_user_id = p_user_id,
           merged_at = NOW()
     WHERE id = v_anonymous_user_id;

    -- Audit row only when the whole identity is consumed by the claim.
    INSERT INTO user_identity_merges (
      anonymous_user_id, user_id, stats_migrated, merged_at
    ) VALUES (
      v_anonymous_user_id, p_user_id, true, NOW()
    );
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
    RAISE EXCEPTION 'Claim failed: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_anonymous_player TO authenticated;

COMMENT ON FUNCTION claim_anonymous_player IS
'Atomically lets an authenticated user claim a single anonymous (guest) player row in a tournament or league. Reassigns the row, scoped matches and elo_history; marks the source anonymous_user merged if no remaining refs. Caller must equal p_user_id (auth.uid check).';
