/**
 * SettingsSheet — Bottom sheet "Paramètres" pour Tournament / League
 *
 * Reprend l'architecture visuelle de `InviteSheet` (slide-up mobile, modal centrée
 * desktop, grabber, bouton X, header centré).
 *
 * Comporte :
 * - Champ nom (required)
 * - Champ format (tournament uniquement, radios)
 * - Affichage read-only du mode ELO/Bracket (tournament) ou du type event/season
 *   (league) — non modifiable après création (voir spec).
 * - Toggle "Limite de joueurs" + champ numérique avec alerte si nouvelle valeur
 *   < nombre de joueurs actuellement inscrits.
 * - Toggle "Événement privé" (tournament uniquement)
 * - Actions destructives : Clôturer (si pas déjà terminé) + Supprimer.
 */

import { X, AlertTriangle, Lock, Target, Trophy } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { PButton } from "@/components/ponglo/PButton";

/** Valeurs éditables côté tournament. */
export interface SettingsSheetTournamentValues {
  name: string;
  format: "1v1" | "2v2" | "3v3" | "libre";
  maxPlayers: number;
  isPrivate: boolean;
}

/** Valeurs éditables côté league. */
export interface SettingsSheetLeagueValues {
  name: string;
}

/** Updates émises vers le parent (subset des values : uniquement les champs modifiés). */
export interface SettingsSheetTournamentUpdates {
  name?: string;
  format?: "1v1" | "2v2" | "3v3" | "libre";
  maxPlayers?: number;
  isPrivate?: boolean;
}

export interface SettingsSheetLeagueUpdates {
  name?: string;
}

type SettingsSheetProps =
  | {
      kind: "tournament";
      isOpen: boolean;
      onClose: () => void;
      /** Valeurs courantes (source de vérité à l'ouverture). */
      initial: SettingsSheetTournamentValues;
      /** Mode compétition — read-only, affiché sous forme de chip verrouillé. */
      mode: "elo" | "bracket";
      /** Nombre de joueurs actuellement inscrits (pour l'alerte maxPlayers). */
      currentPlayersCount: number;
      /** Sauvegarde — ne contient que les champs modifiés. */
      onSave: (updates: SettingsSheetTournamentUpdates) => Promise<void> | void;
      onClose_?: never;
      onFinish?: () => void;
      onDelete?: () => void;
      isFinished?: boolean;
      title?: ReactNode;
      /** Bloc supplémentaire (ex: rattachement à une ligue) rendu après les champs, avant la zone destructive. */
      extraContent?: ReactNode;
    }
  | {
      kind: "league";
      isOpen: boolean;
      onClose: () => void;
      initial: SettingsSheetLeagueValues;
      /** Type read-only (event ou season). */
      leagueType: "one-shot" | "season";
      onSave: (updates: SettingsSheetLeagueUpdates) => Promise<void> | void;
      onDelete?: () => void;
      title?: ReactNode;
      /** Bloc supplémentaire rendu après les champs. */
      extraContent?: ReactNode;
    };

const FORMAT_OPTIONS: Array<{
  value: SettingsSheetTournamentValues["format"];
  label: string;
  description: string;
}> = [
  { value: "1v1", label: "1v1 Strict", description: "Duel individuel" },
  { value: "2v2", label: "2v2 Strict", description: "Équipes de 2" },
  { value: "3v3", label: "3v3 Strict", description: "Équipes de 3" },
  { value: "libre", label: "Libre", description: "Équipes flexibles" },
];

