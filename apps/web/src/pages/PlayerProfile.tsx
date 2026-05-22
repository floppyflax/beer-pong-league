/**
 * PlayerProfile — Story 14-20, 14-35
 *
 * Page profil joueur alignée avec le design system (design-system-convergence §5.4).
 * Story 14-35: Avatar photo, Membre depuis, streak "En feu !", matchs enrichis, head-to-head avatars, ELO graph.
 */

import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "@/context/LeagueContext";
import { useAuthContext } from "@/context/AuthContext";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { StatCard, ListRow, Sheet } from "@/components/design-system";
import { PButton } from "@/components/ponglo/PButton";
import { WebcamCaptureSheet } from "@/components/WebcamCaptureSheet";
import { PhotoService } from "@/services/PhotoService";
import { supportsGetUserMedia } from "@/utils/platform";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { databaseService } from "@/services/DatabaseService";
import toast from "react-hot-toast";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Flame,
  Medal,
  Activity,
  Heart,
  Skull,
  Camera,
  Pencil,
  Check,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { formatRelativeTime, formatJoinedSince } from "@/utils/dateUtils";
import {
  MatchEnrichedDisplay,
  hasMatchEnrichedContent,
} from "@/components/MatchEnrichedDisplay";
import { MatchTeamsRow } from "@/components/match/MatchTeamsRow";
import { EloChart } from "@/components/ponglo/EloChart";
import { PAvatar } from "@/components/ponglo/PAvatar";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import type { Achievement } from "@/components/achievements/AchievementCard";
import { supabase, isSupabaseAvailable } from "@/lib/supabase";
import {
  computeBestAlly,
  computeFormTrend,
  computeNemesis,
  computeWinRateByFormat,
} from "@/utils/playerStatsAdvanced";
import type { Player } from "@/types";
import type { Match } from "@/types";

