-- Migration 030 — Event score validation (anti-cheat finalisation)
--
-- Mig 002 introduced `events.anti_cheat_enabled`, `matches.status`,
-- `matches.confirmed_by_user_id`, `matches.confirmed_at`.
-- Mig 025 enforced server-side ELO via `apply_match_elo` which refuses
-- to apply when `(events.anti_cheat_enabled OR leagues.anti_cheat_enabled)
-- AND matches.status <> 'confirmed'`.
--
-- BUT — the product surface to actually exercise that anti-cheat flow was
-- missing: no toggle in EventSettings, no `pending` status on insert in
-- MatchesRepository, no validation flow (confirm / reject), and no way to
-- pick *who* validates (opponent vs admin).
--
-- This migration adds the missing DB pieces:
--
--   1. `events.score_validator` enum column — `opponent` (default) or
--      `admin`. Only read when `anti_cheat_enabled = TRUE`.
--
--   2. `public.confirm_match(p_match_id, p_decision, p_caller_user_id)`
--      SECURITY DEFINER RPC. Locks the match, checks authorization
--      (mode opponent → caller in opposing team ; mode admin → event or
--      league creator ; admin bypass always allowed), flips
--      `matches.status` to `confirmed` or `rejected`, and calls
--      `apply_match_elo` on confirm. Anti-replay friendly (refuses when
--      status <> 'pending').
--
--   3. RLS policy on `matches` — mask `status = 'rejected'` rows from
--      non-admins (event creator OR league creator). Soft-delete UX:
--      rejected matches disappear from the player's history but stay
--      visible to admins for audit.
--
-- ─────────────────────────────────────────────────────────────────────────
-- DASHBOARD COMPATIBILITY NOTE (see mig 025)
-- ─────────────────────────────────────────────────────────────────────────
-- This migration uses `var := (SELECT ...)` instead of `SELECT ... INTO var`
-- inside PL/pgSQL bodies to dodge the Supabase Dashboard SQL Editor's
-- "unterminated dollar-quoted string" bug. Both forms work via CLI
-- (`supabase db push`).

BEGIN;

-- ──────────────────────────────────────────────────────────────────────
-- 1. score_validator column on events
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS score_validator TEXT NOT NULL DEFAULT 'opponent';

-- Add the CHECK constraint idempotently (ADD COLUMN inline CHECK can't be
-- IF NOT EXISTS).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_score_validator_check'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_score_validator_check
      CHECK (score_validator IN ('opponent', 'admin'));
  END IF;
END $$;

COMMENT ON COLUMN public.events.score_validator IS
  'Who confirms scores when anti_cheat_enabled = TRUE. opponent (default) = a player from the losing/opposing team. admin = event creator (and league creator if linked) only. Admin can always bypass in opponent mode (last resort).';

-- ──────────────────────────────────────────────────────────────────────
-- 2. confirm_match RPC
-- ──────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.confirm_match(
  p_match_id        UUID,
  p_decision        TEXT,
  p_caller_user_id  UUID
)
RETURNS TEXT  -- the new match status: 'confirmed' or 'rejected'
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_status              TEXT;
  v_event_id            UUID;
  v_league_id           UUID;
  v_created_by          UUID;
  v_team_a_player_ids   UUID[];
  v_team_b_player_ids   UUID[];
  v_event_anti_cheat    BOOLEAN := FALSE;
  v_league_anti_cheat   BOOLEAN := FALSE;
  v_score_validator     TEXT := 'opponent';
  v_event_creator       UUID;
  v_league_creator      UUID;
  v_is_admin            BOOLEAN := FALSE;
  v_creator_in_a        BOOLEAN := FALSE;
  v_creator_in_b        BOOLEAN := FALSE;
  v_opposing_team       UUID[];
  v_caller_player_id    UUID;
  v_caller_in_opposing  BOOLEAN := FALSE;
