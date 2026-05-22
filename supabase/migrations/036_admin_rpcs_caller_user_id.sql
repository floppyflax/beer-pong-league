-- Migration 036 — Check admin via p_caller_user_id (modèle d'identité de l'app)
--
-- Bug : `associate_event_to_league` (mig 034/035) et `admin_update_match` /
-- `admin_delete_match` (mig 033) vérifiaient l'admin via
-- `users.auth_user_id = auth.uid()`. Or dans cette app le "current user id"
-- est l'id d'IDENTITÉ (souvent anonyme : `users.is_anonymous = TRUE`,
-- `auth_user_id` NULL) et c'est CET id qui est stocké dans
-- `events.creator_user_id` / `leagues.creator_user_id`. Le mapping auth_user_id
-- ne matche donc pas → 403 "only the event admin can (de)associate" même pour
-- le vrai créateur.
--
-- Fix : suivre le pattern de `confirm_match` (mig 030) — le client passe son
-- `p_caller_user_id` (id d'identité résolu côté client : user.id si
-- authentifié, sinon localUser.anonymousUserId) et la RPC le compare
-- DIRECTEMENT à `creator_user_id`. Cohérent avec `usePendingMatches.isAdmin`
-- et `useDetailPagePermissions`.
--
-- NB sécurité : ce modèle fait confiance à l'id passé par le client (comme
-- confirm_match). Le durcissement réel est la mig 031 (non déployée) — hors
-- scope ici. On reste au niveau de protection existant de l'app.

-- ── associate_event_to_league : + p_caller_user_id ──────────────────────
DROP FUNCTION IF EXISTS public.associate_event_to_league(UUID, UUID);

CREATE OR REPLACE FUNCTION public.associate_event_to_league(
  p_event_id       UUID,
  p_league_id      UUID,
  p_caller_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_old_league_id      UUID;
  v_event_creator      UUID;
  v_is_admin           BOOLEAN := FALSE;
  v_matches_propagated INTEGER := 0;
  v_old_replayed       INTEGER;
  v_new_replayed       INTEGER;
  v_predating          INTEGER := 0;
  v_season_start       TIMESTAMPTZ;
BEGIN
  PERFORM 1 FROM public.events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'associate_event_to_league: event % not found', p_event_id
      USING ERRCODE = 'no_data_found';
  END IF;

  v_event_creator := (SELECT creator_user_id FROM public.events WHERE id = p_event_id);
  v_old_league_id := (SELECT league_id       FROM public.events WHERE id = p_event_id);

  -- Caller must be the event creator, or the creator of the old/new league.
  v_is_admin := (
    (p_caller_user_id IS NOT NULL AND v_event_creator = p_caller_user_id)
    OR EXISTS (
      SELECT 1 FROM public.leagues l
       WHERE l.id IN (v_old_league_id, p_league_id)
         AND l.creator_user_id = p_caller_user_id
    )
  );
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'associate_event_to_league: only the event/league admin can (de)associate'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF v_old_league_id IS NOT DISTINCT FROM p_league_id THEN
    RETURN jsonb_build_object(
      'matches_propagated', 0, 'old_league_replayed', NULL,
      'new_league_replayed', NULL, 'matches_predating_season', 0, 'noop', TRUE
    );
  END IF;

  IF p_league_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.leagues WHERE id = p_league_id) THEN
    RAISE EXCEPTION 'associate_event_to_league: league % not found', p_league_id
      USING ERRCODE = 'no_data_found';
  END IF;

  UPDATE public.events SET league_id = p_league_id WHERE id = p_event_id;

  IF p_league_id IS NOT NULL THEN
    INSERT INTO public.league_memberships (league_id, player_id)
    SELECT p_league_id, em.player_id
      FROM public.event_memberships em
     WHERE em.event_id = p_event_id
       AND NOT EXISTS (
         SELECT 1 FROM public.league_memberships lm
          WHERE lm.league_id = p_league_id AND lm.player_id = em.player_id
       );
  END IF;

  UPDATE public.matches SET league_id = p_league_id WHERE event_id = p_event_id;
  GET DIAGNOSTICS v_matches_propagated = ROW_COUNT;

  IF p_league_id IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.league_season_archives WHERE league_id = p_league_id) THEN
    v_season_start := (SELECT current_season_started_at FROM public.leagues WHERE id = p_league_id);
    v_predating := (
      SELECT COUNT(*) FROM public.matches
       WHERE event_id = p_event_id AND v_season_start IS NOT NULL AND created_at < v_season_start
    );
  END IF;

  IF v_old_league_id IS NOT NULL THEN
    v_old_replayed := public.recalculate_league_elo(v_old_league_id);
  END IF;
  IF p_league_id IS NOT NULL THEN
    v_new_replayed := public.recalculate_league_elo(p_league_id);
  END IF;

  RETURN jsonb_build_object(
    'matches_propagated',       v_matches_propagated,
    'old_league_replayed',      v_old_replayed,
    'new_league_replayed',      v_new_replayed,
    'matches_predating_season', v_predating,
    'noop',                     FALSE
  );
END;
$fn$;

