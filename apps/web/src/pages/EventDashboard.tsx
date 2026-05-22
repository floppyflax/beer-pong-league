import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "@/context/LeagueContext";
import {
  Trophy,
  Users,
  History,
  Monitor,
  LogOut,
  UserPlus,
  Settings,
  MoreVertical,
  Pencil,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  Hourglass,
  XCircle,
  Link2,
} from "lucide-react";
import { usePendingMatches } from "@/hooks/usePendingMatches";
import { getEventLifecycle, canLogMatch } from "@/utils/eventLifecycle";
import { BeerPongMatchIcon } from "@/components/icons/BeerPongMatchIcon";
import { EloChangeDisplay } from "@/components/EloChangeDisplay";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DetailedStatsPanel } from "@/components/stats/DetailedStatsPanel";
import {
  MatchEnrichedDisplay,
  hasMatchEnrichedContent,
} from "@/components/MatchEnrichedDisplay";
import { MatchTeamsRow } from "@/components/match/MatchTeamsRow";
import { LiveMatchBadge } from "@/components/live/LiveMatchBadge";
import { databaseService } from "@/services/DatabaseService";
import { useAuthContext } from "@/context/AuthContext";
import { useIdentity } from "@/hooks/useIdentity";
import { toast } from "react-hot-toast";
import { useDetailPagePermissions } from "@/hooks/useDetailPagePermissions";
import {
  SegmentedTabs,
  FAB,
  DetailHero,
  InviteSheet,
  GhostManagementSheet,
  LifecycleStrip,
} from "@/components/design-system";
import type {
  DetailHeroAction,
  DetailHeroMenuItem,
} from "@/components/design-system";
import { useUnclaimedGuests } from "@/hooks/useUnclaimedGuests";
import { identityMergeService } from "@/services/IdentityMergeService";
import { matchAdminService } from "@/services/MatchAdminService";
import { eloRecalcService } from "@/services/EloRecalcService";
import { Podium } from "@/components/ponglo/Podium";
import { PButton } from "@/components/ponglo/PButton";
import { PlayerCard } from "@/components/design-system/PlayerCard";

import {
  getDeltaFromLastMatch,
  getLast5MatchResults,
  getRankDeltasFromLastMatch,
} from "@/utils/playerStats";

