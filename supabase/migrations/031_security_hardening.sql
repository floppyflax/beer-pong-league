-- Migration 031 — Security hardening (RLS + anti-cheat triggers)
--
-- Audit de sécurité de mai 2026 a identifié plusieurs trous critiques :
--
-- 1. `users.is_premium` est modifiable directement par l'utilisateur authentifié
--    via PostgREST (`UPDATE users SET is_premium = true WHERE id = me`). La policy
--    UPDATE existante (mig 001) autorise toutes les colonnes. → bypass paiement
--    Stripe trivial.
--
-- 2. `league_memberships` / `event_memberships` ont une policy `FOR ALL USING (TRUE)`
--    (mig 022 `lm_all` / `em_all`). Donc un client peut écraser directement
--    `elo`, `wins`, `losses`, `streak`, `matches_played` après que le serveur
--    les ait calculés. → bypass total de l'anti-cheat ELO server-side (mig 025).
--
-- 3. `elo_history` accepte `INSERT WITH CHECK (true)` (mig 001). Un client peut
--    écrire des entrées d'historique ELO falsifiées. La RPC `apply_match_elo`
--    est la seule voie légitime.
--
-- 4. `link_anonymous_to_auth(p_anonymous_user_id)` (mig 022) ne vérifie pas que
--    `p_anonymous_user_id` est réellement un user anonyme orphelin. Un attaquant
--    authentifié peut donc voler une identité existante (`UPDATE users SET
--    auth_user_id = <attaquant> WHERE id = <victime>`). La fonction n'est
--    protégée que par un check secondaire qui rejette si auth.uid() est déjà
--    lié à un AUTRE id, ce qui n'aide pas si la victime n'a pas d'auth_user_id.
--
-- 5. `claim_player(p_player_id)` (mig 022) ne vérifie pas que le player ciblé
--    est un ghost ou un anonyme. Un attaquant authentifié peut donc claim un
--    player appartenant déjà à un autre utilisateur authentifié → vol de stats.
--
-- Stratégie de fix : on ne touche PAS aux policies SELECT/INSERT/DELETE
-- permissives qui supportent le mode "offline-first" pour les invités. À la
-- place, on installe des triggers BEFORE UPDATE/INSERT qui rejettent
-- spécifiquement les colonnes sensibles quand le caller est `authenticated`
-- ou `anon` (via PostgREST). Les RPCs SECURITY DEFINER s'exécutent avec
-- `current_user` = owner de la fonction (postgres / supabase_admin) et passent
-- donc librement à travers les triggers — c'est leur rôle d'autoriser.
--
-- `service_role` (utilisé par les edge functions) bypass RLS par construction,
-- et `current_user` = 'service_role' qui n'est pas dans la liste filtrée → il
-- traverse les triggers aussi. C'est la voie légitime pour qu'une edge function
-- de paiement marque `is_premium = TRUE` après une session Stripe vérifiée.

BEGIN;

-- ════════════════════════════════════════════════════════════════════════
-- 1. Helper : check si le caller est un rôle PostgREST exposé
-- ════════════════════════════════════════════════════════════════════════
-- Quand un client appelle une table via PostgREST, le rôle est `authenticated`
-- ou `anon`. Toute SECURITY DEFINER s'exécute en tant que owner (postgres).
-- service_role est utilisé par les edge functions et bypass RLS.

CREATE OR REPLACE FUNCTION public._is_postgrest_client()
RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$
  SELECT current_user IN ('authenticated', 'anon');
$$;

COMMENT ON FUNCTION public._is_postgrest_client() IS
  'TRUE si le caller est un rôle exposé par PostgREST (appel direct depuis le client). Utilisé par les triggers de sécurité.';

-- ════════════════════════════════════════════════════════════════════════
-- 2. Trigger anti-bypass paiement : verrou sur users.is_premium
-- ════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public._guard_users_premium()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public._is_postgrest_client() THEN
    IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
      RAISE EXCEPTION 'users.is_premium can only be updated by the payment backend, not by clients'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_premium_guard ON public.users;
CREATE TRIGGER trg_users_premium_guard
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public._guard_users_premium();

COMMENT ON TRIGGER trg_users_premium_guard ON public.users IS
  'Rejette toute modification de is_premium depuis le client (authenticated/anon). Seuls service_role et les SECURITY DEFINER passent.';

