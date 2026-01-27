import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import {
  Trophy,
  Plus,
  X,
  Link as LinkIcon,
  Users,
  History,
  Monitor,
  Share2,
} from "lucide-react";
import { EloChangeDisplay } from "../components/EloChangeDisplay";
import { EmptyState } from "../components/EmptyState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { QRCodeDisplay } from "../components/QRCodeDisplay";

export const TournamentDashboard = () => {
  const { id } = useParams<{ id: string }>();
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
  } = useLeague();
  const navigate = useNavigate();

  const tournament = tournaments.find((t) => t.id === id);
  const [rankingMode, setRankingMode] = useState<"local" | "global">("local");
  const [activeTab, setActiveTab] = useState<
    "ranking" | "history" | "settings"
  >("ranking");
  const [showRecordMatch, setShowRecordMatch] = useState(false);
  const [showEloChanges, setShowEloChanges] = useState(false);
  const [lastEloChanges, setLastEloChanges] = useState<Record<string, number>>(
    {}
  );

  // Record Match State
  const [selectedPlayersA, setSelectedPlayersA] = useState<string[]>([]);
  const [selectedPlayersB, setSelectedPlayersB] = useState<string[]>([]);
  const [matchWinner, setMatchWinner] = useState<"A" | "B" | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");

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

  const league = tournament.leagueId
    ? leagues.find((l) => l.id === tournament.leagueId)
    : null;
  const tournamentPlayers = league
    ? league.players.filter((p) => tournament.playerIds.includes(p.id))
    : [];

  // Get ranking based on mode
  const ranking = useMemo(() => {
    if (rankingMode === "local") {
      return getTournamentLocalRanking(tournament.id);
    } else {
      if (tournament.leagueId) {
        return getLeagueGlobalRanking(tournament.leagueId);
      }
      return [];
    }
  }, [
    rankingMode,
    tournament,
    getTournamentLocalRanking,
    getLeagueGlobalRanking,
  ]);

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
      const eloChanges = await recordTournamentMatch(
        tournament.id,
        selectedPlayersA,
        selectedPlayersB,
        matchWinner
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

  const handleDeleteTournament = () => {
    if (confirm("Es-tu sûr de vouloir supprimer ce Tournoi ?")) {
      deleteTournament(tournament.id);
      navigate("/");
    }
  };

  // Auto-add new players from League to Tournament
  useEffect(() => {
    if (!tournament.leagueId || !league) return;

    const leaguePlayerIds = league.players.map((p) => p.id);
    const missingPlayers = leaguePlayerIds.filter(
      (id) => !tournament.playerIds.includes(id)
    );

    if (missingPlayers.length > 0) {
      missingPlayers.forEach((playerId) => {
        addPlayerToTournament(tournament.id, playerId);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league?.players.length]);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    if (tournament.leagueId) {
      // Add player to League - it will be auto-added to tournament via useEffect
      addPlayer(tournament.leagueId, newPlayerName);
    } else {
      // For autonomous tournaments, we need to create a league first or link to one
      // For now, show a message to link to a league
      alert("Pour ajouter des joueurs, associez d'abord ce tournoi à une League dans les paramètres.");
      setShowAddPlayer(false);
      setActiveTab("settings");
      return;
    }
    setNewPlayerName("");
    setShowAddPlayer(false);
  };

  const handleLinkToLeague = () => {
    if (!selectedLeagueId) return;
    associateTournamentToLeague(tournament.id, selectedLeagueId);
    setSelectedLeagueId("");
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-slate-800/50">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold leading-none">
              {tournament.name}
            </h2>
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                tournament.isFinished
                  ? "bg-green-500/20 text-green-500"
                  : "bg-amber-500/20 text-amber-500"
              }`}
            >
              {tournament.isFinished ? "Terminé" : "En cours"}
            </span>
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">
            {new Date(tournament.date).toLocaleDateString("fr-FR")}
            {tournament.leagueId && league && ` • ${league.name}`}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/tournament/${tournament.id}/invite`)}
            className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
            title="Partager l'invitation"
          >
            <Share2 size={20} />
          </button>
          <button
            onClick={() => navigate(`/tournament/${tournament.id}/display`)}
            className="p-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors"
            title="Vue Display (plein écran)"
          >
            <Monitor size={20} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2 p-4 pt-0">
        <div className="bg-slate-800 p-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-white">
            {tournamentPlayers.length}
          </div>
          <div className="text-[10px] text-slate-400 uppercase font-bold">
            Joueurs
          </div>
        </div>
        <div className="bg-slate-800 p-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-white">
            {tournament.matches.length}
          </div>
          <div className="text-[10px] text-slate-400 uppercase font-bold">
            Matchs
          </div>
        </div>
        <div className="bg-slate-800 p-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-primary">
            {ranking.length > 0 ? ranking[0].elo : "-"}
          </div>
          <div className="text-[10px] text-slate-400 uppercase font-bold">
            Top ELO
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 px-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("ranking")}
          className={`flex-1 min-w-[100px] py-3 font-bold text-sm uppercase tracking-wide transition-colors border-b-2 ${
            activeTab === "ranking"
              ? "border-primary text-white"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Classement
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 min-w-[100px] py-3 font-bold text-sm uppercase tracking-wide transition-colors border-b-2 ${
            activeTab === "history"
              ? "border-primary text-white"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Historique
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 min-w-[100px] py-3 font-bold text-sm uppercase tracking-wide transition-colors border-b-2 ${
            activeTab === "settings"
              ? "border-primary text-white"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
          title="Paramètres"
        >
          ⚙️ Paramètres
        </button>
      </div>

      {!tournament.leagueId && activeTab === "ranking" && (
        <div className="px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-lg mx-4 my-2 flex items-center gap-2 text-sm">
          <LinkIcon size={16} className="text-amber-500" />
          <span className="text-amber-500">
            Tournoi autonome. Associe-le à une League pour suivre le classement
            global.
          </span>
        </div>
      )}

      {/* Ranking Mode Switch */}
      {tournament.leagueId && activeTab === "ranking" && (
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
      <div className="flex-grow overflow-y-auto px-4 py-4 space-y-2 pb-32">
        {activeTab === "ranking" && (
          <>
            {ranking.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Aucun joueur"
                description={tournament.leagueId 
                  ? "Ajoute des joueurs depuis la ligue pour participer au tournoi."
                  : "Associe ce tournoi à une ligue dans les paramètres pour ajouter des joueurs."}
                action={tournament.leagueId ? (
                  <button
                    onClick={() => setShowAddPlayer(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-amber-600 transition-colors"
                  >
                    <Plus size={16} className="inline mr-2" />
                    Ajouter un joueur
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-amber-600 transition-colors"
                  >
                    Associer à une ligue
                  </button>
                )}
              />
            ) : (
              ranking.map((player, index) => (
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
        {activeTab === "history" && (
          <>
            {tournament.matches.length === 0 ? (
              <EmptyState
                icon={History}
                title="Aucun match"
                description="Enregistre ton premier match pour voir l'évolution du classement."
                action={
                  !tournament.isFinished && (
                    <button
                      onClick={() => setShowRecordMatch(true)}
                      className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-amber-600 transition-colors"
                    >
                      <Plus size={16} className="inline mr-2" />
                      Enregistrer un match
                    </button>
                  )
                }
              />
            ) : (
              tournament.matches.map((match) => {
                const teamANames = tournamentPlayers
                  .filter((p) => match.teamA.includes(p.id))
                  .map((p) => p.name)
                  .join(", ");
                const teamBNames = tournamentPlayers
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
        {activeTab === "settings" && (
          <div className="space-y-4">
            {/* QR Code Section */}
            <QRCodeDisplay 
              tournamentId={tournament.id}
              tournamentName={tournament.name}
            />

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
                        tournament.date
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
                        e.target.value
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
                        e.target.value as '1v1' | '2v2' | '3v3' | 'libre'
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
                      if (confirm("Voulez-vous dissocier ce tournoi de la League ?")) {
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
                    Associez ce tournoi à une League pour suivre le classement global.
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
                  Lorsque activé, chaque match doit être confirmé par l'adversaire
                  pour éviter la triche.
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
                        e.target.checked
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

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 flex gap-3 max-w-md mx-auto z-30">
        <button
          onClick={() => setShowAddPlayer(true)}
          className="bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center"
          title="Ajouter un joueur"
        >
          <Users size={24} />
        </button>
        {!tournament.isFinished && (
          <button
            onClick={() => setShowRecordMatch(true)}
            className="flex-1 bg-primary hover:bg-amber-600 text-white p-4 rounded-xl shadow-lg transition-transform active:scale-95 font-bold flex items-center justify-center gap-2"
          >
            <Plus size={24} />
            <span>NOUVEAU MATCH</span>
          </button>
        )}
      </div>

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
            <div>
              <div className="text-sm font-bold text-primary uppercase mb-2">
                Équipe 1
              </div>
              <div className="flex flex-wrap gap-2">
                {tournamentPlayers.map((player) => (
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
                {tournamentPlayers.map((player) => (
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
              <div>
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
            {tournament.leagueId ? (
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
            ) : (
              <div className="space-y-4">
                <p className="text-slate-400 text-sm">
                  Pour ajouter des joueurs, ce tournoi doit être associé à une League.
                </p>
                <button
                  onClick={() => {
                    setShowAddPlayer(false);
                    setActiveTab("settings");
                  }}
                  className="w-full bg-primary font-bold py-4 rounded-xl text-white"
                >
                  Associer à une League
                </button>
              </div>
            )}
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
    </div>
  );
};
