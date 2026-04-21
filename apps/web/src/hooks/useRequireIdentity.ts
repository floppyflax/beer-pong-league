import { useState, useCallback } from 'react';
import { useIdentityContext } from '../context/IdentityContext';
import { useAuthContext } from '../context/AuthContext';
import type { LocalUser } from '../services/LocalUserService';
import type { User } from '@supabase/supabase-js';

export interface Identity {
  type: 'authenticated' | 'anonymous';
  user: User | LocalUser;
}

export interface UseRequireIdentityResult {
  /**
   * Ensures user has an identity before proceeding.
   * Returns identity if exists, or shows modal to create one.
   * Returns null if user cancels modal.
   */
  ensureIdentity: () => Promise<Identity | null>;
  
  /**
   * Shows/hides the identity creation modal
   */
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  
  /**
   * Loading state while checking/creating identity
   */
  isLoading: boolean;
  
  /**
   * Handler for when identity is created via modal
   */
  handleIdentityCreated: (user: LocalUser) => void;
  
  /**
   * Handler for when user cancels modal
   */
  handleCancel: () => void;
}

/**
 * Hook to ensure user has an identity before performing actions.
 * Implements "just-in-time" identity creation pattern.
 * 
 * Usage:
 * ```typescript
 * const { ensureIdentity } = useRequireIdentity();
 * 
 * const handleJoinTournament = async () => {
 *   const identity = await ensureIdentity();
 *   if (!identity) return; // User cancelled
 *   // Proceed with tournament join
 * };
 * ```
 */
export function useRequireIdentity(): UseRequireIdentityResult {
  const { localUser } = useIdentityContext();
  const { user, isAuthenticated } = useAuthContext();
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resolver, setResolver] = useState<((value: Identity | null) => void) | null>(null);

  const ensureIdentity = useCallback(async (): Promise<Identity | null> => {
    setIsLoading(true);

    try {
      // Priority 1: Authenticated user (Supabase)
      if (isAuthenticated && user) {
        return {
          type: 'authenticated',
          user,
        };
      }

      // Priority 2: Anonymous user (localStorage)
      if (localUser) {
        return {
          type: 'anonymous',
          user: localUser,
        };
      }

      // Priority 3: No identity - show modal and wait for result
      return new Promise<Identity | null>((resolve) => {
        setResolver(() => resolve);
        setShowModal(true);
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, localUser]);

  /**
   * Call this when user creates identity via modal
   */
  const handleIdentityCreated = useCallback((createdUser: LocalUser) => {
    setShowModal(false);
    if (resolver) {
      resolver({
        type: 'anonymous',
        user: createdUser,
      });
      setResolver(null);
    }
  }, [resolver]);

  /**
   * Call this when user cancels modal
   */
  const handleCancel = useCallback(() => {
    setShowModal(false);
    if (resolver) {
      resolver(null);
      setResolver(null);
    }
  }, [resolver]);

  return {
    ensureIdentity,
    showModal,
    setShowModal,
    isLoading,
    handleIdentityCreated,
    handleCancel,
  };
}
