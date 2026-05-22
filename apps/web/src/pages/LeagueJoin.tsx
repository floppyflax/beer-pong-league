import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { useAuthContext } from "../context/AuthContext";
import { useIdentityContext } from "../context/IdentityContext";
import { useRequireIdentity } from "../hooks/useRequireIdentity";
import { useUnclaimedGuests } from "../hooks/useUnclaimedGuests";
import { CreateIdentityModal } from "../components/CreateIdentityModal";
import { AuthModal } from "../components/AuthModal";
import { ContextualHeader } from "../components/navigation/ContextualHeader";
import { PlayerCard } from "../components/design-system/PlayerCard";
import { HelpCard } from "../components/design-system/HelpCard";
import { ClaimGuestSheet } from "../components/design-system/ClaimGuestSheet";
import {
  IdentityGateSheet,
  type IdentityGateChoice,
} from "../components/design-system/IdentityGateSheet";
import { PButton } from "../components/ponglo/PButton";
import { UserPlus, Users, Trophy } from "lucide-react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { identityMergeService } from "../services/IdentityMergeService";
import toast from "react-hot-toast";

/**
 * LeagueJoin — mirror of EventJoin for leagues (mig 016 + PR3 wiring).
 *
 * Same 4-step sequence as the event page (token short-circuit →
 * IdentityGateSheet → ClaimGuestSheet → default UI). Kept as a separate file
 * for now so each context keeps its own copy strings ("ligue" vs "tournoi")
 * and dataset (leagues + league_players); a refactor into a shared
 * `<JoinFlow kind={...} />` is left for after PR3 stabilises.
 */
