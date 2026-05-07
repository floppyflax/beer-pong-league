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
-- ─────────────────────────────────────────────────────────────────────────
-- DASHBOARD COMPATIBILITY NOTE
-- ─────────────────────────────────────────────────────────────────────────
-- The Supabase Dashboard SQL Editor naively parses `SELECT ... INTO foo`
-- as `SELECT INTO new_table` (CREATE TABLE shorthand) even inside a
-- PL/pgSQL function body, then auto-injects an `ALTER TABLE foo ENABLE
-- ROW LEVEL SECURITY` mid-function which terminates the dollar-quoted
-- block prematurely. To work around that bug, this migration uses
-- explicit `var := (SELECT ...)` assignments throughout instead of
-- `SELECT ... INTO var`. The CLI (`supabase db push`) is happy with
-- either form.

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
-- 2. _apply_elo_for_player — internal helper, applies the per-player delta
--    in either the event or league context (exactly one of p_event_id /
--    p_league_id must be non-NULL).
--
--    Defined first so the CREATE FUNCTION above doesn't FORWARD-reference
--    it; PL/pgSQL will resolve the call at runtime regardless, but
--    keeping the dependency order clean helps readers.
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
AS $fn$
DECLARE
  membership_id  UUID;
  prev_elo       INTEGER;
  prev_played    INTEGER;
  prev_wins      INTEGER;
  prev_losses    INTEGER;
  prev_streak    INTEGER;
  k_factor       INTEGER;
  delta          INTEGER;
  next_elo       INTEGER;
  next_wins      INTEGER;
  next_losses    INTEGER;
  next_streak    INTEGER;
