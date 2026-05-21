import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "@/context/LeagueContext";
import {
  Trophy,
  Plus,
  History,
  Users,
  Monitor,
  UserPlus,
  Settings,
  Pause,
  Play,
} from "lucide-react";
import { getLeagueLifecycle, canRecordLeagueMatch } from "@/utils/leagueLifecycle";
import { BeerPongMatchIcon } from "../components/icons/BeerPongMatchIcon";
import { EloChangeDisplay } from "../components/EloChangeDisplay";
import { EmptyState } from "../components/EmptyState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useDetailPagePermissions } from "../hooks/useDetailPagePermissions";
import {
  SegmentedTabs,
  FAB,
  DetailHero,
  InviteSheet,
  LifecycleStrip,
} from "@/components/design-system";
import { DetailedStatsPanel } from "@/components/stats/DetailedStatsPanel";
import { MatchEnrichedDisplay } from "@/components/MatchEnrichedDisplay";
import { LiveMatchBadge } from "@/components/live/LiveMatchBadge";
import {
  getDeltaFromLastMatch,
  getLast5MatchResults,
} from "@/utils/playerStats";
import { Podium } from "@/components/ponglo/Podium";
import { PButton } from "@/components/ponglo/PButton";
import { PlayerCard } from "@/components/design-system/PlayerCard";

