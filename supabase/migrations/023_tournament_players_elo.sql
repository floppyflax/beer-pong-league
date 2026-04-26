-- Migration 023 — Per-event ELO + optional league propagation
--
-- Context: until now, `tournament_memberships` (the new pivot from mig 022)
-- stored only the participant identity (no ELO column). Tournaments linked
-- to a league reused `league_memberships.elo` for display, and autonomous
-- tournaments showed a fixed default ELO. This collapsed Event ELO and
-- League ELO into a single value.
--
-- Per the canonical ELO model (cf. docs/architecture.md §Modèle ELO), Event
-- ELO and League ELO are independent contexts. A match recorded in an event
-- must update the event's own ELO. Optionally, if the event is linked to a
-- league AND the event admin has enabled propagation, the same match also
-- updates the league's ELO (computed independently with the league's
-- baseline).
--
-- Changes:
--   1. `tournament_memberships` gains ELO/W/L/streak stats (mirror of
--      league_memberships).
--   2. `tournaments` gains `propagates_to_league_elo BOOLEAN DEFAULT TRUE`.
--   3. Backfill: for tournaments linked to a league, copy the matching
--      league_memberships stats so existing events keep displaying a
--      consistent value (no recompute — historical events stay where they
--      were).
--   4. Index on (tournament_id, elo DESC) for ranking queries.

BEGIN;

-- ──────────────────────────────────────────────────────────────────────
-- 1. Stats columns on tournament_memberships
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.tournament_memberships
  ADD COLUMN IF NOT EXISTS elo INTEGER NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS wins INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS losses INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS matches_played INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak INTEGER NOT NULL DEFAULT 0;

-- ──────────────────────────────────────────────────────────────────────
-- 2. Propagation toggle on tournaments
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS propagates_to_league_elo BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.tournaments.propagates_to_league_elo IS
  'When TRUE and league_id IS NOT NULL, matches recorded in this event also update league_memberships ELO/stats (computed with league baseline). When FALSE, the event has its own ELO bubble that does not affect the parent league.';

-- ──────────────────────────────────────────────────────────────────────
-- 3. Backfill — sync existing tournament_memberships stats with
--    league_memberships for events linked to a league. For autonomous
--    events (no league_id), stats stay at DEFAULT (elo=1000, others=0).
-- ──────────────────────────────────────────────────────────────────────

UPDATE public.tournament_memberships tm
SET
  elo = lm.elo,
  wins = lm.wins,
  losses = lm.losses,
  matches_played = lm.matches_played,
  streak = lm.streak
FROM public.tournaments t
JOIN public.league_memberships lm
  ON lm.league_id = t.league_id
  AND lm.player_id = tm.player_id
WHERE tm.tournament_id = t.id
  AND t.league_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────────
-- 4. Index for ranking queries
-- ──────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tournament_memberships_elo
  ON public.tournament_memberships(tournament_id, elo DESC);

COMMIT;
