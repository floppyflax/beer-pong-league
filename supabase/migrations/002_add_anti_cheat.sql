-- ============================================
-- Migration: Add Anti-Cheat Feature
-- Description: Adds anti-cheat option to leagues/tournaments and match confirmation system
-- ============================================

-- Add anti_cheat_enabled column to leagues
ALTER TABLE public.leagues 
ADD COLUMN IF NOT EXISTS anti_cheat_enabled BOOLEAN DEFAULT FALSE;

-- Add anti_cheat_enabled column to tournaments
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS anti_cheat_enabled BOOLEAN DEFAULT FALSE;

-- Add status column to matches for confirmation workflow
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'rejected'));

-- Add confirmation fields to matches
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS confirmed_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS confirmed_by_anonymous_user_id UUID REFERENCES public.anonymous_users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Add check constraint for confirmation fields
ALTER TABLE public.matches 
ADD CONSTRAINT matches_confirmation_check CHECK (
  (confirmed_by_user_id IS NOT NULL AND confirmed_by_anonymous_user_id IS NULL) OR
  (confirmed_by_user_id IS NULL AND confirmed_by_anonymous_user_id IS NOT NULL) OR
  (confirmed_by_user_id IS NULL AND confirmed_by_anonymous_user_id IS NULL)
);

-- Create index for pending matches (for performance)
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status) WHERE status = 'pending';

-- Create index for anti-cheat enabled leagues/tournaments
CREATE INDEX IF NOT EXISTS idx_leagues_anti_cheat ON public.leagues(anti_cheat_enabled) WHERE anti_cheat_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_tournaments_anti_cheat ON public.tournaments(anti_cheat_enabled) WHERE anti_cheat_enabled = TRUE;


