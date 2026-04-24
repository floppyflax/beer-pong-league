import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useIdentityContext } from '../context/IdentityContext';
// import { useAuthContext } from '../context/AuthContext'; // Unused
import { identityMergeService } from '../services/IdentityMergeService';
import { PongloGlyph } from '../components/ponglo/Wordmark';
import { PButton } from '../components/ponglo/PButton';

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
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-5">
            <div className="animate-pulse">
              <PongloGlyph size={56} color="#B7FF3B" />
            </div>
          </div>
          <p className="text-cool-gray text-sm font-mono uppercase tracking-widest">
            Connexion en cours…
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-4">
        <div className="bg-navy-soft rounded-card p-6 border border-signal-red/40 max-w-sm w-full text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle size={44} className="text-signal-red" />
          </div>
          <h2 className="font-archivo font-extrabold uppercase tracking-tight text-white text-xl mb-2">
            Erreur de connexion
          </h2>
          <p className="text-cool-gray text-sm mb-6">
            {error || 'Une erreur est survenue'}
          </p>
          <PButton variant="primary" full onClick={() => navigate('/')}>
            Retour à l'accueil
          </PButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle size={52} className="text-lime" />
        </div>
        <p className="font-archivo font-extrabold uppercase tracking-tight text-white text-xl mb-2">
          Connexion réussie !
        </p>
        <p className="text-cool-gray text-sm font-mono">Redirection en cours…</p>
      </div>
    </div>
  );
};
