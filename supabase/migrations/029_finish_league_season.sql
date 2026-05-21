-- Migration 029 — Cycle de saison à 2 étapes (forcer fin → démarrer suivante)
--
-- Aujourd'hui (mig 028), `start_new_league_season` est atomique :
-- snapshot → reset ELO → bump season. L'admin n'a pas de "pause de
-- réflexion" entre la fin d'une saison et le démarrage de la suivante.
--
-- Mig 029 introduit un état intermédiaire `between_seasons` :
--   1. `finish_current_league_season` ferme la saison N (snapshot + pose
--      `current_season_ended_at`). Plus aucun match enregistrable.
--   2. `start_new_league_season` démarre la saison N+1 (reset ELO + bump
--      + clear `current_season_ended_at`).
--
-- ⚠️  Breaking change sémantique : `start_new_league_season` exige maintenant
-- que la saison soit close (`current_season_ended_at IS NOT NULL`). Aucun
-- appelant tiers — uniquement `LeaguesRepository.startNewLeagueSeason`
-- côté front.

-- ════════════════════════════════════════════════════════════════════════
-- Nouveau champ : current_season_ended_at
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE public.leagues
  ADD COLUMN IF NOT EXISTS current_season_ended_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.leagues.current_season_ended_at IS
  'NULL = saison en cours. NOT NULL = saison N close, en attente du démarrage de la saison N+1 (état between_seasons, bloque l''enregistrement de matchs).';

-- ════════════════════════════════════════════════════════════════════════
-- RPC : finish_current_league_season
-- ════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.finish_current_league_season(p_league_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_league      RECORD;
  v_rankings    JSONB;
  v_match_count INTEGER;
BEGIN
  -- 1. Verrouiller la ligue
  SELECT id, current_season_number, current_season_started_at, current_season_ended_at, paused_at, ended_at
    INTO v_league
    FROM public.leagues
   WHERE id = p_league_id
   FOR UPDATE;

  IF v_league.id IS NULL THEN
    RAISE EXCEPTION 'finish_current_league_season: league % not found', p_league_id
      USING ERRCODE = 'no_data_found';
  END IF;

  IF v_league.ended_at IS NOT NULL THEN
    RAISE EXCEPTION 'finish_current_league_season: league % is finished', p_league_id
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF v_league.paused_at IS NOT NULL THEN
    RAISE EXCEPTION 'finish_current_league_season: league % is paused — resume it first', p_league_id
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF v_league.current_season_ended_at IS NOT NULL THEN
    RAISE EXCEPTION 'finish_current_league_season: season % is already closed (start the next one)', v_league.current_season_number
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- 2. Snapshot des rankings (identique mig 028 lignes 113-134)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'player_id',      lm.player_id,
        'pseudo',         COALESCE(lm.pseudo_override, p.pseudo),
        'elo',            lm.elo,
        'wins',           lm.wins,
        'losses',         lm.losses,
        'matches_played', lm.matches_played,
        'streak',         lm.streak,
        'rank',           ROW_NUMBER() OVER (ORDER BY lm.elo DESC, lm.wins DESC)
      )
      ORDER BY lm.elo DESC, lm.wins DESC
    ),
    '[]'::jsonb
  )
  INTO v_rankings
  FROM public.league_memberships lm
  LEFT JOIN public.players p ON p.id = lm.player_id
  WHERE lm.league_id = p_league_id
    AND lm.archived_at IS NULL;

  -- 3. Nombre de matchs de la saison qui s'achève
  SELECT COUNT(*)
    INTO v_match_count
    FROM public.matches
   WHERE league_id = p_league_id
     AND created_at >= v_league.current_season_started_at;

  -- 4. Archive
  INSERT INTO public.league_season_archives
    (league_id, season_number, started_at, ended_at, rankings, match_count)
  VALUES
    (p_league_id, v_league.current_season_number, v_league.current_season_started_at, NOW(),
     v_rankings, v_match_count);

  -- 5. Poser le marker de fin de saison (état between_seasons)
  --    Les ELO et le numéro de saison restent inchangés jusqu'au démarrage
  --    de la saison N+1 via start_new_league_season.
  UPDATE public.leagues
     SET current_season_ended_at = NOW()
   WHERE id = p_league_id;
END;
$fn$;

COMMENT ON FUNCTION public.finish_current_league_season(UUID) IS
  'Étape 1 du cycle de saison à 2 étapes (mig 029) : snapshot du classement dans league_season_archives et pose current_season_ended_at. La ligue entre en état between_seasons (read-only). Les ELO et current_season_number restent inchangés.';

GRANT EXECUTE ON FUNCTION public.finish_current_league_season(UUID) TO authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- Refactor : start_new_league_season exige une saison close
-- ════════════════════════════════════════════════════════════════════════
--
-- Le snapshot + l'archive ont migré dans `finish_current_league_season`.
-- Ici on se contente du reset ELO + bump + clear du marker.

CREATE OR REPLACE FUNCTION public.start_new_league_season(p_league_id UUID)
RETURNS INTEGER  -- numéro de la NOUVELLE saison qui démarre
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_league         RECORD;
  v_new_season_num INTEGER;
BEGIN
  -- 1. Verrouiller la ligue
  SELECT id, current_season_number, current_season_ended_at, paused_at, ended_at
    INTO v_league
    FROM public.leagues
   WHERE id = p_league_id
   FOR UPDATE;

  IF v_league.id IS NULL THEN
    RAISE EXCEPTION 'start_new_league_season: league % not found', p_league_id
      USING ERRCODE = 'no_data_found';
  END IF;

  IF v_league.ended_at IS NOT NULL THEN
    RAISE EXCEPTION 'start_new_league_season: league % is finished — reopen it first', p_league_id
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF v_league.paused_at IS NOT NULL THEN
    RAISE EXCEPTION 'start_new_league_season: league % is paused — resume it first', p_league_id
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- Nouvelle exigence (mig 029) : la saison doit avoir été close préalablement
  -- via finish_current_league_season.
  IF v_league.current_season_ended_at IS NULL THEN
    RAISE EXCEPTION 'start_new_league_season: season % not closed yet — call finish_current_league_season first', v_league.current_season_number
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- 2. Reset ELO + stats des memberships actifs
  UPDATE public.league_memberships
     SET elo = 1000, wins = 0, losses = 0, matches_played = 0, streak = 0
   WHERE league_id = p_league_id;

  -- 3. Wipe elo_history de la saison passée (déjà figée dans l'archive)
  DELETE FROM public.elo_history
   WHERE league_id = p_league_id;

  -- 4. Bump du compteur + reset du started_at + clear du ended_at marker
  v_new_season_num := v_league.current_season_number + 1;
  UPDATE public.leagues
     SET current_season_number     = v_new_season_num,
         current_season_started_at = NOW(),
         current_season_ended_at   = NULL
   WHERE id = p_league_id;

  RETURN v_new_season_num;
END;
$fn$;

COMMENT ON FUNCTION public.start_new_league_season(UUID) IS
  'Étape 2 du cycle de saison à 2 étapes (mig 029) : reset ELO/stats memberships, wipe elo_history, bump current_season_number, reset current_season_started_at, clear current_season_ended_at. Exige que finish_current_league_season ait été appelé préalablement.';
