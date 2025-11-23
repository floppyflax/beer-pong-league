import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { useAuthContext } from "../context/AuthContext";
import { AuthModal } from "../components/AuthModal";
import { Calendar, Trophy, Plus, X } from "lucide-react";

export const CreateTournament = () => {
  const [searchParams] = useSearchParams();
  const leagueIdParam = searchParams.get("leagueId");

  const { leagues, createTournament, createLeague } = useLeague();
  const { isAuthenticated, isLoading } = useAuthContext();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();
  const [showCreateLeague, setShowCreateLeague] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");

  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(
    leagueIdParam
  );
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  const selectedLeague = selectedLeagueId
    ? leagues.find((l) => l.id === selectedLeagueId)
    : null;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [isAuthenticated, isLoading]);

  // Pre-select all players if League is selected
  React.useEffect(() => {
    if (selectedLeague && selectedPlayerIds.length === 0) {
      setSelectedPlayerIds(selectedLeague.players.map((p) => p.id));
    }
  }, [selectedLeague]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Si une League est sélectionnée, il faut au moins un joueur
    if (selectedLeagueId && selectedPlayerIds.length === 0) return;

    const tournamentId = await createTournament(
      name,
      date,
      selectedLeagueId,
      selectedPlayerIds
    );
    navigate(`/tournament/${tournamentId}`);
  };

  const togglePlayer = (playerId: string) => {
    if (selectedPlayerIds.includes(playerId)) {
      setSelectedPlayerIds((prev) => prev.filter((id) => id !== playerId));
    } else {
      setSelectedPlayerIds((prev) => [...prev, playerId]);
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName.trim()) return;

    const newLeagueId = await createLeague(newLeagueName, "event");
    setSelectedLeagueId(newLeagueId);
    setShowCreateLeague(false);
    setNewLeagueName("");
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-8">Nouveau Tournoi</h2>

      <form onSubmit={handleSubmit} className="space-y-6 flex-grow">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400">
            Nom du Tournoi
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Méchoui de Thomas, Soirée BBQ..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-400">
            Association à une League
          </label>

          <button
            type="button"
            onClick={() => setSelectedLeagueId(null)}
            className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${
              selectedLeagueId === null
                ? "bg-primary/10 border-primary text-primary"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                selectedLeagueId === null
                  ? "bg-primary text-white"
                  : "bg-slate-700"
              }`}
            >
              <Calendar size={24} />
            </div>
            <div className="text-left">
              <div className="font-bold">Tournoi Autonome</div>
              <div className="text-xs opacity-80">Sans League associée</div>
            </div>
          </button>

          {leagues.length > 0 ? (
            leagues.map((league) => (
              <button
                key={league.id}
                type="button"
                onClick={() => setSelectedLeagueId(league.id)}
                className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${
                  selectedLeagueId === league.id
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    selectedLeagueId === league.id
                      ? "bg-primary text-white"
                      : "bg-slate-700"
                  }`}
                >
                  <Trophy size={24} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold">{league.name}</div>
                  <div className="text-xs opacity-80">
                    {league.players.length} joueurs
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-sm mb-3">
                Aucune League disponible
              </p>
              <button
                type="button"
                onClick={() => setShowCreateLeague(true)}
                className="w-full bg-primary hover:bg-amber-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Créer une League
              </button>
            </div>
          )}

          {leagues.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCreateLeague(true)}
              className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Plus size={18} />
              Créer une nouvelle League
            </button>
          )}
        </div>

        {/* Modal de création de League */}
        {showCreateLeague && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-6 border border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Créer une League</h3>
                <button
                  onClick={() => {
                    setShowCreateLeague(false);
                    setNewLeagueName("");
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleCreateLeague}>
                <input
                  type="text"
                  value={newLeagueName}
                  onChange={(e) => setNewLeagueName(e.target.value)}
                  placeholder="Nom de la League"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4 text-white focus:ring-2 focus:ring-primary outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newLeagueName.trim()}
                  className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-600 text-white font-bold py-3 rounded-xl"
                >
                  CRÉER
                </button>
              </form>
            </div>
          </div>
        )}

        {selectedLeague && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-400">
              Joueurs participants
            </label>
            <div className="bg-slate-800 rounded-xl p-4 space-y-2 max-h-64 overflow-y-auto">
              {selectedLeague.players.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => togglePlayer(player.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedPlayerIds.includes(player.id)
                      ? "bg-primary text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  <div className="font-bold">{player.name}</div>
                  <div className="text-xs opacity-80">{player.elo} ELO</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {selectedPlayerIds.length} joueur
              {selectedPlayerIds.length > 1 ? "s" : ""} sélectionné
              {selectedPlayerIds.length > 1 ? "s" : ""}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={
            !name.trim() ||
            (selectedLeagueId !== null && selectedPlayerIds.length === 0) ||
            !isAuthenticated
          }
          className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg mt-auto"
        >
          {!isAuthenticated ? "CONNEXION REQUISE" : "CRÉER LE TOURNOI"}
        </button>
      </form>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          if (isAuthenticated) {
            setShowAuthModal(false);
          } else {
            navigate("/");
          }
        }}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </div>
  );
};
