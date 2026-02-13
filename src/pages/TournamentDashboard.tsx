import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "@/context/LeagueContext";
import {
  Trophy,
  X,
  Link as LinkIcon,
  Users,
  History,
  Monitor,
  Share2,
  LogOut,
  UserPlus,
  Calendar,
} from "lucide-react";
import { BeerPongMatchIcon } from "@/components/icons/BeerPongMatchIcon";
import { EloChangeDisplay } from "@/components/EloChangeDisplay";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MatchRecordingForm } from "@/components/MatchRecordingForm";
import { QRCodeSVG } from "qrcode.react";
import type { Match } from "@/types";
import { databaseService } from "@/services/DatabaseService";
import { useAuthContext } from "@/context/AuthContext";
import { useIdentity } from "@/hooks/useIdentity";
import { toast } from "react-hot-toast";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { useDetailPagePermissions } from "@/hooks/useDetailPagePermissions";
import {
  InfoCard,
  StatCard,
  SegmentedTabs,
  ListRow,
  FAB,
} from "@/components/design-system";

// Delta ELO du dernier match du joueur (AC5)
function getDeltaFromLastMatch(
  playerId: string,
  matches: { date: string; teamA: string[]; teamB: string[]; eloChanges?: Record<string, number> }[],
): number | undefined {
  const sorted = [...matches].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  for (const m of sorted) {
    if (m.teamA.includes(playerId) || m.teamB.includes(playerId)) {
      const change = m.eloChanges?.[playerId];
      return change !== undefined ? change : undefined;
    }
  }
  return undefined;
}

