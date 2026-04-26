-- Migration 020 — Propagate authenticated user's pseudo to all snapshot rows
--
-- Context: when a user updates their pseudo via UserProfile, we update
-- public.users.pseudo. But each `tournament_players.pseudo_in_tournament`
-- and `league_players.pseudo_in_league` row is a snapshot taken at join
-- time and is what the UI actually displays everywhere (podium, ranking,
-- match history, display view). Without propagation, the UI keeps showing
-- the stale snapshot and the rename feels broken to the user.
--
-- This RPC takes the user's current pseudo (from public.users) and pushes
-- it into every snapshot row owned by that user. SECURITY DEFINER because
-- tournament_players has no UPDATE policy at all (and we don't want to add
-- a permissive one — only the owner via this RPC).
--
-- Returns the count of rows updated for diagnostics.

CREATE OR REPLACE FUNCTION propagate_user_pseudo()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_pseudo TEXT;
  v_tp_count INT := 0;
  v_lp_count INT := 0;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authenticated user required';
  END IF;

  SELECT pseudo INTO v_pseudo FROM public.users WHERE id = v_caller;
  IF v_pseudo IS NULL OR btrim(v_pseudo) = '' THEN
    RAISE EXCEPTION 'User has no pseudo to propagate';
  END IF;

  UPDATE public.tournament_players
     SET pseudo_in_tournament = v_pseudo
   WHERE user_id = v_caller
     AND pseudo_in_tournament IS DISTINCT FROM v_pseudo;
  GET DIAGNOSTICS v_tp_count = ROW_COUNT;

  UPDATE public.league_players
     SET pseudo_in_league = v_pseudo
   WHERE user_id = v_caller
     AND pseudo_in_league IS DISTINCT FROM v_pseudo;
  GET DIAGNOSTICS v_lp_count = ROW_COUNT;

  RETURN json_build_object(
    'success', TRUE,
    'pseudo', v_pseudo,
    'tournament_players_updated', v_tp_count,
    'league_players_updated', v_lp_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION propagate_user_pseudo() TO authenticated;
