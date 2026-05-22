import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { useAuthContext } from "../context/AuthContext";
import { useIdentityContext } from "../context/IdentityContext";
import { useUnclaimedGuests } from "../hooks/useUnclaimedGuests";
import type { UnclaimedGuest } from "../hooks/useUnclaimedGuests";
import { AuthModal } from "../components/AuthModal";
import { ContextualHeader } from "../components/navigation/ContextualHeader";
import { EventCard } from "../components/events/EventCard";
import { HelpCard } from "../components/design-system/HelpCard";
import { ClaimGuestSheet } from "../components/design-system/ClaimGuestSheet";
import {
  IdentityGateSheet,
  type IdentityGateChoice,
} from "../components/design-system/IdentityGateSheet";
import { JoinNameSheet } from "../components/design-system/JoinNameSheet";
import { PButton } from "../components/ponglo/PButton";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { identityMergeService } from "../services/IdentityMergeService";
import { databaseService } from "../services/DatabaseService";
import type { Event } from "../types";
import toast from "react-hot-toast";

/**
 * EventJoin — join flow as an explicit step machine.
 *
 *   gate → (claim → confirm-name) | create-name → dashboard
 *
 *   1. **IdentityGateSheet** — first: create an account OR play without one.
 *      The anonymous path creates the identity silently (placeholder pseudo) —
 *      we do NOT ask for a name here; the real name comes last.
 *   2. **ClaimGuestSheet** — show the existing participants. Pick one ("C'est
 *      moi") or "Je ne suis pas dans la liste".
 *   3a. **JoinNameSheet (confirm)** — after claiming, keep or modify the
 *       claimed player's name, then land on the dashboard.
 *   3b. **JoinNameSheet (create)** — not in the list → pick a pseudo for the
 *       new player, then land on the dashboard.
 *
 *   `?ghost=<players.id>` short-circuit (admin-shared link) bypasses the steps:
 *   it ensures an identity, claims the player and routes to the dashboard.
 */
type Step = "gate" | "postgate" | "claim" | "confirm" | "create" | "idle";

