-- ============================================
-- Migration: Live match tracking fields
-- Phase D.4 — Beer Pong ELO redesign
-- Description: Add is_live, balloon_possession, is_match_point to matches table
--              + enable realtime publication for matches table.
--
-- Rollback (manual):
--   ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_balloon_possession_check;
--   ALTER TABLE public.matches DROP COLUMN IF EXISTS is_live;
--   ALTER TABLE public.matches DROP COLUMN IF EXISTS balloon_possession;
--   ALTER TABLE public.matches DROP COLUMN IF EXISTS is_match_point;
--   ALTER PUBLICATION supabase_realtime DROP TABLE public.matches;
-- ============================================

-- 1. Add live tracking columns
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS is_live         BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS balloon_possession TEXT    NULL,
  ADD COLUMN IF NOT EXISTS is_match_point  BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Constrain balloon_possession to valid values
ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_balloon_possession_check;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_balloon_possession_check
  CHECK (balloon_possession IS NULL OR balloon_possession IN ('team_a', 'team_b'));

-- 3. Performance index for live matches queries
CREATE INDEX IF NOT EXISTS idx_matches_is_live
  ON public.matches (is_live)
  WHERE is_live = TRUE;

-- 4. Enable Supabase Realtime for matches table
-- (safe to run even if already enabled — ADD TABLE is idempotent in pg publications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;

-- 5. Column documentation
COMMENT ON COLUMN public.matches.is_live          IS 'True while a match is actively in progress (live tracking mode).';
COMMENT ON COLUMN public.matches.balloon_possession IS 'Which team holds the balloon / service: team_a | team_b | NULL.';
COMMENT ON COLUMN public.matches.is_match_point   IS 'True when the leading team is one cup from winning.';
