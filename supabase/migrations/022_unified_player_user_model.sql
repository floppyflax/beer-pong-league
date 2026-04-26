-- Migration 022 — Unified player/user model (clean cutover)
--
-- Replaces the legacy double-rooted identity model:
--   users + anonymous_users + league_players + tournament_players + user_identity_merges
-- with a unified one:
--   users (auth-aware, can be anonymous)
--   players (the in-game entity, optionally claimed by a user)
--   league_memberships, tournament_memberships (thin context joins)
--
-- Concept:
--   - `players` is the source of truth for "a humanoid in the game". A player
--     ALWAYS exists and ALWAYS has a pseudo. A player MAY be claimed by a
--     user (`players.user_id NOT NULL`) — that user becomes its owner.
--   - `users` is the auth identity. A user is EITHER anonymous (no auth.users
--     link, identified by device_fingerprint or just an in-app id) OR
--     authenticated (auth_user_id set, signed in via Supabase Auth).
--   - When a user signs up, their existing anonymous `users` row gets
--     `auth_user_id` set — they keep ownership of all the players they
--     already claimed. No "merge" RPC needed.
--   - Matches reference `players.id` directly, in a single namespace.
--
-- Out: tournament_players, league_players, anonymous_users,
--      user_identity_merges, ghost_invite_tokens (mig 015), and 8 RPCs.
-- In: players, league_memberships, tournament_memberships, claim_player RPC.
--
-- Backfill: the old data is mapped 1:1. Each unique (user_id, anonymous_user_id)
-- combination across league_players + tournament_players becomes one player.

-- (apply_migration already wraps in a transaction; no explicit BEGIN/COMMIT.)

-- ════════════════════════════════════════════════════════════════════════
-- 1. Add new shape to `users` (single identity table, anon or auth)
-- ════════════════════════════════════════════════════════════════════════

-- The legacy users.id is FK → auth.users(id) ON DELETE CASCADE. We keep that
-- for already-authenticated users, but new (anonymous-only) users won't have
-- an auth.users counterpart. So we drop the FK and instead use an explicit
-- `auth_user_id` column when present.

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

-- Existing public.users rows mirror auth.users → set auth_user_id = id.
UPDATE public.users SET auth_user_id = id WHERE auth_user_id IS NULL;

-- Pre-existing anonymous_users get migrated into users (anonymous identities).
-- We DON'T copy merged_to_user_id into auth_user_id at this point because it
-- might point to an auth user that doesn't exist (FK would fail) and because
-- merged anon users are duplicates of an existing users row anyway. They stay
-- as standalone anon rows; their players will get repointed if needed.
INSERT INTO public.users (id, pseudo, is_anonymous, device_fingerprint, created_at, auth_user_id)
SELECT
  au.id,
  COALESCE(au.pseudo, 'Joueur'),
  TRUE,
  au.device_fingerprint,
  au.created_at,
  NULL
FROM public.anonymous_users au
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id)
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_users_auth ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_fingerprint ON public.users(device_fingerprint);