export const LeagueJoin = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { leagues, addPlayer, isLoadingInitialData, reloadData } = useLeague();
  const { user, isAuthenticated } = useAuthContext();
  const { localUser, initializeAnonymousUser } = useIdentityContext();
  const { ensureIdentity, showModal, handleIdentityCreated, handleCancel } =
    useRequireIdentity();

  // ---- Local UI state ----
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [showCreatePlayer, setShowCreatePlayer] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // ---- Identity-gate state ----
  const [gateDecided, setGateDecided] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ---- Claim-sheet state ----
  // The claim proposal ("Es-tu l'un de ces joueurs ?") is shown FIRST, before
  // the identity gate — a joiner sees existing players before being asked for
  // a name. `claimDecided` flips after a claim or "aucun n'est moi".
  const [claimDecided, setClaimDecided] = useState(false);

  // ---- Token (?ghost=TOKEN) state ----
  const ghostPlayerId = searchParams.get("ghost");
  const [tokenProcessed, setTokenProcessed] = useState(false);

  const league = leagues.find((l) => l.id === id);

  const currentPseudo = useMemo<string | null>(() => {
    if (isAuthenticated && user) {
      const meta = user.user_metadata as { pseudo?: string } | undefined;
      return meta?.pseudo ?? user.email ?? null;
    }
    if (localUser) return localUser.pseudo ?? null;
    return null;
  }, [isAuthenticated, user, localUser]);

  // Unclaimed ghosts in this league — for both auth + anon (mode "any").
  const {
    guests: unclaimedGuests,
    refresh: refreshGuests,
    isLoading: guestsLoading,
  } = useUnclaimedGuests("league", league?.id ?? null, { mode: "any" });

  // "Sélectionner un joueur existant" = unclaimed ghosts. Picking one claims it
  // (same path as the ClaimGuestSheet). Listing already-claimed league players
  // here would be a dead end — the claim refuses them server-side.
  const claimablePlayers = unclaimedGuests.map((g) => ({
    id: g.playerId,
    name: g.pseudo,
  }));

  // ---- Effects ----

  useEffect(() => {
    if (!isLoadingInitialData && !league) {
      const t = setTimeout(() => navigate("/"), 3000);
      return () => clearTimeout(t);
    }
  }, [league, isLoadingInitialData, navigate]);

  // Token short-circuit: claim and bounce to the dashboard.
  useEffect(() => {
    if (!ghostPlayerId || tokenProcessed || !league) return;
    setTokenProcessed(true);

    (async () => {
      const identity = await ensureIdentity();
      if (!identity) return;
      const caller =
        identity.type === "authenticated"
          ? { userId: (identity.user as { id: string }).id }
          : {
              anonymousUserId: (identity.user as { anonymousUserId: string })
                .anonymousUserId,
            };

      const result = await identityMergeService.claimPlayerById(
        ghostPlayerId,
        caller,
      );

      const next = new URLSearchParams(searchParams);
      next.delete("ghost");
      setSearchParams(next, { replace: true });

      if (!result.success) {
        toast.error(result.error ?? "Lien d'invitation invalide");
        return;
      }

      // Refresh context so the dashboard finds the league we just joined
      // (otherwise it renders "Ligue introuvable" and the user loops back).
      await reloadData();
      toast.success(`Bienvenue dans ${league.name} !`);
      navigate(`/league/${league.id}`);
    })();
  }, [
    ghostPlayerId,
    tokenProcessed,
    league,
    ensureIdentity,
    navigate,
    searchParams,
    setSearchParams,
    reloadData,
  ]);

  // ---- Handlers ----

  const handleGateChoice = async (choice: IdentityGateChoice) => {
    if (choice === "continue") {
      setGateDecided(true);
      return;
    }
    if (choice === "auth") {
      setShowAuthModal(true);
      return;
    }
    const identity = await ensureIdentity();
    if (identity) setGateDecided(true);
  };

  const handleClaimGuest = async (playerId: string) => {
    if (!league) return;
    const guest = unclaimedGuests.find((g) => g.playerId === playerId);
    if (!guest) return;

    const identity = await ensureIdentity();
    if (!identity) return;

    let result;
    if (identity.type === "authenticated") {
      result = await identityMergeService.claimAnonymousPlayer(
        "league",
        playerId,
        (identity.user as { id: string }).id,
      );
    } else {
      result = await identityMergeService.claimAnonymousPlayerAsAnonymous(
        "league",
        playerId,
        (identity.user as { anonymousUserId: string }).anonymousUserId,
      );
    }

    if (!result.success) {
      toast.error(result.error ?? "Réclamation impossible");
      return;
    }

    setClaimDecided(true);
    await reloadData();
    toast.success(`Tu es maintenant ${guest.pseudo} dans ${league.name} !`);
    navigate(`/league/${league.id}`);
  };

  const handleDismissClaim = () => {
    setClaimDecided(true);
    refreshGuests();
  };

  const handleJoinAsExistingPlayer = async () => {
    if (!selectedPlayerId) return;
    // The selected row is an unclaimed ghost — claim it (same path as the
    // ClaimGuestSheet). handleClaimGuest handles identity, toast and routing.
    setIsJoining(true);
    try {
      await handleClaimGuest(selectedPlayerId);
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
      await reloadData();
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

  // ClaimGuestSheet first (existing players), then the identity gate. Wait for
  // the ghost list to load so the gate doesn't flash before the proposal.
  const inGhostFlow = !!ghostPlayerId || tokenProcessed;
  const guestsReady = !guestsLoading;
  const showClaimSheet =
    !inGhostFlow &&
    !claimDecided &&
    guestsReady &&
    unclaimedGuests.length > 0 &&
    !showAuthModal &&
    !showModal;
  const showGateSheet =
    !inGhostFlow &&
    !gateDecided &&
    !showClaimSheet &&
    guestsReady &&
    (claimDecided || unclaimedGuests.length === 0);

  return (
    <div className="min-h-screen bg-navy">
      <ContextualHeader
        title={league.name}
        showBackButton={true}
        onBack={() => navigate("/")}
      />

      <div className="px-4 md:px-6 pb-[120px]">
        <div className="max-w-md mx-auto space-y-4">
          {/* Lightweight league summary card */}
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
              {claimablePlayers.length > 0 && (
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
                    {claimablePlayers.map((player) => (
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

      {/* --- Sheets / modals --- */}

      <IdentityGateSheet
        isOpen={showGateSheet}
        onClose={() => setGateDecided(true)}
        onChoose={handleGateChoice}
        currentPseudo={currentPseudo}
      />

      <ClaimGuestSheet
        isOpen={showClaimSheet}
        onClose={handleDismissClaim}
        guests={unclaimedGuests}
        onClaim={handleClaimGuest}
        onDismissAll={handleDismissClaim}
        title="Êtes-vous une de ces personnes ?"
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          setGateDecided(true);
        }}
      />

      <CreateIdentityModal
        isOpen={showModal}
        onClose={handleCancel}
        onIdentityCreated={(u) => {
          handleIdentityCreated(u);
          setGateDecided(true);
          initializeAnonymousUser().catch(() => {});
        }}
      />
    </div>
  );
};