-- Idem au moment du INSERT : un client ne doit pas pouvoir créer une ligne
-- avec is_premium = TRUE d'emblée.
CREATE OR REPLACE FUNCTION public._guard_users_premium_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public._is_postgrest_client() AND NEW.is_premium IS TRUE THEN
    RAISE EXCEPTION 'users.is_premium = TRUE cannot be set by clients'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_premium_guard_insert ON public.users;
CREATE TRIGGER trg_users_premium_guard_insert
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public._guard_users_premium_insert();

-- ════════════════════════════════════════════════════════════════════════
-- 3. Triggers anti-cheat ELO sur les memberships
-- ════════════════════════════════════════════════════════════════════════
-- Les colonnes ELO/stats sont owned par `apply_match_elo` (SECURITY DEFINER,
-- mig 025) et `start_new_league_season` (SECURITY DEFINER, mig 028). Aucun
-- client ne doit pouvoir les écrire directement.

CREATE OR REPLACE FUNCTION public._guard_league_membership_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public._is_postgrest_client() THEN
    IF NEW.elo            IS DISTINCT FROM OLD.elo
       OR NEW.wins           IS DISTINCT FROM OLD.wins
       OR NEW.losses         IS DISTINCT FROM OLD.losses
       OR NEW.matches_played IS DISTINCT FROM OLD.matches_played
       OR NEW.streak         IS DISTINCT FROM OLD.streak
    THEN
      RAISE EXCEPTION 'league_memberships ELO/stats can only be updated by apply_match_elo / start_new_league_season'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lm_stats_guard ON public.league_memberships;
CREATE TRIGGER trg_lm_stats_guard
  BEFORE UPDATE ON public.league_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public._guard_league_membership_stats();

-- Idem INSERT — un client ne peut pas joindre une league avec un ELO custom.
CREATE OR REPLACE FUNCTION public._guard_league_membership_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public._is_postgrest_client() THEN
    -- Force les valeurs initiales aux defaults — un client peut joindre,
    -- mais pas se donner un ELO de départ ni des stats truquées.
    NEW.elo            := 1000;
    NEW.wins           := 0;
    NEW.losses         := 0;
    NEW.matches_played := 0;
    NEW.streak         := 0;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lm_stats_guard_insert ON public.league_memberships;
CREATE TRIGGER trg_lm_stats_guard_insert
  BEFORE INSERT ON public.league_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public._guard_league_membership_insert();

