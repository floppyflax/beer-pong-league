import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useIdentityContext } from '../context/IdentityContext';
// import { useAuthContext } from '../context/AuthContext'; // Unused
import { identityMergeService } from '../services/IdentityMergeService';

/**
 * Callback page for Supabase Auth OTP
 * Handles the redirect after user clicks magic link
 */
export const AuthCallback = () => {
  const navigate = useNavigate();
  const { localUser } = useIdentityContext();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (!supabase) {
        setError('Supabase non configuré');
        setStatus('error');
        return;
      }

      try {
        // Get the session from URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
          setStatus('error');
          return;
        }

        if (!session?.user) {
          setError('Aucune session trouvée');
          setStatus('error');
          return;
        }

        // If user has a local identity, merge it
        if (localUser && session.user && supabase) {
          const profile = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          // Create user profile if doesn't exist
          if (!profile.data) {
            await supabase.from('users').insert({
              id: session.user.id,
              pseudo: localUser.pseudo,
            });
          }

          // Merge anonymous identity to authenticated user
          const mergeResult = await identityMergeService.mergeAnonymousToUser(
            localUser.anonymousUserId,
            session.user.id,
            localUser.pseudo
          );

          if (!mergeResult.success) {
            console.warn('Failed to merge identity:', mergeResult.error);
            // Continue anyway, user is authenticated
          }
        } else if (session.user && supabase) {
          // No local identity, just create profile
          const profile = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!profile.data) {
            // Get email username as default pseudo
            const emailUsername = session.user.email?.split('@')[0] || 'Joueur';
            await supabase.from('users').insert({
              id: session.user.id,
              pseudo: emailUsername,
            });
          }
        }

        setStatus('success');
        
        // Check for returnTo in sessionStorage
        const returnTo = sessionStorage.getItem('authReturnTo');
        if (returnTo) {
          sessionStorage.removeItem('authReturnTo'); // Clean up
        }
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate(returnTo || '/');
        }, 1500);
      } catch (error) {
        console.error('Error in auth callback:', error);
        setError(error instanceof Error ? error.message : 'Erreur inconnue');
        setStatus('error');
      }
    };

    handleAuthCallback();
  }, [localUser, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🍺</div>
          <div className="text-ink-soft">Connexion en cours...</div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-paper rounded-2xl p-6 border border-red-500/50 max-w-sm w-full text-center">
          <div className="text-ruby text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-ink mb-2">Erreur de connexion</h2>
          <p className="text-ink-soft mb-6">{error || 'Une erreur est survenue'}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-cup-red hover:brightness-110 text-ink font-bold py-3 rounded-xl"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">✅</div>
        <div className="text-ink font-bold text-xl mb-2">Connexion réussie !</div>
        <div className="text-ink-soft">Redirection en cours...</div>
      </div>
    </div>
  );
};