export const PlayerProfile = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const { leagues, events } = useLeague();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [fetchedPlayer, setFetchedPlayer] = useState<{
    player: Player;
    playerLeague: { id: string; name: string } | null;
    playersMap: Record<string, string>;
    avatarUrl?: string | null;
    joinedAt?: string | null;
    eventId?: string | null;
    globalPlayerId?: string | null;
    userId?: string | null;
  } | null>(null);
  const [enrichment, setEnrichment] = useState<{
    avatarUrl: string | null;
    joinedAt: string | null;
    userId: string | null;
    anonymousUserId: string | null;
    globalPlayerId: string | null;
  } | null>(null);
  // Admin edits of a ghost player — local overrides reflect changes immediately
  // (fetched-from-DB players are not in the league context that reloadData refreshes).
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const [avatarOverride, setAvatarOverride] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showAvatarSourceSheet, setShowAvatarSourceSheet] = useState(false);
  const [showWebcamSheet, setShowWebcamSheet] = useState(false);
  const [opponentAvatars, setOpponentAvatars] = useState<Record<string, string | null>>({});
  const [eloHistoryFromDb, setEloHistoryFromDb] = useState<{ date: string; elo: number }[]>([]);
  const [playerNotFound, setPlayerNotFound] = useState(false);
  const [isLoadingPlayer, setIsLoadingPlayer] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Find player in leagues first (sync)
  let player: Player | null = null;
  let playerLeague: { id: string; name: string } | null = null;

  for (const league of leagues) {
    const foundPlayer = league.players.find((p) => p.id === playerId);
    if (foundPlayer) {
      player = foundPlayer;
      playerLeague = { id: league.id, name: league.name };
      break;
    }
  }

  // If not in leagues, fetch from DB (event players, or league players from leagues we're not in)
  useEffect(() => {
    if (!playerId || player) {
      setFetchedPlayer(null);
      setPlayerNotFound(false);
      setIsLoadingPlayer(false);
      return;
    }
    let cancelled = false;
    setIsLoadingPlayer(true);
    setPlayerNotFound(false);
    databaseService
      .loadPlayerById(playerId)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setIsLoadingPlayer(false);
          setPlayerNotFound(true);
          setFetchedPlayer(null);
          return;
        }
        const { player: p, leagueId, leagueName, eventId, globalPlayerId, userId } = result;
        const playersMap: Record<string, string> = {};
        leagues.forEach((l) => {
          l.players.forEach((pl) => {
            playersMap[pl.id] = pl.name;
          });
        });
        playersMap[p.id] = p.name;

        const basePayload = {
          player: p,
          playerLeague: leagueName ? { id: leagueId!, name: leagueName } : null,
          playersMap: {} as Record<string, string>,
          avatarUrl: null, // TODO(Phase B): restore via loadPlayerEnrichment
          joinedAt: null,  // TODO(Phase B): restore via loadPlayerEnrichment
          eventId: eventId ?? null,
          globalPlayerId: globalPlayerId ?? null,
          userId: userId ?? null,
        };

        if (eventId) {
          databaseService.loadEventParticipants(eventId).then((participants) => {
            if (cancelled) return;
            const map = { ...playersMap };
            participants.forEach((tp) => {
              map[tp.id] = tp.name;
            });
            setFetchedPlayer({ ...basePayload, playersMap: map });
            setIsLoadingPlayer(false);
          });
        } else {
          setFetchedPlayer({ ...basePayload, playersMap });
          setIsLoadingPlayer(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[PlayerProfile] loadPlayerById failed:", err);
          setIsLoadingPlayer(false);
          setPlayerNotFound(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [playerId, player, leagues]);

  // Story 14-35: Load enrichment (avatar, joined_at, userId) — for league players or when we need userId for ELO history
  useEffect(() => {
    if (!playerId || !player) {
      setEnrichment(null);
      return;
    }
    let cancelled = false;
    databaseService.loadPlayerEnrichment(playerId).then((result) => {
      if (cancelled) return;
      setEnrichment(result ? { ...result, anonymousUserId: null } : null);
    }).catch(() => {
      if (!cancelled) setEnrichment(null);
    });
    return () => { cancelled = true; };
  }, [playerId, player]);

  // Story 14-35: Load ELO history from DB when we have user identity (fallback to match data in eloEvolution)
  // TODO(Phase B): restore loadEloHistoryForPlayer once method is added to DatabaseService
  useEffect(() => {
    setEloHistoryFromDb([]); // stub until loadEloHistoryForPlayer is implemented
  }, [enrichment, playerLeague?.id]);

  // Phase D.3: Load achievements for this player from Supabase
  useEffect(() => {
    if (!playerId || !isSupabaseAvailable() || !supabase) {
      setAchievements([]);
      return;
    }
    const client = supabase as any; // player_achievements not yet in generated types
    client
      .from("player_achievements")
      .select("earned_at, achievements(slug, label, description, icon_key)")
      .eq("player_id", playerId)
      .then(({ data }: { data: Record<string, unknown>[] | null }) => {
        if (!data) return;
        const parsed: Achievement[] = data.map((row) => {
          const def = row["achievements"] as Record<string, unknown>;
          return {
            slug: String(def["slug"]),
            label: String(def["label"]),
            description: String(def["description"]),
            icon_key: String(def["icon_key"]),
            earned_at: String(row["earned_at"]),
          };
        });
        setAchievements(parsed);
      });
  }, [playerId]);

  if (fetchedPlayer) {
    player = fetchedPlayer.player;
    playerLeague = fetchedPlayer.playerLeague;
  }

  // Hooks MUST be called unconditionally before any early returns (Rules of Hooks)
  const currentPlayer = player;

  // Story 14-35: Build player matches with league/event context for display
  const playerMatchesWithContext = useMemo(() => {
    if (!currentPlayer) return [];
    const items: { match: Match; leagueName: string | null; eventName: string | null }[] = [];
    leagues.forEach((league) => {
      league.matches.forEach((match) => {
        if (
          match.teamA.includes(currentPlayer.id) ||
          match.teamB.includes(currentPlayer.id)
        ) {
          items.push({ match, leagueName: league.name, eventName: null });
        }
      });
    });
    events.forEach((event) => {
      event.matches.forEach((match) => {
        if (
          match.teamA.includes(currentPlayer.id) ||
          match.teamB.includes(currentPlayer.id)
        ) {
          const leagueName = event.leagueId
            ? leagues.find((l) => l.id === event.leagueId)?.name ?? null
            : null;
          items.push({
            match,
            leagueName,
            eventName: event.name,
          });
        }
      });
    });
    return items.sort(
      (a, b) =>
        new Date(a.match.date).getTime() - new Date(b.match.date).getTime(),
    );
  }, [leagues, events, currentPlayer]);

  const playerMatches = playerMatchesWithContext.map((x) => x.match);
  const sortedMatches = playerMatches;

  // Head-to-head stats (needed for opponent IDs and display)
  const headToHead = useMemo(() => {
    const h2h: Record<string, { wins: number; losses: number }> = {};
    playerMatches.forEach((match) => {
      const opponents = [
        ...match.teamA.filter((id) => id !== currentPlayer?.id),
        ...match.teamB.filter((id) => id !== currentPlayer?.id),
      ];
      const isWinner =
        (match.teamA.includes(currentPlayer!.id) && match.scoreA > match.scoreB) ||
        (match.teamB.includes(currentPlayer!.id) && match.scoreB > match.scoreA);
      opponents.forEach((opponentId) => {
        if (!h2h[opponentId]) h2h[opponentId] = { wins: 0, losses: 0 };
        if (isWinner) h2h[opponentId].wins++;
        else h2h[opponentId].losses++;
      });
    });
    return h2h;
  }, [playerMatches, currentPlayer]);

  const headToHeadOpponentIds = useMemo(
    () =>
      Object.entries(headToHead)
        .sort((a, b) => b[1].wins + b[1].losses - (a[1].wins + a[1].losses))
        .slice(0, 5)
        .map(([id]) => id),
    [headToHead],
  );

  // TODO(Phase B): restore loadAvatarUrlsForPlayerIds once method is added to DatabaseService
  useEffect(() => {
    setOpponentAvatars({}); // stub until loadAvatarUrlsForPlayerIds is implemented
  }, [headToHeadOpponentIds.join(",")]);

  const eloEvolution = useMemo(() => {
    if (!currentPlayer) return [];
    // Story 14-35: Prefer elo_history from DB when available (monthly aggregation)
    if (eloHistoryFromDb.length > 0) return eloHistoryFromDb;
    // Fallback: compute from match data
    const evolution: { date: string; elo: number }[] = [];
    let currentElo = 1000;
    evolution.push({
      date: sortedMatches[0]?.date || new Date().toISOString(),
      elo: currentElo,
    });
    sortedMatches.forEach((match) => {
      if (
        currentPlayer &&
        match.eloChanges &&
        match.eloChanges[currentPlayer.id] !== undefined
      ) {
        currentElo += match.eloChanges[currentPlayer.id];
        evolution.push({ date: match.date, elo: currentElo });
      }
    });
    return evolution;
  }, [sortedMatches, currentPlayer, eloHistoryFromDb]);

  const playersMap = useMemo(() => {
    const map: Record<string, string> = {};
    leagues.forEach((l) => {
      l.players.forEach((pl) => {
        map[pl.id] = pl.name;
      });
    });
    if (fetchedPlayer?.playersMap) Object.assign(map, fetchedPlayer.playersMap);
    if (player) map[player.id] = player.name;
    return map;
  }, [leagues, player, fetchedPlayer]);

  const statsByLeague = useMemo(() => {
    if (!player) return {};
    const stats: Record<
      string,
      { leagueName: string; matches: number; wins: number; losses: number; elo: number; winRate: number }
    > = {};
    leagues.forEach((league) => {
      if (!currentPlayer) return;
      const leagueMatches = league.matches.filter(
        (match) =>
          match.teamA.includes(currentPlayer.id) || match.teamB.includes(currentPlayer.id),
      );
      if (leagueMatches.length > 0) {
        const wins = leagueMatches.filter((match) => {
          const isTeamA = match.teamA.includes(currentPlayer.id);
          const winner = match.scoreA > match.scoreB ? "A" : "B";
          return (isTeamA && winner === "A") || (!isTeamA && winner === "B");
        }).length;
        const leaguePlayer = league.players.find((p) => p.id === currentPlayer.id);
        stats[league.id] = {
          leagueName: league.name,
          matches: leagueMatches.length,
          wins,
          losses: leagueMatches.length - wins,
          elo: leaguePlayer?.elo || 1000,
          winRate: Math.round((wins / leagueMatches.length) * 100),
        };
      }
    });
    return stats;
  }, [leagues, currentPlayer]);

  const formatWinRates = useMemo(
    () => (currentPlayer ? computeWinRateByFormat(currentPlayer.id, playerMatches) : []),
    [currentPlayer, playerMatches],
  );

  const bestAlly = useMemo(
    () => (currentPlayer ? computeBestAlly(currentPlayer.id, playerMatches) : null),
    [currentPlayer, playerMatches],
  );

  const nemesis = useMemo(
    () => (currentPlayer ? computeNemesis(currentPlayer.id, playerMatches) : null),
    [currentPlayer, playerMatches],
  );

  const formTrend = useMemo(
    () => (currentPlayer ? computeFormTrend(currentPlayer.id, playerMatches) : null),
    [currentPlayer, playerMatches],
  );

  // Early returns AFTER all hooks
  if (isLoadingPlayer && !player) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!player && playerNotFound) {
    return (
      <div className="p-4 text-center">
        <p className="text-cool-gray">Joueur introuvable.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-signal-red mt-4 font-semibold"
        >
          Retour
        </button>
      </div>
    );
  }

  if (!player) {
    return null;
  }

  const playerWins = playerMatches.filter((match) => {
    const isTeamA = match.teamA.includes(player!.id);
    const winner = match.scoreA > match.scoreB ? "A" : "B";
    return (isTeamA && winner === "A") || (!isTeamA && winner === "B");
  }).length;
  const currentPlayerId = player!.id;

  const playerLosses = playerMatches.length - playerWins;
  const winRate =
    playerMatches.length > 0
      ? Math.round((playerWins / playerMatches.length) * 100)
      : 0;

  // Story 14-35: Resolve avatar and joined_at (from fetchedPlayer or enrichment)
  const avatarUrl =
    avatarOverride ?? fetchedPlayer?.avatarUrl ?? enrichment?.avatarUrl ?? null;
  const joinedAt = fetchedPlayer?.joinedAt ?? enrichment?.joinedAt ?? null;
  const displayName = nameOverride ?? player.name;

  // ── Admin edit of ghost players (no user attached) ───────────────────────
  // Ghost = the underlying players row has user_id IS NULL. Admin = the viewer
  // created the league or event this player belongs to.
  const ownerUserId = fetchedPlayer
    ? fetchedPlayer.userId
    : enrichment
      ? enrichment.userId
      : undefined;
  const globalPlayerId =
    fetchedPlayer?.globalPlayerId ?? enrichment?.globalPlayerId ?? null;
  const contextEventId = fetchedPlayer?.eventId ?? null;
  const isGhost = ownerUserId === null;
  const canAdminEdit = (() => {
    if (!user) return false;
    if (playerLeague) {
      const lg = leagues.find((l) => l.id === playerLeague.id);
      if (lg?.creator_user_id === user.id) return true;
    }
    if (contextEventId) {
      const ev = events.find((e) => e.id === contextEventId);
      if (ev?.creator_user_id === user.id) return true;
    }
    return false;
  })();
  const showAdminEdit = canAdminEdit && isGhost && Boolean(globalPlayerId);

  const startEditName = () => {
    setEditedName(displayName);
    setIsEditingName(true);
  };
  const cancelEditName = () => {
    setIsEditingName(false);
    setEditedName("");
  };
  const saveEditName = async () => {
    const trimmed = editedName.trim();
    if (!trimmed || trimmed === displayName || !globalPlayerId) {
      cancelEditName();
      return;
    }
    setIsSavingName(true);
    try {
      await databaseService.updateGhostPlayerIdentity(globalPlayerId, { pseudo: trimmed });
      // Local override reflects the change immediately on this profile. We do
      // NOT call reloadData() here: it resets the global league/event context
      // (isLoadingInitialData + full array replacement), which blanks the page
      // mid-edit. Other views pick up the rename on their next natural load.
      setNameOverride(trimmed);
      setIsEditingName(false);
      toast.success("Nom mis à jour");
    } catch {
      toast.error("Impossible de mettre à jour le nom");
    } finally {
      setIsSavingName(false);
    }
  };

  const uploadAvatarFromBlob = async (blob: Blob) => {
    if (!user?.id || !globalPlayerId) return;
    setIsUploadingAvatar(true);
    try {
      const mime = blob.type || "image/jpeg";
      const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
      const file = new File([blob], `avatar.${ext}`, { type: mime });
      const url = await databaseService.uploadGhostAvatar(user.id, globalPlayerId, file);
      if (!url) throw new Error("upload failed");
      await databaseService.updateGhostPlayerIdentity(globalPlayerId, { avatarUrl: url });
      // Local override only — see saveEditName for why we avoid reloadData().
      setAvatarOverride(url);
      toast.success("Photo mise à jour");
    } catch {
      toast.error("Impossible d'uploader la photo");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePickAvatar = async (source: "camera" | "gallery") => {
    if (!globalPlayerId) return;
    setShowAvatarSourceSheet(false);
    if (source === "camera" && supportsGetUserMedia()) {
      setShowWebcamSheet(true);
      return;
    }
    try {
      const result =
        source === "camera"
          ? await PhotoService.takePhoto()
          : await PhotoService.pickFromGallery();
      await uploadAvatarFromBlob(result.blob);
    } catch (err) {
      if (err instanceof Error && err.message === "No file selected") return;
      toast.error("Impossible d'uploader la photo");
    }
  };

  const handleWebcamCapture = async (blob: Blob) => {
    setShowWebcamSheet(false);
    await uploadAvatarFromBlob(blob);
  };

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col">
      {/* AC1: Header — nom + retour */}
      <ContextualHeader
        title={displayName}
        showBackButton={true}
        onBack={() => navigate(-1)}
      />

      {/* AC1, AC2: PAvatar 72px + infos + Membre depuis */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0 group">
            <PAvatar
              name={displayName}
              size={72}
              imageUrl={avatarUrl ?? undefined}
              ring="#B7FF3B"
            />
            {showAdminEdit && (
              <button
                type="button"
                onClick={() => setShowAvatarSourceSheet(true)}
                disabled={isUploadingAvatar}
                aria-label="Changer la photo du joueur"
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity disabled:cursor-wait"
              >
                {isUploadingAvatar ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={18} className="text-white" />
                )}
              </button>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void saveEditName();
                    if (e.key === "Escape") cancelEditName();
                  }}
                  maxLength={50}
                  autoFocus
                  className="flex-1 min-w-0 bg-navy-deep border border-electric-blue rounded-md px-3 py-1.5 text-white text-base font-archivo font-extrabold uppercase tracking-tight focus:outline-none focus:ring-2 focus:ring-electric-blue/30"
                />
                <button
                  type="button"
                  onClick={() => void saveEditName()}
                  disabled={isSavingName}
                  aria-label="Valider"
                  className="w-8 h-8 rounded-full bg-lime text-navy flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={cancelEditName}
                  aria-label="Annuler"
                  className="w-8 h-8 rounded-full border border-card text-cool-gray flex items-center justify-center flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-archivo font-extrabold uppercase tracking-tight text-white truncate">
                  {displayName}
                </h2>
                {showAdminEdit && (
                  <button
                    type="button"
                    onClick={startEditName}
                    aria-label="Modifier le nom du joueur"
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-cool-gray hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                )}
              </div>
            )}
            {playerLeague && (
              <p className="text-sm text-cool-gray truncate">
                {playerLeague.name}
              </p>
            )}
            {joinedAt && (
              <p className="text-xs text-cool-gray mt-0.5">
                {formatJoinedSince(joinedAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AC3: StatCards (ELO, W/L, Win rate) */}
      <div className="grid grid-cols-3 gap-2 px-4 py-4">
        <StatCard value={player.elo} label="ELO" variant="accent" />
        <StatCard
          value={`${playerWins}V - ${playerLosses}D`}
          label="W/L"
        />
        <StatCard value={`${winRate}%`} label="Win rate" variant="success" />
      </div>

      {/* AC3, AC4: Streak card — "En feu !" variant when streak >= 3 */}
      <div className="px-4 pb-4">
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            player.streak >= 3
              ? "bg-ping-yellow/20 border-ping-yellow/50"
              : player.streak > 0
                ? "bg-lime/20 border-lime/50"
                : player.streak < 0
                  ? "bg-signal-red/20 border-signal-red/50"
                  : "bg-navy-soft/50 border-card/50"
          }`}
        >
          {player.streak >= 3 ? (
            <Flame className="text-ping-yellow flex-shrink-0" size={24} />
          ) : player.streak > 0 ? (
            <TrendingUp className="text-lime flex-shrink-0" size={24} />
          ) : player.streak < 0 ? (
            <TrendingDown className="text-signal-red flex-shrink-0" size={24} />
          ) : null}
          <div className="min-w-0">
            <div className="font-bold text-white">
              {player.streak >= 3
                ? "En feu !"
                : player.streak > 0
                  ? `${player.streak} victoires d'affilée`
                  : player.streak < 0
                    ? `${Math.abs(player.streak)} défaites d'affilée`
                    : "Aucune série"}
            </div>
            <div className="text-xs text-cool-gray">
              {player.streak >= 3
                ? `${player.streak} victoires d'affilée`
                : "Série actuelle"}
            </div>
          </div>
        </div>
      </div>

      {/* AC5: Sections — ELO evolution, Stats par league, Head-to-head, Recent matches */}
      <div className="flex-grow overflow-y-auto px-4 py-4 space-y-6 pb-bottom-nav lg:pb-bottom-nav-lg">
        {/* Win rate par format */}
        {formatWinRates.some((f) => f.matches > 0) && (
          <section>
            <h3 className="text-sm font-archivo font-extrabold uppercase tracking-tight mb-3 flex items-center gap-2 text-white">
              <Activity size={18} className="text-cool-gray" />
              Win rate par format
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {formatWinRates.map((f) => (
                <StatCard
                  key={f.format}
                  value={f.matches > 0 ? `${f.winRate}%` : "—"}
                  label={`${f.format} · ${f.matches} m.`}
                  variant={f.winRate >= 50 ? "success" : "default"}
                />
              ))}
            </div>
          </section>
        )}

        {/* Best ally / Nemesis */}
        {(bestAlly || nemesis) && (
          <section>
            <h3 className="text-sm font-archivo font-extrabold uppercase tracking-tight mb-3 flex items-center gap-2 text-white">
              <Heart size={18} className="text-cool-gray" />
              Allié & Nemesis
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {bestAlly && (
                <div className="bg-lime/10 border border-lime/40 p-4 rounded-card flex items-center gap-3">
                  <Heart className="text-lime flex-shrink-0" size={24} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-cool-gray font-mono uppercase tracking-widest">
                      Meilleur allié
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/player/${bestAlly.playerId}`)}
                      className="font-bold text-white truncate text-left hover:text-lime transition-colors"
                    >
                      {playersMap[bestAlly.playerId] ??
                        `Joueur ${bestAlly.playerId.slice(0, 8)}`}
                    </button>
                    <div className="text-xs text-cool-gray">
                      {bestAlly.wins}V - {bestAlly.losses}D · {bestAlly.winRate}%
                    </div>
                  </div>
                </div>
              )}
              {nemesis && (
                <div className="bg-signal-red/10 border border-signal-red/40 p-4 rounded-card flex items-center gap-3">
                  <Skull className="text-signal-red flex-shrink-0" size={24} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-cool-gray font-mono uppercase tracking-widest">
                      Nemesis
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/player/${nemesis.playerId}`)}
                      className="font-bold text-white truncate text-left hover:text-signal-red transition-colors"
                    >
                      {playersMap[nemesis.playerId] ??
                        `Joueur ${nemesis.playerId.slice(0, 8)}`}
                    </button>
                    <div className="text-xs text-cool-gray">
                      {nemesis.wins}V - {nemesis.losses}D · {nemesis.winRate}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Form trend */}
        {formTrend && formTrend.recentMatches >= 5 && (
          <section>
            <h3 className="text-sm font-archivo font-extrabold uppercase tracking-tight mb-3 flex items-center gap-2 text-white">
              <Activity size={18} className="text-cool-gray" />
              Forme récente
            </h3>
            <div
              className={`bg-navy-soft p-4 rounded-card border flex items-center gap-3 ${
                formTrend.delta > 0
                  ? "border-lime/40"
                  : formTrend.delta < 0
                    ? "border-signal-red/40"
                    : "border-card"
              }`}
            >
              {formTrend.delta > 0 ? (
                <TrendingUp className="text-lime flex-shrink-0" size={24} aria-hidden />
              ) : formTrend.delta < 0 ? (
                <TrendingDown
                  className="text-signal-red flex-shrink-0"
                  size={24}
                  aria-hidden
                />
              ) : (
                <Activity className="text-cool-gray flex-shrink-0" size={24} aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white">
                  {formTrend.delta > 0 ? "+" : ""}
                  {formTrend.delta}% vs lifetime
                </div>
                <div className="text-xs text-cool-gray">
                  Forme ({formTrend.recentMatches} derniers) : {formTrend.recentWinRate}%
                  {" · "}
                  Lifetime ({formTrend.lifetimeMatches} m.) : {formTrend.lifetimeWinRate}%
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ELO Evolution Chart — DS EloChart (§5.1) */}
        {eloEvolution.length > 1 && (
          <section>
            <h3 className="text-sm font-archivo font-extrabold uppercase tracking-tight mb-3 flex items-center gap-2 text-white">
              <BarChart3 size={18} className="text-cool-gray" />
              Évolution ELO
            </h3>
            <div className="bg-navy-soft p-4 rounded-card border border-card">
              <EloChart
                points={eloEvolution}
                width={330}
                height={80}
                highlightCurrent
                className="w-full"
              />
              <div className="mt-2 text-xs text-cool-gray text-center font-mono">
                {eloEvolution.length} points de données
              </div>
            </div>
          </section>
        )}

        {/* Phase D.3: Achievements */}
        {achievements.length > 0 && (
          <section>
            <h3 className="text-sm font-archivo font-extrabold uppercase tracking-tight mb-3 flex items-center gap-2 text-white">
              <Medal size={18} className="text-ping-yellow" />
              Succès
            </h3>
            <div className="space-y-2">
              {achievements.map((achievement) => (
                <AchievementCard key={achievement.slug} achievement={achievement} />
              ))}
            </div>
          </section>
        )}

        {/* Stats par league */}
        {Object.keys(statsByLeague).length > 0 && (
          <section>
            <h3 className="text-lg font-bold mb-3 text-white">
              Statistiques par League
            </h3>
            <div className="space-y-2">
              {Object.entries(statsByLeague).map(([leagueId, stats]) => (
                <div
                  key={leagueId}
                  className="bg-navy-soft p-4 rounded-xl border border-card/50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-white">
                        {stats.leagueName}
                      </div>
                      <div className="text-xs text-cool-gray">
                        {stats.matches} matchs
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-signal-red">
                        {stats.elo} ELO
                      </div>
                      <div className="text-xs text-cool-gray">
                        {stats.winRate}% win rate
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-lime">{stats.wins}V</span>
                    <span className="text-signal-red">{stats.losses}D</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Head-to-Head — ListRow (AC5) */}
        {Object.keys(headToHead).length > 0 && (
          <section>
            <h3 className="text-lg font-bold mb-3 text-white">
              Tête-à-tête
            </h3>
            <div className="space-y-2">
              {Object.entries(headToHead)
                .sort(
                  (a, b) =>
                    b[1].wins + b[1].losses - (a[1].wins + a[1].losses),
                )
                .slice(0, 5)
                .map(([opponentId, stats]) => {
                  const opponentName =
                    playersMap[opponentId] || `Joueur ${opponentId.slice(0, 8)}`;
                  const avatarUrl = opponentAvatars[opponentId] ?? undefined;
                  return (
                    <ListRow
                      key={opponentId}
                      variant="player"
                      name={opponentName}
                      subtitle={`${stats.wins}V - ${stats.losses}D`}
                      elo={0}
                      rightLabel={`${stats.wins + stats.losses} matchs`}
                      avatarUrl={avatarUrl ?? undefined}
                      onClick={() => navigate(`/player/${opponentId}`)}
                    />
                  );
                })}
            </div>
          </section>
        )}

        {/* Recent Matches — Story 14-35: relative time, league/event, badge Victoire/Défaite, delta ELO */}
        <section>
          <h3 className="text-lg font-bold mb-3 text-white">
            Matchs récents
          </h3>
          <div className="space-y-2">
            {playerMatchesWithContext.slice(0, 10).map(({ match, leagueName, eventName }) => {
              const isTeamA = match.teamA.includes(currentPlayerId);
              const isWinner =
                (isTeamA && match.scoreA > match.scoreB) ||
                (!isTeamA && match.scoreB > match.scoreA);
              const contextName =
                eventName ?? leagueName ?? null;

              const teamAPlayers = match.teamA.map((id) => ({
                id,
                name: playersMap[id] || `Joueur ${id.slice(0, 8)}`,
              }));
              const teamBPlayers = match.teamB.map((id) => ({
                id,
                name: playersMap[id] || `Joueur ${id.slice(0, 8)}`,
              }));
              const winnerSide: "A" | "B" =
                match.scoreA > match.scoreB ? "A" : "B";

              return (
                <div
                  key={match.id}
                  className={`bg-navy-soft p-4 rounded-xl border border-card/50 ${
                    isWinner ? "border-lime/50" : "border-signal-red/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
                        isWinner
                          ? "bg-lime/20 text-lime"
                          : "bg-signal-red/20 text-signal-red"
                      }`}
                    >
                      {isWinner ? "Victoire" : "Défaite"}
                    </span>
                    {contextName && (
                      <span className="min-w-0 flex-1 truncate text-xs text-cool-gray">
                        {contextName}
                      </span>
                    )}
                    <span className="ml-auto flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider text-cool-gray">
                      {formatRelativeTime(match.date)}
                    </span>
                  </div>
                  <MatchTeamsRow
                    teamAPlayers={teamAPlayers}
                    teamBPlayers={teamBPlayers}
                    winner={winnerSide}
                    eloChanges={match.eloChanges}
                  />
                  {hasMatchEnrichedContent(
                    match.photo_url,
                    match.cups_remaining,
                  ) && (
                    <div className="flex justify-end mt-2">
                      <MatchEnrichedDisplay
                        photoUrl={match.photo_url}
                        cupsRemaining={match.cups_remaining}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {playerMatchesWithContext.length === 0 && (
              <p className="text-cool-gray text-center py-4">
                Aucun match enregistré
              </p>
            )}
          </div>
        </section>
      </div>

      {showAdminEdit && (
        <>
          <Sheet
            isOpen={showAvatarSourceSheet}
            onClose={() => setShowAvatarSourceSheet(false)}
            title="Photo du joueur"
            maxWidth="sm"
          >
            <div className="flex flex-col gap-3 pt-2">
              <PButton
                variant="primary"
                size="md"
                full
                icon={<Camera size={18} />}
                onClick={() => void handlePickAvatar("camera")}
              >
                Prendre une photo
              </PButton>
              <PButton
                variant="accent"
                size="md"
                full
                icon={<ImageIcon size={18} />}
                onClick={() => void handlePickAvatar("gallery")}
              >
                Choisir depuis la galerie
              </PButton>
            </div>
          </Sheet>

          <WebcamCaptureSheet
            isOpen={showWebcamSheet}
            onClose={() => setShowWebcamSheet(false)}
            onCapture={(blob) => void handleWebcamCapture(blob)}
          />
        </>
      )}
    </div>
  );
};
