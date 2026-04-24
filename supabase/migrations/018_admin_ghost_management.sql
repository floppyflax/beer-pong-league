-- Migration 018 — Admin ghost player management (rename + delete)
--
-- Context: a tournament/league admin manually adds guests ("Florian", "Marie")
-- as ghost players (anonymous_user_id NOT NULL, no real account). After the
-- event is set up, the admin needs simple housekeeping tools without exposing
-- random RLS write paths to clients.
--
-- This migration adds two SECURITY DEFINER RPCs:
--
--   rename_anonymous_player(p_kind, p_player_id, p_new_pseudo)
--     Updates pseudo_in_tournament or pseudo_in_league of a ghost row.
--     Also updates anonymous_users.pseudo if the source ghost has no other
--     refs anywhere (cleaner display in unrelated contexts).
--
--   delete_anonymous_player(p_kind, p_player_id)
--     BLOCKED if the player has played any match in this context (to keep
--     ELO history + match results coherent). Otherwise deletes the row
--     and, if the source anonymous_user has no remaining refs, marks it
--     fully consumed by deleting it.
--
-- Anti-abuse:
--   - Caller MUST be auth.uid() = creator_user_id of the context (tournament
--     or league). No anonymous admin operations — that's a different POC
--     decision than the join-time anon claim.
--   - Both RPCs refuse if the row is no longer a ghost (anonymous_user_id IS
--     NULL → user/auth-owned), to avoid trampling claimed players.

-- ──────────────────────────────────────────────────────────────────────
-- rename_anonymous_player
-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rename_anonymous_player(
  p_kind TEXT,
  p_player_id UUID,
  p_new_pseudo TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_context_id UUID;
  v_creator UUID;
  v_anonymous_user_id UUID;
  v_remaining_refs INT := 0;
  v_trimmed TEXT := btrim(p_new_pseudo);
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authenticated admin required';
  END IF;

  IF p_kind NOT IN ('tournament', 'league') THEN
    RAISE EXCEPTION 'Invalid kind: %, expected tournament|league', p_kind;
  END IF;

  IF v_trimmed IS NULL OR length(v_trimmed) = 0 THEN
    RAISE EXCEPTION 'Pseudo cannot be empty';
  END IF;

  IF length(v_trimmed) > 100 THEN
    RAISE EXCEPTION 'Pseudo too long (max 100)';
  END IF;

  -- Resolve context + verify ghost row + verify caller is admin.
  IF p_kind = 'tournament' THEN
    SELECT tp.tournament_id, tp.anonymous_user_id, t.creator_user_id
      INTO v_context_id, v_anonymous_user_id, v_creator
    FROM tournament_players tp
    JOIN tournaments t ON t.id = tp.tournament_id
    WHERE tp.id = p_player_id;
  ELSE
    SELECT lp.league_id, lp.anonymous_user_id, l.creator_user_id
      INTO v_context_id, v_anonymous_user_id, v_creator
    FROM league_players lp
    JOIN leagues l ON l.id = lp.league_id
    WHERE lp.id = p_player_id;
  END IF;

  IF v_context_id IS NULL THEN
    RAISE EXCEPTION 'Player row not found';
  END IF;

  IF v_anonymous_user_id IS NULL THEN
    RAISE EXCEPTION 'Player is not a ghost (already claimed)';
  END IF;

  IF v_creator IS NULL OR v_creator <> v_caller THEN
    RAISE EXCEPTION 'Only the context creator can rename ghosts';
  END IF;

  -- Update the context-scoped pseudo.
  IF p_kind = 'tournament' THEN
    UPDATE tournament_players
       SET pseudo_in_tournament = v_trimmed
     WHERE id = p_player_id;
  ELSE
    UPDATE league_players
       SET pseudo_in_league = v_trimmed
     WHERE id = p_player_id;
  END IF;

  -- If the source anonymous_user is only used by this single row, also
  -- update its global pseudo so unrelated contexts (and the future merge
  -- audit trail) show the right name.
  SELECT
    (SELECT COUNT(*) FROM tournament_players WHERE anonymous_user_id = v_anonymous_user_id)
    + (SELECT COUNT(*) FROM league_players WHERE anonymous_user_id = v_anonymous_user_id)
    INTO v_remaining_refs;

  IF v_remaining_refs <= 1 THEN
    UPDATE anonymous_users
       SET pseudo = v_trimmed
     WHERE id = v_anonymous_user_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'player_id', p_player_id,
    'pseudo', v_trimmed,
    'global_pseudo_updated', v_remaining_refs <= 1
  );
