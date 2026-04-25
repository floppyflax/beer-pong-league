import { CheckCircle, AlertCircle, Crown, X, RotateCcw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useIdentity } from "../hooks/useIdentity";
import { useAuthContext } from "../context/AuthContext";
import { premiumService } from "../services/PremiumService";
import { stripeService } from "../services/StripeService";
import { supabase } from "../lib/supabase";
import { Sheet } from "./design-system/Sheet";
import { PButton } from "./ponglo/PButton";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

type PaymentState = "idle" | "processing" | "success" | "error";

const FEATURES: Array<{
  label: string;
  free: string;
  prem: string;
  premHighlight?: boolean;
}> = [
  { label: "Événements",       free: "2",   prem: "∞",  premHighlight: true },
  { label: "Ligues (saisons)", free: "—",   prem: "∞",  premHighlight: true },
  { label: "Stats basiques",   free: "✓",   prem: "✓" },
  { label: "Stats avancées",   free: "—",   prem: "✓",  premHighlight: true },
  { label: "Historique",       free: "30j", prem: "∞",  premHighlight: true },
  { label: "Display TV",       free: "—",   prem: "✓",  premHighlight: true },
  { label: "Export CSV",       free: "—",   prem: "✓",  premHighlight: true },
  { label: "Sans pub",         free: "—",   prem: "✓",  premHighlight: true },
];

