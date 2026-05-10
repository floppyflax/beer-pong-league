import { useState, useEffect } from 'react';
import { localUserService, type LocalUser } from '../services/LocalUserService';
import { anonymousUserService } from '../services/AnonymousUserService';

export interface IdentityState {
  localUser: LocalUser | null;
  isLoading: boolean;
  isAnonymous: boolean;
}

export function useIdentity() {
  const [state, setState] = useState<IdentityState>({
    localUser: null,
    isLoading: true,
    isAnonymous: true,
  });

  useEffect(() => {
    localUserService.getLocalUser().then((localUser) => {
      setState({ localUser, isLoading: false, isAnonymous: true });

      if (localUser) {
        anonymousUserService
          .syncLocalUserToSupabase(localUser)
          .catch((error) => {
            console.warn('Failed to sync identity to Supabase:', error);
          });
      }
    });
  }, []);

  const createIdentity = async (pseudo: string, deviceFingerprint?: string): Promise<LocalUser> => {
    const localUser = await localUserService.createLocalUser(pseudo, deviceFingerprint);

    anonymousUserService.syncLocalUserToSupabase(localUser).catch((error) => {
      console.warn('Failed to sync to Supabase:', error);
    });

    setState({ localUser, isLoading: false, isAnonymous: true });
    return localUser;
  };

  const updateIdentity = async (updates: Partial<LocalUser>): Promise<void> => {
    const updated = await localUserService.updateLocalUser(updates);
    if (updated) {
      setState((prev) => ({ ...prev, localUser: updated }));
      anonymousUserService.syncLocalUserToSupabase(updated).catch((error) => {
        console.warn('Failed to sync update to Supabase:', error);
      });
    }
  };

  const clearIdentity = async (): Promise<void> => {
    await localUserService.clearLocalUser();
    setState({ localUser: null, isLoading: false, isAnonymous: true });
  };

  const initializeAnonymousUser = async (pseudo = 'Joueur'): Promise<LocalUser> => {
    const current = await localUserService.getLocalUser();
    if (current) return current;
    return createIdentity(pseudo);
  };

  return { ...state, createIdentity, updateIdentity, clearIdentity, initializeAnonymousUser };
}
