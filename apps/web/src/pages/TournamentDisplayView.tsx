import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { databaseService } from "../services/DatabaseService";
import { TrendingUp, TrendingDown, Zap, Calendar } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Player } from "../types";

export const TournamentDisplayView = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const variant = searchParams.get("variant") === "drama" ? "drama" : "split";
  const { tournaments, leagues, getTournamentLocalRanking } = useLeague();
  const navigate = useNavigate();

  const tournament = tournaments.find((t) => t.id === id);
  const league = tournament?.leagueId
    ? leagues.find((l) => l.id === tournament.leagueId)
    : null;

  const [scrollPosition, setScrollPosition] = useState<"top" | "scrolling">("top");
  const [highlightedPlayers, setHighlightedPlayers] = useState<Set<string>>(new Set());
  const [tournamentParticipants, setTournamentParticipants] = useState<Player[]>([]);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!id) return;
    databaseService
      .loadTournamentParticipants(id)
      .then((participants) =>
        setTournamentParticipants(
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
      .catch(() => setTournamentParticipants([]));
  }, [id, tournament?.matches?.length]);

  // Get sorted players (local ranking for tournament) - use participants for correct IDs
  const sortedPlayers = useMemo(() => {
    if (!tournament) return [];
    return getTournamentLocalRanking(tournament.id, tournamentParticipants);
  }, [tournament, tournamentParticipants, getTournamentLocalRanking]);

  // Get recent matches
  const recentMatches = useMemo(() => {
    if (!tournament) return [];
    return [...tournament.matches]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [tournament]);

  // Generate join URL (points to join page)
  const joinUrl = useMemo(() => {
    if (!tournament) return "";
    return `${window.location.origin}/tournament/${tournament.id}/join`;
  }, [tournament]);

  // Auto-scroll logic
  useEffect(() => {
    if (!tournament || sortedPlayers.length <= 10) return;

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
  }, [scrollPosition, tournament, sortedPlayers.length]);

  // Track last match ID to detect new matches
  const lastMatchIdRef = useRef<string | null>(null);

  // Highlight players after match
  useEffect(() => {
    if (!tournament || recentMatches.length === 0) return;

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
  }, [tournament, recentMatches]);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(`/tournament/${id}`);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [id, navigate]);

  if (!tournament) {
    return (
      <div className="h-screen flex items-center justify-center bg-navy text-white">
        <p>Tournoi introuvable.</p>
      </div>
    );
  }

  const top10Players = sortedPlayers.slice(0, 10);
  const remainingPlayers = sortedPlayers.slice(10);

  // Get player names from league if available, or from sorted players
  const getPlayerName = (playerId: string): string => {
    // First try from sorted players (works for both league-linked and autonomous tournaments)
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
              <span className="text-lime font-bold">● LIVE</span> · {tournament.name}
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
                {tournament.joinCode || "—"}
              </span>
            </span>
            <span className="opacity-70">{tournament.matches.length} matchs joués</span>
            <span className="opacity-70">Appuyez sur ESC pour quitter</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-navy-deep text-white overflow-hidden relative select-none fixed inset-0">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 bg-navy/80 backdrop-blur-md border-b border-card/50 z-20">
        <div className="flex items-center justify-between w-full px-4 md:px-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-4xl font-black mb-1 md:mb-2 truncate">{tournament.name}</h1>
            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-cool-gray">
                <Calendar size={16} className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm uppercase tracking-wider font-bold">
                  {new Date(tournament.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-electric-blue">
                <Zap size={16} className="animate-pulse w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm font-bold">LIVE</span>
              </div>
              <span className="text-xs md:text-sm text-cool-gray">
                {tournament.matches.length} matchs
              </span>
              {tournament.isFinished && (
                <span className="text-[10px] md:text-xs bg-lime/20 text-lime px-2 md:px-3 py-0.5 md:py-1 rounded-full font-bold">
                  Terminé
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 md:pt-28 pb-4 md:pb-8 px-4 md:px-8 lg:px-12 h-full flex flex-col lg:flex-row gap-4 md:gap-8 lg:gap-12 w-full">
        {/* Left: Leaderboard */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="mb-4 md:mb-6">
            <h2 className="text-xl md:text-3xl font-black mb-2">Classement Tournoi</h2>
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
                    className={`bg-navy-soft/90 backdrop-blur-sm p-3 md:p-5 rounded-card border-2 transition-all duration-700 ${
                      isHighlighted
                        ? "border-signal-red shadow-2xl shadow-cup-red/50 scale-[1.02]"
                        : "border-card/50"
                    } ${isWinner ? "ring-4 ring-lime/30" : ""} ${
                      isLoser ? "ring-4 ring-signal-red/30" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 md:gap-4">
                      <div className="flex items-center gap-3 md:gap-6 min-w-0 flex-1">
                        <div
                          className={`w-12 h-12 md:w-16 md:h-16 flex items-center justify-center font-black text-lg md:text-2xl rounded-lg md:rounded-xl flex-shrink-0 ${
                            index === 0
                              ? "bg-ping-yellow text-navy"
                              : index === 1
                              ? "bg-cool-gray text-navy"
                              : index === 2
                              ? "bg-ping-yellow text-white"
                              : "bg-navy-deep text-cool-gray"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-lg md:text-2xl font-black mb-0.5 md:mb-1 truncate">{player.name}</div>
                          <div className="text-sm md:text-base text-cool-gray">
                            {player.wins}V - {player.losses}D
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl md:text-4xl font-black text-signal-red">
                          {player.elo}
                        </div>
                        {eloChange !== 0 && (
                          <div
                            className={`text-sm md:text-base font-bold flex items-center justify-end gap-1 mt-0.5 md:mt-1 ${
                              eloChange > 0 ? "text-lime" : "text-signal-red"
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
                    className="bg-navy-soft/60 backdrop-blur-sm p-3 rounded-lg border border-card/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center font-bold text-lg bg-navy-deep text-cool-gray rounded">
                          {index + 11}
                        </div>
                        <div>
                          <div className="text-lg font-bold">{player.name}</div>
                          <div className="text-xs text-cool-gray">
                            {player.wins}V - {player.losses}D
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl font-black text-signal-red">
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
          <div className="bg-navy-soft/90 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-card/50">
            <h3 className="text-lg md:text-xl font-black mb-3 md:mb-4">Derniers matchs</h3>
            <div className="space-y-2">
              {recentMatches.map((match, index) => {
                const teamANames = match.teamA
                  .map((id) => getPlayerName(id))
                  .join(", ");
                const teamBNames = match.teamB
                  .map((id) => getPlayerName(id))
                  .join(", ");
                const winnerA = match.scoreA > match.scoreB;

                return (
                  <div
                    key={match.id}
                    className={`p-3 md:p-4 rounded-lg md:rounded-xl border-2 transition-all ${
                      index === 0
                        ? "bg-signal-red/20 border-signal-red/50 shadow-lg"
                        : "bg-navy-deep/40 border-card/50"
                    }`}
                  >
                    <div className="text-xs md:text-sm text-cool-gray mb-1 md:mb-2 font-bold">
                      {new Date(match.date).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-sm md:text-base">
                      <div
                        className={winnerA ? "font-black text-white text-base md:text-lg truncate" : "text-cool-gray truncate"}
                      >
                        {teamANames}
                      </div>
                      <div className="text-cool-gray text-center my-1 md:my-2 font-bold">VS</div>
                      <div
                        className={!winnerA ? "font-black text-white text-base md:text-lg truncate" : "text-cool-gray truncate"}
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
          <div className="bg-navy-soft/90 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-card/50 flex flex-col items-center">
            <h3 className="text-lg md:text-xl font-black mb-3 md:mb-4 text-center">
              Rejoins le tournoi !
            </h3>
            <div className="bg-white p-3 md:p-5 rounded-lg md:rounded-xl mb-3 md:mb-4 shadow-2xl">
              <QRCodeSVG value={joinUrl} size={150} className="md:hidden" />
              <QRCodeSVG value={joinUrl} size={200} className="hidden md:block" />
            </div>
            <p className="text-xs md:text-sm text-cool-gray text-center font-medium">
              Scanne avec ton téléphone
            </p>
          </div>
        </div>
      </div>

      {/* Exit hint */}
      <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 text-[10px] md:text-xs text-cool-gray">
        Appuyez sur ESC pour quitter
      </div>
    </div>
  );
};

