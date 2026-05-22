-- Migration 032 — ELO recalc par contexte (event / league découplés)
--
-- Problème corrigé (bug latent depuis mig 025) :
--
--   `apply_match_elo` calcule event + league en un seul appel, et son
--   anti-replay est GLOBAL (`EXISTS elo_history WHERE match_id`). Or
--   `recalculate_league_elo` ne purge que les lignes league-context avant de
--   rejouer. Pour un match rattaché à un event, la ligne event-context
--   survit → `apply_match_elo` lève `unique_violation` → avalé par le
--   `EXCEPTION WHEN OTHERS THEN CONTINUE` → le match est SAUTÉ. Conséquence :
--   le recalcul ligue ne reconstruit l'ELO que pour les matchs ligue purs,
--   jamais pour ceux venant d'un event.
--
--   Symétriquement, il n'existait AUCUNE `recalculate_event_elo` : éditer ou
--   supprimer un match laissait `event_memberships.elo` désynchronisé.
--
-- Fix :
--
--   1. `apply_match_elo(p_match_id, p_context DEFAULT 'both')` — on peut
--      désormais cibler un seul contexte ('event' | 'league' | 'both').
--      L'anti-replay devient PAR CONTEXTE (vérifie uniquement le contexte
--      appliqué). Le path d'enregistrement appelle toujours l'arité 1
--      (→ défaut 'both') : aucun changement de comportement.
--
--   2. `recalculate_league_elo(p_league_id)` rejoue avec p_context = 'league'
--      → ne saute plus les matchs d'event. Conserve la borne saison (mig 028).
--      Le CONTINUE silencieux devient un RAISE WARNING loggable.
--
--   3. `recalculate_event_elo(p_event_id)` — NOUVEAU, miroir côté event.
--      Pas de borne saison (un event n'a pas de saisons).
--
-- Les triggers de garde mig 031 (`_guard_*_membership_stats`,
-- `_guard_elo_history_writes`) testent `_is_postgrest_client()` ; ces RPC
-- étant SECURITY DEFINER (current_user = owner), elles traversent les gardes
-- — comme `recalculate_league_elo` le fait déjà depuis mig 025/028.
--
-- DASHBOARD COMPATIBILITY : conventions parser-safe (`var := (SELECT …)`,
-- jamais `SELECT … INTO`). cf. note mig 025 + skill postgres-rpc.

BEGIN;

-- ════════════════════════════════════════════════════════════════════════
-- 1. apply_match_elo — nouvelle arité avec p_context
-- ════════════════════════════════════════════════════════════════════════
-- L'ancienne signature (UUID) devient (UUID, TEXT DEFAULT 'both'). On DROP
-- d'abord l'arité 1 pour éviter une surcharge ambiguë (les deux matcheraient
-- `apply_match_elo(x)`). Les appels 1-arg existants (confirm_match,
-- recordMatch RPC, recalculate_*) résolvent vers la nouvelle via le défaut.

DROP FUNCTION IF EXISTS public.apply_match_elo(UUID);

CREATE OR REPLACE FUNCTION public.apply_match_elo(
  p_match_id UUID,
  p_context  TEXT DEFAULT 'both'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  match_league_id         UUID;
  match_event_id          UUID;
  match_team_a_player_ids UUID[];
  match_team_b_player_ids UUID[];
  match_score_a           INTEGER;
  match_score_b           INTEGER;
  match_is_ranked         BOOLEAN;
  match_status            TEXT;
  league_anti_cheat       BOOLEAN := FALSE;
  event_anti_cheat        BOOLEAN := FALSE;
  propagates              BOOLEAN := FALSE;
  do_event                BOOLEAN;
  do_league               BOOLEAN;
  winner                  CHAR(1);
  team_a_avg_elo          NUMERIC;
  team_b_avg_elo          NUMERIC;
  expected_a              NUMERIC;
  expected_b              NUMERIC;
  team_a_avg_elo_l        NUMERIC;
  team_b_avg_elo_l        NUMERIC;
  expected_a_l            NUMERIC;
  expected_b_l            NUMERIC;
  loop_player_id          UUID;
BEGIN
  -- 0. Validate context arg
  IF p_context NOT IN ('event', 'league', 'both') THEN
    RAISE EXCEPTION 'apply_match_elo: invalid p_context % (expected event|league|both)', p_context
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- 3a. Lock the match row (no INTO clause)
  PERFORM 1 FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'apply_match_elo: match % not found', p_match_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- 3b. Read the match fields via scalar subqueries (lock already held)
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

  -- 3d. Read anti-cheat flags + propagation
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

  -- 3f. Decide the winner — ties refused (no winner)
  IF match_score_a > match_score_b THEN
    winner := 'A';
  ELSIF match_score_b > match_score_a THEN
    winner := 'B';
  ELSE
    RAISE EXCEPTION 'apply_match_elo: match % has equal scores (no winner)', p_match_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- 3g. Which context(s) to apply this call?
  do_event  := match_event_id IS NOT NULL
               AND p_context IN ('event', 'both');
  do_league := match_league_id IS NOT NULL
               AND (match_event_id IS NULL OR propagates)
               AND p_context IN ('league', 'both');

  -- 3h. Anti-replay PER CONTEXT — only check the context(s) being applied.
  IF do_event
     AND EXISTS(SELECT 1 FROM public.elo_history
                 WHERE match_id = p_match_id AND event_id IS NOT NULL) THEN
    RAISE EXCEPTION 'apply_match_elo: match % already has event-context elo_history (anti-replay)', p_match_id
      USING ERRCODE = 'unique_violation';
  END IF;

  IF do_league
     AND EXISTS(SELECT 1 FROM public.elo_history
                 WHERE match_id = p_match_id AND league_id IS NOT NULL) THEN
    RAISE EXCEPTION 'apply_match_elo: match % already has league-context elo_history (anti-replay)', p_match_id
      USING ERRCODE = 'unique_violation';
  END IF;

  -- ──────────────────────────────────────────────────────────────────
  -- 4. EVENT context — delta from event_memberships.elo baselines.
  -- ──────────────────────────────────────────────────────────────────
  IF do_event THEN
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
  -- 5. LEAGUE context — delta from league_memberships.elo baselines,
  --    computed independently from the event delta.
  -- ──────────────────────────────────────────────────────────────────
  IF do_league THEN
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

COMMENT ON FUNCTION public.apply_match_elo(UUID, TEXT) IS
  'Computes and persists the ELO delta for a confirmed ranked match. p_context (event|league|both, default both) restricts which context(s) are written; anti-replay is per-context. SECURITY DEFINER — only legitimate path for elo_history / memberships stats writes.';

GRANT EXECUTE ON FUNCTION public.apply_match_elo(UUID, TEXT) TO authenticated, anon;

-- ════════════════════════════════════════════════════════════════════════
-- 2. recalculate_league_elo — rejoue le contexte 'league' uniquement
-- ════════════════════════════════════════════════════════════════════════
-- Conserve la borne saison (mig 028). Corrige le bug : en passant 'league',
-- l'anti-replay par contexte ne voit plus les lignes event-context survivantes
-- → les matchs d'event rattachés sont enfin rejoués côté ligue.

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
  v_season_started_at := (SELECT current_season_started_at FROM public.leagues WHERE id = p_league_id);

  IF v_season_started_at IS NULL THEN
    RAISE EXCEPTION 'recalculate_league_elo: league % not found', p_league_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Reset league memberships
  UPDATE public.league_memberships
     SET elo = 1000, wins = 0, losses = 0, matches_played = 0, streak = 0
   WHERE league_id = p_league_id;

  -- Wipe league-context history (event-context rows are left intact)
  DELETE FROM public.elo_history
   WHERE league_id = p_league_id;

  -- Replay every ranked, non-rejected match of the CURRENT SEASON in chrono order,
  -- in the LEAGUE context only.
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
  'Admin recovery path: replays every ranked, non-rejected match of the CURRENT season of a league (bounded by leagues.current_season_started_at, mig 028) in the LEAGUE context. Skipped matches are logged via RAISE WARNING.';

GRANT EXECUTE ON FUNCTION public.recalculate_league_elo(UUID) TO authenticated, anon;

-- ════════════════════════════════════════════════════════════════════════
-- 3. recalculate_event_elo — miroir côté event (NOUVEAU)
-- ════════════════════════════════════════════════════════════════════════
-- Reconstruit event_memberships.elo + l'historique event-context d'un event,
-- en rejouant ses matchs dans le contexte 'event' uniquement. Pas de borne
-- saison (un event n'a pas de cycle de saisons). Utilisé après édition /
-- suppression d'un match (Partie C) et appelable en récupération admin.

CREATE OR REPLACE FUNCTION public.recalculate_event_elo(p_event_id UUID)
RETURNS INTEGER  -- number of matches replayed
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  next_match_id UUID;
  replayed      INTEGER := 0;
BEGIN
  PERFORM 1 FROM public.events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'recalculate_event_elo: event % not found', p_event_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Reset event memberships
  UPDATE public.event_memberships
     SET elo = 1000, wins = 0, losses = 0, matches_played = 0, streak = 0
   WHERE event_id = p_event_id;

  -- Wipe event-context history (league-context rows are left intact)
  DELETE FROM public.elo_history
   WHERE event_id = p_event_id;

  -- Replay every ranked, non-rejected match of this event in chrono order,
  -- in the EVENT context only.
  FOR next_match_id IN
    SELECT id
      FROM public.matches
     WHERE event_id = p_event_id
       AND COALESCE(is_ranked, TRUE) = TRUE
       AND COALESCE(status, 'confirmed') <> 'rejected'
       AND score_a <> score_b
     ORDER BY created_at ASC
  LOOP
    BEGIN
      PERFORM public.apply_match_elo(next_match_id, 'event');
      replayed := replayed + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'recalculate_event_elo: skipped match % (%)', next_match_id, SQLERRM;
        CONTINUE;
    END;
  END LOOP;

  RETURN replayed;
END;
$fn$;

COMMENT ON FUNCTION public.recalculate_event_elo(UUID) IS
  'Admin recovery path: wipes event_memberships stats + event-context elo_history, then replays every ranked, non-rejected match of the event in chronological order in the EVENT context. Returns the number of matches replayed.';

GRANT EXECUTE ON FUNCTION public.recalculate_event_elo(UUID) TO authenticated, anon;

COMMIT;
