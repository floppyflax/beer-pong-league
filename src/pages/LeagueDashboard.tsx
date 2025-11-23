import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { Trophy, Plus, History, Users, X, Trash2, Edit, Monitor } from "lucide-react";
import { EloChangeDisplay } from "../components/EloChangeDisplay";
import { EmptyState } from "../components/EmptyState";
import { LoadingSpinner } from "../components/LoadingSpinner";

export const LeagueDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const {
    leagues,
    tournaments,
    addPlayer,
    recordMatch,
    deleteLeague,
    updateLeague,
    // updatePlayer, // Unused
    deletePlayer,
    isLoadingInitialData,
  } = useLeague();
  const navigate = useNavigate();

  const league = leagues.find((l) => l.id === id);
  const [activeTab, setActiveTab] = useState<
    "ranking" | "matches" | "tournaments" | "players" | "settings"
  >("ranking");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showRecordMatch, setShowRecordMatch] = useState(false);

  // Add Player State
  const [newPlayerName, setNewPlayerName] = useState("");

  // Record Match State
  const [selectedPlayersA, setSelectedPlayersA] = useState<string[]>([]);
  const [selectedPlayersB, setSelectedPlayersB] = useState<string[]>([]);
  const [matchWinner, setMatchWinner] = useState<"A" | "B" | null>(null);
  const [showEloChanges, setShowEloChanges] = useState(false);
  const [lastEloChanges, setLastEloChanges] = useState<Record<string, number>>(
    {}
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

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      addPlayer(league.id, newPlayerName);
      setNewPlayerName("");
      setShowAddPlayer(false);
    }
  };

  const togglePlayerSelection = (playerId: string, team: "A" | "B") => {
    if (team === "A") {
      if (selectedPlayersA.includes(playerId)) {
        setSelectedPlayersA((prev) => prev.filter((id) => id !== playerId));
      } else {
        // Remove from B if present
        if (selectedPlayersB.includes(playerId)) {
          setSelectedPlayersB((prev) => prev.filter((id) => id !== playerId));
        }
        setSelectedPlayersA((prev) => [...prev, playerId]);
      }
    } else {
      if (selectedPlayersB.includes(playerId)) {
        setSelectedPlayersB((prev) => prev.filter((id) => id !== playerId));
      } else {
        // Remove from A if present
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
        matchWinner
      );
      setShowRecordMatch(false);
      setSelectedPlayersA([]);
      setSelectedPlayersB([]);
      setMatchWinner(null);

      // Show ELO changes animation
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
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-slate-800/50">
        <div>
          <h2 className="text-2xl font-bold leading-none">{league.name}</h2>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">
            {league.type === "season" ? "Saison" : "Ligue"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/league/${league.id}/display`)}
            className="p-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors"
            title="Vue Display (plein écran)"
          >
            <Monitor size={20} />
          </button>
          <button
            onClick={handleDeleteLeague}
            className="text-slate-600 hover:text-red-500 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2 p-4 pt-0">
        <div className="bg-slate-800 p-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-white">
            {league.players.length}
          </div>
          <div className="text-[10px] text-slate-400 uppercase font-bold">
            Joueurs
          </div>
        </div>
        <div className="bg-slate-800 p-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-white">
            {league.matches.length}
          </div>
          <div className="text-[10px] text-slate-400 uppercase font-bold">
            Matchs
          </div>
        </div>
        <div className="bg-slate-800 p-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-primary">
            {league.matches.length > 0
              ? Math.round(league.matches.length / (league.players.length || 1))
              : 0}
          </div>
          <div className="text-[10px] text-slate-400 uppercase font-bold">
            Moy. Matchs
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 px-4">
        <button
          onClick={() => setActiveTab("ranking")}
          className={`flex-1 py-3 font-bold text-sm uppercase tracking-wide transition-colors border-b-2 ${
            activeTab === "ranking"
              ? "border-primary text-white"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Classement
        </button>
        <button
          onClick={() => setActiveTab("matches")}
          className={`flex-1 py-3 font-bold text-sm uppercase tracking-wide transition-colors border-b-2 ${
            activeTab === "matches"
              ? "border-primary text-white"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Historique
        </button>
        <button
          onClick={() => setActiveTab("tournaments")}
          className={`flex-1 py-3 font-bold text-sm uppercase tracking-wide transition-colors border-b-2 ${
            activeTab === "tournaments"
              ? "border-primary text-white"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Tournois
        </button>
        <button
          onClick={() => setActiveTab("players")}
          className={`flex-1 py-3 font-bold text-sm uppercase tracking-wide transition-colors border-b-2 ${
            activeTab === "players"
              ? "border-primary text-white"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Joueurs
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-3 font-bold text-sm uppercase tracking-wide transition-colors border-b-2 ${
            activeTab === "settings"
              ? "border-primary text-white"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
          title="Paramètres"
        >
          ⚙️ Paramètres
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4 space-y-2 pb-24">
        {activeTab === "ranking" && (
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
              sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  onClick={() => navigate(`/player/${player.id}`)}
                  className="bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-700/50 hover:border-primary cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 flex items-center justify-center font-black text-lg ${
                        index === 0
                          ? "text-yellow-400"
                          : index === 1
                          ? "text-slate-300"
                          : index === 2
                          ? "text-amber-700"
                          : "text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-white">{player.name}</div>
                      <div className="text-xs text-slate-400">
                        {player.wins}V - {player.losses}D •{" "}
                        {Math.round(
                          (player.wins / (player.matchesPlayed || 1)) * 100
                        )}
                        %
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-xl text-primary">
                      {player.elo}
                    </div>
                    <div
                      className={`text-[10px] font-bold uppercase ${
                        player.streak > 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {player.streak > 0
                        ? `+${player.streak} WIN`
                        : `${player.streak} LOSS`}
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
        {activeTab === "matches" && (
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
                      {teamBNames}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
        {activeTab === "tournaments" && (
          <>
            {league.tournaments && league.tournaments.length > 0 ? (
              tournaments
                .filter((t) => league.tournaments?.includes(t.id))
                .map((tournament) => (
                  <div
                    key={tournament.id}
                    onClick={() => navigate(`/tournament/${tournament.id}`)}
                    className="bg-slate-800 p-4 rounded-xl border border-slate-700/50 flex justify-between items-center hover:border-accent cursor-pointer transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-white flex items-center gap-2">
                        {tournament.name}
                        {tournament.isFinished && (
                          <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">
                            Terminé
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(tournament.date).toLocaleDateString("fr-FR")}{" "}
                        • {tournament.matches.length} matchs
                      </div>
                    </div>
                    <div className="text-slate-500">→</div>
                  </div>
                ))
            ) : (
              <EmptyState
                icon={Trophy}
                title="Aucun tournoi"
                description="Crée un tournoi pour organiser des événements compétitifs."
                action={
                  <button
                    onClick={() =>
                      navigate(`/create-tournament?leagueId=${league.id}`)
                    }
                    className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-amber-600 transition-colors"
                  >
                    <Plus size={16} className="inline mr-2" />
                    Créer un tournoi
                  </button>
                }
              />
            )}
          </>
        )}
        {activeTab === "players" && (
          <>
            {sortedPlayers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Aucun joueur"
                description="Ajoute des joueurs à cette ligue pour commencer."
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
              sortedPlayers.map((player) => (
                <div
                  key={player.id}
                  className="bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-700/50"
                >
                  <div
                    onClick={() => navigate(`/player/${player.id}`)}
                    className="flex-1 flex items-center gap-4 cursor-pointer"
                  >
                    <div className="font-bold text-white">{player.name}</div>
                    <div className="text-xs text-slate-400">
                      {player.elo} ELO • {player.wins}V - {player.losses}D
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Edit player modal
                      }}
                      className="p-2 hover:bg-slate-700 rounded-lg"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm(
                            `Supprimer ${player.name} ? Tous ses matchs seront également supprimés.`
                          )
                        ) {
                          deletePlayer(league.id, player.id);
                        }
                      }}
                      className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
        {activeTab === "settings" && (
          <div className="space-y-4">
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

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 flex gap-3 max-w-md mx-auto z-30">
        <button
          onClick={() => navigate(`/create-tournament?leagueId=${league.id}`)}
          className="bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center"
          title="Créer un Tournoi"
        >
          <Trophy size={24} />
        </button>
        <button
          onClick={() => setShowAddPlayer(true)}
          className="bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center"
          title="Ajouter un joueur"
        >
          <Users size={24} />
        </button>
        <button
          onClick={() => setShowRecordMatch(true)}
          className="flex-1 bg-primary hover:bg-amber-600 text-white p-4 rounded-xl shadow-lg transition-transform active:scale-95 font-bold flex items-center justify-center gap-2"
        >
          <Plus size={24} />
          <span>NOUVEAU MATCH</span>
        </button>
      </div>

      {/* Add Player Modal */}
      {showAddPlayer && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-6 border border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Nouveau Joueur</h3>
              <button onClick={() => setShowAddPlayer(false)}>
                <X size={24} />
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
            <button onClick={() => setShowRecordMatch(false)}>
              <X size={24} />
            </button>
          </div>

          <div className="flex-grow space-y-8">
            {/* Team A Selection */}
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

            {/* Team B Selection */}
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

            {/* Winner Selection */}
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
