import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Archive,
  Edit,
  Ghost,
  Lock,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { useLeague } from "@/context/LeagueContext";
import { useDetailPagePermissions } from "@/hooks/useDetailPagePermissions";
import { useUnclaimedGuests } from "@/hooks/useUnclaimedGuests";
import { identityMergeService } from "@/services/IdentityMergeService";
import { getLeagueLifecycle } from "@/utils/leagueLifecycle";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { GhostManagementSheet } from "@/components/design-system";
import { PButton } from "@/components/ponglo/PButton";

export const LeagueSettings = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    leagues,
    events,
    updateLeague,
    updatePlayer,
    deletePlayer,
    deleteLeague,
    finishLeague,
    reopenLeague,
    finishCurrentLeagueSeason,
    startNewLeagueSeason,
    isLoadingInitialData,
    reloadData,
  } = useLeague();

  const league = leagues.find((l) => l.id === id);
  const { isAdmin } = useDetailPagePermissions(id || "", "league");

  const {
    guests: leagueGhosts,
    refresh: refreshLeagueGhosts,
  } = useUnclaimedGuests("league", id, { mode: "any" });

  const [name, setName] = useState(league?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState("");
  const [showGhostMgmt, setShowGhostMgmt] = useState(false);

  useEffect(() => {
    if (league) setName(league.name);
  }, [league?.id]);

  const isDirty = useMemo(() => {
    if (!league) return false;
    return name.trim() !== league.name && name.trim().length > 0;
  }, [league, name]);

  if (isLoadingInitialData) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!league) {
    return (
      <div className="p-4 text-center">
        <EmptyState
          icon={Trophy}
          title="Ligue introuvable"
          description="Cette ligue n'existe pas ou a été supprimée."
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
              onClick={() => navigate(`/league/${league.id}`)}
            >
              Retour à la ligue
            </PButton>
          }
        />
      </div>
    );
  }

  const sortedPlayers = [...league.players].sort((a, b) => b.elo - a.elo);
  const leagueEvents = events.filter((e) => league.events?.includes(e.id));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === league.name) {
      toast("Aucun changement à enregistrer");
      return;
    }
    setIsSaving(true);
    try {
      await updateLeague(league.id, trimmed, league.type);
      toast.success("Paramètres enregistrés");
    } catch (err) {
      console.error("Error saving league settings:", err);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLeague = () => {
    if (!confirm("Es-tu sûr de vouloir supprimer cette ligue ?")) return;
    deleteLeague(league.id);
    navigate("/");
  };

  const handleRenameGhost = async (playerId: string, newPseudo: string) => {
    const result = await identityMergeService.renameAnonymousPlayer(
      "league",
      playerId,
      newPseudo,
    );
    if (!result.success) {
      toast.error(result.error || "Renommage impossible");
      throw new Error(result.error);
    }
    toast.success("Joueur renommé");
    await refreshLeagueGhosts();
    reloadData();
  };

  const handleDeleteGhost = async (playerId: string) => {
    const result = await identityMergeService.deleteAnonymousPlayer(
      "league",
      playerId,
    );
    if (!result.success) {
      if (!result.error || !/match/i.test(result.error)) {
        toast.error(result.error || "Suppression impossible");
      }
      throw new Error(result.error);
    }
    toast.success("Joueur supprimé");
    await refreshLeagueGhosts();
    reloadData();
  };

  const handleArchiveGhost = async (playerId: string) => {
    const result = await identityMergeService.archiveAnonymousPlayer(
      "league",
      playerId,
    );
    if (!result.success) {
      toast.error(result.error || "Archivage impossible");
      throw new Error(result.error);
    }
    toast.success("Joueur archivé");
    await refreshLeagueGhosts();
    reloadData();
  };

  const handleGenerateGhostInvite = async (playerId: string) => {
    const result = await identityMergeService.generateGhostInviteToken(
      "league",
      playerId,
    );
    if (!result.success || !result.token) {
      toast.error(result.error || "Lien indisponible");
      throw new Error(result.error);
    }
    return { token: result.token };
  };

  // ── Lifecycle + cycle de saison (mig 029) ──────────────────────────────
  const lifecycle = getLeagueLifecycle(league);
  const seasonNumber = league.currentSeasonNumber ?? 1;
  const seasonStartedAt = league.currentSeasonStartedAt ?? league.createdAt;
  const seasonEndedAt = league.currentSeasonEndedAt ?? null;
  const dateFmt: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  };
  const seasonStartedLabel = new Date(seasonStartedAt).toLocaleDateString(
    "fr-FR",
    dateFmt,
  );
  const seasonEndedLabel = seasonEndedAt
    ? new Date(seasonEndedAt).toLocaleDateString("fr-FR", dateFmt)
    : null;
  const plannedStartLabel = league.plannedStartAt
    ? new Date(league.plannedStartAt).toLocaleDateString("fr-FR", dateFmt)
    : null;

  const handleFinishLeague = () => {
    if (
      !confirm(
        "Clôturer cette ligue ?\n\nPlus aucun match ne pourra être enregistré. Réversible via Réouvrir.",
      )
    )
      return;
    void finishLeague(league.id);
  };

  const handleReopenLeague = () => {
    void reopenLeague(league.id);
  };

  const handleFinishCurrentSeason = async () => {
    if (
      !confirm(
        `Forcer la fin de la Saison ${seasonNumber} ?\n\nLe classement actuel sera archivé. Aucun match ne pourra être enregistré tant que tu n'auras pas démarré la Saison ${seasonNumber + 1}.`,
      )
    )
      return;
    try {
      await finishCurrentLeagueSeason(league.id);
    } catch {
      // toast déjà émis côté context
    }
  };

  const handleStartNewSeason = async () => {
    if (
      !confirm(
        `Démarrer la Saison ${seasonNumber + 1} ?\n\nLes ELO de tous les joueurs seront reset à 1000. Action irréversible.`,
      )
    )
      return;
    try {
      await startNewLeagueSeason(league.id);
    } catch {
      // toast déjà émis côté context
    }
  };

  const lifecycleDotClass: Record<typeof lifecycle, string> = {
    not_started: "bg-ping-yellow",
    active: "bg-lime",
    paused: "bg-ping-yellow",
    between_seasons: "bg-ping-yellow",
    finished: "bg-cool-gray",
  };
  const lifecycleLabel: Record<typeof lifecycle, string> = {
    not_started: "Non démarrée",
    active: "Active",
    paused: "En pause",
    between_seasons: "Inter-saison",
    finished: "Terminée",
  };

  const inputClass =
    "w-full bg-navy-deep border-[1.5px] border-card rounded-md p-3 text-white placeholder-cool-gray focus:outline-none focus:border-lime focus:ring-2 focus:ring-lime/20 transition-colors";

  return (
    <div className="min-h-screen bg-navy text-white">
      <ContextualHeader
        title="Paramètres"
        showBackButton
        onBack={() => navigate(`/league/${league.id}`)}
      />

      <form
        onSubmit={handleSubmit}
        className={`p-4 md:p-6 max-w-2xl mx-auto space-y-5 transition-[padding] duration-200 ${
          isDirty ? "pb-36" : "pb-8"
        }`}
        noValidate
      >
        {/* Nom */}
        <div className="space-y-2">
          <label
            htmlFor="settings-name"
            className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray"
          >
            Nom de la ligue
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

        {/* Type (read-only) */}
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
                {league.type === "one-shot"
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

        {/* Lifecycle ligue (mig 029) — état + Clôturer/Réouvrir */}
        <div className="space-y-2">
          <span className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray block">
            Lifecycle ligue
          </span>
          <div className="rounded-card border border-card bg-navy-deep p-3 space-y-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${lifecycleDotClass[lifecycle]}`}
                aria-hidden
              />
              <span className="font-archivo font-extrabold uppercase text-[12px] tracking-[1px] text-white">
                {lifecycleLabel[lifecycle]}
              </span>
            </div>
            {lifecycle === "active" && (
              <PButton
                type="button"
                variant="ghost"
                size="md"
                full
                onClick={handleFinishLeague}
                data-testid="settings-finish-league"
              >
                <Archive size={16} className="inline mr-2" />
                Clôturer la ligue
              </PButton>
            )}
            {lifecycle === "finished" && (
              <PButton
                type="button"
                variant="primary"
                size="md"
                full
                onClick={handleReopenLeague}
                data-testid="settings-reopen-league"
              >
                <Play size={16} className="inline mr-2" />
                Réouvrir la ligue
              </PButton>
            )}
            {lifecycle === "paused" && (
              <p className="text-xs text-cool-gray">
                La ligue est en pause. Reprends-la depuis le hero pour
                réautoriser les matchs.
              </p>
            )}
            {lifecycle === "between_seasons" && (
              <p className="text-xs text-cool-gray">
                Saison {seasonNumber} close. Démarre la suivante dans la
                section ci-dessous.
              </p>
            )}
            {lifecycle === "not_started" && (
              <p className="text-xs text-cool-gray">
                La ligue n'a pas encore démarré
                {plannedStartLabel ? ` (prévue le ${plannedStartLabel})` : ""}.
                Tu pourras la clôturer ici une fois active.
              </p>
            )}
          </div>
        </div>

        {/* Cycle de saison (mig 029) — UNIQUEMENT pour les ligues saisonnières.
            Une ligue Continue (one-shot) = une seule saison, pas de cycle. */}
        {league.type === "season" && (
          <div className="space-y-2">
            <span className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray block">
              Cycle de saison
            </span>
            <div className="rounded-card border border-card bg-navy-deep p-3 space-y-3">
              <div>
                <div className="font-archivo font-extrabold uppercase text-sm tracking-tight text-white">
                  Saison {seasonNumber}
                </div>
                <div className="text-xs text-cool-gray">
                  Démarrée le {seasonStartedLabel}
                  {seasonEndedLabel ? ` · close le ${seasonEndedLabel}` : ""}
                </div>
              </div>
              {lifecycle === "active" && (
                <PButton
                  type="button"
                  variant="ghost"
                  size="md"
                  full
                  onClick={handleFinishCurrentSeason}
                  data-testid="settings-finish-season"
                >
                  <Archive size={16} className="inline mr-2" />
                  Forcer la fin de la Saison {seasonNumber}
                </PButton>
              )}
              {lifecycle === "between_seasons" && (
                <PButton
                  type="button"
                  variant="primary"
                  size="md"
                  full
                  onClick={handleStartNewSeason}
                  data-testid="settings-start-next-season"
                >
                  <RotateCcw size={16} className="inline mr-2" />
                  Démarrer la Saison {seasonNumber + 1}
                </PButton>
              )}
              {(lifecycle === "paused" ||
                lifecycle === "finished" ||
                lifecycle === "not_started") && (
                <p className="text-xs text-cool-gray">
                  {lifecycle === "paused"
                    ? "Reprends la ligue pour gérer le cycle de saison."
                    : lifecycle === "finished"
                      ? "Réouvre la ligue pour gérer le cycle de saison."
                      : "Le cycle de saison sera actif dès que la ligue aura démarré."}
                </p>
              )}
              <button
                type="button"
                onClick={() => navigate(`/league/${league.id}/seasons`)}
                className="w-full text-left text-xs text-cool-gray underline-offset-2 hover:text-white hover:underline transition-colors"
              >
                Voir l&apos;historique des saisons →
              </button>
            </div>
          </div>
        )}

        {/* Ghost management entry */}
        {leagueGhosts.length > 0 && (
          <div className="space-y-2">
            <span className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray block">
              <span className="inline-flex items-center gap-1.5">
                <Ghost size={12} />
                Joueurs fantômes ({leagueGhosts.length})
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

        {/* Events */}
        <div className="space-y-2">
          <span className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray block">
            Événements ({leagueEvents.length})
          </span>
          {leagueEvents.length > 0 ? (
            <div className="space-y-2">
              {leagueEvents.map((event) => (
                <button
                  type="button"
                  key={event.id}
                  onClick={() => navigate(`/event/${event.id}`)}
                  className="w-full bg-navy-deep p-3 rounded-card flex justify-between items-center hover:border-card-muted cursor-pointer transition-colors border border-card text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-archivo font-semibold text-white flex items-center gap-2 text-sm">
                      {event.name}
                      {event.isFinished && (
                        <span className="text-[10px] bg-lime/20 text-lime px-2 py-0.5 rounded">
                          Terminé
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-cool-gray">
                      {new Date(event.date).toLocaleDateString("fr-FR")} •{" "}
                      {event.matches.length} matchs
                    </div>
                  </div>
                  <div className="text-cool-gray">→</div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-cool-gray text-xs">Aucun événement associé.</p>
          )}
          <PButton
            type="button"
            variant="ghost"
            size="md"
            full
            icon={<Plus size={16} />}
            onClick={() => navigate(`/create-event?leagueId=${league.id}`)}
          >
            Créer un événement
          </PButton>
        </div>

        {/* Players */}
        <div className="space-y-2">
          <span className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray block">
            Joueurs ({sortedPlayers.length})
          </span>
          {sortedPlayers.length === 0 ? (
            <p className="text-cool-gray text-xs">
              Aucun joueur dans cette ligue.
            </p>
          ) : (
            <div className="space-y-2">
              {sortedPlayers.map((player) => (
                <div key={player.id}>
                  {editingPlayerId === player.id ? (
                    <div className="bg-electric-blue/10 border border-electric-blue/30 p-3 rounded-card flex items-center gap-2">
                      <input
                        autoFocus
                        value={editingPlayerName}
                        onChange={(e) => setEditingPlayerName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const trimmed = editingPlayerName.trim();
                            if (trimmed && trimmed !== player.name) {
                              updatePlayer(league.id, player.id, trimmed);
                            }
                            setEditingPlayerId(null);
                          }
                          if (e.key === "Escape") setEditingPlayerId(null);
                        }}
                        className="flex-1 bg-navy-deep border border-card rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-electric-blue"
                        aria-label="Nouveau nom du joueur"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = editingPlayerName.trim();
                          if (trimmed && trimmed !== player.name) {
                            updatePlayer(league.id, player.id, trimmed);
                          }
                          setEditingPlayerId(null);
                        }}
                        className="px-3 py-1.5 bg-electric-blue text-white text-sm font-bold rounded-md"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPlayerId(null)}
                        className="p-1.5 text-cool-gray hover:text-white"
                        aria-label="Annuler"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="bg-navy-deep p-3 rounded-card flex items-center justify-between border border-card">
                      <button
                        type="button"
                        onClick={() => navigate(`/player/${player.id}`)}
                        className="flex-1 flex items-center gap-4 cursor-pointer text-left"
                      >
                        <div className="font-archivo font-semibold text-white text-sm">
                          {player.name}
                        </div>
                        <div className="text-xs text-cool-gray">
                          {player.elo} ELO • {player.wins}V - {player.losses}D
                        </div>
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPlayerId(player.id);
                            setEditingPlayerName(player.name);
                          }}
                          className="p-2 hover:bg-navy-soft rounded-md text-cool-gray hover:text-white"
                          aria-label="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              confirm(
                                `Supprimer ${player.name} ? Tous ses matchs seront également supprimés.`,
                              )
                            ) {
                              deletePlayer(league.id, player.id);
                            }
                          }}
                          className="p-2 hover:bg-signal-red/20 text-signal-red rounded-md"
                          aria-label="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zone de danger — Supprimer la ligue */}
        <div className="space-y-2">
          <span className="font-mono uppercase text-[10px] tracking-[2px] text-signal-red block">
            <span className="inline-flex items-center gap-1.5">
              <AlertTriangle size={12} />
              Zone de danger
            </span>
          </span>
          <div className="rounded-card border border-signal-red/30 bg-signal-red/5 p-3 space-y-3">
            <div>
              <div className="text-white font-archivo font-semibold text-sm">
                Supprimer la ligue
              </div>
              <div className="text-cool-gray text-xs mt-0.5">
                Suppression définitive. Tous les événements, matchs, joueurs et
                ELO seront perdus.
              </div>
            </div>
            <PButton
              type="button"
              variant="ghost"
              size="md"
              full
              icon={<Trash2 size={16} />}
              onClick={handleDeleteLeague}
              data-testid="settings-delete-league"
            >
              Supprimer la ligue
            </PButton>
          </div>
        </div>

        {/* Sticky save CTA — visible uniquement si modifications en attente */}
        {isDirty && (
          <div
            className="fixed inset-x-0 bottom-0 bg-navy/95 backdrop-blur border-t border-card px-4 py-3 md:py-4 z-10"
            data-testid="settings-save-panel"
          >
            <div className="max-w-2xl mx-auto">
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
        )}
      </form>

      <GhostManagementSheet
        isOpen={showGhostMgmt}
        onClose={() => setShowGhostMgmt(false)}
        guests={leagueGhosts}
        joinPath={`/league/${league.id}/join`}
        onRename={handleRenameGhost}
        onDelete={handleDeleteGhost}
        onArchive={handleArchiveGhost}
        onGenerateInvite={handleGenerateGhostInvite}
      />
    </div>
  );
};

export default LeagueSettings;