export const EventJoin = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { events, addAnonymousPlayerToEvent, isLoadingInitialData, reloadData } =
    useLeague();
  const { user, isAuthenticated } = useAuthContext();
  const { localUser, initializeAnonymousUser } = useIdentityContext();

  // ---- Ghost-targeted invite shortcut (?ghost=<players.id>) ----
  const ghostPlayerId = searchParams.get("ghost");
  const [tokenProcessed, setTokenProcessed] = useState(false);

  // ---- Step machine ----
  const [step, setStep] = useState<Step>(ghostPlayerId ? "idle" : "gate");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [claimedGuest, setClaimedGuest] = useState<UnclaimedGuest | null>(null);
  const [claimDismissed, setClaimDismissed] = useState(false);

  // `events` from context only contains events the user belongs to. For a fresh
  // joiner landing via shared link / QR, fall back to a direct fetch by id.
  const [fetchedEvent, setFetchedEvent] = useState<Event | null>(null);
  const [eventFetchAttempted, setEventFetchAttempted] = useState(false);
  const event =
    events.find((t) => t.id === id) ??
    (fetchedEvent?.id === id ? fetchedEvent : null);

  const currentPseudo = useMemo<string | null>(() => {
    if (isAuthenticated && user) {
      const meta = user.user_metadata as { pseudo?: string } | undefined;
      return meta?.pseudo ?? user.email ?? null;
    }
    if (localUser) return localUser.pseudo ?? null;
    return null;
  }, [isAuthenticated, user, localUser]);

  // Unclaimed ghosts in this event — for BOTH auth + anon (mode "any").
  const {
    guests: unclaimedGuests,
    refresh: refreshGuests,
    isLoading: guestsLoading,
  } = useUnclaimedGuests("event", event?.id ?? null, { mode: "any" });
  const guestsReady = !guestsLoading;

  // Does the current identity ALREADY own a player? If so, joining a NEW
  // context means adding THAT player (1 user = 1 player) — we never offer
  // "create a new player", just "rejoindre en tant que moi".
  const resolvedUid =
    isAuthenticated && user ? user.id : localUser?.anonymousUserId ?? null;
  const [hasOwnPlayer, setHasOwnPlayer] = useState<boolean | null>(null);
  useEffect(() => {
    if (!resolvedUid) {
      setHasOwnPlayer(false);
      return;
    }
    let alive = true;
    identityMergeService
      .userOwnsPlayer(resolvedUid)
      .then((owns) => alive && setHasOwnPlayer(owns))
      .catch(() => alive && setHasOwnPlayer(false));
    return () => {
      alive = false;
    };
  }, [resolvedUid]);

  // ---- Effects ----

  useEffect(() => {
    if (isLoadingInitialData || !id || event || eventFetchAttempted) return;
    setEventFetchAttempted(true);
    databaseService
      .loadEventById(id)
      .then((t) => setFetchedEvent(t))
      .catch(() => setFetchedEvent(null));
  }, [id, event, isLoadingInitialData, eventFetchAttempted]);

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
      let caller: { userId?: string; anonymousUserId?: string };
      if (isAuthenticated && user) {
        caller = { userId: user.id };
      } else {
        const lu = localUser ?? (await initializeAnonymousUser());
        caller = { anonymousUserId: lu.anonymousUserId };
      }

      const result = await identityMergeService.claimPlayerById(
        ghostPlayerId,
        caller,
      );

      const next = new URLSearchParams(searchParams);
      next.delete("ghost");
      setSearchParams(next, { replace: true });

      if (!result.success) {
        toast.error(result.error ?? "Lien d'invitation invalide");
        // Fall back to the normal flow so the user can pick another path.
        setStep("gate");
        return;
      }

      await reloadData();
      toast.success(`Bienvenue dans ${event.name} !`);
      navigate(`/event/${event.id}`);
    })();
  }, [
    ghostPlayerId,
    tokenProcessed,
    event,
    isAuthenticated,
    user,
    localUser,
    initializeAnonymousUser,
    navigate,
    searchParams,
    setSearchParams,
    reloadData,
  ]);

  // After the gate, branch to the participants modal (if any) or straight to
  // the name step. We wait for the ghost list to load first.
  useEffect(() => {
    if (step !== "postgate" || !guestsReady) return;
    setStep(
      unclaimedGuests.length > 0 && !claimDismissed ? "claim" : "create",
    );
  }, [step, guestsReady, unclaimedGuests.length, claimDismissed]);

  // ---- Handlers ----

  const handleGateChoice = async (choice: IdentityGateChoice) => {
    if (choice === "auth") {
      // OTP magic-link leaves the app; persist the join URL so AuthCallback
      // brings the user back HERE (authenticated) to finish joining, instead
      // of dropping them on "/". localStorage (not sessionStorage) because the
      // magic link often opens in a NEW tab, which doesn't share sessionStorage.
      localStorage.setItem(
        "authReturnTo",
        window.location.pathname + window.location.search,
      );
      setShowAuthModal(true);
      return;
    }
    // "anonymous" → create a silent anonymous identity (placeholder pseudo, the
    // real name is asked at the last step). "continue" → identity already set.
    if (choice === "anonymous") await initializeAnonymousUser();
    setStep("postgate");
  };

  const handleClaimGuest = async (membershipId: string) => {
    if (!event) return;
    const guest = unclaimedGuests.find((g) => g.playerId === membershipId);
    if (!guest) return;

    let result;
    if (isAuthenticated && user) {
      result = await identityMergeService.claimAnonymousPlayer(
        "event",
        membershipId,
        user.id,
      );
    } else {
      const lu = localUser ?? (await initializeAnonymousUser());
      result = await identityMergeService.claimAnonymousPlayerAsAnonymous(
        "event",
        membershipId,
        lu.anonymousUserId,
      );
    }

    if (!result.success) {
      toast.error(result.error ?? "Réclamation impossible");
      return;
    }

    // Claimed — now offer to keep or modify the name.
    setClaimedGuest(guest);
    setStep("confirm");
  };

  const handleDismissClaim = () => {
    setClaimDismissed(true);
    refreshGuests();
    setStep("create");
  };

  // Final step after a claim: keep or modify the claimed player's name.
  const finalizeClaim = async (name: string) => {
    if (!event || !claimedGuest) return;
    const trimmed = name.trim();
    if (trimmed && trimmed !== claimedGuest.pseudo) {
      const r = await identityMergeService.renameAnonymousPlayer(
        "event",
        claimedGuest.playerId,
        trimmed,
      );
      if (!r.success) {
        toast.error(r.error ?? "Renommage impossible");
        return;
      }
    }
    await reloadData();
    toast.success(`Bienvenue dans ${event.name} !`);
    navigate(`/event/${event.id}`);
  };

  // Final step for a brand-new player (not in the list).
  const finalizeCreate = async (name: string) => {
    if (!event) return;
    await addAnonymousPlayerToEvent(event.id, name.trim());
    await reloadData();
    toast.success(`Tu as rejoint l'événement "${event.name}" !`);
    navigate(`/event/${event.id}`);
  };

  // Identified user who already owns a player → join with THAT player (no
  // "create new player"). addAnonymousPlayerToEvent reuses the caller's player
  // (1 user = 1 player), so the name is irrelevant — pass the current pseudo.
  const [joiningExisting, setJoiningExisting] = useState(false);
  const finalizeJoinAsExisting = useCallback(async () => {
    if (!event || joiningExisting) return;
    setJoiningExisting(true);
    try {
      await addAnonymousPlayerToEvent(event.id, currentPseudo ?? "Joueur");
      await reloadData();
      toast.success(`Bienvenue dans ${event.name} !`);
      navigate(`/event/${event.id}`);
    } catch {
      setJoiningExisting(false);
      toast.error("Erreur lors de la jonction à l'événement");
    }
  }, [event, joiningExisting, addAnonymousPlayerToEvent, currentPseudo, reloadData, navigate]);

  // Auto-join as the existing player when an identified user reaches the
  // "create" step (no ghost claimed / not in the list) — no name prompt.
  useEffect(() => {
    if (step === "create" && hasOwnPlayer === true) {
      void finalizeJoinAsExisting();
    }
  }, [step, hasOwnPlayer, finalizeJoinAsExisting]);

  const handleResume = () => {
    if (claimedGuest) setStep("confirm");
    else if (guestsReady && unclaimedGuests.length > 0 && !claimDismissed)
      setStep("claim");
    else setStep("create");
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

  const processingGhost = !!ghostPlayerId && !tokenProcessed;

  return (
    <div className="min-h-screen bg-navy">
      <ContextualHeader
        title={event.name}
        showBackButton={true}
        onBack={() => navigate("/")}
      />

      <div className="px-4 md:px-6 pb-[120px]">
        <div className="max-w-md mx-auto space-y-4">
          <EventCard event={event} interactive={false} />
          <HelpCard
            title="Comment ça marche ?"
            steps={[
              { number: 1, text: "Crée un compte ou rejoins sans compte" },
              { number: 2, text: "Dis-nous si tu es l'un des joueurs déjà ajoutés" },
              { number: 3, text: "Choisis ton nom et accède au classement" },
            ]}
            successMessage="C'est parti pour la compétition !"
          />
        </div>
      </div>

      {/* Sticky CTA — resumes the flow if the user closed the sheets. */}
      {step === "idle" && !processingGhost && (
        <div className="fixed left-0 right-0 bottom-0 px-6 pt-4 pb-bottom-nav lg:pb-bottom-nav-lg bg-gradient-to-t from-navy via-navy/95 to-transparent">
          <PButton variant="primary" size="lg" full onClick={handleResume}>
            Rejoindre l'événement
          </PButton>
        </div>
      )}

      {/* --- Sheets / modals --- */}

      <IdentityGateSheet
        isOpen={step === "gate" && !processingGhost}
        onClose={() => setStep("idle")}
        onChoose={handleGateChoice}
        currentPseudo={currentPseudo}
      />

      <ClaimGuestSheet
        isOpen={step === "claim"}
        onClose={handleDismissClaim}
        guests={unclaimedGuests}
        onClaim={handleClaimGuest}
        onDismissAll={handleDismissClaim}
        title="Êtes-vous une de ces personnes ?"
        dismissLabel={hasOwnPlayer ? "Rejoindre en tant que moi" : undefined}
      />

      <JoinNameSheet
        isOpen={step === "confirm"}
        mode="confirm"
        initialName={claimedGuest?.pseudo ?? ""}
        contextName={event.name}
        onClose={() => finalizeClaim(claimedGuest?.pseudo ?? "")}
        onSubmit={finalizeClaim}
      />

      {/* "Create new player" name step — only for identities that DON'T already
          own a player. Identified users with a player auto-join via the effect. */}
      <JoinNameSheet
        isOpen={step === "create" && hasOwnPlayer === false}
        mode="create"
        initialName=""
        contextName={event.name}
        onClose={() => setStep("idle")}
        onSubmit={finalizeCreate}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          setStep("postgate");
        }}
      />
    </div>
  );
};
