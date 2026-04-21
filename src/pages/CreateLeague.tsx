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
import { AuthModal } from "@/components/AuthModal";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { ScreenLayout } from "@/components/design-system";
import { Trophy, Calendar } from "lucide-react";
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
            ? "bg-cup-red/10 border-cup-red"
            : "bg-paper border-card hover:border-card-muted"
        }`}
      >
        <div
          className={`p-2 rounded-md ${active ? "bg-cup-red text-ink" : "bg-cream-deep text-ink-soft"}`}
        >
          {icon}
        </div>
        <div className="text-left">
          <div
            className={`font-archivo font-extrabold uppercase tracking-tight ${active ? "text-cup-red" : "text-ink"}`}
          >
            {title}
          </div>
          <div className="text-xs text-ink-soft mt-0.5">{description}</div>
        </div>
      </button>
    );
  };

  return (
    <ScreenLayout
      header={
        <ContextualHeader
          title="Nouvelle League"
          showBackButton={true}
          onBack={() => navigate("/leagues")}
        />
      }
      maxWidth="narrow"
      contentClassName="pb-44"
      overlay={
        <>
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
          <div className="fixed bottom-16 inset-x-0 z-30 bg-cream border-t border-card p-4 md:p-6">
            <div className="max-w-[720px] mx-auto">
              <button
                type="submit"
                form="create-league-form"
                disabled={!isFormValid || isSubmitting}
                className="w-full bg-cup-red text-ink border-[1.5px] border-cup-red-deep shadow-[0_3px_0_#C42418] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#C42418] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:shadow-none font-archivo font-bold uppercase tracking-tight py-4 rounded-full transition-[transform,box-shadow,filter] duration-75"
              >
                {!isAuthenticated
                  ? "Connexion requise"
                  : isSubmitting
                    ? "Création…"
                    : "C'est parti !"}
              </button>
            </div>
          </div>
        </>
      }
    >
      <form
        id="create-league-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-6"
        noValidate
      >
        <div className="space-y-2">
          <label
            htmlFor="league-name"
            className="text-xs font-archivo font-extrabold uppercase tracking-[0.6px] text-ink-soft block"
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
            className={`w-full bg-paper border-[1.5px] rounded-md p-4 text-ink placeholder-ink-mute focus:outline-none focus:ring-2 transition-colors ${
              nameError
                ? "border-ruby focus:ring-ruby/30"
                : "border-card focus:border-lime focus:ring-lime/20"
            }`}
            autoFocus
            aria-invalid={!!nameError}
            aria-describedby={nameError ? "league-name-error" : undefined}
          />
          {nameError && (
            <p
              id="league-name-error"
              className="text-sm text-ruby"
              role="alert"
            >
              {nameError}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <span className="text-xs font-archivo font-extrabold uppercase tracking-[0.6px] text-ink-soft block">
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
    </ScreenLayout>
  );
};
