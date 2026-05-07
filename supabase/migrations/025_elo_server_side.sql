-- Migration 025 — ELO calculation moves server-side (anti-cheat)
--
-- Until now the ELO formula was implemented in apps/web/src/utils/elo.ts and
-- the client wrote elo_history rows + league_memberships.elo / event_memberships.elo
-- directly. That left the door wide open: a malicious client could send any
-- elo_after it wanted, and the DB would happily persist it.
--
-- This migration introduces two SECURITY DEFINER functions that own the
-- ELO writes:
--
--   apply_match_elo(p_match_id UUID)
--     Reads the match by id, recomputes the ELO change from the scores using
--     the same K-factor / expected-score formula as the previous client-side
--     calculator, and writes:
--       - elo_history rows (one per player in event context, optionally one
--         per player in league context if events.propagates_to_league_elo)
--       - event_memberships.elo / wins / losses / matches_played / streak
--       - league_memberships.elo / wins / losses / matches_played / streak
--
--     Idempotent: refuses to apply twice. Refuses non-ranked matches. Refuses
--     rejected matches. Refuses pending matches when the parent league/event
--     has anti_cheat_enabled = true.
--
--   recalculate_league_elo(p_league_id UUID)
--     Wipes the league's elo_history + memberships' stats, then replays every
--     confirmed ranked match attached to that league in chronological order
--     by calling apply_match_elo. Used by admins after editing/deleting a
--     match (cf. mig 021).
--
-- The client is updated in the same PR to call these RPCs instead of writing
-- directly. A follow-up PR will harden RLS to *forbid* direct client writes
-- to the stat columns, completing the anti-cheat story; this PR delivers the
-- correct write path that any honest client will use.

BEGIN;

-- ──────────────────────────────────────────────────────────────────────
-- 1. K-factor helper — 32 for the first 20 matches, 16 afterwards
--    (matches the spec from apps/web/src/utils/elo.ts).
-- ──────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.elo_k_factor(matches_played INTEGER)
RETURNS INTEGER
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT CASE WHEN matches_played < 20 THEN 32 ELSE 16 END;
$$;