-- event_memberships : mêmes colonnes (mig 023 a propagé l'ELO sur event_memberships).
CREATE OR REPLACE FUNCTION public._guard_event_membership_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public._is_postgrest_client() THEN
    IF NEW.elo            IS DISTINCT FROM OLD.elo
       OR NEW.wins           IS DISTINCT FROM OLD.wins
       OR NEW.losses         IS DISTINCT FROM OLD.losses
       OR NEW.matches_played IS DISTINCT FROM OLD.matches_played
       OR NEW.streak         IS DISTINCT FROM OLD.streak
    THEN
      RAISE EXCEPTION 'event_memberships ELO/stats can only be updated by apply_match_elo'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_em_stats_guard ON public.event_memberships;
CREATE TRIGGER trg_em_stats_guard
  BEFORE UPDATE ON public.event_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public._guard_event_membership_stats();

CREATE OR REPLACE FUNCTION public._guard_event_membership_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public._is_postgrest_client() THEN
    NEW.elo            := 1000;
    NEW.wins           := 0;
    NEW.losses         := 0;
    NEW.matches_played := 0;
    NEW.streak         := 0;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_em_stats_guard_insert ON public.event_memberships;
CREATE TRIGGER trg_em_stats_guard_insert
  BEFORE INSERT ON public.event_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public._guard_event_membership_insert();

-- ════════════════════════════════════════════════════════════════════════
-- 4. Bloquer les écritures directes sur elo_history depuis le client
-- ════════════════════════════════════════════════════════════════════════
-- elo_history est purement dérivée des matches via apply_match_elo. Aucune
-- raison qu'un client écrive directement dedans.

CREATE OR REPLACE FUNCTION public._guard_elo_history_writes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public._is_postgrest_client() THEN
    RAISE EXCEPTION 'elo_history is read-only for clients (writes go through apply_match_elo)'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_elo_history_guard_insert ON public.elo_history;
CREATE TRIGGER trg_elo_history_guard_insert
  BEFORE INSERT ON public.elo_history
  FOR EACH ROW EXECUTE FUNCTION public._guard_elo_history_writes();

DROP TRIGGER IF EXISTS trg_elo_history_guard_update ON public.elo_history;
CREATE TRIGGER trg_elo_history_guard_update
  BEFORE UPDATE ON public.elo_history
  FOR EACH ROW EXECUTE FUNCTION public._guard_elo_history_writes();

DROP TRIGGER IF EXISTS trg_elo_history_guard_delete ON public.elo_history;
CREATE TRIGGER trg_elo_history_guard_delete
  BEFORE DELETE ON public.elo_history
  FOR EACH ROW EXECUTE FUNCTION public._guard_elo_history_writes();

-- ════════════════════════════════════════════════════════════════════════
-- 5. Trigger anti-vol d'identité sur players.user_id
-- ════════════════════════════════════════════════════════════════════════
-- Un client peut UPDATE un player (policy `players_update USING (TRUE)`).
-- On autorise les claims de ghosts (OLD.user_id IS NULL → NEW.user_id quelque
-- chose) — c'est le pattern legacy de IdentityMergeService et le SECURITY
-- DEFINER claim_player passe par cette voie aussi. Mais on bloque le vol :
-- toute réassignation d'un player DÉJÀ claim (OLD.user_id IS NOT NULL) doit
-- passer par la RPC `claim_player` (qui fait son propre check anti-vol).

CREATE OR REPLACE FUNCTION public._guard_players_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public._is_postgrest_client() THEN
    -- Reset to NULL (unclaim) blocked from clients — must go through the RPC.
    IF NEW.user_id IS NULL AND OLD.user_id IS NOT NULL THEN
      RAISE EXCEPTION 'players.user_id cannot be cleared from a client'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    -- Reassignment of an already-claimed player blocked — refuse identity theft.
    IF OLD.user_id IS NOT NULL
       AND NEW.user_id IS NOT NULL
       AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'players.user_id reassignment must go through claim_player() RPC'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_players_user_id_guard ON public.players;
CREATE TRIGGER trg_players_user_id_guard
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public._guard_players_user_id();

-- ════════════════════════════════════════════════════════════════════════
-- 6. Trigger anti-vol d'identité sur users.auth_user_id
-- ════════════════════════════════════════════════════════════════════════
-- Même logique : auth_user_id doit être set uniquement par link_anonymous_to_auth
-- (durci section 7) et jamais depuis le client direct.

CREATE OR REPLACE FUNCTION public._guard_users_auth_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public._is_postgrest_client() THEN
    IF NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id THEN
      RAISE EXCEPTION 'users.auth_user_id can only be changed via link_anonymous_to_auth() RPC'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.is_anonymous IS DISTINCT FROM OLD.is_anonymous THEN
      RAISE EXCEPTION 'users.is_anonymous can only be changed via link_anonymous_to_auth() RPC'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_auth_id_guard ON public.users;
CREATE TRIGGER trg_users_auth_id_guard
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public._guard_users_auth_user_id();

-- ════════════════════════════════════════════════════════════════════════
-- 7. Durcissement des RPCs identitaires (mig 022)
-- ════════════════════════════════════════════════════════════════════════

-- claim_player : ne peut claim qu'un ghost (user_id IS NULL) ou un user anon
-- non lié. Refuse si le player est déjà claim par un user authentifié.
CREATE OR REPLACE FUNCTION public.claim_player(p_player_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth        UUID := auth.uid();
  v_user        UUID;
  v_existing    UUID;
  v_target_user UUID;
  v_target_auth UUID;
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

  -- Read the target's current ownership state.
  SELECT user_id INTO v_target_user FROM public.players WHERE id = p_player_id;

  -- Already owned by the caller — idempotent success.
  IF v_target_user = v_user THEN
    RETURN json_build_object('success', TRUE, 'player_id', p_player_id, 'user_id', v_user, 'already_owned', TRUE);
  END IF;

  -- If the player is owned by a different *authenticated* user, refuse.
  -- A "ghost" (user_id IS NULL) or an "anonymous-owned" player (user_id
  -- points to a users row with is_anonymous = TRUE and auth_user_id NULL)
  -- is claimable.
  IF v_target_user IS NOT NULL THEN
    SELECT auth_user_id INTO v_target_auth FROM public.users WHERE id = v_target_user;
    IF v_target_auth IS NOT NULL AND v_target_auth <> v_auth THEN
      RAISE EXCEPTION 'Player is already claimed by another authenticated user'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  -- One player per user (preserved from original).
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
  'Link a ghost or anonymous-owned player to the caller''s authenticated user. Refuses if the player is already claimed by a different authenticated user (mig 031).';

-- link_anonymous_to_auth : ne peut linker QU'une users row déjà anonyme
-- (is_anonymous = TRUE) et SANS auth_user_id. Empêche le vol d'identité
-- d'un user authentifié existant.
CREATE OR REPLACE FUNCTION public.link_anonymous_to_auth(p_anonymous_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth         UUID := auth.uid();
  v_existing_auth UUID;
  v_is_anon       BOOLEAN;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'Authenticated user required';
  END IF;

  -- Refuse if the auth user is already linked to another users row.
  IF EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = v_auth AND id <> p_anonymous_user_id) THEN
    RAISE EXCEPTION 'Auth user is already linked to a different users row'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Lock the target row.
  PERFORM 1 FROM public.users WHERE id = p_anonymous_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Anonymous users row not found';
  END IF;

  SELECT is_anonymous, auth_user_id
    INTO v_is_anon, v_existing_auth
    FROM public.users
   WHERE id = p_anonymous_user_id;

  -- The target MUST be anonymous (no auth link) — refuse otherwise to
  -- prevent identity theft of an existing authenticated user.
  IF v_existing_auth IS NOT NULL AND v_existing_auth <> v_auth THEN
    RAISE EXCEPTION 'Target users row is already linked to a different auth user'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF v_is_anon IS NOT TRUE AND v_existing_auth IS NULL THEN
    -- Edge case: the row exists but isn't marked anonymous and has no auth.
    -- Allow it (legacy data), but warn via the return payload.
    NULL;
  END IF;

  UPDATE public.users
     SET auth_user_id = v_auth,
         is_anonymous = FALSE
   WHERE id = p_anonymous_user_id;

  RETURN json_build_object('success', TRUE, 'user_id', p_anonymous_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.link_anonymous_to_auth(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_anonymous_to_auth(UUID) TO authenticated;

COMMENT ON FUNCTION public.link_anonymous_to_auth(UUID) IS
  'Link a pre-existing anonymous users row to the caller''s freshly-authed auth.users.id. Refuses if the target is already linked to another auth user (mig 031).';

-- ════════════════════════════════════════════════════════════════════════
-- 8. RPC : mark_user_premium — voie légitime pour l'edge function
-- ════════════════════════════════════════════════════════════════════════
-- Appelée par l'edge function `verify-payment-session` après avoir confirmé
-- auprès de Stripe que la session est payée. Comme la fonction est SECURITY
-- DEFINER, elle traverse le trigger `trg_users_premium_guard`.
--
-- Note : l'edge function utilise déjà service_role qui bypass RLS de toute
-- façon, mais cette RPC offre une voie unique et auditée pour activer le
-- premium, et permet de signaler les écritures via les logs Postgres.

CREATE OR REPLACE FUNCTION public.mark_user_premium(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_already BOOLEAN;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  PERFORM 1 FROM public.users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id
      USING ERRCODE = 'no_data_found';
  END IF;

  SELECT is_premium INTO v_already FROM public.users WHERE id = p_user_id;
  IF v_already IS TRUE THEN
    RETURN json_build_object('success', TRUE, 'user_id', p_user_id, 'already_premium', TRUE);
  END IF;

  UPDATE public.users
     SET is_premium = TRUE
   WHERE id = p_user_id;

  RETURN json_build_object('success', TRUE, 'user_id', p_user_id, 'already_premium', FALSE);
END;
$$;

REVOKE ALL ON FUNCTION public.mark_user_premium(UUID) FROM PUBLIC;
-- Ne pas exposer aux clients : seulement service_role (via les edge functions).
GRANT EXECUTE ON FUNCTION public.mark_user_premium(UUID) TO service_role;

COMMENT ON FUNCTION public.mark_user_premium(UUID) IS
  'Active le premium d''un utilisateur. Réservée à service_role (appelée par l''edge function verify-payment-session après vérification Stripe).';

-- ════════════════════════════════════════════════════════════════════════
-- 9. Anti cross-tampering : un user authentifié ne peut éditer/supprimer
--    que les ressources qu'il a créées
-- ════════════════════════════════════════════════════════════════════════
-- Les policies UPDATE/DELETE actuelles sur events/leagues/matches sont
-- `USING (TRUE)` (ou équivalent) pour préserver le mode "offline-first" où
-- un anonyme peut éditer ses propres ressources sans avoir à s'authentifier.
--
-- Mais ce design laisse aussi un user AUTHENTIFIÉ éditer/supprimer n'importe
-- quel event/league/match créé par un autre (authentifié OU anonyme), ce
-- qui est exploitable en console Chrome.
--
-- Compromis pragmatique : on installe un trigger qui rejette les UPDATE et
-- DELETE depuis un caller authentifié (`auth.uid() IS NOT NULL`) sur une
-- ressource dont le creator n'est pas lui. Les anonymes (auth.uid() IS NULL)
-- gardent le comportement permissif existant — c'est le prix de l'offline
-- first, et c'est limité à l'horizon d'un device.

CREATE OR REPLACE FUNCTION public._authed_caller_owns_users_row(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_auth UUID := auth.uid();
BEGIN
  -- No auth context (anonymous client) → skip the check upstream.
  IF v_auth IS NULL THEN
    RETURN TRUE;
  END IF;
  -- Caller is authenticated. The target users row must be linked to them.
  IF p_user_id IS NULL THEN
    -- Resource has no recorded creator → nothing to verify.
    RETURN TRUE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = p_user_id AND u.auth_user_id = v_auth
  );
END;
$$;

COMMENT ON FUNCTION public._authed_caller_owns_users_row(UUID) IS
  'TRUE if the caller is anonymous OR if the caller is authenticated and the target users row is theirs. Used by anti-cross-tampering triggers.';

-- ── events ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._guard_events_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public._is_postgrest_client() THEN
    IF NOT public._authed_caller_owns_users_row(OLD.creator_user_id) THEN
      RAISE EXCEPTION 'events: only the creator can modify or delete (auth context)'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS trg_events_admin_update ON public.events;
CREATE TRIGGER trg_events_admin_update
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public._guard_events_admin();

DROP TRIGGER IF EXISTS trg_events_admin_delete ON public.events;
CREATE TRIGGER trg_events_admin_delete
  BEFORE DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public._guard_events_admin();

-- ── leagues ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._guard_leagues_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public._is_postgrest_client() THEN
    IF NOT public._authed_caller_owns_users_row(OLD.creator_user_id) THEN
      RAISE EXCEPTION 'leagues: only the creator can modify or delete (auth context)'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS trg_leagues_admin_update ON public.leagues;
CREATE TRIGGER trg_leagues_admin_update
  BEFORE UPDATE ON public.leagues
  FOR EACH ROW EXECUTE FUNCTION public._guard_leagues_admin();

DROP TRIGGER IF EXISTS trg_leagues_admin_delete ON public.leagues;
CREATE TRIGGER trg_leagues_admin_delete
  BEFORE DELETE ON public.leagues
  FOR EACH ROW EXECUTE FUNCTION public._guard_leagues_admin();

-- ── matches ────────────────────────────────────────────────────────────
-- Same logic, with `created_by_user_id` as the owner column.
CREATE OR REPLACE FUNCTION public._guard_matches_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public._is_postgrest_client() THEN
    IF NOT public._authed_caller_owns_users_row(OLD.created_by_user_id) THEN
      RAISE EXCEPTION 'matches: only the recorder can modify or delete (auth context)'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS trg_matches_admin_update ON public.matches;
CREATE TRIGGER trg_matches_admin_update
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public._guard_matches_admin();

DROP TRIGGER IF EXISTS trg_matches_admin_delete ON public.matches;
CREATE TRIGGER trg_matches_admin_delete
  BEFORE DELETE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public._guard_matches_admin();

-- Note: matches INSERT reste permissive — c'est la voie offline-first
-- d'enregistrer un match en local. L'anti-cheat ELO côté serveur (mig 025)
-- + les triggers _guard_elo_history_writes (section 4) garantissent qu'aucun
-- ELO frauduleux n'est appliqué depuis ces écritures.

-- ════════════════════════════════════════════════════════════════════════
-- 10. Création events/leagues réservée aux users authentifiés
-- ════════════════════════════════════════════════════════════════════════
-- Décision produit : un anonyme peut REJOINDRE une league/event via QR code
-- mais ne peut pas en CRÉER. Empêche le spam (un anonyme peut générer une
-- infinité d'anon identities et créer une infinité de leagues) et garantit
-- qu'il y a un propriétaire identifiable derrière chaque ressource.

CREATE OR REPLACE FUNCTION public._guard_authed_creator_only(p_creator_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_auth UUID := auth.uid();
BEGIN
  -- Pas d'auth → reject (l'anonyme ne crée pas).
  IF v_auth IS NULL THEN RETURN FALSE; END IF;
  -- Creator non fourni → reject (un creator est obligatoire).
  IF p_creator_id IS NULL THEN RETURN FALSE; END IF;
  -- Le creator doit être la `users` row de l'auth caller (pas de spoofing).
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_creator_id AND auth_user_id = v_auth
  );
END;
$$;

COMMENT ON FUNCTION public._guard_authed_creator_only(UUID) IS
  'TRUE si le caller est authentifié ET creator_user_id pointe vers SA users row. Utilisé par les triggers INSERT events/leagues.';

CREATE OR REPLACE FUNCTION public._guard_events_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public._is_postgrest_client() THEN
    IF NOT public._guard_authed_creator_only(NEW.creator_user_id) THEN
      RAISE EXCEPTION 'events: only authenticated users with a matching creator_user_id can create events'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_events_insert_auth ON public.events;
CREATE TRIGGER trg_events_insert_auth
  BEFORE INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public._guard_events_insert();

CREATE OR REPLACE FUNCTION public._guard_leagues_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public._is_postgrest_client() THEN
    IF NOT public._guard_authed_creator_only(NEW.creator_user_id) THEN
      RAISE EXCEPTION 'leagues: only authenticated users with a matching creator_user_id can create leagues'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leagues_insert_auth ON public.leagues;
CREATE TRIGGER trg_leagues_insert_auth
  BEFORE INSERT ON public.leagues
  FOR EACH ROW EXECUTE FUNCTION public._guard_leagues_insert();

-- ════════════════════════════════════════════════════════════════════════
-- 11. Memberships : admin pour les ghosts, self pour les owned
-- ════════════════════════════════════════════════════════════════════════
-- Décision : ajouter un ghost-membership (player.user_id IS NULL) est une
-- action d'admin (creator de la league/event). Les owned-players (auth ou
-- anon) ne peuvent INSERT/DELETE leur propre membership que pour eux-mêmes.
--
-- Préserve le flow QR code anonyme : le client crée son anon user + son
-- player (user_id = son anon id) AVANT d'insérer la membership. Le trigger
-- voit player.user_id ≠ NULL et c'est un user `is_anonymous=TRUE` → autorise.
--
-- Ce qu'il bloque :
--   * spam de ghost-memberships par non-admin (pollution leaderboard)
--   * vandalisme par delete d'un membership qui n'est pas le sien

CREATE OR REPLACE FUNCTION public._caller_is_league_admin(p_league_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_auth    UUID := auth.uid();
  v_creator UUID;
BEGIN
  IF v_auth IS NULL THEN RETURN FALSE; END IF;
  SELECT creator_user_id INTO v_creator FROM public.leagues WHERE id = p_league_id;
  IF v_creator IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = v_creator AND auth_user_id = v_auth
  );
END;
$$;

CREATE OR REPLACE FUNCTION public._caller_is_event_admin(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_auth    UUID := auth.uid();
  v_creator UUID;
BEGIN
  IF v_auth IS NULL THEN RETURN FALSE; END IF;
  SELECT creator_user_id INTO v_creator FROM public.events WHERE id = p_event_id;
  IF v_creator IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = v_creator AND auth_user_id = v_auth
  );
END;
$$;

CREATE OR REPLACE FUNCTION public._player_is_owned_by_caller(p_player_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_auth    UUID := auth.uid();
  v_owner   UUID;
BEGIN
  IF v_auth IS NULL THEN RETURN FALSE; END IF;
  SELECT user_id INTO v_owner FROM public.players WHERE id = p_player_id;
  IF v_owner IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = v_owner AND auth_user_id = v_auth
  );
END;
$$;

CREATE OR REPLACE FUNCTION public._player_owner_is_authenticated(p_player_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_owner UUID;
BEGIN
  SELECT user_id INTO v_owner FROM public.players WHERE id = p_player_id;
  IF v_owner IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = v_owner AND auth_user_id IS NOT NULL
  );
END;
$$;

-- ── league_memberships INSERT/DELETE ───────────────────────────────────
CREATE OR REPLACE FUNCTION public._guard_league_membership_access()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_target_league UUID;
  v_target_player UUID;
  v_owner_is_auth BOOLEAN;
BEGIN
  IF NOT public._is_postgrest_client() THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_target_league := NEW.league_id;
    v_target_player := NEW.player_id;
  ELSE
    v_target_league := OLD.league_id;
    v_target_player := OLD.player_id;
  END IF;

  -- Admin du contexte peut tout faire.
  IF public._caller_is_league_admin(v_target_league) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_owner_is_auth := public._player_owner_is_authenticated(v_target_player);

  IF auth.uid() IS NOT NULL THEN
    -- Caller authentifié : il doit être le owner du player concerné.
    IF NOT public._player_is_owned_by_caller(v_target_player) THEN
      RAISE EXCEPTION 'league_memberships: authenticated user can only manage their own membership'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSE
    -- Caller anonyme : le player concerné ne doit pas appartenir à un user
    -- authentifié (pas de vandalisme contre un compte). Il peut s'agir d'un
    -- ghost (user_id IS NULL) ou d'un player anon.
    -- ⚠️ Ghost = NULL owner : seul l'admin (déjà géré au-dessus) peut le
    -- gérer. Donc on rejette ici.
    IF v_owner_is_auth THEN
      RAISE EXCEPTION 'league_memberships: cannot touch a membership for an authenticated player'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    -- Ghost-INSERT depuis un anon = bloqué (admin only via la branche ci-dessus).
    IF TG_OP = 'INSERT'
       AND (SELECT user_id FROM public.players WHERE id = v_target_player) IS NULL THEN
      RAISE EXCEPTION 'league_memberships: only the league admin can add a ghost player'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_lm_access_insert ON public.league_memberships;
CREATE TRIGGER trg_lm_access_insert
  BEFORE INSERT ON public.league_memberships
  FOR EACH ROW EXECUTE FUNCTION public._guard_league_membership_access();

DROP TRIGGER IF EXISTS trg_lm_access_delete ON public.league_memberships;
CREATE TRIGGER trg_lm_access_delete
  BEFORE DELETE ON public.league_memberships
  FOR EACH ROW EXECUTE FUNCTION public._guard_league_membership_access();

-- ── event_memberships INSERT/DELETE ────────────────────────────────────
CREATE OR REPLACE FUNCTION public._guard_event_membership_access()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_target_event  UUID;
  v_target_player UUID;
  v_owner_is_auth BOOLEAN;
BEGIN
  IF NOT public._is_postgrest_client() THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_target_event  := NEW.event_id;
    v_target_player := NEW.player_id;
  ELSE
    v_target_event  := OLD.event_id;
    v_target_player := OLD.player_id;
  END IF;

  IF public._caller_is_event_admin(v_target_event) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_owner_is_auth := public._player_owner_is_authenticated(v_target_player);

  IF auth.uid() IS NOT NULL THEN
    IF NOT public._player_is_owned_by_caller(v_target_player) THEN
      RAISE EXCEPTION 'event_memberships: authenticated user can only manage their own membership'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSE
    IF v_owner_is_auth THEN
      RAISE EXCEPTION 'event_memberships: cannot touch a membership for an authenticated player'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF TG_OP = 'INSERT'
       AND (SELECT user_id FROM public.players WHERE id = v_target_player) IS NULL THEN
      RAISE EXCEPTION 'event_memberships: only the event admin can add a ghost player'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_em_access_insert ON public.event_memberships;
CREATE TRIGGER trg_em_access_insert
  BEFORE INSERT ON public.event_memberships
  FOR EACH ROW EXECUTE FUNCTION public._guard_event_membership_access();

DROP TRIGGER IF EXISTS trg_em_access_delete ON public.event_memberships;
CREATE TRIGGER trg_em_access_delete
  BEFORE DELETE ON public.event_memberships
  FOR EACH ROW EXECUTE FUNCTION public._guard_event_membership_access();

COMMIT;
