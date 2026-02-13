import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../context/AuthContext';
import { useIdentity } from './useIdentity';
import toast from 'react-hot-toast';

interface Tournament {
  id: string;
  name: string;
  is_finished: boolean;
  join_code: string;
}

export const useJoinTournament = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const { localUser, initializeAnonymousUser } = useIdentity();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinByCode = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate format (6-8 chars per AC4, alphanumeric, uppercase)
      const trimmedCode = code.trim().toUpperCase();
      if (!/^[A-Z0-9]{6,8}$/.test(trimmedCode)) {
        throw new Error('Code invalide (6-8 caractères alphanumériques)');
      }

      // Check if online (offline-first architecture requirement)
      if (!navigator.onLine) {
        throw new Error('Connexion internet requise pour rejoindre un tournoi');
      }

      // Check Supabase availability (project-context requirement)
      if (!supabase) {
        throw new Error('Connexion internet requise pour rejoindre un tournoi');
      }

      // Query tournament by code with timeout for offline detection
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connexion internet requise pour rejoindre un tournoi')), 10000)
      );

      const queryPromise = supabase
        .from('tournaments')
        .select('id, name, is_finished, join_code')
        .eq('join_code', trimmedCode)
        .single();

      const { data: tournament, error: dbError } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as Awaited<typeof queryPromise>;

      if (dbError || !tournament) {
        // Check if it's a network error
        if (dbError && 'message' in dbError && 
            (dbError.message.includes('fetch') || dbError.message.includes('network'))) {
          throw new Error('Connexion internet requise pour rejoindre un tournoi');
        }
        throw new Error('Code invalide ou tournoi introuvable');
      }

      // Check if tournament is finished
      if (tournament.is_finished) {
        throw new Error('Ce tournoi est terminé');
      }

      // If anonymous and no local user, initialize identity
      if (!isAuthenticated && !localUser) {
        await initializeAnonymousUser();
      }

      // Navigate to tournament page
      toast.success(`Bienvenue dans le tournoi ${tournament.name}!`);
      navigate(`/tournament/${tournament.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { joinByCode, isLoading, error };
};
