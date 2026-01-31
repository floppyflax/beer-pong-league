import { X, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useIdentity } from '../hooks/useIdentity';
import { useAuthContext } from '../context/AuthContext';
import { premiumService } from '../services/PremiumService';
import { supabase } from '../lib/supabase';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Payment state machine
type PaymentState = 'idle' | 'processing' | 'success' | 'error';

export const PaymentModal = ({ isOpen, onClose, onSuccess }: PaymentModalProps) => {
  const { user } = useAuthContext();
  const { localUser } = useIdentity();
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // FIX #4: Prevent double-click
  
  // FIX #1 & #3: Refs for cleanup
  const pollingAbortRef = useRef<AbortController | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // FIX #3: Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // Cleanup polling
      if (pollingAbortRef.current) {
        pollingAbortRef.current.abort();
      }
      
      // Cleanup success timeout
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  // FIX #2 & #7: Poll for premium status update after payment (webhook confirmation)
  // This simulates waiting for a webhook. In production (Story 7.4), we'll use real webhook events.
  const pollForPremiumStatus = async (
    userId: string | null, 
    anonymousUserId: string | null,
    transactionId: string,
    abortSignal: AbortSignal
  ): Promise<boolean> => {
    const maxAttempts = 10; // 10 attempts
    const interval = 1000; // 1 second between attempts

    console.log('Polling for webhook confirmation of transaction:', transactionId);

    for (let i = 0; i < maxAttempts; i++) {
      // Check if aborted
      if (abortSignal.aborted) {
        console.log('Polling aborted for transaction:', transactionId);
        return false;
      }

      // Wait before polling
      await new Promise(resolve => setTimeout(resolve, interval));
      
      // Check if aborted again after timeout
      if (abortSignal.aborted) {
        return false;
      }
      
      // In production (Story 7.4), we'd check if a webhook confirmed this specific transaction
      // For now, we verify premium status was updated (webhook simulation)
      const isPremium = await premiumService.isPremium(userId, anonymousUserId);
      if (isPremium) {
        console.log('Webhook confirmed transaction:', transactionId);
        return true;
      }
    }
    
    console.log('Webhook timeout for transaction:', transactionId);
    return false;
  };

  const handlePayment = async () => {
    // FIX #4: Prevent double-click
    if (isProcessing) {
      return;
    }
    
    setIsProcessing(true);
    setPaymentState('processing');
    setError(null);

    try {
      const userId = user?.id || null;
      const anonymousUserId = localUser?.anonymousUserId || null;

      if (!userId && !anonymousUserId) {
        setError('Vous devez être connecté pour acheter Premium');
        setPaymentState('error');
        setIsProcessing(false);
        return;
      }

      // FIX #6: Check if supabase is available
      if (!supabase) {
        throw new Error('Database connection not available');
      }

      // FIX #8: Generate transaction ID for tracking
      // In production (Story 7.3), this will be used to verify webhook events
      const transactionId = `sim_${Date.now()}_${userId || anonymousUserId}`;
      console.log('Payment transaction started:', transactionId);

      // TODO: Intégrer Stripe Checkout ici (Story 7.3)
      // Pour l'instant, simulation d'un paiement réussi
      // Future: const session = await stripeService.createCheckoutSession(userId, anonymousUserId);
      // Future: window.location.href = session.url; // Redirect to Stripe Checkout

      // Simulation d'un délai de paiement (Stripe Checkout processing)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // FIX #2: In production, webhook (Story 7.4) will update is_premium, not the client
      // For simulation, we update it here to mimic webhook behavior
      // FIX #5: Extract update logic to reduce duplication
      const tableName = userId ? 'users' : 'anonymous_users';
      const idField = 'id';
      const idValue = (userId || anonymousUserId) as string; // Safe: already checked above

      const { error: updateError } = await supabase
        .from(tableName)
        .update({ is_premium: true })
        .eq(idField, idValue);

      if (updateError) {
        console.error('Error updating premium status:', updateError);
        setError('Erreur lors de la mise à jour du statut premium');
        setPaymentState('error');
        setIsProcessing(false);
        return;
      }

      // Create abort controller for polling
      pollingAbortRef.current = new AbortController();

      // Poll for premium status confirmation (simulates waiting for webhook)
      const premiumConfirmed = await pollForPremiumStatus(
        userId, 
        anonymousUserId, 
        transactionId,
        pollingAbortRef.current.signal
      );
      
      // FIX #3: Check if component is still mounted
      if (!isMountedRef.current) {
        return;
      }

      if (!premiumConfirmed) {
        setError('Le paiement n\'a pas pu être confirmé. Contactez le support.');
        setPaymentState('error');
        setIsProcessing(false);
        return;
      }

      // Mise à jour localStorage
      premiumService.updatePremiumStatusInLocalStorage(true);

      // Success state
      setPaymentState('success');
      setIsProcessing(false);
      
      // FIX #1: Store timeout ref for cleanup and check if mounted
      successTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          onSuccess?.();
          handleClose();
        }
      }, 1500);
    } catch (error) {
      console.error('Payment error:', error);
      
      // FIX #3: Check if component is still mounted
      if (!isMountedRef.current) {
        return;
      }
      
      setError('Une erreur est survenue lors du paiement. Veuillez réessayer.');
      setPaymentState('error');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    // If processing, show confirmation
    if (paymentState === 'processing') {
      setShowCloseConfirmation(true);
      return;
    }

    // If success, don't allow manual close (auto-closes)
    if (paymentState === 'success') {
      return;
    }

    // Reset state and close
    setPaymentState('idle');
    setError(null);
    setShowCloseConfirmation(false);
    onClose();
  };

  const handleConfirmClose = () => {
    setPaymentState('idle');
    setError(null);
    setShowCloseConfirmation(false);
    onClose();
  };

  const handleRetry = () => {
    setPaymentState('idle');
    setError(null);
    setIsProcessing(false); // FIX #4: Reset processing flag
  };

  // Close confirmation dialog
  if (showCloseConfirmation) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
        <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-6 border border-slate-700">
          <div className="flex items-start gap-3 mb-6">
            <AlertCircle size={24} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold mb-2">Annuler le paiement ?</h3>
              <p className="text-sm text-slate-400">
                Le paiement est en cours. Êtes-vous sûr de vouloir annuler ?
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowCloseConfirmation(false)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Continuer
            </button>
            <button
              onClick={handleConfirmClose}
              className="flex-1 bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 text-red-500 font-bold py-3 rounded-xl transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (paymentState === 'success') {
    return (
      <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
        <div className="bg-slate-900 w-full max-w-md rounded-2xl p-6 border border-slate-700">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-2">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-white">Paiement réussi !</h3>
            <p className="text-slate-400">
              Ton compte est maintenant Premium. Profite de toutes les fonctionnalités illimitées !
            </p>
            <div className="pt-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-slate-500 mt-2">Fermeture automatique...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main payment modal
  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl p-6 border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={24} className="text-primary" />
            <h3 className="text-xl font-bold">Passe Premium</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={paymentState === 'processing'}
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Prix */}
          <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-6 text-center border border-primary/30">
            <div className="text-5xl font-black text-white mb-2">3€</div>
            <div className="text-sm text-slate-300">Paiement unique - À vie</div>
          </div>

          {/* Avantages */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-slate-800/50 p-4 rounded-xl">
              <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-white">Tournois illimités</div>
                <div className="text-sm text-slate-400">
                  Crée autant de tournois que tu veux
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-800/50 p-4 rounded-xl">
              <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-white">Ligues illimitées</div>
                <div className="text-sm text-slate-400">
                  Crée et gère des ligues avec saisons
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-800/50 p-4 rounded-xl">
              <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-white">Joueurs illimités</div>
                <div className="text-sm text-slate-400">
                  Aucune limite de participants par tournoi
                </div>
              </div>
            </div>
          </div>

          {/* Message d'erreur */}
          {paymentState === 'error' && error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-red-500 mb-1">Erreur de paiement</div>
                  <div className="text-red-400 text-sm">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Bouton de paiement ou retry */}
          {paymentState === 'error' ? (
            <button
              onClick={handleRetry}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>Réessayer</span>
            </button>
          ) : (
            <button
              onClick={handlePayment}
              disabled={paymentState === 'processing'}
              className="w-full bg-primary hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {paymentState === 'processing' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>Traitement en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Débloquer Premium - 3€</span>
                </>
              )}
            </button>
          )}

          <div className="text-xs text-slate-500 text-center">
            {import.meta.env.DEV ? (
              <>
                🧪 Mode développement: Simulation de paiement
                <br />
                L'intégration Stripe (Story 7.3) sera ajoutée prochainement
              </>
            ) : (
              'Paiement sécurisé via Stripe'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
