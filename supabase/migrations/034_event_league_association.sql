-- Migration 034 — associate_event_to_league (import / dissociation atomiques)
--
-- Rattacher un event à une ligue (ou l'en détacher) doit, pour rester
-- cohérent côté ELO :
--   1. Mettre à jour events.league_id.
--   2. Synchroniser les players de l'event vers league_memberships (sans
--      héritage ELO — chaque bulle démarre à 1000, décision produit).
--   3. Backfiller matches.league_id pour TOUS les matchs de l'event (sinon
--      ils restent invisibles pour recalculate_league_elo qui filtre sur
--      matches.league_id).
--   4. Recalculer l'ELO de l'ancienne ligue (purge l'effet de l'event
--      détaché) ET de la nouvelle (intègre les matchs importés).
--
-- Avant cette migration, associateEventToLeague (côté client) ne faisait que
-- (1) + un (2) bancal avec héritage ELO, et jamais (3)/(4) → import cassé.
--
-- Tout est encapsulé dans une RPC SECURITY DEFINER pour l'atomicité (si un
-- recalcul échoue, rollback complet) et pour traverser les triggers de garde
-- mig 031 (UPDATE events/matches, INSERT league_memberships) qui bloquent
-- les écritures directes des clients PostgREST.
--
-- Gère les 4 cas : attach (NULL→X), detach (X→NULL), re-attach (A→B), no-op.
--
-- DASHBOARD COMPATIBILITY : `var := (SELECT …)`, jamais `SELECT … INTO`.

BEGIN;

CREATE OR REPLACE FUNCTION public.associate_event_to_league(
  p_event_id  UUID,
  p_league_id UUID  -- NULL = détachement
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

  -- Lock the event row (no INTO clause).
  PERFORM 1 FROM public.events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'associate_event_to_league: event % not found', p_event_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Caller must be the event creator (same mapping convention as mig 030/033).
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

  -- No-op : already in the requested state.
  IF v_old_league_id IS NOT DISTINCT FROM p_league_id THEN
    RETURN jsonb_build_object(
      'matches_propagated',       0,
      'old_league_replayed',      NULL,
      'new_league_replayed',      NULL,
      'matches_predating_season', 0,
      'noop',                     TRUE
    );
  END IF;

  -- Validate target league when attaching.
  IF p_league_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.leagues WHERE id = p_league_id) THEN
    RAISE EXCEPTION 'associate_event_to_league: league % not found', p_league_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- 1. Persist the link.
  UPDATE public.events SET league_id = p_league_id WHERE id = p_event_id;

  -- 2. Sync players → league_memberships (only when attaching). No ELO
  --    inheritance: missing memberships are created at the column default
  --    (elo = 1000). Existing memberships are left untouched.
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

  -- 3. Backfill / nullify matches.league_id for every match of the event.
  UPDATE public.matches SET league_id = p_league_id WHERE event_id = p_event_id;
  GET DIAGNOSTICS v_matches_propagated = ROW_COUNT;

  -- Count matches predating the target season window (they get league_id set
  -- but recalculate_league_elo won't replay them — bounded by mig 028).
  IF p_league_id IS NOT NULL THEN
    v_season_start := (SELECT current_season_started_at FROM public.leagues WHERE id = p_league_id);
    v_predating := (
      SELECT COUNT(*)
        FROM public.matches
       WHERE event_id = p_event_id
         AND v_season_start IS NOT NULL
         AND created_at < v_season_start
    );
  END IF;

  -- 4. Recalc both impacted leagues. Old first (purge the detached event's
  --    effect), then new (integrate the imported matches).
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
  'Attach (p_league_id non-NULL) or detach (NULL) an event to/from a league atomically: update events.league_id, sync league_memberships (no ELO inheritance), backfill matches.league_id, and recalc both old + new league ELO. Returns a JSONB summary. SECURITY DEFINER — caller must be the event creator.';

GRANT EXECUTE ON FUNCTION public.associate_event_to_league(UUID, UUID) TO authenticated;

COMMIT;
