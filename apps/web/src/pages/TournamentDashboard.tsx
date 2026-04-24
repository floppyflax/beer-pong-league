import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "@/context/LeagueContext";
import {
  Trophy,
  Link as LinkIcon,
  Users,
  History,
  Monitor,
  LogOut,
  UserPlus,
  Settings,
} from "lucide-react";
import { BeerPongMatchIcon } from "@/components/icons/BeerPongMatchIcon";
import { EloChangeDisplay } from "@/components/EloChangeDisplay";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MatchEnrichedDisplay } from "@/components/MatchEnrichedDisplay";
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
  SettingsSheet,
} from "@/components/design-system";
import type {
  DetailHeroAction,
  DetailHeroMenuItem,
  SettingsSheetTournamentUpdates,
} from "@/components/design-system";
import { Podium } from "@/components/ponglo/Podium";
import { LeaderRow } from "@/components/ponglo/LeaderRow";

import { getDeltaFromLastMatch } from "@/utils/playerStats";

// Task 4 - Utility function for relative timestamps (AC4)
function getRelativeTimestamp(date: string): string {
  const now = new Date();
  const matchDate = new Date(date);
  const diffMs = now.getTime() - matchDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1)
    return `Hier à ${matchDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays < 7)
    return `${diffDays}j à ${matchDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  return matchDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const TournamentDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { user, isAuthenticated } = useAuthContext();
  const { localUser } = useIdentity();
  const {
    tournaments,
    leagues,
    deleteTournament,
    toggleTournamentStatus,
    updateTournament,
    getTournamentLocalRanking,
    getLeagueGlobalRanking,
    addPlayer,
    addPlayerToTournament,
    addAnonymousPlayerToTournament,
    associateTournamentToLeague,
    isLoadingInitialData,
    reloadData,
  } = useLeague();

  const [rankingMode, setRankingMode] = useState<"local" | "global">("local");
  const [activeTab, setActiveTab] = useState<"classement" | "matchs">(
    "classement",
  );
  const [showEloChanges, setShowEloChanges] = useState(false);
  const [lastEloChanges] = useState<Record<string, number>>({});
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

  // Find tournament (but ALL hooks must still be called even if null)
  const tournament = tournaments.find((t) => t.id === id);

  // Matchs triés du plus récent au plus ancien — requis par les utils `playerStats`
  const sortedMatches = useMemo(
    () =>
      [...(tournament?.matches ?? [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [tournament?.matches],
  );

  // Load tournament participants from tournament_players (IDs match match.teamA/teamB)
  const [tournamentParticipants, setTournamentParticipants] = useState<
    { id: string; leaguePlayerId?: string; name: string; elo: number; wins: number; losses: number; matchesPlayed: number; streak: number }[]
  >([]);

  useEffect(() => {
    if (!id) return;
    databaseService
      .loadTournamentParticipants(id)
      .then((participants) =>
        setTournamentParticipants(
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
      .catch(() => setTournamentParticipants([]));
  }, [id, tournament?.matches.length, tournament?.playerIds?.length]);

  // Calculate derived data (safe to do even if tournament is null)
  const league = tournament?.leagueId
    ? leagues.find((l) => l.id === tournament.leagueId)
    : null;
  // Use tournament participants (from tournament_players) - IDs match match.teamA/teamB
  const tournamentPlayers = tournamentParticipants;
  // For PlayerProfile navigation: use leaguePlayerId when available so /player/:id finds the player
  const getPlayerProfileId = (p: { id: string; leaguePlayerId?: string }) =>
    p.leaguePlayerId || p.id;

  // Story 9-5 - Get permissions for contextual actions
  const { isAdmin, canInvite } = useDetailPagePermissions(
    id || "",
    "tournament",
  );

  // Get ranking based on mode - MUST be called unconditionally
  // Pass tournamentParticipants so ranking uses tournament_players.id (matches match.teamA/teamB)
  const ranking = useMemo(() => {
    if (!tournament) return [];
    if (rankingMode === "local") {
      return getTournamentLocalRanking(tournament.id, tournamentParticipants);
    } else {
      if (tournament.leagueId) {
        return getLeagueGlobalRanking(tournament.leagueId);
      }
      return [];
    }
  }, [
    rankingMode,
    tournament,
    tournamentParticipants,
    getTournamentLocalRanking,
    getLeagueGlobalRanking,
  ]);

  // Auto-add new players from League to Tournament - MUST be called unconditionally
  useEffect(() => {
    if (!tournament?.leagueId || !league) return;

    const leaguePlayerIds = league.players.map((p) => p.id);
    const missingPlayers = leaguePlayerIds.filter(
      (id) => !tournament.playerIds.includes(id),
    );

    if (missingPlayers.length > 0) {
      missingPlayers.forEach((playerId) => {
        addPlayerToTournament(tournament.id, playerId);
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

  if (!tournament) {
    return (
      <div className="p-4 text-center">
        <EmptyState
          icon={Trophy}
          title="Événement introuvable"
          description="Cet événement n'existe pas ou a été supprimé."
          action={
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-signal-red text-white rounded-lg font-bold hover:brightness-110 transition-colors"
            >
              Retour à l'accueil
            </button>
          }
        />
      </div>
    );
  }

  // Task 7 - Leave tournament functionality (Story 8.3, AC7)
  const handleLeaveTournament = async () => {
    if (confirm("Es-tu sûr de vouloir quitter cet événement ?")) {
      try {
        await databaseService.leaveTournament(
          tournament.id,
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
        console.error("Error leaving tournament:", error);
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
      if (tournament.leagueId) {
        // Tournoi rattaché : on ajoute dans la ligue, la sync auto propage au tournoi.
        addPlayer(tournament.leagueId, trimmed);
      } else {
        // Tournoi standalone : ajout direct du joueur anonyme au tournoi.
        await addAnonymousPlayerToTournament(tournament.id, trimmed);
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

  const handleInviteAddFromLeague = async (leaguePlayerId: string) => {
    if (!leaguePlayerId || !tournament.leagueId) return;
    try {
      const tournamentPlayerId = await databaseService.addLeaguePlayerToTournament(
        tournament.id,
        leaguePlayerId,
      );
      addPlayerToTournament(tournament.id, tournamentPlayerId);
      await reloadData();
      databaseService
        .loadTournamentParticipants(tournament.id)
        .then((participants) =>
          setTournamentParticipants(
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
      toast.success("Joueur ajouté à l'événement");
      setShowAddPlayer(false);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'ajout du joueur",
      );
    }
  };

  // ── DetailHero derived state ─────────────────────────────────────────────
  const tournamentStatusVariant: "finished" | "cancelled" | "live" | "active" =
    tournament.status === "finished" || tournament.isFinished
      ? "finished"
      : tournament.status === "cancelled"
        ? "cancelled"
        : tournament.matches.some((m) => m.is_live)
          ? "live"
          : "active";

  const tournamentStatusLabel =
    tournamentStatusVariant === "finished"
      ? "Terminé"
      : tournamentStatusVariant === "cancelled"
        ? "Annulé"
        : tournamentStatusVariant === "live"
          ? "En direct"
          : "En cours";

  const formatLabel =
    tournament.format === "libre" ? "Format libre" : `Format ${tournament.format}`;

  // Mode de compétition : ELO (classement ponctuel) ou Bracket (élimination
  // directe). Défini à la création et immuable. Default 'elo' pour les anciens
  // tournois (cohérent avec la migration 011).
  const tournamentMode: "elo" | "bracket" = tournament.mode ?? "elo";
  const modeLabel = tournamentMode === "bracket" ? "Mode Bracket" : "Mode ELO";

  const dateLabel = new Date(tournament.date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  // Hero actions — spec refonte :
  //  • Admin : [Inviter primary] [Paramètres secondary] [📺 Mode Diffusion iconOnly]
  //  • Non-admin : [Inviter primary], avec Quitter accessible via menu (seul item
  //    conservé pour les participants).
  const detailHeroActions: DetailHeroAction[] = [];
  if (isAdmin || canInvite) {
    detailHeroActions.push({
      label: "Inviter",
      icon: <UserPlus size={16} />,
      onClick: () => setShowAddPlayer(true),
      variant: "primary",
    });
  }
  if (isAdmin) {
    detailHeroActions.push({
      label: "Paramètres",
      icon: <Settings size={16} />,
      onClick: () => setShowSettings(true),
      variant: "secondary",
    });
    detailHeroActions.push({
      label: "Mode Diffusion",
      icon: <Monitor size={18} />,
      onClick: () => navigate(`/tournament/${tournament.id}/display`),
      variant: "iconOnly",
    });
  }

  const detailHeroMenuItems: DetailHeroMenuItem[] = !isAdmin
    ? [
        {
          label: "Quitter l'événement",
          icon: <LogOut size={20} />,
          onClick: handleLeaveTournament,
          destructive: true,
        },
      ]
    : [];

  // SettingsSheet handlers
  const handleSaveSettings = async (updates: SettingsSheetTournamentUpdates) => {
    try {
      await updateTournament(tournament.id, updates);
      toast.success("Paramètres enregistrés");
    } catch (err) {
      console.error("Error saving tournament settings:", err);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleFinishFromSettings = () => {
    toggleTournamentStatus(tournament.id);
    toast.success(
      tournament.isFinished
        ? "Événement rouvert"
        : "Événement clôturé",
    );
    setShowSettings(false);
  };

  const handleDeleteFromSettings = () => {
    deleteTournament(tournament.id);
    setShowSettings(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col relative">
      {/* DetailHero — bloc bleu pleine largeur (bleed sous padding ResponsiveLayout + App) */}
      <DetailHero
        className="-mx-4 -mt-4 md:mx-0 md:mt-0"
        onBack={() => navigate("/competitions")}
        adminBadge={isAdmin}
        title={tournament.name}
        status={{
          label: tournamentStatusLabel,
          variant: tournamentStatusVariant,
        }}
        meta={[formatLabel, modeLabel, dateLabel]}
        stats={[
          {
            label: "Joueurs",
            value: `${tournamentPlayers.length}${
              tournament.maxPlayers && tournament.maxPlayers < 999
                ? `/${tournament.maxPlayers}`
                : ""
            }`,
          },
          { label: "Matchs", value: String(tournament.matches.length) },
          {
            label: "Top ELO",
            value: ranking.length > 0 ? String(ranking[0].elo) : "—",
          },
        ]}
        actions={detailHeroActions}
        menuItems={detailHeroMenuItems}
      />

      {/* SegmentedTabs: Matchs / Classement */}
      <div className="px-4 pt-4 pb-4">
        <SegmentedTabs
          tabs={[
            { id: "matchs", label: "Matchs" },
            { id: "classement", label: "Classement" },
          ]}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as "classement" | "matchs")}
          variant="encapsulated"
        />
      </div>

      {/* Ranking Mode Switch */}
      {tournament.leagueId && activeTab === "classement" && (
        <div className="px-4 py-2 bg-navy-soft/50 flex gap-2">
          <button
            onClick={() => setRankingMode("local")}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
              rankingMode === "local"
                ? "bg-electric-blue text-white"
                : "bg-navy-deep text-cool-gray"
            }`}
          >
            Classement Événement
          </button>
          <button
            onClick={() => setRankingMode("global")}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
              rankingMode === "global"
                ? "bg-electric-blue text-white"
                : "bg-navy-deep text-cool-gray"
            }`}
          >
            Classement League
          </button>
        </div>
      )}

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
                {/* Podium top-3 */}
                {ranking.length >= 3 && (
                  <Podium
                    top3={ranking.slice(0, 3).map((p) => ({
                      id: p.id,
                      name: p.name,
                      elo: p.elo,
                    }))}
                    scope={rankingMode === "global" ? league?.name : undefined}
                    className="mb-1"
                  />
                )}
                {/* Full leaderboard with LeaderRow */}
                <div className="space-y-1.5">
                  {ranking.map((player, index) => {
                    const participant = tournamentParticipants.find(
                      (tp) => tp.id === player.id,
                    );
                    const profileId = getPlayerProfileId(
                      participant || { id: player.id },
                    );
                    const delta = getDeltaFromLastMatch(
                      player.id,
                      sortedMatches,
                    );
                    return (
                      <LeaderRow
                        key={player.id}
                        rank={index + 1}
                        player={{
                          id: player.id,
                          name: player.name,
                          elo: player.elo,
                          delta: delta ?? undefined,
                        }}
                        onClick={() => navigate(`/player/${profileId}`)}
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
            {tournament.matches.length === 0 ? (
              <EmptyState
                icon={History}
                title="Aucun match"
                description="Enregistre ton premier match pour voir l'évolution du classement."
              />
            ) : (
              tournament.matches.map((match) => {
                const teamAPlayers = tournamentPlayers.filter((p) =>
                  match.teamA.includes(p.id),
                );
                const teamBPlayers = tournamentPlayers.filter((p) =>
                  match.teamB.includes(p.id),
                );
                const teamANames = teamAPlayers.map((p) => p.name).join(", ");
                const teamBNames = teamBPlayers.map((p) => p.name).join(", ");
                const winnerA = match.scoreA > match.scoreB;

                return (
                  <div
                    key={match.id}
                    className={`bg-navy-soft p-4 rounded-xl border ${match.is_live ? "border-lime/50" : "border-card/50"}`}
                  >
                    {/* Phase D.4: Live badge */}
                    <LiveMatchBadge isLive={Boolean(match.is_live)} className="mb-2" />
                    {/* Match teams and winner - Task 4 AC4 */}
                    <div className="flex justify-between items-center text-sm mb-2">
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
                    {/* Task 4 - AC4: Timestamp display */}
                    <div className="text-xs text-cool-gray mb-2">
                      {getRelativeTimestamp(match.date)}
                    </div>
                    {/* Task 4 - AC4: ELO changes for players */}
                    {match.eloChanges &&
                      Object.keys(match.eloChanges).length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {[...teamAPlayers, ...teamBPlayers].map((player) => {
                            const change = match.eloChanges?.[player.id];
                            if (change === undefined) return null;
                            return (
                              <span
                                key={player.id}
                                className={`px-2 py-0.5 rounded ${
                                  change > 0
                                    ? "bg-lime/20 text-lime"
                                    : "bg-signal-red/20 text-signal-red"
                                }`}
                              >
                                {player.name}: {change > 0 ? "+" : ""}
                                {change}
                              </span>
                            );
                          })}
                        </div>
                      )}
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
      </div>

      {/* FAB (AC6): Nouveau match — navigate to RecordMatch page */}
      {!tournament.isFinished && (
        <FAB
          icon={BeerPongMatchIcon}
          onClick={() =>
            navigate(`/record-match/tournament/${tournament.id}`)
          }
          ariaLabel="Nouveau match"
        />
      )}

      {/* Invite bottom sheet — QR+code+share + add player (manual ou depuis ligue) */}
      <InviteSheet
        isOpen={showAddPlayer}
        onClose={() => setShowAddPlayer(false)}
        shareData={{
          joinCode: tournament.joinCode,
          joinUrl: `${window.location.origin}/tournament/${tournament.id}/join`,
          shareTitle: tournament.name,
          shareText: `Rejoins l'événement ${tournament.name} !`,
        }}
        leaguePlayers={
          tournament.leagueId && league
            ? league.players
                .filter(
                  (lp) =>
                    !tournamentParticipants.some(
                      (tp) => tp.leaguePlayerId === lp.id,
                    ),
                )
                .map((p) => ({ id: p.id, name: p.name }))
            : []
        }
        onAddManual={handleInviteAddManual}
        onAddFromLeague={
          tournament.leagueId ? handleInviteAddFromLeague : undefined
        }
      />

      {/* Settings bottom sheet — admin only */}
      {isAdmin && (
        <SettingsSheet
          kind="tournament"
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          title="Paramètres"
          initial={{
            name: tournament.name,
            format: tournament.format,
            maxPlayers: tournament.maxPlayers ?? 999,
            isPrivate: tournament.isPrivate ?? true,
          }}
          mode={tournamentMode}
          currentPlayersCount={tournamentParticipants.length}
          onSave={handleSaveSettings}
          onFinish={handleFinishFromSettings}
          onDelete={handleDeleteFromSettings}
          isFinished={tournament.isFinished}
          extraContent={
            <div className="space-y-2">
              <span className="font-mono uppercase text-[10px] tracking-[2px] text-cool-gray block">
                <span className="inline-flex items-center gap-1.5">
                  <LinkIcon size={12} />
                  Rattachement à une ligue
                </span>
              </span>
              {tournament.leagueId ? (
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
                        confirm(
                          "Voulez-vous dissocier cet événement de la ligue ?",
                        )
                      ) {
                        associateTournamentToLeague(tournament.id, "");
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
                      associateTournamentToLeague(
                        tournament.id,
                        e.target.value,
                      );
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
          }
        />
      )}

      {/* ELO Changes Display */}
      {showEloChanges && (
        <EloChangeDisplay
          players={tournamentPlayers}
          eloChanges={lastEloChanges}
          onClose={() => setShowEloChanges(false)}
        />
      )}
    </div>
  );
};
