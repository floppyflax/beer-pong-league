-- Migration 033 — Réparer admin_update_match / admin_delete_match
--
-- Les RPC de mig 021 référencent encore le schéma pré-mig-022/024 :
--   * `matches.tournament_id`  → renommé `matches.event_id` (mig 024)
--   * `FROM tournaments`        → renommé `events` (mig 024)
--   * comparaison `creator_user_id <> auth.uid()` → cassé par le modèle
--     unifié mig 022 (creator_user_id pointe vers users.id, pas auth.uid()).
--
-- Résultat : les deux RPC échouent au runtime ("column tournament_id does
-- not exist" / "relation tournaments does not exist"). L'édition et la
-- suppression de match sont donc cassées.
--
-- Ce fix recrée les deux fonctions contre le schéma courant :
--   * lecture de `event_id, league_id` sur `matches`
--   * check admin via le mapping users.auth_user_id = auth.uid() (même
--     convention que confirm_match mig 030 et la policy RLS matches)
--   * retour JSON avec `event_id` (plus `tournament_id`) pour que le caller
--     déclenche le bon recalcul (recalculate_event_elo + recalculate_league_elo).
--
-- Sémantique conservée : update wipe l'elo_history du match ; delete cascade
-- via FK. Le recalcul ELO reste la responsabilité du caller (cf. Partie C —
-- EloRecalcService côté client).
--
-- DASHBOARD COMPATIBILITY : `var := (SELECT …)`, jamais `SELECT … INTO`.

BEGIN;

-- ──────────────────────────────────────────────────────────────────────
-- 1. admin_update_match
-- ──────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_update_match(
  p_match_id          UUID,
  p_team_a_player_ids UUID[],
  p_team_b_player_ids UUID[],
  p_score_a           INTEGER,
  p_score_b           INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_caller    UUID := auth.uid();
  v_event_id  UUID;
  v_league_id UUID;
  v_is_admin  BOOLEAN := FALSE;
  v_format    TEXT;
  v_size_a    INT;
  v_size_b    INT;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'admin_update_match: authenticated admin required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Lock the match row (no INTO clause).
  PERFORM 1 FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'admin_update_match: match % not found', p_match_id
      USING ERRCODE = 'no_data_found';
  END IF;

  v_event_id  := (SELECT event_id  FROM public.matches WHERE id = p_match_id);
  v_league_id := (SELECT league_id FROM public.matches WHERE id = p_match_id);

  -- Caller must own the event (preferred) or the league of the match.
  v_is_admin := (
    (v_event_id IS NOT NULL AND EXISTS (
       SELECT 1 FROM public.events e
         JOIN public.users u ON u.id = e.creator_user_id
        WHERE e.id = v_event_id AND u.auth_user_id = v_caller))
    OR
    (v_league_id IS NOT NULL AND EXISTS (
       SELECT 1 FROM public.leagues l
         JOIN public.users u ON u.id = l.creator_user_id
        WHERE l.id = v_league_id AND u.auth_user_id = v_caller))
  );

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'admin_update_match: only the event/league admin can edit matches'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_score_a IS NULL OR p_score_b IS NULL OR p_score_a < 0 OR p_score_b < 0 THEN
    RAISE EXCEPTION 'admin_update_match: invalid scores'
      USING ERRCODE = 'check_violation';
  END IF;

  IF p_team_a_player_ids IS NULL OR p_team_b_player_ids IS NULL
     OR array_length(p_team_a_player_ids, 1) IS NULL
     OR array_length(p_team_b_player_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'admin_update_match: teams cannot be empty'
      USING ERRCODE = 'check_violation';
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
    RAISE EXCEPTION 'admin_update_match: invalid team sizes (%, %) — must be 1v1, 2v2 or 3v3', v_size_a, v_size_b
      USING ERRCODE = 'check_violation';
  END IF;

  -- Wipe elo_history for this match (both contexts) — caller re-replays via
  -- recalculate_event_elo / recalculate_league_elo.
  DELETE FROM public.elo_history WHERE match_id = p_match_id;

  UPDATE public.matches
     SET team_a_player_ids = p_team_a_player_ids,
         team_b_player_ids = p_team_b_player_ids,
         score_a           = p_score_a,
         score_b           = p_score_b,
         format            = v_format
   WHERE id = p_match_id;

  RETURN json_build_object(
    'success',   TRUE,
    'match_id',  p_match_id,
    'event_id',  v_event_id,
    'league_id', v_league_id
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_update_match(UUID, UUID[], UUID[], INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_match(UUID, UUID[], UUID[], INTEGER, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.admin_update_match(UUID, UUID[], UUID[], INTEGER, INTEGER) IS
  'Admin edit of a match (teams + score). Wipes elo_history for the match; caller must rebuild ELO via recalculate_event_elo / recalculate_league_elo. Returns event_id + league_id. (mig 033 — aligned to events naming.)';

-- ──────────────────────────────────────────────────────────────────────
-- 2. admin_delete_match
-- ──────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_delete_match(p_match_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_caller    UUID := auth.uid();
  v_event_id  UUID;
  v_league_id UUID;
  v_is_admin  BOOLEAN := FALSE;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'admin_delete_match: authenticated admin required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  PERFORM 1 FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'admin_delete_match: match % not found', p_match_id
      USING ERRCODE = 'no_data_found';
  END IF;

  v_event_id  := (SELECT event_id  FROM public.matches WHERE id = p_match_id);
  v_league_id := (SELECT league_id FROM public.matches WHERE id = p_match_id);

  v_is_admin := (
    (v_event_id IS NOT NULL AND EXISTS (
       SELECT 1 FROM public.events e
         JOIN public.users u ON u.id = e.creator_user_id
        WHERE e.id = v_event_id AND u.auth_user_id = v_caller))
    OR
    (v_league_id IS NOT NULL AND EXISTS (
       SELECT 1 FROM public.leagues l
         JOIN public.users u ON u.id = l.creator_user_id
        WHERE l.id = v_league_id AND u.auth_user_id = v_caller))
  );

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'admin_delete_match: only the event/league admin can delete matches'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- elo_history cascades via FK (ON DELETE CASCADE, mig 001/024).
  DELETE FROM public.matches WHERE id = p_match_id;

  RETURN json_build_object(
    'success',   TRUE,
    'match_id',  p_match_id,
    'event_id',  v_event_id,
    'league_id', v_league_id
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_delete_match(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_match(UUID) TO authenticated;

COMMENT ON FUNCTION public.admin_delete_match(UUID) IS
  'Admin deletion of a match. Cascades elo_history. Caller must rebuild ELO via recalculate_event_elo / recalculate_league_elo. Returns event_id + league_id. (mig 033 — aligned to events naming.)';

COMMIT;
