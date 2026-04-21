import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader } from 'lucide-react';
import { stripeService } from '../services/StripeService';
import { premiumService } from '../services/PremiumService';
import { useAuthContext } from '../context/AuthContext';
import { useIdentity } from '../hooks/useIdentity';

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { localUser } = useIdentity();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');

      if (!sessionId) {
        setError('Session ID manquant');
        setIsVerifying(false);
        return;
      }

      try {
        // Verify payment with Stripe
        const result = await stripeService.verifyPaymentSession(sessionId);

        if (!result.success) {
          setError('Le paiement n\'a pas pu être vérifié');
          setIsVerifying(false);
          return;
        }

        // Update local storage
        premiumService.updatePremiumStatusInLocalStorage(true);

        // Wait a bit for webhook to complete (Story 7.4)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify premium status was updated
        const userId = user?.id || null;
        const anonymousUserId = localUser?.anonymousUserId || null;
        const isPremium = await premiumService.isPremium(userId, anonymousUserId);

        if (!isPremium) {
          console.warn('Premium status not yet updated by webhook, but payment succeeded');
        }

        setIsVerifying(false);

        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } catch (error) {
        console.error('Error verifying payment:', error);
        setError('Une erreur est survenue lors de la vérification du paiement');
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, user?.id, localUser?.anonymousUserId]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-deep p-4">
        <div className="bg-cream rounded-2xl p-8 max-w-md w-full text-center border border-card">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-cup-red/20 rounded-full mb-4">
            <Loader size={32} className="text-cup-red animate-spin" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Vérification du paiement...</h1>
          <p className="text-ink-soft">
            Nous vérifions votre paiement avec Stripe.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-deep p-4">
        <div className="bg-cream rounded-2xl p-8 max-w-md w-full text-center border border-red-500/50">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-ruby/20 rounded-full mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-ruby">Erreur</h1>
          <p className="text-ink-soft mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-cream-deep hover:bg-paper text-ink font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-deep p-4">
      <div className="bg-cream rounded-2xl p-8 max-w-md w-full text-center border border-green-500/50">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-lime/20 rounded-full mb-4">
          <CheckCircle size={32} className="text-lime" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Paiement réussi !</h1>
        <p className="text-ink-soft mb-2">
          Ton compte est maintenant <span className="text-cup-red font-bold">Premium</span>.
        </p>
        <p className="text-ink-soft mb-6">
          Profite de toutes les fonctionnalités illimitées !
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-paper/50 p-3 rounded-xl text-left">
            <CheckCircle size={20} className="text-lime flex-shrink-0" />
            <span className="text-sm">Tournois illimités</span>
          </div>
          <div className="flex items-center gap-3 bg-paper/50 p-3 rounded-xl text-left">
            <CheckCircle size={20} className="text-lime flex-shrink-0" />
            <span className="text-sm">Ligues illimitées</span>
          </div>
          <div className="flex items-center gap-3 bg-paper/50 p-3 rounded-xl text-left">
            <CheckCircle size={20} className="text-lime flex-shrink-0" />
            <span className="text-sm">Joueurs illimités</span>
          </div>
        </div>
        <p className="text-sm text-ink-mute mt-6">
          Redirection automatique...
        </p>
      </div>
    </div>
  );
};