END;
$$;

REVOKE ALL ON FUNCTION rename_anonymous_player(TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rename_anonymous_player(TEXT, UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION rename_anonymous_player(TEXT, UUID, TEXT) IS
'Admin rename of a ghost (anonymous) player in a tournament or league. Caller must own the context.';

-- ──────────────────────────────────────────────────────────────────────
-- delete_anonymous_player
-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION delete_anonymous_player(
  p_kind TEXT,
  p_player_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_context_id UUID;
  v_creator UUID;
  v_anonymous_user_id UUID;
  v_match_count INT := 0;
  v_remaining_refs INT := 0;
  v_anon_deleted BOOLEAN := false;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authenticated admin required';
  END IF;

  IF p_kind NOT IN ('tournament', 'league') THEN
    RAISE EXCEPTION 'Invalid kind: %, expected tournament|league', p_kind;
  END IF;

  IF p_kind = 'tournament' THEN
    SELECT tp.tournament_id, tp.anonymous_user_id, t.creator_user_id
      INTO v_context_id, v_anonymous_user_id, v_creator
    FROM tournament_players tp
    JOIN tournaments t ON t.id = tp.tournament_id
    WHERE tp.id = p_player_id;
  ELSE
    SELECT lp.league_id, lp.anonymous_user_id, l.creator_user_id
      INTO v_context_id, v_anonymous_user_id, v_creator
    FROM league_players lp
    JOIN leagues l ON l.id = lp.league_id
    WHERE lp.id = p_player_id;
  END IF;

  IF v_context_id IS NULL THEN
    RAISE EXCEPTION 'Player row not found';
  END IF;

  IF v_anonymous_user_id IS NULL THEN
    RAISE EXCEPTION 'Player is not a ghost (already claimed)';
  END IF;

  IF v_creator IS NULL OR v_creator <> v_caller THEN
    RAISE EXCEPTION 'Only the context creator can delete ghosts';
  END IF;

  -- BLOCK if the player has played any match in this context. We use the
  -- anonymous_user_id reference inside the match team arrays (text-cast
  -- because team arrays store UUID strings).
  IF p_kind = 'tournament' THEN
    SELECT COUNT(*) INTO v_match_count
    FROM matches m
    WHERE m.tournament_id = v_context_id
      AND (
        v_anonymous_user_id::text = ANY(m.team_a_player_ids)
        OR v_anonymous_user_id::text = ANY(m.team_b_player_ids)
      );
  ELSE
    SELECT COUNT(*) INTO v_match_count
    FROM matches m
    WHERE m.league_id = v_context_id
      AND (
        v_anonymous_user_id::text = ANY(m.team_a_player_ids)
        OR v_anonymous_user_id::text = ANY(m.team_b_player_ids)
      );
  END IF;

  IF v_match_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete player: % match(es) already recorded in this context', v_match_count;
  END IF;

  -- Safe to delete the context row. The tournament/league has no `player_ids`
  -- denormalised column — membership lives entirely in tournament_players /
  -- league_players, so a single DELETE is enough.
  IF p_kind = 'tournament' THEN
    DELETE FROM tournament_players WHERE id = p_player_id;
  ELSE
    DELETE FROM league_players WHERE id = p_player_id;
  END IF;

  -- If the source anonymous_user has no remaining refs anywhere, delete
  -- it (clean up the orphan ghost identity).
  SELECT
    (SELECT COUNT(*) FROM tournament_players WHERE anonymous_user_id = v_anonymous_user_id)
    + (SELECT COUNT(*) FROM league_players WHERE anonymous_user_id = v_anonymous_user_id)
    INTO v_remaining_refs;

  IF v_remaining_refs = 0 THEN
    DELETE FROM anonymous_users
     WHERE id = v_anonymous_user_id
       AND merged_to_user_id IS NULL;  -- never delete a merged ghost
    v_anon_deleted := true;
  END IF;

  RETURN json_build_object(
    'success', true,
    'player_id', p_player_id,
    'anonymous_user_deleted', v_anon_deleted
  );
END;
$$;

REVOKE ALL ON FUNCTION delete_anonymous_player(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_anonymous_player(TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION delete_anonymous_player(TEXT, UUID) IS
'Admin deletion of a ghost player. BLOCKED if any match recorded. Caller must own the context.';