-- ──────────────────────────────────────────────────────────────────────
-- 2. apply_match_elo — the only legitimate write path for ELO + stats.
-- ──────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.apply_match_elo(p_match_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_match              RECORD;
  v_league_anti_cheat  BOOLEAN;
  v_event_anti_cheat   BOOLEAN;
  v_propagates         BOOLEAN := FALSE;
  v_winner             CHAR(1);
  v_team_a_avg_elo     NUMERIC;
  v_team_b_avg_elo     NUMERIC;
  v_expected_a         NUMERIC;
  v_expected_b         NUMERIC;
  v_team_a_avg_elo_l   NUMERIC;  -- league-context averages (separate baselines)
  v_team_b_avg_elo_l   NUMERIC;
  v_expected_a_l       NUMERIC;
  v_expected_b_l       NUMERIC;
  v_player_id          UUID;
  v_already_applied    BOOLEAN;
BEGIN
  -- 2a. Lock the match row to serialize concurrent calls
  SELECT m.id, m.league_id, m.event_id,
         m.team_a_player_ids, m.team_b_player_ids,
         m.score_a, m.score_b,
         m.is_ranked, m.status
    INTO v_match
    FROM public.matches m
   WHERE m.id = p_match_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'apply_match_elo: match % not found', p_match_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- 2b. Refuse non-ranked or rejected matches
  IF v_match.is_ranked IS NOT TRUE THEN
    RAISE EXCEPTION 'apply_match_elo: match % is not ranked', p_match_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_match.status = 'rejected' THEN
    RAISE EXCEPTION 'apply_match_elo: match % was rejected', p_match_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- 2c. Anti-cheat — when the parent context requires confirmation, refuse pending
  IF v_match.event_id IS NOT NULL THEN
    SELECT COALESCE(anti_cheat_enabled, FALSE), COALESCE(propagates_to_league_elo, TRUE)
      INTO v_event_anti_cheat, v_propagates
      FROM public.events
     WHERE id = v_match.event_id;
  END IF;

  IF v_match.league_id IS NOT NULL THEN
    SELECT COALESCE(anti_cheat_enabled, FALSE)
      INTO v_league_anti_cheat
      FROM public.leagues
     WHERE id = v_match.league_id;
  END IF;

  IF (COALESCE(v_event_anti_cheat, FALSE) OR COALESCE(v_league_anti_cheat, FALSE))
     AND v_match.status <> 'confirmed' THEN
    RAISE EXCEPTION 'apply_match_elo: match % awaits confirmation under anti-cheat', p_match_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- 2d. Anti-replay
  SELECT EXISTS(SELECT 1 FROM public.elo_history WHERE match_id = p_match_id)
    INTO v_already_applied;
  IF v_already_applied THEN
    RAISE EXCEPTION 'apply_match_elo: match % already has elo_history (anti-replay)', p_match_id
      USING ERRCODE = 'unique_violation';
  END IF;

  -- 2e. Decide the winner
  IF v_match.score_a > v_match.score_b THEN
    v_winner := 'A';
  ELSIF v_match.score_b > v_match.score_a THEN
    v_winner := 'B';
  ELSE
    -- Ties are not part of the spec — refuse rather than silently picking one
    RAISE EXCEPTION 'apply_match_elo: match % has equal scores (no winner)', p_match_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- ──────────────────────────────────────────────────────────────────
  -- 3. EVENT context (always when event_id IS NOT NULL)
  --    Each player gets a delta computed from the team's average ELO
  --    (in the EVENT context: event_memberships.elo).
  -- ──────────────────────────────────────────────────────────────────
  IF v_match.event_id IS NOT NULL THEN
    -- Average ELO per team in the EVENT context.
    SELECT AVG(em.elo) INTO v_team_a_avg_elo
      FROM public.event_memberships em
     WHERE em.event_id = v_match.event_id
       AND em.player_id = ANY(v_match.team_a_player_ids);

    SELECT AVG(em.elo) INTO v_team_b_avg_elo
      FROM public.event_memberships em
     WHERE em.event_id = v_match.event_id
       AND em.player_id = ANY(v_match.team_b_player_ids);

    -- Players without a membership yet → treat as 1000 (default), to mirror
    -- the client's previous behaviour where the resolver returned a Player
    -- with elo=1000 for missing memberships.
    v_team_a_avg_elo := COALESCE(v_team_a_avg_elo, 1000);
    v_team_b_avg_elo := COALESCE(v_team_b_avg_elo, 1000);

    v_expected_a := 1.0 / (1.0 + power(10.0, (v_team_b_avg_elo - v_team_a_avg_elo) / 400.0));
    v_expected_b := 1.0 / (1.0 + power(10.0, (v_team_a_avg_elo - v_team_b_avg_elo) / 400.0));

    -- Walk team A
    FOREACH v_player_id IN ARRAY v_match.team_a_player_ids LOOP
      PERFORM public._apply_elo_for_player(
        p_match_id        := p_match_id,
        p_event_id        := v_match.event_id,
        p_league_id       := NULL,
        p_player_id       := v_player_id,
        p_actual_score    := CASE WHEN v_winner = 'A' THEN 1 ELSE 0 END,
        p_expected_score  := v_expected_a,
        p_is_winner       := v_winner = 'A'
      );
    END LOOP;

    FOREACH v_player_id IN ARRAY v_match.team_b_player_ids LOOP
      PERFORM public._apply_elo_for_player(
        p_match_id        := p_match_id,
        p_event_id        := v_match.event_id,
        p_league_id       := NULL,
        p_player_id       := v_player_id,
        p_actual_score    := CASE WHEN v_winner = 'B' THEN 1 ELSE 0 END,
        p_expected_score  := v_expected_b,
        p_is_winner       := v_winner = 'B'
      );
    END LOOP;
  END IF;

  -- ──────────────────────────────────────────────────────────────────
  -- 4. LEAGUE context — when the match has a league_id AND
  --    (no event, OR event.propagates_to_league_elo = true).
  --    The league delta is computed independently from the league
  --    baselines (NOT a copy of the event delta).
  -- ──────────────────────────────────────────────────────────────────
  IF v_match.league_id IS NOT NULL
     AND (v_match.event_id IS NULL OR v_propagates) THEN

    SELECT AVG(lm.elo) INTO v_team_a_avg_elo_l
      FROM public.league_memberships lm
     WHERE lm.league_id = v_match.league_id
       AND lm.player_id = ANY(v_match.team_a_player_ids);

    SELECT AVG(lm.elo) INTO v_team_b_avg_elo_l
      FROM public.league_memberships lm
     WHERE lm.league_id = v_match.league_id
       AND lm.player_id = ANY(v_match.team_b_player_ids);

    v_team_a_avg_elo_l := COALESCE(v_team_a_avg_elo_l, 1000);
    v_team_b_avg_elo_l := COALESCE(v_team_b_avg_elo_l, 1000);

    v_expected_a_l := 1.0 / (1.0 + power(10.0, (v_team_b_avg_elo_l - v_team_a_avg_elo_l) / 400.0));
    v_expected_b_l := 1.0 / (1.0 + power(10.0, (v_team_a_avg_elo_l - v_team_b_avg_elo_l) / 400.0));

    FOREACH v_player_id IN ARRAY v_match.team_a_player_ids LOOP
      PERFORM public._apply_elo_for_player(
        p_match_id        := p_match_id,
        p_event_id        := NULL,
        p_league_id       := v_match.league_id,
        p_player_id       := v_player_id,
        p_actual_score    := CASE WHEN v_winner = 'A' THEN 1 ELSE 0 END,
        p_expected_score  := v_expected_a_l,
        p_is_winner       := v_winner = 'A'
      );
    END LOOP;

    FOREACH v_player_id IN ARRAY v_match.team_b_player_ids LOOP
      PERFORM public._apply_elo_for_player(
        p_match_id        := p_match_id,
        p_event_id        := NULL,
        p_league_id       := v_match.league_id,
        p_player_id       := v_player_id,
        p_actual_score    := CASE WHEN v_winner = 'B' THEN 1 ELSE 0 END,
        p_expected_score  := v_expected_b_l,
        p_is_winner       := v_winner = 'B'
      );
    END LOOP;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.apply_match_elo(UUID) IS
  'Computes and persists the ELO delta for a confirmed ranked match. Idempotent. SECURITY DEFINER — the only legitimate path for elo_history / memberships stats writes.';

-- ──────────────────────────────────────────────────────────────────────
-- 5. _apply_elo_for_player — internal helper, applies the per-player delta
--    in either the event or league context (exactly one of p_event_id /
--    p_league_id must be non-NULL).
-- ──────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public._apply_elo_for_player(
  p_match_id        UUID,
  p_event_id        UUID,
  p_league_id       UUID,
  p_player_id       UUID,
  p_actual_score    NUMERIC,
  p_expected_score  NUMERIC,
  p_is_winner       BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_membership_id    UUID;
  v_elo_before       INTEGER;
  v_matches_played   INTEGER;
  v_wins             INTEGER;
  v_losses           INTEGER;
  v_streak           INTEGER;
  v_k                INTEGER;
  v_change           INTEGER;
  v_elo_after        INTEGER;
  v_new_streak       INTEGER;
BEGIN
  IF (p_event_id IS NULL) = (p_league_id IS NULL) THEN
    RAISE EXCEPTION '_apply_elo_for_player: exactly one of p_event_id / p_league_id must be set';
  END IF;

  IF p_event_id IS NOT NULL THEN
    SELECT id, elo, matches_played, wins, losses, streak
      INTO v_membership_id, v_elo_before, v_matches_played, v_wins, v_losses, v_streak
      FROM public.event_memberships
     WHERE event_id = p_event_id AND player_id = p_player_id
       FOR UPDATE;

    -- No membership for this player in this context: skip silently — mirrors
    -- the legacy client behaviour (it just ignored unmapped players).
    IF NOT FOUND THEN RETURN; END IF;
  ELSE
    SELECT id, elo, matches_played, wins, losses, streak
      INTO v_membership_id, v_elo_before, v_matches_played, v_wins, v_losses, v_streak
      FROM public.league_memberships
     WHERE league_id = p_league_id AND player_id = p_player_id
       FOR UPDATE;

    IF NOT FOUND THEN RETURN; END IF;
  END IF;

  v_k := public.elo_k_factor(v_matches_played);
  v_change := round(v_k * (p_actual_score - p_expected_score));
  v_elo_after := v_elo_before + v_change;

  -- Streak: positive streak = consecutive wins, negative = consecutive losses
  IF p_is_winner THEN
    v_new_streak := CASE WHEN v_streak > 0 THEN v_streak + 1 ELSE 1 END;
    v_wins  := v_wins + 1;
  ELSE
    v_new_streak := CASE WHEN v_streak < 0 THEN v_streak - 1 ELSE -1 END;
    v_losses := v_losses + 1;
  END IF;

  IF p_event_id IS NOT NULL THEN
    UPDATE public.event_memberships
       SET elo = v_elo_after,
           wins = v_wins,
           losses = v_losses,
           matches_played = v_matches_played + 1,
           streak = v_new_streak
     WHERE id = v_membership_id;
  ELSE
    UPDATE public.league_memberships
       SET elo = v_elo_after,
           wins = v_wins,
           losses = v_losses,
           matches_played = v_matches_played + 1,
           streak = v_new_streak
     WHERE id = v_membership_id;
  END IF;

  INSERT INTO public.elo_history (match_id, event_id, league_id, player_id, elo_before, elo_after, elo_change)
  VALUES (p_match_id, p_event_id, p_league_id, p_player_id, v_elo_before, v_elo_after, v_change);
END;
$$;

COMMENT ON FUNCTION public._apply_elo_for_player(UUID, UUID, UUID, UUID, NUMERIC, NUMERIC, BOOLEAN) IS
  'Internal helper for apply_match_elo. Applies a per-player delta in either the event or league context. Skips silently if the player has no membership in that context.';

-- ──────────────────────────────────────────────────────────────────────
-- 6. recalculate_league_elo — admin recovery path, replays every ranked
--    match attached to a league in chronological order. Wipes existing
--    league elo_history + resets league_memberships stats first.
--    Used by EloRecalcService after admin edit/delete of a match.
-- ──────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.recalculate_league_elo(p_league_id UUID)
RETURNS INTEGER  -- number of matches replayed
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_match_id UUID;
  v_replayed INTEGER := 0;
BEGIN
  -- Reset league memberships
  UPDATE public.league_memberships
     SET elo = 1000, wins = 0, losses = 0, matches_played = 0, streak = 0
   WHERE league_id = p_league_id;

  -- Wipe league-context history (event-context history for events linked to
  -- this league is left intact — recalculate the event separately if needed)
  DELETE FROM public.elo_history
   WHERE league_id = p_league_id;

  -- Replay every ranked, non-rejected match attached to this league in chrono order
  FOR v_match_id IN
    SELECT id
      FROM public.matches
     WHERE league_id = p_league_id
       AND COALESCE(is_ranked, TRUE) = TRUE
       AND COALESCE(status, 'confirmed') <> 'rejected'
       AND score_a <> score_b
     ORDER BY created_at ASC
  LOOP
    BEGIN
      PERFORM public.apply_match_elo(v_match_id);
      v_replayed := v_replayed + 1;
    EXCEPTION
      WHEN OTHERS THEN
        -- Skip matches that fail individual checks (already-applied, pending+anti-cheat, …)
        -- but keep replaying the rest. Surfaced to the caller via the count.
        CONTINUE;
    END;
  END LOOP;

  RETURN v_replayed;
END;
$$;

COMMENT ON FUNCTION public.recalculate_league_elo(UUID) IS
  'Wipes league memberships stats + league elo_history, then replays every ranked match attached to the league in chronological order via apply_match_elo. Returns the number of matches replayed.';

-- ──────────────────────────────────────────────────────────────────────
-- 7. Grants — only authenticated and anon can invoke. service_role inherits.
--    The functions are SECURITY DEFINER so they bypass RLS regardless of the
--    invoking role.
-- ──────────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.apply_match_elo(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.recalculate_league_elo(UUID) TO authenticated, anon;
-- _apply_elo_for_player is internal: NO grant to authenticated/anon.

COMMIT;
