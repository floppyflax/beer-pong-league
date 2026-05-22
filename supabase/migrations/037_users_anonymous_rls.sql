-- Migration 037 — Restore anonymous-user RLS on public.users
--
-- Bug (prod): "insert or update on table players violates foreign key
-- constraint players_user_id_fkey" dès qu'un joueur ANONYME réclame ou crée
-- un player (players.user_id → public.users.id).
--
-- Cause: la mig 022 a fusionné `anonymous_users` dans `public.users` mais a
-- conservé UNIQUEMENT les policies héritées de la mig 001 :
--     INSERT/SELECT/UPDATE  WITH CHECK/USING (auth.uid() = id)
-- Pour un client anonyme (rôle `anon`, auth.uid() IS NULL), `auth.uid() = id`
-- est toujours faux → impossible d'INSÉRER sa ligne `users`. La permissivité
-- "Anyone can create anonymous users" de l'ancienne table `anonymous_users`
-- a donc été perdue, et la ligne référencée par players.user_id n'existe
-- jamais → violation de FK.
--
-- Fix: policies qui laissent les rôles PostgREST gérer les lignes ANONYMES
-- (is_anonymous = TRUE, auth_user_id IS NULL) — comme l'ancien modèle — tout
-- en gardant aux utilisateurs authentifiés l'accès à LEUR ligne. Les triggers
-- de la mig 031 (_guard_users_premium*, _guard_users_auth_user_id) continuent
-- de bloquer toute altération de is_premium / auth_user_id / is_anonymous
-- depuis le client ; les transitions sensibles passent par les RPC SECURITY
-- DEFINER (claim_player, link_anonymous_to_auth). Donc une ligne anonyme reste
-- mutable uniquement sur pseudo / avatar_url / device_fingerprint.
--
-- Note sécurité: les lignes anonymes deviennent lisibles par n'importe quel
-- client (parité avec l'ancien `anonymous_users` "Anyone can read"). is_premium
-- n'est jamais TRUE sur une ligne anonyme, et les lignes authentifiées ne sont
-- lisibles que par leur propriétaire — aucune fuite de premium/email.

BEGIN;

DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS users_select ON public.users;
DROP POLICY IF EXISTS users_insert ON public.users;
DROP POLICY IF EXISTS users_update ON public.users;

-- SELECT — sa propre ligne authentifiée, OU n'importe quelle ligne anonyme
-- (nécessaire pour amorcer / retrouver une identité anonyme par fingerprint).
CREATE POLICY users_select ON public.users
  FOR SELECT
  USING (
    is_anonymous = TRUE
    OR auth_user_id = auth.uid()
    OR id = auth.uid()
  );

-- INSERT — une ligne anonyme (sans lien auth), OU sa propre ligne authentifiée.
-- (is_premium = TRUE à l'insert reste bloqué par trg_users_premium_guard_insert.)
CREATE POLICY users_insert ON public.users
  FOR INSERT
  WITH CHECK (
    (is_anonymous = TRUE AND auth_user_id IS NULL)
    OR auth_user_id = auth.uid()
    OR id = auth.uid()
  );

-- UPDATE — une ligne anonyme, OU sa propre ligne authentifiée. Les triggers de
-- la mig 031 rejettent toute modif de is_premium / auth_user_id / is_anonymous
-- depuis le client : seuls pseudo / avatar_url / device_fingerprint sont mutables.
CREATE POLICY users_update ON public.users
  FOR UPDATE
  USING (
    is_anonymous = TRUE
    OR auth_user_id = auth.uid()
    OR id = auth.uid()
  )
  WITH CHECK (
    is_anonymous = TRUE
    OR auth_user_id = auth.uid()
    OR id = auth.uid()
  );

COMMIT;
