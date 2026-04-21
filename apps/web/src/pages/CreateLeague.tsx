/**
 * CreateLeague Page - Story 14.18
 *
 * League creation form aligned with design system (design-system-convergence 5.3).
 * - Header: title + back
 * - Fields with labels, inline validation
 * - Primary CTA at bottom
 * - Bottom nav visible
 * - Matches Frame 9
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLeague } from "@/context/LeagueContext";
import { useAuthContext } from "@/context/AuthContext";
import { usePremiumLimits } from "@/hooks/usePremiumLimits";
import { AuthModal } from "@/components/AuthModal";
import { PaymentModal } from "@/components/PaymentModal";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { Button } from "@/components/design-system";
import { Trophy, Calendar } from "lucide-react";
import toast from "react-hot-toast";

export const CreateLeague = () => {
  const [name, setName] = useState("");
  const [type, setType] = useState<"event" | "season">("event");
  const [nameError, setNameError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const { createLeague } = useLeague();
  const { isAuthenticated, isLoading } = useAuthContext();
  const { canCreateLeague, isAtLeagueLimit, refetchPremium } = usePremiumLimits();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [isAuthenticated, isLoading]);

  const validateName = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return "Le nom est requis";
    if (trimmed.length < 2) return "Le nom doit contenir au moins 2 caractères";
    return null;
  };

  const handleNameBlur = () => {
    setTouched(true);
    setNameError(validateName(name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    const error = validateName(name);
    if (error) {
      setNameError(error);
      return;
    }
    setNameError(null);

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!canCreateLeague) {
      setShowPaymentModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const newLeagueId = await createLeague(name.trim(), type);
      navigate(`/league/${newLeagueId}`);
    } catch (error) {
      console.error("Error creating league:", error);
      toast.error("Erreur lors de la création de la ligue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = !validateName(name) && isAuthenticated;

  return (
    <div className="h-full flex flex-col bg-slate-900 min-h-screen">
      <ContextualHeader
        title="Nouvelle League"
        showBackButton={true}
        onBack={() => navigate("/leagues")}
      />

      {/* Contenu scrollable avec réserve pour CTA sticky (design-system 5.3) */}
      <div className="flex-grow overflow-y-auto p-4 md:p-6 pb-24">
        <form
          id="create-league-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-6"
          noValidate
        >
          {/* Nom de la ligue - AC2: Fields with labels, inline validation */}
          <div className="space-y-2">
            <label
              htmlFor="league-name"
              className="text-sm font-medium text-slate-400 block"
            >
              Nom de la ligue
            </label>
            <input
              id="league-name"
              type="text"
              value={name}
              maxLength={100}
              onChange={(e) => {
                setName(e.target.value);
                if (touched) setNameError(validateName(e.target.value));
              }}
              onBlur={handleNameBlur}
              placeholder="Ex: Soirée chez Tom, Ligue d'été..."
              className={`w-full bg-slate-800 border rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                nameError
                  ? "border-red-500 focus:ring-red-500/50"
                  : "border-slate-700 focus:ring-primary"
              }`}
              autoFocus
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "league-name-error" : undefined}
            />
            {nameError && (
              <p
                id="league-name-error"
                className="text-sm text-red-400"
                role="alert"
              >
                {nameError}
              </p>
            )}
          </div>

          {/* Type de compétition */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-400 block">
              Type de compétition
            </label>

            <button
              type="button"
              onClick={() => setType("event")}
              aria-pressed={type === "event"}
              className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${
                type === "event"
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  type === "event" ? "bg-primary text-white" : "bg-slate-700"
                }`}
              >
                <Calendar size={24} />
              </div>
              <div className="text-left">
                <div
                  className={`font-bold ${
                    type === "event" ? "text-primary" : "text-slate-300"
                  }`}
                >
                  League Continue
                </div>
                <div className="text-xs text-slate-400">
                  Classement persistant dans le temps.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType("season")}
              aria-pressed={type === "season"}
              className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${
                type === "season"
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  type === "season" ? "bg-primary text-white" : "bg-slate-700"
                }`}
              >
                <Trophy size={24} />
              </div>
              <div className="text-left">
                <div
                  className={`font-bold ${
                    type === "season" ? "text-primary" : "text-slate-300"
                  }`}
                >
                  League par Saison
                </div>
                <div className="text-xs text-slate-400">
                  Classement par saison avec reset périodique.
                </div>
              </div>
            </button>
          </div>
        </form>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            if (isAuthenticated) {
              setShowAuthModal(false);
            } else {
              navigate("/");
            }
          }}
          onSuccess={() => {
            setShowAuthModal(false);
          }}
        />

        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            refetchPremium();
            setShowPaymentModal(false);
          }}
          title="Limite gratuite atteinte"
          subtitle="Passez Premium pour créer des ligues illimitées !"
        />
      </div>

      {/* CTA sticky */}
      <div className="fixed bottom-16 inset-x-0 z-30 bg-slate-900 border-t border-slate-800 p-4 md:p-6">
        <Button
          type="submit"
          form="create-league-form"
          disabled={!isFormValid || isSubmitting}
          loading={isSubmitting}
          fullWidth
          size="lg"
          variant={isAtLeagueLimit ? "premium" : "primary"}
        >
          {!isAuthenticated
            ? "CONNEXION REQUISE"
            : isAtLeagueLimit
              ? "PASSER PREMIUM POUR CRÉER"
              : "C'EST PARTI !"}
        </Button>
      </div>
    </div>
  );
};
