import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { useRequireIdentity } from "../hooks/useRequireIdentity";
import { CreateIdentityModal } from "../components/CreateIdentityModal";
import { ContextualHeader } from "../components/navigation/ContextualHeader";
import { PlayerCard } from "../components/design-system/PlayerCard";
import { HelpCard } from "../components/design-system/HelpCard";
import { PButton } from "../components/ponglo/PButton";
import { UserPlus, Users, Trophy } from "lucide-react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import toast from "react-hot-toast";

/**
 * LeagueJoin — Mirror of TournamentJoin for leagues (mig 016).
 *
 * Reached via:
 *   - `/join` → useJoinTournament resolves a code to a league → navigate here.
 *   - QR / share link → direct landing on `/league/:id/join`.
 *
 * PR2 scope: parity skeleton. Existing-player selection navigates straight to
 * the dashboard (no claim yet). New-player creation goes through `addPlayer`.
 *
 * PR3 will wire the IdentityGateSheet + ClaimGuestSheet on top: existing
 * ghosts will be offered as "Êtes-vous ce joueur ?" instead of just listing.
 */
export const LeagueJoin = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { leagues, addPlayer, isLoadingInitialData } = useLeague();
  const { ensureIdentity, showModal, handleIdentityCreated, handleCancel } =
    useRequireIdentity();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [showCreatePlayer, setShowCreatePlayer] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const league = leagues.find((l) => l.id === id);

  useEffect(() => {
    if (!isLoadingInitialData && !league) {
      const t = setTimeout(() => navigate("/"), 3000);
      return () => clearTimeout(t);
    }
  }, [league, isLoadingInitialData, navigate]);

  const handleJoinAsExistingPlayer = async () => {
    if (!selectedPlayerId || !league) return;

    const identity = await ensureIdentity();
    if (!identity) return;

    setIsJoining(true);
    try {
      // PR2: no claim yet, just land on the dashboard. PR3 will replace this
      // with a ClaimGuestSheet that calls claim_anonymous_player(_anon).
      toast.success("Tu as rejoint la ligue !");
      navigate(`/league/${league.id}`);
    } catch (error) {
      console.error("Error joining league:", error);
      toast.error("Erreur lors de la jonction à la ligue");
    } finally {
      setIsJoining(false);
    }
  };

  const validatePlayerName = (name: string): string | null => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return "Le nom ne peut pas être vide";
    if (trimmed.length > 100) return "Le nom ne peut pas dépasser 100 caractères";
    return null;
  };

  const handleCreateNewPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!league) return;

    const validationError = validatePlayerName(newPlayerName);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const identity = await ensureIdentity();
    if (!identity) return;

    setIsJoining(true);
    try {
      await addPlayer(league.id, newPlayerName.trim());
      toast.success(`Tu as rejoint la ligue "${league.name}" !`);
      navigate(`/league/${league.id}`);
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

  if (!league) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Ligue introuvable
          </h1>
          <p className="text-cool-gray mb-4">Redirection en cours…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy">
      <ContextualHeader
        title={league.name}
        showBackButton={true}
        onBack={() => navigate("/")}
      />

      <div className="px-4 md:px-6 pb-[120px]">
        <div className="max-w-md mx-auto space-y-4">
          {/* Lightweight league summary card — keeps parity with TournamentCard
              on TournamentJoin without pulling in the heavy tournament card. */}
          <div className="bg-navy-soft rounded-card p-4 border border-card flex items-center gap-3">
            <Trophy size={20} className="text-electric-blue flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-archivo font-extrabold uppercase tracking-tight text-white text-sm truncate">
                {league.name}
              </div>
              <div className="text-xs text-cool-gray font-mono uppercase tracking-widest">
                {league.type === "season" ? "Championnat par saison" : "Ligue continue"}
                {" · "}
                {league.players.length} joueur{league.players.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {!showCreatePlayer ? (
            <>
              {league.players.length > 0 && (
                <div className="bg-navy-soft rounded-card p-4 md:p-6 border border-card">
                  <div className="flex items-center gap-3 mb-3">
                    <Users size={18} className="text-electric-blue flex-shrink-0" />
                    <h2 className="font-archivo font-extrabold uppercase tracking-tight text-white text-sm">
                      Sélectionner un joueur existant
                    </h2>
                  </div>
                  <p className="text-sm text-cool-gray mb-4">
                    Clique sur ton nom pour rejoindre la ligue.
                  </p>
                  <div className="space-y-2">
                    {league.players.map((player) => (
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
                  Crée un nouveau joueur pour cette ligue. Tu pourras associer ce
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
              <form id="create-league-player-form" onSubmit={handleCreateNewPlayer} className="space-y-4">
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
              { number: 2, text: "Tu rejoins la ligue et accèdes au classement" },
              { number: 3, text: "Tu pourras associer ton joueur à ton compte plus tard" },
            ]}
            successMessage="C'est parti pour la compétition !"
          />
        </div>
      </div>

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
              form="create-league-player-form"
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
