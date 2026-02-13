import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "@/context/LeagueContext";
import {
  Trophy,
  Plus,
  History,
  Users,
  X,
  Trash2,
  Edit,
  Monitor,
  UserPlus,
  Calendar,
} from "lucide-react";
import { BeerPongMatchIcon } from "../components/icons/BeerPongMatchIcon";
import { EloChangeDisplay } from "../components/EloChangeDisplay";
import { EmptyState } from "../components/EmptyState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ContextualHeader } from "../components/navigation/ContextualHeader";
import { useDetailPagePermissions } from "../hooks/useDetailPagePermissions";
import {
  InfoCard,
  StatCard,
  SegmentedTabs,
  ListRow,
  FAB,
} from "@/components/design-system";

// Delta ELO du dernier match du joueur (design system 4.3)
// matches must be sorted by date desc (most recent first)
function getDeltaFromLastMatch(
  playerId: string,
  matches: {
    date: string;
    teamA: string[];
    teamB: string[];
    eloChanges?: Record<string, number>;
  }[],
): number | undefined {
  for (const m of matches) {
    if (m.teamA.includes(playerId) || m.teamB.includes(playerId)) {
      const change = m.eloChanges?.[playerId];
      return change !== undefined ? change : undefined;
    }
  }
  return undefined;
}

// Derniers 5 résultats (true=victoire, false=défaite), du plus récent au plus ancien
// matches must be sorted by date desc (most recent first)
function getLast5MatchResults(
  playerId: string,
  matches: {
    date: string;
    teamA: string[];
    teamB: string[];
    scoreA: number;
    scoreB: number;
  }[],
): boolean[] {
  const results: boolean[] = [];
  for (const m of matches) {
    if (results.length >= 5) break;
    const inTeamA = m.teamA.includes(playerId);
    const inTeamB = m.teamB.includes(playerId);
    if (!inTeamA && !inTeamB) continue;
    const won =
      (inTeamA && m.scoreA > m.scoreB) || (inTeamB && m.scoreB > m.scoreA);
    results.push(won);
  }
  return results;
}