// Derniers 5 résultats (true=victoire, false=défaite), du plus récent au plus ancien
function getLast5MatchResults(
  playerId: string,
  matches: { date: string; teamA: string[]; teamB: string[]; scoreA: number; scoreB: number }[],
): boolean[] {
  const sorted = [...matches].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const results: boolean[] = [];
  for (const m of sorted) {
    if (results.length >= 5) break;
    const inTeamA = m.teamA.includes(playerId);
    const inTeamB = m.teamB.includes(playerId);
    if (!inTeamA && !inTeamB) continue;
    const won = (inTeamA && m.scoreA > m.scoreB) || (inTeamB && m.scoreB > m.scoreA);
    results.push(won);
  }
  return results;
}

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
    recordTournamentMatch,
    deleteTournament,
    toggleTournamentStatus,
    updateTournament,
    getTournamentLocalRanking,
    getLeagueGlobalRanking,
    addPlayer,
    addPlayerToTournament,
    associateTournamentToLeague,
    isLoadingInitialData,
    reloadData,
  } = useLeague();

  const [rankingMode, setRankingMode] = useState<"local" | "global">("local");
  const [activeTab, setActiveTab] = useState<
    "classement" | "matchs" | "settings"
  >("classement");
  const [showRecordMatch, setShowRecordMatch] = useState(false);
  const [showEloChanges, setShowEloChanges] = useState(false);
  const [lastEloChanges, setLastEloChanges] = useState<Record<string, number>>(
    {},
  );
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [addPlayerTab, setAddPlayerTab] = useState<
    "pseudo" | "invitation" | "league"
  >("pseudo");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [selectedLeaguePlayerId, setSelectedLeaguePlayerId] =
    useState<string>("");

  // Escape key closes Add Player modal
  useEffect(() => {
    if (!showAddPlayer) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAddPlayer(false);
        setAddPlayerTab("pseudo");
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showAddPlayer]);

  // Find tournament (but ALL hooks must still be called even if null)
  const tournament = tournaments.find((t) => t.id === id);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          title="Tournoi introuvable"
          description="Ce tournoi n'existe pas ou a été supprimé."
          action={
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-amber-600 transition-colors"
            >
              Retour à l'accueil
            </button>
          }
        />
      </div>
    );
  }

  const handleMatchFormSuccess = async (match: Match) => {
    // Calculate winner from scores
    const winner: "A" | "B" = match.scoreA > match.scoreB ? "A" : "B";

    // Call recordTournamentMatch with scores and tournament participants (tournament_players.id)
    const eloChanges = await recordTournamentMatch(
      tournament.id,
      match.teamA,
      match.teamB,
      winner,
      { scoreA: match.scoreA, scoreB: match.scoreB },
      tournamentPlayers,
    );

    if (eloChanges) {
      setLastEloChanges(eloChanges);
      setShowEloChanges(true);
    }
  };

  const handleDeleteTournament = () => {
    if (confirm("Es-tu sûr de vouloir supprimer ce Tournoi ?")) {
      deleteTournament(tournament.id);
      navigate("/");
    }
  };

  // Task 7 - Leave tournament functionality (Story 8.3, AC7)
  const handleLeaveTournament = async () => {
    if (confirm("Es-tu sûr de vouloir quitter ce tournoi ?")) {
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
        toast.success("Tu as quitté le tournoi");
      } catch (error: unknown) {
        console.error("Error leaving tournament:", error);
        toast.error(
          error instanceof Error ? error.message : "Erreur lors de la sortie du tournoi",
        );
      }
    }
  };

  const handleAddPlayerByPseudo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    if (tournament.leagueId) {
      // Add player to League - it will be auto-added to tournament via useEffect
      addPlayer(tournament.leagueId, newPlayerName);
    } else {
      // TODO: For autonomous tournaments, create guest player directly
      // For now, add to league if exists
      toast.error(
        "Pour ajouter des joueurs, associez d'abord ce tournoi à une League dans les paramètres.",
      );
      setShowAddPlayer(false);
      setActiveTab("settings");
      return;
    }
    setNewPlayerName("");
    setShowAddPlayer(false);
    setAddPlayerTab("pseudo"); // Reset to default tab
  };

  const handleAddPlayerFromLeague = async () => {
    if (!selectedLeaguePlayerId || !tournament.leagueId) return;

    try {
      const tournamentPlayerId = await databaseService.addLeaguePlayerToTournament(
        tournament.id,
        selectedLeaguePlayerId,
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
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'ajout du joueur",
      );
      return;
    }
    setSelectedLeaguePlayerId("");
    setShowAddPlayer(false);
    setAddPlayerTab("pseudo"); // Reset to default tab
  };

  const handleCopyCode = () => {
    if (tournament.joinCode) {
      navigator.clipboard.writeText(tournament.joinCode);
      toast.success("Code copié!");
    }
  };

  const handleShareLink = async () => {
    const url = `${window.location.origin}/tournament/${tournament.id}/join`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: tournament.name,
          text: `Rejoins le tournoi ${tournament.name}!`,
          url: url,
        });
      } catch (err) {
        // User cancelled share or error occurred
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url);
      toast.success("Lien copié!");
    }
  };

  const handleLinkToLeague = () => {
    if (!selectedLeagueId) return;
    associateTournamentToLeague(tournament.id, selectedLeagueId);
    setSelectedLeagueId("");
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Story 13.2 - Contextual Header with back button and actions */}
      <ContextualHeader
        title={tournament.name}
        showBackButton={true}
        onBack={() => navigate("/tournaments")}
        actions={[
          ...(isAdmin || canInvite
            ? [
                {
                  label: "INVITER",
                  icon: <UserPlus size={20} />,
                  onClick: () => setShowAddPlayer(true),
                  variant: "secondary" as const,
                },
              ]
            : []),
        ]}
        menuItems={[
          ...(isAdmin
            ? [
                {
                  label: "Mode Diffusion",
                  icon: <Monitor size={20} />,
                  onClick: () =>
                    navigate(`/tournament/${tournament.id}/display`),
                },
              ]
            : []),
          {
            label: "Quitter le tournoi",
            icon: <LogOut size={20} />,
            onClick: handleLeaveTournament,
            destructive: false,
          },
        ]}
      />

      {/* InfoCard (AC2): status, code, format, date */}
      <div className="px-4 py-3">
        <InfoCard
          title=""
          statusBadge={
            tournament.status === "finished" || tournament.isFinished
              ? "Terminé"
              : tournament.status === "cancelled"
                ? "Annulé"
                : "En cours"
          }
          statusVariant={
            tournament.status === "finished" || tournament.isFinished
              ? "finished"
              : tournament.status === "cancelled"
                ? "cancelled"
                : "active"
          }
          infos={[
            ...(tournament.joinCode
              ? [{ icon: LinkIcon, text: `Code: ${tournament.joinCode}` }]
              : []),
            {
              icon: Trophy,
              text: `Format: ${
                tournament.format === "libre" ? "Libre" : tournament.format
              }`,
            },
            {
              icon: Users,
              text: `${tournamentPlayers.length}${
                tournament.maxPlayers && tournament.maxPlayers < 999
                  ? `/${tournament.maxPlayers}`
                  : ""
              } joueurs`,
            },
            {
              icon: Calendar,
              text: new Date(tournament.date).toLocaleDateString("fr-FR"),
            },
          ]}
        />
      </div>

      {/* StatCards (AC3): 3 columns */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        <StatCard
          value={tournamentPlayers.length}
          label="Joueurs"
          variant="primary"
        />
        <StatCard value={tournament.matches.length} label="Matchs" />
        <StatCard
          value={ranking.length > 0 ? ranking[0].elo : "-"}
          label="Top ELO"
          variant="accent"
        />
      </div>

      {/* SegmentedTabs (AC4): Classement / Matchs / Paramètres */}
      <div className="px-4 pb-4">
        <SegmentedTabs
          tabs={[
            { id: "classement", label: "Classement" },
            { id: "matchs", label: "Matchs" },
            { id: "settings", label: "Paramètres" },
          ]}
          activeId={activeTab}
          onChange={(id) =>
            setActiveTab(id as "classement" | "matchs" | "settings")
          }
          variant="encapsulated"
        />
      </div>

      {!tournament.leagueId && activeTab === "classement" && (
        <div className="px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-lg mx-4 my-2 flex items-center gap-2 text-sm">
          <LinkIcon size={16} className="text-amber-500" />
          <span className="text-amber-500">
            Tournoi autonome. Associe-le à une League pour suivre le classement
            global.
          </span>
        </div>
      )}

      {/* Ranking Mode Switch */}
      {tournament.leagueId && activeTab === "classement" && (
        <div className="px-4 py-2 bg-slate-800/50 flex gap-2">
          <button
            onClick={() => setRankingMode("local")}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
              rankingMode === "local"
                ? "bg-primary text-white"
                : "bg-slate-700 text-slate-400"
            }`}
          >
            Classement Tournoi
          </button>
          <button
            onClick={() => setRankingMode("global")}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
              rankingMode === "global"
                ? "bg-primary text-white"
                : "bg-slate-700 text-slate-400"
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
              <div className="space-y-2 w-full">
                {ranking.map((player, index) => {
                  const participant = tournamentParticipants.find(
                    (tp) => tp.id === player.id,
                  );
                  const profileId = getPlayerProfileId(
                    participant || { id: player.id },
                  );
                  const recentResults = getLast5MatchResults(
                    player.id,
                    tournament.matches,
                  );
                  const delta = getDeltaFromLastMatch(player.id, tournament.matches);
                  return (
                    <ListRow
                      key={player.id}
                      variant="player"
                      name={player.name}
                      subtitle={`${player.wins}V - ${player.losses}D • ${Math.round(
                        (player.wins / (player.matchesPlayed || 1)) * 100,
                      )}%`}
                      elo={player.elo}
                      rank={index + 1}
                      delta={delta}
                      recentResults={recentResults}
                      onClick={() => navigate(`/player/${profileId}`)}
                    />
                  );
                })}
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
                    className="bg-slate-800 p-4 rounded-xl border border-slate-700/50"
                  >
                    {/* Match teams and winner - Task 4 AC4 */}
                    <div className="flex justify-between items-center text-sm mb-2">
                      <div
                        className={`flex-1 text-right ${
                          winnerA ? "text-white font-bold" : "text-slate-400"
                        }`}
                      >
                        {winnerA && "🏆 "}
                        {teamANames}
                      </div>
                      <div className="px-4 font-bold text-slate-500 text-xs">
                        VS
                      </div>
                      <div
                        className={`flex-1 text-left ${
                          !winnerA ? "text-white font-bold" : "text-slate-400"
                        }`}
                      >
                        {!winnerA && "🏆 "}
                        {teamBNames}
                      </div>
                    </div>
                    {/* Task 4 - AC4: Timestamp display */}
                    <div className="text-xs text-slate-500 mb-2">
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
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {player.name}: {change > 0 ? "+" : ""}
                                {change}
                              </span>
                            );
                          })}
                        </div>
                      )}
                  </div>
                );
              })
            )}
          </>
        )}
        {activeTab === "settings" && (
          <div className="space-y-4">
            {/* Invitation Section - Prominent */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Share2 size={20} />
                Inviter des participants
              </h3>

              <p className="text-slate-400 mb-4 text-sm">
                Scannez ce QR code ou saisissez le code pour rejoindre le
                tournoi
              </p>

              {/* Join Code Display */}
              {tournament.joinCode && (
                <div className="bg-slate-700 rounded-lg p-4 mb-4 text-center">
                  <div className="text-sm text-slate-400 mb-1">
                    Code du tournoi
                  </div>
                  <div className="text-3xl font-mono font-bold text-primary">
                    {tournament.joinCode}
                  </div>
                </div>
              )}

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG
                    value={`${window.location.origin}/tournament/${tournament.id}/join`}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() =>
                    navigate(`/tournament/${tournament.id}/invite`)
                  }
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors"
                >
                  <Share2 size={20} />
                  Afficher en plein écran
                </button>
              </div>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-bold text-white mb-4">Informations</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-400">
                    Nom du Tournoi
                  </label>
                  <input
                    type="text"
                    value={tournament.name}
                    onChange={(e) =>
                      updateTournament(
                        tournament.id,
                        e.target.value,
                        tournament.date,
                      )
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 mt-1 text-white focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400">Date</label>
                  <input
                    type="date"
                    value={tournament.date}
                    onChange={(e) =>
                      updateTournament(
                        tournament.id,
                        tournament.name,
                        e.target.value,
                      )
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 mt-1 text-white focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400">Format</label>
                  <select
                    value={tournament.format}
                    onChange={(e) =>
                      updateTournament(
                        tournament.id,
                        tournament.name,
                        tournament.date,
                        undefined,
                        e.target.value as "1v1" | "2v2" | "3v3" | "libre",
                      )
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 mt-1 text-white focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="1v1">1v1 (Solo)</option>
                    <option value="2v2">2v2 (Équipes de 2)</option>
                    <option value="3v3">3v3 (Équipes de 3)</option>
                    <option value="libre">Libre (Équipes flexibles)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Link to League */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <LinkIcon size={18} />
                Association à une League
              </h3>
              {tournament.leagueId ? (
                <div className="space-y-3">
                  <div className="text-sm text-slate-400">
                    Ce tournoi est associé à :
                  </div>
                  <div className="bg-slate-700 p-3 rounded-lg">
                    <div className="font-bold text-white">
                      {league?.name || "League introuvable"}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Voulez-vous dissocier ce tournoi de la League ?",
                        )
                      ) {
                        associateTournamentToLeague(tournament.id, "");
                      }
                    }}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg text-sm"
                  >
                    Dissocier de la League
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-slate-400 mb-3">
                    Associe ce tournoi à une league pour suivre le classement
                    global ET ajouter rapidement les joueurs de la league.
                  </div>
                  <select
                    value={selectedLeagueId}
                    onChange={(e) => setSelectedLeagueId(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="">Sélectionner une League</option>
                    {leagues.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  {selectedLeagueId && (
                    <button
                      onClick={handleLinkToLeague}
                      className="w-full bg-primary hover:bg-amber-600 text-white font-bold py-3 rounded-lg"
                    >
                      Associer à cette League
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Anti-Cheat Mode */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-bold text-white mb-4">Mode Anti-Triche</h3>
              <div className="space-y-3">
                <div className="text-sm text-slate-400 mb-3">
                  Lorsque activé, chaque match doit être confirmé par
                  l'adversaire pour éviter la triche.
                </div>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-white font-medium">
                    Anti-triche activé
                  </span>
                  <input
                    type="checkbox"
                    checked={tournament.anti_cheat_enabled || false}
                    onChange={(e) =>
                      updateTournament(
                        tournament.id,
                        tournament.name,
                        tournament.date,
                        e.target.checked,
                      )
                    }
                    className="w-6 h-6 rounded bg-slate-700 border-slate-600 text-primary focus:ring-2 focus:ring-primary"
                  />
                </label>
              </div>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-bold text-white mb-4">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => toggleTournamentStatus(tournament.id)}
                  className={`w-full py-3 rounded-lg font-bold transition-all border ${
                    tournament.isFinished
                      ? "bg-amber-500/20 text-amber-500 border-amber-500/50 hover:bg-amber-500/30"
                      : "bg-green-500/20 text-green-500 border-green-500/50 hover:bg-green-500/30"
                  }`}
                >
                  {tournament.isFinished
                    ? "Rouvrir le tournoi"
                    : "Clôturer le tournoi"}
                </button>

                {/* Task 7 - Leave tournament button (AC7 - only for non-admins) */}
                {!isAdmin && (
                  <button
                    onClick={handleLeaveTournament}
                    className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-500 font-bold py-3 rounded-lg border border-orange-500/50 flex items-center justify-center gap-2"
                  >
                    <LogOut size={18} />
                    Quitter le tournoi
                  </button>
                )}

                <button
                  onClick={handleDeleteTournament}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-500 font-bold py-3 rounded-lg border border-red-500/50"
                >
                  Supprimer le Tournoi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB (AC6): Nouveau match with BeerPongMatchIcon */}
      {!tournament.isFinished && (
        <FAB
          icon={BeerPongMatchIcon}
          onClick={() => setShowRecordMatch(true)}
          ariaLabel="Nouveau match"
        />
      )}

      {/* Record Match Modal - Using new MatchRecordingForm */}
      {showRecordMatch && (
        <MatchRecordingForm
          tournamentId={tournament.id}
          leagueId={tournament.leagueId}
          format={tournament.format}
          participants={tournamentPlayers}
          onSuccess={handleMatchFormSuccess}
          onClose={() => setShowRecordMatch(false)}
        />
      )}

      {/* Add Player Modal - 3 options */}
      {showAddPlayer && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h3 className="text-xl font-bold">Ajouter un joueur</h3>
              <button
                onClick={() => {
                  setShowAddPlayer(false);
                  setAddPlayerTab("pseudo"); // Reset tab on close
                }}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700">
              <button
                onClick={() => setAddPlayerTab("pseudo")}
                className={`flex-1 py-3 font-bold text-sm uppercase tracking-wide transition-colors border-b-2 ${
                  addPlayerTab === "pseudo"
                    ? "border-primary text-white"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                Pseudo
              </button>
              <button
                onClick={() => setAddPlayerTab("invitation")}
                className={`flex-1 py-3 font-bold text-sm uppercase tracking-wide transition-colors border-b-2 ${
                  addPlayerTab === "invitation"
                    ? "border-primary text-white"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                Invitation
              </button>
              <button
                onClick={() => setAddPlayerTab("league")}
                disabled={!tournament.leagueId}
                className={`flex-1 py-3 font-bold text-sm uppercase tracking-wide transition-colors border-b-2 ${
                  addPlayerTab === "league"
                    ? "border-primary text-white"
                    : tournament.leagueId
                      ? "border-transparent text-slate-500 hover:text-slate-300"
                      : "border-transparent text-slate-600 cursor-not-allowed"
                }`}
              >
                Depuis ligue
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Tab 1: Pseudo */}
              {addPlayerTab === "pseudo" && (
                <form onSubmit={handleAddPlayerByPseudo} className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">
                      Pseudo du joueur
                    </label>
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Nom du joueur"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-primary outline-none"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-amber-600 font-bold py-4 rounded-xl text-white transition-colors"
                  >
                    AJOUTER
                  </button>
                </form>
              )}

              {/* Tab 2: Invitation */}
              {addPlayerTab === "invitation" && (
                <div className="space-y-4">
                  <h4 className="font-bold text-center mb-4">
                    Partage le tournoi
                  </h4>

                  {tournament.joinCode && (
                    <div className="bg-slate-800 p-4 rounded-xl text-center">
                      <div className="text-sm text-slate-400 mb-2">Code</div>
                      <div className="text-2xl font-mono font-bold text-primary mb-4">
                        {tournament.joinCode}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      onClick={handleCopyCode}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      📋 Copier le code
                    </button>
                    <button
                      onClick={handleShareLink}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      📱 Partager le lien
                    </button>
                  </div>

                  <div className="text-center text-sm text-slate-400 my-4">
                    ou
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="bg-white p-3 rounded-lg">
                      <QRCodeSVG
                        value={`${window.location.origin}/tournament/${tournament.id}/join`}
                        size={150}
                        level="H"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setShowAddPlayer(false);
                        setActiveTab("settings");
                      }}
                      className="mt-3 text-sm text-primary hover:text-amber-600 transition-colors"
                    >
                      Afficher en grand
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Depuis ligue */}
              {addPlayerTab === "league" && (
                <div className="space-y-4">
                  {tournament.leagueId && league ? (
                    <>
                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">
                          Sélectionne un joueur
                        </label>
                        <select
                          value={selectedLeaguePlayerId}
                          onChange={(e) =>
                            setSelectedLeaguePlayerId(e.target.value)
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="">Choisir un joueur...</option>
                          {league.players
                            .filter(
                              (lp) =>
                                !tournamentParticipants.some(
                                  (tp) => tp.leaguePlayerId === lp.id,
                                ),
                            )
                            .map((player) => (
                              <option key={player.id} value={player.id}>
                                {player.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <button
                        onClick={handleAddPlayerFromLeague}
                        disabled={!selectedLeaguePlayerId}
                        className="w-full bg-primary hover:bg-amber-600 font-bold py-4 rounded-xl text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        AJOUTER
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-slate-400 mb-4">
                        Associe ce tournoi à une ligue dans les paramètres
                      </div>
                      <button
                        onClick={() => {
                          setShowAddPlayer(false);
                          setActiveTab("settings");
                        }}
                        className="bg-primary hover:bg-amber-600 font-bold py-3 px-6 rounded-xl text-white transition-colors"
                      >
                        Aller aux paramètres
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ELO Changes Display */}
      {showEloChanges && (
        <EloChangeDisplay
          players={tournamentPlayers}
          eloChanges={lastEloChanges}
          onClose={() => setShowEloChanges(false)}
        />
      )}

      {/* Story 13.2 - Actions moved to ContextualHeader (removed ContextualBar) */}
    </div>
  );
};
