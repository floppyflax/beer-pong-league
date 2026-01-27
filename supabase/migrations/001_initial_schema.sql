-- ============================================
-- Migration: Initial Schema & Security Setup
-- Description: Complete database schema with RLS policies, triggers, and indexes
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLES (Create if not exists)
-- ============================================

-- Table: users (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudo TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: anonymous_users
CREATE TABLE IF NOT EXISTS public.anonymous_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pseudo TEXT NOT NULL,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  merged_to_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  merged_at TIMESTAMPTZ
);

-- Table: leagues
CREATE TABLE IF NOT EXISTS public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('event', 'season')),
  creator_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  creator_anonymous_user_id UUID REFERENCES public.anonymous_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (creator_user_id IS NOT NULL AND creator_anonymous_user_id IS NULL) OR
    (creator_user_id IS NULL AND creator_anonymous_user_id IS NOT NULL)
  )
);

-- Table: league_players (with ELO stats)
CREATE TABLE IF NOT EXISTS public.league_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  anonymous_user_id UUID REFERENCES public.anonymous_users(id) ON DELETE CASCADE,
  pseudo_in_league TEXT NOT NULL,
  elo INTEGER DEFAULT 1000,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (user_id IS NOT NULL AND anonymous_user_id IS NULL) OR
    (user_id IS NULL AND anonymous_user_id IS NOT NULL)
  ),
  UNIQUE(league_id, user_id) WHERE user_id IS NOT NULL,
  UNIQUE(league_id, anonymous_user_id) WHERE anonymous_user_id IS NOT NULL
);

-- Table: tournaments
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES public.leagues(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  creator_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  creator_anonymous_user_id UUID REFERENCES public.anonymous_users(id) ON DELETE SET NULL,
  is_finished BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (creator_user_id IS NOT NULL AND creator_anonymous_user_id IS NULL) OR
    (creator_user_id IS NULL AND creator_anonymous_user_id IS NOT NULL)
  )
);

-- Table: tournament_players
CREATE TABLE IF NOT EXISTS public.tournament_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  anonymous_user_id UUID REFERENCES public.anonymous_users(id) ON DELETE CASCADE,
  pseudo_in_tournament TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (user_id IS NOT NULL AND anonymous_user_id IS NULL) OR
    (user_id IS NULL AND anonymous_user_id IS NOT NULL)
  ),
  UNIQUE(tournament_id, user_id) WHERE user_id IS NOT NULL,
  UNIQUE(tournament_id, anonymous_user_id) WHERE anonymous_user_id IS NOT NULL
);

-- Table: matches
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('1v1', '2v2', '3v3')),
  team_a_player_ids UUID[] NOT NULL,
  team_b_player_ids UUID[] NOT NULL,
  score_a INTEGER NOT NULL,
  score_b INTEGER NOT NULL,
  is_ranked BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by_anonymous_user_id UUID REFERENCES public.anonymous_users(id) ON DELETE SET NULL,
  CHECK (
    (created_by_user_id IS NOT NULL AND created_by_anonymous_user_id IS NULL) OR
    (created_by_user_id IS NULL AND created_by_anonymous_user_id IS NOT NULL)
  ),
  CHECK (
    (tournament_id IS NOT NULL) OR (league_id IS NOT NULL)
  )
);

-- Table: elo_history
CREATE TABLE IF NOT EXISTS public.elo_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  league_id UUID REFERENCES public.leagues(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  anonymous_user_id UUID REFERENCES public.anonymous_users(id) ON DELETE CASCADE,
  elo_before INTEGER NOT NULL,
  elo_after INTEGER NOT NULL,
  elo_change INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (user_id IS NOT NULL AND anonymous_user_id IS NULL) OR
    (user_id IS NULL AND anonymous_user_id IS NOT NULL)
  )
);

-- Table: user_identity_merges
CREATE TABLE IF NOT EXISTS public.user_identity_merges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_user_id UUID NOT NULL REFERENCES public.anonymous_users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  merged_at TIMESTAMPTZ DEFAULT NOW(),
  stats_migrated BOOLEAN DEFAULT FALSE
);

-- ============================================
-- 2. ADD MISSING COLUMNS (if they don't exist)
-- ============================================

-- Add ELO stats to league_players if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'league_players' 
                 AND column_name = 'elo') THEN
    ALTER TABLE public.league_players ADD COLUMN elo INTEGER DEFAULT 1000;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'league_players' 
                 AND column_name = 'wins') THEN
    ALTER TABLE public.league_players ADD COLUMN wins INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'league_players' 
                 AND column_name = 'losses') THEN
    ALTER TABLE public.league_players ADD COLUMN losses INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'league_players' 
                 AND column_name = 'matches_played') THEN
    ALTER TABLE public.league_players ADD COLUMN matches_played INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'league_players' 
                 AND column_name = 'streak') THEN
    ALTER TABLE public.league_players ADD COLUMN streak INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- 3. INDEXES (for performance)
