-- Migration 026 — Re-add propagate_user_pseudo RPC adapted to the unified
-- player_user model (mig 022).
--
-- Context: a user's display name lives in two places:
--   1. public.users.pseudo   — canonical, edited via /profile.
--   2. public.players.pseudo — per-player snapshot used by the display
--      view (event_memberships.pseudo_override || players.pseudo,
--      same for league_memberships).
--
-- When a user renames their profile, authService.updateUserProfile only
-- updates (1). (2) stays stale → every event / league they already joined
-- keeps the old name. Mig 020 had an RPC for this, but it was dropped in
-- mig 022 when the schema changed (tournament_players / league_players
-- → players + *_memberships) and never re-introduced.
--
-- This RPC pushes the caller's current `public.users.pseudo` into their
-- single `public.players` row. Every membership with `pseudo_override
-- IS NULL` (the common case) then shows the new name immediately, because
-- the display view reads `pseudo_override || players.pseudo`. Explicit
-- overrides (admin-renamed contexts, legacy backfill from mig 022) are
-- left untouched on purpose.
--
-- SECURITY DEFINER: `players_update` RLS is currently permissive
-- (USING (TRUE)) but flagged "tighten later" in mig 022 — funnelling the
-- write through this RPC keeps the privilege boundary clean for that day.

CREATE OR REPLACE FUNCTION public.propagate_user_pseudo()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_pseudo TEXT;
  v_players_count INT := 0;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authenticated user required';
  END IF;

  SELECT pseudo INTO v_pseudo
  FROM public.users
  WHERE id = v_caller;

  IF v_pseudo IS NULL OR btrim(v_pseudo) = '' THEN
    RAISE EXCEPTION 'User has no pseudo to propagate';
  END IF;

  UPDATE public.players
     SET pseudo = v_pseudo
   WHERE user_id = v_caller
     AND pseudo IS DISTINCT FROM v_pseudo;
  GET DIAGNOSTICS v_players_count = ROW_COUNT;

  RETURN json_build_object(
    'success', TRUE,
    'pseudo', v_pseudo,
    'players_updated', v_players_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.propagate_user_pseudo() TO authenticated;
