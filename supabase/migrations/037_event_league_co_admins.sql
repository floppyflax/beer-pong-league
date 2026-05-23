-- Migration 037 — Co-admins via role sur memberships
--
-- Permet au créateur (creator_user_id) d'un event ou d'une ligue de promouvoir
-- un joueur disposant d'un compte (players.user_id IS NOT NULL) au rôle de
-- co-admin. Les co-admins peuvent gérer le contexte (modifier params, valider
-- scores, éditer matchs, retirer des joueurs) MAIS NE PEUVENT PAS supprimer
-- l'entité ni promouvoir/démouvoir d'autres admins — ces deux actions restent
-- l'apanage du créateur.
--
-- Choix d'implémentation : on étend `event_memberships` / `league_memberships`
-- avec une colonne `role`. Le creator n'est pas inscrit comme admin via le
-- membership (son droit est dérivé de `creator_user_id`). Le champ `role`
-- traite uniquement les co-admins.
--
-- Helpers SQL :
--   - public._is_event_admin(p_event_id, p_caller_user_id)
--   - public._is_league_admin(p_league_id, p_caller_user_id)
--   Retournent TRUE si caller = creator OU si caller a une membership active
--   role='admin' sur le contexte (membership.player.user_id = caller).
--
-- RPC promotion / démotion :
--   - public.set_event_membership_role(p_membership_id, p_role, p_caller_user_id)
--   - public.set_league_membership_role(p_membership_id, p_role, p_caller_user_id)
--   SECURITY DEFINER. Seul le creator du contexte peut promouvoir/démouvoir.
--   Promouvoir un membership ghost (player.user_id IS NULL) est interdit.
--
-- RPC admin existantes patchées pour reconnaître les co-admins :
--   - confirm_match (mig 030/032)
--   - admin_update_match (mig 036)
--   - admin_delete_match (mig 036)
--   - associate_event_to_league (mig 036)
--
-- Sémantique d'identité : caller_user_id = users.id (modèle unifié mig 022 /
-- pattern mig 036). Identique aux autres RPC admin de l'app.

BEGIN;

-- ──────────────────────────────────────────────────────────────────────
-- 1. Colonne `role` sur memberships
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.event_memberships
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member'
  CHECK (role IN ('member', 'admin'));

ALTER TABLE public.league_memberships
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member'
  CHECK (role IN ('member', 'admin'));

-- Index partiels pour les lookups admin (peu de co-admins en général).
CREATE INDEX IF NOT EXISTS idx_em_admin
  ON public.event_memberships(event_id)
  WHERE role = 'admin' AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_lm_admin
  ON public.league_memberships(league_id)
  WHERE role = 'admin' AND archived_at IS NULL;

COMMENT ON COLUMN public.event_memberships.role IS
  'Rôle du joueur dans l''event. ''member'' (défaut) ou ''admin'' (co-admin promu par le creator). Le creator n''est PAS inscrit comme admin ici — son droit dérive de events.creator_user_id.';

COMMENT ON COLUMN public.league_memberships.role IS
  'Rôle du joueur dans la ligue. ''member'' (défaut) ou ''admin'' (co-admin promu par le creator). Le creator n''est PAS inscrit comme admin ici — son droit dérive de leagues.creator_user_id.';

