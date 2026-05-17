import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Ghost,
  Link as LinkIcon,
  Lock,
  Target,
  Trophy,
} from "lucide-react";
import toast from "react-hot-toast";

import { useLeague } from "@/context/LeagueContext";
import { useDetailPagePermissions } from "@/hooks/useDetailPagePermissions";
import { useUnclaimedGuests } from "@/hooks/useUnclaimedGuests";
import { databaseService } from "@/services/DatabaseService";
import { identityMergeService } from "@/services/IdentityMergeService";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { GhostManagementSheet } from "@/components/design-system";
import { PButton } from "@/components/ponglo/PButton";
import type { EventUpdates } from "@/services/DatabaseService";

const FORMAT_OPTIONS: Array<{
  value: "1v1" | "2v2" | "3v3" | "libre";
  label: string;
  description: string;
}> = [
  { value: "1v1", label: "1v1 Strict", description: "Duel individuel" },
  { value: "2v2", label: "2v2 Strict", description: "Équipes de 2" },
  { value: "3v3", label: "3v3 Strict", description: "Équipes de 3" },
  { value: "libre", label: "Libre", description: "Équipes flexibles" },
];

const toIsoDay = (raw: string | null | undefined): string => {
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(raw);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

export const EventSettings = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    events,
    leagues,
    updateEvent,
    deleteEvent,
    toggleEventStatus,
    associateEventToLeague,
    isLoadingInitialData,
    reloadData,
  } = useLeague();

  const event = events.find((e) => e.id === id);
  const league = event?.leagueId
    ? leagues.find((l) => l.id === event.leagueId)
    : null;
  const { isAdmin } = useDetailPagePermissions(id || "", "event");

  const [currentPlayersCount, setCurrentPlayersCount] = useState(0);
  useEffect(() => {
    if (!id) return;
    databaseService
      .loadEventParticipants(id)
      .then((p) => setCurrentPlayersCount(p.length))
      .catch(() => setCurrentPlayersCount(0));
  }, [id, event?.playerIds?.length]);

  const {
    guests: eventGhosts,
    refresh: refreshEventGhosts,
  } = useUnclaimedGuests("event", id, { mode: "any" });

  const [name, setName] = useState(event?.name ?? "");
  const [date, setDate] = useState<string>(toIsoDay(event?.date));
  const [format, setFormat] = useState<"1v1" | "2v2" | "3v3" | "libre">(
    event?.format ?? "2v2",
  );
  const [hasPlayerLimit, setHasPlayerLimit] = useState<boolean>(
    (event?.maxPlayers ?? 999) > 0 && (event?.maxPlayers ?? 999) < 999,
  );
  const [playerLimit, setPlayerLimit] = useState<string>(
    String(event?.maxPlayers ?? 16),
  );
  const [isPrivate, setIsPrivate] = useState<boolean>(event?.isPrivate ?? true);
  const [propagatesToLeagueElo, setPropagatesToLeagueElo] = useState<boolean>(
    event?.propagatesToLeagueElo !== false,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showGhostMgmt, setShowGhostMgmt] = useState(false);

  useEffect(() => {
    if (!event) return;
    setName(event.name);
    setDate(toIsoDay(event.date));
    setFormat(event.format);
    setHasPlayerLimit(
      (event.maxPlayers ?? 999) > 0 && (event.maxPlayers ?? 999) < 999,
    );
    setPlayerLimit(String(event.maxPlayers ?? 16));
    setIsPrivate(event.isPrivate ?? true);
    setPropagatesToLeagueElo(event.propagatesToLeagueElo !== false);
  }, [event?.id]);

  const initialDateIso = toIsoDay(event?.date);
  const isFinishedEvent = event?.isFinished === true;
  const isDateLocked = useMemo(() => {
    if (isFinishedEvent) return false;
    if (!initialDateIso) return false;
    const today = new Date().toISOString().slice(0, 10);
    return initialDateIso <= today;
  }, [isFinishedEvent, initialDateIso]);

  const parsedLimit = parseInt(playerLimit, 10);
  const playerLimitWarning = useMemo(() => {
    if (!hasPlayerLimit || isNaN(parsedLimit)) return null;
    if (parsedLimit < currentPlayersCount) {
      return `Attention : ${currentPlayersCount} joueur${
        currentPlayersCount > 1 ? "s" : ""
      } actuellement inscrit${
        currentPlayersCount > 1 ? "s" : ""
      }. Abaisser la limite en-dessous peut empêcher de nouvelles inscriptions mais ne retirera pas les joueurs déjà présents.`;
    }
    return null;
  }, [parsedLimit, hasPlayerLimit, currentPlayersCount]);

  if (isLoadingInitialData) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-4 text-center">
        <EmptyState
          icon={Trophy}
          title="Événement introuvable"
          description="Cet événement n'existe pas ou a été supprimé."
          action={
            <PButton variant="primary" size="md" onClick={() => navigate("/")}>
              Retour à l&apos;accueil
            </PButton>
          }
        />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4 text-center">
        <EmptyState
          icon={Lock}
          title="Accès refusé"
          description="Seul l'administrateur peut modifier les paramètres."
          action={
            <PButton
              variant="primary"
              size="md"
              onClick={() => navigate(`/event/${event.id}`)}
            >
              Retour à l&apos;événement
            </PButton>
          }
        />
      </div>
    );
  }

  const eventMode: "elo" | "bracket" = event.mode ?? "elo";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updates: EventUpdates = {};
      if (name.trim() !== event.name) updates.name = name.trim();
      if (!isDateLocked && date && date !== initialDateIso) updates.date = date;
      if (format !== event.format) updates.format = format;

      const effectiveLimit = hasPlayerLimit
        ? Math.max(2, Math.min(100, parsedLimit || (event.maxPlayers ?? 16)))
        : 999;
      if (effectiveLimit !== (event.maxPlayers ?? 999)) {
        updates.maxPlayers = effectiveLimit;
      }
      if (isPrivate !== (event.isPrivate ?? true)) updates.isPrivate = isPrivate;

      const initialPropagation = event.propagatesToLeagueElo !== false;
      if (event.leagueId && propagatesToLeagueElo !== initialPropagation) {
        updates.propagatesToLeagueElo = propagatesToLeagueElo;
      }

      if (Object.keys(updates).length === 0) {
        toast("Aucun changement à enregistrer");
        return;
      }
      await updateEvent(event.id, updates);
      toast.success("Paramètres enregistrés");
    } catch (err) {
      console.error("Error saving event settings:", err);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinish = () => {
    toggleEventStatus(event.id);
    toast.success(event.isFinished ? "Événement rouvert" : "Événement clôturé");
  };

  const handleDelete = () => {
    if (!confirm("Es-tu sûr de vouloir supprimer cet événement ?")) return;
    deleteEvent(event.id);
    navigate("/");
  };

  const handleRenameGhost = async (playerId: string, newPseudo: string) => {
    const result = await identityMergeService.renameAnonymousPlayer(
      "event",
      playerId,
      newPseudo,
    );
    if (!result.success) {
      toast.error(result.error || "Renommage impossible");
      throw new Error(result.error);
    }
    toast.success("Joueur renommé");
    await refreshEventGhosts();
    reloadData();
  };

  const handleDeleteGhost = async (playerId: string) => {
    const result = await identityMergeService.deleteAnonymousPlayer(
      "event",
      playerId,
    );
    if (!result.success) {
      if (!result.error || !/match/i.test(result.error)) {
        toast.error(result.error || "Suppression impossible");
      }
      throw new Error(result.error);
    }
    toast.success("Joueur supprimé");
    await refreshEventGhosts();
    reloadData();
  };

  const handleArchiveGhost = async (playerId: string) => {
    const result = await identityMergeService.archiveAnonymousPlayer(
      "event",
      playerId,
    );
    if (!result.success) {
      toast.error(result.error || "Archivage impossible");
      throw new Error(result.error);
    }
    toast.success("Joueur archivé");
    await refreshEventGhosts();
    reloadData();
  };

  const handleGenerateGhostInvite = async (playerId: string) => {
    const result = await identityMergeService.generateGhostInviteToken(
      "event",
      playerId,
    );
    if (!result.success || !result.token) {
      toast.error(result.error || "Lien indisponible");
      throw new Error(result.error);
    }
    return { token: result.token };
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
    <div className="min-h-screen bg-navy text-white">
      <ContextualHeader
        title="Paramètres"
        showBackButton
        onBack={() => navigate(`/event/${event.id}`)}
      />

      <form
        onSubmit={handleSubmit}
        className="p-4 md:p-6 max-w-2xl mx-auto space-y-5 pb-32"
        noValidate
      >
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

        {/* Date */}
        <div className="space-y-2">
          <label
            htmlFor="settings-date"
            className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray flex items-center gap-1.5"
          >
            Date
            {isDateLocked && <Lock size={11} className="text-cool-gray" />}
          </label>
          <input
            id="settings-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isDateLocked}
            className={`${inputClass} appearance-none min-w-0 box-border ${
              isDateLocked ? "opacity-60 cursor-not-allowed" : ""
            }`}
            aria-label="Date de l'événement"
          />
          {isDateLocked && (
            <p className="text-cool-gray text-xs">
              Impossible de modifier la date d&apos;un événement en cours.
            </p>
          )}
        </div>

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
            Type d&apos;événement
          </span>
          <div
            className="flex items-center gap-3 p-3 rounded-card border border-card bg-navy-deep/50 opacity-90"
            aria-readonly="true"
          >
            <div className="w-9 h-9 rounded-md bg-electric-blue/20 text-electric-blue flex items-center justify-center">
              {eventMode === "elo" ? (
                <Target size={18} />
              ) : (
                <Trophy size={18} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-archivo font-extrabold uppercase tracking-tight text-sm flex items-center gap-2">
                {eventMode === "elo" ? "ELO" : "Bracket"}
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
                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
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

        {/* Propagation ELO vers la ligue (mig 023) */}
        {event.leagueId && (
          <div className="flex items-center justify-between gap-4 p-3 bg-navy-deep border border-card rounded-card">
            <div className="flex-1 min-w-0">
              <div className="text-white font-archivo font-semibold text-sm">
                Propager l&apos;ELO vers la ligue
              </div>
              <div className="text-cool-gray text-xs mt-0.5">
                Quand activé, chaque match de l&apos;event met aussi à jour l&apos;ELO de la ligue rattachée. Désactive pour isoler l&apos;event.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPropagatesToLeagueElo((v) => !v)}
              className={toggleClass(propagatesToLeagueElo)}
              aria-label="Propager l'ELO vers la ligue"
              aria-pressed={propagatesToLeagueElo}
            >
              <span className={toggleKnob(propagatesToLeagueElo)} />
            </button>
          </div>
        )}

        {/* Ghost management entry */}
        {eventGhosts.length > 0 && (
          <div className="space-y-2">
            <span className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray block">
              <span className="inline-flex items-center gap-1.5">
                <Ghost size={12} />
                Joueurs fantômes ({eventGhosts.length})
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowGhostMgmt(true)}
              className="w-full p-3 rounded-card border border-card bg-navy-deep flex items-center gap-3 hover:border-white/60 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="text-white font-archivo font-semibold text-sm">
                  Gérer les joueurs fantômes
                </div>
                <div className="text-cool-gray text-xs">
                  Renommer, supprimer, envoyer un lien d&apos;invitation
                </div>
              </div>
            </button>
          </div>
        )}

        {/* League association */}
        <div className="space-y-2">
          <span className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray block">
            <span className="inline-flex items-center gap-1.5">
              <LinkIcon size={12} />
              Rattachement à une ligue
            </span>
          </span>
          {event.leagueId ? (
            <div className="p-3 rounded-card border border-card bg-navy-deep flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-white font-archivo font-semibold text-sm truncate">
                  {league?.name || "Ligue introuvable"}
                </div>
                <div className="text-cool-gray text-xs">Associé</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm("Voulez-vous dissocier cet événement de la ligue ?")
                  ) {
                    associateEventToLeague(event.id, "");
                  }
                }}
                className="px-3 h-8 rounded-full border border-card text-cool-gray hover:text-white hover:border-white/60 font-archivo font-extrabold uppercase text-[10px] tracking-[1px] transition-colors"
              >
                Dissocier
              </button>
            </div>
          ) : leagues.length > 0 ? (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  associateEventToLeague(event.id, e.target.value);
                }
              }}
              className="w-full bg-navy-deep border border-card rounded-md p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-lime/20"
            >
              <option value="">Sélectionner une ligue…</option>
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-cool-gray text-xs">
              Aucune ligue disponible. Crée-en une pour pouvoir rattacher.
            </p>
          )}
        </div>

        {/* Sticky footer */}
        <div className="fixed inset-x-0 bottom-0 bg-navy/95 backdrop-blur border-t border-card px-4 py-3 md:py-4 z-10">
          <div className="max-w-2xl mx-auto flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <PButton
                type="button"
                variant="ghost"
                size="lg"
                full
                onClick={handleFinish}
              >
                {event.isFinished ? "Réouvrir l'événement" : "Clôturer l'événement"}
              </PButton>
              <PButton
                type="button"
                variant="ghost"
                size="lg"
                full
                onClick={handleDelete}
              >
                Supprimer
              </PButton>
            </div>
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
        </div>
      </form>

      <GhostManagementSheet
        isOpen={showGhostMgmt}
        onClose={() => setShowGhostMgmt(false)}
        guests={eventGhosts}
        joinPath={`/event/${event.id}/join`}
        onRename={handleRenameGhost}
        onDelete={handleDeleteGhost}
        onArchive={handleArchiveGhost}
        onGenerateInvite={handleGenerateGhostInvite}
      />
    </div>
  );
};

export default EventSettings;
