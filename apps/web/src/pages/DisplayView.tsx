import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { isMatchValidated } from "../utils/matchStatus";

/** Refresh cadence for the standalone projection screen (ms). */
const DISPLAY_REFRESH_MS = 15000;

const RANK_BADGE: Record<number, string> = {
  1: "bg-ping-yellow text-navy border-ping-yellow-deep shadow-[0_3px_0_#D9B400]",
  2: "bg-cool-gray text-navy border-cool-gray shadow-[0_3px_0_rgba(0,0,0,0.4)]",
  3: "bg-bronze text-white border-bronze shadow-[0_3px_0_rgba(0,0,0,0.4)]",
};

export const DisplayView = () => {
  const { id } = useParams<{ id: string }>();
  const { leagues, reloadData } = useLeague();
  const navigate = useNavigate();

  const league = leagues.find((l) => l.id === id);
  const [scrollPosition, setScrollPosition] = useState<"top" | "scrolling">("top");
  const [highlightedPlayers, setHighlightedPlayers] = useState<Set<string>>(new Set());
  const autoScrollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sortedPlayers = useMemo(() => {
    if (!league) return [];
    return [...league.players].sort((a, b) => b.elo - a.elo);
  }, [league]);

  const recentMatches = useMemo(() => {
    if (!league) return [];
    return [...league.matches]
      .filter((m) => isMatchValidated(m, league.anti_cheat_enabled))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [league]);

  const joinUrl = useMemo(() => {
    if (!league) return "";
    return `${window.location.origin}/league/${league.id}`;
  }, [league]);

  // Live screen: poll the server so deletions / un-validations / new matches
  // recorded on another device propagate to the projection without a reload.
  useEffect(() => {
    const interval = setInterval(() => {
      void reloadData();
    }, DISPLAY_REFRESH_MS);
    return () => clearInterval(interval);
  }, [reloadData]);

  useEffect(() => {
    // Depend on the count (primitive), not the league object — otherwise the
    // 15s data poll would reset this timer on every no-op refresh.
    if (sortedPlayers.length <= 10) return;
    const startAutoScroll = () => {
      if (scrollPosition === "top") {
        autoScrollRef.current = setTimeout(() => setScrollPosition("scrolling"), 15000);
      } else {
        autoScrollRef.current = setTimeout(() => setScrollPosition("top"), 12000);
      }
    };
    startAutoScroll();
    return () => {
      if (autoScrollRef.current) clearTimeout(autoScrollRef.current);
    };
  }, [scrollPosition, sortedPlayers.length]);

  const lastMatchIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!league || recentMatches.length === 0) return;
    const lastMatch = recentMatches[0];
    const isNewMatch = lastMatch.id !== lastMatchIdRef.current;

    if (isNewMatch) {
      const playersInMatch = [...lastMatch.teamA, ...lastMatch.teamB];
      setHighlightedPlayers(new Set(playersInMatch));
      setScrollPosition("top");
      const timeout = setTimeout(() => setHighlightedPlayers(new Set()), 5000);
      lastMatchIdRef.current = lastMatch.id;
      return () => clearTimeout(timeout);
    }
  }, [league, recentMatches]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate(`/league/${id}`);
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [id, navigate]);

  if (!league) {
    return (
      <div className="h-screen flex items-center justify-center bg-navy text-white">
        <p className="font-archivo font-extrabold uppercase tracking-tight">
          Ligue introuvable.
        </p>
      </div>
    );
  }

  const top10Players = sortedPlayers.slice(0, 10);
  const remainingPlayers = sortedPlayers.slice(10);

  return (
    <div className="h-screen w-screen bg-navy text-white overflow-hidden relative select-none fixed inset-0">
      {/* Decorative cup pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        {Array.from({ length: 60 }).map((_, i) => (
          <circle
            key={i}
            cx={(i * 67) % 400}
            cy={(i * 93) % 800}
            r="20"
            fill="white"
          />
        ))}
      </svg>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 px-6 md:px-10 py-4 md:py-5 bg-navy/80 backdrop-blur-md border-b border-card z-20">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="font-archivo font-black uppercase tracking-[-1px] text-2xl md:text-5xl truncate leading-none">
              {league.name}
            </h1>
            <div className="flex items-center gap-3 md:gap-5 mt-2 flex-wrap">
              <span className="font-mono text-[10px] md:text-xs uppercase tracking-[2px] font-bold text-cool-gray">
                {league.type === "season" ? "Saison" : "Ligue"}
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-electric-blue/15 border border-electric-blue/40">
                <Zap size={12} className="text-electric-blue animate-pulse" />
                <span className="font-mono text-[10px] md:text-xs uppercase tracking-[2px] font-bold text-electric-blue">
                  Live
                </span>
              </div>
              <span className="font-mono text-[10px] md:text-xs uppercase tracking-[2px] font-bold text-cool-gray">
                {league.matches.length} matchs
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="pt-24 md:pt-32 pb-6 md:pb-8 px-6 md:px-10 lg:px-12 h-full flex flex-col lg:flex-row gap-5 md:gap-8 lg:gap-10 w-full relative z-10">
        {/* Leaderboard */}
        <div className="flex-1 flex flex-col min-w-0">
          <h2 className="font-archivo font-black uppercase tracking-[-0.6px] text-xl md:text-3xl mb-4">
            Classement
          </h2>

          <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
            <div className="space-y-2.5 md:space-y-3 mb-6">
              {top10Players.map((player, index) => {
                const rank = index + 1;
                const isHighlighted = highlightedPlayers.has(player.id);
                const eloChange = recentMatches[0]?.eloChanges?.[player.id] || 0;
                const isWinner = eloChange > 0;
                const isLoser = eloChange < 0;
                const badgeClass =
                  RANK_BADGE[rank] ?? "bg-navy-deep text-cool-gray border-card";

                return (
                  <div
                    key={player.id}
                    className={`bg-navy-soft border-[1.5px] rounded-card px-3 py-3 md:px-5 md:py-4 transition-all duration-500 ${
                      isHighlighted
                        ? "border-electric-blue shadow-[0_3px_0_#0052D4] scale-[1.01]"
                        : isWinner
                        ? "border-lime shadow-[0_3px_0_#8BCC1F]"
                        : isLoser
                        ? "border-signal-red shadow-[0_3px_0_#C42418]"
                        : "border-card"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 md:gap-4">
                      <div className="flex items-center gap-3 md:gap-5 min-w-0 flex-1">
                        <div
                          className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center font-archivo font-black text-lg md:text-2xl rounded-full border-[1.5px] flex-shrink-0 ${badgeClass}`}
                        >
                          {rank}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-archivo font-extrabold uppercase tracking-[-0.4px] text-lg md:text-2xl truncate">
                            {player.name}
                          </div>
                          <div className="font-mono text-[10px] md:text-xs uppercase tracking-[1.5px] text-cool-gray font-bold">
                            {player.wins}V — {player.losses}D
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-archivo font-black text-3xl md:text-5xl tracking-[-1px] text-white leading-none">
                          {player.elo}
                        </div>
                        {eloChange !== 0 && (
                          <div
                            className={`font-archivo font-bold flex items-center justify-end gap-1 mt-1 text-sm md:text-base ${
                              eloChange > 0 ? "text-lime" : "text-signal-red"
                            }`}
                          >
                            {eloChange > 0 ? (
                              <TrendingUp size={16} />
                            ) : (
                              <TrendingDown size={16} />
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

            {remainingPlayers.length > 0 && (
              <div
                className={`space-y-2 transition-all duration-1000 ${
                  scrollPosition === "scrolling"
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-4 pointer-events-none"
                }`}
              >
                {remainingPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className="bg-navy-soft/70 border border-card rounded-card px-4 py-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center font-archivo font-bold text-base bg-navy text-cool-gray rounded-full border border-card">
                          {index + 11}
                        </div>
                        <div>
                          <div className="font-archivo font-bold text-base truncate">
                            {player.name}
                          </div>
                          <div className="font-mono text-[10px] uppercase tracking-[1.5px] text-cool-gray font-bold">
                            {player.wins}V — {player.losses}D
                          </div>
                        </div>
                      </div>
                      <div className="font-archivo font-black text-2xl text-white tracking-tight">
                        {player.elo}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="w-full lg:w-[380px] flex flex-col gap-4 md:gap-6 flex-shrink-0">
          {/* Match feed */}
          <div className="bg-navy-soft border border-card rounded-card p-4 md:p-5">
            <h3 className="font-archivo font-extrabold uppercase tracking-[-0.4px] text-lg md:text-xl mb-3">
              Derniers matchs
            </h3>
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
                    className={`rounded-card border-[1.5px] p-3 transition-all ${
                      index === 0
                        ? "bg-electric-blue/10 border-electric-blue shadow-[0_3px_0_#0052D4]"
                        : "bg-navy/60 border-card"
                    }`}
                  >
                    <div className="font-mono text-[10px] uppercase tracking-[1.5px] text-cool-gray font-bold mb-1.5">
                      {new Date(match.date).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {index === 0 && <span className="ml-2 text-electric-blue">· Dernier</span>}
                    </div>
                    <div className="space-y-0.5">
                      <div
                        className={`truncate ${
                          winnerA
                            ? "font-archivo font-extrabold text-white text-base"
                            : "text-cool-gray text-sm"
                        }`}
                      >
                        {teamANames}{" "}
                        <span className={winnerA ? "text-lime" : "text-cool-gray"}>
                          {match.scoreA}
                        </span>
                      </div>
                      <div
                        className={`truncate ${
                          !winnerA
                            ? "font-archivo font-extrabold text-white text-base"
                            : "text-cool-gray text-sm"
                        }`}
                      >
                        {teamBNames}{" "}
                        <span className={!winnerA ? "text-lime" : "text-cool-gray"}>
                          {match.scoreB}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* QR */}
          <div className="bg-navy-soft border border-card rounded-card p-4 md:p-6 flex flex-col items-center">
            <h3 className="font-archivo font-extrabold uppercase tracking-[-0.4px] text-lg md:text-xl mb-3 text-center">
              Rejoins le live
            </h3>
            <div className="bg-white p-3 md:p-4 rounded-card border-[1.5px] border-white shadow-[0_3px_0_#F4F2E8] mb-3">
              <QRCodeSVG value={joinUrl} size={150} className="md:hidden" />
              <QRCodeSVG value={joinUrl} size={200} className="hidden md:block" />
            </div>
            <p className="font-mono text-[10px] md:text-xs uppercase tracking-[2px] text-cool-gray font-bold text-center">
              Scanne avec ton téléphone
            </p>
          </div>
        </div>
      </div>

      {/* Exit hint */}
      <div className="absolute bottom-3 right-4 font-mono text-[10px] md:text-xs uppercase tracking-[1.5px] text-cool-gray font-bold">
        ESC pour quitter
      </div>
    </div>
  );
};
