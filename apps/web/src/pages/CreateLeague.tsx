/**
 * CreateLeague Page — Everything ELO refonte + mig 029.
 *
 * Formulaire de création complet avec :
 *   - nom + type (one-shot / season)
 *   - date de démarrage (gate not_started si futur, mig 028+029)
 *   - date de fin prévue (optionnelle, rappel informationnel)
 *   - durée d'une saison (si type=season, défaut 90 j, min 7)
 *   - format de match par défaut (pré-rempli RecordMatch)
 *   - limite de joueurs (toggle)
 *   - privée (parité events, défaut ON)
 *   - anti-cheat (toggle, défaut OFF)
 *
 * La création de league est réservée Premium : si un user non-premium atterrit
 * ici (URL directe, deep link…), on affiche le PaymentModal en garde-fou.
 */

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLeague, type CreateLeagueInput } from "@/context/LeagueContext";
import { useAuthContext } from "@/context/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { PaymentModal } from "@/components/PaymentModal";
import { usePremiumLimits } from "@/hooks/usePremiumLimits";
import { PageHero, StickyCTA } from "@/components/design-system";
import { Trophy, Calendar } from "lucide-react";
import { PButton } from "@/components/ponglo/PButton";
import toast from "react-hot-toast";

type LeagueType = "one-shot" | "season";
type MatchFormat = "1v1" | "2v2" | "3v3" | "libre";

interface FormatOption {
  value: MatchFormat;
  label: string;
  description: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { value: "libre", label: "Libre", description: "Équipes flexibles, choix au match" },
  { value: "1v1", label: "1v1", description: "Duel individuel" },
  { value: "2v2", label: "2v2", description: "Équipes de 2" },
  { value: "3v3", label: "3v3", description: "Équipes de 3" },
];

const SEASON_DURATION_DEFAULT_DAYS = 90;
const SEASON_DURATION_MIN_DAYS = 7;
const PLAYER_LIMIT_DEFAULT = 16;

const todayIso = () => new Date().toISOString().slice(0, 10);