export const PaymentModal = ({
  isOpen,
  onClose,
  onSuccess,
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
      pollingAbortRef.current?.abort();
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, paymentState]);  

  if (!isOpen) return null;

  const pollForPremiumStatus = async (
    userId: string | null,
    anonymousUserId: string | null,
    _transactionId: string,
    abortSignal: AbortSignal,
  ): Promise<boolean> => {
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      if (abortSignal.aborted) return false;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (abortSignal.aborted) return false;
      const isPremium = await premiumService.isPremium(userId, anonymousUserId);
      if (isPremium) return true;
    }
    return false;
  };

  const handlePayment = async () => {
    if (isProcessing) return;
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

      if (!supabase) throw new Error("Database connection not available");

      if (stripeService.isStripeConfigured()) {
        const session = await stripeService.createCheckoutSession(userId, anonymousUserId);
        if (!session) {
          setError("Impossible de créer la session de paiement. Veuillez réessayer.");
          setPaymentState("error");
          setIsProcessing(false);
          return;
        }
        window.location.href = session.url;
        return;
      }

      // Simulation mode
      const transactionId = `sim_${Date.now()}_${userId || anonymousUserId}`;
      await new Promise((resolve) => setTimeout(resolve, 1500));

      let updateError;
      if (userId) {
        const { error } = await supabase
          .from("users")
          .upsert({ id: userId, is_premium: true, pseudo: user?.email?.split("@")[0] || "User" }, { onConflict: "id", ignoreDuplicates: false })
          .select();
        updateError = error;
      } else if (anonymousUserId) {
        const { error } = await supabase
          .from("anonymous_users")
          .upsert({ id: anonymousUserId, is_premium: true, pseudo: localUser?.pseudo || "Anonymous", device_fingerprint: localUser?.deviceFingerprint || null }, { onConflict: "id", ignoreDuplicates: false })
          .select();
        updateError = error;
      }

      if (updateError) {
        setError("Erreur lors de la mise à jour du statut premium");
        setPaymentState("error");
        setIsProcessing(false);
        return;
      }

      pollingAbortRef.current = new AbortController();
      const confirmed = await pollForPremiumStatus(userId, anonymousUserId, transactionId, pollingAbortRef.current.signal);

      if (!isMountedRef.current) return;

      if (!confirmed) {
        setError("Le paiement n'a pas pu être confirmé. Contactez le support.");
        setPaymentState("error");
        setIsProcessing(false);
        return;
      }

      premiumService.updatePremiumStatusInLocalStorage(true);
      setPaymentState("success");
      setIsProcessing(false);

      successTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) { onSuccess?.(); handleClose(); }
      }, 1500);
    } catch {
      if (!isMountedRef.current) return;
      setError("Une erreur est survenue lors du paiement. Veuillez réessayer.");
      setPaymentState("error");
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (paymentState === "processing") { setShowCloseConfirmation(true); return; }
    setPaymentState("idle");
    setError(null);
    setShowCloseConfirmation(false);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleClose();
  };

  // Close confirmation (overlay modal on top)
  if (showCloseConfirmation) {
    return (
      <Sheet
        isOpen
        onClose={() => setShowCloseConfirmation(false)}
        title={
          <span className="flex items-center justify-center gap-2">
            <AlertCircle size={18} className="text-electric-blue" />
            Annuler le paiement ?
          </span>
        }
        maxWidth="sm"
        layer="top"
      >
        <p className="text-sm text-cool-gray mb-6">
          Le paiement est en cours. Es-tu sûr de vouloir annuler ?
        </p>
        <div className="flex gap-3">
          <PButton
            variant="ghost"
            full
            onClick={() => setShowCloseConfirmation(false)}
          >
            Continuer
          </PButton>
          <PButton
            variant="dark"
            full
            className="!bg-signal-red/15 !text-signal-red !border-signal-red/40 !shadow-[0_3px_0_rgba(255,59,59,0.4)]"
            onClick={() => {
              setPaymentState("idle");
              setError(null);
              setShowCloseConfirmation(false);
              onClose();
            }}
          >
            Annuler
          </PButton>
        </div>
      </Sheet>
    );
  }

  // Success state (inline in sheet)
  if (paymentState === "success") {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-label="Premium activé"
      >
        <div
          className="w-full md:max-w-md bg-navy-soft border-t border-card md:border md:border-card rounded-t-2xl md:rounded-2xl shadow-modal flex flex-col items-center gap-5 px-6 py-10 animate-invite-sheet-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-20 h-20 rounded-full bg-lime/20 flex items-center justify-center">
            <CheckCircle size={40} className="text-lime" />
          </div>
          <div className="text-center">
            <h2 className="font-archivo font-black uppercase text-white text-2xl tracking-tight">
              Premium activé !
            </h2>
            <p className="text-cool-gray text-sm mt-2">
              Tous tes événements et ligues sont maintenant illimités.
            </p>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-electric-blue" />
        </div>
      </div>
    );
  }

  // Main paywall bottom sheet
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-sheet-title"
    >
      <div
        className="w-full md:max-w-lg bg-navy-soft border-t border-card md:border md:border-card rounded-t-2xl md:rounded-2xl shadow-modal flex flex-col max-h-[92vh] animate-invite-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grabber (mobile only) */}
        <div className="md:hidden flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Close button */}
        <div className="relative flex items-center justify-end px-4 pt-3 pb-1 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-cool-gray hover:bg-white/10 transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 pb-4 flex flex-col gap-5">
          {/* Hero */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Crown size={13} className="text-ping-yellow" />
              <span className="font-archivo font-extrabold uppercase text-ping-yellow text-[11px] tracking-[1.5px]">
                Premium
              </span>
            </div>
            <h2
              id="premium-sheet-title"
              className="font-archivo font-black uppercase text-white leading-[0.95] tracking-[-1px]"
              style={{ fontSize: "clamp(28px, 8vw, 38px)" }}
            >
              Passe au<br />
              <span className="text-lime">level suivant.</span>
            </h2>
            <p className="text-white/60 text-sm mt-3 leading-relaxed">
              {subtitle ?? "Crée des ligues saisonnières, des événements illimités, et débloque les stats de pro."}
            </p>
          </div>

          {/* Feature comparison table */}
          <div className="bg-navy-deep rounded-xl overflow-hidden border border-card">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_56px_64px] px-4 py-2.5 border-b border-card">
              <span />
              <span className="text-center font-mono text-[10px] uppercase tracking-[1.5px] text-cool-gray">
                Free
              </span>
              <span className="text-center font-mono text-[10px] uppercase tracking-[1.5px] text-ping-yellow flex items-center justify-center gap-1">
                <Crown size={9} />
                Prem.
              </span>
            </div>

            {/* Rows */}
            {FEATURES.map((f, i) => (
              <div
                key={f.label}
                className={`grid grid-cols-[1fr_56px_64px] px-4 py-2.5 items-center ${
                  i < FEATURES.length - 1 ? "border-b border-card/60" : ""
                }`}
              >
                <span className="text-sm text-white/80">{f.label}</span>
                <span className="text-center text-sm text-cool-gray font-mono">
                  {f.free}
                </span>
                <span
                  className={`text-center text-sm font-mono font-bold ${
                    f.premHighlight ? "text-ping-yellow" : "text-cool-gray"
                  }`}
                >
                  {f.prem}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing block */}
          <div className="bg-navy-deep rounded-xl border border-card px-4 py-3.5 flex items-center justify-between">
            <div>
              <div className="font-archivo font-extrabold uppercase text-white text-sm tracking-tight">
                Accès à vie
              </div>
              <div className="text-cool-gray text-xs mt-0.5">
                Paiement unique · pas d'abonnement
              </div>
            </div>
            <div className="font-archivo font-black text-white text-2xl tracking-tight">
              3€
            </div>
          </div>

          {/* Error state */}
          {paymentState === "error" && error && (
            <div className="bg-signal-red/15 border border-signal-red/40 rounded-xl p-3.5 flex items-start gap-3">
              <AlertCircle size={18} className="text-signal-red mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-signal-red text-sm">Erreur de paiement</div>
                <div className="text-red-400 text-xs mt-0.5">{error}</div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky CTA */}
        <div className="shrink-0 px-5 pt-3 pb-6 border-t border-card bg-navy-soft">
          {paymentState === "error" ? (
            <button
              type="button"
              onClick={() => { setPaymentState("idle"); setError(null); setIsProcessing(false); }}
              className="w-full h-14 rounded-full bg-navy-deep border border-card text-white font-archivo font-extrabold uppercase text-[13px] tracking-[0.5px] flex items-center justify-center gap-2 hover:bg-white/5 transition"
            >
              <RotateCcw size={16} />
              Réessayer
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePayment}
              disabled={paymentState === "processing"}
              className="w-full h-14 rounded-full bg-lime text-navy font-archivo font-black uppercase text-[13px] tracking-[0.5px] flex items-center justify-center gap-2 shadow-[0_4px_0_#8BCC1F] hover:brightness-105 active:translate-y-[2px] active:shadow-[0_2px_0_#8BCC1F] transition-[transform,box-shadow,filter] duration-75 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:translate-y-0"
            >
              {paymentState === "processing" ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-navy/40 border-t-navy animate-spin" />
                  Traitement en cours…
                </>
              ) : (
                <>
                  <Crown size={16} />
                  Passer Premium — 3€
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
