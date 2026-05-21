-- Migration 032 — Propagate authenticated user's avatar to their players row
--
-- Context: a user's avatar lives in two places:
--   1. public.users.avatar_url   — canonical, set via the /profile photo upload.
--   2. public.players.avatar_url — per-player snapshot read by the display
--      everywhere (podium, ranking, match history, player chips, pools…).
--
-- authService.uploadAvatar + updateUserProfile only touch (1). Without this,
-- the new photo shows on /profile but every league / event the user already
-- joined keeps the stale (usually null) avatar. This mirrors
-- propagate_user_pseudo (mig 026) for the avatar field.
--
-- Unlike the pseudo, avatar_url may legitimately be NULL (no photo / removal),
-- so we propagate whatever public.users.avatar_url holds, NULL included.
--
-- SECURITY DEFINER: players_update RLS is permissive today but flagged to be
-- tightened (mig 022) — funnelling the write through this RPC keeps the
-- privilege boundary clean for that day.

CREATE OR REPLACE FUNCTION public.propagate_user_avatar()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_avatar TEXT;
  v_players_count INT := 0;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authenticated user required';
  END IF;

  SELECT avatar_url INTO v_avatar
  FROM public.users
  WHERE id = v_caller;

  UPDATE public.players
     SET avatar_url = v_avatar
   WHERE user_id = v_caller
     AND avatar_url IS DISTINCT FROM v_avatar;
  GET DIAGNOSTICS v_players_count = ROW_COUNT;

  RETURN json_build_object(
    'success', TRUE,
    'avatar_url', v_avatar,
    'players_updated', v_players_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.propagate_user_avatar() TO authenticated;
