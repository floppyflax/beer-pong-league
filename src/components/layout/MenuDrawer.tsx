import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLeague } from "../../context/LeagueContext";
import type { League, Tournament } from "../../types";
import { X, Trophy, Calendar, Plus, Search, Home, BarChart3 } from "lucide-react";

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MenuDrawer = ({ isOpen, onClose }: MenuDrawerProps) => {
  const { leagues, tournaments } = useLeague();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLeagues = leagues.filter((league) =>
    league.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTournaments = tournaments.filter((tournament) =>
    tournament.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTournaments = tournaments.filter((t) => !t.isFinished);
  const finishedTournaments = tournaments.filter((t) => t.isFinished);

  // Calculate global stats
  const globalStats = useMemo(() => {
    const totalMatches = leagues.reduce(
      (acc, league) => acc + league.matches.length,
      0
    );
    const totalPlayers = new Set(
      leagues.flatMap((league) => league.players.map((p) => p.id))
    ).size;
    const totalTournaments = tournaments.length;

    return {
      totalMatches,
      totalPlayers,
      totalTournaments,
    };
  }, [leagues, tournaments]);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay - hidden on desktop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Drawer - hidden on desktop (lg and above) */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-cream border-r border-card z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-card flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍺</span>
              <span className="text-xl font-bold text-cup-red">BPL</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-paper rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-card">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full bg-paper border border-card rounded-lg pl-10 pr-4 py-2 text-ink placeholder-slate-500 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* Global Stats */}
            <div className="p-4 border-b border-card">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={18} className="text-cup-red" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-ink-soft">
                  Statistiques Globales
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-paper p-2 rounded-lg text-center">
                  <div className="text-lg font-bold text-cup-red">
                    {globalStats.totalMatches}
                  </div>
                  <div className="text-[10px] text-ink-soft uppercase">
                    Matchs
                  </div>
                </div>
                <div className="bg-paper p-2 rounded-lg text-center">
                  <div className="text-lg font-bold text-accent">
                    {globalStats.totalPlayers}
                  </div>
                  <div className="text-[10px] text-ink-soft uppercase">
                    Joueurs
                  </div>
                </div>
                <div className="bg-paper p-2 rounded-lg text-center">
                  <div className="text-lg font-bold text-ink">
                    {globalStats.totalTournaments}
                  </div>
                  <div className="text-[10px] text-ink-soft uppercase">
                    Tournois
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 space-y-2">
              <button
                onClick={() => handleNavigate("/")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  location.pathname === "/"
                    ? "bg-cup-red/20 text-cup-red"
                    : "hover:bg-paper text-ink-soft"
                }`}
              >
                <Home size={20} />
                <span className="font-medium">Accueil</span>
              </button>

              <button
                onClick={() => handleNavigate("/create-league")}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-paper text-ink-soft transition-colors"
              >
                <Plus size={20} />
                <span className="font-medium">Nouvelle League</span>
              </button>

              <button
                onClick={() => handleNavigate("/create-tournament")}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-paper text-ink-soft transition-colors"
              >
                <Plus size={20} />
                <span className="font-medium">Nouveau Tournoi</span>
              </button>
            </div>

            {/* Leagues Section */}
            <div className="p-4 border-t border-card">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={18} className="text-cup-red" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-ink-soft">
                  Mes Leagues ({leagues.length})
                </h3>
              </div>
              <div className="space-y-1">
                {filteredLeagues.length === 0 ? (
                  <p className="text-sm text-ink-mute px-2">
                    {searchQuery ? "Aucun résultat" : "Aucune league"}
                  </p>
                ) : (
                  filteredLeagues.map((league: League) => (
                    <button
                      key={league.id}
                      onClick={() => handleNavigate(`/league/${league.id}`)}
                      className={`w-full text-left flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        location.pathname === `/league/${league.id}`
                          ? "bg-cup-red/20 text-cup-red"
                          : "hover:bg-paper text-ink-soft"
                      }`}
                    >
                      <Trophy size={16} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {league.name}
                        </div>
                        <div className="text-xs text-ink-mute">
                          {league.players.length} joueurs
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Tournaments Section */}
            <div className="p-4 border-t border-card">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={18} className="text-accent" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-ink-soft">
                  Mes Tournois ({tournaments.length})
                </h3>
              </div>

              {/* Active Tournaments */}
              {activeTournaments.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-ink-mute mb-1 px-2">
                    En cours
                  </div>
                  <div className="space-y-1">
                    {activeTournaments
                      .filter((t: any) =>
                        t.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((tournament: Tournament) => (
                        <button
                          key={tournament.id}
                          onClick={() =>
                            handleNavigate(`/tournament/${tournament.id}`)
                          }
                          className={`w-full text-left flex items-center gap-3 p-2 rounded-lg transition-colors ${
                            location.pathname === `/tournament/${tournament.id}`
                              ? "bg-accent/20 text-accent"
                              : "hover:bg-paper text-ink-soft"
                          }`}
                        >
                          <Calendar size={16} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {tournament.name}
                            </div>
                            <div className="text-xs text-ink-mute">
                              {tournament.matches.length} matchs
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Finished Tournaments */}
              {finishedTournaments.length > 0 && (
                <div>
                  <div className="text-xs text-ink-mute mb-1 px-2">
                    Terminés
                  </div>
                  <div className="space-y-1">
                    {finishedTournaments
                      .filter((t: any) =>
                        t.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((tournament: Tournament) => (
                        <button
                          key={tournament.id}
                          onClick={() =>
                            handleNavigate(`/tournament/${tournament.id}`)
                          }
                          className={`w-full text-left flex items-center gap-3 p-2 rounded-lg transition-colors opacity-60 ${
                            location.pathname === `/tournament/${tournament.id}`
                              ? "bg-accent/20 text-accent"
                              : "hover:bg-paper text-ink-soft"
                          }`}
                        >
                          <Calendar size={16} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate flex items-center gap-2">
                              {tournament.name}
                              <span className="text-xs bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded">
                                ✓
                              </span>
                            </div>
                            <div className="text-xs text-ink-mute">
                              {tournament.matches.length} matchs
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {filteredTournaments.length === 0 && searchQuery && (
                <p className="text-sm text-ink-mute px-2">Aucun résultat</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-card">
            <div className="text-xs text-ink-mute text-center">
              Beer Pong League © 2024
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
