/**
 * CreateLeague Page — Everything ELO refonte (Phase 3)
 *
 * Ligue creation form aligné DS Everything ELO :
 * - PageHero (titre éditorial) au lieu de ContextualHeader sticky
 * - Sticky bottom CTA (pattern page Rejoindre) — pas de divider
 *
 * Les ligues ne sont pas limitées par le freemium (pas de banner Premium ici).
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLeague } from "@/context/LeagueContext";
import { useAuthContext } from "@/context/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { PageHero, StickyCTA } from "@/components/design-system";
import { Trophy, Calendar } from "lucide-react";
import { PButton } from "@/components/ponglo/PButton";
import toast from "react-hot-toast";

export const CreateLeague = () => {
  const [name, setName] = useState("");
  const [type, setType] = useState<"event" | "season">("event");
  const [nameError, setNameError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const { createLeague } = useLeague();
  const { isAuthenticated, isLoading } = useAuthContext();
  const [showAuthModal, setShowAuthModal] = useState(false);
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

  const typeOption = (
    value: "event" | "season",
    icon: React.ReactNode,
    title: string,
    description: string,
  ) => {
    const active = type === value;
    return (
      <button
        type="button"
        onClick={() => setType(value)}
        aria-pressed={active}
        className={`w-full p-4 rounded-card border flex items-center gap-4 transition-colors ${
          active
            ? "bg-electric-blue/10 border-electric-blue"
            : "bg-navy-soft border-card hover:border-card-muted"
        }`}
      >
        <div
          className={`p-2 rounded-md ${active ? "bg-electric-blue text-white" : "bg-navy-deep text-cool-gray"}`}
        >
          {icon}
        </div>
        <div className="text-left">
          <div
            className={`font-archivo font-extrabold uppercase tracking-tight ${active ? "text-electric-blue" : "text-white"}`}
          >
            {title}
          </div>
          <div className="text-xs text-cool-gray mt-0.5">{description}</div>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col relative">
      <div className="flex-1 max-w-[720px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-[160px]">
        <PageHero
          eyebrow="Nouvelle ligue"
          title={<>Crée ta<br />ligue.</>}
          onBack={() => navigate("/competitions?tab=leagues")}
        />

        <form
          id="create-league-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-6"
          noValidate
        >
          <div className="space-y-2">
            <label
              htmlFor="league-name"
              className="text-xs font-archivo font-extrabold uppercase tracking-[0.6px] text-cool-gray block"
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
              className={`w-full bg-navy-soft border-[1.5px] rounded-md p-4 text-white placeholder-cool-gray focus:outline-none focus:ring-2 transition-colors ${
                nameError
                  ? "border-signal-red focus:ring-signal-red/30"
                  : "border-card focus:border-lime focus:ring-lime/20"
              }`}
              autoFocus
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "league-name-error" : undefined}
            />
            {nameError && (
              <p
                id="league-name-error"
                className="text-sm text-signal-red"
                role="alert"
              >
                {nameError}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <span className="text-xs font-archivo font-extrabold uppercase tracking-[0.6px] text-cool-gray block">
              Type de compétition
            </span>
            {typeOption(
              "event",
              <Calendar size={24} />,
              "League Continue",
              "Classement persistant dans le temps.",
            )}
            {typeOption(
              "season",
              <Trophy size={24} />,
              "League par Saison",
              "Classement par saison avec reset périodique.",
            )}
          </div>
        </form>
      </div>

      {/* Sticky bottom CTA — DS primitive */}
      <StickyCTA>
        <PButton
          type="submit"
          form="create-league-form"
          variant="primary"
          size="lg"
          full
          disabled={!isFormValid || isSubmitting}
        >
          {!isAuthenticated
            ? "Connexion requise"
            : isSubmitting
              ? "Création…"
              : "C'est parti !"}
        </PButton>
      </StickyCTA>

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
    </div>
  );
};
