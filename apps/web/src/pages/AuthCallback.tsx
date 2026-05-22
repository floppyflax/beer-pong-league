import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useIdentityContext } from '../context/IdentityContext';
// import { useAuthContext } from '../context/AuthContext'; // Unused
import { identityMergeService } from '../services/IdentityMergeService';
import { BeerCupLoader } from '../components/ponglo/BeerCupLoader';
import { PButton } from '../components/ponglo/PButton';

/**
 * Callback page for Supabase Auth OTP
 * Handles the redirect after user clicks magic link
 */
export const AuthCallback = () => {
  const navigate = useNavigate();
  const { localUser, clearIdentity } = useIdentityContext();
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

          // Create user profile if doesn't exist. Set auth_user_id = id so the
          // canonical users row matches auth.uid() AND claim_player resolves it
          // (WHERE auth_user_id = auth.uid()) instead of inserting a duplicate.
          if (!profile.data) {
            await supabase.from('users').insert({
              id: session.user.id,
              auth_user_id: session.user.id,
              is_anonymous: false,
              pseudo: localUser.pseudo,
            });
          }

          // Transfer the anonymous player (claimed or created while playing as
          // a guest) to this authenticated account, so progress is preserved
          // under auth.uid() and accessible across devices. claim_player moves
          // an anon-owned player to the caller's authenticated user.
          const { data: anonPlayer } = await supabase
            .from('players')
            .select('id')
            .eq('user_id', localUser.anonymousUserId)
            .maybeSingle();

          if (anonPlayer) {
            const transfer = await identityMergeService.claimAnonymousPlayer(
              'event',
              (anonPlayer as { id: string }).id,
              session.user.id,
            );
            if (transfer.success) {
              // The anonymous identity is now subsumed by the account — drop the
              // local guest so the app uses the authenticated identity.
              await clearIdentity?.();
            } else {
              console.warn('Failed to transfer anonymous player:', transfer.error);
            }
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
              auth_user_id: session.user.id,
              is_anonymous: false,
              pseudo: emailUsername,
            });
          }
        }

        setStatus('success');

        // Check for returnTo. localStorage first (survives the magic-link
        // new-tab round-trip), sessionStorage as a fallback (legacy callers).
        const returnTo =
          localStorage.getItem('authReturnTo') ??
          sessionStorage.getItem('authReturnTo');
        localStorage.removeItem('authReturnTo');
        sessionStorage.removeItem('authReturnTo');

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
        <BeerCupLoader size={72} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-4">
        <div className="bg-navy-soft rounded-card border border-signal-red/40 shadow-modal p-7 max-w-sm w-full text-center">
          <div className="inline-flex items-center justify-center w-[68px] h-[68px] rounded-full bg-signal-red/15 mb-5">
            <AlertCircle size={36} className="text-signal-red" />
          </div>
          <h2 className="font-archivo font-extrabold uppercase tracking-[-0.5px] text-white text-2xl mb-2">
            Erreur de connexion
          </h2>
          <p className="text-cool-gray text-sm leading-relaxed mb-7">
            {error || 'Une erreur est survenue'}
          </p>
          <PButton variant="primary" size="lg" full onClick={() => navigate('/')}>
            Retour à l'accueil
          </PButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="bg-navy-soft rounded-card border border-card shadow-modal p-7 max-w-sm w-full text-center">
        <div className="inline-flex items-center justify-center w-[68px] h-[68px] rounded-full bg-lime/15 mb-5">
          <CheckCircle size={36} className="text-lime" />
        </div>
        <h2 className="font-archivo font-extrabold uppercase tracking-[-0.5px] text-white text-2xl mb-2">
          Connexion réussie !
        </h2>
        <p className="text-cool-gray text-sm font-mono">Redirection en cours…</p>
      </div>
    </div>
  );
};
