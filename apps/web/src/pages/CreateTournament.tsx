/**
 * CreateTournament Page - Story 14.19
 *
 * Tournament creation form aligned with design system (design-system-convergence 5.3).
 * - Header: title + back
 * - Fields with labels, inline validation
 * - Primary CTA sticky at bottom
 * - Matches Frame 10
 *
 * Also: Freemium limit enforcement, unique code generation, QR code for sharing.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { useIdentity } from "@/hooks/useIdentity";
import { useLeague } from "@/context/LeagueContext";
import { premiumService } from "@/services/PremiumService";
import { databaseService } from "@/services/DatabaseService";
import { generateTournamentCode } from "@/utils/tournamentCode";
import { PaymentModal } from "@/components/PaymentModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { ScreenLayout } from "@/components/design-system";
import toast from "react-hot-toast";
import { Info, X } from "lucide-react";

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

interface CreateTournamentProps {
  /** Skip premium check (testing only) — bypasses loading state */
  skipPremiumCheck?: boolean;
}

export const CreateTournament = ({ skipPremiumCheck = false }: CreateTournamentProps = {}) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { localUser } = useIdentity();
  const { reloadData } = useLeague();
  
  // Premium status and limits
  const [isLoadingPremium, setIsLoadingPremium] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [tournamentCount, setTournamentCount] = useState(0);
  const [canCreate, setCanCreate] = useState(false);
  const [remainingTournaments, setRemainingTournaments] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [format, setFormat] = useState<'2v2' | '1v1' | 'libre'>('2v2');
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
      
      // Get premium status
      const premiumStatus = await premiumService.isPremium(userId, anonymousUserId);
      setIsPremium(premiumStatus);
      
      // Get tournament count
      const count = await premiumService.getTournamentCount(userId, anonymousUserId);
      setTournamentCount(count);
      
      // Check if can create
      const result = await premiumService.canCreateTournament(userId, anonymousUserId);
      setCanCreate(result.allowed);
      setRemainingTournaments(result.remaining || 0);
      
      // If limit reached, show LimitReached modal (design-system 6.2) — no toast, no auto-redirect
      if (!result.allowed) {
        // Modal with Passer à Premium / Plus tard will be shown
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
      toast.error('Erreur lors de la vérification du statut premium');
    } finally {
      setIsLoadingPremium(false);
    }
  }, [user?.id, localUser?.anonymousUserId]);

  // Check premium status and limits on mount (skip when skipPremiumCheck for testing)
  useEffect(() => {
    if (skipPremiumCheck) {
      setIsLoadingPremium(false);
      setIsPremium(false);
      setCanCreate(true);
      setRemainingTournaments(2);
      return;
    }
    checkPremiumStatus();
  }, [skipPremiumCheck, checkPremiumStatus]);

  // Limit modal: Escape key closes (UX spec), focus trap when open
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
    
    // Name required and max 50 chars (AC2, AC3)
    if (!name.trim()) {
      newErrors.name = 'Le nom du tournoi est requis';
    } else if (name.length > 50) {
      newErrors.name = 'Le nom ne peut pas dépasser 50 caractères';
    }
    
    // Player limit validation (required if toggle is ON, max 100)
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
      const code = generateTournamentCode();
      const exists = await databaseService.tournamentCodeExists(code);

      if (!exists) {
        return code;
      }
    }

    // DB constraint: join_code must be exactly 6 chars — no fallback to 8 chars
    throw new Error('Impossible de générer un code unique. Réessayez.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    // Double-check if can create (safeguard, AC8)
    if (!canCreate) {
      toast.error('Limite de tournois atteinte. Passez Premium pour créer sans limite !');
      setShowPaymentModal(true);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate unique tournament code (AC4)
      const joinCode = await generateUniqueCode();
      
      // Get selected format configuration
      const selectedFormat = FORMAT_OPTIONS.find(f => f.value === format)!;
      
      // Create tournament in database (AC6)
      const maxPlayersValue = hasPlayerLimit ? parseInt(playerLimit) : null;
      const tournamentId = await databaseService.createTournament({
        name: name.trim(),
        joinCode,
        formatType: selectedFormat.formatType,
        team1Size: selectedFormat.team1Size,
        team2Size: selectedFormat.team2Size,
        maxPlayers: maxPlayersValue || UNLIMITED_PLAYERS,
        isPrivate,
        creatorUserId: user?.id || null,
        creatorAnonymousUserId: localUser?.anonymousUserId || null,
      });
      
      // Success toast (AC7)
      toast.success('Tournoi créé ! 🎉');
      
      // Reload context data to include the new tournament (AC7)
      await reloadData();
      
      // Navigate to tournament dashboard (AC7)
      navigate(`/tournament/${tournamentId}`);
    } catch (error) {
      console.error('Error creating tournament:', error);
      const message =
        error instanceof Error && error.message.includes('code unique')
          ? error.message
          : 'Erreur lors de la création du tournoi';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingPremium) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-ink text-center">
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
      on ? "bg-cup-red" : "bg-cream-deep border border-card"
    }`;
  const toggleKnob = (on: boolean) =>
    `inline-block h-4 w-4 transform rounded-full bg-ink transition-transform ${
      on ? "translate-x-6" : "translate-x-1"
    }`;
  const fieldInputClass = (hasError: boolean) =>
    `w-full bg-paper border-[1.5px] rounded-md p-4 text-ink placeholder-ink-mute focus:outline-none focus:ring-2 transition-colors ${
      hasError
        ? "border-ruby focus:ring-ruby/30"
        : "border-card focus:border-lime focus:ring-lime/20"
    }`;

  return (
    <ScreenLayout
      header={
        <ContextualHeader
          title="Créer un Tournoi"
          showBackButton={true}
          onBack={() => navigate("/")}
        />
      }
      maxWidth="narrow"
      contentClassName="pb-44"
      overlay={
        <>
          {showLimitReachedModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="limit-modal-title"
            >
              <div
                ref={limitModalRef}
                className="bg-paper rounded-card p-6 border border-card max-w-md w-full relative shadow-modal"
              >
                <button
                  onClick={() => navigate("/")}
                  className="absolute top-4 right-4 text-ink-soft hover:text-ink transition-colors p-1"
                  aria-label="Fermer"
                >
                  <X size={24} />
                </button>
                <h2
                  id="limit-modal-title"
                  className="text-2xl font-archivo font-extrabold uppercase tracking-tight text-ink mb-4 pr-10"
                >
                  Limite atteinte
                </h2>
                <p className="text-ink-soft mb-6">
                  Tu as créé {tournamentCount} tournoi
                  {tournamentCount > 1 ? "s" : ""}. Passe Premium pour créer des
                  tournois illimités !
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full bg-gold text-cream border-[1.5px] border-[#C08800] shadow-[0_3px_0_#C08800] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#C08800] font-archivo font-bold uppercase tracking-tight py-3 rounded-full transition-[transform,box-shadow,filter] duration-75"
                  >
                    ✨ Passer Premium — {PREMIUM_PRICE}
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="w-full bg-paper text-ink border-[1.5px] border-card hover:border-card-muted font-archivo font-bold uppercase tracking-tight py-3 rounded-full transition-colors"
                  >
                    Plus tard
                  </button>
                </div>
              </div>
            </div>
          )}

          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
          />

          {!showLimitReachedModal && (
            <div className="fixed bottom-16 inset-x-0 z-20 bg-cream border-t border-card p-4 md:p-6">
              <div className="max-w-[720px] mx-auto">
                <button
                  type="submit"
                  form="create-tournament-form"
                  disabled={!name.trim() || isSubmitting}
                  className="w-full bg-cup-red text-ink border-[1.5px] border-cup-red-deep shadow-[0_3px_0_#C42418] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#C42418] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:shadow-none font-archivo font-bold uppercase tracking-tight py-4 rounded-full transition-[transform,box-shadow,filter] duration-75"
                >
                  {isSubmitting ? "Création…" : "Créer le tournoi"}
                </button>
              </div>
            </div>
          )}
        </>
      }
    >
      {!isPremium && (
        <div className="bg-paper border border-card rounded-card p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-cup-blue flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-ink text-sm font-archivo font-extrabold uppercase tracking-tight">
                {remainingTournaments} tournoi
                {remainingTournaments > 1 ? "s" : ""} restant
                {remainingTournaments > 1 ? "s" : ""} sur 2 (gratuit)
              </p>
              <p className="text-ink-soft text-xs mt-1">
                Passe Premium pour créer des tournois illimités
              </p>
            </div>
          </div>
        </div>
      )}

      {isPremium && (
        <div className="bg-gold/15 border border-gold/40 rounded-card p-4 mb-6">
          <p className="text-gold text-sm font-archivo font-extrabold uppercase tracking-tight flex items-center gap-2">
            <span>✨</span>
            Tournois illimités — Premium actif
          </p>
        </div>
      )}

      {!showLimitReachedModal && (
        <form
          id="create-tournament-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-6"
          noValidate
        >
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-xs font-archivo font-extrabold uppercase tracking-[0.6px] text-ink-soft block"
            >
              Nom du tournoi *
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
              aria-label="Nom du tournoi"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-ruby" role="alert">
                {errors.name}
              </p>
            )}
            <p className="text-ink-mute text-xs font-mono">
              {name.length}/50 caractères
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-archivo font-extrabold uppercase tracking-[0.6px] text-ink-soft block">
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
                        ? "border-cup-red bg-cup-red/10"
                        : "border-card bg-paper hover:border-card-muted"
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
                      className="mt-1 accent-cup-red"
                    />
                    <div className="flex-1">
                      <div className="text-ink font-archivo font-extrabold uppercase tracking-tight">
                        {option.label}
                      </div>
                      <div className="text-ink-soft text-sm">
                        {option.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-paper border border-card rounded-card">
              <div className="flex-1">
                <div className="text-ink font-archivo font-extrabold uppercase tracking-tight">
                  Limiter le nombre de joueurs
                </div>
                <div className="text-ink-soft text-sm mt-1">
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
                  className="text-xs font-archivo font-extrabold uppercase tracking-[0.6px] text-ink-soft block"
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
                    className="text-sm text-ruby"
                    role="alert"
                  >
                    {errors.playerLimit}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-paper border border-card rounded-card">
            <div className="flex-1">
              <div className="text-ink font-archivo font-extrabold uppercase tracking-tight">
                🔒 Tournoi privé
              </div>
              <div className="text-ink-soft text-sm mt-1">
                Seuls ceux qui ont le code peuvent rejoindre
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={toggleClass(isPrivate)}
              aria-label="Tournoi privé"
            >
              <span className={toggleKnob(isPrivate)} />
            </button>
          </div>
        </form>
      )}
    </ScreenLayout>
  );
};
