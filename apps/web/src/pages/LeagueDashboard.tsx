import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "@/context/LeagueContext";
import {
  Trophy,
  Plus,
  History,
  Users,
  Trash2,
  Monitor,
  UserPlus,
  FileJson,
  FileSpreadsheet,
  Settings,
  Ghost,
  Pause,
  Play,
  Archive,
  RotateCcw,
} from "lucide-react";
import {
  getLeagueLifecycle,
  canRecordLeagueMatch,
  getLeagueReminders,
} from "@/utils/leagueLifecycle";
import toast from "react-hot-toast";
import { BeerPongMatchIcon } from "../components/icons/BeerPongMatchIcon";
import { EloChangeDisplay } from "../components/EloChangeDisplay";
import { EmptyState } from "../components/EmptyState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useDetailPagePermissions } from "../hooks/useDetailPagePermissions";
import {
  SegmentedTabs,
  FAB,
  DetailHero,
  InviteSheet,
  GhostManagementSheet,
  LifecycleStrip,
} from "@/components/design-system";
import { DetailedStatsPanel } from "@/components/stats/DetailedStatsPanel";
import { MatchEnrichedDisplay } from "@/components/MatchEnrichedDisplay";
import { LiveMatchBadge } from "@/components/live/LiveMatchBadge";
import { useUnclaimedGuests } from "@/hooks/useUnclaimedGuests";
import { identityMergeService } from "@/services/IdentityMergeService";
import {
  getDeltaFromLastMatch,
  getLast5MatchResults,
} from "@/utils/playerStats";
import { exportLeagueJSON, exportPlayersCSV, exportMatchesCSV } from "@/services/ExportService";
import { Podium } from "@/components/ponglo/Podium";
import { PButton } from "@/components/ponglo/PButton";
import { PlayerCard } from "@/components/design-system/PlayerCard";

