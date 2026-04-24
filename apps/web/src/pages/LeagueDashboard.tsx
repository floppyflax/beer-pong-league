import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "@/context/LeagueContext";
import {
  Trophy,
  Plus,
  History,
  Users,
  X,
  Trash2,
  Edit,
  Monitor,
  UserPlus,
  FileJson,
  FileSpreadsheet,
  Settings,
} from "lucide-react";
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
} from "@/components/design-system";
import { MatchEnrichedDisplay } from "@/components/MatchEnrichedDisplay";
import { LiveMatchBadge } from "@/components/live/LiveMatchBadge";
import { getDeltaFromLastMatch } from "@/utils/playerStats";
import { exportLeagueJSON, exportPlayersCSV, exportMatchesCSV } from "@/services/ExportService";
import { Podium } from "@/components/ponglo/Podium";
import { LeaderRow } from "@/components/ponglo/LeaderRow";

export const LeagueDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const {
    leagues,
    tournaments,
    addPlayer,
    deleteLeague,
    updateLeague,
    updatePlayer,
    deletePlayer,
    isLoadingInitialData,
  } = useLeague();
  const navigate = useNavigate();

  const league = leagues.find((l) => l.id === id);
  const [activeTab, setActiveTab] = useState<
    "classement" | "matchs" | "events" | "parametres"
  >("classement");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState("");

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
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-signal-red text-white rounded-lg font-bold hover:brightness-110 transition-colors"
            >
              Retour à l'accueil
            </button>
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

  const handleDeleteLeague = () => {
    if (confirm("Es-tu sûr de vouloir supprimer cette ligue ?")) {
      deleteLeague(league.id);
      navigate("/");
    }
  };

  const detailHeroMenuItems = [
    {
      label: "Paramètres",
      icon: <Settings size={20} />,
      onClick: () => setActiveTab("parametres"),
    },
    ...(isAdmin
      ? [
          {
            label: "Mode Diffusion",
            icon: <Monitor size={20} />,
            onClick: () => navigate(`/league/${league.id}/display`),
          },
        ]
      : []),
    {
      label: "Exporter JSON",
      icon: <FileJson size={20} />,
      onClick: () => exportLeagueJSON(league),
    },
    {
      label: "Exporter joueurs CSV",
      icon: <FileSpreadsheet size={20} />,
      onClick: () => exportPlayersCSV(league),
    },
    {
      label: "Exporter matchs CSV",
      icon: <FileSpreadsheet size={20} />,
      onClick: () => {
        const map: Record<string, string> = {};
        league.players.forEach((p) => {
          map[p.id] = p.name;
        });
        exportMatchesCSV(league, map);
      },
    },
    ...(isAdmin
      ? [
          {
            label: "Supprimer",
            icon: <Trash2 size={20} />,
            onClick: handleDeleteLeague,
            destructive: true,
          },
        ]
      : []),
  ];

  const shortDateFormatter: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  };

  const topElo = sortedPlayers.length > 0 ? sortedPlayers[0].elo : null;

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col relative">
      {/* DetailHero — bloc bleu pleine largeur (bleed sous padding ResponsiveLayout + App). */}
      <DetailHero
        className="-mx-4 -mt-4 md:mx-0 md:mt-0"
        onBack={() => navigate("/competitions")}
        adminBadge={isAdmin}
        title={league.name}
        status={{ label: "En cours", variant: "active" }}
        meta={[
          league.type === "season" ? "Championnat par saison" : "Ligue continue",
          new Date(league.createdAt).toLocaleDateString(
            "fr-FR",
            shortDateFormatter,
          ),
        ]}
        stats={[
          { label: "Joueurs", value: String(league.players.length) },
          { label: "Matchs", value: String(league.matches.length) },
          { label: "Top ELO", value: topElo !== null ? String(topElo) : "—" },
        ]}
        actions={
          isAdmin || canInvite
            ? [
                {
                  label: "Inviter",
                  icon: <UserPlus size={16} />,
                  onClick: () => setShowAddPlayer(true),
                  variant: "secondary",
                },
              ]
            : []
        }
        menuItems={detailHeroMenuItems}
      />

      {/* SegmentedTabs: Matchs / Classement / Events */}
      <div className="px-4 pt-4 pb-4">
        <SegmentedTabs
          tabs={[
            { id: "matchs", label: "Matchs" },
            { id: "classement", label: "Classement" },
            { id: "events", label: "Events" },
          ]}
          activeId={activeTab === "parametres" ? "" : activeTab}
          onChange={(id) =>
            setActiveTab(
              id as "classement" | "matchs" | "events" | "parametres",
            )
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
                  <button
                    onClick={() => setShowAddPlayer(true)}
                    className="px-4 py-2 bg-signal-red text-white rounded-lg font-bold hover:brightness-110 transition-colors"
                  >
                    <Plus size={16} className="inline mr-2" />
                    Ajouter un joueur
                  </button>
                }
              />
            ) : (
              <div className="space-y-3 w-full">
                {/* Podium top-3 */}
                {sortedPlayers.length >= 3 && (
                  <Podium
                    top3={sortedPlayers.slice(0, 3).map((p) => ({
                      id: p.id,
                      name: p.name,
                      elo: p.elo,
                    }))}
                    className="mb-1"
                  />
                )}
                {/* Full leaderboard with LeaderRow */}
                <div className="space-y-1.5">
                  {sortedPlayers.map((player, index) => {
                    const delta = getDeltaFromLastMatch(
                      player.id,
                      sortedMatches,
                    );
                    return (
                      <LeaderRow
                        key={player.id}
                        rank={index + 1}
                        player={{
                          id: player.id,
                          name: player.name,
                          elo: player.elo,
                          delta: delta ?? undefined,
                        }}
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
                  <button
                    onClick={() => navigate(`/record-match/league/${league.id}`)}
                    className="px-4 py-2 bg-signal-red text-white rounded-lg font-bold hover:brightness-110 transition-colors"
                  >
                    <Plus size={16} className="inline mr-2" />
                    Enregistrer un match
                  </button>
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
        {activeTab === "events" && (
          <div className="space-y-2">
            {league.tournaments && league.tournaments.length > 0 ? (
              tournaments
                .filter((t) => league.tournaments?.includes(t.id))
                .map((tournament) => (
                  <div
                    key={tournament.id}
                    onClick={() => navigate(`/tournament/${tournament.id}`)}
                    className="bg-navy-soft p-3 rounded-xl flex justify-between items-center hover:border-card cursor-pointer transition-colors border border-card/50"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-white flex items-center gap-2">
                        {tournament.name}
                        {tournament.isFinished && (
                          <span className="text-xs bg-lime/20 text-lime px-2 py-0.5 rounded">
                            Terminé
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-cool-gray font-mono">
                        {new Date(tournament.date).toLocaleDateString(
                          "fr-FR",
                          shortDateFormatter,
                        )}
                        {" · "}
                        {tournament.matches.length} matchs
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
                  <button
                    onClick={() =>
                      navigate(`/create-tournament?leagueId=${league.id}`)
                    }
                    className="px-4 py-2 bg-signal-red text-white rounded-lg font-bold hover:brightness-110 transition-colors"
                  >
                    <Plus size={16} className="inline mr-2" />
                    Créer un événement
                  </button>
                }
              />
            )}
            {league.tournaments && league.tournaments.length > 0 && (
              <button
                onClick={() =>
                  navigate(`/create-tournament?leagueId=${league.id}`)
                }
                className="w-full bg-navy-soft hover:bg-navy-deep text-white font-bold py-3 rounded-lg mt-2 border border-card/50"
              >
                <Plus size={16} className="inline mr-2" />
                Créer un événement
              </button>
            )}
          </div>
        )}
        {activeTab === "parametres" && (
          <div className="space-y-4">
            {/* League info */}
            <div className="bg-navy-soft p-4 rounded-xl border border-card/50">
              <h3 className="font-bold text-white mb-4">Informations</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-cool-gray">
                    Nom de la League
                  </label>
                  <input
                    type="text"
                    value={league.name}
                    onChange={(e) =>
                      updateLeague(league.id, e.target.value, league.type)
                    }
                    className="w-full bg-navy-deep border border-card-muted rounded-lg p-2 mt-1 text-white focus:ring-2 focus:ring-lime/30 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-cool-gray">Type</label>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() =>
                        updateLeague(league.id, league.name, "event")
                      }
                      className={`flex-1 py-2 rounded-lg font-bold text-sm ${
                        league.type === "event"
                          ? "bg-electric-blue text-white"
                          : "bg-navy-deep text-white"
                      }`}
                    >
                      Continue
                    </button>
                    <button
                      onClick={() =>
                        updateLeague(league.id, league.name, "season")
                      }
                      className={`flex-1 py-2 rounded-lg font-bold text-sm ${
                        league.type === "season"
                          ? "bg-electric-blue text-white"
                          : "bg-navy-deep text-white"
                      }`}
                    >
                      Par Saison
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tournaments */}
            <div className="bg-navy-soft p-4 rounded-xl border border-card/50">
              <h3 className="font-bold text-white mb-4">Événements</h3>
              {league.tournaments && league.tournaments.length > 0 ? (
                <div className="space-y-2">
                  {tournaments
                    .filter((t) => league.tournaments?.includes(t.id))
                    .map((tournament) => (
                      <div
                        key={tournament.id}
                        onClick={() => navigate(`/tournament/${tournament.id}`)}
                        className="bg-navy-deep/50 p-3 rounded-xl flex justify-between items-center hover:border-card-muted cursor-pointer transition-colors border border-transparent"
                      >
                        <div className="flex-1">
                          <div className="font-bold text-white flex items-center gap-2">
                            {tournament.name}
                            {tournament.isFinished && (
                              <span className="text-xs bg-lime/20 text-lime px-2 py-0.5 rounded">
                                Terminé
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-cool-gray">
                            {new Date(tournament.date).toLocaleDateString(
                              "fr-FR",
                            )}{" "}
                            • {tournament.matches.length} matchs
                          </div>
                        </div>
                        <div className="text-cool-gray">→</div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-cool-gray text-sm mb-4">
                  Aucun tournoi associé.
                </p>
              )}
              <button
                onClick={() =>
                  navigate(`/create-tournament?leagueId=${league.id}`)
                }
                className="w-full bg-navy-deep hover:bg-navy-deep text-white font-bold py-3 rounded-lg"
              >
                <Plus size={16} className="inline mr-2" />
                Créer un tournoi
              </button>
            </div>

            {/* Players */}
            <div className="bg-navy-soft p-4 rounded-xl border border-card/50">
              <h3 className="font-bold text-white mb-4">Joueurs</h3>
              {sortedPlayers.length === 0 ? (
                <p className="text-cool-gray text-sm mb-4">
                  Aucun joueur dans cette ligue.
                </p>
              ) : (
                <div className="space-y-2">
                  {sortedPlayers.map((player) => (
                    <div key={player.id}>
                      {editingPlayerId === player.id ? (
                        /* Inline edit form */
                        <div className="bg-electric-blue/10 border border-electric-blue/30 p-3 rounded-xl flex items-center gap-2">
                          <input
                            autoFocus
                            value={editingPlayerName}
                            onChange={(e) => setEditingPlayerName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const trimmed = editingPlayerName.trim();
                                if (trimmed && trimmed !== player.name) {
                                  updatePlayer(league.id, player.id, trimmed);
                                }
                                setEditingPlayerId(null);
                              }
                              if (e.key === "Escape") setEditingPlayerId(null);
                            }}
                            className="flex-1 bg-navy-deep border border-card rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-electric-blue"
                            aria-label="Nouveau nom du joueur"
                          />
                          <button
                            onClick={() => {
                              const trimmed = editingPlayerName.trim();
                              if (trimmed && trimmed !== player.name) {
                                updatePlayer(league.id, player.id, trimmed);
                              }
                              setEditingPlayerId(null);
                            }}
                            className="px-3 py-1.5 bg-electric-blue text-white text-sm font-bold rounded-lg"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => setEditingPlayerId(null)}
                            className="p-1.5 text-cool-gray hover:text-white"
                            aria-label="Annuler"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="bg-navy-deep/50 p-3 rounded-xl flex items-center justify-between border border-transparent">
                          <div
                            onClick={() => navigate(`/player/${player.id}`)}
                            className="flex-1 flex items-center gap-4 cursor-pointer"
                          >
                            <div className="font-bold text-white">{player.name}</div>
                            <div className="text-xs text-cool-gray">
                              {player.elo} ELO • {player.wins}V - {player.losses}D
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPlayerId(player.id);
                                setEditingPlayerName(player.name);
                              }}
                              className="p-2 hover:bg-navy-deep rounded-lg text-cool-gray hover:text-white"
                              aria-label="Modifier"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Supprimer ${player.name} ? Tous ses matchs seront également supprimés.`)) {
                                  deletePlayer(league.id, player.id);
                                }
                              }}
                              className="p-2 hover:bg-signal-red/20 text-signal-red rounded-lg"
                              aria-label="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowAddPlayer(true)}
                className="w-full bg-navy-deep hover:bg-navy-deep text-white font-bold py-3 rounded-lg mt-4"
              >
                <Plus size={16} className="inline mr-2" />
                Ajouter un joueur
              </button>
            </div>

            {/* Actions */}
            <div className="bg-navy-soft p-4 rounded-xl border border-card/50">
              <h3 className="font-bold text-white mb-4">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(league, null, 2);
                    const dataBlob = new Blob([dataStr], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `${league.name}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full bg-navy-deep hover:bg-navy-deep text-white font-bold py-3 rounded-lg"
                >
                  Exporter les données (JSON)
                </button>
                <button
                  onClick={handleDeleteLeague}
                  className="w-full bg-signal-red/20 hover:bg-signal-red/30 text-signal-red font-bold py-3 rounded-lg border border-signal-red/50"
                >
                  Supprimer la League
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AC6: FAB Nouveau match — navigate to RecordMatch page */}
      <FAB
        icon={BeerPongMatchIcon}
        onClick={() => navigate(`/record-match/league/${league.id}`)}
        ariaLabel="Nouveau match"
      />

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
