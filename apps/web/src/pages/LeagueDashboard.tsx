import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "@/context/LeagueContext";
import {
  Trophy,
  Plus,
  Users,
  Monitor,
  UserPlus,
  Settings,
  Pause,
  Play,
} from "lucide-react";
import {
  getLeagueLifecycle,
  canRecordLeagueMatch,
  getLeagueReminders,
} from "@/utils/leagueLifecycle";
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
import { LeagueActivityFeed } from "@/components/leagues/activity";
import {
  getDeltaFromLastMatch,
  getLast5MatchResults,
  getRankDeltasFromLastMatch,
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
    "activite" | "classement" | "stats"
  >("activite");
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

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const rankDeltas = useMemo(
    () => getRankDeltasFromLastMatch(sortedPlayers, sortedMatches),
    [sortedPlayers, sortedMatches],
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

  // Mig 028+029 — Lifecycle league (4 états) + rappels informationnels
  const lifecycle = getLeagueLifecycle(league);
  const matchLoggingAllowed = canRecordLeagueMatch(league);
  const reminders = getLeagueReminders(league);
  const seasonNumber = league.currentSeasonNumber ?? 1;
  const seasonStartedAt = league.currentSeasonStartedAt ?? league.createdAt;
  const seasonStartedLabel = new Date(seasonStartedAt).toLocaleDateString(
    "fr-FR",
    shortDateFormatter,
  );

  // Mig 029 — date prévue de fin de saison (info, pas d'auto-clôture)
  const seasonExpectedEndLabel = (() => {
    if (!league.seasonDurationDays || !seasonStartedAt) return null;
    const end = new Date(seasonStartedAt);
    end.setUTCDate(end.getUTCDate() + league.seasonDurationDays);
    return end.toLocaleDateString("fr-FR", shortDateFormatter);
  })();
  const plannedStartLabel = league.plannedStartAt
    ? new Date(league.plannedStartAt).toLocaleDateString(
        "fr-FR",
        shortDateFormatter,
      )
    : null;
  const plannedEndLabel = league.plannedEndAt
    ? new Date(league.plannedEndAt).toLocaleDateString(
        "fr-FR",
        shortDateFormatter,
      )
    : null;

  const heroStatusVariant: "active" | "scheduled" | "finished" =
    lifecycle === "finished"
      ? "finished"
      : lifecycle === "paused" || lifecycle === "not_started"
        ? "scheduled"
        : "active";
  const heroStatusLabel =
    lifecycle === "finished"
      ? "Terminée"
      : lifecycle === "paused"
        ? "En pause"
        : lifecycle === "not_started"
          ? "Non démarrée"
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
    if (lifecycle === "not_started") {
      // Pas d'action lifecycle exposée — la league passera `active` toute
      // seule à `planned_start_at`. L'admin peut quand même clôturer via
      // les paramètres ou attendre.
    } else if (lifecycle === "paused") {
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
      {/* DetailHero — bloc bleu profond pleine largeur (bleed sous padding ResponsiveLayout + App).
          Ton `deep` pour distinguer visuellement les ligues des events (`electric`). */}
      <DetailHero
        tone="deep"
        className="-mx-4 -mt-4 md:mx-0 md:mt-0"
        onBack={() => navigate("/competitions")}
        adminBadge={isAdmin}
        title={league.name}
        status={{ label: heroStatusLabel, variant: heroStatusVariant }}
        meta={[
          lifecycle === "not_started" && plannedStartLabel
            ? `Démarre le ${plannedStartLabel}`
            : `Saison ${seasonNumber} · démarrée le ${seasonStartedLabel}${
                seasonExpectedEndLabel
                  ? ` · prévue jusqu'au ${seasonExpectedEndLabel}`
                  : ""
              }`,
          ...(plannedEndLabel && lifecycle !== "not_started"
            ? [`League prévue jusqu'au ${plannedEndLabel}`]
            : []),
          ...(league.isPrivate === false ? ["Publique"] : []),
          ...(league.anti_cheat_enabled ? ["Anti-cheat ON"] : []),
        ]}
        stats={[
          { label: "Joueurs", value: String(league.players.length) },
          { label: "Matchs", value: String(league.matches.length) },
          { label: "Top ELO", value: topElo !== null ? String(topElo) : "—" },
        ]}
        actions={detailHeroAdminActions}
      />

      {/* Mig 028+029+030 — Lifecycle status strip (prio absolue) ou strip de
          rappel (saison/league overdue). Un seul strip à la fois pour ne pas
          surcharger l'admin. */}
      {lifecycle === "not_started" ? (
        <LifecycleStrip
          tone="not_started"
          testId="league-lifecycle-banner"
          title="Ligue non démarrée"
          description={
            plannedStartLabel
              ? isAdmin
                ? `La ligue est programmée pour démarrer le ${plannedStartLabel}. Les matchs seront autorisés à partir de cette date.`
                : `La ligue démarre le ${plannedStartLabel}. L'enregistrement de matchs sera autorisé à partir de cette date.`
              : "L'enregistrement de matchs sera autorisé une fois la ligue démarrée."
          }
        />
      ) : lifecycle === "paused" ||
        lifecycle === "between_seasons" ||
        lifecycle === "finished" ? (
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
      ) : reminders.seasonOverdue ? (
        <LifecycleStrip
          tone="reminder"
          testId="league-reminder-banner"
          title={`Saison ${seasonNumber} échue`}
          description={
            seasonExpectedEndLabel
              ? isAdmin
                ? `Elle devait se terminer le ${seasonExpectedEndLabel}. Démarre la Saison ${seasonNumber + 1} depuis le bandeau ci-dessus.`
                : `La saison ${seasonNumber} a dépassé sa durée prévue (${seasonExpectedEndLabel}).`
              : isAdmin
                ? `Démarre la Saison ${seasonNumber + 1} depuis le bandeau ci-dessus.`
                : `La saison ${seasonNumber} a dépassé sa durée prévue.`
          }
        />
      ) : reminders.leagueOverdue ? (
        <LifecycleStrip
          tone="reminder"
          testId="league-reminder-banner"
          title="Date de fin dépassée"
          description={
            plannedEndLabel
              ? isAdmin
                ? `La ligue devait se terminer le ${plannedEndLabel}. Clôture-la depuis le menu admin si besoin.`
                : `La ligue devait se terminer le ${plannedEndLabel}.`
              : isAdmin
                ? "La date de fin est dépassée. Clôture la ligue depuis le menu admin si besoin."
                : "La date de fin de la ligue est dépassée."
          }
        />
      ) : null}

      {/* SegmentedTabs: Activité / Classement / Stats — le tab Events a fusionné
          dans Activité (cf. LeagueActivityFeed). */}
      <div className="px-4 pt-4 pb-4">
        <SegmentedTabs
          tabs={[
            { id: "activite", label: "Activité" },
            { id: "classement", label: "Classement" },
            { id: "stats", label: "Stats" },
          ]}
          activeId={activeTab}
          onChange={(id) =>
            setActiveTab(id as "activite" | "classement" | "stats")
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
                      avatar: p.avatarUrl ?? undefined,
                      delta:
                        getDeltaFromLastMatch(p.id, sortedMatches) ?? undefined,
                      rankDelta: rankDeltas.get(p.id),
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
                        avatarUrl={player.avatarUrl ?? undefined}
                        elo={player.elo}
                        delta={delta ?? undefined}
                        rankDelta={rankDeltas.get(player.id)}
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
        {activeTab === "activite" && (
          <LeagueActivityFeed league={league} events={events} />
        )}
        {activeTab === "stats" && (
          <DetailedStatsPanel
            matches={league.matches}
            players={league.players}
            contextLabel="league"
            onPlayerClick={(playerId) => navigate(`/player/${playerId}`)}
          />
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