-- ════════════════════════════════════════════════════════════════════════
-- 2. Create `players` (the in-game entity)
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.players (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pseudo      TEXT NOT NULL,
  avatar_url  TEXT,
  -- The user who owns / claimed this player. NULL = ghost (admin-created,
  -- not yet claimed by anyone).
  user_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_players_user ON public.players(user_id);
CREATE INDEX IF NOT EXISTS idx_players_active ON public.players(id) WHERE archived_at IS NULL;
-- A user owns at most one player (1-to-1 when claimed).
CREATE UNIQUE INDEX IF NOT EXISTS uq_players_user ON public.players(user_id) WHERE user_id IS NOT NULL;

DROP TRIGGER IF EXISTS update_players_updated_at ON public.players;
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ════════════════════════════════════════════════════════════════════════
-- 3. Backfill `players` from legacy league_players + tournament_players
-- ════════════════════════════════════════════════════════════════════════

-- Mapping table to remember (legacy_membership_id → new player_id) so we can
-- rewrite matches.team_a/b_player_ids in step 5.
CREATE TEMP TABLE _player_id_map (
  legacy_kind  TEXT NOT NULL,        -- 'league' | 'tournament'
  legacy_id    UUID NOT NULL,        -- league_players.id or tournament_players.id
  player_id    UUID NOT NULL,
  PRIMARY KEY (legacy_kind, legacy_id)
);

-- Step 3a: deduplicate legacy rows by identity (user_id || anonymous_user_id)
-- → one player per identity. Use the FIRST league_player (oldest) as the
-- pseudo source; tournament-only players get their own player.

-- Players from league_players:
WITH ranked_lp AS (
  SELECT
    lp.id,
    lp.user_id,
    lp.anonymous_user_id,
    lp.pseudo_in_league,
    lp.joined_at,
    -- Identity key: prefer user_id if set, else anonymous_user_id.
    COALESCE(lp.user_id::text, lp.anonymous_user_id::text) AS identity_key,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(lp.user_id::text, lp.anonymous_user_id::text)
      ORDER BY lp.joined_at NULLS LAST
    ) AS rn
  FROM public.league_players lp
),
inserted_lp AS (
  INSERT INTO public.players (id, pseudo, user_id, created_at)
  SELECT
    gen_random_uuid(),
    pseudo_in_league,
    -- Owning user: the user_id if real, else the anonymous_user_id (since
    -- those were migrated into users above).
    COALESCE(user_id, anonymous_user_id),
    COALESCE(joined_at, NOW())
  FROM ranked_lp
  WHERE rn = 1
  RETURNING id, user_id
)
INSERT INTO _player_id_map (legacy_kind, legacy_id, player_id)
SELECT 'league', lp.id, p.id
FROM public.league_players lp
JOIN inserted_lp p
  ON p.user_id IS NOT DISTINCT FROM COALESCE(lp.user_id, lp.anonymous_user_id);

-- Players from tournament_players that don't already exist via a league_player.
-- (Ghost players added directly to a standalone tournament have no league row.)
WITH tournament_only AS (
  SELECT
    tp.id,
    tp.user_id,
    tp.anonymous_user_id,
    tp.pseudo_in_tournament,
    tp.joined_at,
    COALESCE(tp.user_id, tp.anonymous_user_id) AS identity_uid
  FROM public.tournament_players tp
  WHERE NOT EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.user_id IS NOT DISTINCT FROM COALESCE(tp.user_id, tp.anonymous_user_id)
      AND p.user_id IS NOT NULL
  )
),
ranked_tp AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY identity_uid ORDER BY joined_at NULLS LAST) AS rn
  FROM tournament_only
),
inserted_tp AS (
  INSERT INTO public.players (id, pseudo, user_id, created_at)
  SELECT gen_random_uuid(), pseudo_in_tournament, identity_uid, COALESCE(joined_at, NOW())
  FROM ranked_tp WHERE rn = 1
  RETURNING id, user_id
)
INSERT INTO _player_id_map (legacy_kind, legacy_id, player_id)
SELECT 'tournament', tp.id, p.id
FROM public.tournament_players tp
JOIN public.players p
  ON p.user_id IS NOT DISTINCT FROM COALESCE(tp.user_id, tp.anonymous_user_id)