export const LeagueDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const {
    leagues,
    tournaments,
    addPlayer,
    recordMatch,
    deleteLeague,
    updateLeague,
    deletePlayer,
    isLoadingInitialData,
  } = useLeague();
  const navigate = useNavigate();

  const league = leagues.find((l) => l.id === id);
  const [activeTab, setActiveTab] = useState<
    "classement" | "matchs" | "parametres"
  >("classement");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showRecordMatch, setShowRecordMatch] = useState(false);

  // Escape key closes modals
  useEffect(() => {
    if (!showAddPlayer && !showRecordMatch) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAddPlayer(false);
        setShowRecordMatch(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showAddPlayer, showRecordMatch]);

  // Add Player State
  const [newPlayerName, setNewPlayerName] = useState("");

  // Record Match State
  const [selectedPlayersA, setSelectedPlayersA] = useState<string[]>([]);
  const [selectedPlayersB, setSelectedPlayersB] = useState<string[]>([]);
  const [matchWinner, setMatchWinner] = useState<"A" | "B" | null>(null);
  const [showEloChanges, setShowEloChanges] = useState(false);
  const [lastEloChanges, setLastEloChanges] = useState<Record<string, number>>(
    {},
  );

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

  const sortedPlayers = useMemo(() => {
    return [...league.players].sort((a, b) => b.elo - a.elo);
  }, [league.players]);

  // Memoize sorted matches (by date desc) to avoid re-sorting 2N times per render
  const sortedMatches = useMemo(
    () =>
      [...league.matches].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [league.matches],
  );

  // Story 9-5 - Get permissions for contextual actions
  const { isAdmin, canInvite } = useDetailPagePermissions(id || "", "league");

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPlayerName.trim();
    if (trimmed && trimmed.length <= 50) {
      addPlayer(league.id, trimmed);
      setNewPlayerName("");
      setShowAddPlayer(false);
    }
  };

  const togglePlayerSelection = (playerId: string, team: "A" | "B") => {
    if (team === "A") {
      if (selectedPlayersA.includes(playerId)) {
        setSelectedPlayersA((prev) => prev.filter((id) => id !== playerId));
      } else {
        if (selectedPlayersB.includes(playerId)) {
          setSelectedPlayersB((prev) => prev.filter((id) => id !== playerId));
        }
        setSelectedPlayersA((prev) => [...prev, playerId]);
      }
    } else {
      if (selectedPlayersB.includes(playerId)) {
        setSelectedPlayersB((prev) => prev.filter((id) => id !== playerId));
      } else {
        if (selectedPlayersA.includes(playerId)) {
          setSelectedPlayersA((prev) => prev.filter((id) => id !== playerId));
        }
        setSelectedPlayersB((prev) => [...prev, playerId]);
      }
    }
  };

  const handleRecordMatch = async () => {
    if (
      selectedPlayersA.length > 0 &&
      selectedPlayersB.length > 0 &&
      matchWinner
    ) {
      const eloChanges = await recordMatch(
        league.id,
        selectedPlayersA,
        selectedPlayersB,
        matchWinner,
      );
      setShowRecordMatch(false);
      setSelectedPlayersA([]);
      setSelectedPlayersB([]);
      setMatchWinner(null);

      if (eloChanges) {
        setLastEloChanges(eloChanges);
        setShowEloChanges(true);
      }
    }
  };

  const handleDeleteLeague = () => {
    if (confirm("Es-tu sûr de vouloir supprimer cette ligue ?")) {
      deleteLeague(league.id);
      navigate("/");
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* AC1: Header: name + back + actions (Invite, menu) */}
      <ContextualHeader
        title={league.name}
        showBackButton={true}
        onBack={() => navigate("/leagues")}
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
                  onClick: () => navigate(`/league/${league.id}/display`),
                },
              ]
            : []),
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
        ]}
      />

      {/* AC2: InfoCard (status, format, date) */}
      <div className="px-4 py-3">
        <InfoCard
          title=""
          statusBadge="En cours"
          statusVariant="active"
          infos={[
            {
              icon: Trophy,
              text: `Format: ${league.type === "season" ? "Par Saison" : "Continue"}`,
            },
            {
              icon: Users,
              text: `${league.players.length} joueurs`,
            },
            {
              icon: Calendar,
              text: new Date(league.createdAt).toLocaleDateString("fr-FR"),
            },
          ]}
        />
      </div>

      {/* AC3: StatCards (3 columns) */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        <StatCard
          value={league.players.length}
          label="Joueurs"
          variant="primary"
        />
        <StatCard value={league.matches.length} label="Matchs" />
        <StatCard
          value={sortedPlayers.length > 0 ? sortedPlayers[0].elo : "-"}
          label="Top ELO"
          variant="accent"
        />
      </div>

      {/* AC4: SegmentedTabs (Ranking / Matches / Settings) */}
      <div className="px-4 pb-4">
        <SegmentedTabs
          tabs={[
            { id: "classement", label: "Classement" },
            { id: "matchs", label: "Matchs" },
            { id: "parametres", label: "Paramètres" },
          ]}
          activeId={activeTab}
          onChange={(id) =>
            setActiveTab(id as "classement" | "matchs" | "parametres")
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
                  <button
                    onClick={() => setShowAddPlayer(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-amber-600 transition-colors"
                  >
                    <Plus size={16} className="inline mr-2" />
                    Ajouter un joueur
                  </button>
                }
              />
            ) : (
              <div className="space-y-2 w-full">
                {sortedPlayers.map((player, index) => {
                  const recentResults = getLast5MatchResults(
                    player.id,
                    sortedMatches,
                  );
                  const delta = getDeltaFromLastMatch(player.id, sortedMatches);
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
                      onClick={() => navigate(`/player/${player.id}`)}
                    />
                  );
                })}
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
                  <button
                    onClick={() => setShowRecordMatch(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-amber-600 transition-colors"
                  >
                    <Plus size={16} className="inline mr-2" />
                    Enregistrer un match
                  </button>
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
                    className="bg-slate-800 p-4 rounded-xl border border-slate-700/50 flex justify-between items-center text-sm"
                  >
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
                );
              })
            )}
          </>
        )}
        {activeTab === "parametres" && (
          <div className="space-y-4">
            {/* League info */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-bold text-white mb-4">Informations</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-400">
                    Nom de la League
                  </label>
                  <input
                    type="text"
                    value={league.name}
                    onChange={(e) =>
                      updateLeague(league.id, e.target.value, league.type)
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 mt-1 text-white focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400">Type</label>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() =>
                        updateLeague(league.id, league.name, "event")
                      }
                      className={`flex-1 py-2 rounded-lg font-bold text-sm ${
                        league.type === "event"
                          ? "bg-primary text-white"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      Continue
                    </button>
                    <button
                      onClick={() =>
                        updateLeague(league.id, league.name, "season")
                      }
                      className={`flex-1 py-2 rounded-lg font-bold text-sm ${
                        league.type === "season"
                          ? "bg-primary text-white"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      Par Saison
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tournaments */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-bold text-white mb-4">Tournois</h3>
              {league.tournaments && league.tournaments.length > 0 ? (
                <div className="space-y-2">
                  {tournaments
                    .filter((t) => league.tournaments?.includes(t.id))
                    .map((tournament) => (
                      <div
                        key={tournament.id}
                        onClick={() => navigate(`/tournament/${tournament.id}`)}
                        className="bg-slate-700/50 p-3 rounded-xl flex justify-between items-center hover:border-slate-600 cursor-pointer transition-colors border border-transparent"
                      >
                        <div className="flex-1">
                          <div className="font-bold text-white flex items-center gap-2">
                            {tournament.name}
                            {tournament.isFinished && (
                              <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded">
                                Terminé
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(tournament.date).toLocaleDateString(
                              "fr-FR",
                            )}{" "}
                            • {tournament.matches.length} matchs
                          </div>
                        </div>
                        <div className="text-slate-500">→</div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm mb-4">
                  Aucun tournoi associé.
                </p>
              )}
              <button
                onClick={() =>
                  navigate(`/create-tournament?leagueId=${league.id}`)
                }
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg"
              >
                <Plus size={16} className="inline mr-2" />
                Créer un tournoi
              </button>
            </div>

            {/* Players */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-bold text-white mb-4">Joueurs</h3>
              {sortedPlayers.length === 0 ? (
                <p className="text-slate-400 text-sm mb-4">
                  Aucun joueur dans cette ligue.
                </p>
              ) : (
                <div className="space-y-2">
                  {sortedPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="bg-slate-700/50 p-3 rounded-xl flex items-center justify-between border border-transparent"
                    >
                      <div
                        onClick={() => navigate(`/player/${player.id}`)}
                        className="flex-1 flex items-center gap-4 cursor-pointer"
                      >
                        <div className="font-bold text-white">
                          {player.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {player.elo} ELO • {player.wins}V - {player.losses}D
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // FUTURE: Implement edit player modal
                          }}
                          className="p-2 hover:bg-slate-600 rounded-lg"
                          aria-label="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
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
                          className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg"
                          aria-label="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowAddPlayer(true)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg mt-4"
              >
                <Plus size={16} className="inline mr-2" />
                Ajouter un joueur
              </button>
            </div>

            {/* Actions */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-bold text-white mb-4">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(league, null, 2);
                    const dataBlob = new Blob([dataStr], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `${league.name}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg"
                >
                  Exporter les données (JSON)
                </button>
                <button
                  onClick={handleDeleteLeague}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-500 font-bold py-3 rounded-lg border border-red-500/50"
                >
                  Supprimer la League
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AC6: FAB Nouveau match (BeerPongMatchIcon) */}
      <FAB
        icon={BeerPongMatchIcon}
        onClick={() => setShowRecordMatch(true)}
        ariaLabel="Nouveau match"
      />

      {/* Add Player Modal */}
      {showAddPlayer && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-6 border border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Nouveau Joueur</h3>
              <button
                onClick={() => setShowAddPlayer(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAddPlayer}>
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Nom du joueur"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4 text-white focus:ring-2 focus:ring-primary outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="w-full bg-primary font-bold py-4 rounded-xl text-white"
              >
                AJOUTER
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Record Match Modal */}
      {showRecordMatch && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Nouveau Match</h3>
            <button
              onClick={() => setShowRecordMatch(false)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X size={24} className="text-slate-400" />
            </button>
          </div>

          <div className="flex-grow space-y-8">
            <div>
              <div className="text-sm font-bold text-primary uppercase mb-2">
                Équipe 1
              </div>
              <div className="flex flex-wrap gap-2">
                {sortedPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => togglePlayerSelection(player.id, "A")}
                    disabled={selectedPlayersB.includes(player.id)}
                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                      selectedPlayersA.includes(player.id)
                        ? "bg-primary border-primary text-white"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    } ${
                      selectedPlayersB.includes(player.id) ? "opacity-20" : ""
                    }`}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center text-slate-500 font-bold">VS</div>

            <div>
              <div className="text-sm font-bold text-accent uppercase mb-2">
                Équipe 2
              </div>
              <div className="flex flex-wrap gap-2">
                {sortedPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => togglePlayerSelection(player.id, "B")}
                    disabled={selectedPlayersA.includes(player.id)}
                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                      selectedPlayersB.includes(player.id)
                        ? "bg-accent border-accent text-white"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    } ${
                      selectedPlayersA.includes(player.id) ? "opacity-20" : ""
                    }`}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>

            {selectedPlayersA.length > 0 && selectedPlayersB.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="text-center text-sm text-slate-400 mb-4">
                  QUI A GAGNÉ ?
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setMatchWinner("A")}
                    className={`p-6 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      matchWinner === "A"
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-slate-800 border-slate-700 opacity-50 hover:opacity-100"
                    }`}
                  >
                    <Trophy size={32} />
                    <span className="font-bold">ÉQUIPE 1</span>
                  </button>
                  <button
                    onClick={() => setMatchWinner("B")}
                    className={`p-6 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      matchWinner === "B"
                        ? "bg-accent/20 border-accent text-accent"
                        : "bg-slate-800 border-slate-700 opacity-50 hover:opacity-100"
                    }`}
                  >
                    <Trophy size={32} />
                    <span className="font-bold">ÉQUIPE 2</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleRecordMatch}
            disabled={!matchWinner}
            className="w-full bg-white text-black font-black text-lg py-4 rounded-xl shadow-lg mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            VALIDER LE MATCH
          </button>
        </div>
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
