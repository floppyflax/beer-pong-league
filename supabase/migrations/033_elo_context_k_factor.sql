-- Migration 033 — Context-dependent K-factor (event = 64 flat, league = 32/16)
--
-- Decision (2026-05-22, product): the K-factor must depend on the ELO context.
--
--   - EVENT  → K = 64 flat. Events are short (~10-15 matches/player), so the
--     20-match tier never bites. A high flat K spreads the ranking and makes
--     the night's leaderboard lively. (Validated by simulation: K is a scale
--     factor — it widens the spread without changing order/fairness.)
--   - LEAGUE  → K = 32 for the first 20 matches, 16 afterwards (unchanged).
--     A durable, stable ranking of true level over a season. Raising K here
--     would only add noise (a league already spreads over dozens of matches).
--
-- Until now `elo_k_factor(matches_played)` (mig 025) was context-blind and
-- `_apply_elo_for_player` applied it to every context. This migration makes
-- the K context-aware and routes it from `_apply_elo_for_player`, which
-- already knows the context via p_event_id / p_league_id.
--
-- NOTE: we do NOT edit mig 025 in place — this is a follow-up migration that
-- CREATE OR REPLACEs the function bodies (per the elo-logic skill). The
-- `var := (SELECT ...)` style (no `SELECT ... INTO`) is kept for Dashboard
-- SQL Editor compatibility (cf. mig 025 header note). Keep this formula in
-- sync with apps/web/src/utils/elo.ts (calculateEloChange context param).

BEGIN;

-- ──────────────────────────────────────────────────────────────────────
-- 1. Context-aware K-factor. Replaces the single-arg helper from mig 025
--    (only `_apply_elo_for_player` referenced it, and it is replaced below).
-- ──────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.elo_k_factor(INTEGER);

CREATE OR REPLACE FUNCTION public.elo_k_factor(matches_played INTEGER, p_context TEXT)
RETURNS INTEGER
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT CASE
    WHEN p_context = 'event' THEN 64          -- event: flat, short format, wide spread
    WHEN matches_played < 20  THEN 32          -- league: player still calibrating
    ELSE 16                                     -- league: established, stable ranking
  END;
$$;

COMMENT ON FUNCTION public.elo_k_factor(INTEGER, TEXT) IS
  'K-factor par contexte. event=64 fixe (events courts, étalement/show) ; league=32 (<20 matchs) puis 16 (établi, classement durable). Garder en sync avec apps/web/src/utils/elo.ts.';

-- ──────────────────────────────────────────────────────────────────────
-- 2. _apply_elo_for_player — body reproduced from mig 025, with the single
--    `k_factor :=` line changed to pass the context. The context is derived
--    from which id is set (the function already asserts exactly one of
--    p_event_id / p_league_id is non-NULL).
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

  -- mig 033 — context-aware K: event=64 flat, league=32/16. The context is
  -- whichever of event/league this call is operating on.
  k_factor := public.elo_k_factor(
                prev_played,
                CASE WHEN p_event_id IS NOT NULL THEN 'event' ELSE 'league' END
              );
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
  'Internal helper for apply_match_elo. Applies a per-player delta in either the event or league context, using the context-aware K (mig 033: event=64 flat, league=32/16). Skips silently if the player has no membership in that context.';

COMMIT;
