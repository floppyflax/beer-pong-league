import { createContext, useContext, type ReactNode } from 'react';
import { useIdentity, type IdentityState } from '../hooks/useIdentity';
import type { LocalUser } from '../services/LocalUserService';

export interface IdentityContextType extends IdentityState {
  createIdentity: (pseudo: string, deviceFingerprint?: string) => Promise<LocalUser>;
  updateIdentity: (updates: Partial<LocalUser>) => Promise<void>;
  clearIdentity: () => Promise<void>;
  initializeAnonymousUser: (pseudo?: string) => Promise<LocalUser>;
}

export const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

export const useIdentityContext = () => {
  const context = useContext(IdentityContext);
  if (!context) throw new Error('useIdentityContext must be used within IdentityProvider');
  return context;
};

export const IdentityProvider = ({ children }: { children: ReactNode }) => {
  const identity = useIdentity();
  return <IdentityContext.Provider value={identity}>{children}</IdentityContext.Provider>;
};
