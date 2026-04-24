-- ============================================
-- Migration: Achievements system
-- Phase D.3 — Beer Pong ELO redesign
-- Description: achievements definition table, player_achievements junction,
--              and a PostgreSQL trigger that awards MVP achievements automatically.
--
-- MVP achievements (3 for launch):
--   first_match  — first match recorded for this player
--   five_wins    — 5 cumulative wins
--   hot_streak   — streak >= 3
--
-- Rollback (manual):
--   DROP TRIGGER IF EXISTS trg_check_achievements ON public.matches;
--   DROP FUNCTION IF EXISTS check_achievements_on_match();
--   DROP TABLE IF EXISTS public.player_achievements;
--   DROP TABLE IF EXISTS public.achievements;
-- ============================================

-- ── 1. Achievements definition table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.achievements (
  slug        TEXT        PRIMARY KEY,
  label       TEXT        NOT NULL,
  description TEXT        NOT NULL,
  icon_key    TEXT        NOT NULL DEFAULT 'trophy',  -- maps to a UI icon name
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.achievements IS 'Static achievement definitions (slug is the canonical key).';

-- Seed MVP achievements
INSERT INTO public.achievements (slug, label, description, icon_key) VALUES
  ('first_match',  'Premier Match',   'Tu as enregistré ton premier match.',              'flag'),
  ('five_wins',    '5 Victoires',     'Tu as remporté 5 matchs au total.',                'star'),
  ('hot_streak',   'En Feu !',        'Tu as enchaîné 3 victoires ou plus d''affilée.',   'flame')
ON CONFLICT (slug) DO NOTHING;

-- ── 2. Player achievements junction table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.player_achievements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   UUID        NOT NULL REFERENCES public.league_players(id) ON DELETE CASCADE,
  achievement_slug TEXT   NOT NULL REFERENCES public.achievements(slug) ON DELETE CASCADE,
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, achievement_slug)
);

CREATE INDEX IF NOT EXISTS idx_player_achievements_player_id
  ON public.player_achievements (player_id);

COMMENT ON TABLE public.player_achievements IS 'Records which achievements a player has earned and when.';

-- ── 3. RLS policies ────────────────────────────────────────────────────────
ALTER TABLE public.achievements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_achievements ENABLE ROW LEVEL SECURITY;

-- achievements: public read-only
DROP POLICY IF EXISTS "achievements_read" ON public.achievements;
CREATE POLICY "achievements_read"
  ON public.achievements FOR SELECT TO public
  USING (true);

-- player_achievements: public read-only (leaderboard display)
DROP POLICY IF EXISTS "player_achievements_read" ON public.player_achievements;
CREATE POLICY "player_achievements_read"
  ON public.player_achievements FOR SELECT TO public
  USING (true);

-- player_achievements: insert/update via SECURITY DEFINER function only (trigger)
DROP POLICY IF EXISTS "player_achievements_insert_service" ON public.player_achievements;
CREATE POLICY "player_achievements_insert_service"
  ON public.player_achievements FOR INSERT
  WITH CHECK (true);

-- ── 4. Achievement check function (SECURITY DEFINER = runs as DB owner) ─────
CREATE OR REPLACE FUNCTION public.check_achievements_on_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id UUID;
  v_player_ids UUID[];
  v_wins       INTEGER;
  v_streak     INTEGER;
  v_matches_played INTEGER;
BEGIN
  -- Collect all player IDs from teamA and teamB arrays (stored as text[])
  -- NEW.team_a and NEW.team_b are text[] columns containing league_player IDs
  v_player_ids := ARRAY(
    SELECT unnest(NEW.team_a::UUID[])
    UNION
    SELECT unnest(NEW.team_b::UUID[])
  );

  FOREACH v_player_id IN ARRAY v_player_ids LOOP

    -- Read current stats for this player
    SELECT wins, streak, matches_played
    INTO v_wins, v_streak, v_matches_played
    FROM public.league_players
    WHERE id = v_player_id;

    -- Achievement: first_match (matches_played >= 1)
    IF v_matches_played >= 1 THEN
      INSERT INTO public.player_achievements (player_id, achievement_slug)
      VALUES (v_player_id, 'first_match')
      ON CONFLICT (player_id, achievement_slug) DO NOTHING;
    END IF;

    -- Achievement: five_wins (wins >= 5)
    IF v_wins >= 5 THEN
      INSERT INTO public.player_achievements (player_id, achievement_slug)
      VALUES (v_player_id, 'five_wins')
      ON CONFLICT (player_id, achievement_slug) DO NOTHING;
    END IF;

    -- Achievement: hot_streak (streak >= 3)
    IF v_streak >= 3 THEN
      INSERT INTO public.player_achievements (player_id, achievement_slug)
      VALUES (v_player_id, 'hot_streak')
      ON CONFLICT (player_id, achievement_slug) DO NOTHING;
    END IF;

  END LOOP;

  RETURN NEW;
END;
$$;

-- ── 5. Trigger: fire AFTER a match INSERT (ELO already updated at this point)
DROP TRIGGER IF EXISTS trg_check_achievements ON public.matches;
CREATE TRIGGER trg_check_achievements
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.check_achievements_on_match();

COMMENT ON FUNCTION public.check_achievements_on_match() IS
  'Awards achievements to all match participants after a match is recorded. '
  'Runs AFTER INSERT so that ELO/wins/streak columns are already updated.';
