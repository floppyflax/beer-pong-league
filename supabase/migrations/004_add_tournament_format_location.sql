-- ============================================
-- Migration: Add Format and Location to Tournaments
-- Description: Adds format and location fields to tournaments table for Story 3.1
-- ============================================

-- Add format column to tournaments (default format for matches in this tournament)
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS format TEXT DEFAULT '2v2' CHECK (format IN ('1v1', '2v2', '3v3'));

-- Add location column to tournaments (optional context field)
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Create index for format (for filtering tournaments by format)
CREATE INDEX IF NOT EXISTS idx_tournaments_format ON public.tournaments(format);

-- ============================================
-- END OF MIGRATION
-- ============================================