BEGIN
  IF (p_event_id IS NULL) = (p_league_id IS NULL) THEN
    RAISE EXCEPTION '_apply_elo_for_player: exactly one of p_event_id / p_league_id must be set';
  END IF;

  IF p_event_id IS NOT NULL THEN
    -- Lock the row first (no INTO clause so the Dashboard parser can't trip)
    PERFORM 1
      FROM public.event_memberships
     WHERE event_id = p_event_id AND player_id = p_player_id
       FOR UPDATE;

    IF NOT FOUND THEN
      -- Player has no membership in this event — skip silently (mirror
      -- of the legacy client behaviour for unmapped players).
      RETURN;
    END IF;

    membership_id := (SELECT id              FROM public.event_memberships WHERE event_id = p_event_id AND player_id = p_player_id);
    prev_elo      := (SELECT elo             FROM public.event_memberships WHERE id = membership_id);
    prev_played   := (SELECT matches_played  FROM public.event_memberships WHERE id = membership_id);
    prev_wins     := (SELECT wins            FROM public.event_memberships WHERE id = membership_id);
    prev_losses   := (SELECT losses          FROM public.event_memberships WHERE id = membership_id);
    prev_streak   := (SELECT streak          FROM public.event_memberships WHERE id = membership_id);
  ELSE
    PERFORM 1
      FROM public.league_memberships
     WHERE league_id = p_league_id AND player_id = p_player_id
       FOR UPDATE;

    IF NOT FOUND THEN RETURN; END IF;

    membership_id := (SELECT id              FROM public.league_memberships WHERE league_id = p_league_id AND player_id = p_player_id);
    prev_elo      := (SELECT elo             FROM public.league_memberships WHERE id = membership_id);
    prev_played   := (SELECT matches_played  FROM public.league_memberships WHERE id = membership_id);
    prev_wins     := (SELECT wins            FROM public.league_memberships WHERE id = membership_id);
    prev_losses   := (SELECT losses          FROM public.league_memberships WHERE id = membership_id);
    prev_streak   := (SELECT streak          FROM public.league_memberships WHERE id = membership_id);
  END IF;

  k_factor := public.elo_k_factor(prev_played);
  delta    := round(k_factor * (p_actual_score - p_expected_score));
  next_elo := prev_elo + delta;

  -- Streak: positive = consecutive wins, negative = consecutive losses
  IF p_is_winner THEN
    next_streak := CASE WHEN prev_streak > 0 THEN prev_streak + 1 ELSE 1 END;
    next_wins   := prev_wins + 1;
    next_losses := prev_losses;
  ELSE
    next_streak := CASE WHEN prev_streak < 0 THEN prev_streak - 1 ELSE -1 END;
    next_wins   := prev_wins;
    next_losses := prev_losses + 1;
  END IF;

  IF p_event_id IS NOT NULL THEN
    UPDATE public.event_memberships
       SET elo            = next_elo,
           wins           = next_wins,
           losses         = next_losses,
           matches_played = prev_played + 1,
           streak         = next_streak
     WHERE id = membership_id;
  ELSE
    UPDATE public.league_memberships
       SET elo            = next_elo,
           wins           = next_wins,
           losses         = next_losses,
           matches_played = prev_played + 1,
           streak         = next_streak
     WHERE id = membership_id;
  END IF;

  INSERT INTO public.elo_history (match_id, event_id, league_id, player_id, elo_before, elo_after, elo_change)
  VALUES (p_match_id, p_event_id, p_league_id, p_player_id, prev_elo, next_elo, delta);
END;
$fn$;

COMMENT ON FUNCTION public._apply_elo_for_player(UUID, UUID, UUID, UUID, NUMERIC, NUMERIC, BOOLEAN) IS
  'Internal helper for apply_match_elo. Applies a per-player delta in either the event or league context. Skips silently if the player has no membership in that context.';

-- ──────────────────────────────────────────────────────────────────────
-- 3. apply_match_elo — the only legitimate write path for ELO + stats.
-- ──────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.apply_match_elo(p_match_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  match_league_id        UUID;
  match_event_id         UUID;
  match_team_a_player_ids UUID[];
  match_team_b_player_ids UUID[];
  match_score_a          INTEGER;
  match_score_b          INTEGER;
  match_is_ranked        BOOLEAN;
  match_status           TEXT;
  league_anti_cheat      BOOLEAN := FALSE;
  event_anti_cheat       BOOLEAN := FALSE;
  propagates             BOOLEAN := FALSE;
  winner                 CHAR(1);
  team_a_avg_elo         NUMERIC;
  team_b_avg_elo         NUMERIC;
  expected_a             NUMERIC;
  expected_b             NUMERIC;
  team_a_avg_elo_l       NUMERIC;
  team_b_avg_elo_l       NUMERIC;
  expected_a_l           NUMERIC;
  expected_b_l           NUMERIC;
  loop_player_id         UUID;
  already_applied        BOOLEAN;
BEGIN
  -- 3a. Lock the match row (no INTO clause)
  PERFORM 1 FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'apply_match_elo: match % not found', p_match_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- 3b. Read the match fields via scalar subqueries (lock is already held)
  match_league_id          := (SELECT league_id          FROM public.matches WHERE id = p_match_id);
  match_event_id           := (SELECT event_id           FROM public.matches WHERE id = p_match_id);
  match_team_a_player_ids  := (SELECT team_a_player_ids  FROM public.matches WHERE id = p_match_id);
  match_team_b_player_ids  := (SELECT team_b_player_ids  FROM public.matches WHERE id = p_match_id);
  match_score_a            := (SELECT score_a            FROM public.matches WHERE id = p_match_id);
  match_score_b            := (SELECT score_b            FROM public.matches WHERE id = p_match_id);
  match_is_ranked          := (SELECT is_ranked          FROM public.matches WHERE id = p_match_id);
  match_status             := (SELECT status             FROM public.matches WHERE id = p_match_id);

  -- 3c. Refuse non-ranked or rejected matches
  IF match_is_ranked IS NOT TRUE THEN
    RAISE EXCEPTION 'apply_match_elo: match % is not ranked', p_match_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF match_status = 'rejected' THEN
    RAISE EXCEPTION 'apply_match_elo: match % was rejected', p_match_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- 3d. Anti-cheat — when the parent context requires confirmation, refuse pending
  IF match_event_id IS NOT NULL THEN
    event_anti_cheat := COALESCE(
      (SELECT anti_cheat_enabled FROM public.events WHERE id = match_event_id),
      FALSE
    );
    propagates := COALESCE(
      (SELECT propagates_to_league_elo FROM public.events WHERE id = match_event_id),
      TRUE
    );
  END IF;

  IF match_league_id IS NOT NULL THEN
    league_anti_cheat := COALESCE(
      (SELECT anti_cheat_enabled FROM public.leagues WHERE id = match_league_id),
      FALSE
    );
  END IF;

  IF (event_anti_cheat OR league_anti_cheat) AND match_status <> 'confirmed' THEN
    RAISE EXCEPTION 'apply_match_elo: match % awaits confirmation under anti-cheat', p_match_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- 3e. Anti-replay
  already_applied := EXISTS(SELECT 1 FROM public.elo_history WHERE match_id = p_match_id);
  IF already_applied THEN
    RAISE EXCEPTION 'apply_match_elo: match % already has elo_history (anti-replay)', p_match_id
      USING ERRCODE = 'unique_violation';
  END IF;

  -- 3f. Decide the winner — ties refused (no winner).
  IF match_score_a > match_score_b THEN
    winner := 'A';
  ELSIF match_score_b > match_score_a THEN
    winner := 'B';
  ELSE
    RAISE EXCEPTION 'apply_match_elo: match % has equal scores (no winner)', p_match_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- ──────────────────────────────────────────────────────────────────
  -- 4. EVENT context (always when event_id IS NOT NULL)
  --    Each player gets a delta computed from the team's average ELO
  --    (in the EVENT context: event_memberships.elo).
  -- ──────────────────────────────────────────────────────────────────
  IF match_event_id IS NOT NULL THEN
    team_a_avg_elo := COALESCE(
      (SELECT AVG(em.elo)
         FROM public.event_memberships em
        WHERE em.event_id = match_event_id
          AND em.player_id = ANY(match_team_a_player_ids)),
      1000
    );

    team_b_avg_elo := COALESCE(
      (SELECT AVG(em.elo)
         FROM public.event_memberships em
        WHERE em.event_id = match_event_id
          AND em.player_id = ANY(match_team_b_player_ids)),
      1000
    );

    expected_a := 1.0 / (1.0 + power(10.0, (team_b_avg_elo - team_a_avg_elo) / 400.0));
    expected_b := 1.0 / (1.0 + power(10.0, (team_a_avg_elo - team_b_avg_elo) / 400.0));

    FOREACH loop_player_id IN ARRAY match_team_a_player_ids LOOP
      PERFORM public._apply_elo_for_player(
        p_match_id        := p_match_id,
        p_event_id        := match_event_id,
        p_league_id       := NULL,
        p_player_id       := loop_player_id,
        p_actual_score    := CASE WHEN winner = 'A' THEN 1 ELSE 0 END,
        p_expected_score  := expected_a,
        p_is_winner       := winner = 'A'
      );
    END LOOP;

    FOREACH loop_player_id IN ARRAY match_team_b_player_ids LOOP
      PERFORM public._apply_elo_for_player(
        p_match_id        := p_match_id,
        p_event_id        := match_event_id,
        p_league_id       := NULL,
        p_player_id       := loop_player_id,
        p_actual_score    := CASE WHEN winner = 'B' THEN 1 ELSE 0 END,
        p_expected_score  := expected_b,
        p_is_winner       := winner = 'B'
      );
    END LOOP;
  END IF;

  -- ──────────────────────────────────────────────────────────────────
  -- 5. LEAGUE context — when the match has a league_id AND
  --    (no event, OR event.propagates_to_league_elo = true).
  --    The league delta is computed independently from the league
  --    baselines (NOT a copy of the event delta).
  -- ──────────────────────────────────────────────────────────────────
  IF match_league_id IS NOT NULL
     AND (match_event_id IS NULL OR propagates) THEN

    team_a_avg_elo_l := COALESCE(
      (SELECT AVG(lm.elo)
         FROM public.league_memberships lm
        WHERE lm.league_id = match_league_id
          AND lm.player_id = ANY(match_team_a_player_ids)),
      1000
    );

    team_b_avg_elo_l := COALESCE(
      (SELECT AVG(lm.elo)
         FROM public.league_memberships lm
        WHERE lm.league_id = match_league_id
          AND lm.player_id = ANY(match_team_b_player_ids)),
      1000
    );

    expected_a_l := 1.0 / (1.0 + power(10.0, (team_b_avg_elo_l - team_a_avg_elo_l) / 400.0));
    expected_b_l := 1.0 / (1.0 + power(10.0, (team_a_avg_elo_l - team_b_avg_elo_l) / 400.0));

    FOREACH loop_player_id IN ARRAY match_team_a_player_ids LOOP
      PERFORM public._apply_elo_for_player(
        p_match_id        := p_match_id,
        p_event_id        := NULL,
        p_league_id       := match_league_id,
        p_player_id       := loop_player_id,
        p_actual_score    := CASE WHEN winner = 'A' THEN 1 ELSE 0 END,
        p_expected_score  := expected_a_l,
        p_is_winner       := winner = 'A'
      );
    END LOOP;

    FOREACH loop_player_id IN ARRAY match_team_b_player_ids LOOP
      PERFORM public._apply_elo_for_player(
        p_match_id        := p_match_id,
        p_event_id        := NULL,
        p_league_id       := match_league_id,
        p_player_id       := loop_player_id,
        p_actual_score    := CASE WHEN winner = 'B' THEN 1 ELSE 0 END,
        p_expected_score  := expected_b_l,
        p_is_winner       := winner = 'B'
      );
    END LOOP;
  END IF;
END;
$fn$;

COMMENT ON FUNCTION public.apply_match_elo(UUID) IS
  'Computes and persists the ELO delta for a confirmed ranked match. Idempotent. SECURITY DEFINER — the only legitimate path for elo_history / memberships stats writes.';

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
AS $fn$
DECLARE
  next_match_id UUID;
  replayed      INTEGER := 0;
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
  FOR next_match_id IN
    SELECT id
      FROM public.matches
     WHERE league_id = p_league_id
       AND COALESCE(is_ranked, TRUE) = TRUE
       AND COALESCE(status, 'confirmed') <> 'rejected'
       AND score_a <> score_b
     ORDER BY created_at ASC
  LOOP
    BEGIN
      PERFORM public.apply_match_elo(next_match_id);
      replayed := replayed + 1;
    EXCEPTION
      WHEN OTHERS THEN
        -- Skip matches that fail individual checks (already-applied, pending+anti-cheat, …)
        -- but keep replaying the rest. Surfaced to the caller via the count.
        CONTINUE;
    END;
  END LOOP;

  RETURN replayed;
END;
$fn$;

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
