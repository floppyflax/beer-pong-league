import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useLeague } from "@/context/LeagueContext";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { StatCard } from "@/components/design-system";
import { MatchEnrichedDisplay } from "@/components/MatchEnrichedDisplay";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { databaseService } from "@/services/DatabaseService";
import { formatRelativeTime } from "@/utils/dateUtils";
import { parsePlayerProfileContext } from "@/utils/playerProfileContext";
import type { Match } from "@/types";

export const PlayerHeadToHead = () => {
  const { playerId, opponentId } = useParams<{
    playerId: string;
    opponentId: string;
  }>();
  const { leagues, events } = useLeague();
  const navigate = useNavigate();
  const location = useLocation();
  const profileContext = useMemo(
    () => parsePlayerProfileContext(location.search),
    [location.search],
  );

  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Resolve player names from leagues (sync) + DB fallback for event participants
  const namesFromLeagues = useMemo(() => {
    const map: Record<string, string> = {};
    leagues.forEach((l) => {
      l.players.forEach((p) => {
        map[p.id] = p.name;
      });
    });
    return map;
  }, [leagues]);

  useEffect(() => {
    if (!playerId || !opponentId) return;
    const missing = [playerId, opponentId].filter((id) => !namesFromLeagues[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    setIsLoading(true);
    Promise.all(
      missing.map((id) =>
        databaseService
          .loadPlayerById(id)
          .then((r) => ({ id, name: r?.player.name ?? null }))
          .catch(() => ({ id, name: null })),
      ),
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, string> = {};
      results.forEach((r) => {
        if (r.name) map[r.id] = r.name;
      });
      setResolvedNames(map);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [playerId, opponentId, namesFromLeagues]);

  // If the context is an event without a league, also pull event participants for naming
  useEffect(() => {
    if (profileContext?.type !== "event") return;
    let cancelled = false;
    databaseService
      .loadEventParticipants(profileContext.id)
      .then((participants) => {
        if (cancelled) return;
        setResolvedNames((prev) => {
          const next = { ...prev };
          participants.forEach((p) => {
            if (!next[p.id]) next[p.id] = p.name;
          });
          return next;
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profileContext]);

  const nameOf = (id: string) =>
    namesFromLeagues[id] ?? resolvedNames[id] ?? `Joueur ${id.slice(0, 8)}`;

  // Collect all matches where both players are on opposite teams, within context
  const matchesH2H = useMemo(() => {
    if (!playerId || !opponentId) return [];
    const items: { match: Match; leagueName: string | null; eventName: string | null }[] = [];
    const involvesBoth = (m: Match) => {
      const aHasMe = m.teamA.includes(playerId);
      const bHasMe = m.teamB.includes(playerId);
      const aHasOpp = m.teamA.includes(opponentId);
      const bHasOpp = m.teamB.includes(opponentId);
      return (aHasMe && bHasOpp) || (bHasMe && aHasOpp);
    };

    if (profileContext?.type === "league") {
      const league = leagues.find((l) => l.id === profileContext.id);
      league?.matches.filter(involvesBoth).forEach((match) => {
        items.push({ match, leagueName: league.name, eventName: null });
      });
    } else if (profileContext?.type === "event") {
      const event = events.find((e) => e.id === profileContext.id);
      if (event) {
        const leagueName = event.leagueId
          ? leagues.find((l) => l.id === event.leagueId)?.name ?? null
          : null;
        event.matches.filter(involvesBoth).forEach((match) => {
          items.push({ match, leagueName, eventName: event.name });
        });
      }
    } else {
      leagues.forEach((league) => {
        league.matches.filter(involvesBoth).forEach((match) => {
          items.push({ match, leagueName: league.name, eventName: null });
        });
      });
      events.forEach((event) => {
        const leagueName = event.leagueId
          ? leagues.find((l) => l.id === event.leagueId)?.name ?? null
          : null;
        event.matches.filter(involvesBoth).forEach((match) => {
          items.push({ match, leagueName, eventName: event.name });
        });
      });
    }
    return items.sort(
      (a, b) =>
        new Date(b.match.date).getTime() - new Date(a.match.date).getTime(),
    );
  }, [playerId, opponentId, profileContext, leagues, events]);

  const { wins, losses } = useMemo(() => {
    if (!playerId) return { wins: 0, losses: 0 };
    let w = 0;
    let l = 0;
    matchesH2H.forEach(({ match }) => {
      const isTeamA = match.teamA.includes(playerId);
      const won =
        (isTeamA && match.scoreA > match.scoreB) ||
        (!isTeamA && match.scoreB > match.scoreA);
      if (won) w++;
      else l++;
    });
    return { wins: w, losses: l };
  }, [matchesH2H, playerId]);

  const totalMatches = matchesH2H.length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  const playerName = playerId ? nameOf(playerId) : "";
  const opponentName = opponentId ? nameOf(opponentId) : "";

  const contextLabel = useMemo(() => {
    if (!profileContext) return null;
    if (profileContext.type === "league") {
      return leagues.find((l) => l.id === profileContext.id)?.name ?? null;
    }
    return events.find((e) => e.id === profileContext.id)?.name ?? null;
  }, [profileContext, leagues, events]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col">
      <ContextualHeader
        title={`${playerName} vs ${opponentName}`}
        showBackButton={true}
        onBack={() => navigate(-1)}
      />

      {contextLabel && (
        <div className="px-4 pt-2 text-sm text-cool-gray truncate">
          {contextLabel}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 px-4 py-4">
        <StatCard value={`${wins}V`} label="Victoires" variant="success" />
        <StatCard value={`${losses}D`} label="Défaites" />
        <StatCard value={`${winRate}%`} label="Win rate" variant="accent" />
      </div>

      <div className="flex-grow overflow-y-auto px-4 py-2 space-y-2 pb-bottom-nav lg:pb-bottom-nav-lg">
        {totalMatches === 0 ? (
          <p className="text-cool-gray text-center py-8">
            Aucun match entre ces deux joueurs.
          </p>
        ) : (
          matchesH2H.map(({ match, leagueName, eventName }) => {
            const isTeamA = match.teamA.includes(playerId!);
            const isWinner =
              (isTeamA && match.scoreA > match.scoreB) ||
              (!isTeamA && match.scoreB > match.scoreA);
            const deltaElo =
              match.eloChanges?.[playerId!] ?? undefined;
            const contextName = eventName ?? leagueName ?? null;
            const teamA = match.teamA.map(nameOf).join(", ");
            const teamB = match.teamB.map(nameOf).join(", ");

            return (
              <div
                key={match.id}
                className={`bg-navy-soft p-4 rounded-xl border ${
                  isWinner ? "border-lime/50" : "border-signal-red/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs text-cool-gray">
                    {formatRelativeTime(match.date)}
                  </span>
                  {contextName && (
                    <span className="text-xs text-cool-gray truncate max-w-[60%]">
                      {contextName}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
                      isWinner
                        ? "bg-lime/20 text-lime"
                        : "bg-signal-red/20 text-signal-red"
                    }`}
                  >
                    {isWinner ? "Victoire" : "Défaite"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div
                    className={`flex-1 truncate ${
                      isTeamA && isWinner
                        ? "text-white font-bold"
                        : "text-cool-gray"
                    }`}
                  >
                    {teamA}
                  </div>
                  <div className="px-3 text-cool-gray flex-shrink-0">
                    {match.scoreA} - {match.scoreB}
                  </div>
                  <div
                    className={`flex-1 text-right truncate ${
                      !isTeamA && isWinner
                        ? "text-white font-bold"
                        : "text-cool-gray"
                    }`}
                  >
                    {teamB}
                  </div>
                </div>
                {deltaElo !== undefined && (
                  <div
                    className={`text-xs mt-1 text-center font-medium ${
                      deltaElo > 0 ? "text-lime" : "text-signal-red"
                    }`}
                  >
                    {deltaElo > 0 ? "+" : ""}
                    {deltaElo} ELO
                  </div>
                )}
                <MatchEnrichedDisplay
                  photoUrl={match.photo_url}
                  cupsRemaining={match.cups_remaining}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

