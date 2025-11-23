import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { authService } from '../services/AuthService';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Load initial auth state
    const loadAuth = async () => {
      const user = await authService.getCurrentUser();
      setState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
      });
    };

    loadAuth();

    // Listen to auth state changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (user) => {
      setState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
      });

      // If user just signed in, create profile if doesn't exist
      if (user) {
        const profile = await authService.getUserProfile(user.id);
        if (!profile) {
          // Profile will be created when user claims their account
          // or we can create it here with a default pseudo
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithOTP = async (email: string): Promise<{ error: Error | null }> => {
    return await authService.signInWithOTP(email);
  };

  const signOut = async (): Promise<void> => {
    await authService.signOut();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  return {
    ...state,
    signInWithOTP,
    signOut,
  };
}



