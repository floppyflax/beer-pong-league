import { useState, useEffect } from 'react';
import { localUserService, type LocalUser } from '../services/LocalUserService';
import { anonymousUserService } from '../services/AnonymousUserService';
import { getDeviceFingerprint } from '../utils/deviceFingerprint';

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
    // Load local user on mount
    const localUser = localUserService.getLocalUser();
    setState({
      localUser,
      isLoading: false,
      isAnonymous: true, // For now, always anonymous (will change when we add auth)
    });

    // Try to sync to Supabase if user exists
    if (localUser) {
      anonymousUserService
        .syncLocalUserToSupabase(localUser)
        .catch((error) => {
          console.warn('Failed to sync identity to Supabase:', error);
        });
    }
  }, []);

  const createIdentity = async (pseudo: string): Promise<LocalUser> => {
    const deviceFingerprint = getDeviceFingerprint();
    const localUser = localUserService.createLocalUser(pseudo, deviceFingerprint);

    // Try to sync to Supabase (non-blocking)
    anonymousUserService.syncLocalUserToSupabase(localUser).catch((error) => {
      console.warn('Failed to sync to Supabase:', error);
    });

    setState({
      localUser,
      isLoading: false,
      isAnonymous: true,
    });

    return localUser;
  };

  const updateIdentity = (updates: Partial<LocalUser>): void => {
    const updated = localUserService.updateLocalUser(updates);
    if (updated) {
      setState((prev) => ({
        ...prev,
        localUser: updated,
      }));

      // Sync to Supabase
      anonymousUserService.syncLocalUserToSupabase(updated).catch((error) => {
        console.warn('Failed to sync update to Supabase:', error);
      });
    }
  };

  const clearIdentity = (): void => {
    localUserService.clearLocalUser();
    setState({
      localUser: null,
      isLoading: false,
      isAnonymous: true,
    });
  };

  return {
    ...state,
    createIdentity,
    updateIdentity,
    clearIdentity,
  };
}



