import { createContext, useContext, ReactNode } from 'react';
import { useAuth, type AuthState } from '../hooks/useAuth';
// import type { User } from '@supabase/supabase-js'; // Unused

interface AuthContextType extends AuthState {
  signInWithOTP: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};



