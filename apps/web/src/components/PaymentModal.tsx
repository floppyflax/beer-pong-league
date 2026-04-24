import { Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useIdentity } from "../hooks/useIdentity";
import { useAuthContext } from "../context/AuthContext";
import { premiumService } from "../services/PremiumService";
import { stripeService } from "../services/StripeService";
import { supabase } from "../lib/supabase";
import { Modal } from "./Modal";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Optional custom title (e.g. "Limite gratuite atteinte" for league limit) */
  title?: string;
  /** Optional custom subtitle/message (e.g. AC5 10-3 league limit message) */
  subtitle?: string;
}

type PaymentState = "idle" | "processing" | "success" | "error";

export const PaymentModal = ({
  isOpen,
  onClose,
  onSuccess,
  title,
  subtitle,
}: PaymentModalProps) => {
  const { user } = useAuthContext();
  const { localUser } = useIdentity();
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const pollingAbortRef = useRef<AbortController | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (pollingAbortRef.current) {
        pollingAbortRef.current.abort();
      }

      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const pollForPremiumStatus = async (
    userId: string | null,
    anonymousUserId: string | null,
    transactionId: string,
    abortSignal: AbortSignal,
  ): Promise<boolean> => {
    const maxAttempts = 10;
    const interval = 1000;

    console.log(
      "Polling for webhook confirmation of transaction:",
      transactionId,
    );

    for (let i = 0; i < maxAttempts; i++) {
      if (abortSignal.aborted) {
        console.log("Polling aborted for transaction:", transactionId);
        return false;
      }

      await new Promise((resolve) => setTimeout(resolve, interval));

      if (abortSignal.aborted) {
        return false;
      }

      const isPremium = await premiumService.isPremium(userId, anonymousUserId);
      if (isPremium) {
        console.log("Webhook confirmed transaction:", transactionId);
        return true;
      }
    }

    console.log("Webhook timeout for transaction:", transactionId);
    return false;
  };

  const handlePayment = async () => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    setPaymentState("processing");
    setError(null);

    try {
      const userId = user?.id || null;
      const anonymousUserId = localUser?.anonymousUserId || null;

      if (!userId && !anonymousUserId) {
        setError("Vous devez être connecté pour acheter Premium");
        setPaymentState("error");
        setIsProcessing(false);
        return;
      }

      if (!supabase) {
        throw new Error("Database connection not available");
      }

      const isStripeConfigured = stripeService.isStripeConfigured();

      if (isStripeConfigured) {
        console.log("🔐 Stripe Mode: Redirecting to Stripe Checkout...");

        const session = await stripeService.createCheckoutSession(
          userId,
          anonymousUserId,
        );

        if (!session) {
          setError(
            "Impossible de créer la session de paiement. Veuillez réessayer.",
          );
          setPaymentState("error");
          setIsProcessing(false);
          return;
        }

        console.log("Payment transaction started:", session.sessionId);

        window.location.href = session.url;
        return;
      }

      console.log(
        "🧪 Simulation Mode: Stripe not configured, using simulation",
      );

      const transactionId = `sim_${Date.now()}_${userId || anonymousUserId}`;
      console.log("Payment transaction started:", transactionId);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      let updateError;

      console.log("💳 Payment simulation - User info:", {
        userId,
        anonymousUserId,
        localUser,
      });

      if (userId) {
        console.log("💳 Upserting authenticated user:", userId);
        const { error, data } = await supabase
          .from("users")
          .upsert(
            {
              id: userId,
              is_premium: true,
              pseudo: user?.email?.split("@")[0] || "User",
            },
            {
              onConflict: "id",
              ignoreDuplicates: false,
            },
          )
          .select();
        console.log("💳 Upsert result:", { error, data });
        updateError = error;
      } else if (anonymousUserId) {
        console.log("💳 Upserting anonymous user:", anonymousUserId);
        const { error, data } = await supabase
          .from("anonymous_users")
          .upsert(
            {
              id: anonymousUserId,
              is_premium: true,
              pseudo: localUser?.pseudo || "Anonymous",
              device_fingerprint: localUser?.deviceFingerprint || null,
            },
            {
              onConflict: "id",
              ignoreDuplicates: false,
            },
          )
          .select();
        console.log("💳 Upsert result:", { error, data });
        updateError = error;
      }

      if (updateError) {
        console.error("Error updating premium status:", updateError);
        setError("Erreur lors de la mise à jour du statut premium");
        setPaymentState("error");
        setIsProcessing(false);
        return;
      }

      pollingAbortRef.current = new AbortController();

      const premiumConfirmed = await pollForPremiumStatus(
        userId,
        anonymousUserId,
        transactionId,
        pollingAbortRef.current.signal,
      );

      if (!isMountedRef.current) {
        return;
      }

      if (!premiumConfirmed) {
        setError("Le paiement n'a pas pu être confirmé. Contactez le support.");
        setPaymentState("error");
        setIsProcessing(false);
        return;
      }

      premiumService.updatePremiumStatusInLocalStorage(true);

      setPaymentState("success");
      setIsProcessing(false);

      successTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          onSuccess?.();
          handleClose();
        }
      }, 1500);
    } catch (error) {
      console.error("Payment error:", error);

      if (!isMountedRef.current) {
        return;
      }

      setError("Une erreur est survenue lors du paiement. Veuillez réessayer.");
      setPaymentState("error");
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (paymentState === "processing") {
      setShowCloseConfirmation(true);
      return;
    }

    if (paymentState === "success") {
      onClose();
      return;
    }

    setPaymentState("idle");
    setError(null);
    setShowCloseConfirmation(false);
    onClose();
  };

  const handleConfirmClose = () => {
    setPaymentState("idle");
    setError(null);
    setShowCloseConfirmation(false);
    onClose();
  };

  const handleRetry = () => {
    setPaymentState("idle");
    setError(null);
    setIsProcessing(false);
  };

  // Close confirmation dialog
  if (showCloseConfirmation) {
    return (
      <Modal
        isOpen={true}
        onClose={() => setShowCloseConfirmation(false)}
        title={
          <span className="flex items-center gap-2">
            <AlertCircle size={22} className="text-electric-blue" />
            Annuler le paiement ?
          </span>
        }
        maxWidth="max-w-sm"
        layer="top"
      >
        <p className="text-sm text-cool-gray mb-6">
          Le paiement est en cours. Êtes-vous sûr de vouloir annuler ?
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => setShowCloseConfirmation(false)}
            className="flex-1 bg-navy-soft hover:bg-slate-600 text-white font-bold py-3 rounded-input transition-colors"
          >
            Continuer
          </button>
          <button
            onClick={handleConfirmClose}
            className="flex-1 bg-signal-red/20 border border-signal-red/50 hover:bg-signal-red/30 text-signal-red font-bold py-3 rounded-input transition-colors"
          >
            Annuler
          </button>
        </div>
      </Modal>
    );
  }

  // Success state
  if (paymentState === "success") {
    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Paiement réussi !"
        layer="top"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-lime/20 rounded-full">
            <CheckCircle size={32} className="text-lime" />
          </div>
          <p className="text-cool-gray">
            Ton compte est maintenant Premium. Profite de toutes les
            fonctionnalités illimitées !
          </p>
          <div className="pt-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue mx-auto" />
            <p className="text-sm text-cool-gray mt-2">
              Fermeture automatique...
            </p>
          </div>
        </div>
      </Modal>
    );
  }

  // Main payment modal
  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title={
        <span className="flex items-center gap-2">
          <Sparkles size={22} className="text-electric-blue" />
          {title ?? "Passe Premium"}
        </span>
      }
      layer="top"
    >
      <div className="space-y-6">
        {subtitle && (
          <div className="bg-electric-blue/10 border border-electric-blue/30 rounded-input p-4">
            <p className="text-electric-blue text-sm">{subtitle}</p>
          </div>
        )}
        <div className="bg-gradient-to-br from-electric-blue/20 to-electric-blue/20 rounded-card p-6 text-center border border-electric-blue/30">
          <div className="text-5xl font-black text-white mb-2">3€</div>
          <div className="text-sm text-cool-gray">
            Paiement unique - À vie
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-navy-soft/50 p-4 rounded-input">
            <CheckCircle
              size={20}
              className="text-lime mt-0.5 flex-shrink-0"
            />
            <div>
              <div className="font-semibold text-white">
                Tournois illimités
              </div>
              <div className="text-sm text-cool-gray">
                Crée autant de tournois que tu veux
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-navy-soft/50 p-4 rounded-input">
            <CheckCircle
              size={20}
              className="text-lime mt-0.5 flex-shrink-0"
            />
            <div>
              <div className="font-semibold text-white">
                Ligues illimitées
              </div>
              <div className="text-sm text-cool-gray">
                Crée et gère des ligues avec saisons
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-navy-soft/50 p-4 rounded-input">
            <CheckCircle
              size={20}
              className="text-lime mt-0.5 flex-shrink-0"
            />
            <div>
              <div className="font-semibold text-white">
                Joueurs illimités
              </div>
              <div className="text-sm text-cool-gray">
                Aucune limite de participants par tournoi
              </div>
            </div>
          </div>
        </div>

        {paymentState === "error" && error && (
          <div className="bg-signal-red/20 border border-signal-red/50 rounded-input p-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="text-signal-red mt-0.5 flex-shrink-0"
              />
              <div>
                <div className="font-semibold text-signal-red mb-1">
                  Erreur de paiement
                </div>
                <div className="text-red-400 text-sm">{error}</div>
              </div>
            </div>
          </div>
        )}

        {paymentState === "error" ? (
          <button
            onClick={handleRetry}
            className="w-full bg-navy-soft hover:bg-slate-600 text-white font-bold py-4 rounded-input transition-colors flex items-center justify-center gap-2"
          >
            <span>Réessayer</span>
          </button>
        ) : (
          <button
            onClick={handlePayment}
            disabled={paymentState === "processing"}
            className="w-full bg-electric-blue hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-input transition-colors flex items-center justify-center gap-2"
          >
            {paymentState === "processing" ? (
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

        <div className="text-xs text-cool-gray text-center">
          {import.meta.env.DEV ? (
            <>
              🧪 Mode développement: Simulation de paiement
              <br />
              L'intégration Stripe (Story 7.3) sera ajoutée prochainement
            </>
          ) : (
            "Paiement sécurisé via Stripe"
          )}
        </div>
      </div>
    </Modal>
  );
};
