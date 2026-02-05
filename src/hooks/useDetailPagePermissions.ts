import { useAuthContext } from '../context/AuthContext';
import { useIdentity } from './useIdentity';
import { useLeague } from '../context/LeagueContext';

export const useDetailPagePermissions = (
  entityId: string,
  entityType: 'tournament' | 'league'
) => {
  const { user, isAuthenticated } = useAuthContext();
  const { localUser } = useIdentity();
  const { tournaments, leagues } = useLeague();
  
  const entity = entityType === 'tournament'
    ? tournaments.find(t => t.id === entityId)
    : leagues.find(l => l.id === entityId);
  
  if (!entity) {
    return { isAdmin: false, canInvite: false };
  }
  
  const isAdmin = (
    (isAuthenticated && user?.id === entity.creator_user_id) ||
    (!isAuthenticated && localUser?.anonymousUserId === entity.creator_anonymous_user_id)
  );
  
  const canInvite = entity.allowPlayersToInvite || false;
  
  return { isAdmin, canInvite };
};
