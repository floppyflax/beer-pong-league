-- ============================================================
-- Migration 013 — Fix tournament format constraint + creator check
-- ============================================================
--
-- Problems fixed:
--   1. tournaments_format_check only allowed '1v1','2v2','3v3'
--      but the app also uses 'libre' (free format). Extend it.
--   2. Ensure the format column accepts NULL (backward-compat for
--      rows inserted before this migration that skipped the column).
--
-- The creator-identity XOR constraint (tournaments_check) is correct
-- as-is; the bug was in application code, not in the DB.
-- ============================================================

-- 1. Drop the old restrictive format check
ALTER TABLE public.tournaments
  DROP CONSTRAINT IF EXISTS tournaments_format_check;

-- 2. Re-add with 'libre' included (NULL allowed for rows created
--    via the new flow that stores format only in format_type/team_size)
ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_format_check
  CHECK (format IS NULL OR format IN ('1v1', '2v2', '3v3', 'libre'));

-- 3. Backfill NULL format values using format_type so that existing
--    rows created via CreateTournament (which skipped the format column)
--    have a consistent value.
UPDATE public.tournaments
SET format = CASE
  WHEN format_type = 'free'    THEN 'libre'
  WHEN team1_size  = 1         THEN '1v1'
  WHEN team1_size  = 3         THEN '3v3'
  ELSE '2v2'
END
WHERE format IS NULL;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
