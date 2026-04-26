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
import { EventCard } from "../components/events/EventCard";
import { PlayerCard } from "../components/design-system/PlayerCard";
import { HelpCard } from "../components/design-system/HelpCard";
import { ClaimGuestSheet } from "../components/design-system/ClaimGuestSheet";
import {
  IdentityGateSheet,
  type IdentityGateChoice,
} from "../components/design-system/IdentityGateSheet";
import { PButton } from "../components/ponglo/PButton";
import { UserPlus, Users } from "lucide-react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { identityMergeService } from "../services/IdentityMergeService";
import { databaseService } from "../services/DatabaseService";
import type { Event } from "../types";
import toast from "react-hot-toast";

/**
 * EventJoin — full join flow.
 *
 * Sequence on mount:
 *   1. **`?ghost=TOKEN` short-circuit** — if the URL carries a ghost invite
 *      token (admin-shared link), we ensure an identity then run the
 *      `claim_ghost_by_token` RPC and route straight to the dashboard.
 *   2. **IdentityGateSheet** — first visit, no identity choice yet → ask the
 *      user to pick: continue-as-X / connect-by-email / play-anonymous.
 *   3. **ClaimGuestSheet** — once identity is settled, show unclaimed ghost
 *      players for this event so the user can adopt one ("c'est moi")
 *      instead of duplicating themselves.
 *   4. **Default UI** — pick an existing event_player OR create a new
 *      participant; same as before PR3.
 *
 * The page is intentionally not a state-machine — each modal/sheet is
 * conditioned on simple boolean state. We rely on the user's explicit choice
 * to advance, and never auto-route them out of the flow.
 */