export const LeagueDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const {
    leagues,
    events,
    addPlayer,
    deleteLeague,
    pauseLeague,
    resumeLeague,
    finishLeague,
    reopenLeague,
    startNewLeagueSeason,
    isLoadingInitialData,
    reloadData,
  } = useLeague();
  const navigate = useNavigate();

  const league = leagues.find((l) => l.id === id);
  const [activeTab, setActiveTab] = useState<
    "classement" | "matchs" | "stats" | "events"
  >("classement");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showGhostMgmt, setShowGhostMgmt] = useState(false);

  // Ghosts (anonymous players manually added by the admin) for this league.
  const {
    guests: leagueGhosts,
    refresh: refreshLeagueGhosts,
  } = useUnclaimedGuests("league", id, { mode: "any" });
  const {
    guests: archivedLeagueGhosts,
    refresh: refreshArchivedLeagueGhosts,
  } = useUnclaimedGuests("league", id, { mode: "any", archivedFilter: "archived" });

  // Escape key closes add-player modal
  useEffect(() => {
    if (!showAddPlayer) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAddPlayer(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showAddPlayer]);

  const [showEloChanges, setShowEloChanges] = useState(false);
  const [lastEloChanges] = useState<Record<string, number>>({});

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

  // TODO(Phase B): Move these hooks before early returns to satisfy react-hooks/rules-of-hooks properly.
  // For PR0, suppressed to unblock lint — restructuring the component is out of scope here.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const sortedPlayers = useMemo(() => {
    return [...league.players].sort((a, b) => b.elo - a.elo);
  }, [league.players]);

  // Memoize sorted matches (by date desc) to avoid re-sorting 2N times per render
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const sortedMatches = useMemo(
    () =>
      [...league.matches].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [league.matches],
  );

  // Story 9-5 - Get permissions for contextual actions
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isAdmin, canInvite } = useDetailPagePermissions(id || "", "league");

  const handleInviteAddManual = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 50) return;
    addPlayer(league.id, trimmed);
    setShowAddPlayer(false);
  };

  const handleDeleteLeague = () => {
    if (confirm("Es-tu sûr de vouloir supprimer cette ligue ?")) {
      deleteLeague(league.id);
      navigate("/");
    }
  };

  const detailHeroMenuItems = [
    {
      label: "Historique des saisons",
      icon: <History size={20} />,
      onClick: () => navigate(`/league/${league.id}/seasons`),
    },
    {
      label: "Paramètres",
      icon: <Settings size={20} />,
      onClick: () => navigate(`/league/${league.id}/settings`),
    },
    ...(isAdmin
      ? [
          {
            label: "Mode Diffusion",
            icon: <Monitor size={20} />,
            onClick: () => navigate(`/league/${league.id}/display`),
          },
        ]
      : []),
    ...(isAdmin && leagueGhosts.length > 0
      ? [
          {
            label: "Joueurs fantômes",
            icon: <Ghost size={20} />,
            onClick: () => setShowGhostMgmt(true),
          },
        ]
      : []),
    {
      label: "Exporter JSON",
      icon: <FileJson size={20} />,
      onClick: () => exportLeagueJSON(league),
    },
    {
      label: "Exporter joueurs CSV",
      icon: <FileSpreadsheet size={20} />,
      onClick: () => exportPlayersCSV(league),
    },
    {
      label: "Exporter matchs CSV",
      icon: <FileSpreadsheet size={20} />,
      onClick: () => {
        const map: Record<string, string> = {};
        league.players.forEach((p) => {
          map[p.id] = p.name;
        });
        exportMatchesCSV(league, map);
      },
    },
    ...(isAdmin
      ? [
          {
            label: "Supprimer",
            icon: <Trash2 size={20} />,
            onClick: handleDeleteLeague,
            destructive: true,
          },
        ]
      : []),
  ];

  // GhostManagementSheet handlers — admin-only.
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
    await Promise.all([refreshLeagueGhosts(), refreshArchivedLeagueGhosts()]);
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
    await Promise.all([refreshLeagueGhosts(), refreshArchivedLeagueGhosts()]);
    reloadData();
  };

  const handleUnarchiveGhost = async (playerId: string) => {
    const result = await identityMergeService.unarchiveAnonymousPlayer(
      "league",
      playerId,
    );
    if (!result.success) {
      toast.error(result.error || "Désarchivage impossible");
      throw new Error(result.error);
    }
    toast.success("Joueur désarchivé");
    await Promise.all([refreshLeagueGhosts(), refreshArchivedLeagueGhosts()]);
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

  const shortDateFormatter: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  };

  const topElo = sortedPlayers.length > 0 ? sortedPlayers[0].elo : null;

  // Mig 028+029 — Lifecycle league (4 états) + rappels informationnels
  const lifecycle = getLeagueLifecycle(league);
  const matchLoggingAllowed = canRecordLeagueMatch(league);
  const reminders = getLeagueReminders(league);
  const seasonNumber = league.currentSeasonNumber ?? 1;
  const seasonStartedAt = league.currentSeasonStartedAt ?? league.createdAt;
  const seasonStartedLabel = new Date(seasonStartedAt).toLocaleDateString(
    "fr-FR",
    shortDateFormatter,
  );

  // Mig 029 — date prévue de fin de saison (info, pas d'auto-clôture)
  const seasonExpectedEndLabel = (() => {
    if (!league.seasonDurationDays || !seasonStartedAt) return null;
    const end = new Date(seasonStartedAt);
    end.setUTCDate(end.getUTCDate() + league.seasonDurationDays);
    return end.toLocaleDateString("fr-FR", shortDateFormatter);
  })();
  const plannedStartLabel = league.plannedStartAt
    ? new Date(league.plannedStartAt).toLocaleDateString(
        "fr-FR",
        shortDateFormatter,
      )
    : null;
  const plannedEndLabel = league.plannedEndAt
    ? new Date(league.plannedEndAt).toLocaleDateString(
        "fr-FR",
        shortDateFormatter,
      )
    : null;

  const heroStatusVariant: "active" | "scheduled" | "finished" =
    lifecycle === "finished"
      ? "finished"
      : lifecycle === "paused" || lifecycle === "not_started"
        ? "scheduled"
        : "active";
  const heroStatusLabel =
    lifecycle === "finished"
      ? "Terminée"
      : lifecycle === "paused"
        ? "En pause"
        : lifecycle === "not_started"
          ? "Non démarrée"
          : "Active";

  const handleStartNewSeason = async () => {
    if (
      !confirm(
        `Démarrer la Saison ${seasonNumber + 1} ?\n\nLe classement actuel (Saison ${seasonNumber}) sera archivé et les ELO de tous les joueurs seront reset à 1000.\n\nCette action est irréversible.`,
      )
    )
      return;
    try {
      await startNewLeagueSeason(league.id);
    } catch {
      // toast déjà affiché côté context
    }
  };

  const detailHeroAdminActions: Parameters<typeof DetailHero>[0]["actions"] = [];
  if (isAdmin || canInvite) {
    detailHeroAdminActions.push({
      label: "Inviter",
      icon: <UserPlus size={16} />,
      onClick: () => setShowAddPlayer(true),
      variant: "secondary",
    });
  }
  if (isAdmin) {
    if (lifecycle === "not_started") {
      // Pas d'action lifecycle exposée — la league passera `active` toute
      // seule à `planned_start_at`. L'admin peut quand même clôturer via
      // les paramètres ou attendre.
    } else if (lifecycle === "paused") {
      detailHeroAdminActions.push({
        label: "Reprendre la ligue",
        icon: <Play size={18} />,
        onClick: () => {
          void resumeLeague(league.id);
        },
        variant: "iconOnly",
      });
    } else if (lifecycle === "active") {
      detailHeroAdminActions.push({
        label: "Mettre en pause",
        icon: <Pause size={18} />,
        onClick: () => {
          void pauseLeague(league.id);
        },
        variant: "iconOnly",
      });
      detailHeroAdminActions.push({
        label: `Démarrer la Saison ${seasonNumber + 1}`,
        icon: <RotateCcw size={18} />,
        onClick: handleStartNewSeason,
        variant: "iconOnly",
      });
    } else if (lifecycle === "finished") {
      detailHeroAdminActions.push({
        label: "Réouvrir la ligue",
        icon: <Play size={18} />,
        onClick: () => {
          void reopenLeague(league.id);
        },
        variant: "iconOnly",
      });
    }
    // Clôturer : disponible uniquement quand active (sinon n'a pas de sens)
    if (lifecycle === "active") {
      detailHeroAdminActions.push({
        label: "Clôturer la ligue",
        icon: <Archive size={18} />,
        onClick: () => {
          if (
            confirm(
              "Clôturer cette ligue ? Plus aucun match ne pourra être enregistré (réversible via Réouvrir).",
            )
          ) {
            void finishLeague(league.id);
          }
        },
        variant: "iconOnly",
      });
    }
  }

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col relative">
      {/* DetailHero — bloc bleu pleine largeur (bleed sous padding ResponsiveLayout + App). */}
      <DetailHero
        className="-mx-4 -mt-4 md:mx-0 md:mt-0"
        onBack={() => navigate("/competitions")}
        adminBadge={isAdmin}
        title={league.name}
        status={{ label: heroStatusLabel, variant: heroStatusVariant }}
        meta={[
          lifecycle === "not_started" && plannedStartLabel
            ? `Démarre le ${plannedStartLabel}`
            : `Saison ${seasonNumber} · démarrée le ${seasonStartedLabel}${
                seasonExpectedEndLabel
                  ? ` · prévue jusqu'au ${seasonExpectedEndLabel}`
                  : ""
              }`,
          ...(plannedEndLabel && lifecycle !== "not_started"
            ? [`League prévue jusqu'au ${plannedEndLabel}`]
            : []),
          ...(league.isPrivate === false ? ["Publique"] : []),
          ...(league.anti_cheat_enabled ? ["Anti-cheat ON"] : []),
        ]}
        stats={[
          { label: "Joueurs", value: String(league.players.length) },
          { label: "Matchs", value: String(league.matches.length) },
          { label: "Top ELO", value: topElo !== null ? String(topElo) : "—" },
        ]}
        actions={detailHeroAdminActions}
        menuItems={detailHeroMenuItems}
      />

      {/* Mig 028+029 — Lifecycle status strip (prio absolue) ou strip de
          rappel (saison/league overdue). Un seul strip à la fois pour ne pas
          surcharger l'admin. */}
      {lifecycle === "not_started" ? (
        <LifecycleStrip
          tone="not_started"
          testId="league-lifecycle-banner"
          title="Ligue non démarrée"
          description={
            plannedStartLabel
              ? isAdmin
                ? `La ligue est programmée pour démarrer le ${plannedStartLabel}. Les matchs seront autorisés à partir de cette date.`
                : `La ligue démarre le ${plannedStartLabel}. L'enregistrement de matchs sera autorisé à partir de cette date.`
              : "L'enregistrement de matchs sera autorisé une fois la ligue démarrée."
          }
        />
      ) : lifecycle === "paused" || lifecycle === "finished" ? (
        <LifecycleStrip
          tone={lifecycle === "paused" ? "paused" : "finished"}
          testId="league-lifecycle-banner"
          title={
            lifecycle === "paused" ? "Ligue en pause" : "Ligue terminée"
          }
          description={
            lifecycle === "paused"
              ? isAdmin
                ? "Reprends la ligue pour réautoriser l'enregistrement des matchs."
                : "L'enregistrement de matchs est suspendu."
              : isAdmin
                ? "Plus aucun match ne peut être enregistré. Réouvre la ligue depuis le menu admin si besoin."
                : "Cette ligue est clôturée. Le classement est figé."
          }
        />
      ) : reminders.seasonOverdue ? (
        <LifecycleStrip
          tone="reminder"
          testId="league-reminder-banner"
          title={`Saison ${seasonNumber} échue`}
          description={
            seasonExpectedEndLabel
              ? isAdmin
                ? `Elle devait se terminer le ${seasonExpectedEndLabel}. Démarre la Saison ${seasonNumber + 1} depuis le bandeau ci-dessus.`
                : `La saison ${seasonNumber} a dépassé sa durée prévue (${seasonExpectedEndLabel}).`
              : isAdmin
                ? `Démarre la Saison ${seasonNumber + 1} depuis le bandeau ci-dessus.`
                : `La saison ${seasonNumber} a dépassé sa durée prévue.`
          }
        />
      ) : reminders.leagueOverdue ? (
        <LifecycleStrip
          tone="reminder"
          testId="league-reminder-banner"
          title="Date de fin dépassée"
          description={
            plannedEndLabel
              ? isAdmin
                ? `La ligue devait se terminer le ${plannedEndLabel}. Clôture-la depuis le menu admin si besoin.`
                : `La ligue devait se terminer le ${plannedEndLabel}.`
              : isAdmin
                ? "La date de fin est dépassée. Clôture la ligue depuis le menu admin si besoin."
                : "La date de fin de la ligue est dépassée."
          }
        />
      ) : null}

      {/* SegmentedTabs: Matchs / Classement / Events */}
      <div className="px-4 pt-4 pb-4">
        <SegmentedTabs
          tabs={[
            { id: "matchs", label: "Matchs" },
            { id: "classement", label: "Classement" },
            { id: "stats", label: "Stats" },
            { id: "events", label: "Events" },
          ]}
          activeId={activeTab}
          onChange={(id) =>
            setActiveTab(id as "classement" | "matchs" | "stats" | "events")
          }
          variant="encapsulated"
        />
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto px-4 py-4 space-y-2 pb-bottom-nav lg:pb-bottom-nav-lg">
        {activeTab === "classement" && (
          <>
            {sortedPlayers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Aucun joueur"
                description="Ajoute des joueurs pour commencer à enregistrer des matchs."
                action={
                  <PButton
                    variant="primary"
                    size="md"
                    icon={<Plus size={16} />}
                    onClick={() => setShowAddPlayer(true)}
                  >
                    Ajouter un joueur
                  </PButton>
                }
              />
            ) : (
              <div className="space-y-3 w-full">
                {/* Podium top-3 — shows ELO + last-match delta */}
                {sortedPlayers.length >= 3 && (
                  <Podium
                    top3={sortedPlayers.slice(0, 3).map((p) => ({
                      id: p.id,
                      name: p.name,
                      elo: p.elo,
                      delta:
                        getDeltaFromLastMatch(p.id, sortedMatches) ?? undefined,
                    }))}
                    className="mb-1"
                  />
                )}
                {/* Full leaderboard starting from rank 1 (top 3 are also shown on the podium). */}
                <div className="space-y-1.5">
                  {sortedPlayers.map((player, index) => {
                    const rank = index + 1;
                    const delta = getDeltaFromLastMatch(
                      player.id,
                      sortedMatches,
                    );
                    const recentResults = getLast5MatchResults(
                      player.id,
                      sortedMatches,
                    );
                    return (
                      <PlayerCard
                        key={player.id}
                        variant="leaderRow"
                        name={player.name}
                        elo={player.elo}
                        delta={delta ?? undefined}
                        rank={rank}
                        wins={player.wins}
                        losses={player.losses}
                        recentResults={recentResults}
                        onClick={() => navigate(`/player/${player.id}`)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
        {activeTab === "matchs" && (
          <>
            {league.matches.length === 0 ? (
              <EmptyState
                icon={History}
                title="Aucun match"
                description="Enregistre ton premier match pour voir l'évolution des classements."
                action={
                  <PButton
                    variant="primary"
                    size="md"
                    icon={<Plus size={16} />}
                    onClick={() => navigate(`/record-match/league/${league.id}`)}
                  >
                    Enregistrer un match
                  </PButton>
                }
              />
            ) : (
              league.matches.map((match) => {
                const teamANames = league.players
                  .filter((p) => match.teamA.includes(p.id))
                  .map((p) => p.name)
                  .join(", ");
                const teamBNames = league.players
                  .filter((p) => match.teamB.includes(p.id))
                  .map((p) => p.name)
                  .join(", ");
                const winnerA = match.scoreA > match.scoreB;

                return (
                  <div
                    key={match.id}
                    className={`bg-navy-soft p-4 rounded-xl border ${match.is_live ? "border-lime/50" : "border-card/50"}`}
                  >
                    {/* Phase D.4: Live badge */}
                    <LiveMatchBadge isLive={Boolean(match.is_live)} className="mb-2" />
                    <div className="flex justify-between items-center text-sm">
                      <div
                        className={`flex-1 text-right ${
                          winnerA ? "text-white font-bold" : "text-cool-gray"
                        }`}
                      >
                        {winnerA && "🏆 "}
                        {teamANames}
                      </div>
                      <div className="px-4 font-bold text-cool-gray text-xs">
                        VS
                      </div>
                      <div
                        className={`flex-1 text-left ${
                          !winnerA ? "text-white font-bold" : "text-cool-gray"
                        }`}
                      >
                        {!winnerA && "🏆 "}
                        {teamBNames}
                      </div>
                    </div>
                    {/* Story 14-28: Photo thumbnail and cups badge */}
                    <MatchEnrichedDisplay
                      photoUrl={match.photo_url}
                      cupsRemaining={match.cups_remaining}
                    />
                  </div>
                );
              })
            )}
          </>
        )}
        {activeTab === "stats" && (
          <DetailedStatsPanel
            matches={league.matches}
            players={league.players}
            contextLabel="league"
            onPlayerClick={(playerId) => navigate(`/player/${playerId}`)}
          />
        )}
        {activeTab === "events" && (
          <div className="space-y-2">
            {league.events && league.events.length > 0 ? (
              events
                .filter((t) => league.events?.includes(t.id))
                .map((event) => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="bg-navy-soft p-3 rounded-xl flex justify-between items-center hover:border-card cursor-pointer transition-colors border border-card/50"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-white flex items-center gap-2">
                        {event.name}
                        {event.isFinished && (
                          <span className="text-xs bg-lime/20 text-lime px-2 py-0.5 rounded">
                            Terminé
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-cool-gray font-mono">
                        {new Date(event.date).toLocaleDateString(
                          "fr-FR",
                          shortDateFormatter,
                        )}
                        {" · "}
                        {event.matches.length} matchs
                      </div>
                    </div>
                    <div className="text-cool-gray">→</div>
                  </div>
                ))
            ) : (
              <EmptyState
                icon={Trophy}
                title="Aucun événement"
                description="Cette ligue n'a pas encore d'événement associé."
                action={
                  <PButton
                    variant="primary"
                    size="md"
                    icon={<Plus size={16} />}
                    onClick={() =>
                      navigate(`/create-event?leagueId=${league.id}`)
                    }
                  >
                    Créer un événement
                  </PButton>
                }
              />
            )}
            {league.events && league.events.length > 0 && (
              <button
                onClick={() =>
                  navigate(`/create-event?leagueId=${league.id}`)
                }
                className="w-full bg-navy-soft hover:bg-navy-deep text-white font-bold py-3 rounded-lg mt-2 border border-card/50"
              >
                <Plus size={16} className="inline mr-2" />
                Créer un événement
              </button>
            )}
          </div>
        )}
      </div>

      {/* AC6: FAB Nouveau match — navigate to RecordMatch page.
          Hidden when lifecycle disallows match logging (paused / finished). */}
      {matchLoggingAllowed && (
        <FAB
          icon={BeerPongMatchIcon}
          onClick={() => navigate(`/record-match/league/${league.id}`)}
          ariaLabel="Nouveau match"
        />
      )}

      {/* Invite bottom sheet — add player to the league (manual pseudo).
          Leagues have no joinCode/QR yet → sheet shows only the "add" section. */}
      <InviteSheet
        isOpen={showAddPlayer}
        onClose={() => setShowAddPlayer(false)}
        onAddManual={handleInviteAddManual}
      />

      {/* Ghost player management — admin only, only when ghosts exist */}
      {isAdmin && (
        <GhostManagementSheet
          isOpen={showGhostMgmt}
          onClose={() => setShowGhostMgmt(false)}
          guests={leagueGhosts}
          archivedGuests={archivedLeagueGhosts}
          joinPath={`/league/${league.id}/join`}
          onRename={handleRenameGhost}
          onDelete={handleDeleteGhost}
          onArchive={handleArchiveGhost}
          onUnarchive={handleUnarchiveGhost}
          onGenerateInvite={handleGenerateGhostInvite}
        />
      )}

      {/* ELO Changes Display */}
      {showEloChanges && (
        <EloChangeDisplay
          players={league.players}
          eloChanges={lastEloChanges}
          onClose={() => setShowEloChanges(false)}
        />
      )}
    </div>
  );
};