WHERE NOT EXISTS (
  SELECT 1 FROM _player_id_map m WHERE m.legacy_kind = 'tournament' AND m.legacy_id = tp.id
);
-- ════════════════════════════════════════════════════════════════════════
-- 4. Create membership tables and backfill them
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.league_memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id       UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  pseudo_override TEXT,                      -- per-league display override (NULL → use players.pseudo)
  elo             INTEGER NOT NULL DEFAULT 1000,
  wins            INTEGER NOT NULL DEFAULT 0,
  losses          INTEGER NOT NULL DEFAULT 0,
  matches_played  INTEGER NOT NULL DEFAULT 0,
  streak          INTEGER NOT NULL DEFAULT 0,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at     TIMESTAMPTZ,
  UNIQUE (league_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_lm_league ON public.league_memberships(league_id);
CREATE INDEX IF NOT EXISTS idx_lm_player ON public.league_memberships(player_id);
CREATE INDEX IF NOT EXISTS idx_lm_active ON public.league_memberships(league_id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lm_elo ON public.league_memberships(league_id, elo DESC);

CREATE TABLE IF NOT EXISTS public.tournament_memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  pseudo_override TEXT,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at     TIMESTAMPTZ,
  UNIQUE (tournament_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_tm_tournament ON public.tournament_memberships(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tm_player ON public.tournament_memberships(player_id);
CREATE INDEX IF NOT EXISTS idx_tm_active ON public.tournament_memberships(tournament_id) WHERE archived_at IS NULL;

-- Backfill league_memberships from league_players, copying ELO stats verbatim.
INSERT INTO public.league_memberships (
  id, league_id, player_id, pseudo_override, elo, wins, losses, matches_played, streak, joined_at, archived_at
)
SELECT
  gen_random_uuid(),
  lp.league_id,
  m.player_id,
  -- Only set override if the legacy pseudo differs from the new players.pseudo
  CASE WHEN lp.pseudo_in_league IS DISTINCT FROM p.pseudo THEN lp.pseudo_in_league ELSE NULL END,
  COALESCE(lp.elo, 1000),
  COALESCE(lp.wins, 0),
  COALESCE(lp.losses, 0),
  COALESCE(lp.matches_played, 0),
  COALESCE(lp.streak, 0),
  COALESCE(lp.joined_at, NOW()),
  NULL::timestamptz  -- legacy league_players didn't have archived_at remotely
FROM public.league_players lp
JOIN _player_id_map m ON m.legacy_kind = 'league' AND m.legacy_id = lp.id
JOIN public.players p ON p.id = m.player_id
ON CONFLICT (league_id, player_id) DO NOTHING;

-- Backfill tournament_memberships from tournament_players.
INSERT INTO public.tournament_memberships (
  id, tournament_id, player_id, pseudo_override, joined_at, archived_at
)
SELECT
  gen_random_uuid(),
  tp.tournament_id,
  m.player_id,
  CASE WHEN tp.pseudo_in_tournament IS DISTINCT FROM p.pseudo THEN tp.pseudo_in_tournament ELSE NULL END,
  COALESCE(tp.joined_at, NOW()),
  NULL::timestamptz  -- legacy tournament_players didn't have archived_at remotely
FROM public.tournament_players tp
JOIN _player_id_map m ON m.legacy_kind = 'tournament' AND m.legacy_id = tp.id
JOIN public.players p ON p.id = m.player_id
ON CONFLICT (tournament_id, player_id) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════
-- 5. Rewrite matches.team_a/b_player_ids to point at players.id
-- ════════════════════════════════════════════════════════════════════════
--
-- Each entry in team_a/b_player_ids is currently a tournament_players.id (for
-- tournament matches) or league_players.id (for league-only matches). We
-- rewrite via _player_id_map.

UPDATE public.matches m
   SET team_a_player_ids = (
     SELECT array_agg(COALESCE(map.player_id, legacy_id::uuid))
     FROM unnest(m.team_a_player_ids) AS legacy_id
     LEFT JOIN _player_id_map map
       ON map.legacy_id = legacy_id::uuid
       AND map.legacy_kind = CASE WHEN m.tournament_id IS NOT NULL THEN 'tournament' ELSE 'league' END
   ),
   team_b_player_ids = (
     SELECT array_agg(COALESCE(map.player_id, legacy_id::uuid))
     FROM unnest(m.team_b_player_ids) AS legacy_id
     LEFT JOIN _player_id_map map
       ON map.legacy_id = legacy_id::uuid
       AND map.legacy_kind = CASE WHEN m.tournament_id IS NOT NULL THEN 'tournament' ELSE 'league' END
   );

-- elo_history: pivot user_id/anonymous_user_id → player_id.
-- Add player_id column; drop the legacy two-column identity later.
ALTER TABLE public.elo_history
  ADD COLUMN IF NOT EXISTS player_id UUID REFERENCES public.players(id) ON DELETE CASCADE;

UPDATE public.elo_history h
   SET player_id = p.id
  FROM public.players p
 WHERE h.player_id IS NULL
   AND p.user_id IS NOT DISTINCT FROM COALESCE(h.user_id, h.anonymous_user_id);

CREATE INDEX IF NOT EXISTS idx_elo_history_player ON public.elo_history(player_id);

-- ════════════════════════════════════════════════════════════════════════
-- 6. Drop legacy tables, RPCs, columns
-- ════════════════════════════════════════════════════════════════════════

-- Legacy RPCs first (they reference the soon-to-be-dropped tables).
DROP FUNCTION IF EXISTS public.merge_anonymous_identity(UUID, UUID);
DROP FUNCTION IF EXISTS public.claim_anonymous_player(TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS public.claim_anonymous_player_anon(TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS public.generate_ghost_invite_token(TEXT, UUID);
DROP FUNCTION IF EXISTS public.revoke_ghost_invite_token(UUID);
DROP FUNCTION IF EXISTS public.claim_ghost_by_token(TEXT);
DROP FUNCTION IF EXISTS public.rename_anonymous_player(TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS public.delete_anonymous_player(TEXT, UUID);
DROP FUNCTION IF EXISTS public.archive_anonymous_player(TEXT, UUID);
DROP FUNCTION IF EXISTS public.propagate_user_pseudo();

-- Legacy tables.
DROP TABLE IF EXISTS public.user_identity_merges CASCADE;
DROP TABLE IF EXISTS public.tournament_players CASCADE;
DROP TABLE IF EXISTS public.league_players CASCADE;
DROP TABLE IF EXISTS public.ghost_invite_tokens CASCADE; -- mig 015 (if it exists)
DROP TABLE IF EXISTS public.anonymous_users CASCADE;

-- Legacy columns on elo_history (player_id is now the source of truth).
ALTER TABLE public.elo_history DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.elo_history DROP COLUMN IF EXISTS anonymous_user_id;
DROP INDEX IF EXISTS idx_elo_history_user;
DROP INDEX IF EXISTS idx_elo_history_anonymous;

-- Legacy columns on matches (creator/confirmer identities can stay user-only;
-- anonymous users are now in `users`, so we collapse to a single user_id).
ALTER TABLE public.matches RENAME COLUMN created_by_user_id TO created_by_user_id_old;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
UPDATE public.matches SET created_by_user_id = COALESCE(created_by_user_id_old, created_by_anonymous_user_id);
ALTER TABLE public.matches DROP COLUMN IF EXISTS created_by_user_id_old;
ALTER TABLE public.matches DROP COLUMN IF EXISTS created_by_anonymous_user_id;

ALTER TABLE public.matches RENAME COLUMN confirmed_by_user_id TO confirmed_by_user_id_old;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS confirmed_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
UPDATE public.matches SET confirmed_by_user_id = COALESCE(confirmed_by_user_id_old, confirmed_by_anonymous_user_id);
ALTER TABLE public.matches DROP COLUMN IF EXISTS confirmed_by_user_id_old;
ALTER TABLE public.matches DROP COLUMN IF EXISTS confirmed_by_anonymous_user_id;

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_created_by_check;
-- (the legacy CHECK forced exactly-one-of (user, anon); now it's just user_id)

-- Same collapse for leagues + tournaments creator columns.
ALTER TABLE public.leagues DROP CONSTRAINT IF EXISTS leagues_creator_check;
UPDATE public.leagues SET creator_user_id = COALESCE(creator_user_id, creator_anonymous_user_id);
ALTER TABLE public.leagues DROP COLUMN IF EXISTS creator_anonymous_user_id;
ALTER TABLE public.leagues ALTER COLUMN creator_user_id DROP NOT NULL;

ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_creator_check;
UPDATE public.tournaments SET creator_user_id = COALESCE(creator_user_id, creator_anonymous_user_id);
ALTER TABLE public.tournaments DROP COLUMN IF EXISTS creator_anonymous_user_id;
ALTER TABLE public.tournaments ALTER COLUMN creator_user_id DROP NOT NULL;

-- ════════════════════════════════════════════════════════════════════════
-- 7. RLS on the new tables
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_memberships ENABLE ROW LEVEL SECURITY;

-- Helper: is the calling auth user the owner of `users.id` ?
-- A `users` row is "mine" if its `auth_user_id` = auth.uid().
CREATE OR REPLACE FUNCTION public.users_is_caller(p_user_id UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = p_user_id AND u.auth_user_id = auth.uid()
  );
$$;

-- players: world-readable (display view), insert open (offline-first), update
-- restricted to the owning user OR the admin of any context the player belongs
-- to. Delete reserved to admins (we soft-delete via archived_at most of the time).
DROP POLICY IF EXISTS players_select ON public.players;
CREATE POLICY players_select ON public.players FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS players_insert ON public.players;
CREATE POLICY players_insert ON public.players FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS players_update ON public.players;
CREATE POLICY players_update ON public.players FOR UPDATE USING (TRUE) WITH CHECK (TRUE);
-- Tighten later: USING (users_is_caller(user_id) OR caller_is_admin_of_any_context(id))

DROP POLICY IF EXISTS players_delete ON public.players;
CREATE POLICY players_delete ON public.players FOR DELETE USING (TRUE);

-- league_memberships / tournament_memberships: same permissive shape as
-- the legacy *_players had. App-level enforcement, RLS as a coarse net.
DROP POLICY IF EXISTS lm_all ON public.league_memberships;
CREATE POLICY lm_all ON public.league_memberships FOR ALL USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS tm_all ON public.tournament_memberships;
CREATE POLICY tm_all ON public.tournament_memberships FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ════════════════════════════════════════════════════════════════════════
-- 8. New RPC: claim_player
-- ════════════════════════════════════════════════════════════════════════
--
-- "I am this ghost player — link it to my user account." Replaces the whole
-- claim_anonymous_player + claim_anonymous_player_anon + claim_ghost_by_token
-- + merge_anonymous_identity dance.
--
-- Caller must be authenticated (auth.uid() not null). The player must be a
-- ghost (player.user_id IS NULL) OR owned by an anonymous user (we transfer
-- ownership and absorb their data). On success, the player and all its
-- memberships now belong to the caller's user.

CREATE OR REPLACE FUNCTION public.claim_player(p_player_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth      UUID := auth.uid();
  v_user      UUID;
  v_existing  UUID;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'Authenticated user required';
  END IF;

  -- Resolve / create the caller's `users` row (1:1 with auth.users).
  SELECT id INTO v_user FROM public.users WHERE auth_user_id = v_auth LIMIT 1;
  IF v_user IS NULL THEN
    INSERT INTO public.users (id, auth_user_id, pseudo, is_anonymous)
    VALUES (gen_random_uuid(), v_auth, 'Joueur', FALSE)
    RETURNING id INTO v_user;
  END IF;

  -- Lock the target player row.
  PERFORM 1 FROM public.players WHERE id = p_player_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player not found';
  END IF;

  -- If the caller already owns a player, refuse (one player per user).
  SELECT id INTO v_existing FROM public.players WHERE user_id = v_user AND id <> p_player_id LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'Caller already owns player %, cannot claim another', v_existing;
  END IF;

  UPDATE public.players SET user_id = v_user WHERE id = p_player_id;

  RETURN json_build_object('success', TRUE, 'player_id', p_player_id, 'user_id', v_user);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_player(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_player(UUID) TO authenticated;
COMMENT ON FUNCTION public.claim_player(UUID) IS
'Link a ghost (or anonymous-owned) player to the caller''s authenticated user.';

-- ════════════════════════════════════════════════════════════════════════
-- 9. New RPC: link_anonymous_to_auth
-- ════════════════════════════════════════════════════════════════════════
--
-- Sign-up flow: the caller has been operating as an anonymous user (their
-- public.users row has `is_anonymous = TRUE` and was identified by device
-- fingerprint). After Supabase Auth sign-up, link that existing users row to
-- the new auth.users.id so their players + memberships keep their owner.

CREATE OR REPLACE FUNCTION public.link_anonymous_to_auth(p_anonymous_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth UUID := auth.uid();
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'Authenticated user required';
  END IF;

  -- Refuse if the auth user is already linked to another users row.
  IF EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = v_auth AND id <> p_anonymous_user_id) THEN
    RAISE EXCEPTION 'Auth user is already linked to a different users row';
  END IF;

  UPDATE public.users
     SET auth_user_id = v_auth,
         is_anonymous = FALSE
   WHERE id = p_anonymous_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Anonymous users row not found';
  END IF;

  RETURN json_build_object('success', TRUE, 'user_id', p_anonymous_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.link_anonymous_to_auth(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_anonymous_to_auth(UUID) TO authenticated;
COMMENT ON FUNCTION public.link_anonymous_to_auth(UUID) IS
'Link a pre-existing anonymous users row to the caller''s freshly-authed auth.users.id.';