export const EventJoin = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    events,
    leagues,
    addPlayerToEvent,
    addAnonymousPlayerToEvent,
    isLoadingInitialData,
  } = useLeague();
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
  // `gateDecided` flips the first time the user makes a choice (or has been
  // pre-resolved by an existing identity continuation). We don't persist it —
  // re-mounting the route re-asks, which is the right UX for shared devices.
  const [gateDecided, setGateDecided] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ---- Claim-sheet state ----
  const [showClaimSheet, setShowClaimSheet] = useState(false);
  const [claimDismissed, setClaimDismissed] = useState(false);

  // ---- Ghost-targeted invite shortcut (?ghost=<player_id>) ----
  // Mig 022 dropped the signed-token mechanism in favor of passing the
  // players.id directly. claim_player (auth) / direct UPDATE (anon) refuses
  // if the player is already claimed, so the worst case is "lien expiré".
  // We consume the param ONCE per mount to avoid double-fire on re-render.
  const ghostPlayerId = searchParams.get("ghost");
  const [tokenProcessed, setTokenProcessed] = useState(false);

  // `events` from context only contains events the user belongs to.
  // For a fresh joiner landing via shared link / QR, we fall back to a
  // direct fetch by id (RLS allows public reads on events).
  const [fetchedEvent, setFetchedEvent] = useState<Event | null>(
    null,
  );
  const [eventFetchAttempted, setEventFetchAttempted] =
    useState(false);
  const event =
    events.find((t) => t.id === id) ??
    (fetchedEvent?.id === id ? fetchedEvent : null);
  const league = event?.leagueId
    ? leagues.find((l) => l.id === event.leagueId)
    : null;

  // Pseudo to display in the "Continuer en tant que X" CTA.
  const currentPseudo = useMemo<string | null>(() => {
    if (isAuthenticated && user) {
      const meta = user.user_metadata as { pseudo?: string } | undefined;
      return meta?.pseudo ?? user.email ?? null;
    }
    if (localUser) return localUser.pseudo ?? null;
    return null;
  }, [isAuthenticated, user, localUser]);

  // Get event players with their info (existing logic, unchanged).
  const eventPlayers = event
    ? event.playerIds.map((playerId) => {
        if (league) {
          const leaguePlayer = league.players.find((p) => p.id === playerId);
          if (leaguePlayer) {
            return {
              id: playerId,
              name: leaguePlayer.name,
              hasAccount: false,
            };
          }
        }
        return {
          id: playerId,
          name: `Joueur ${playerId.slice(0, 8)}`,
          hasAccount: false,
        };
      })
    : [];

  // Unclaimed ghosts in this event — shown to BOTH auth + anon users
  // (mode "any"); the claim RPC chooses the right backend on submit.
  const { guests: unclaimedGuests, refresh: refreshGuests } = useUnclaimedGuests(
    "event",
    event?.id ?? null,
    { mode: "any" },
  );

  // ---- Effects ----

  // If the event isn't in the user's local list (typical for a first-time
  // joiner), fetch it directly by id before giving up.
  useEffect(() => {
    if (isLoadingInitialData || !id || event || eventFetchAttempted) {
      return;
    }
    setEventFetchAttempted(true);
    databaseService
      .loadEventById(id)
      .then((t) => setFetchedEvent(t))
      .catch(() => setFetchedEvent(null));
  }, [id, event, isLoadingInitialData, eventFetchAttempted]);

  // Event not found → redirect after a beat.
  useEffect(() => {
    if (!isLoadingInitialData && eventFetchAttempted && !event) {
      const t = setTimeout(() => navigate("/"), 3000);
      return () => clearTimeout(t);
    }
  }, [event, isLoadingInitialData, eventFetchAttempted, navigate]);

  // Ghost-targeted shortcut: claim the player_id from the URL and bounce.
  useEffect(() => {
    if (!ghostPlayerId || tokenProcessed || !event) return;
    setTokenProcessed(true);

    (async () => {
      const identity = await ensureIdentity();
      if (!identity) return; // user cancelled the identity modal
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

      // Always wipe the param from the URL so refresh doesn't replay it.
      const next = new URLSearchParams(searchParams);
      next.delete("ghost");
      setSearchParams(next, { replace: true });

      if (!result.success) {
        toast.error(result.error ?? "Lien d'invitation invalide");
        // Stay on the join page so the user can pick another path.
        return;
      }

      toast.success(`Bienvenue dans ${event.name} !`);
      navigate(`/event/${event.id}`);
    })();
  }, [
    ghostPlayerId,
    tokenProcessed,
    event,
    ensureIdentity,
    navigate,
    searchParams,
    setSearchParams,
  ]);

  // After identity gate is resolved AND there are unclaimed ghosts, surface
  // the claim sheet automatically (once per session per dismiss).
  useEffect(() => {
    if (!gateDecided || claimDismissed) return;
    if (unclaimedGuests.length === 0) return;
    if (showAuthModal || showModal) return; // don't stack sheets
    setShowClaimSheet(true);
  }, [
    gateDecided,
    claimDismissed,
    unclaimedGuests.length,
    showAuthModal,
    showModal,
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
    // "anonymous" — ensure we have a localUser; CreateIdentityModal will appear
    // if needed via useRequireIdentity.
    const identity = await ensureIdentity();
    if (identity) setGateDecided(true);
  };

  const handleClaimGuest = async (playerId: string) => {
    if (!event) return;
    const guest = unclaimedGuests.find((g) => g.playerId === playerId);
    if (!guest) return;

    const identity = await ensureIdentity();
    if (!identity) return;

    let result;
    if (identity.type === "authenticated") {
      result = await identityMergeService.claimAnonymousPlayer(
        "event",
        playerId,
        (identity.user as { id: string }).id,
      );
    } else {
      result = await identityMergeService.claimAnonymousPlayerAsAnonymous(
        "event",
        playerId,
        (identity.user as { anonymousUserId: string }).anonymousUserId,
      );
    }

    if (!result.success) {
      toast.error(result.error ?? "Réclamation impossible");
      return;
    }

    toast.success(`Tu es maintenant ${guest.pseudo} dans ${event.name} !`);
    setShowClaimSheet(false);
    navigate(`/event/${event.id}`);
  };

  const handleDismissClaim = () => {
    setShowClaimSheet(false);
    setClaimDismissed(true);
    // Trigger a refresh in case other tabs changed the list (cheap).
    refreshGuests();
  };

  const handleJoinAsExistingPlayer = async () => {
    if (!selectedPlayerId || !event) return;
    const identity = await ensureIdentity();
    if (!identity) return;

    setIsJoining(true);
    try {
      addPlayerToEvent(event.id, selectedPlayerId);
      toast.success("Tu as rejoint l'événement !");
      navigate(`/event/${event.id}`);
    } catch (error) {
      console.error("Error joining event:", error);
      toast.error("Erreur lors de la jonction à l'événement");
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
    if (!event) return;

    const validationError = validatePlayerName(newPlayerName);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const identity = await ensureIdentity();
    if (!identity) return;

    setIsJoining(true);
    try {
      await addAnonymousPlayerToEvent(event.id, newPlayerName.trim());
      toast.success(`Tu as rejoint l'événement "${event.name}" !`);
      navigate(`/event/${event.id}`);
    } catch (error) {
      console.error("Error creating player:", error);
      toast.error("Erreur lors de la création du joueur");
    } finally {
      setIsJoining(false);
    }
  };

  // ---- Render guards ----

  if (isLoadingInitialData || (!event && !eventFetchAttempted)) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Événement introuvable
          </h1>
          <p className="text-cool-gray mb-4">Redirection en cours…</p>
        </div>
      </div>
    );
  }

  // Show the gate sheet on first visit, unless we're processing a ghost
  // shortcut (which has its own flow).
  const showGateSheet = !gateDecided && !ghostPlayerId && !tokenProcessed;

  return (
    <div className="min-h-screen bg-navy">
      <ContextualHeader
        title={event.name}
        showBackButton={true}
        onBack={() => navigate("/")}
      />

      {/* Scrollable content — padded above sticky CTA */}
      <div className="px-4 md:px-6 pb-[120px]">
        <div className="max-w-md mx-auto space-y-4">
          <EventCard event={event} interactive={false} />

          {!showCreatePlayer ? (
            <>
              {eventPlayers.length > 0 && (
                <div className="bg-navy-soft rounded-card p-4 md:p-6 border border-card">
                  <div className="flex items-center gap-3 mb-3">
                    <Users size={18} className="text-electric-blue flex-shrink-0" />
                    <h2 className="font-archivo font-extrabold uppercase tracking-tight text-white text-sm">
                      Sélectionner un joueur existant
                    </h2>
                  </div>
                  <p className="text-sm text-cool-gray mb-4">
                    Clique sur ton nom pour rejoindre l'événement.
                  </p>
                  <div className="space-y-2">
                    {eventPlayers.map((player) => (
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
                  Crée un nouveau joueur pour cet événement. Tu pourras associer ce
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
              { number: 2, text: "Tu rejoins l'événement et accèdes au classement" },
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
          // After creating an anon identity, also flip the gate so we don't
          // re-show it.
          setGateDecided(true);
          // Auto-init anon user in DB if needed (mirrors useJoinEvent).
          initializeAnonymousUser().catch(() => {});
        }}
      />
    </div>
  );
};
