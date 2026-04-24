import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { useRequireIdentity } from "../hooks/useRequireIdentity";
import { CreateIdentityModal } from "../components/CreateIdentityModal";
import { ContextualHeader } from "../components/navigation/ContextualHeader";
import { TournamentCard } from "../components/tournaments/TournamentCard";
import { PlayerCard } from "../components/design-system/PlayerCard";
import { HelpCard } from "../components/design-system/HelpCard";
import { PButton } from "../components/ponglo/PButton";
import { UserPlus, Users } from "lucide-react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import toast from "react-hot-toast";

export const TournamentJoin = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    tournaments,
    leagues,
    addPlayerToTournament,
    addAnonymousPlayerToTournament,
    isLoadingInitialData,
  } = useLeague();
  const { ensureIdentity, showModal, handleIdentityCreated, handleCancel } =
    useRequireIdentity();
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
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Tournoi introuvable
          </h1>
          <p className="text-cool-gray mb-4">Redirection en cours…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy">
      <ContextualHeader
        title={tournament.name}
        showBackButton={true}
        onBack={() => navigate("/")}
      />

      {/* Scrollable content — padded above sticky CTA */}
      <div className="px-4 md:px-6 pb-[120px]">
        <div className="max-w-md mx-auto space-y-4">
          <TournamentCard tournament={tournament} interactive={false} />

          {!showCreatePlayer ? (
            <>
              {tournamentPlayers.length > 0 && (
                <div className="bg-navy-soft rounded-card p-4 md:p-6 border border-card">
                  <div className="flex items-center gap-3 mb-3">
                    <Users size={18} className="text-electric-blue flex-shrink-0" />
                    <h2 className="font-archivo font-extrabold uppercase tracking-tight text-white text-sm">
                      Sélectionner un joueur existant
                    </h2>
                  </div>
                  <p className="text-sm text-cool-gray mb-4">
                    Clique sur ton nom pour rejoindre le tournoi.
                  </p>
                  <div className="space-y-2">
                    {tournamentPlayers.map((player) => (
                      <PlayerCard
                        key={player.id}
                        variant="compact"
                        name={player.name}
                        selected={selectedPlayerId === player.id}
                        onClick={() => setSelectedPlayerId(player.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-navy-soft rounded-card p-4 md:p-6 border border-card">
                <div className="flex items-center gap-3 mb-3">
                  <UserPlus size={18} className="text-electric-blue flex-shrink-0" />
                  <h2 className="font-archivo font-extrabold uppercase tracking-tight text-white text-sm">
                    Créer un nouveau joueur
                  </h2>
                </div>
                <p className="text-sm text-cool-gray">
                  Crée un nouveau joueur pour ce tournoi. Tu pourras associer ce
                  joueur à ton compte plus tard.
                </p>
              </div>
            </>
          ) : (
            <div className="bg-navy-soft rounded-card p-4 md:p-6 border border-card">
              <div className="flex items-center gap-3 mb-4">
                <UserPlus size={18} className="text-electric-blue flex-shrink-0" />
                <h2 className="font-archivo font-extrabold uppercase tracking-tight text-white text-sm">
                  Nouveau joueur
                </h2>
              </div>
              <form id="create-player-form" onSubmit={handleCreateNewPlayer} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-widest text-cool-gray mb-2">
                    Nom du joueur
                  </label>
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Ton pseudo"
                    className="w-full bg-navy border border-card rounded-input px-4 py-3 text-white placeholder-cool-gray/50 focus:outline-none focus:ring-2 focus:ring-lime/30 text-base"
                    required
                    autoFocus
                    minLength={1}
                    maxLength={100}
                    autoComplete="name"
                  />
                  {newPlayerName.length > 0 && (
                    <p className="text-xs text-cool-gray mt-1 font-mono">
                      {newPlayerName.trim().length}/100
                    </p>
                  )}
                </div>
              </form>
            </div>
          )}

          <HelpCard
            title="Comment ça marche ?"
            steps={[
              { number: 1, text: "Sélectionne un joueur existant ou crée un nouveau joueur" },
              { number: 2, text: "Tu rejoins le tournoi et accèdes au classement" },
              { number: 3, text: "Tu pourras associer ton joueur à ton compte plus tard" },
            ]}
            successMessage="C'est parti pour la compétition !"
          />
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed left-0 right-0 bottom-0 px-6 pt-4 pb-bottom-nav lg:pb-bottom-nav-lg bg-gradient-to-t from-navy via-navy/95 to-transparent">
        {showCreatePlayer ? (
          <div className="flex gap-3 max-w-md mx-auto">
            <PButton
              type="button"
              variant="ghost"
              size="lg"
              className="flex-1"
              onClick={() => { setShowCreatePlayer(false); setNewPlayerName(""); }}
            >
              Annuler
            </PButton>
            <PButton
              type="submit"
              form="create-player-form"
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={isJoining || !newPlayerName.trim() || newPlayerName.trim().length > 100}
            >
              {isJoining ? "Rejoindre…" : "Rejoindre"}
            </PButton>
          </div>
        ) : selectedPlayerId ? (
          <PButton
            variant="primary"
            size="lg"
            full
            onClick={handleJoinAsExistingPlayer}
            disabled={isJoining}
          >
            {isJoining ? "Rejoindre…" : "Rejoindre en tant que ce joueur"}
          </PButton>
        ) : (
          <PButton
            variant="primary"
            size="lg"
            full
            onClick={() => setShowCreatePlayer(true)}
          >
            Créer un nouveau joueur
          </PButton>
        )}
      </div>

      <CreateIdentityModal
        isOpen={showModal}
        onClose={handleCancel}
        onIdentityCreated={handleIdentityCreated}
      />
    </div>
  );
};
