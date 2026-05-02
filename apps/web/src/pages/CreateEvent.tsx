/**
 * CreateEvent Page — Everything ELO refonte (Phase 2)
 *
 * Event creation form aligné DS Everything ELO :
 * - PageHero (titre éditorial) au lieu de ContextualHeader sticky
 * - Premium banner mis en avant avec couronne (upgrade urgency)
 * - Sélecteur Type d'événement (ELO vs Bracket)
 * - Sticky bottom CTA (pattern page Rejoindre) — pas de divider
 *
 * Règle freemium : 2 événements gratuits, puis Premium.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { useIdentity } from "@/hooks/useIdentity";
import { useLeague } from "@/context/LeagueContext";
import { premiumService } from "@/services/PremiumService";
import { databaseService } from "@/services/DatabaseService";
import { generateEventCode } from "@/utils/eventCode";
import { PaymentModal } from "@/components/PaymentModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PageHero, StickyCTA } from "@/components/design-system";
import toast from "react-hot-toast";
import { Crown, ChevronRight, Trophy, Target, X } from "lucide-react";
import { PButton } from "@/components/ponglo/PButton";

/** Value used for "unlimited" players when hasPlayerLimit is false (design-system) */
const UNLIMITED_PLAYERS = 999;

/** Premium price for display (e.g. limit-reached modal) */
const PREMIUM_PRICE = '3€';

interface FormatOption {
  value: '2v2' | '1v1' | 'libre';
  label: string;
  description: string;
  formatType: 'fixed' | 'free';
  team1Size: number | null;
  team2Size: number | null;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: '2v2',
    label: '2v2 Strict',
    description: 'Équipes de 2 joueurs',
    formatType: 'fixed',
    team1Size: 2,
    team2Size: 2,
  },
  {
    value: '1v1',
    label: '1v1 Strict',
    description: 'Duel individuel',
    formatType: 'fixed',
    team1Size: 1,
    team2Size: 1,
  },
  {
    value: 'libre',
    label: 'Libre',
    description: 'Équipes flexibles (1v2, 2v3...)',
    formatType: 'free',
    team1Size: null,
    team2Size: null,
  },
];

interface ModeOption {
  value: 'elo' | 'bracket';
  label: string;
  description: string;
  icon: React.ReactNode;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'elo',
    label: 'ELO',
    description: 'Classement évolutif, tous les matchs comptent.',
    icon: <Target size={22} />,
  },
  {
    value: 'bracket',
    label: 'Bracket',
    description: 'Élimination directe, un vainqueur au bout.',
    icon: <Trophy size={22} />,
  },
];

interface CreateEventProps {
  /** Skip premium check (testing only) — bypasses loading state */
  skipPremiumCheck?: boolean;
}

