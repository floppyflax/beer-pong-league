import { createContext, useContext, useState, type ReactNode } from 'react';
import { SPORTS, DEFAULT_SPORT_ID, type SportConfig } from '@/config/sports';

export interface SportContextValue {
  sport: SportConfig;
  sportId: string;
  setSportId: (id: string) => void;
  availableSports: SportConfig[];
}

// Exported so the design-system showcase can wrap pages with a
// fixture-only Sport context (see MockProviders.tsx).
export const SportContext = createContext<SportContextValue | null>(null);

export function SportProvider({ children }: { children: ReactNode }) {
  const [sportId, setSportId] = useState(
    () => localStorage.getItem('elofight_sport') || DEFAULT_SPORT_ID,
  );

  const handleSetSportId = (id: string) => {
    if (SPORTS[id]) {
      setSportId(id);
      localStorage.setItem('elofight_sport', id);
    }
  };

  const sport = SPORTS[sportId] ?? SPORTS[DEFAULT_SPORT_ID];
  const availableSports = Object.values(SPORTS);

  return (
    <SportContext.Provider
      value={{ sport, sportId, setSportId: handleSetSportId, availableSports }}
    >
      {children}
    </SportContext.Provider>
  );
}

export function useSport(): SportContextValue {
  const ctx = useContext(SportContext);
  if (!ctx) throw new Error('useSport must be used within a SportProvider');
  return ctx;
}
