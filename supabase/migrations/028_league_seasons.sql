-- Migration 028 — League seasons + lifecycle
--
-- Two intertwined additions on the `leagues` table:
--
-- 1. Lifecycle timestamps (mirror of mig 027 on events, minus `started_at`
--    since a league has no scheduled start date — it is active from creation):
--      * paused_at  — admin "Mettre en pause"; cleared on resume.
--      * ended_at   — admin "Clôturer la league"; final read-only state.
--
-- 2. Season cycling (multi-saisons inside a single league):
--      * current_season_number     — 1-indexed, bumped by start_new_league_season().
--      * current_season_started_at — lower bound for the season's ELO recalc.
--
-- Plus a new table `league_season_archives` holding the frozen ranking of
-- each closed season, and a RPC `start_new_league_season(p_league_id)` that
-- snapshots → resets ELO → bumps the season counter.
--
-- The mig 025 RPC `recalculate_league_elo` is patched to only replay matches
-- inside the current season window.

ALTER TABLE public.leagues
  ADD COLUMN IF NOT EXISTS current_season_number     INTEGER     NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS current_season_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS paused_at                 TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS ended_at                  TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.leagues.current_season_number IS
  'Numéro de la saison en cours (1-indexed). Incrémenté par start_new_league_season().';
COMMENT ON COLUMN public.leagues.current_season_started_at IS
  'Timestamp de début de la saison courante. Borne basse utilisée par recalculate_league_elo.';
COMMENT ON COLUMN public.leagues.paused_at IS
  'NULL = active. NOT NULL = pause, bloque l''enregistrement de matchs.';
COMMENT ON COLUMN public.leagues.ended_at IS
  'NULL = league active. NOT NULL = league terminée (toutes saisons closes), read-only.';

-- Backfill : pour les leagues historiques, la saison 1 a commencé à la création.
-- (Les nouvelles colonnes ont DEFAULT NOW(), donc on remet `created_at` sur les
-- lignes existantes pour que l'historique des matchs reste dans la saison 1.)
UPDATE public.leagues
   SET current_season_started_at = created_at
 WHERE current_season_started_at IS NOT NULL
   AND created_at IS NOT NULL
   AND current_season_started_at > created_at;

-- ════════════════════════════════════════════════════════════════════════
-- Table d'archives des saisons closes
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.league_season_archives (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id     UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  started_at    TIMESTAMPTZ NOT NULL,
  ended_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Snapshot dénormalisé des rankings au moment de la clôture.
  -- Forme : [{ player_id, pseudo, elo, wins, losses, matches_played, streak, rank }]
  rankings      JSONB NOT NULL,
  match_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (league_id, season_number)
);

CREATE INDEX IF NOT EXISTS idx_lsa_league
  ON public.league_season_archives(league_id, season_number DESC);

ALTER TABLE public.league_season_archives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lsa_read ON public.league_season_archives;
CREATE POLICY lsa_read ON public.league_season_archives
  FOR SELECT USING (TRUE);

-- Insert/update/delete : uniquement via RPC SECURITY DEFINER (start_new_league_season).
-- Pas de policy WRITE → bloque toute écriture directe via le client.

-- ════════════════════════════════════════════════════════════════════════
-- RPC : start_new_league_season
-- ════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.start_new_league_season(p_league_id UUID)
RETURNS INTEGER  -- numéro de la NOUVELLE saison qui démarre
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_league         RECORD;
  v_rankings       JSONB;
  v_match_count    INTEGER;
  v_new_season_num INTEGER;
BEGIN
  -- 1. Verrouiller la ligue le temps de la transaction
  SELECT id, current_season_number, current_season_started_at, paused_at, ended_at
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

  -- 2. Snapshot des rankings actuels (avec pseudo affichable : override sinon players.pseudo)
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

  -- 5. Reset ELO + stats des memberships actifs
  UPDATE public.league_memberships
     SET elo = 1000, wins = 0, losses = 0, matches_played = 0, streak = 0
   WHERE league_id = p_league_id;

  -- 6. Wipe elo_history de la saison passée (déjà figée dans l'archive)
  DELETE FROM public.elo_history
   WHERE league_id = p_league_id;

  -- 7. Bump du compteur + reset du started_at
  v_new_season_num := v_league.current_season_number + 1;
  UPDATE public.leagues
     SET current_season_number = v_new_season_num,
         current_season_started_at = NOW()
   WHERE id = p_league_id;

  RETURN v_new_season_num;
END;
$fn$;

COMMENT ON FUNCTION public.start_new_league_season(UUID) IS
  'Clôture la saison en cours d''une league : snapshot du classement dans league_season_archives, reset ELO à 1000 sur les memberships actifs, wipe elo_history (league context), bump current_season_number, reset current_season_started_at.';

GRANT EXECUTE ON FUNCTION public.start_new_league_season(UUID) TO authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- Patch : recalculate_league_elo ne rejoue que la saison courante
-- ════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.recalculate_league_elo(p_league_id UUID)
RETURNS INTEGER  -- number of matches replayed
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_season_started_at TIMESTAMPTZ;
  next_match_id       UUID;
  replayed            INTEGER := 0;
BEGIN
  -- Borne basse : début de la saison courante (mig 028).
  SELECT current_season_started_at
    INTO v_season_started_at
    FROM public.leagues
   WHERE id = p_league_id;

  IF v_season_started_at IS NULL THEN
    RAISE EXCEPTION 'recalculate_league_elo: league % not found', p_league_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Reset league memberships
  UPDATE public.league_memberships
     SET elo = 1000, wins = 0, losses = 0, matches_played = 0, streak = 0
   WHERE league_id = p_league_id;

  -- Wipe league-context history (event-context history is left intact)
  DELETE FROM public.elo_history
   WHERE league_id = p_league_id;

  -- Replay every ranked, non-rejected match of the CURRENT SEASON in chrono order.
  FOR next_match_id IN
    SELECT id
      FROM public.matches
     WHERE league_id = p_league_id
       AND created_at >= v_season_started_at
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
        CONTINUE;
    END;
  END LOOP;

  RETURN replayed;
END;
$fn$;

COMMENT ON FUNCTION public.recalculate_league_elo(UUID) IS
  'Admin recovery path: replays every ranked, non-rejected match of the CURRENT season of a league (mig 028 — bounded by leagues.current_season_started_at).';
