-- Migration 035 — Le recalcul ligue compte les matchs importés (fix import)
--
-- Problème : `recalculate_league_elo` (mig 028/032) est borné par
-- `created_at >= current_season_started_at`. Or quand on importe un event
-- *en cours* dans une ligue fraîchement créée, les matchs de l'event ont été
-- joués AVANT la création de la ligue → ils précèdent `current_season_started_at`
-- → le recalcul les saute → l'ELO de la ligue reste à 1000. C'est l'inverse de
-- ce qu'on veut : importer un event, c'est justement faire compter ses matchs.
--
-- La borne saison n'a de sens que pour ISOLER les saisons archivées (après un
-- `start_new_league_season`). Tant qu'une ligue n'a JAMAIS été réinitialisée
-- (aucune ligne dans `league_season_archives`), tous ses matchs appartiennent
-- à la saison courante (la première) — il ne faut pas de borne basse.
--
-- Fix :
--   * `recalculate_league_elo` devient *archives-aware* : pas de borne si la
--     ligue n'a aucune archive de saison ; borne `current_season_started_at`
--     sinon (isolation des saisons préservée).
--   * `associate_event_to_league` : `matches_predating_season` ne compte que
--     si des archives existent (sinon ces matchs comptent, le warning serait
--     trompeur).

CREATE OR REPLACE FUNCTION public.recalculate_league_elo(p_league_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_season_started_at TIMESTAMPTZ;
  v_has_archives      BOOLEAN;
  next_match_id       UUID;
  replayed            INTEGER := 0;
BEGIN
  v_season_started_at := (SELECT current_season_started_at FROM public.leagues WHERE id = p_league_id);

  IF v_season_started_at IS NULL THEN
    RAISE EXCEPTION 'recalculate_league_elo: league % not found', p_league_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Une ligue sans archive n'a jamais été réinitialisée : tous ses matchs
  -- appartiennent à la saison courante. On ne borne donc PAS par created_at,
  -- ce qui permet aux matchs d'event importés (joués avant la création de la
  -- ligue) de compter.
  v_has_archives := EXISTS(
    SELECT 1 FROM public.league_season_archives WHERE league_id = p_league_id
  );

  UPDATE public.league_memberships
     SET elo = 1000, wins = 0, losses = 0, matches_played = 0, streak = 0
   WHERE league_id = p_league_id;

  DELETE FROM public.elo_history
   WHERE league_id = p_league_id;

  FOR next_match_id IN
    SELECT id
      FROM public.matches
     WHERE league_id = p_league_id
       AND (NOT v_has_archives OR created_at >= v_season_started_at)
       AND COALESCE(is_ranked, TRUE) = TRUE
       AND COALESCE(status, 'confirmed') <> 'rejected'
       AND score_a <> score_b
     ORDER BY created_at ASC
  LOOP
    BEGIN
      PERFORM public.apply_match_elo(next_match_id, 'league');
      replayed := replayed + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'recalculate_league_elo: skipped match % (%)', next_match_id, SQLERRM;
        CONTINUE;
    END;
  END LOOP;

  RETURN replayed;
END;
$fn$;

COMMENT ON FUNCTION public.recalculate_league_elo(UUID) IS
  'Replays every ranked, non-rejected match of a league in the LEAGUE context. Archives-aware (mig 035): no created_at bound when the league has no season archives (all matches belong to the current season — lets imported event matches count); bounded by current_season_started_at once archives exist (season isolation).';

CREATE OR REPLACE FUNCTION public.associate_event_to_league(
  p_event_id  UUID,
  p_league_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_caller             UUID := auth.uid();
  v_old_league_id      UUID;
  v_is_admin           BOOLEAN := FALSE;
  v_matches_propagated INTEGER := 0;
  v_old_replayed       INTEGER;
  v_new_replayed       INTEGER;
  v_predating          INTEGER := 0;
  v_season_start       TIMESTAMPTZ;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'associate_event_to_league: authenticated admin required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  PERFORM 1 FROM public.events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'associate_event_to_league: event % not found', p_event_id
      USING ERRCODE = 'no_data_found';
  END IF;

  v_is_admin := EXISTS (
    SELECT 1 FROM public.events e
      JOIN public.users u ON u.id = e.creator_user_id
     WHERE e.id = p_event_id AND u.auth_user_id = v_caller
  );
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'associate_event_to_league: only the event admin can (de)associate'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_old_league_id := (SELECT league_id FROM public.events WHERE id = p_event_id);

  IF v_old_league_id IS NOT DISTINCT FROM p_league_id THEN
    RETURN jsonb_build_object(
      'matches_propagated',       0,
      'old_league_replayed',      NULL,
      'new_league_replayed',      NULL,
      'matches_predating_season', 0,
      'noop',                     TRUE
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
          WHERE lm.league_id = p_league_id
            AND lm.player_id = em.player_id
       );
  END IF;

  UPDATE public.matches SET league_id = p_league_id WHERE event_id = p_event_id;
  GET DIAGNOSTICS v_matches_propagated = ROW_COUNT;

  -- Only matches that fall into an ARCHIVED season are excluded from ELO.
  -- With no archives, every imported match counts (mig 035) → predating = 0.
  IF p_league_id IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.league_season_archives WHERE league_id = p_league_id) THEN
    v_season_start := (SELECT current_season_started_at FROM public.leagues WHERE id = p_league_id);
    v_predating := (
      SELECT COUNT(*)
        FROM public.matches
       WHERE event_id = p_event_id
         AND v_season_start IS NOT NULL
         AND created_at < v_season_start
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

COMMENT ON FUNCTION public.associate_event_to_league(UUID, UUID) IS
  'Attach/detach an event to/from a league atomically (backfill matches.league_id, sync league_memberships sans héritage, recalc des deux ligues). matches_predating_season ne compte que si des archives de saison existent (mig 035). SECURITY DEFINER — caller must be the event creator.';