export const CreateLeague = () => {
  // ── Form state ──────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [type, setType] = useState<LeagueType>("one-shot");
  const [startDate, setStartDate] = useState<string>(todayIso);
  const [endDate, setEndDate] = useState<string>("");
  const [seasonDuration, setSeasonDuration] = useState<string>(
    String(SEASON_DURATION_DEFAULT_DAYS),
  );
  const [defaultFormat, setDefaultFormat] = useState<MatchFormat>("libre");
  const [hasPlayerLimit, setHasPlayerLimit] = useState(false);
  const [playerLimit, setPlayerLimit] = useState<string>(
    String(PLAYER_LIMIT_DEFAULT),
  );
  const [isPrivate, setIsPrivate] = useState(true);
  const [antiCheat, setAntiCheat] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);

  const { createLeague } = useLeague();
  const { isAuthenticated, isLoading } = useAuthContext();
  const {
    canCreateLeague,
    isPremiumLoading,
    refetchPremium,
  } = usePremiumLimits();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [isAuthenticated, isLoading]);

  // Garde Premium : si auth est chargé, premium statut connu et user non-premium,
  // on bloque l'accès au formulaire et on ouvre PaymentModal.
  const isLocked =
    !isLoading &&
    !isPremiumLoading &&
    isAuthenticated &&
    !canCreateLeague;

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = useMemo(
    () => (): Record<string, string> => {
      const next: Record<string, string> = {};
      const trimmed = name.trim();
      if (!trimmed) next.name = "Le nom est requis";
      else if (trimmed.length < 2)
        next.name = "Le nom doit contenir au moins 2 caractères";

      if (!startDate) next.startDate = "La date de démarrage est requise";

      if (endDate && startDate && endDate <= startDate) {
        next.endDate = "La date de fin doit être après la date de démarrage";
      }

      if (type === "season") {
        const dur = parseInt(seasonDuration, 10);
        if (!seasonDuration || Number.isNaN(dur))
          next.seasonDuration = "La durée d'une saison est requise";
        else if (dur < SEASON_DURATION_MIN_DAYS)
          next.seasonDuration = `Durée minimale : ${SEASON_DURATION_MIN_DAYS} jours`;
      }

      if (hasPlayerLimit) {
        const lim = parseInt(playerLimit, 10);
        if (!playerLimit || Number.isNaN(lim))
          next.playerLimit = "Renseigne une limite valide";
        else if (lim < 1) next.playerLimit = "La limite doit être ≥ 1";
      }

      return next;
    },
    [name, startDate, endDate, type, seasonDuration, hasPlayerLimit, playerLimit],
  );

  const runValidation = (): boolean => {
    const next = validate();
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!runValidation()) return;

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // Les dates côté input type="date" sont YYYY-MM-DD ; on convertit en
      // ISO datetime pour Postgres TIMESTAMPTZ.
      const toIsoDateTime = (day: string | null | undefined): string | null =>
        day ? new Date(`${day}T00:00:00.000Z`).toISOString() : null;

      const input: CreateLeagueInput = {
        name: name.trim(),
        type,
        plannedStartAt: toIsoDateTime(startDate),
        plannedEndAt: toIsoDateTime(endDate),
        seasonDurationDays:
          type === "season" ? parseInt(seasonDuration, 10) : null,
        maxPlayers: hasPlayerLimit ? parseInt(playerLimit, 10) : null,
        isPrivate,
        antiCheatEnabled: antiCheat,
        defaultFormat,
      };

      const newLeagueId = await createLeague(input);
      navigate(`/league/${newLeagueId}`);
    } catch (error) {
      console.error("Error creating league:", error);
      toast.error("Erreur lors de la création de la ligue");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-navy text-white">
        <PaymentModal
          isOpen
          onClose={() => navigate("/competitions?tab=leagues", { replace: true })}
          onSuccess={refetchPremium}
          title="Les ligues sont une fonctionnalité Premium"
          subtitle="Crée des ligues saisonnières ou continues, organise des championnats long-terme et débloque toutes les fonctionnalités avancées."
        />
      </div>
    );
  }

  // ── UI helpers ──────────────────────────────────────────────────────────
  const isFormValid =
    Object.keys(validate()).length === 0 && isAuthenticated;

  const fieldInputClass = (hasError: boolean) =>
    `w-full bg-navy-soft border-[1.5px] rounded-md p-4 text-white placeholder-cool-gray focus:outline-none focus:ring-2 transition-colors ${
      hasError
        ? "border-signal-red focus:ring-signal-red/30"
        : "border-card focus:border-lime focus:ring-lime/20"
    }`;

  const toggleClass = (on: boolean) =>
    `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      on ? "bg-electric-blue" : "bg-navy-deep border border-card"
    }`;
  const toggleKnob = (on: boolean) =>
    `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
      on ? "translate-x-6" : "translate-x-1"
    }`;

  const typeOption = (
    value: LeagueType,
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
          {/* Nom */}
          <div className="space-y-2">
            <label
              htmlFor="league-name"
              className="text-xs font-archivo font-extrabold uppercase tracking-[0.6px] text-cool-gray block"
            >
              Nom de la ligue *
            </label>
            <input
              id="league-name"
              type="text"
              value={name}
              maxLength={100}
              onChange={(e) => {
                setName(e.target.value);
                if (touched) runValidation();
              }}
              onBlur={() => {
                setTouched(true);
                runValidation();
              }}
              placeholder="Ex: Soirée chez Tom, Ligue d'été..."
              className={fieldInputClass(!!errors.name)}
              autoFocus
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "league-name-error" : undefined}
            />
            {errors.name && (
              <p
                id="league-name-error"
                className="text-sm text-signal-red"
                role="alert"
              >
                {errors.name}
              </p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-3">
            <span className="text-xs font-archivo font-extrabold uppercase tracking-[0.6px] text-cool-gray block">
              Type de compétition
            </span>
            {typeOption(
              "one-shot",
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

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="league-start-date"
                className="text-xs font-archivo font-extrabold uppercase tracking-[0.6px] text-cool-gray block"
              >
                Date de démarrage *
              </label>
              <input
                id="league-start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (touched) runValidation();
                }}
                className={`${fieldInputClass(!!errors.startDate)} appearance-none min-w-0 box-border`}
                aria-invalid={!!errors.startDate}
                aria-describedby={errors.startDate ? "start-date-error" : undefined}
              />
              {errors.startDate && (
                <p
                  id="start-date-error"
                  className="text-sm text-signal-red"
                  role="alert"
                >
                  {errors.startDate}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label
                htmlFor="league-end-date"
                className="text-xs font-archivo font-extrabold uppercase tracking-[0.6px] text-cool-gray block"
              >
                Date de fin prévue
              </label>
              <input
                id="league-end-date"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (touched) runValidation();
                }}
                placeholder="Facultatif"
                className={`${fieldInputClass(!!errors.endDate)} appearance-none min-w-0 box-border`}
                aria-invalid={!!errors.endDate}
                aria-describedby={errors.endDate ? "end-date-error" : undefined}
              />
              {errors.endDate && (
                <p
                  id="end-date-error"
                  className="text-sm text-signal-red"
                  role="alert"
                >
                  {errors.endDate}
                </p>
              )}
              <p className="text-cool-gray text-xs">
                Informationnel — rappel quand dépassée, pas d'auto-clôture.
              </p>
            </div>
          </div>

          {/* Durée d'une saison — visible uniquement type=season */}
          {type === "season" && (
            <div className="space-y-2">
              <label
                htmlFor="league-season-duration"
                className="text-xs font-archivo font-extrabold uppercase tracking-[0.6px] text-cool-gray block"
              >
                Durée d'une saison (jours) *
              </label>
              <input
                id="league-season-duration"
                type="number"
                value={seasonDuration}
                onChange={(e) => {
                  setSeasonDuration(e.target.value);
                  if (touched) runValidation();
                }}
                min={SEASON_DURATION_MIN_DAYS}
                placeholder={String(SEASON_DURATION_DEFAULT_DAYS)}
                className={fieldInputClass(!!errors.seasonDuration)}
                aria-invalid={!!errors.seasonDuration}
                aria-describedby={
                  errors.seasonDuration ? "season-duration-error" : undefined
                }
              />
              {errors.seasonDuration && (
                <p
                  id="season-duration-error"
                  className="text-sm text-signal-red"
                  role="alert"
                >
                  {errors.seasonDuration}
                </p>
              )}
              <p className="text-cool-gray text-xs">
                Informationnel — l'admin garde la main pour démarrer la saison suivante.
              </p>
            </div>
          )}

          {/* Format de match par défaut */}
          <div className="space-y-2">
            <span className="text-xs font-archivo font-extrabold uppercase tracking-[0.6px] text-cool-gray block">
              Format de match par défaut
            </span>
            <div className="space-y-2">
              {FORMAT_OPTIONS.map((option) => {
                const active = defaultFormat === option.value;
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
                      name="defaultFormat"
                      value={option.value}
                      checked={active}
                      onChange={(e) =>
                        setDefaultFormat(e.target.value as MatchFormat)
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

          {/* Limite de joueurs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-navy-soft border border-card rounded-card">
              <div className="flex-1">
                <div className="text-white font-archivo font-extrabold uppercase tracking-tight">
                  Limiter le nombre de joueurs
                </div>
                <div className="text-cool-gray text-sm mt-1">
                  Par défaut : aucune limite.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHasPlayerLimit((prev) => !prev);
                  if (!hasPlayerLimit)
                    setPlayerLimit(String(PLAYER_LIMIT_DEFAULT));
                }}
                className={toggleClass(hasPlayerLimit)}
                aria-label="Limiter le nombre de joueurs"
                aria-pressed={hasPlayerLimit}
              >
                <span className={toggleKnob(hasPlayerLimit)} />
              </button>
            </div>
            {hasPlayerLimit && (
              <div className="space-y-2">
                <label
                  htmlFor="league-player-limit"
                  className="text-xs font-archivo font-extrabold uppercase tracking-[0.6px] text-cool-gray block"
                >
                  Nombre maximum de joueurs *
                </label>
                <input
                  id="league-player-limit"
                  type="number"
                  value={playerLimit}
                  onChange={(e) => {
                    setPlayerLimit(e.target.value);
                    if (touched) runValidation();
                  }}
                  min={1}
                  placeholder="Ex: 16"
                  className={fieldInputClass(!!errors.playerLimit)}
                  aria-invalid={!!errors.playerLimit}
                  aria-describedby={
                    errors.playerLimit ? "player-limit-error" : undefined
                  }
                />
                {errors.playerLimit && (
                  <p
                    id="player-limit-error"
                    className="text-sm text-signal-red"
                    role="alert"
                  >
                    {errors.playerLimit}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Privée */}
          <div className="flex items-center justify-between p-4 bg-navy-soft border border-card rounded-card">
            <div className="flex-1">
              <div className="text-white font-archivo font-extrabold uppercase tracking-tight">
                🔒 Ligue privée
              </div>
              <div className="text-cool-gray text-sm mt-1">
                Seuls ceux qui ont le code peuvent rejoindre.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate((prev) => !prev)}
              className={toggleClass(isPrivate)}
              aria-label="Ligue privée"
              aria-pressed={isPrivate}
            >
              <span className={toggleKnob(isPrivate)} />
            </button>
          </div>

          {/* Anti-cheat */}
          <div className="flex items-center justify-between p-4 bg-navy-soft border border-card rounded-card">
            <div className="flex-1">
              <div className="text-white font-archivo font-extrabold uppercase tracking-tight">
                🛡 Anti-cheat
              </div>
              <div className="text-cool-gray text-sm mt-1">
                Chaque match doit être confirmé par l'adversaire avant d'impacter l'ELO.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAntiCheat((prev) => !prev)}
              className={toggleClass(antiCheat)}
              aria-label="Anti-cheat"
              aria-pressed={antiCheat}
            >
              <span className={toggleKnob(antiCheat)} />
            </button>
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
