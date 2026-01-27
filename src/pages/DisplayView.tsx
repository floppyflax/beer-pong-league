import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export const DisplayView = () => {
  const { id } = useParams<{ id: string }>();
  const { leagues } = useLeague();
  const navigate = useNavigate();

  const league = leagues.find((l) => l.id === id);
  const [scrollPosition, setScrollPosition] = useState<"top" | "scrolling">("top");
  const [highlightedPlayers, setHighlightedPlayers] = useState<Set<string>>(new Set());
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  // Get sorted players
  const sortedPlayers = useMemo(() => {
    if (!league) return [];
    return [...league.players].sort((a, b) => b.elo - a.elo);
  }, [league]);

  // Get recent matches
  const recentMatches = useMemo(() => {
    if (!league) return [];
    return [...league.matches]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [league]);

  // Generate join URL
  const joinUrl = useMemo(() => {
    if (!league) return "";
    return `${window.location.origin}/league/${league.id}`;
  }, [league]);

  // Auto-scroll logic
  useEffect(() => {
    if (!league || sortedPlayers.length <= 10) return;

    const startAutoScroll = () => {
      // Scroll to bottom after 15 seconds on top
      if (scrollPosition === "top") {
        autoScrollRef.current = setTimeout(() => {
          setScrollPosition("scrolling");
        }, 15000);
      } else {
        // Return to top after 12 seconds
        autoScrollRef.current = setTimeout(() => {
          setScrollPosition("top");
        }, 12000);
      }
    };

    startAutoScroll();

    return () => {
      if (autoScrollRef.current) {
        clearTimeout(autoScrollRef.current);
      }
    };
  }, [scrollPosition, league, sortedPlayers.length]);

  // Track last match ID to detect new matches
  const lastMatchIdRef = useRef<string | null>(null);

  // Highlight players after match
  useEffect(() => {
    if (!league || recentMatches.length === 0) return;

    const lastMatch = recentMatches[0];
    const isNewMatch = lastMatch.id !== lastMatchIdRef.current;
    
    if (isNewMatch) {
      const playersInMatch = [...lastMatch.teamA, ...lastMatch.teamB];
      
      setHighlightedPlayers(new Set(playersInMatch));
      // Reset scroll to top when new match
      setScrollPosition("top");

      // Remove highlight after 5 seconds
      const timeout = setTimeout(() => {
        setHighlightedPlayers(new Set());
      }, 5000);

      lastMatchIdRef.current = lastMatch.id;
      return () => clearTimeout(timeout);
    }
  }, [league, recentMatches]);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(`/league/${id}`);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [id, navigate]);

  if (!league) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        <p>Ligue introuvable.</p>
      </div>
    );
  }

  const top10Players = sortedPlayers.slice(0, 10);
  const remainingPlayers = sortedPlayers.slice(10);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden relative select-none fixed inset-0">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 z-20">
        <div className="flex items-center justify-between w-full px-4 md:px-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-4xl font-black mb-1 md:mb-2 truncate">{league.name}</h1>
            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
              <span className="text-xs md:text-sm text-slate-400 uppercase tracking-wider font-bold">
                {league.type === "season" ? "Saison" : "Ligue"}
              </span>
              <div className="flex items-center gap-2 text-accent">
                <Zap size={16} className="animate-pulse w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm font-bold">LIVE</span>
              </div>
              <span className="text-xs md:text-sm text-slate-400">
                {league.matches.length} matchs
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 md:pt-28 pb-4 md:pb-8 px-4 md:px-8 lg:px-12 h-full flex flex-col lg:flex-row gap-4 md:gap-8 lg:gap-12 w-full">
        {/* Left: Leaderboard */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="mb-4 md:mb-6">
            <h2 className="text-xl md:text-3xl font-black mb-2">Classement</h2>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
            {/* Top 10 - Always visible */}
            <div className="space-y-2 md:space-y-4 mb-4 md:mb-8">
              {top10Players.map((player, index) => {
                const isHighlighted = highlightedPlayers.has(player.id);
                const eloChange = recentMatches[0]?.eloChanges?.[player.id] || 0;
                const isWinner = eloChange > 0;
                const isLoser = eloChange < 0;

                return (
                  <div
                    key={player.id}
                    className={`bg-slate-800/90 backdrop-blur-sm p-3 md:p-5 rounded-xl md:rounded-2xl border-2 transition-all duration-700 ${
                      isHighlighted
                        ? "border-primary shadow-2xl shadow-primary/50 scale-[1.02]"
                        : "border-slate-700/50"
                    } ${isWinner ? "ring-4 ring-green-500/30" : ""} ${
                      isLoser ? "ring-4 ring-red-500/30" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 md:gap-4">
                      <div className="flex items-center gap-3 md:gap-6 min-w-0 flex-1">
                        <div
                          className={`w-12 h-12 md:w-16 md:h-16 flex items-center justify-center font-black text-lg md:text-2xl rounded-lg md:rounded-xl flex-shrink-0 ${
                            index === 0
                              ? "bg-yellow-500 text-slate-900"
                              : index === 1
                              ? "bg-slate-300 text-slate-900"
                              : index === 2
                              ? "bg-amber-700 text-white"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-lg md:text-2xl font-black mb-0.5 md:mb-1 truncate">{player.name}</div>
                          <div className="text-sm md:text-base text-slate-400">
                            {player.wins}V - {player.losses}D
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl md:text-4xl font-black text-primary">
                          {player.elo}
                        </div>
                        {eloChange !== 0 && (
                          <div
                            className={`text-sm md:text-base font-bold flex items-center justify-end gap-1 mt-0.5 md:mt-1 ${
                              eloChange > 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {eloChange > 0 ? (
                              <TrendingUp size={18} className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                            ) : (
                              <TrendingDown size={18} className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                            )}
                            {eloChange > 0 ? "+" : ""}
                            {eloChange}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Remaining players - Scrollable */}
            {remainingPlayers.length > 0 && (
              <div
                className={`space-y-3 transition-all duration-1000 ${
                  scrollPosition === "scrolling"
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-4 pointer-events-none"
                }`}
              >
                {remainingPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-lg border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center font-bold text-lg bg-slate-700 text-slate-300 rounded">
                          {index + 11}
                        </div>
                        <div>
                          <div className="text-lg font-bold">{player.name}</div>
                          <div className="text-xs text-slate-400">
                            {player.wins}V - {player.losses}D
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl font-black text-primary">
                        {player.elo}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Match Feed + QR Code */}
        <div className="w-full lg:w-96 flex flex-col gap-4 md:gap-6 lg:gap-8 flex-shrink-0">
          {/* Match Feed */}
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-slate-700/50">
            <h3 className="text-lg md:text-xl font-black mb-3 md:mb-4">Derniers matchs</h3>
            <div className="space-y-2">
              {recentMatches.map((match, index) => {
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
                    className={`p-3 md:p-4 rounded-lg md:rounded-xl border-2 transition-all ${
                      index === 0
                        ? "bg-primary/20 border-primary/50 shadow-lg"
                        : "bg-slate-700/40 border-slate-700/50"
                    }`}
                  >
                    <div className="text-xs md:text-sm text-slate-400 mb-1 md:mb-2 font-bold">
                      {new Date(match.date).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-sm md:text-base">
                      <div
                        className={winnerA ? "font-black text-white text-base md:text-lg truncate" : "text-slate-300 truncate"}
                      >
                        {teamANames}
                      </div>
                      <div className="text-slate-500 text-center my-1 md:my-2 font-bold">VS</div>
                      <div
                        className={!winnerA ? "font-black text-white text-base md:text-lg truncate" : "text-slate-300 truncate"}
                      >
                        {teamBNames}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700/50 flex flex-col items-center">
            <h3 className="text-lg md:text-xl font-black mb-3 md:mb-4 text-center">
              Rejoins le tournoi !
            </h3>
            <div className="bg-white p-3 md:p-5 rounded-lg md:rounded-xl mb-3 md:mb-4 shadow-2xl">
              <QRCodeSVG value={joinUrl} size={150} className="md:hidden" />
              <QRCodeSVG value={joinUrl} size={200} className="hidden md:block" />
            </div>
            <p className="text-xs md:text-sm text-slate-400 text-center font-medium">
              Scanne avec ton téléphone
            </p>
          </div>
        </div>
      </div>

      {/* Exit hint */}
      <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 text-[10px] md:text-xs text-slate-500">
        Appuyez sur ESC pour quitter
      </div>
    </div>
  );
};

