/**
 * useIsAnonymous — true when the caller is operating as an anonymous user
 * (a `users` row with `is_anonymous=true`, identified by device fingerprint
 * via `localUser`) and NOT signed into Supabase Auth.
 *
 * Used by route guards / placeholders to gate paid + community features
 * (cf. spec §"Permissions de l'utilisateur anonyme").
 */

import { useAuthContext } from "../context/AuthContext";
import { useIdentity } from "./useIdentity";

export function useIsAnonymous(): boolean {
  const { isAuthenticated } = useAuthContext();
  const { localUser } = useIdentity();
  return !isAuthenticated && Boolean(localUser);
}
