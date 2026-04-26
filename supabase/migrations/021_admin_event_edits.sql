-- Migration 021 — Admin event edits: archive ghosts + edit/delete matches
--
-- Context: extension of mig 018 (rename + delete ghost). Three new capabilities
-- for the event/league admin:
--
--   1. Archive a ghost player (soft-delete) — needed when the ghost has played
--      matches so hard-delete is blocked, but the admin still wants to remove
--      them from future match pickers without losing existing match history.
--
--   2. Update an existing match (score + teams) — admin correction after a
--      mistype during recording. ELO recalculation is the caller's
--      responsibility (client-side, via EloRecalcService).
--
--   3. Delete a match — admin removes an erroneous match. elo_history rows
--      cascade-delete via FK. ELO recalculation is the caller's
--      responsibility.
--
-- RPC pattern mirrors mig 018: SECURITY DEFINER, caller must be auth.uid() =
-- creator_user_id of the surrounding context.

-- ──────────────────────────────────────────────────────────────────────
-- 1. archived_at columns
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.tournament_players
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE public.league_players
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tournament_players_active
  ON public.tournament_players(tournament_id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_league_players_active
  ON public.league_players(league_id) WHERE archived_at IS NULL;

-- ──────────────────────────────────────────────────────────────────────
-- 2. archive_anonymous_player
-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION archive_anonymous_player(
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
    RAISE EXCEPTION 'Only the context creator can archive ghosts';
  END IF;

  IF p_kind = 'tournament' THEN
    UPDATE tournament_players
       SET archived_at = NOW()
     WHERE id = p_player_id;
  ELSE
    UPDATE league_players
       SET archived_at = NOW()
     WHERE id = p_player_id;
  END IF;

  RETURN json_build_object('success', true, 'player_id', p_player_id);
END;
$$;

REVOKE ALL ON FUNCTION archive_anonymous_player(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION archive_anonymous_player(TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION archive_anonymous_player(TEXT, UUID) IS
'Soft-delete a ghost player. Hides from pickers but preserves existing matches. Caller must own the context.';

-- ──────────────────────────────────────────────────────────────────────
-- 3. admin_update_match
-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_update_match(
  p_match_id UUID,
  p_team_a_player_ids UUID[],
  p_team_b_player_ids UUID[],
  p_score_a INTEGER,
  p_score_b INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_tournament_id UUID;
  v_league_id UUID;
  v_t_creator UUID;
  v_l_creator UUID;
  v_format TEXT;
  v_size_a INT;
  v_size_b INT;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authenticated admin required';
  END IF;

  SELECT tournament_id, league_id INTO v_tournament_id, v_league_id
  FROM matches WHERE id = p_match_id;

  IF v_tournament_id IS NULL AND v_league_id IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  -- Caller must be admin of the tournament (preferred) or the league
  IF v_tournament_id IS NOT NULL THEN
    SELECT creator_user_id INTO v_t_creator FROM tournaments WHERE id = v_tournament_id;
  END IF;
  IF v_league_id IS NOT NULL THEN
    SELECT creator_user_id INTO v_l_creator FROM leagues WHERE id = v_league_id;
  END IF;

  IF (v_t_creator IS NULL OR v_t_creator <> v_caller)
     AND (v_l_creator IS NULL OR v_l_creator <> v_caller) THEN
    RAISE EXCEPTION 'Only the event/league admin can edit matches';
  END IF;

  IF p_score_a IS NULL OR p_score_b IS NULL OR p_score_a < 0 OR p_score_b < 0 THEN
    RAISE EXCEPTION 'Invalid scores';
  END IF;

  IF p_team_a_player_ids IS NULL OR p_team_b_player_ids IS NULL
     OR array_length(p_team_a_player_ids, 1) IS NULL
     OR array_length(p_team_b_player_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Teams cannot be empty';
  END IF;

  v_size_a := array_length(p_team_a_player_ids, 1);
  v_size_b := array_length(p_team_b_player_ids, 1);

  v_format := CASE
    WHEN v_size_a = 1 AND v_size_b = 1 THEN '1v1'
    WHEN v_size_a = 2 AND v_size_b = 2 THEN '2v2'
    WHEN v_size_a = 3 AND v_size_b = 3 THEN '3v3'
    ELSE NULL
  END;

  IF v_format IS NULL THEN
    RAISE EXCEPTION 'Invalid team sizes (%, %) — must be 1v1, 2v2 or 3v3', v_size_a, v_size_b;
  END IF;

  -- Wipe elo_history for this match — caller will re-replay via EloRecalcService.
  DELETE FROM elo_history WHERE match_id = p_match_id;

  UPDATE matches
     SET team_a_player_ids = p_team_a_player_ids,
         team_b_player_ids = p_team_b_player_ids,
         score_a = p_score_a,
         score_b = p_score_b,
         format = v_format
   WHERE id = p_match_id;

  RETURN json_build_object(
    'success', true,
    'match_id', p_match_id,
    'league_id', v_league_id,
    'tournament_id', v_tournament_id
  );
END;
$$;

REVOKE ALL ON FUNCTION admin_update_match(UUID, UUID[], UUID[], INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_update_match(UUID, UUID[], UUID[], INTEGER, INTEGER) TO authenticated;

COMMENT ON FUNCTION admin_update_match(UUID, UUID[], UUID[], INTEGER, INTEGER) IS
'Admin edit of a match (teams + score). Wipes elo_history for the match; caller must rebuild ELO via recalc.';

-- ──────────────────────────────────────────────────────────────────────
-- 4. admin_delete_match
-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_delete_match(p_match_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_tournament_id UUID;
  v_league_id UUID;
  v_t_creator UUID;
  v_l_creator UUID;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authenticated admin required';
  END IF;

  SELECT tournament_id, league_id INTO v_tournament_id, v_league_id
  FROM matches WHERE id = p_match_id;

  IF v_tournament_id IS NULL AND v_league_id IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF v_tournament_id IS NOT NULL THEN
    SELECT creator_user_id INTO v_t_creator FROM tournaments WHERE id = v_tournament_id;
  END IF;
  IF v_league_id IS NOT NULL THEN
    SELECT creator_user_id INTO v_l_creator FROM leagues WHERE id = v_league_id;
  END IF;

  IF (v_t_creator IS NULL OR v_t_creator <> v_caller)
     AND (v_l_creator IS NULL OR v_l_creator <> v_caller) THEN
    RAISE EXCEPTION 'Only the event/league admin can delete matches';
  END IF;

  -- elo_history cascades via FK (ON DELETE CASCADE in mig 001).
  DELETE FROM matches WHERE id = p_match_id;

  RETURN json_build_object(
    'success', true,
    'match_id', p_match_id,
    'league_id', v_league_id,
    'tournament_id', v_tournament_id
  );
END;
$$;

REVOKE ALL ON FUNCTION admin_delete_match(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_delete_match(UUID) TO authenticated;

COMMENT ON FUNCTION admin_delete_match(UUID) IS
'Admin deletion of a match. Cascades elo_history. Caller must rebuild ELO via recalc.';
