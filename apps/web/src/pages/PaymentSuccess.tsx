import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, AlertCircle } from "lucide-react";
import { stripeService } from "../services/StripeService";
import { premiumService } from "../services/PremiumService";
import { useAuthContext } from "../context/AuthContext";
import { useIdentity } from "../hooks/useIdentity";
import { BeerCupLoader } from "../components/ponglo/BeerCupLoader";
import { PButton } from "../components/ponglo/PButton";

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { localUser } = useIdentity();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get("session_id");

      if (!sessionId) {
        setError("Session ID manquant");
        setIsVerifying(false);
        return;
      }

      try {
        const result = await stripeService.verifyPaymentSession(sessionId);

        if (!result.success) {
          setError("Le paiement n'a pas pu être vérifié");
          setIsVerifying(false);
          return;
        }

        premiumService.updatePremiumStatusInLocalStorage(true);

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const userId = user?.id || null;
        const anonymousUserId = localUser?.anonymousUserId || null;
        const isPremium = await premiumService.isPremium(userId, anonymousUserId);

        if (!isPremium) {
          console.warn("Premium status not yet updated by webhook, but payment succeeded");
        }

        setIsVerifying(false);

        setTimeout(() => {
          navigate("/");
        }, 3000);
      } catch (error) {
        console.error("Error verifying payment:", error);
        setError("Une erreur est survenue lors de la vérification du paiement");
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, user?.id, localUser?.anonymousUserId]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-4">
        <div className="bg-navy-soft rounded-card border border-card shadow-modal p-7 max-w-sm w-full text-center">
          <div className="flex justify-center mb-5">
            <BeerCupLoader size={64} />
          </div>
          <h1 className="font-archivo font-extrabold uppercase tracking-[-0.5px] text-white text-2xl mb-2">
            Vérification…
          </h1>
          <p className="text-cool-gray text-sm leading-relaxed">
            On confirme ton paiement avec Stripe.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-4">
        <div className="bg-navy-soft rounded-card border border-signal-red/40 shadow-modal p-7 max-w-sm w-full text-center">
          <div className="inline-flex items-center justify-center w-[68px] h-[68px] rounded-full bg-signal-red/15 mb-5">
            <AlertCircle size={36} className="text-signal-red" />
          </div>
          <h1 className="font-archivo font-extrabold uppercase tracking-[-0.5px] text-white text-2xl mb-2">
            Erreur de paiement
          </h1>
          <p className="text-cool-gray text-sm leading-relaxed mb-7">{error}</p>
          <PButton variant="primary" size="lg" full onClick={() => navigate("/")}>
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

        <h1 className="font-archivo font-extrabold uppercase tracking-[-0.5px] text-white text-2xl mb-2">
          Paiement réussi !
        </h1>
        <p className="text-cool-gray text-sm leading-relaxed mb-1">
          Ton compte est maintenant{" "}
          <span className="text-ping-yellow font-semibold">Premium</span>.
        </p>
        <p className="text-cool-gray text-sm leading-relaxed mb-6">
          Profite de toutes les fonctionnalités illimitées.
        </p>

        <div className="space-y-2 mb-6">
          {[
            "Événements illimités",
            "Ligues illimitées",
            "Joueurs illimités",
          ].map((label) => (
            <div
              key={label}
              className="flex items-center gap-3 bg-navy/60 border border-card p-3 rounded-card text-left"
            >
              <CheckCircle size={18} className="text-lime flex-shrink-0" />
              <span className="text-sm text-white">{label}</span>
            </div>
          ))}
        </div>

        <PButton variant="primary" size="lg" full onClick={() => navigate("/")}>
          Aller à mon compte
        </PButton>
        <p className="text-xs text-cool-gray font-mono mt-3">
          Redirection automatique…
        </p>
      </div>
    </div>
  );
};
