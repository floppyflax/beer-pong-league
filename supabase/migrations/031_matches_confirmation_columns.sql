-- Migration 031 — Backfill of matches.confirmed_by_user_id + confirmed_at
--
-- ─────────────────────────────────────────────────────────────────────────
-- Why this exists
-- ─────────────────────────────────────────────────────────────────────────
-- Mig 002 was supposed to introduce `matches.confirmed_by_user_id`,
-- `matches.confirmed_by_anonymous_user_id`, and `matches.confirmed_at`.
-- Mig 022 was supposed to drop the anon flavour and rename the auth flavour
-- to point at the unified `users` table.
--
-- On at least one live database (project zsazjkhhqtmyvjsumgcq), running
-- `confirm_match` (mig 030) blew up with:
--
--   ERROR  column "confirmed_by_user_id" of relation "matches" does not exist
--   CODE   42703  (undefined_column)
--
-- A direct schema inspection confirms the column is missing. Either mig 002
-- never landed there, or it was rolled back at some point. Either way, we
-- can't rely on the column existing.
--
-- This migration is idempotent and self-contained: it creates whatever's
-- missing without touching what's already there, so it's safe to run on
-- *any* database (already-correct or drifted).
--
-- ─────────────────────────────────────────────────────────────────────────
-- DASHBOARD COMPATIBILITY NOTE (see mig 025 / mig 030)
-- ─────────────────────────────────────────────────────────────────────────
-- No PL/pgSQL bodies, no `SELECT ... INTO`. Pure DDL — safe to paste in the
-- Supabase Dashboard SQL Editor without hitting the dollar-quoted parser
-- bug.

BEGIN;

-- 1. confirmed_by_user_id — FK to public.users (unified anon + auth post-mig 022)
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS confirmed_by_user_id UUID
  REFERENCES public.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.matches.confirmed_by_user_id IS
  'User who confirmed (or rejected) this match under anti-cheat. NULL when no validation was needed (anti_cheat_enabled = FALSE on both parent contexts) or when the match is still pending.';

-- 2. confirmed_at — timestamp of the confirm_match call
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.matches.confirmed_at IS
  'Timestamp set by confirm_match (mig 030) when transitioning status to confirmed or rejected. NULL otherwise.';

-- 3. status — should already exist via mig 002, but defensive in case that
--    one never landed either. We don't add the CHECK constraint here to
--    avoid clashing with any pre-existing variant; the application enforces
--    valid values and `confirm_match` itself only writes 'confirmed' /
--    'rejected'.
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'confirmed';

-- Add the CHECK constraint idempotently — only when missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'matches_status_check'
  ) THEN
    ALTER TABLE public.matches
      ADD CONSTRAINT matches_status_check
      CHECK (status IN ('pending', 'confirmed', 'rejected'));
  END IF;
END $$;

-- 4. Helpful index for the pending lookup (the validation banner queries
--    `matches WHERE event_id = ? AND status = 'pending'` on every event
--    dashboard load).
CREATE INDEX IF NOT EXISTS idx_matches_status_pending
  ON public.matches(status)
  WHERE status = 'pending';

COMMIT;