-- ──────────────────────────────────────────────────────────────────────
-- 2. Helpers SQL — is admin of event / league
-- ──────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public._is_event_admin(
  p_event_id       UUID,
  p_caller_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_creator UUID;
  v_match   BOOLEAN;
BEGIN
  IF p_event_id IS NULL OR p_caller_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  v_creator := (SELECT creator_user_id FROM public.events WHERE id = p_event_id);
  IF v_creator = p_caller_user_id THEN
    RETURN TRUE;
  END IF;

  v_match := EXISTS (
    SELECT 1
      FROM public.event_memberships em
      JOIN public.players p ON p.id = em.player_id
     WHERE em.event_id = p_event_id
       AND em.role = 'admin'
       AND em.archived_at IS NULL
       AND p.user_id = p_caller_user_id
       AND p.archived_at IS NULL
  );
  RETURN COALESCE(v_match, FALSE);
END;
$fn$;

COMMENT ON FUNCTION public._is_event_admin(UUID, UUID) IS
  'TRUE si le caller (users.id) est le créateur de l''event OU un co-admin actif (membership.role=admin, player non archivé).';

GRANT EXECUTE ON FUNCTION public._is_event_admin(UUID, UUID) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public._is_league_admin(
  p_league_id      UUID,
  p_caller_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_creator UUID;
  v_match   BOOLEAN;
BEGIN
  IF p_league_id IS NULL OR p_caller_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  v_creator := (SELECT creator_user_id FROM public.leagues WHERE id = p_league_id);
  IF v_creator = p_caller_user_id THEN
    RETURN TRUE;
  END IF;

  v_match := EXISTS (
    SELECT 1
      FROM public.league_memberships lm
      JOIN public.players p ON p.id = lm.player_id
     WHERE lm.league_id = p_league_id
       AND lm.role = 'admin'
       AND lm.archived_at IS NULL
       AND p.user_id = p_caller_user_id
       AND p.archived_at IS NULL
  );
  RETURN COALESCE(v_match, FALSE);
END;
$fn$;

COMMENT ON FUNCTION public._is_league_admin(UUID, UUID) IS
  'TRUE si le caller (users.id) est le créateur de la ligue OU un co-admin actif (membership.role=admin, player non archivé).';

GRANT EXECUTE ON FUNCTION public._is_league_admin(UUID, UUID) TO authenticated, anon;

-- ──────────────────────────────────────────────────────────────────────
-- 3. RPC set_event_membership_role / set_league_membership_role
-- ──────────────────────────────────────────────────────────────────────
-- Seul le creator de l'event/league peut promouvoir/démouvoir.
-- On refuse de promouvoir un membership ghost (player.user_id IS NULL).

CREATE OR REPLACE FUNCTION public.set_event_membership_role(
  p_membership_id  UUID,
  p_role           TEXT,
  p_caller_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_event_id       UUID;
  v_player_id      UUID;
  v_player_user_id UUID;
  v_creator        UUID;
BEGIN
  IF p_role NOT IN ('member', 'admin') THEN
    RAISE EXCEPTION 'set_event_membership_role: invalid role %', p_role
      USING ERRCODE = 'check_violation';
  END IF;
  IF p_caller_user_id IS NULL THEN
    RAISE EXCEPTION 'set_event_membership_role: caller_user_id required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  PERFORM 1 FROM public.event_memberships WHERE id = p_membership_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'set_event_membership_role: membership % not found', p_membership_id
      USING ERRCODE = 'no_data_found';
  END IF;

  v_event_id  := (SELECT event_id  FROM public.event_memberships WHERE id = p_membership_id);
  v_player_id := (SELECT player_id FROM public.event_memberships WHERE id = p_membership_id);

  v_creator := (SELECT creator_user_id FROM public.events WHERE id = v_event_id);
  IF v_creator IS NULL OR v_creator <> p_caller_user_id THEN
    RAISE EXCEPTION 'set_event_membership_role: only the event creator can change roles'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_role = 'admin' THEN
    v_player_user_id := (SELECT user_id FROM public.players WHERE id = v_player_id);
    IF v_player_user_id IS NULL THEN
      RAISE EXCEPTION 'set_event_membership_role: a ghost player cannot be promoted to admin'
        USING ERRCODE = 'check_violation';
    END IF;
    IF v_player_user_id = v_creator THEN
      RAISE EXCEPTION 'set_event_membership_role: the creator cannot be promoted (already admin)'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  UPDATE public.event_memberships SET role = p_role WHERE id = p_membership_id;

  RETURN jsonb_build_object('membership_id', p_membership_id, 'role', p_role, 'event_id', v_event_id);
END;
$fn$;

COMMENT ON FUNCTION public.set_event_membership_role(UUID, TEXT, UUID) IS
  'Promeut ou démeut un membership event au rôle admin/member. Seul le creator peut appeler. Refuse de promouvoir un ghost ou le creator lui-même. SECURITY DEFINER.';

GRANT EXECUTE ON FUNCTION public.set_event_membership_role(UUID, TEXT, UUID) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.set_league_membership_role(
  p_membership_id  UUID,
  p_role           TEXT,
  p_caller_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_league_id      UUID;
  v_player_id      UUID;
  v_player_user_id UUID;
  v_creator        UUID;
BEGIN
  IF p_role NOT IN ('member', 'admin') THEN
    RAISE EXCEPTION 'set_league_membership_role: invalid role %', p_role
      USING ERRCODE = 'check_violation';
  END IF;
  IF p_caller_user_id IS NULL THEN
    RAISE EXCEPTION 'set_league_membership_role: caller_user_id required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  PERFORM 1 FROM public.league_memberships WHERE id = p_membership_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'set_league_membership_role: membership % not found', p_membership_id
      USING ERRCODE = 'no_data_found';
  END IF;

  v_league_id := (SELECT league_id FROM public.league_memberships WHERE id = p_membership_id);
  v_player_id := (SELECT player_id FROM public.league_memberships WHERE id = p_membership_id);

  v_creator := (SELECT creator_user_id FROM public.leagues WHERE id = v_league_id);
  IF v_creator IS NULL OR v_creator <> p_caller_user_id THEN
    RAISE EXCEPTION 'set_league_membership_role: only the league creator can change roles'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_role = 'admin' THEN
    v_player_user_id := (SELECT user_id FROM public.players WHERE id = v_player_id);
    IF v_player_user_id IS NULL THEN
      RAISE EXCEPTION 'set_league_membership_role: a ghost player cannot be promoted to admin'
        USING ERRCODE = 'check_violation';
    END IF;
    IF v_player_user_id = v_creator THEN
      RAISE EXCEPTION 'set_league_membership_role: the creator cannot be promoted (already admin)'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  UPDATE public.league_memberships SET role = p_role WHERE id = p_membership_id;

  RETURN jsonb_build_object('membership_id', p_membership_id, 'role', p_role, 'league_id', v_league_id);
END;
$fn$;

COMMENT ON FUNCTION public.set_league_membership_role(UUID, TEXT, UUID) IS
  'Promeut ou démeut un membership league au rôle admin/member. Seul le creator peut appeler. Refuse de promouvoir un ghost ou le creator lui-même. SECURITY DEFINER.';

GRANT EXECUTE ON FUNCTION public.set_league_membership_role(UUID, TEXT, UUID) TO authenticated, anon;

-- ──────────────────────────────────────────────────────────────────────
-- 4. Patch des RPC admin existantes pour reconnaître les co-admins
-- ──────────────────────────────────────────────────────────────────────
-- On garde les signatures identiques (mêmes paramètres, dans le même ordre)
-- pour ne casser aucun caller. Seule la logique de check `v_is_admin` change :
-- elle délègue maintenant aux helpers `_is_event_admin` / `_is_league_admin`.

-- 4a. confirm_match — mig 030 (event) / mig 032 (league). Garde l'exact même
-- pattern, on remplace simplement la comparaison directe.

CREATE OR REPLACE FUNCTION public.confirm_match(
  p_match_id        UUID,
  p_decision        TEXT,
  p_caller_user_id  UUID
)
RETURNS TEXT
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
  v_score_validator     TEXT    := 'opponent';
  v_is_admin            BOOLEAN := FALSE;
  v_caller_player_id    UUID;
  v_creator_in_a        BOOLEAN := FALSE;
  v_creator_in_b        BOOLEAN := FALSE;
  v_opposing_team       UUID[];
  v_caller_in_opposing  BOOLEAN := FALSE;
BEGIN
  IF p_caller_user_id IS NULL THEN
    RAISE EXCEPTION 'confirm_match: caller_user_id required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_decision NOT IN ('confirmed', 'rejected') THEN
    RAISE EXCEPTION 'confirm_match: invalid decision %', p_decision
      USING ERRCODE = 'check_violation';
  END IF;

  PERFORM 1 FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'confirm_match: match % not found', p_match_id
      USING ERRCODE = 'no_data_found';
  END IF;

  v_status            := (SELECT status            FROM public.matches WHERE id = p_match_id);
  v_event_id          := (SELECT event_id          FROM public.matches WHERE id = p_match_id);
  v_league_id         := (SELECT league_id         FROM public.matches WHERE id = p_match_id);
  v_created_by        := (SELECT created_by_user_id FROM public.matches WHERE id = p_match_id);
  v_team_a_player_ids := (SELECT team_a_player_ids FROM public.matches WHERE id = p_match_id);
  v_team_b_player_ids := (SELECT team_b_player_ids FROM public.matches WHERE id = p_match_id);

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'confirm_match: match % is not pending (current: %)', p_match_id, v_status
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_event_id IS NOT NULL THEN
    v_event_anti_cheat := COALESCE((SELECT anti_cheat_enabled FROM public.events WHERE id = v_event_id), FALSE);
    v_score_validator  := COALESCE((SELECT score_validator    FROM public.events WHERE id = v_event_id), 'opponent');
  END IF;
  IF v_league_id IS NOT NULL THEN
    v_league_anti_cheat := COALESCE((SELECT anti_cheat_enabled FROM public.leagues WHERE id = v_league_id), FALSE);
    -- Si event sans validator explicite mais ligue avec validator='admin', honorer la ligue.
    -- Sémantique préservée de mig 032 : on prend le validator de l'event s'il existe, sinon celui de la ligue.
    IF v_event_id IS NULL THEN
      v_score_validator := COALESCE((SELECT score_validator FROM public.leagues WHERE id = v_league_id), 'opponent');
    END IF;
  END IF;

  IF NOT (v_event_anti_cheat OR v_league_anti_cheat) THEN
    RAISE EXCEPTION 'confirm_match: match % is not under anti-cheat', p_match_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- MIG 037 — admin = creator OU co-admin (event ou league).
  v_is_admin := (
    (v_event_id  IS NOT NULL AND public._is_event_admin(v_event_id, p_caller_user_id))
    OR
    (v_league_id IS NOT NULL AND public._is_league_admin(v_league_id, p_caller_user_id))
  );

  IF v_score_validator = 'admin' THEN
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'confirm_match: caller % is not admin of match %', p_caller_user_id, p_match_id
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSE
    IF v_is_admin THEN
      NULL;
    ELSE
      IF v_created_by IS NULL THEN
        RAISE EXCEPTION 'confirm_match: match % has no creator, only admin can confirm', p_match_id
          USING ERRCODE = 'insufficient_privilege';
      END IF;

      v_caller_player_id := (SELECT id FROM public.players WHERE user_id = v_created_by LIMIT 1);
      IF v_caller_player_id IS NOT NULL THEN
        v_creator_in_a := v_caller_player_id = ANY(v_team_a_player_ids);
        v_creator_in_b := v_caller_player_id = ANY(v_team_b_player_ids);
      END IF;
      IF NOT (v_creator_in_a OR v_creator_in_b) THEN
        RAISE EXCEPTION 'confirm_match: creator not in any team, only admin can confirm match %', p_match_id
          USING ERRCODE = 'insufficient_privilege';
      END IF;

      v_opposing_team := CASE WHEN v_creator_in_a THEN v_team_b_player_ids ELSE v_team_a_player_ids END;
      v_caller_in_opposing := EXISTS (
        SELECT 1 FROM public.players p
         WHERE p.user_id = p_caller_user_id AND p.id = ANY(v_opposing_team)
      );
      IF NOT v_caller_in_opposing THEN
        RAISE EXCEPTION 'confirm_match: caller % not in opposing team for match %', p_caller_user_id, p_match_id
          USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;
  END IF;

  UPDATE public.matches
     SET status               = p_decision,
         confirmed_by_user_id = p_caller_user_id,
         confirmed_at         = NOW()
   WHERE id = p_match_id;

  IF p_decision = 'confirmed' THEN
    PERFORM public.apply_match_elo(p_match_id);
  END IF;

  RETURN p_decision;
END;
$fn$;

COMMENT ON FUNCTION public.confirm_match(UUID, TEXT, UUID) IS
  'Confirm/reject a pending match. Admin (event creator OR league creator OR co-admin via membership role=admin) bypasse opponent check. MIG 037 étend l''admin aux co-admins.';

GRANT EXECUTE ON FUNCTION public.confirm_match(UUID, TEXT, UUID) TO authenticated, anon;

-- 4b. admin_update_match — mig 036. On garde la signature, on remplace le check.

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

  -- MIG 037 — admin = creator OU co-admin (event ou league).
  v_is_admin := (
    (v_event_id  IS NOT NULL AND public._is_event_admin(v_event_id, p_caller_user_id))
    OR
    (v_league_id IS NOT NULL AND public._is_league_admin(v_league_id, p_caller_user_id))
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

COMMENT ON FUNCTION public.admin_update_match(UUID, UUID[], UUID[], INTEGER, INTEGER, UUID) IS
  'Admin edit of a match. Admin check via _is_event_admin / _is_league_admin (MIG 037 — creator OR co-admin).';

REVOKE ALL ON FUNCTION public.admin_update_match(UUID, UUID[], UUID[], INTEGER, INTEGER, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_match(UUID, UUID[], UUID[], INTEGER, INTEGER, UUID) TO authenticated, anon;

-- 4c. admin_delete_match — mig 036.

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
    (v_event_id  IS NOT NULL AND public._is_event_admin(v_event_id, p_caller_user_id))
    OR
    (v_league_id IS NOT NULL AND public._is_league_admin(v_league_id, p_caller_user_id))
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

COMMENT ON FUNCTION public.admin_delete_match(UUID, UUID) IS
  'Admin deletion of a match. Admin check via _is_event_admin / _is_league_admin (MIG 037 — creator OR co-admin).';

REVOKE ALL ON FUNCTION public.admin_delete_match(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_match(UUID, UUID) TO authenticated, anon;

-- 4d. associate_event_to_league — mig 036. Admin = creator de l'event OU co-admin
-- de l'event, OU creator/co-admin de la (ancienne ou nouvelle) ligue.

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

  v_old_league_id := (SELECT league_id FROM public.events WHERE id = p_event_id);

  -- MIG 037 — admin de l'event OU d'une des deux ligues (ancienne / nouvelle).
  v_is_admin := (
    public._is_event_admin(p_event_id, p_caller_user_id)
    OR (v_old_league_id IS NOT NULL AND public._is_league_admin(v_old_league_id, p_caller_user_id))
    OR (p_league_id     IS NOT NULL AND public._is_league_admin(p_league_id,     p_caller_user_id))
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
  'Attach/detach an event to/from a league. Admin = event creator/co-admin OU creator/co-admin de l''ancienne ou de la nouvelle ligue (MIG 037).';

GRANT EXECUTE ON FUNCTION public.associate_event_to_league(UUID, UUID, UUID) TO authenticated, anon;

-- ──────────────────────────────────────────────────────────────────────
-- 5. RLS — co-admins can UPDATE events / leagues
-- ──────────────────────────────────────────────────────────────────────
-- Les co-admins doivent pouvoir modifier les paramètres (nom, anti-cheat,
-- format, etc.) du contexte. On AJOUTE une policy permissive — elle s'OR
-- avec les policies existantes (creator). Pas de policy pour DELETE :
-- la suppression reste réservée au créateur.
--
-- Sémantique : un co-admin doit être un user authentifié (mapping
-- auth_user_id requis), avec une membership active role='admin' sur le
-- contexte. Un ghost ne peut jamais être co-admin (cf. set_*_membership_role).

DROP POLICY IF EXISTS "Co-admins can update events" ON public.events;
CREATE POLICY "Co-admins can update events" ON public.events
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
        FROM public.event_memberships em
        JOIN public.players p ON p.id = em.player_id
        JOIN public.users   u ON u.id = p.user_id
       WHERE em.event_id = events.id
         AND em.role = 'admin'
         AND em.archived_at IS NULL
         AND p.archived_at IS NULL
         AND u.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
        FROM public.event_memberships em
        JOIN public.players p ON p.id = em.player_id
        JOIN public.users   u ON u.id = p.user_id
       WHERE em.event_id = events.id
         AND em.role = 'admin'
         AND em.archived_at IS NULL
         AND p.archived_at IS NULL
         AND u.auth_user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Co-admins can update events" ON public.events IS
  'MIG 037 — autorise les co-admins (membership.role=admin) à modifier les paramètres de l''event. DELETE reste réservé au créateur.';

DROP POLICY IF EXISTS "Co-admins can update leagues" ON public.leagues;
CREATE POLICY "Co-admins can update leagues" ON public.leagues
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
        FROM public.league_memberships lm
        JOIN public.players p ON p.id = lm.player_id
        JOIN public.users   u ON u.id = p.user_id
       WHERE lm.league_id = leagues.id
         AND lm.role = 'admin'
         AND lm.archived_at IS NULL
         AND p.archived_at IS NULL
         AND u.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
        FROM public.league_memberships lm
        JOIN public.players p ON p.id = lm.player_id
        JOIN public.users   u ON u.id = p.user_id
       WHERE lm.league_id = leagues.id
         AND lm.role = 'admin'
         AND lm.archived_at IS NULL
         AND p.archived_at IS NULL
         AND u.auth_user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Co-admins can update leagues" ON public.leagues IS
  'MIG 037 — autorise les co-admins (membership.role=admin) à modifier les paramètres de la ligue. DELETE reste réservé au créateur.';

COMMIT;