export const CreateEvent = ({ skipPremiumCheck = false }: CreateEventProps = {}) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { localUser } = useIdentity();
  const { reloadData, addAnonymousPlayerToEvent } = useLeague();

  // Premium status and limits
  const [isLoadingPremium, setIsLoadingPremium] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [canCreate, setCanCreate] = useState(false);
  const [remainingEvents, setRemainingEvents] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [format, setFormat] = useState<'2v2' | '1v1' | 'libre'>('2v2');
  const [mode, setMode] = useState<'elo' | 'bracket'>('elo');
  const [hasPlayerLimit, setHasPlayerLimit] = useState(false);
  const [playerLimit, setPlayerLimit] = useState<string>("16");
  const [isPrivate, setIsPrivate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Limit modal: ref for focus trap
  const limitModalRef = useRef<HTMLDivElement>(null);

  const checkPremiumStatus = useCallback(async () => {
    setIsLoadingPremium(true);

    try {
      const userId = user?.id || null;
      const anonymousUserId = localUser?.anonymousUserId || null;

      const premiumStatus = await premiumService.isPremium(userId, anonymousUserId);
      setIsPremium(premiumStatus);

      const count = await premiumService.getEventCount(userId, anonymousUserId);
      setEventCount(count);

      const result = await premiumService.canCreateEvent(userId, anonymousUserId);
      setCanCreate(result.allowed);
      setRemainingEvents(result.remaining || 0);
    } catch (error) {
      console.error('Error checking premium status:', error);
      toast.error('Erreur lors de la vérification du statut premium');
    } finally {
      setIsLoadingPremium(false);
    }
  }, [user?.id, localUser?.anonymousUserId]);

  useEffect(() => {
    if (skipPremiumCheck) {
      setIsLoadingPremium(false);
      setIsPremium(false);
      setCanCreate(true);
      setRemainingEvents(2);
      return;
    }
    checkPremiumStatus();
  }, [skipPremiumCheck, checkPremiumStatus]);

  // Limit modal: Escape key closes, focus trap when open
  const showLimitReachedModal = !canCreate;
  useEffect(() => {
    if (!showLimitReachedModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        navigate("/");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLimitReachedModal, navigate]);

  useEffect(() => {
    if (!showLimitReachedModal || !limitModalRef.current) return;
    const firstFocusable = limitModalRef.current.querySelector<HTMLElement>(
      'button[aria-label="Fermer"], button'
    );
    firstFocusable?.focus();
  }, [showLimitReachedModal]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Le nom de l'événement est requis";
    } else if (name.length > 50) {
      newErrors.name = 'Le nom ne peut pas dépasser 50 caractères';
    }

    if (!date) {
      newErrors.date = "La date de l'événement est requise";
    }

    if (hasPlayerLimit) {
      const limitNum = parseInt(playerLimit);
      if (!playerLimit || isNaN(limitNum) || limitNum < 2) {
        newErrors.playerLimit = 'Au moins 2 joueurs requis';
      } else if (limitNum > 100) {
        newErrors.playerLimit = 'Maximum 100 joueurs';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateUniqueCode = async (): Promise<string> => {
    const maxAttempts = 10;
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      const code = generateEventCode();
      const exists = await databaseService.eventCodeExists(code);
      if (!exists) return code;
    }
    throw new Error('Impossible de générer un code unique. Réessayez.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    if (!canCreate) {
      toast.error('Limite d\'événements atteinte. Passez Premium pour créer sans limite !');
      setShowPaymentModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const joinCode = await generateUniqueCode();
      const selectedFormat = FORMAT_OPTIONS.find(f => f.value === format)!;
      const maxPlayersValue = hasPlayerLimit ? parseInt(playerLimit) : null;

      const eventId = await databaseService.createEvent({
        name: name.trim(),
        joinCode,
        formatType: selectedFormat.formatType,
        team1Size: selectedFormat.team1Size,
        team2Size: selectedFormat.team2Size,
        maxPlayers: maxPlayersValue || UNLIMITED_PLAYERS,
        isPrivate,
        mode,
        date,
        creatorUserId: user?.id || null,
        creatorAnonymousUserId: localUser?.anonymousUserId || null,
      });

      const creatorPseudo =
        localUser?.pseudo?.trim() ||
        (user?.user_metadata?.name as string | undefined) ||
        'Joueur';
      try {
        await addAnonymousPlayerToEvent(eventId, creatorPseudo);
      } catch (err) {
        console.error('Auto-add creator to event failed:', err);
      }

      toast.success('Événement créé ! 🎉');
      await reloadData();
      navigate(`/event/${eventId}`);
    } catch (error) {
      console.error('Error creating event:', error);
      const message =
        error instanceof Error && error.message.includes('code unique')
          ? error.message
          : "Erreur lors de la création de l'événement";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingPremium) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-white text-center">
          <LoadingSpinner size={48} />
          <p className="mt-4 font-archivo font-extrabold uppercase tracking-tight">
            Vérification du statut…
          </p>
        </div>
      </div>
    );
  }

  const toggleClass = (on: boolean) =>
    `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      on ? "bg-electric-blue" : "bg-navy-deep border border-card"
    }`;
  const toggleKnob = (on: boolean) =>
    `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
      on ? "translate-x-6" : "translate-x-1"
    }`;
  const fieldInputClass = (hasError: boolean) =>
    `w-full bg-navy-soft border-[1.5px] rounded-md p-4 text-white placeholder-cool-gray focus:outline-none focus:ring-2 transition-colors ${
      hasError
        ? "border-signal-red focus:ring-signal-red/30"
        : "border-card focus:border-lime focus:ring-lime/20"
    }`;

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col relative">
      {/* Content wrapper (max-width narrow, sticky CTA compensated with pb-[160px]) */}
      <div className="flex-1 max-w-[720px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-[160px]">
        <PageHero
          eyebrow="Nouvel événement"
          title={<>Crée ton<br />événement.</>}
          onBack={() => navigate("/competitions?tab=events")}
        />

        {/* Premium banner — "X restant sur N" + CTA secondaire flèche */}
        {!isPremium && (
          <div
            className="w-full bg-gradient-to-br from-ping-yellow/20 via-ping-yellow/10 to-ping-yellow/5 border-2 border-ping-yellow/50 rounded-card p-4 mb-6 flex items-center gap-4"
            role="region"
            aria-label="Statut Premium"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-ping-yellow/25 flex items-center justify-center">
              <Crown size={24} className="text-ping-yellow" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-archivo font-extrabold uppercase tracking-tight text-base leading-tight">
                <span className="text-ping-yellow text-2xl">
                  {remainingEvents}
                </span>{" "}
                <span className="text-white">
                  événement{remainingEvents > 1 ? "s" : ""} restant
                  {remainingEvents > 1 ? "s" : ""} sur 2
                </span>
              </div>
              <p className="text-white/70 text-sm mt-0.5">
                Passe{" "}
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  className="inline-flex items-center gap-0.5 text-ping-yellow font-archivo font-extrabold uppercase tracking-tight underline-offset-2 hover:underline"
                >
                  Premium
                  <ChevronRight size={14} className="-mr-1" />
                </button>{" "}
                pour des événements illimités — {PREMIUM_PRICE}
              </p>
            </div>
          </div>
        )}

        {isPremium && (
          <div className="bg-ping-yellow/15 border border-ping-yellow/40 rounded-card p-4 mb-6 flex items-center gap-3">
            <Crown size={20} className="text-ping-yellow flex-shrink-0" />
            <p className="text-ping-yellow text-sm font-archivo font-extrabold uppercase tracking-tight">
              Événements illimités — Premium actif
            </p>
          </div>
        )}

        {!showLimitReachedModal && (
          <form
            id="create-event-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
            noValidate
          >
            {/* Nom */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-xs font-archivo font-extrabold uppercase tracking-[0.6px] text-cool-gray block"
              >
                Nom de l'événement *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => validateForm()}
                placeholder="Ex: Summer Cup 2026"
                className={fieldInputClass(!!errors.name)}
                maxLength={50}
                autoFocus
                aria-label="Nom de l'événement"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-signal-red" role="alert">
                  {errors.name}
                </p>
              )}
              <p className="text-cool-gray text-xs font-mono">
                {name.length}/50 caractères
              </p>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label
                htmlFor="date"
                className="text-xs font-archivo font-extrabold uppercase tracking-[0.6px] text-cool-gray block"
              >
                Date de l'événement *
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onBlur={() => validateForm()}
                className={`${fieldInputClass(!!errors.date)} appearance-none min-w-0 box-border`}
                aria-label="Date de l'événement"
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? "date-error" : undefined}
              />
              {errors.date && (
                <p id="date-error" className="text-sm text-signal-red" role="alert">
                  {errors.date}
                </p>
              )}
            </div>

            {/* Format du match */}
            <div className="space-y-2">
              <span className="text-xs font-archivo font-extrabold uppercase tracking-[0.6px] text-cool-gray block">
                Format du match *
              </span>
              <div className="space-y-2">
                {FORMAT_OPTIONS.map((option) => {
                  const active = format === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-4 rounded-card border cursor-pointer transition-colors ${
                        active
                          ? "border-electric-blue bg-electric-blue/10"
                          : "border-card bg-navy-soft hover:border-card-muted"
                      }`}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={option.value}
                        checked={active}
                        onChange={(e) =>
                          setFormat(
                            e.target.value as "2v2" | "1v1" | "libre",
                          )
                        }
                        className="mt-1 accent-electric-blue"
                      />
                      <div className="flex-1">
                        <div className="text-white font-archivo font-extrabold uppercase tracking-tight">
                          {option.label}
                        </div>
                        <div className="text-cool-gray text-sm">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Type d'événement — ELO vs Bracket */}
            <div className="space-y-2">
              <span className="text-xs font-archivo font-extrabold uppercase tracking-[0.6px] text-cool-gray block">
                Type d'événement *
              </span>
              <div className="grid grid-cols-2 gap-2">
                {MODE_OPTIONS.map((option) => {
                  const active = mode === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMode(option.value)}
                      aria-pressed={active}
                      className={`p-4 rounded-card border text-left transition-colors ${
                        active
                          ? "border-electric-blue bg-electric-blue/10"
                          : "border-card bg-navy-soft hover:border-card-muted"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-md flex items-center justify-center mb-3 ${
                          active
                            ? "bg-electric-blue text-white"
                            : "bg-navy-deep text-cool-gray"
                        }`}
                      >
                        {option.icon}
                      </div>
                      <div
                        className={`font-archivo font-extrabold uppercase tracking-tight ${
                          active ? "text-electric-blue" : "text-white"
                        }`}
                      >
                        {option.label}
                      </div>
                      <div className="text-cool-gray text-xs mt-1">
                        {option.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Limite joueurs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-navy-soft border border-card rounded-card">
                <div className="flex-1">
                  <div className="text-white font-archivo font-extrabold uppercase tracking-tight">
                    Limiter le nombre de joueurs
                  </div>
                  <div className="text-cool-gray text-sm mt-1">
                    Par défaut : aucune limite
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHasPlayerLimit(!hasPlayerLimit);
                    if (!hasPlayerLimit) setPlayerLimit("16");
                  }}
                  className={toggleClass(hasPlayerLimit)}
                  aria-label="Limiter le nombre de joueurs"
                >
                  <span className={toggleKnob(hasPlayerLimit)} />
                </button>
              </div>

              {hasPlayerLimit && (
                <div className="space-y-2">
                  <label
                    htmlFor="playerLimit"
                    className="text-xs font-archivo font-extrabold uppercase tracking-[0.6px] text-cool-gray block"
                  >
                    Nombre maximum de joueurs *
                  </label>
                  <input
                    id="playerLimit"
                    type="number"
                    value={playerLimit}
                    onChange={(e) => setPlayerLimit(e.target.value)}
                    onBlur={() => validateForm()}
                    placeholder="Ex: 16"
                    min={2}
                    max={100}
                    className={fieldInputClass(!!errors.playerLimit)}
                    aria-label="Nombre maximum de joueurs"
                    aria-invalid={!!errors.playerLimit}
                    aria-describedby={
                      errors.playerLimit ? "playerLimit-error" : undefined
                    }
                  />
                  {errors.playerLimit && (
                    <p
                      id="playerLimit-error"
                      className="text-sm text-signal-red"
                      role="alert"
                    >
                      {errors.playerLimit}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Privé */}
            <div className="flex items-center justify-between p-4 bg-navy-soft border border-card rounded-card">
              <div className="flex-1">
                <div className="text-white font-archivo font-extrabold uppercase tracking-tight">
                  🔒 Événement privé
                </div>
                <div className="text-cool-gray text-sm mt-1">
                  Seuls ceux qui ont le code peuvent rejoindre
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={toggleClass(isPrivate)}
                aria-label="Événement privé"
              >
                <span className={toggleKnob(isPrivate)} />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Sticky bottom CTA — DS primitive */}
      {!showLimitReachedModal && (
        <StickyCTA>
          <PButton
            type="submit"
            form="create-event-form"
            variant="primary"
            size="lg"
            full
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting ? "Création…" : "Créer l'événement"}
          </PButton>
        </StickyCTA>
      )}

      {/* Limit reached modal */}
      {showLimitReachedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="limit-modal-title"
        >
          <div
            ref={limitModalRef}
            className="bg-navy-soft rounded-card p-6 border border-card max-w-md w-full relative shadow-modal"
          >
            <button
              onClick={() => navigate("/")}
              className="absolute top-4 right-4 text-cool-gray hover:text-white transition-colors p-1"
              aria-label="Fermer"
            >
              <X size={24} />
            </button>
            <div className="w-14 h-14 rounded-full bg-ping-yellow/20 flex items-center justify-center mb-4">
              <Crown size={28} className="text-ping-yellow" />
            </div>
            <h2
              id="limit-modal-title"
              className="text-2xl font-archivo font-extrabold uppercase tracking-tight text-white mb-4 pr-10"
            >
              Limite atteinte
            </h2>
            <p className="text-cool-gray mb-6">
              Tu as créé {eventCount} événement
              {eventCount > 1 ? "s" : ""}. Passe Premium pour créer des
              événements illimités !
            </p>
            <div className="flex flex-col gap-3">
              <PButton
                variant="tertiary"
                size="lg"
                full
                onClick={() => setShowPaymentModal(true)}
              >
                ✨ Passer Premium — {PREMIUM_PRICE}
              </PButton>
              <PButton
                variant="ghost"
                size="md"
                full
                onClick={() => navigate("/")}
              >
                Plus tard
              </PButton>
            </div>
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </div>
  );
};