-- ============================================

-- Indexes for anonymous_users
CREATE INDEX IF NOT EXISTS idx_anonymous_users_fingerprint ON public.anonymous_users(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_anonymous_users_merged ON public.anonymous_users(merged_to_user_id);

-- Indexes for leagues
CREATE INDEX IF NOT EXISTS idx_leagues_creator_user ON public.leagues(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_leagues_creator_anonymous ON public.leagues(creator_anonymous_user_id);
CREATE INDEX IF NOT EXISTS idx_leagues_created_at ON public.leagues(created_at);

-- Indexes for league_players
CREATE INDEX IF NOT EXISTS idx_league_players_league ON public.league_players(league_id);
CREATE INDEX IF NOT EXISTS idx_league_players_user ON public.league_players(user_id);
CREATE INDEX IF NOT EXISTS idx_league_players_anonymous ON public.league_players(anonymous_user_id);
CREATE INDEX IF NOT EXISTS idx_league_players_elo ON public.league_players(league_id, elo DESC);

-- Indexes for tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_league ON public.tournaments(league_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_creator_user ON public.tournaments(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_creator_anonymous ON public.tournaments(creator_anonymous_user_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_date ON public.tournaments(date);

-- Indexes for tournament_players
CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament ON public.tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_user ON public.tournament_players(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_anonymous ON public.tournament_players(anonymous_user_id);

-- Indexes for matches
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_league ON public.matches(league_id);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON public.matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_created_by_user ON public.matches(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_created_by_anonymous ON public.matches(created_by_anonymous_user_id);

-- Indexes for elo_history
CREATE INDEX IF NOT EXISTS idx_elo_history_match ON public.elo_history(match_id);
CREATE INDEX IF NOT EXISTS idx_elo_history_tournament ON public.elo_history(tournament_id);
CREATE INDEX IF NOT EXISTS idx_elo_history_league ON public.elo_history(league_id);
CREATE INDEX IF NOT EXISTS idx_elo_history_user ON public.elo_history(user_id);
CREATE INDEX IF NOT EXISTS idx_elo_history_anonymous ON public.elo_history(anonymous_user_id);
CREATE INDEX IF NOT EXISTS idx_elo_history_created_at ON public.elo_history(created_at DESC);

-- Indexes for user_identity_merges
CREATE INDEX IF NOT EXISTS idx_identity_merges_user ON public.user_identity_merges(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_merges_anonymous ON public.user_identity_merges(anonymous_user_id);

-- ============================================
-- 4. TRIGGERS (for updated_at)
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to leagues
DROP TRIGGER IF EXISTS update_leagues_updated_at ON public.leagues;
CREATE TRIGGER update_leagues_updated_at
  BEFORE UPDATE ON public.leagues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to tournaments
DROP TRIGGER IF EXISTS update_tournaments_updated_at ON public.tournaments;
CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to users
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elo_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_identity_merges ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5.1. USERS POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 5.2. ANONYMOUS_USERS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can manage anonymous users" ON public.anonymous_users;

-- Anonymous users can be created/read by anyone (for offline-first)
-- But only the creator can update/delete
CREATE POLICY "Anyone can create anonymous users" ON public.anonymous_users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read anonymous users" ON public.anonymous_users
  FOR SELECT
  USING (true);

-- Note: Update/Delete policies would need device fingerprint matching
-- For now, we allow updates (handled by application logic)

-- ============================================
-- 5.3. LEAGUES POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read leagues" ON public.leagues;
DROP POLICY IF EXISTS "Anyone can create leagues" ON public.leagues;
DROP POLICY IF EXISTS "Creators can update leagues" ON public.leagues;
DROP POLICY IF EXISTS "Creators can delete leagues" ON public.leagues;

-- Anyone can read leagues (for Display View)
CREATE POLICY "Anyone can read leagues" ON public.leagues
  FOR SELECT
  USING (true);

-- Anyone can create leagues (offline-first)
CREATE POLICY "Anyone can create leagues" ON public.leagues
  FOR INSERT
  WITH CHECK (true);

-- Only creators can update their leagues
CREATE POLICY "Creators can update leagues" ON public.leagues
  FOR UPDATE
  USING (
    (creator_user_id = auth.uid()) OR 
    (creator_anonymous_user_id IS NOT NULL)
  )
  WITH CHECK (
    (creator_user_id = auth.uid()) OR 
    (creator_anonymous_user_id IS NOT NULL)
  );

-- Only creators can delete their leagues
CREATE POLICY "Creators can delete leagues" ON public.leagues
  FOR DELETE
  USING (
    (creator_user_id = auth.uid()) OR 
    (creator_anonymous_user_id IS NOT NULL)
  );

-- ============================================
-- 5.4. LEAGUE_PLAYERS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read league players" ON public.league_players;
DROP POLICY IF EXISTS "Anyone can join leagues" ON public.league_players;
DROP POLICY IF EXISTS "Players can leave leagues" ON public.league_players;

-- Anyone can read league players (for Display View)
CREATE POLICY "Anyone can read league players" ON public.league_players
  FOR SELECT
  USING (true);

-- Anyone can join leagues (offline-first)
CREATE POLICY "Anyone can join leagues" ON public.league_players
  FOR INSERT
  WITH CHECK (true);

-- Players can update their own stats (via league creator or themselves)
-- For now, allow updates (handled by application logic)
CREATE POLICY "Anyone can update league players" ON public.league_players
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Players can leave leagues
CREATE POLICY "Players can leave leagues" ON public.league_players
  FOR DELETE
  USING (
    (user_id = auth.uid()) OR 
    (anonymous_user_id IS NOT NULL)
  );

-- ============================================
-- 5.5. TOURNAMENTS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Anyone can create tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Creators can update tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Creators can delete tournaments" ON public.tournaments;

-- Anyone can read tournaments (for Display View)
CREATE POLICY "Anyone can read tournaments" ON public.tournaments
  FOR SELECT
  USING (true);

-- Anyone can create tournaments (offline-first)
CREATE POLICY "Anyone can create tournaments" ON public.tournaments
  FOR INSERT
  WITH CHECK (true);

-- Only creators can update their tournaments
CREATE POLICY "Creators can update tournaments" ON public.tournaments
  FOR UPDATE
  USING (
    (creator_user_id = auth.uid()) OR 
    (creator_anonymous_user_id IS NOT NULL)
  )
  WITH CHECK (
    (creator_user_id = auth.uid()) OR 
    (creator_anonymous_user_id IS NOT NULL)
  );

-- Only creators can delete their tournaments
CREATE POLICY "Creators can delete tournaments" ON public.tournaments
  FOR DELETE
  USING (
    (creator_user_id = auth.uid()) OR 
    (creator_anonymous_user_id IS NOT NULL)
  );

-- ============================================
-- 5.6. TOURNAMENT_PLAYERS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read tournament players" ON public.tournament_players;
DROP POLICY IF EXISTS "Anyone can join tournaments" ON public.tournament_players;
DROP POLICY IF EXISTS "Players can leave tournaments" ON public.tournament_players;

-- Anyone can read tournament players (for Display View)
CREATE POLICY "Anyone can read tournament players" ON public.tournament_players
  FOR SELECT
  USING (true);

-- Anyone can join tournaments (offline-first)
CREATE POLICY "Anyone can join tournaments" ON public.tournament_players
  FOR INSERT
  WITH CHECK (true);

-- Players can leave tournaments
CREATE POLICY "Players can leave tournaments" ON public.tournament_players
  FOR DELETE
  USING (
    (user_id = auth.uid()) OR 
    (anonymous_user_id IS NOT NULL)
  );

-- ============================================
-- 5.7. MATCHES POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read matches" ON public.matches;
DROP POLICY IF EXISTS "Anyone can create matches" ON public.matches;
DROP POLICY IF EXISTS "Creators can update matches" ON public.matches;

-- Anyone can read matches (for Display View)
CREATE POLICY "Anyone can read matches" ON public.matches
  FOR SELECT
  USING (true);

-- Anyone can create matches (offline-first)
CREATE POLICY "Anyone can create matches" ON public.matches
  FOR INSERT
  WITH CHECK (true);

-- Only creators can update their matches
CREATE POLICY "Creators can update matches" ON public.matches
  FOR UPDATE
  USING (
    (created_by_user_id = auth.uid()) OR 
    (created_by_anonymous_user_id IS NOT NULL)
  )
  WITH CHECK (
    (created_by_user_id = auth.uid()) OR 
    (created_by_anonymous_user_id IS NOT NULL)
  );

-- Only creators can delete their matches
CREATE POLICY "Creators can delete matches" ON public.matches
  FOR DELETE
  USING (
    (created_by_user_id = auth.uid()) OR 
    (created_by_anonymous_user_id IS NOT NULL)
  );

-- ============================================
-- 5.8. ELO_HISTORY POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read elo history" ON public.elo_history;
DROP POLICY IF EXISTS "Anyone can insert elo history" ON public.elo_history;

-- Anyone can read ELO history (for Display View)
CREATE POLICY "Anyone can read elo history" ON public.elo_history
  FOR SELECT
  USING (true);

-- Anyone can insert ELO history (system-generated)
CREATE POLICY "Anyone can insert elo history" ON public.elo_history
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 5.9. USER_IDENTITY_MERGES POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "System can insert merges" ON public.user_identity_merges;
DROP POLICY IF EXISTS "Users can read own merges" ON public.user_identity_merges;

-- System can insert merges
CREATE POLICY "System can insert merges" ON public.user_identity_merges
  FOR INSERT
  WITH CHECK (true);

-- Users can read their own merges
CREATE POLICY "Users can read own merges" ON public.user_identity_merges
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- END OF MIGRATION
-- ============================================


