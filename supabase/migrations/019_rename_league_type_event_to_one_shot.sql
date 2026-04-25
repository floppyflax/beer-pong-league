-- Migration 019 — Rename league.type value 'event' → 'one-shot'
--
-- Context: as part of the UI-layer rename "tournament → event" (option B),
-- the existing league.type='event' value (designating a one-shot/throwaway
-- league as opposed to a recurring 'season') collides with the new event
-- nomenclature. We rename the value to 'one-shot' to disambiguate.
--
-- Idempotent: safe to re-run on already-migrated rows.

BEGIN;

-- 1. Drop the CHECK constraint so we can mutate values without rejection.
ALTER TABLE public.leagues DROP CONSTRAINT IF EXISTS leagues_type_check;

-- 2. Migrate existing rows.
UPDATE public.leagues SET type = 'one-shot' WHERE type = 'event';

-- 3. Re-add the CHECK constraint with the new allowed values.
ALTER TABLE public.leagues
  ADD CONSTRAINT leagues_type_check
  CHECK (type IN ('one-shot', 'season'));

COMMIT;
