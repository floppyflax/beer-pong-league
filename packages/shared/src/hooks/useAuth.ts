import { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { authService } from '../services/AuthService';
import type { UserRow } from '../services/repositories/_base';

export interface AuthState {
  user: User | null;
  userProfile: UserRow | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    userProfile: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const userIdRef = useRef<string | null>(null);

  const loadUserProfile = useCallback(async (userId: string): Promise<UserRow | null> => {
    const profile = await authService.getUserProfile(userId);
    return (profile as UserRow | null) ?? null;
  }, []);

  const refreshUserProfile = useCallback(async (): Promise<void> => {
    const userId = userIdRef.current;
    if (!userId) return;
    const profile = await loadUserProfile(userId);
    setState((prev) =>
      prev.user?.id === userId ? { ...prev, userProfile: profile } : prev,
    );
  }, [loadUserProfile]);

  useEffect(() => {
    const loadAuth = async () => {
      const user = await authService.getCurrentUser();
      userIdRef.current = user?.id ?? null;
      const userProfile = user ? await loadUserProfile(user.id) : null;
      setState({ user, userProfile, isLoading: false, isAuthenticated: !!user });
    };

    loadAuth();

    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      userIdRef.current = user?.id ?? null;
      const userProfile = user ? await loadUserProfile(user.id) : null;
      setState({ user, userProfile, isLoading: false, isAuthenticated: !!user });
    });

    return () => { subscription.unsubscribe(); };
  }, [loadUserProfile]);

  const signInWithOTP = async (email: string): Promise<{ error: Error | null }> => {
    return authService.signInWithOTP(email);
  };

  const signOut = async (): Promise<void> => {
    await authService.signOut();
    userIdRef.current = null;
    setState({ user: null, userProfile: null, isLoading: false, isAuthenticated: false });
  };

  return { ...state, signInWithOTP, signOut, refreshUserProfile };
}