export const SettingsSheet = (props: SettingsSheetProps) => {
  const { isOpen, onClose, title = "Paramètres" } = props;
  const sheetRef = useRef<HTMLDivElement>(null);

  // ── State hooks (declared unconditionally; populated from props when open) ──
  const [name, setName] = useState(props.initial.name);
  const [format, setFormat] = useState<SettingsSheetTournamentValues["format"]>(
    props.kind === "tournament" ? props.initial.format : "2v2",
  );
  const [hasPlayerLimit, setHasPlayerLimit] = useState<boolean>(
    props.kind === "tournament"
      ? props.initial.maxPlayers > 0 && props.initial.maxPlayers < 999
      : false,
  );
  const [playerLimit, setPlayerLimit] = useState<string>(
    props.kind === "tournament" ? String(props.initial.maxPlayers) : "16",
  );
  const [isPrivate, setIsPrivate] = useState<boolean>(
    props.kind === "tournament" ? props.initial.isPrivate : true,
  );
  const [isSaving, setIsSaving] = useState(false);

  // Reset local state every time the sheet is opened (props may have changed).
  useEffect(() => {
    if (!isOpen) return;
    setName(props.initial.name);
    if (props.kind === "tournament") {
      setFormat(props.initial.format);
      setHasPlayerLimit(
        props.initial.maxPlayers > 0 && props.initial.maxPlayers < 999,
      );
      setPlayerLimit(String(props.initial.maxPlayers));
      setIsPrivate(props.initial.isPrivate);
    }
    // props.initial contents are captured here by design
     
  }, [isOpen]);

  // Escape → close
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Warning if the new limit is below current enrolled players.
  const parsedLimit = parseInt(playerLimit, 10);
  const playerLimitWarning = useMemo(() => {
    if (props.kind !== "tournament") return null;
    if (!hasPlayerLimit) return null;
    if (isNaN(parsedLimit)) return null;
    if (parsedLimit < props.currentPlayersCount) {
      return `Attention : ${props.currentPlayersCount} joueur${
        props.currentPlayersCount > 1 ? "s" : ""
      } actuellement inscrit${
        props.currentPlayersCount > 1 ? "s" : ""
      }. Abaisser la limite en-dessous peut empêcher de nouvelles inscriptions mais ne retirera pas les joueurs déjà présents.`;
    }
    return null;
     
  }, [parsedLimit, hasPlayerLimit, props.kind]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (props.kind === "tournament") {
        const updates: SettingsSheetTournamentUpdates = {};
        if (name.trim() !== props.initial.name) updates.name = name.trim();
        if (format !== props.initial.format) updates.format = format;

        const effectiveLimit = hasPlayerLimit
          ? Math.max(2, Math.min(100, parsedLimit || props.initial.maxPlayers))
          : 999;
        if (effectiveLimit !== props.initial.maxPlayers) {
          updates.maxPlayers = effectiveLimit;
        }
        if (isPrivate !== props.initial.isPrivate) updates.isPrivate = isPrivate;

        if (Object.keys(updates).length > 0) {
          await props.onSave(updates);
        }
      } else {
        const updates: SettingsSheetLeagueUpdates = {};
        if (name.trim() !== props.initial.name) updates.name = name.trim();
        if (Object.keys(updates).length > 0) {
          await props.onSave(updates);
        }
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "w-full bg-navy-deep border-[1.5px] border-card rounded-md p-3 text-white placeholder-cool-gray focus:outline-none focus:border-lime focus:ring-2 focus:ring-lime/20 transition-colors";

  const toggleClass = (on: boolean) =>
    `relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
      on ? "bg-electric-blue" : "bg-navy-deep border border-card"
    }`;
  const toggleKnob = (on: boolean) =>
    `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
      on ? "translate-x-6" : "translate-x-1"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-sheet-title"
    >
      <div
        ref={sheetRef}
        className="w-full md:max-w-md bg-navy-soft border-t border-card md:border md:border-card rounded-t-2xl md:rounded-2xl shadow-modal flex flex-col max-h-[92vh] animate-invite-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grabber */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-center px-5 pt-4 pb-3">
          <h2
            id="settings-sheet-title"
            className="font-archivo font-extrabold uppercase text-white text-[17px] tracking-[-0.3px]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 w-9 h-9 rounded-full flex items-center justify-center text-cool-gray hover:bg-white/10 transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0"
          noValidate
        >
          {/* Scrollable fields */}
          <div className="overflow-y-auto flex-1 px-5 py-5 flex flex-col gap-5">
            {/* Nom */}
            <div className="space-y-2">
              <label
                htmlFor="settings-name"
                className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray"
              >
                Nom
              </label>
              <input
                id="settings-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                className={inputClass}
              />
            </div>

            {/* Tournament-specific fields */}
            {props.kind === "tournament" && (
              <>
                {/* Format */}
                <div className="space-y-2">
                  <span className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray block">
                    Format du match
                  </span>
                  <div className="space-y-1.5">
                    {FORMAT_OPTIONS.map((option) => {
                      const active = format === option.value;
                      return (
                        <label
                          key={option.value}
                          className={`flex items-center gap-3 p-3 rounded-card border cursor-pointer transition-colors ${
                            active
                              ? "border-electric-blue bg-electric-blue/10"
                              : "border-card bg-navy-deep hover:border-card-muted"
                          }`}
                        >
                          <input
                            type="radio"
                            name="settings-format"
                            value={option.value}
                            checked={active}
                            onChange={() => setFormat(option.value)}
                            className="accent-electric-blue"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-archivo font-semibold text-sm">
                              {option.label}
                            </div>
                            <div className="text-cool-gray text-xs">
                              {option.description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Mode (read-only) */}
                <div className="space-y-2">
                  <span className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray block">
                    Type d'événement
                  </span>
                  <div
                    className="flex items-center gap-3 p-3 rounded-card border border-card bg-navy-deep/50 opacity-90"
                    aria-readonly="true"
                  >
                    <div className="w-9 h-9 rounded-md bg-electric-blue/20 text-electric-blue flex items-center justify-center">
                      {props.mode === "elo" ? (
                        <Target size={18} />
                      ) : (
                        <Trophy size={18} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-archivo font-extrabold uppercase tracking-tight text-sm flex items-center gap-2">
                        {props.mode === "elo" ? "ELO" : "Bracket"}
                        <Lock size={12} className="text-cool-gray" />
                      </div>
                      <div className="text-cool-gray text-xs">
                        Verrouillé — défini à la création
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player limit */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4 p-3 bg-navy-deep border border-card rounded-card">
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-archivo font-semibold text-sm">
                        Limiter le nombre de joueurs
                      </div>
                      <div className="text-cool-gray text-xs mt-0.5">
                        Par défaut : aucune limite
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHasPlayerLimit((v) => !v)}
                      className={toggleClass(hasPlayerLimit)}
                      aria-label="Limiter le nombre de joueurs"
                      aria-pressed={hasPlayerLimit}
                    >
                      <span className={toggleKnob(hasPlayerLimit)} />
                    </button>
                  </div>

                  {hasPlayerLimit && (
                    <>
                      <input
                        id="settings-player-limit"
                        type="number"
                        value={playerLimit}
                        onChange={(e) => setPlayerLimit(e.target.value)}
                        min={2}
                        max={100}
                        className={inputClass}
                        aria-label="Nombre maximum de joueurs"
                      />
                      {playerLimitWarning && (
                        <div className="flex items-start gap-2 p-3 rounded-card bg-ping-yellow/10 border border-ping-yellow/30 text-ping-yellow text-xs">
                          <AlertTriangle
                            size={16}
                            className="flex-shrink-0 mt-0.5"
                          />
                          <p>{playerLimitWarning}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Private */}
                <div className="flex items-center justify-between gap-4 p-3 bg-navy-deep border border-card rounded-card">
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-archivo font-semibold text-sm">
                      🔒 Événement privé
                    </div>
                    <div className="text-cool-gray text-xs mt-0.5">
                      Seuls ceux qui ont le code peuvent rejoindre
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrivate((v) => !v)}
                    className={toggleClass(isPrivate)}
                    aria-label="Événement privé"
                    aria-pressed={isPrivate}
                  >
                    <span className={toggleKnob(isPrivate)} />
                  </button>
                </div>
              </>
            )}

            {/* League read-only type */}
            {props.kind === "league" && (
              <div className="space-y-2">
                <span className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray block">
                  Type de compétition
                </span>
                <div
                  className="flex items-center gap-3 p-3 rounded-card border border-card bg-navy-deep/50"
                  aria-readonly="true"
                >
                  <div className="w-9 h-9 rounded-md bg-electric-blue/20 text-electric-blue flex items-center justify-center">
                    <Trophy size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-archivo font-extrabold uppercase tracking-tight text-sm flex items-center gap-2">
                      {props.leagueType === "one-shot"
                        ? "League Continue"
                        : "League par Saison"}
                      <Lock size={12} className="text-cool-gray" />
                    </div>
                    <div className="text-cool-gray text-xs">
                      Verrouillé — défini à la création
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Extra content (e.g. league association) */}
            {props.extraContent && (
              <div className="pt-1">{props.extraContent}</div>
            )}
          </div>

          {/* Sticky footer */}
          <div className="px-5 pb-6 pt-3 border-t border-card flex flex-col gap-3">
            {props.kind === "tournament" && props.onFinish && (
              <PButton
                type="button"
                variant="ghost"
                size="lg"
                full
                onClick={props.onFinish}
              >
                {props.isFinished ? "Réouvrir l'événement" : "Clôturer l'événement"}
              </PButton>
            )}
            <PButton
              type="submit"
              variant="primary"
              size="lg"
              full
              disabled={!name.trim() || isSaving}
            >
              {isSaving ? "Enregistrement…" : "Enregistrer"}
            </PButton>
          </div>
        </form>
      </div>
    </div>
  );
};