export const LeagueDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const {
    leagues,
    events,
    addPlayer,
    pauseLeague,
    resumeLeague,
    isLoadingInitialData,
  } = useLeague();
  const navigate = useNavigate();

  const league = leagues.find((l) => l.id === id);
  const [activeTab, setActiveTab] = useState<
    "classement" | "matchs" | "stats" | "events"
  >("classement");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  // Ghost management vit dans LeagueSettings (mig 029 — plus de menu overflow
  // sur le hero). Si tu cherches `useUnclaimedGuests`, c'est là-bas.

  // Escape key closes add-player modal
  useEffect(() => {
    if (!showAddPlayer) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAddPlayer(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showAddPlayer]);

  const [showEloChanges, setShowEloChanges] = useState(false);
  const [lastEloChanges] = useState<Record<string, number>>({});

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
            <PButton variant="primary" size="md" onClick={() => navigate("/")}>
              Retour à l&apos;accueil
            </PButton>
          }
        />
      </div>
    );
  }

  // TODO(Phase B): Move these hooks before early returns to satisfy react-hooks/rules-of-hooks properly.
  // For PR0, suppressed to unblock lint — restructuring the component is out of scope here.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const sortedPlayers = useMemo(() => {
    return [...league.players].sort((a, b) => b.elo - a.elo);
  }, [league.players]);

  // Memoize sorted matches (by date desc) to avoid re-sorting 2N times per render
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const sortedMatches = useMemo(
    () =>
      [...league.matches].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [league.matches],
  );

  // Story 9-5 - Get permissions for contextual actions
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isAdmin, canInvite } = useDetailPagePermissions(id || "", "league");

  const handleInviteAddManual = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 50) return;
    addPlayer(league.id, trimmed);
    setShowAddPlayer(false);
  };

  // Pas d'overflow menu sur le hero league (mig 029) : Paramètres + Mode
  // Diffusion sont des iconOnly dédiés, et tout le reste (historique des
  // saisons, exports CSV/JSON, gestion ghosts, suppression) est accessible
  // depuis LeagueSettings.

  const shortDateFormatter: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  };

  const topElo = sortedPlayers.length > 0 ? sortedPlayers[0].elo : null;

  // Mig 028 — Lifecycle league
  const lifecycle = getLeagueLifecycle(league);
  const matchLoggingAllowed = canRecordLeagueMatch(league);
  const seasonNumber = league.currentSeasonNumber ?? 1;
  const seasonStartedAt = league.currentSeasonStartedAt ?? league.createdAt;
  const seasonStartedLabel = new Date(seasonStartedAt).toLocaleDateString(
    "fr-FR",
    shortDateFormatter,
  );

  const heroStatusVariant: "active" | "scheduled" | "finished" =
    lifecycle === "finished"
      ? "finished"
      : lifecycle === "paused"
        ? "scheduled"
        : "active";
  const heroStatusLabel =
    lifecycle === "finished"
      ? "Terminée"
      : lifecycle === "paused"
        ? "En pause"
        : "Active";

  // Hero actions — spec uniforme event/league (mig 029) :
  //  • Admin : [Ajouter primary] [Pause/Reprendre iconOnly] [Paramètres iconOnly] [Mode Diffusion iconOnly]
  //  • Non-admin / invité : [Ajouter primary] uniquement.
  //
  // Les actions Clôturer/Réouvrir et le cycle de saison (forcer la fin →
  // démarrer la suivante) ont migré dans la page Paramètres (mig 029).
  const detailHeroAdminActions: Parameters<typeof DetailHero>[0]["actions"] = [];
  if (isAdmin || canInvite) {
    detailHeroAdminActions.push({
      label: "Ajouter",
      icon: <UserPlus size={16} />,
      onClick: () => setShowAddPlayer(true),
      variant: "primary",
    });
  }
  if (isAdmin) {
    if (lifecycle === "paused") {
      detailHeroAdminActions.push({
        label: "Reprendre la ligue",
        icon: <Play size={18} />,
        onClick: () => {
          void resumeLeague(league.id);
        },
        variant: "iconOnly",
      });
    } else if (lifecycle === "active") {
      detailHeroAdminActions.push({
        label: "Mettre en pause",
        icon: <Pause size={18} />,
        onClick: () => {
          void pauseLeague(league.id);
        },
        variant: "iconOnly",
      });
    }
    // États `between_seasons` et `finished` → pas de bouton lifecycle dans le
    // hero. L'admin gère via Paramètres (cf. LifecycleStrip ci-dessous qui
    // l'oriente).
    detailHeroAdminActions.push({
      label: "Paramètres",
      icon: <Settings size={18} />,
      onClick: () => navigate(`/league/${league.id}/settings`),
      variant: "iconOnly",
    });
    detailHeroAdminActions.push({
      label: "Mode Diffusion",
      icon: <Monitor size={18} />,
      onClick: () => navigate(`/league/${league.id}/display`),
      variant: "iconOnly",
    });
  }

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col relative">
      {/* DetailHero — bloc bleu pleine largeur (bleed sous padding ResponsiveLayout + App). */}
      <DetailHero
        className="-mx-4 -mt-4 md:mx-0 md:mt-0"
        onBack={() => navigate("/competitions")}
        adminBadge={isAdmin}
        title={league.name}
        status={{ label: heroStatusLabel, variant: heroStatusVariant }}
        meta={[
          `Saison ${seasonNumber} · démarrée le ${seasonStartedLabel}`,
        ]}
        stats={[
          { label: "Joueurs", value: String(league.players.length) },
          { label: "Matchs", value: String(league.matches.length) },
          { label: "Top ELO", value: topElo !== null ? String(topElo) : "—" },
        ]}
        actions={detailHeroAdminActions}
      />

      {/* Lifecycle status strip — sticky, ping-yellow accent. Sit entre le hero et les tabs. */}
      {lifecycle !== "active" && (
        <LifecycleStrip
          tone={
            lifecycle === "paused"
              ? "paused"
              : lifecycle === "between_seasons"
                ? "between_seasons"
                : "finished"
          }
          testId="league-lifecycle-banner"
          title={
            lifecycle === "paused"
              ? "Ligue en pause"
              : lifecycle === "between_seasons"
                ? `Saison ${seasonNumber} close — en attente`
                : "Ligue terminée"
          }
          description={
            lifecycle === "paused"
              ? isAdmin
                ? "Reprends la ligue pour réautoriser l'enregistrement des matchs."
                : "L'enregistrement de matchs est suspendu."
              : lifecycle === "between_seasons"
                ? isAdmin
                  ? `Démarre la Saison ${seasonNumber + 1} depuis Paramètres.`
                  : "Aucun match ne peut être enregistré tant que la saison suivante n'a pas démarré."
                : isAdmin
                  ? "Plus aucun match ne peut être enregistré. Réouvre la ligue depuis Paramètres si besoin."
                  : "Cette ligue est clôturée. Le classement est figé."
          }
        />
      )}

      {/* SegmentedTabs: Matchs / Classement / Events */}
      <div className="px-4 pt-4 pb-4">
        <SegmentedTabs
          tabs={[
            { id: "matchs", label: "Matchs" },
            { id: "classement", label: "Classement" },
            { id: "stats", label: "Stats" },
            { id: "events", label: "Events" },
          ]}
          activeId={activeTab}
          onChange={(id) =>
            setActiveTab(id as "classement" | "matchs" | "stats" | "events")
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
                  <PButton
                    variant="primary"
                    size="md"
                    icon={<Plus size={16} />}
                    onClick={() => setShowAddPlayer(true)}
                  >
                    Ajouter un joueur
                  </PButton>
                }
              />
            ) : (
              <div className="space-y-3 w-full">
                {/* Podium top-3 — shows ELO + last-match delta */}
                {sortedPlayers.length >= 3 && (
                  <Podium
                    top3={sortedPlayers.slice(0, 3).map((p) => ({
                      id: p.id,
                      name: p.name,
                      elo: p.elo,
                      delta:
                        getDeltaFromLastMatch(p.id, sortedMatches) ?? undefined,
                    }))}
                    className="mb-1"
                  />
                )}
                {/* Full leaderboard starting from rank 1 (top 3 are also shown on the podium). */}
                <div className="space-y-1.5">
                  {sortedPlayers.map((player, index) => {
                    const rank = index + 1;
                    const delta = getDeltaFromLastMatch(
                      player.id,
                      sortedMatches,
                    );
                    const recentResults = getLast5MatchResults(
                      player.id,
                      sortedMatches,
                    );
                    return (
                      <PlayerCard
                        key={player.id}
                        variant="leaderRow"
                        name={player.name}
                        elo={player.elo}
                        delta={delta ?? undefined}
                        rank={rank}
                        wins={player.wins}
                        losses={player.losses}
                        recentResults={recentResults}
                        onClick={() => navigate(`/player/${player.id}`)}
                      />
                    );
                  })}
                </div>
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
                  <PButton
                    variant="primary"
                    size="md"
                    icon={<Plus size={16} />}
                    onClick={() => navigate(`/record-match/league/${league.id}`)}
                  >
                    Enregistrer un match
                  </PButton>
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
                    className={`bg-navy-soft p-4 rounded-xl border ${match.is_live ? "border-lime/50" : "border-card/50"}`}
                  >
                    {/* Phase D.4: Live badge */}
                    <LiveMatchBadge isLive={Boolean(match.is_live)} className="mb-2" />
                    <div className="flex justify-between items-center text-sm">
                      <div
                        className={`flex-1 text-right ${
                          winnerA ? "text-white font-bold" : "text-cool-gray"
                        }`}
                      >
                        {winnerA && "🏆 "}
                        {teamANames}
                      </div>
                      <div className="px-4 font-bold text-cool-gray text-xs">
                        VS
                      </div>
                      <div
                        className={`flex-1 text-left ${
                          !winnerA ? "text-white font-bold" : "text-cool-gray"
                        }`}
                      >
                        {!winnerA && "🏆 "}
                        {teamBNames}
                      </div>
                    </div>
                    {/* Story 14-28: Photo thumbnail and cups badge */}
                    <MatchEnrichedDisplay
                      photoUrl={match.photo_url}
                      cupsRemaining={match.cups_remaining}
                    />
                  </div>
                );
              })
            )}
          </>
        )}
        {activeTab === "stats" && (
          <DetailedStatsPanel
            matches={league.matches}
            players={league.players}
            contextLabel="league"
            onPlayerClick={(playerId) => navigate(`/player/${playerId}`)}
          />
        )}
        {activeTab === "events" && (
          <div className="space-y-2">
            {league.events && league.events.length > 0 ? (
              events
                .filter((t) => league.events?.includes(t.id))
                .map((event) => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="bg-navy-soft p-3 rounded-xl flex justify-between items-center hover:border-card cursor-pointer transition-colors border border-card/50"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-white flex items-center gap-2">
                        {event.name}
                        {event.isFinished && (
                          <span className="text-xs bg-lime/20 text-lime px-2 py-0.5 rounded">
                            Terminé
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-cool-gray font-mono">
                        {new Date(event.date).toLocaleDateString(
                          "fr-FR",
                          shortDateFormatter,
                        )}
                        {" · "}
                        {event.matches.length} matchs
                      </div>
                    </div>
                    <div className="text-cool-gray">→</div>
                  </div>
                ))
            ) : (
              <EmptyState
                icon={Trophy}
                title="Aucun événement"
                description="Cette ligue n'a pas encore d'événement associé."
                action={
                  <PButton
                    variant="primary"
                    size="md"
                    icon={<Plus size={16} />}
                    onClick={() =>
                      navigate(`/create-event?leagueId=${league.id}`)
                    }
                  >
                    Créer un événement
                  </PButton>
                }
              />
            )}
            {league.events && league.events.length > 0 && (
              <button
                onClick={() =>
                  navigate(`/create-event?leagueId=${league.id}`)
                }
                className="w-full bg-navy-soft hover:bg-navy-deep text-white font-bold py-3 rounded-lg mt-2 border border-card/50"
              >
                <Plus size={16} className="inline mr-2" />
                Créer un événement
              </button>
            )}
          </div>
        )}
      </div>

      {/* AC6: FAB Nouveau match — navigate to RecordMatch page.
          Hidden when lifecycle disallows match logging (paused / finished). */}
      {matchLoggingAllowed && (
        <FAB
          icon={BeerPongMatchIcon}
          onClick={() => navigate(`/record-match/league/${league.id}`)}
          ariaLabel="Nouveau match"
        />
      )}

      {/* Invite bottom sheet — add player to the league (manual pseudo).
          Leagues have no joinCode/QR yet → sheet shows only the "add" section. */}
      <InviteSheet
        isOpen={showAddPlayer}
        onClose={() => setShowAddPlayer(false)}
        onAddManual={handleInviteAddManual}
      />

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
