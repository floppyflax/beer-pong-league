import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { useRequireIdentity } from "../hooks/useRequireIdentity";
import { CreateIdentityModal } from "../components/CreateIdentityModal";
import { ArrowLeft, UserPlus, Users, Shield, LogIn } from "lucide-react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import toast from "react-hot-toast";

export const TournamentJoin = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournaments, leagues, addPlayerToTournament, addAnonymousPlayerToTournament, isLoadingInitialData } = useLeague();
  const { ensureIdentity, showModal, handleIdentityCreated, handleCancel } = useRequireIdentity();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [showCreatePlayer, setShowCreatePlayer] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const tournament = tournaments.find((t) => t.id === id);
  const league = tournament?.leagueId
    ? leagues.find((l) => l.id === tournament.leagueId)
    : null;

  // Get tournament players with their info
  const tournamentPlayers = tournament
    ? tournament.playerIds.map((playerId) => {
        // Try to find in league players first
        if (league) {
          const leaguePlayer = league.players.find((p) => p.id === playerId);
          if (leaguePlayer) {
            return {
              id: playerId,
              name: leaguePlayer.name,
              // FUTURE WORK: Implement account verification to check if player has an associated user account
              // This will require integration with the identity system to lookup user_id/anonymous_user_id mappings
              hasAccount: false,
            };
          }
        }
        // Fallback: just use the ID
        return {
          id: playerId,
          name: `Joueur ${playerId.slice(0, 8)}`,
          hasAccount: false,
        };
      })
    : [];

  useEffect(() => {
    // If tournament not found, redirect after a moment
    if (!isLoadingInitialData && !tournament) {
      setTimeout(() => {
        navigate("/");
      }, 3000);
    }
  }, [tournament, isLoadingInitialData, navigate]);

  const handleJoinAsExistingPlayer = async () => {
    if (!selectedPlayerId || !tournament) return;

    // Ensure user has an identity before joining
    const identity = await ensureIdentity();
    if (!identity) {
      // User cancelled identity creation
      return;
    }

    setIsJoining(true);
    try {
      addPlayerToTournament(tournament.id, selectedPlayerId);
      toast.success("Tu as rejoint le tournoi !");
      navigate(`/tournament/${tournament.id}`);
    } catch (error) {
      console.error("Error joining tournament:", error);
      toast.error("Erreur lors de la jonction au tournoi");
    } finally {
      setIsJoining(false);
    }
  };

  // Validate player name: min 1 char, max 100 chars
  const validatePlayerName = (name: string): string | null => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return "Le nom ne peut pas être vide";
    }
    if (trimmed.length > 100) {
      return "Le nom ne peut pas dépasser 100 caractères";
    }
    return null;
  };

  const handleCreateNewPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament) return;

    // Validate name
    const validationError = validatePlayerName(newPlayerName);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Ensure user has an identity before creating player
    const identity = await ensureIdentity();
    if (!identity) {
      // User cancelled identity creation
      return;
    }

    setIsJoining(true);
    try {
      // Add anonymous player to tournament (function handles identity creation)
      await addAnonymousPlayerToTournament(tournament.id, newPlayerName.trim());
      
      toast.success(`Tu as rejoint le tournoi "${tournament.name}" !`);
      navigate(`/tournament/${tournament.id}`);
    } catch (error) {
      console.error("Error creating player:", error);
      toast.error("Erreur lors de la création du joueur");
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoadingInitialData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Tournoi introuvable</h1>
          <p className="text-slate-400 mb-4">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="p-4 md:p-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Retour</span>
        </button>

        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            Rejoindre le tournoi
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            {tournament.name}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 pb-8">
        <div className="max-w-md mx-auto space-y-6">
          {/* Tournament Info */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-3">
              <Shield size={20} className="text-primary" />
              <h2 className="text-lg font-bold text-white">Informations</h2>
            </div>
            <div className="text-sm text-slate-300 space-y-2">
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {new Date(tournament.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              {league && (
                <p>
                  <span className="font-semibold">Ligue:</span> {league.name}
                </p>
              )}
              <p>
                <span className="font-semibold">Joueurs:</span> {tournamentPlayers.length}
              </p>
            </div>
          </div>

          {/* Join Options */}
          {!showCreatePlayer ? (
            <>
              {/* Existing Players */}
              {tournamentPlayers.length > 0 && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-4">
                    <Users size={20} className="text-primary" />
                    <h2 className="text-lg font-bold text-white">
                      Je suis un joueur existant
                    </h2>
                  </div>
                  <div className="space-y-2 mb-4">
                    {tournamentPlayers.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => setSelectedPlayerId(player.id)}
                        className={`w-full p-3 rounded-lg border transition-all text-left ${
                          selectedPlayerId === player.id
                            ? "bg-primary/20 border-primary text-white"
                            : "bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{player.name}</span>
                          {player.hasAccount && (
                            <LogIn size={16} className="text-slate-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedPlayerId && (
                    <button
                      onClick={handleJoinAsExistingPlayer}
                      disabled={isJoining}
                      className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isJoining ? "Rejoindre..." : "Rejoindre en tant que ce joueur"}
                    </button>
                  )}
                </div>
              )}

              {/* Create New Player */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <UserPlus size={20} className="text-accent" />
                  <h2 className="text-lg font-bold text-white">
                    Créer un nouveau joueur
                  </h2>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  Crée un nouveau joueur pour ce tournoi. Tu pourras associer ce joueur à ton compte plus tard.
                </p>
                <button
                  onClick={() => setShowCreatePlayer(true)}
                  className="w-full bg-accent hover:bg-accent/80 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  Créer un nouveau joueur
                </button>
              </div>
            </>
          ) : (
            /* Create Player Form */
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <UserPlus size={20} className="text-accent" />
                <h2 className="text-lg font-bold text-white">Nouveau joueur</h2>
              </div>
              <form onSubmit={handleCreateNewPlayer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nom du joueur
                  </label>
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Ton pseudo"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary text-base"
                    required
                    autoFocus
                    minLength={1}
                    maxLength={100}
                    autoComplete="name"
                  />
                  {newPlayerName.length > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      {newPlayerName.trim().length}/100 caractères
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreatePlayer(false);
                      setNewPlayerName("");
                    }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isJoining || !newPlayerName.trim() || newPlayerName.trim().length > 100}
                    className="flex-1 bg-accent hover:bg-accent/80 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg min-h-[44px]"
                  >
                    {isJoining ? "Rejoindre..." : "Rejoindre"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Just-in-time identity creation modal */}
      <CreateIdentityModal
        isOpen={showModal}
        onClose={handleCancel}
        onIdentityCreated={handleIdentityCreated}
      />
    </div>
  );
};

