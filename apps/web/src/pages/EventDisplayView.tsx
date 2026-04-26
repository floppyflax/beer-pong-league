import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { databaseService } from "../services/DatabaseService";
import { TrendingUp, TrendingDown, Zap, Calendar } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Player } from "../types";

export const EventDisplayView = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const variant = searchParams.get("variant") === "drama" ? "drama" : "split";
  const { events, leagues, getEventLocalRanking } = useLeague();
  const navigate = useNavigate();

  const event = events.find((t) => t.id === id);
  const league = event?.leagueId
    ? leagues.find((l) => l.id === event.leagueId)
    : null;

  const [scrollPosition, setScrollPosition] = useState<"top" | "scrolling">("top");
  const [highlightedPlayers, setHighlightedPlayers] = useState<Set<string>>(new Set());
  const [eventParticipants, setEventParticipants] = useState<Player[]>([]);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!id) return;
    databaseService
      .loadEventParticipants(id)
      .then((participants) =>
        setEventParticipants(
          participants.map((p) => ({
            id: p.id,
            name: p.name,
            elo: p.elo,
            wins: p.wins,
            losses: p.losses,
            matchesPlayed: p.matchesPlayed,
            streak: 0,
          })),
        ),
      )
      .catch(() => setEventParticipants([]));
  }, [id, event?.matches?.length]);

  // Get sorted players (local ranking for event) - use participants for correct IDs
  const sortedPlayers = useMemo(() => {
    if (!event) return [];
    return getEventLocalRanking(event.id, eventParticipants);
  }, [event, eventParticipants, getEventLocalRanking]);

  // Get recent matches
  const recentMatches = useMemo(() => {
    if (!event) return [];
    return [...event.matches]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [event]);

  // Generate join URL (points to join page)
  const joinUrl = useMemo(() => {
    if (!event) return "";
    return `${window.location.origin}/event/${event.id}/join`;
  }, [event]);

  // Auto-scroll logic
  useEffect(() => {
    if (!event || sortedPlayers.length <= 10) return;

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
  }, [scrollPosition, event, sortedPlayers.length]);

  // Track last match ID to detect new matches
  const lastMatchIdRef = useRef<string | null>(null);

  // Highlight players after match
  useEffect(() => {
    if (!event || recentMatches.length === 0) return;

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
  }, [event, recentMatches]);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(`/event/${id}`);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [id, navigate]);

  if (!event) {
    return (
      <div className="h-screen flex items-center justify-center bg-navy text-white">
        <p>Événement introuvable.</p>
      </div>
    );
  }

  const top10Players = sortedPlayers.slice(0, 10);
  const remainingPlayers = sortedPlayers.slice(10);

  // Get player names from league if available, or from sorted players
  const getPlayerName = (playerId: string): string => {
    // First try from sorted players (works for both league-linked and autonomous events)
    const player = sortedPlayers.find((p) => p.id === playerId);
    if (player) return player.name;
    
    // Fallback to league if available
    if (league) {
      const leaguePlayer = league.players.find((p) => p.id === playerId);
      return leaguePlayer?.name || "Joueur";
    }
    return "Joueur";
  };

  if (variant === "drama") {
    const liveMatch = recentMatches[0];
    const teamANames = liveMatch
      ? liveMatch.teamA.map((pid) => getPlayerName(pid)).join(" & ")
      : "Équipe A";
    const teamBNames = liveMatch
      ? liveMatch.teamB.map((pid) => getPlayerName(pid)).join(" & ")
      : "Équipe B";
    const scoreA = liveMatch?.scoreA ?? 0;
    const scoreB = liveMatch?.scoreB ?? 0;
    return (
      <div className="h-screen w-screen bg-white text-navy overflow-hidden relative select-none fixed inset-0 font-sans">
        <div className="absolute inset-0">
          <div
            className="absolute top-0 left-0 w-[60%] h-full bg-signal-red"
            style={{ clipPath: "polygon(0 0, 100% 0, 70% 100%, 0 100%)" }}
          />
          <div
            className="absolute top-0 right-0 w-[60%] h-full bg-electric-blue"
            style={{ clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%)" }}
          />
        </div>
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center px-10 py-5 justify-between">
            <div className="font-archivo font-extrabold uppercase tracking-tight text-navy text-lg">
              Beer Pong ELO
            </div>
            <div className="text-center font-mono text-[11px] tracking-[0.2em] uppercase opacity-80">
              <span className="text-lime font-bold">● LIVE</span> · {event.name}
            </div>
            <span className="font-mono text-xs">
              {new Date().toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex-1 grid grid-cols-2 items-center">
            <div className="px-10 pb-10 text-center">
              <div className="font-mono text-[10px] tracking-[0.3em] opacity-60 mb-5">
                ÉQUIPE A
              </div>
              <div
                className="font-archivo font-black text-navy"
                style={{
                  fontSize: 220,
                  lineHeight: 1,
                  letterSpacing: "-8px",
                  textShadow: "0 4px 40px rgba(0,0,0,0.3)",
                }}
              >
                {scoreA}
              </div>
              <div className="font-archivo font-black text-2xl uppercase tracking-tight mt-3 text-navy">
                {teamANames}
              </div>
            </div>
            <div className="px-10 pb-10 text-center">
              <div className="font-mono text-[10px] tracking-[0.3em] opacity-60 mb-5">
                ÉQUIPE B
              </div>
              <div
                className="font-archivo font-black text-navy"
                style={{
                  fontSize: 220,
                  lineHeight: 1,
                  letterSpacing: "-8px",
                  textShadow: "0 4px 40px rgba(0,0,0,0.3)",
                }}
              >
                {scoreB}
              </div>
              <div className="font-archivo font-black text-2xl uppercase tracking-tight mt-3 text-navy">
                {teamBNames}
              </div>
            </div>
          </div>
          <div className="px-10 py-3.5 bg-black/35 flex justify-between font-mono text-xs tracking-wider uppercase">
            <span>
              Code ·{" "}
              <span className="text-lime font-bold">
                {event.joinCode || "—"}
              </span>
            </span>
            <span className="opacity-70">{event.matches.length} matchs joués</span>
            <span className="opacity-70">Appuyez sur ESC pour quitter</span>
          </div>
        </div>
      </div>
    );
  }

  const RANK_BADGE: Record<number, string> = {
    1: "bg-ping-yellow text-navy border-ping-yellow-deep shadow-[0_3px_0_#D9B400]",
    2: "bg-cool-gray text-navy border-cool-gray shadow-[0_3px_0_rgba(0,0,0,0.4)]",
    3: "bg-bronze text-white border-bronze shadow-[0_3px_0_rgba(0,0,0,0.4)]",
  };

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
          <circle key={i} cx={(i * 67) % 400} cy={(i * 93) % 800} r="20" fill="white" />
        ))}
      </svg>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 px-6 md:px-10 py-4 md:py-5 bg-navy/80 backdrop-blur-md border-b border-card z-20">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="font-archivo font-black uppercase tracking-[-1px] text-2xl md:text-5xl truncate leading-none">
              {event.name}
            </h1>
            <div className="flex items-center gap-3 md:gap-5 mt-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-cool-gray">
                <Calendar size={12} />
                <span className="font-mono text-[10px] md:text-xs uppercase tracking-[2px] font-bold">
                  {new Date(event.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-electric-blue/15 border border-electric-blue/40">
                <Zap size={12} className="text-electric-blue animate-pulse" />
                <span className="font-mono text-[10px] md:text-xs uppercase tracking-[2px] font-bold text-electric-blue">
                  Live
                </span>
              </div>
              <span className="font-mono text-[10px] md:text-xs uppercase tracking-[2px] font-bold text-cool-gray">
                {event.matches.length} matchs
              </span>
              {event.isFinished && (
                <span className="font-mono text-[10px] md:text-xs uppercase tracking-[2px] font-bold bg-lime/15 text-lime px-2.5 py-1 rounded-full border border-lime/40">
                  Terminé
                </span>
              )}
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
                const teamANames = match.teamA.map((id) => getPlayerName(id)).join(", ");
                const teamBNames = match.teamB.map((id) => getPlayerName(id)).join(", ");
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

