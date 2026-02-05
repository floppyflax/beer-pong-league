-- ============================================
-- Migration: Add Tournament Code, Format, and Freemium Fields
-- Description: Adds join_code, format configuration, and privacy settings for Story 8.2
-- ============================================

-- Add join_code column (unique 6-character code for joining tournaments)
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE CHECK (length(join_code) = 6);

-- Add format configuration columns
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS format_type TEXT CHECK (format_type IN ('fixed', 'free'));

ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS team1_size INTEGER;

ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS team2_size INTEGER;

-- Add freemium and privacy columns
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 16;

ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT true;

ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled'));

-- Create index on join_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_tournament_join_code ON public.tournaments(join_code);

-- Add comment for documentation
COMMENT ON COLUMN public.tournaments.join_code IS 'Unique 6-character alphanumeric code for joining tournament (e.g., ABC123)';
COMMENT ON COLUMN public.tournaments.format_type IS 'Tournament format: "fixed" for strict team sizes (1v1, 2v2), "free" for flexible teams';
COMMENT ON COLUMN public.tournaments.team1_size IS 'Required team 1 size for fixed formats (null for free format)';
COMMENT ON COLUMN public.tournaments.team2_size IS 'Required team 2 size for fixed formats (null for free format)';
COMMENT ON COLUMN public.tournaments.max_players IS 'Maximum number of players (freemium limit: 6 for free, unlimited for premium)';
COMMENT ON COLUMN public.tournaments.is_private IS 'Whether tournament requires join code (true) or is publicly discoverable (false)';
COMMENT ON COLUMN public.tournaments.status IS 'Tournament status: active, completed, cancelled';
