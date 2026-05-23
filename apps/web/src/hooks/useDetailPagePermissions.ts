import { useAuthContext } from "../context/AuthContext";
import { useIdentity } from "./useIdentity";
import { useLeague } from "../context/LeagueContext";

/**
 * Permissions sur la page détail d'un event ou d'une ligue.
 *
 * - `isOwner` : strict — l'utilisateur est le créateur (`creator_user_id`).
 *   Réservé aux actions qui ne sont pas déléguables : suppression de l'entité,
 *   promotion/démotion d'autres admins.
 * - `isAdmin` : superset — le créateur OU un co-admin (mig 037, listé dans
 *   `coAdminUserIds`). Tous les autres actes admin se basent dessus :
 *   modifier les paramètres, gérer les joueurs, valider les scores, éditer
 *   les matchs.
 * - `canInvite` : flag de la ligue/event "allowPlayersToInvite".
 *
 * Le check anonyme (creator_anonymous_user_id) est conservé pour la backward
 * compat des données pré-mig-022. Un user anonyme ne peut pas être co-admin
 * (les co-admins doivent avoir un compte — cf. RPC set_*_membership_role).
 */
export const useDetailPagePermissions = (
  entityId: string,
  entityType: "event" | "league",
) => {
  const { user, isAuthenticated } = useAuthContext();
  const { localUser } = useIdentity();
  const { events, leagues } = useLeague();

  const entity =
    entityType === "event"
      ? events.find((t) => t.id === entityId)
      : leagues.find((l) => l.id === entityId);

  if (!entity) {
    return { isAdmin: false, isOwner: false, canInvite: false };
  }

  const callerUserId = isAuthenticated
    ? user?.id ?? null
    : localUser?.anonymousUserId ?? null;

  const isOwner =
    (isAuthenticated && user?.id === entity.creator_user_id) ||
    (!isAuthenticated &&
      localUser?.anonymousUserId === entity.creator_anonymous_user_id);

  // Mig 037 — co-admins. Seuls les users authentifiés peuvent l'être (les
  // ghosts/anon ne peuvent pas être promus côté serveur).
  const isCoAdmin =
    isAuthenticated &&
    !!callerUserId &&
    Array.isArray(entity.coAdminUserIds) &&
    entity.coAdminUserIds.includes(callerUserId);

  const isAdmin = isOwner || isCoAdmin;

  const canInvite =
    ("allowPlayersToInvite" in entity && entity.allowPlayersToInvite) || false;

  return { isAdmin, isOwner, canInvite };
};
