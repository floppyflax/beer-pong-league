import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { SPORTS, DEFAULT_SPORT_ID, type SportConfig } from '../config/sports';
import { getStorage } from '../runtime/storage';

const SPORT_STORAGE_KEY = 'elofight_sport';

export interface SportContextValue {
  sport: SportConfig;
  sportId: string;
  setSportId: (id: string) => void;
  availableSports: SportConfig[];
}

export const SportContext = createContext<SportContextValue | null>(null);

export function SportProvider({ children }: { children: ReactNode }) {
  const [sportId, setSportIdState] = useState(DEFAULT_SPORT_ID);

  useEffect(() => {
    void Promise.resolve(getStorage().getItem(SPORT_STORAGE_KEY)).then((saved) => {
      if (saved && SPORTS[saved]) setSportIdState(saved);
    });
  }, []);

  const setSportId = (id: string) => {
    if (SPORTS[id]) {
      setSportIdState(id);
      void getStorage().setItem(SPORT_STORAGE_KEY, id);
    }
  };

  const sport = SPORTS[sportId] ?? SPORTS[DEFAULT_SPORT_ID];
  const availableSports = Object.values(SPORTS);

  return (
    <SportContext.Provider value={{ sport, sportId, setSportId, availableSports }}>
      {children}
    </SportContext.Provider>
  );
}

export function useSport(): SportContextValue {
  const ctx = useContext(SportContext);
  if (!ctx) throw new Error('useSport must be used within a SportProvider');
  return ctx;
}