// Task 4 - Utility function for relative timestamps (AC4)
// Format français lisible : « Il y a 4 jours à 17:12 » (vs. l'ancien
// « 4j à 17:12 » qui se confondait avec un score). Pour les matches
// dans la même semaine on conserve l'heure pour différencier deux
// matches du même jour ; au-delà on bascule sur la date courte.
function getRelativeTimestamp(date: string): string {
  const now = new Date();
  const matchDate = new Date(date);
  const diffMs = now.getTime() - matchDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const time = matchDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) {
    return diffHours === 1 ? "Il y a 1 heure" : `Il y a ${diffHours} heures`;
  }
  if (diffDays === 1) return `Hier à ${time}`;
  if (diffDays < 7) return `Il y a ${diffDays} jours à ${time}`;
  return matchDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const EventDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { user, isAuthenticated } = useAuthContext();
  const { localUser } = useIdentity();
  const {
    events,
    leagues,
    startEvent,
    pauseEvent,
    resumeEvent,
    getEventLocalRanking,
    addPlayer,
    addPlayerToEvent,
    addGuestPlayerToEvent,
    isLoadingInitialData,
    reloadData,
  } = useLeague();

  const [activeTab, setActiveTab] = useState<
    "classement" | "matchs" | "stats"
  >("classement");
  const [showEloChanges, setShowEloChanges] = useState(false);
  const [lastEloChanges] = useState<Record<string, number>>({});
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showGhostMgmt, setShowGhostMgmt] = useState(false);
  const [openMatchMenuId, setOpenMatchMenuId] = useState<string | null>(null);

  // Ghosts (anonymous players manually added by the admin) for this event.
  // We use mode: "any" so the list is loaded for the admin even though the
  // legacy default ("auth-only") would otherwise also work — explicit is safer.
  const {
    guests: eventGhosts,
    refresh: refreshEventGhosts,
  } = useUnclaimedGuests("event", id, { mode: "any" });
  const {
    guests: archivedEventGhosts,
    refresh: refreshArchivedEventGhosts,
  } = useUnclaimedGuests("event", id, { mode: "any", archivedFilter: "archived" });

  // Escape key closes Add Player modal (InviteSheet manages its own but we keep
  // for backward compat with other modals that might be open)
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

  // Find event (but ALL hooks must still be called even if null)
  const event = events.find((t) => t.id === id);

  // Matchs triés du plus récent au plus ancien — requis par les utils `playerStats`
  const sortedMatches = useMemo(
    () =>
      [...(event?.matches ?? [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [event?.matches],
  );

  // Load event participants from event_players (IDs match match.teamA/teamB)
  const [eventParticipants, setEventParticipants] = useState<
    { id: string; leaguePlayerId?: string; name: string; elo: number; wins: number; losses: number; matchesPlayed: number; streak: number; avatarUrl?: string | null }[]
  >([]);

  useEffect(() => {
    if (!id) return;
    databaseService
      .loadEventParticipants(id)
      .then((participants) =>
        setEventParticipants(
          participants.map((p) => ({
            id: p.id,
            leaguePlayerId: p.leaguePlayerId,
            name: p.name,
            elo: p.elo,
            wins: p.wins,
            losses: p.losses,
            matchesPlayed: p.matchesPlayed,
            streak: 0,
            avatarUrl: p.avatarUrl,
          })),
        ),
      )
      .catch(() => setEventParticipants([]));
  }, [id, event?.matches.length, event?.playerIds?.length]);

  // Calculate derived data (safe to do even if event is null)
  const league = event?.leagueId
    ? leagues.find((l) => l.id === event.leagueId)
    : null;
  // Use event participants (from event_players) - IDs match match.teamA/teamB
  const eventPlayers = eventParticipants;
  // For PlayerProfile navigation: use leaguePlayerId when available so /player/:id finds the player
  const getPlayerProfileId = (p: { id: string; leaguePlayerId?: string }) =>
    p.leaguePlayerId || p.id;

  // Story 9-5 - Get permissions for contextual actions
  const { isAdmin, canInvite } = useDetailPagePermissions(
    id || "",
    "event",
  );

  // Mig 030 — anti-cheat: pending matches the current user can validate
  const { count: pendingValidationCount } = usePendingMatches({ eventId: id });

  // Ranking is always the event-local one. Direction taken since the
  // event/league toggle was retired (mig: event ELO is contextual, the
  // league context has its own dashboard with its own ranking).
  // Pass eventParticipants so ranking uses event_players.id (matches match.teamA/teamB)
  const ranking = useMemo(() => {
    if (!event) return [];
    return getEventLocalRanking(event.id, eventParticipants);
  }, [event, eventParticipants, getEventLocalRanking]);

  const rankDeltas = useMemo(
    () => getRankDeltasFromLastMatch(ranking, sortedMatches),
    [ranking, sortedMatches],
  );

  // Auto-add new players from League to Event - MUST be called unconditionally
  useEffect(() => {
    if (!event?.leagueId || !league) return;

    const leaguePlayerIds = league.players.map((p) => p.id);
    const missingPlayers = leaguePlayerIds.filter(
      (id) => !event.playerIds.includes(id),
    );

    if (missingPlayers.length > 0) {
      missingPlayers.forEach((playerId) => {
        addPlayerToEvent(event.id, playerId);
      });
    }
    // Only trigger when league player count changes to avoid unnecessary re-syncs
  }, [league?.players.length]);

  // NOW we can have conditional returns (after ALL hooks)
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

  // Task 7 - Leave event functionality (Story 8.3, AC7)
  const handleLeaveEvent = async () => {
    if (confirm("Es-tu sûr de vouloir quitter cet événement ?")) {
      try {
        await databaseService.leaveEvent(
          event.id,
          isAuthenticated ? user?.id : undefined,
          !isAuthenticated ? localUser?.anonymousUserId : undefined,
        );

        // Reload data to update context
        await reloadData();

        // Navigate to home
        navigate("/");

        // Show success toast (AC7)
        toast.success("Tu as quitté l'événement");
      } catch (error: unknown) {
        console.error("Error leaving event:", error);
        toast.error(
          error instanceof Error ? error.message : "Erreur lors de la sortie de l'événement",
        );
      }
    }
  };

  const handleInviteAddManual = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      if (event.leagueId) {
        // Tournoi rattaché : on ajoute dans la ligue, la sync auto propage au tournoi.
        addPlayer(event.leagueId, trimmed);
      } else {
        // Tournoi standalone : ajout d'un guest distinct (nouvel anonymous_user
        // créé à chaque appel — sinon collision sur la contrainte unique
        // (event_id, anonymous_user_id) au 2e ajout).
        await addGuestPlayerToEvent(event.id, trimmed);
        await reloadData();
      }
      toast.success(`${trimmed} ajouté·e`);
      setShowAddPlayer(false);
    } catch (error) {
      console.error("Error adding manual player:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'ajout du joueur",
      );
    }
  };

  const handleInviteAddFromLeagueBulk = async (
    leaguePlayerIds: string[],
  ) => {
    if (leaguePlayerIds.length === 0 || !event.leagueId) return;
    try {
      // Sequential to avoid races on event_memberships and to keep the
      // single re-fetch at the end consistent. addLeaguePlayerToEvent is
      // idempotent so retries are safe.
      const eventPlayerIds: string[] = [];
      for (const lpId of leaguePlayerIds) {
        const eventPlayerId = await databaseService.addLeaguePlayerToEvent(
          event.id,
          lpId,
        );
        eventPlayerIds.push(eventPlayerId);
      }
      eventPlayerIds.forEach((id) => addPlayerToEvent(event.id, id));
      await reloadData();
      databaseService
        .loadEventParticipants(event.id)
        .then((participants) =>
          setEventParticipants(
            participants.map((p) => ({
              id: p.id,
              leaguePlayerId: p.leaguePlayerId,
              name: p.name,
              elo: p.elo,
              wins: p.wins,
              losses: p.losses,
              matchesPlayed: p.matchesPlayed,
              streak: 0,
            })),
          ),
        )
        .catch(() => {});
      toast.success(
        leaguePlayerIds.length === 1
          ? "Joueur ajouté à l'événement"
          : `${leaguePlayerIds.length} joueurs ajoutés à l'événement`,
      );
      setShowAddPlayer(false);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'ajout du joueur",
      );
    }
  };

  // ── DetailHero derived state ─────────────────────────────────────────────
  // Lifecycle (mig 027) — drives the chip, the FAB visibility and the
  // contextual admin action (Démarrer / Pause / Reprendre).
  const lifecycle = getEventLifecycle(event);
  const matchLoggingAllowed = canLogMatch(event);

  const eventStatusVariant:
    | "finished"
    | "cancelled"
    | "live"
    | "active"
    | "scheduled" =
    event.status === "cancelled"
      ? "cancelled"
      : lifecycle === "finished"
        ? "finished"
        : lifecycle === "not_started"
          ? "scheduled"
          : lifecycle === "paused"
            ? "scheduled"
            : event.matches.some((m) => m.is_live)
              ? "live"
              : "active";

  const eventStatusLabel =
    eventStatusVariant === "cancelled"
      ? "Annulé"
      : lifecycle === "finished"
        ? "Terminé"
        : lifecycle === "not_started"
          ? "Non démarré"
          : lifecycle === "paused"
            ? "En pause"
            : eventStatusVariant === "live"
              ? "En direct"
              : "En cours";

  const formatLabel =
    event.format === "libre" ? "Format libre" : `Format ${event.format}`;

  // Mode de compétition : ELO (classement ponctuel) ou Bracket (élimination
  // directe). Défini à la création et immuable. Default 'elo' pour les anciens
  // tournois (cohérent avec la migration 011).
  const eventMode: "elo" | "bracket" = event.mode ?? "elo";
  const modeLabel = eventMode === "bracket" ? "Mode Bracket" : "Mode ELO";

  const dateLabel = new Date(event.date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  // Hero actions — spec uniforme event/league (mig 029) :
  //  • Admin : [Ajouter primary] [Pause/Démarrer/Reprendre iconOnly] [Paramètres iconOnly] [Mode Diffusion iconOnly]
  //  • Non-admin : [Ajouter primary], avec Quitter accessible via menu (seul item
  //    conservé pour les participants).
  const detailHeroActions: DetailHeroAction[] = [];
  if (isAdmin || canInvite) {
    detailHeroActions.push({
      label: "Ajouter",
      icon: <UserPlus size={16} />,
      onClick: () => setShowAddPlayer(true),
      variant: "primary",
    });
  }
  if (isAdmin) {
    if (lifecycle === "not_started") {
      detailHeroActions.push({
        label: "Démarrer l'événement",
        icon: <Play size={18} />,
        onClick: () => {
          void startEvent(event.id);
        },
        variant: "iconOnly",
      });
    } else if (lifecycle === "in_progress") {
      detailHeroActions.push({
        label: "Mettre en pause",
        icon: <Pause size={18} />,
        onClick: () => {
          void pauseEvent(event.id);
        },
        variant: "iconOnly",
      });
    } else if (lifecycle === "paused") {
      detailHeroActions.push({
        label: "Reprendre l'événement",
        icon: <Play size={18} />,
        onClick: () => {
          void resumeEvent(event.id);
        },
        variant: "iconOnly",
      });
    }
    detailHeroActions.push({
      label: "Paramètres",
      icon: <Settings size={18} />,
      onClick: () => navigate(`/event/${event.id}/settings`),
      variant: "iconOnly",
    });
    detailHeroActions.push({
      label: "Mode Diffusion",
      icon: <Monitor size={18} />,
      onClick: () => navigate(`/event/${event.id}/display`),
      variant: "iconOnly",
    });
  }

  const detailHeroMenuItems: DetailHeroMenuItem[] = !isAdmin
    ? [
        {
          label: "Quitter l'événement",
          icon: <LogOut size={20} />,
          onClick: handleLeaveEvent,
          destructive: true,
        },
      ]
    : [];

  // GhostManagementSheet handlers — admin-only.
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
      // Suppress toast for the "matches recorded" case — the sheet auto-falls
      // back to archive (which surfaces its own success toast).
      if (!result.error || !/match/i.test(result.error)) {
        toast.error(result.error || "Suppression impossible");
      }
      throw new Error(result.error);
    }
    toast.success("Joueur supprimé");
    await Promise.all([refreshEventGhosts(), refreshArchivedEventGhosts()]);
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
    await Promise.all([refreshEventGhosts(), refreshArchivedEventGhosts()]);
    reloadData();
  };

  const handleUnarchiveGhost = async (playerId: string) => {
    const result = await identityMergeService.unarchiveAnonymousPlayer(
      "event",
      playerId,
    );
    if (!result.success) {
      toast.error(result.error || "Désarchivage impossible");
      throw new Error(result.error);
    }
    toast.success("Joueur désarchivé");
    await Promise.all([refreshEventGhosts(), refreshArchivedEventGhosts()]);
    reloadData();
  };

  // Match admin actions (admin only). Edit navigates to RecordMatch in edit
  // mode; delete confirms then triggers an ELO replay if league-linked.
  const handleEditMatch = (matchId: string) => {
    setOpenMatchMenuId(null);
    navigate(
      `/record-match/event/${event.id}?editMatchId=${encodeURIComponent(matchId)}`,
    );
  };

  const handleDeleteMatch = async (matchId: string) => {
    setOpenMatchMenuId(null);
    if (
      !confirm(
        event.leagueId
          ? "Supprimer ce match ? Les ELO de l'événement et de la ligue seront recalculés."
          : "Supprimer ce match ? L'ELO de l'événement sera recalculé.",
      )
    )
      return;
    const callerUserId =
      isAuthenticated && user ? user.id : localUser?.anonymousUserId ?? null;
    const result = await matchAdminService.deleteMatch(matchId, callerUserId);
    if (!result.success) {
      toast.error(result.error || "Suppression impossible");
      return;
    }
    // Rebuild every ELO bubble this match touched: the event context always,
    // the league context too when the event propagates to a league (mig 032).
    const recalcErrors: string[] = [];
    if (result.eventId) {
      const r = await eloRecalcService.recalculateEventElo(result.eventId);
      if (!r.success && r.error) recalcErrors.push(`événement (${r.error})`);
    }
    if (result.leagueId) {
      const r = await eloRecalcService.recalculateLeagueElo(result.leagueId);
      if (!r.success && r.error) recalcErrors.push(`ligue (${r.error})`);
    }
    if (recalcErrors.length > 0) {
      toast.error(`Match supprimé mais recalcul ELO échoué : ${recalcErrors.join(", ")}`);
    } else {
      toast.success("Match supprimé, ELO recalculé");
    }
    await reloadData();
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

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col relative">
      {/* DetailHero — bloc bleu pleine largeur (bleed sous padding ResponsiveLayout + App) */}
      <DetailHero
        className="-mx-4 -mt-4 md:mx-0 md:mt-0"
        onBack={() => navigate("/competitions")}
        adminBadge={isAdmin}
        title={event.name}
        status={{
          label: eventStatusLabel,
          variant: eventStatusVariant,
        }}
        meta={[formatLabel, modeLabel, dateLabel]}
        subtitle={
          league ? (
            <button
              type="button"
              onClick={() => navigate(`/league/${league.id}`)}
              className="inline-flex items-center gap-1.5 max-w-full px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[11px] font-archivo font-extrabold uppercase tracking-[0.5px] transition-colors"
              aria-label={`Voir la ligue ${league.name}`}
            >
              <Link2 size={12} className="flex-shrink-0 opacity-70" />
              <span className="truncate">{league.name}</span>
            </button>
          ) : undefined
        }
        stats={[
          {
            label: "Joueurs",
            value: `${eventPlayers.length}${
              event.maxPlayers && event.maxPlayers < 999
                ? `/${event.maxPlayers}`
                : ""
            }`,
          },
          { label: "Matchs", value: String(event.matches.length) },
          {
            label: "Top ELO",
            value: ranking.length > 0 ? String(ranking[0].elo) : "—",
          },
        ]}
        actions={detailHeroActions}
        menuItems={detailHeroMenuItems}
      />

      {/* Lifecycle status strip — sits between hero and content, sticky so it
          stays visible while scrolling. Distinct ping-yellow accent so it
          doesn't get confused with match cards. */}
      {(lifecycle === "not_started" || lifecycle === "paused") && (
        <LifecycleStrip
          tone={lifecycle}
          testId="lifecycle-banner"
          title={
            lifecycle === "not_started"
              ? "Événement non démarré"
              : "Événement en pause"
          }
          description={
            lifecycle === "not_started"
              ? isAdmin
                ? "Démarre l'événement pour autoriser l'enregistrement des matchs."
                : "Les matchs pourront être enregistrés une fois l'événement démarré."
              : isAdmin
                ? "Reprends l'événement pour réautoriser l'enregistrement des matchs."
                : "L'enregistrement de matchs est suspendu."
          }
        />
      )}

      {/* Mig 030 — anti-cheat: pending validation banner. Same visual tone as
          LifecycleStrip but informational (not blocking), with an inline CTA. */}
      {pendingValidationCount > 0 && (
        <LifecycleStrip
          tone="pending_validation"
          testId="pending-validation-banner"
          title={`${pendingValidationCount} match${pendingValidationCount > 1 ? "s" : ""} à valider`}
          description="Confirme ou refuse les scores en attente avant la mise à jour de l'ELO."
          actionLabel="Valider"
          onAction={() => navigate(`/event/${event.id}/validate`)}
        />
      )}

      {/* SegmentedTabs: Matchs / Classement */}
      <div className="px-4 pt-4 pb-4">
        <SegmentedTabs
          tabs={[
            { id: "matchs", label: "Matchs" },
            { id: "classement", label: "Classement" },
            { id: "stats", label: "Stats" },
          ]}
          activeId={activeTab}
          onChange={(id) =>
            setActiveTab(id as "classement" | "matchs" | "stats")
          }
          variant="encapsulated"
        />
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto px-4 py-4 space-y-2 pb-bottom-nav lg:pb-bottom-nav-lg">
        {activeTab === "classement" && (
          <>
            {ranking.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Aucun joueur"
                description="Invite tes amis pour commencer à jouer!"
              />
            ) : (
              <div className="space-y-3 w-full">
                {/* Podium top-3 — shows ELO + last-match delta */}
                {ranking.length >= 3 && (
                  <Podium
                    top3={ranking.slice(0, 3).map((p) => ({
                      id: p.id,
                      name: p.name,
                      elo: p.elo,
                      avatar: p.avatarUrl ?? undefined,
                      delta: getDeltaFromLastMatch(p.id, sortedMatches) ?? undefined,
                      rankDelta: rankDeltas.get(p.id),
                    }))}
                    scope={undefined}
                    className="mb-1"
                  />
                )}
                {/* Full leaderboard starting from rank 1 (top 3 are also shown on the podium). */}
                <div className="space-y-1.5">
                  {ranking.map(
                    (player, index) => {
                      const rank = index + 1;
                      const participant = eventParticipants.find(
                        (tp) => tp.id === player.id,
                      );
                      const profileId = getPlayerProfileId(
                        participant || { id: player.id },
                      );
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
                          avatarUrl={player.avatarUrl ?? undefined}
                          elo={player.elo}
                          delta={delta ?? undefined}
                          rankDelta={rankDeltas.get(player.id)}
                          rank={rank}
                          wins={player.wins}
                          losses={player.losses}
                          recentResults={recentResults}
                          onClick={() => navigate(`/player/${profileId}`)}
                        />
                      );
                    },
                  )}
                </div>
              </div>
            )}
          </>
        )}
        {activeTab === "matchs" && (
          <>
            {event.matches.length === 0 ? (
              <EmptyState
                icon={History}
                title="Aucun match"
                description="Enregistre ton premier match pour voir l'évolution du classement."
              />
            ) : (
              event.matches.map((match) => {
                const teamAPlayers = eventPlayers.filter((p) =>
                  match.teamA.includes(p.id),
                );
                const teamBPlayers = eventPlayers.filter((p) =>
                  match.teamB.includes(p.id),
                );
                const winnerA = match.scoreA > match.scoreB;

                return (
                  <div
                    key={match.id}
                    className={`relative bg-navy-soft p-4 rounded-xl border ${match.is_live ? "border-lime/50" : "border-card/50"}`}
                  >
                    {isAdmin && (
                      <div className="absolute top-2 right-2">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMatchMenuId((cur) =>
                              cur === match.id ? null : match.id,
                            )
                          }
                          className="w-8 h-8 rounded-full text-cool-gray hover:bg-white/10 flex items-center justify-center transition-colors"
                          aria-label="Actions sur le match"
                          aria-haspopup="menu"
                          aria-expanded={openMatchMenuId === match.id}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMatchMenuId === match.id && (
                          <>
                            {/* Click-outside catcher */}
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenMatchMenuId(null)}
                              aria-hidden="true"
                            />
                            <div
                              className="absolute right-0 mt-1 w-44 bg-navy-deep border border-card rounded-card shadow-modal z-50 overflow-hidden"
                              role="menu"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => handleEditMatch(match.id)}
                                className="w-full px-3 py-2 text-left text-white text-sm flex items-center gap-2 hover:bg-white/5"
                              >
                                <Pencil size={14} />
                                Modifier
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => handleDeleteMatch(match.id)}
                                className="w-full px-3 py-2 text-left text-signal-red text-sm flex items-center gap-2 hover:bg-signal-red/10"
                              >
                                <Trash2 size={14} />
                                Supprimer
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    {/* Badges de statut + timestamp sur la même ligne, en
                        haut. `pr-10` quand admin pour dégager le bouton menu
                        ⋮ (absolute top-right, ≈ 40 px). La même valeur est
                        appliquée à MatchTeamsRow pour aligner la date sur la
                        colonne team B. */}
                    <div
                      className={`flex items-center justify-between gap-2 mb-2 ${isAdmin ? "pr-10" : ""}`}
                    >
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <LiveMatchBadge isLive={Boolean(match.is_live)} />
                        {match.status === "pending" && (
                          <div
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-ping-yellow/15 text-ping-yellow text-[10px] font-bold uppercase tracking-wide"
                            data-testid="match-status-pending"
                            aria-label="Match en attente de validation"
                          >
                            <Hourglass size={11} aria-hidden="true" />
                            En attente de validation
                          </div>
                        )}
                        {match.status === "rejected" && (
                          <div
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-signal-red/15 text-signal-red text-[10px] font-bold uppercase tracking-wide"
                            data-testid="match-status-rejected"
                            aria-label="Match refusé"
                          >
                            <XCircle size={11} aria-hidden="true" />
                            Refusé
                          </div>
                        )}
                        {match.status === "confirmed" && event.anti_cheat_enabled && (
                          <div
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-lime/15 text-lime text-[10px] font-bold uppercase tracking-wide"
                            data-testid="match-status-validated"
                            aria-label="Match validé"
                          >
                            <CheckCircle2 size={11} aria-hidden="true" />
                            Validé
                          </div>
                        )}
                      </div>
                      <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider text-cool-gray">
                        {getRelativeTimestamp(match.date)}
                      </span>
                    </div>
                    {/* Teams + ELO inline (1 valeur par équipe). `pr-10`
                        quand admin : aligne team B sur la date au-dessus et
                        dégage le ⋮. */}
                    <MatchTeamsRow
                      teamAPlayers={teamAPlayers}
                      teamBPlayers={teamBPlayers}
                      winner={winnerA ? "A" : "B"}
                      eloChanges={match.eloChanges}
                      className={isAdmin ? "pr-10" : undefined}
                    />
                    {/* Footer : chips photo/cups, seulement si présents */}
                    {hasMatchEnrichedContent(
                      match.photo_url,
                      match.cups_remaining,
                    ) && (
                      <div className="flex justify-end mt-2">
                        <MatchEnrichedDisplay
                          photoUrl={match.photo_url}
                          cupsRemaining={match.cups_remaining}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
        {activeTab === "stats" && (
          <DetailedStatsPanel
            matches={event.matches}
            players={eventParticipants}
            contextLabel="event"
            onPlayerClick={(playerId) => {
              const participant = eventParticipants.find(
                (p) => p.id === playerId,
              );
              const profileId = participant
                ? getPlayerProfileId(participant)
                : playerId;
              navigate(`/player/${profileId}`);
            }}
          />
        )}
      </div>

      {/* FAB (AC6): Nouveau match — navigate to RecordMatch page.
          Hidden when the event lifecycle disallows match logging
          (not_started / paused / finished). */}
      {matchLoggingAllowed && (
        <FAB
          icon={BeerPongMatchIcon}
          onClick={() =>
            navigate(`/record-match/event/${event.id}`)
          }
          ariaLabel="Nouveau match"
        />
      )}

      {/* Invite bottom sheet — QR+code+share + add player (manual ou depuis ligue) */}
      <InviteSheet
        isOpen={showAddPlayer}
        onClose={() => setShowAddPlayer(false)}
        shareData={{
          joinCode: event.joinCode,
          joinUrl: `${window.location.origin}/event/${event.id}/join`,
          shareTitle: event.name,
          shareText: `Rejoins l'événement ${event.name} !`,
        }}
        leaguePlayers={
          event.leagueId && league
            ? league.players
                .filter(
                  (lp) =>
                    !eventParticipants.some(
                      (tp) => tp.leaguePlayerId === lp.id,
                    ),
                )
                .map((p) => ({ id: p.id, name: p.name, elo: p.elo }))
            : []
        }
        remainingSlots={
          // 999 = unlimited sentinel (cf. CreateEvent UNLIMITED_PLAYERS).
          event.maxPlayers != null &&
          event.maxPlayers > 0 &&
          event.maxPlayers < 999
            ? Math.max(0, event.maxPlayers - eventParticipants.length)
            : undefined
        }
        onAddManual={handleInviteAddManual}
        onAddFromLeagueBulk={
          event.leagueId ? handleInviteAddFromLeagueBulk : undefined
        }
      />

      {/* Ghost player management — admin only, only when ghosts exist */}
      {isAdmin && (
        <GhostManagementSheet
          isOpen={showGhostMgmt}
          onClose={() => setShowGhostMgmt(false)}
          guests={eventGhosts}
          archivedGuests={archivedEventGhosts}
          joinPath={`/event/${event.id}/join`}
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
          players={eventPlayers}
          eloChanges={lastEloChanges}
          onClose={() => setShowEloChanges(false)}
        />
      )}

    </div>
  );
};
