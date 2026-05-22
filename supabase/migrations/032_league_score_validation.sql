-- Migration 032 — League score validation (anti-cheat mirror for leagues)
--
-- Mig 030 added `events.score_validator` + `confirm_match` RPC and shipped
-- the full anti-cheat product surface for events. The league side already
-- had `leagues.anti_cheat_enabled` (mig 002) and the `apply_match_elo`
-- enforcement (mig 025) — but no `score_validator` column and no
-- product surface (settings UI, dashboard banner, validation route).
--
-- This migration adds the missing DB pieces so the app layer can mirror
-- the event flow on leagues:
--
--   1. `leagues.score_validator` enum column — `opponent` (default) or
--      `admin`. Only read when `anti_cheat_enabled = TRUE`.
--
--   2. Patch `public.confirm_match` so a league-only pending match (event_id
--      IS NULL, league_id IS NOT NULL) reads `leagues.score_validator`
--      instead of falling back to the default `opponent`. The body is
--      otherwise identical to mig 030 — authz still walks event creator
--      OR league creator, admin bypass still applies, anti-replay is still
--      enforced via apply_match_elo.
--
-- RLS on `matches` is untouched — the policy installed by mig 030 already
-- exposes rejected rows to league admins via the leagues.creator_user_id
-- branch.
--
-- ─────────────────────────────────────────────────────────────────────────
-- DASHBOARD COMPATIBILITY NOTE (see mig 025 + 030)
-- ─────────────────────────────────────────────────────────────────────────
-- This migration uses `var := (SELECT ...)` instead of `SELECT ... INTO var`
-- inside PL/pgSQL bodies to dodge the Supabase Dashboard SQL Editor's
-- "unterminated dollar-quoted string" bug. Both forms work via CLI
-- (`supabase db push`).

BEGIN;

-- ──────────────────────────────────────────────────────────────────────
-- 1. score_validator column on leagues
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.leagues
  ADD COLUMN IF NOT EXISTS score_validator TEXT NOT NULL DEFAULT 'opponent';

-- Add the CHECK constraint idempotently (ADD COLUMN inline CHECK can't be
-- IF NOT EXISTS).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leagues_score_validator_check'
  ) THEN
    ALTER TABLE public.leagues
      ADD CONSTRAINT leagues_score_validator_check
      CHECK (score_validator IN ('opponent', 'admin'));
  END IF;
END $$;

COMMENT ON COLUMN public.leagues.score_validator IS
  'Who confirms scores when anti_cheat_enabled = TRUE on a league-only match (event_id IS NULL). opponent (default) = a player from the opposing team. admin = league creator only. Admin can always bypass in opponent mode (last resort).';

-- ──────────────────────────────────────────────────────────────────────
-- 2. confirm_match RPC — patched to honour leagues.score_validator
-- ──────────────────────────────────────────────────────────────────────
--
-- Diff vs mig 030, section 2e:
--   - Event-linked match → events.score_validator wins (event UX owns the
--     decision, propagation to league is downstream).
--   - League-only match (event_id IS NULL AND league_id IS NOT NULL) →
--     leagues.score_validator drives the authorization branch.
--   - No parent at all → fallthrough default 'opponent' (the policy
--     refuses afterward in 2f when neither anti-cheat flag is set).

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

  -- 2e. Look up parent contexts. Event-linked matches let events.score_validator
  --     win; league-only matches read leagues.score_validator (mig 032).
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

    -- Mig 032 — for league-only matches, the league's score_validator drives
    -- the authorization branch. Event-linked matches still defer to the
    -- event's setting (event UX owns the validation surface upstream).
    IF v_event_id IS NULL THEN
      v_score_validator := COALESCE(
        (SELECT score_validator FROM public.leagues WHERE id = v_league_id),
        'opponent'
      );
    END IF;
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
  'Confirm or reject a pending match under anti-cheat. Authorization branches on the parent score_validator (events.score_validator for event-linked matches, leagues.score_validator for league-only matches). Admin (event creator OR league creator) can always bypass. On confirm, calls apply_match_elo. SECURITY DEFINER — the only legitimate write path for status / confirmed_* fields on pending anti-cheat matches.';

GRANT EXECUTE ON FUNCTION public.confirm_match(UUID, TEXT, UUID) TO authenticated, anon;

COMMIT;