COMMENT ON FUNCTION public.associate_event_to_league(UUID, UUID, UUID) IS
  'Attach/detach an event to/from a league atomically. Admin check: p_caller_user_id must equal the event creator or the old/new league creator (app identity model, cf. confirm_match mig 030). SECURITY DEFINER.';

GRANT EXECUTE ON FUNCTION public.associate_event_to_league(UUID, UUID, UUID) TO authenticated, anon;

-- ── admin_update_match : + p_caller_user_id ─────────────────────────────
-- Drop the prior signatures (mig 033) so we don't leave ambiguous overloads.
DROP FUNCTION IF EXISTS public.admin_update_match(UUID, UUID[], UUID[], INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.admin_update_match(
  p_match_id          UUID,
  p_team_a_player_ids UUID[],
  p_team_b_player_ids UUID[],
  p_score_a           INTEGER,
  p_score_b           INTEGER,
  p_caller_user_id    UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_event_id  UUID;
  v_league_id UUID;
  v_is_admin  BOOLEAN := FALSE;
  v_format    TEXT;
  v_size_a    INT;
  v_size_b    INT;
BEGIN
  PERFORM 1 FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'admin_update_match: match % not found', p_match_id
      USING ERRCODE = 'no_data_found';
  END IF;

  v_event_id  := (SELECT event_id  FROM public.matches WHERE id = p_match_id);
  v_league_id := (SELECT league_id FROM public.matches WHERE id = p_match_id);

  v_is_admin := (
    (v_event_id  IS NOT NULL AND EXISTS (SELECT 1 FROM public.events  e WHERE e.id = v_event_id  AND e.creator_user_id = p_caller_user_id))
    OR
    (v_league_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.leagues l WHERE l.id = v_league_id AND l.creator_user_id = p_caller_user_id))
  );
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'admin_update_match: only the event/league admin can edit matches'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_score_a IS NULL OR p_score_b IS NULL OR p_score_a < 0 OR p_score_b < 0 THEN
    RAISE EXCEPTION 'admin_update_match: invalid scores' USING ERRCODE = 'check_violation';
  END IF;

  IF p_team_a_player_ids IS NULL OR p_team_b_player_ids IS NULL
     OR array_length(p_team_a_player_ids, 1) IS NULL
     OR array_length(p_team_b_player_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'admin_update_match: teams cannot be empty' USING ERRCODE = 'check_violation';
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
    RAISE EXCEPTION 'admin_update_match: invalid team sizes (%, %)', v_size_a, v_size_b
      USING ERRCODE = 'check_violation';
  END IF;

  DELETE FROM public.elo_history WHERE match_id = p_match_id;

  UPDATE public.matches
     SET team_a_player_ids = p_team_a_player_ids,
         team_b_player_ids = p_team_b_player_ids,
         score_a = p_score_a, score_b = p_score_b, format = v_format
   WHERE id = p_match_id;

  RETURN json_build_object('success', TRUE, 'match_id', p_match_id,
                           'event_id', v_event_id, 'league_id', v_league_id);
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_update_match(UUID, UUID[], UUID[], INTEGER, INTEGER, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_match(UUID, UUID[], UUID[], INTEGER, INTEGER, UUID) TO authenticated, anon;

COMMENT ON FUNCTION public.admin_update_match(UUID, UUID[], UUID[], INTEGER, INTEGER, UUID) IS
  'Admin edit of a match. Admin check via p_caller_user_id = event/league creator (mig 036). Wipes elo_history; caller rebuilds via recalculate_*. Returns event_id + league_id.';

-- ── admin_delete_match : + p_caller_user_id ─────────────────────────────
DROP FUNCTION IF EXISTS public.admin_delete_match(UUID);

CREATE OR REPLACE FUNCTION public.admin_delete_match(
  p_match_id       UUID,
  p_caller_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_event_id  UUID;
  v_league_id UUID;
  v_is_admin  BOOLEAN := FALSE;
BEGIN
  PERFORM 1 FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'admin_delete_match: match % not found', p_match_id
      USING ERRCODE = 'no_data_found';
  END IF;

  v_event_id  := (SELECT event_id  FROM public.matches WHERE id = p_match_id);
  v_league_id := (SELECT league_id FROM public.matches WHERE id = p_match_id);

  v_is_admin := (
    (v_event_id  IS NOT NULL AND EXISTS (SELECT 1 FROM public.events  e WHERE e.id = v_event_id  AND e.creator_user_id = p_caller_user_id))
    OR
    (v_league_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.leagues l WHERE l.id = v_league_id AND l.creator_user_id = p_caller_user_id))
  );
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'admin_delete_match: only the event/league admin can delete matches'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  DELETE FROM public.matches WHERE id = p_match_id;

  RETURN json_build_object('success', TRUE, 'match_id', p_match_id,
                           'event_id', v_event_id, 'league_id', v_league_id);
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_delete_match(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_match(UUID, UUID) TO authenticated, anon;

COMMENT ON FUNCTION public.admin_delete_match(UUID, UUID) IS
  'Admin deletion of a match. Admin check via p_caller_user_id = event/league creator (mig 036). Cascades elo_history. Returns event_id + league_id.';