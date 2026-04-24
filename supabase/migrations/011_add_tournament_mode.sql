-- Migration 011 — Add tournament mode (ELO vs Bracket)
-- Context: Phase A.5 of the Everything ELO redesign introduces a distinction
-- between "Mode ELO" (classement ponctuel) and "Mode Bracket" (élimination
-- directe). The mode is set at creation and immutable afterwards.
--
-- Default: 'elo' so all existing tournaments keep their current behavior.
-- The CHECK constraint prevents arbitrary values from being written.

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'elo'
    CHECK (mode IN ('elo', 'bracket'));

COMMENT ON COLUMN public.tournaments.mode IS
  'Competition mode. "elo" = ranking-based (all matches contribute to ELO), "bracket" = single-elimination bracket. Set at creation, immutable afterwards.';

-- Backfill safety: existing rows already have default 'elo' from the ADD COLUMN.
