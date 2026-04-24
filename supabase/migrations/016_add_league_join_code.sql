-- Migration 016 — Add join_code to leagues (parity with tournaments)
--
-- Context: events (tournaments) have a 6-char alphanumeric `join_code` since
-- migration 006. Leagues now need the same so a user can rejoin via code or
-- link, and the join flow can offer the "claim ghost player" prompt the same
-- way it does for events.
--
-- Mirrors migration 006 conventions:
--   - TEXT UNIQUE column, length 6 enforced.
--   - Index for lookups.
--   - Backfilled lazily by application code: existing leagues get their
--     join_code on first edit/save (LeaguesRepository.upsert), so this
--     migration only adds the column and index. New leagues created via the
--     refactored LeagueContext get a code at creation time.
--
-- Security: same as tournament join codes — knowledge of the code is enough
-- to land on the join page; identity gate + claim flow happen there.

ALTER TABLE public.leagues
  ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE
  CHECK (join_code IS NULL OR length(join_code) = 6);

CREATE INDEX IF NOT EXISTS idx_league_join_code
  ON public.leagues(join_code);

COMMENT ON COLUMN public.leagues.join_code IS
  'Unique 6-character alphanumeric code for joining the league (parity with tournaments.join_code).';
