-- Migration 024 — Rename `tournaments` → `events` (DB cutover)
--
-- Per the redesign spec (docs/redesign-spec.md §6.3 + OQ #9), the canonical
-- domain term is "event" everywhere. The UI/route layer was renamed in commit
-- 800bda7 (refactor: rename tournament→event at UI/route layer). This
-- migration completes the cutover at the DB schema level.
--
-- Renames:
--   tournaments              → events
--   tournament_memberships   → event_memberships
--   matches.tournament_id    → matches.event_id
--   elo_history.tournament_id → elo_history.event_id
--   event_memberships.tournament_id → event_memberships.event_id (auto-renamed
--   on table rename, but column rename is explicit for FK column)
--
-- Cleanup as a side-effect:
--   Two legacy triggers were left dangling after mig 022 (they referenced the
--   dropped tables `tournament_players` / `league_players` / `anonymous_users`).
--   They are dropped here:
--     - tournament_add_creator_trigger (function: add_creator_as_tournament_participant)
--     - trg_check_achievements (function: check_achievements_on_match)
--   The achievement trigger can be recreated against the unified schema in a
--   follow-up; the creator-add trigger is replaced by client-side logic
--   (PlayersRepository.addLeaguePlayerToTournament when a creator joins).

BEGIN;

-- ──────────────────────────────────────────────────────────────────────
-- 1. Drop legacy triggers (broken since mig 022, silent no-op in prod)
-- ──────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS tournament_add_creator_trigger ON public.tournaments;
DROP FUNCTION IF EXISTS public.add_creator_as_tournament_participant();

DROP TRIGGER IF EXISTS trg_check_achievements ON public.matches;
DROP FUNCTION IF EXISTS public.check_achievements_on_match();

-- ──────────────────────────────────────────────────────────────────────
-- 2. Drop the timestamp-trigger that uses an OID reference to "tournaments"
--    (it'll be recreated on `events` after the rename)
-- ──────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS update_tournaments_updated_at ON public.tournaments;

-- ──────────────────────────────────────────────────────────────────────
-- 3. Rename tables (FK + indexes + policies follow automatically via OID)
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.tournaments              RENAME TO events;
ALTER TABLE public.tournament_memberships   RENAME TO event_memberships;

-- ──────────────────────────────────────────────────────────────────────
-- 4. Rename foreign-key columns
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.matches            RENAME COLUMN tournament_id TO event_id;
ALTER TABLE public.elo_history        RENAME COLUMN tournament_id TO event_id;
ALTER TABLE public.event_memberships  RENAME COLUMN tournament_id TO event_id;

-- ──────────────────────────────────────────────────────────────────────
-- 5. Rename FK constraints (cosmetic — keeps DB readable)
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.events                RENAME CONSTRAINT tournaments_pkey                TO events_pkey;
ALTER TABLE public.events                RENAME CONSTRAINT tournaments_league_id_fkey      TO events_league_id_fkey;
ALTER TABLE public.events                RENAME CONSTRAINT tournaments_creator_user_id_fkey TO events_creator_user_id_fkey;
ALTER TABLE public.events                RENAME CONSTRAINT tournaments_join_code_key       TO events_join_code_key;
ALTER TABLE public.events                RENAME CONSTRAINT tournaments_join_code_check     TO events_join_code_check;
ALTER TABLE public.events                RENAME CONSTRAINT tournaments_format_type_check   TO events_format_type_check;
ALTER TABLE public.events                RENAME CONSTRAINT tournaments_status_check        TO events_status_check;
ALTER TABLE public.events                RENAME CONSTRAINT tournaments_mode_check          TO events_mode_check;
ALTER TABLE public.events                RENAME CONSTRAINT tournaments_format_check        TO events_format_check;

ALTER TABLE public.event_memberships     RENAME CONSTRAINT tournament_memberships_pkey                  TO event_memberships_pkey;
ALTER TABLE public.event_memberships     RENAME CONSTRAINT tournament_memberships_tournament_id_player_id_key TO event_memberships_event_id_player_id_key;
ALTER TABLE public.event_memberships     RENAME CONSTRAINT tournament_memberships_tournament_id_fkey    TO event_memberships_event_id_fkey;
ALTER TABLE public.event_memberships     RENAME CONSTRAINT tournament_memberships_player_id_fkey        TO event_memberships_player_id_fkey;

ALTER TABLE public.matches               RENAME CONSTRAINT matches_tournament_id_fkey      TO matches_event_id_fkey;
ALTER TABLE public.elo_history           RENAME CONSTRAINT elo_history_tournament_id_fkey  TO elo_history_event_id_fkey;

-- ──────────────────────────────────────────────────────────────────────
-- 6. Rename indexes (cosmetic)
-- ──────────────────────────────────────────────────────────────────────

ALTER INDEX IF EXISTS public.tournaments_pkey                          RENAME TO events_pkey;
ALTER INDEX IF EXISTS public.tournaments_join_code_key                 RENAME TO events_join_code_key;
ALTER INDEX IF EXISTS public.idx_tournament_join_code                  RENAME TO idx_event_join_code;
ALTER INDEX IF EXISTS public.idx_tournaments_creator_user              RENAME TO idx_events_creator_user;
ALTER INDEX IF EXISTS public.idx_tournaments_format                    RENAME TO idx_events_format;
ALTER INDEX IF EXISTS public.idx_tournaments_league                    RENAME TO idx_events_league;

ALTER INDEX IF EXISTS public.tournament_memberships_pkey               RENAME TO event_memberships_pkey;
ALTER INDEX IF EXISTS public.tournament_memberships_tournament_id_player_id_key RENAME TO event_memberships_event_id_player_id_key;
ALTER INDEX IF EXISTS public.idx_tm_tournament                         RENAME TO idx_em_event;
ALTER INDEX IF EXISTS public.idx_tm_player                             RENAME TO idx_em_player;
ALTER INDEX IF EXISTS public.idx_tm_active                             RENAME TO idx_em_active;
ALTER INDEX IF EXISTS public.idx_tournament_memberships_elo            RENAME TO idx_event_memberships_elo;

ALTER INDEX IF EXISTS public.idx_matches_tournament                    RENAME TO idx_matches_event;
ALTER INDEX IF EXISTS public.idx_elo_history_tournament                RENAME TO idx_elo_history_event;

-- ──────────────────────────────────────────────────────────────────────
-- 7. Rename RLS policies (cosmetic — body conditions on auth.uid stay valid
--    since column names didn't change in the policy bodies)
-- ──────────────────────────────────────────────────────────────────────

ALTER POLICY tournaments_select_all ON public.events RENAME TO events_select_all;
ALTER POLICY tournaments_insert_all ON public.events RENAME TO events_insert_all;
ALTER POLICY tournaments_update_all ON public.events RENAME TO events_update_all;
ALTER POLICY tournaments_delete_all ON public.events RENAME TO events_delete_all;

ALTER POLICY tm_all ON public.event_memberships RENAME TO em_all;

-- ──────────────────────────────────────────────────────────────────────
-- 8. Recreate the timestamp trigger on the renamed `events` table
-- ──────────────────────────────────────────────────────────────────────

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