BEGIN
  -- 2a. Decision must be a known value.
  IF p_decision NOT IN ('confirmed', 'rejected') THEN
    RAISE EXCEPTION 'confirm_match: invalid decision %', p_decision
      USING ERRCODE = 'check_violation';
  END IF;

  -- 2b. Lock the match row (no INTO clause — Dashboard parser).
  PERFORM 1 FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'confirm_match: match % not found', p_match_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- 2c. Read the match fields via scalar subqueries.
  v_status            := (SELECT status            FROM public.matches WHERE id = p_match_id);
  v_event_id          := (SELECT event_id          FROM public.matches WHERE id = p_match_id);
  v_league_id         := (SELECT league_id         FROM public.matches WHERE id = p_match_id);
  v_created_by        := (SELECT created_by_user_id FROM public.matches WHERE id = p_match_id);
  v_team_a_player_ids := (SELECT team_a_player_ids FROM public.matches WHERE id = p_match_id);
  v_team_b_player_ids := (SELECT team_b_player_ids FROM public.matches WHERE id = p_match_id);

  -- 2d. Only pending matches can be confirmed/rejected.
  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'confirm_match: match % is not pending (current: %)', p_match_id, v_status
      USING ERRCODE = 'check_violation';
  END IF;

  -- 2e. Look up parent contexts.
  IF v_event_id IS NOT NULL THEN
    v_event_anti_cheat := COALESCE(
      (SELECT anti_cheat_enabled FROM public.events WHERE id = v_event_id),
      FALSE
    );
    v_score_validator := COALESCE(
      (SELECT score_validator FROM public.events WHERE id = v_event_id),
      'opponent'
    );
    v_event_creator := (SELECT creator_user_id FROM public.events WHERE id = v_event_id);
  END IF;

  IF v_league_id IS NOT NULL THEN
    v_league_anti_cheat := COALESCE(
      (SELECT anti_cheat_enabled FROM public.leagues WHERE id = v_league_id),
      FALSE
    );
    v_league_creator := (SELECT creator_user_id FROM public.leagues WHERE id = v_league_id);
  END IF;

  -- 2f. No anti-cheat context → the match should never have been pending.
  IF NOT (v_event_anti_cheat OR v_league_anti_cheat) THEN
    RAISE EXCEPTION 'confirm_match: match % is not under anti-cheat', p_match_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- 2g. Resolve admin status. Superset of event admin + league admin.
  --     Event sans ligue → admin event seulement. Avec ligue → l'un OU l'autre.
  v_is_admin := (
    (v_event_creator IS NOT NULL AND p_caller_user_id = v_event_creator)
    OR
    (v_league_creator IS NOT NULL AND p_caller_user_id = v_league_creator)
  );

  -- 2h. Authorization — branch on score_validator.
  IF v_score_validator = 'admin' THEN
    -- Admin-only mode: caller must be an admin.
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'confirm_match: caller % is not admin of match %', p_caller_user_id, p_match_id
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSE
    -- Opponent mode: caller must be in the opposing team to the match creator,
    -- OR an admin (bypass).
    IF v_is_admin THEN
      -- Bypass.
      NULL;
    ELSE
      IF v_created_by IS NULL THEN
        -- No creator on file → we can't identify the opposing team. Only an
        -- admin can confirm. (Should never happen post-mig 022.)
        RAISE EXCEPTION 'confirm_match: match % has no creator, only admin can confirm', p_match_id
          USING ERRCODE = 'insufficient_privilege';
      END IF;

      -- Find the player_id owned by the creator (via players.user_id).
      v_caller_player_id := (
        SELECT id FROM public.players WHERE user_id = v_created_by LIMIT 1
      );

      IF v_caller_player_id IS NOT NULL THEN
        v_creator_in_a := v_caller_player_id = ANY(v_team_a_player_ids);
        v_creator_in_b := v_caller_player_id = ANY(v_team_b_player_ids);
      END IF;

      IF NOT (v_creator_in_a OR v_creator_in_b) THEN
        -- The match creator isn't in either team — only admin can resolve.
        RAISE EXCEPTION 'confirm_match: creator not in any team, only admin can confirm match %', p_match_id
          USING ERRCODE = 'insufficient_privilege';
      END IF;

      -- Opposing team = the one the creator is NOT in.
      v_opposing_team := CASE
        WHEN v_creator_in_a THEN v_team_b_player_ids
        ELSE v_team_a_player_ids
      END;

      -- Caller must own a player in the opposing team.
      v_caller_in_opposing := EXISTS (
        SELECT 1
          FROM public.players p
         WHERE p.user_id = p_caller_user_id
           AND p.id = ANY(v_opposing_team)
      );

      IF NOT v_caller_in_opposing THEN
        RAISE EXCEPTION 'confirm_match: caller % not in opposing team for match %', p_caller_user_id, p_match_id
          USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;
  END IF;

  -- 2i. Write the decision.
  UPDATE public.matches
     SET status               = p_decision,
         confirmed_by_user_id = p_caller_user_id,
         confirmed_at         = NOW()
   WHERE id = p_match_id;

  -- 2j. Apply ELO when confirmed. apply_match_elo is itself idempotent and
  --     refuses if elo_history already has rows for this match (anti-replay).
  IF p_decision = 'confirmed' THEN
    PERFORM public.apply_match_elo(p_match_id);
  END IF;

  RETURN p_decision;
END;
$fn$;

COMMENT ON FUNCTION public.confirm_match(UUID, TEXT, UUID) IS
  'Confirm or reject a pending match under anti-cheat. Authorization branches on events.score_validator (opponent | admin). Admin (event creator OR league creator) can always bypass. On confirm, calls apply_match_elo. SECURITY DEFINER — the only legitimate write path for status / confirmed_* fields on pending anti-cheat matches.';

GRANT EXECUTE ON FUNCTION public.confirm_match(UUID, TEXT, UUID) TO authenticated, anon;

-- ──────────────────────────────────────────────────────────────────────
-- 3. RLS — hide rejected matches from non-admins (soft-delete)
-- ──────────────────────────────────────────────────────────────────────
--
-- The existing policy "Anyone can read matches" (mig 001) is `USING (true)`.
-- Postgres AND-combines multiple permissive policies for the same role +
-- command — so we keep the open read and add a restrictive overlay that
-- prunes rejected rows for non-admins.
--
-- We DROP the old permissive policy and re-create it tighter rather than
-- relying on policy combination, because both are FOR SELECT and combining
-- two `USING (true)` style policies wouldn't actually restrict (they OR
-- together). The new single policy is what every read flows through.

DROP POLICY IF EXISTS "Anyone can read matches" ON public.matches;

CREATE POLICY "Matches readable except rejected for non-admins" ON public.matches
  FOR SELECT
  USING (
    status IS DISTINCT FROM 'rejected'
    OR EXISTS (
      SELECT 1
        FROM public.events e
        JOIN public.users u ON u.id = e.creator_user_id
       WHERE e.id = matches.event_id
         AND u.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
        FROM public.leagues l
        JOIN public.users u ON u.id = l.creator_user_id
       WHERE l.id = matches.league_id
         AND u.auth_user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Matches readable except rejected for non-admins" ON public.matches IS
  'Soft-delete for rejected matches: hidden from regular players, visible to event/league admins for audit.';

COMMIT;
