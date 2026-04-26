import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import { PButton } from "../components/ponglo/PButton";

export const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="bg-navy-soft rounded-card border border-card shadow-modal p-7 max-w-sm w-full text-center">
        <div className="inline-flex items-center justify-center w-[68px] h-[68px] rounded-full bg-ping-yellow/15 mb-5">
          <XCircle size={36} className="text-ping-yellow" />
        </div>

        <h1 className="font-archivo font-extrabold uppercase tracking-[-0.5px] text-white text-2xl mb-2">
          Paiement annulé
        </h1>
        <p className="text-cool-gray text-sm leading-relaxed mb-1">
          Aucun montant n'a été débité.
        </p>
        <p className="text-cool-gray text-sm leading-relaxed mb-7">
          Tu peux réessayer à tout moment pour débloquer toutes les
          fonctionnalités <span className="text-ping-yellow font-semibold">Premium</span>.
        </p>

        <div className="flex flex-col gap-2.5">
          <PButton
            variant="primary"
            size="lg"
            full
            onClick={() => window.history.back()}
          >
            Réessayer le paiement
          </PButton>
          <PButton variant="ghost" size="md" full onClick={() => navigate("/")}>
            Retour à l'accueil
          </PButton>
        </div>
      </div>
    </div>
  );
};
