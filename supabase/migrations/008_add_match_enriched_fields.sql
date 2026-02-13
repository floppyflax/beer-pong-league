-- ============================================
-- Migration: Add enriched match fields (cups_remaining, photo_url)
-- Story: 14-24
-- Description: Add optional cups_remaining (1-10) and photo_url for winning team
-- ============================================

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS cups_remaining INTEGER NULL,
  ADD COLUMN IF NOT EXISTS photo_url TEXT NULL;

-- Add check constraint for cups_remaining (1-10 when present)
ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_cups_remaining_range;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_cups_remaining_range
  CHECK (cups_remaining IS NULL OR (cups_remaining >= 1 AND cups_remaining <= 10));

-- Add comments for documentation
COMMENT ON COLUMN public.matches.cups_remaining IS 'Number of cups remaining for winning team (1-10). Null if not recorded.';
COMMENT ON COLUMN public.matches.photo_url IS 'Supabase Storage URL for winning team photo. Null if not uploaded.';
