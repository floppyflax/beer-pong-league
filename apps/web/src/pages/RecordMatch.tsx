/**
 * RecordMatch — Everything ELO
 *
 * Flow en 2 étapes :
 *  1. Compose — sélectionner les joueurs de l'Équipe A (bleu) et B (rouge).
 *     Tap un header d'équipe pour l'activer ; tap un joueur du pool pour
 *     l'ajouter à l'équipe active. Création d'un nouveau joueur inline.
 *  2. Score — pyramide de 10 cups par équipe, tap un cup pour l'éliminer.
 *     Score = 10 - cups restants de l'adversaire.
 *
 * Route : /record-match/:contextType/:id  (contextType = "tournament" | "league")
 */

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLeague } from "@/context/LeagueContext";
import { databaseService } from "@/services/DatabaseService";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PButton } from "@/components/ponglo/PButton";
import { SearchBar } from "@/components/design-system";
import { X, UserPlus, Check, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import type { Player } from "@/types";

type ContextType = "tournament" | "league";
type Step = "compose" | "score";
type Team = "A" | "B";

const TEAM_SIZE_BY_FORMAT: Record<string, number | null> = {
  "1v1": 1,
  "2v2": 2,
  "3v3": 3,
  libre: null,
};

const TOTAL_CUPS = 10;
const CUP_ROWS = [4, 3, 2, 1];

const makeCups = () => Array.from({ length: TOTAL_CUPS }, () => true);

/* ─────────────────────────────────────────────────────────────────────────── */
/* Stepper                                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */
function Stepper({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2].map((n) => (
        <span
          key={n}
          className={`h-1.5 w-8 rounded-full transition-colors ${
            n <= current ? "bg-lime" : "bg-navy-soft"
          }`}
        />
      ))}
      <span className="ml-2 text-[10px] font-mono uppercase tracking-widest text-cool-gray">
        Étape {current}/2
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Team composition card                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */
function TeamCompositionCard({
  team,
  players,
  maxSize,
  active,
  onActivate,
  onRemove,
}: {
  team: Team;
  players: Player[];
  maxSize: number | null;
  active: boolean;
  onActivate: () => void;
  onRemove: (id: string) => void;
}) {
  const isA = team === "A";
  const label = isA ? "Équipe A" : "Équipe B";
  const accentText = isA ? "text-electric-blue" : "text-signal-red";
  const dotBg = isA ? "bg-electric-blue" : "bg-signal-red";
  const chipBg = isA
    ? "bg-electric-blue/15 border border-electric-blue/40"
    : "bg-signal-red/15 border border-signal-red/40";
  const borderColor = active
    ? isA
      ? "border-electric-blue"
      : "border-signal-red"
    : "border-card";
  const glow = active ? (isA ? "shadow-glow-electric" : "shadow-glow-red") : "";
  const slotsLabel = maxSize ? `${players.length}/${maxSize}` : `${players.length}`;

  return (
    <button
      type="button"
      onClick={onActivate}
      className={`w-full text-left bg-navy-soft border-[1.5px] rounded-card p-4 transition-all ${borderColor} ${glow}`}
      aria-pressed={active}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotBg}`} />
          <h3 className={`font-archivo font-extrabold uppercase tracking-tight text-sm ${accentText}`}>
            {label}
          </h3>
          {active && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cool-gray truncate">
              · ajout en cours
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cool-gray shrink-0">
          {slotsLabel}
        </span>
      </div>

      {players.length === 0 ? (
        <p className="text-xs text-cool-gray/60 italic">
          {active ? "Tap un joueur dans la liste ↓" : "Aucun joueur"}
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {players.map((p) => (
            <span
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(p.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(p.id);
                }
              }}
              className={`${chipBg} flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-archivo font-bold uppercase tracking-tight text-white cursor-pointer`}
              aria-label={`Retirer ${p.name}`}
            >
              <span className="truncate max-w-[120px]">{p.name}</span>
              <X size={12} className="opacity-70 flex-shrink-0" />
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Player pool                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */
function PlayerPool({
  players,
  query,
  onQueryChange,
  onSelect,
  onCreateNew,
  isCreating,
  canCreate,
}: {
  players: Player[];
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (id: string) => void;
  onCreateNew: (name: string) => Promise<void>;
  isCreating: boolean;
  canCreate: boolean;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    await onCreateNew(name);
    setNewName("");
    setShowAdd(false);
  };

  return (
    <div className="bg-navy-soft rounded-card p-4 border border-card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-archivo font-extrabold uppercase tracking-tight text-white text-sm">
          Joueurs disponibles
        </h3>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cool-gray">
          {players.length} dispo
        </span>
      </div>

      <SearchBar
        value={query}
        onChange={onQueryChange}
        placeholder="Rechercher un joueur..."
      />

      {players.length === 0 ? (
        <p className="text-xs text-cool-gray/60 italic text-center py-2">
          {query ? "Aucun joueur ne matche." : "Tous les joueurs sont assignés."}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className="bg-navy border border-card hover:border-cool-gray text-white px-3 py-2 rounded-card transition-colors text-sm font-archivo font-bold uppercase tracking-tight truncate max-w-[160px]"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {canCreate && (
        showAdd ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleCreate();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom du joueur"
              className="flex-1 bg-navy border border-card rounded-input px-3 py-2 text-sm text-white placeholder-cool-gray/50 focus:outline-none focus:ring-2 focus:ring-lime/30"
              autoFocus
              maxLength={100}
              required
            />
            <button
              type="submit"
              disabled={!newName.trim() || isCreating}
              className="h-9 w-9 shrink-0 rounded-full bg-lime text-navy flex items-center justify-center disabled:opacity-50 transition-opacity"
              aria-label="Valider le nouveau joueur"
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setNewName("");
              }}
              className="h-9 w-9 shrink-0 rounded-full bg-navy border border-card flex items-center justify-center"
              aria-label="Annuler"
            >
              <X size={16} className="text-cool-gray" />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 text-electric-blue hover:text-white text-sm font-archivo font-bold uppercase tracking-tight transition-colors"
          >
            <UserPlus size={14} />
            Nouveau joueur
          </button>
        )
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Cups pyramid                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */
function CupsPyramid({
  team,
  cups,
  onToggle,
  onReset,
}: {
  team: Team;
  cups: boolean[];
  onToggle: (index: number) => void;
  onReset: () => void;
}) {
  const isA = team === "A";
  const remaining = cups.filter(Boolean).length;
  const standingCls = isA
    ? "bg-electric-blue border-electric-blue"
    : "bg-signal-red border-signal-red";
  const numberCls = isA ? "text-electric-blue" : "text-signal-red";

  let cupIndex = 0;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col items-center gap-1">
        {CUP_ROWS.map((rowCount, rowIdx) => (
          <div key={rowIdx} className="flex gap-1.5">
            {Array.from({ length: rowCount }).map(() => {
              const i = cupIndex++;
              const standing = cups[i];
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onToggle(i)}
                  aria-label={standing ? `Cup ${i + 1} debout` : `Cup ${i + 1} tombé`}
                  aria-pressed={!standing}
                  className={`w-6 h-6 md:w-7 md:h-7 rounded-full border-2 transition-all active:scale-90 ${
                    standing
                      ? standingCls
                      : "bg-transparent border-cool-gray/30 opacity-40"
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <div className={`text-5xl font-archivo font-black tabular-nums leading-none ${numberCls}`}>
          {remaining}
        </div>
        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-cool-gray">
          cups restants
        </div>
        <button
          type="button"
          onClick={onReset}
          className="mt-1 flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-cool-gray hover:text-white transition-colors"
        >
          <RotateCcw size={11} />
          Reset
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Team summary (step 2)                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */
function TeamScoreCard({
  team,
  players,
  cups,
  isWinner,
  onToggleCup,
  onResetCups,
}: {
  team: Team;
  players: Player[];
  cups: boolean[];
  isWinner: boolean;
  onToggleCup: (i: number) => void;
  onResetCups: () => void;
}) {
  const isA = team === "A";
  const accentText = isA ? "text-electric-blue" : "text-signal-red";
  const dotBg = isA ? "bg-electric-blue" : "bg-signal-red";
  const borderCls = isWinner
    ? isA
      ? "border-electric-blue shadow-glow-electric"
      : "border-signal-red shadow-glow-red"
    : "border-card";

  return (
    <div className={`bg-navy-soft border-[1.5px] rounded-card p-4 space-y-3 transition-all ${borderCls}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotBg}`} />
          <h3 className={`font-archivo font-extrabold uppercase tracking-tight text-sm ${accentText}`}>
            {isA ? "Équipe A" : "Équipe B"}
          </h3>
        </div>
        {isWinner && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-lime">
            🏆 vainqueur
          </span>
        )}
      </div>

      <div className="text-xs text-white/90 truncate">
        {players.map((p) => p.name).join(" · ")}
      </div>

      <CupsPyramid
        team={team}
        cups={cups}
        onToggle={onToggleCup}
        onReset={onResetCups}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Main page                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */
export const RecordMatch = () => {
  const { contextType, id } = useParams<{ contextType: ContextType; id: string }>();
  const navigate = useNavigate();
  const {
    tournaments,
    leagues,
    recordTournamentMatch,
    recordMatch,
    addAnonymousPlayerToTournament,
    addPlayer,
    isLoadingInitialData,
  } = useLeague();

  const [step, setStep] = useState<Step>("compose");
  const [activeTeam, setActiveTeam] = useState<Team>("A");
  const [playerTeams, setPlayerTeams] = useState<Record<string, Team>>({});
  const [participants, setParticipants] = useState<Player[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);
  const [cupsA, setCupsA] = useState<boolean[]>(makeCups);
  const [cupsB, setCupsB] = useState<boolean[]>(makeCups);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Context resolution */
  const tournament =
    contextType === "tournament" ? tournaments.find((t) => t.id === id) : null;
  const league =
    contextType === "league" ? leagues.find((l) => l.id === id) : null;

  const contextName = tournament?.name ?? league?.name ?? "";
  const format = tournament?.format ?? "libre";
  const teamSize = TEAM_SIZE_BY_FORMAT[format] ?? null;
  const backPath =
    contextType === "tournament" ? `/tournament/${id}` : `/league/${id}`;

  /* Load participants */
  useEffect(() => {
    if (!id) return;

    if (contextType === "tournament" && tournament) {
      setIsLoadingParticipants(true);
      databaseService
        .loadTournamentParticipants(id)
        .then((ps) => {
          setParticipants(
            ps.map((p) => ({
              id: p.id,
              name: p.name,
              elo: p.elo,
              wins: p.wins,
              losses: p.losses,
              matchesPlayed: p.matchesPlayed,
              streak: 0,
            })),
          );
        })
        .catch(() => setParticipants([]))
        .finally(() => setIsLoadingParticipants(false));
    } else if (contextType === "league" && league) {
      setParticipants(league.players);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, contextType]);

  /* Keep league participants in sync with context */
  useEffect(() => {
    if (contextType === "league" && league) {
      setParticipants(league.players);
    }
  }, [contextType, league]);

  /* Derived */
  const teamAPlayers = useMemo(
    () => participants.filter((p) => playerTeams[p.id] === "A"),
    [participants, playerTeams],
  );
  const teamBPlayers = useMemo(
    () => participants.filter((p) => playerTeams[p.id] === "B"),
    [participants, playerTeams],
  );

  const poolPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return participants
      .filter((p) => !playerTeams[p.id])
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true));
  }, [participants, playerTeams, searchQuery]);

  const teamAFull = teamSize !== null && teamAPlayers.length >= teamSize;
  const teamBFull = teamSize !== null && teamBPlayers.length >= teamSize;

  const isComposeValid =
    teamSize !== null
      ? teamAPlayers.length === teamSize && teamBPlayers.length === teamSize
      : teamAPlayers.length >= 1 && teamBPlayers.length >= 1;

  const cupsRemainingA = cupsA.filter(Boolean).length;
  const cupsRemainingB = cupsB.filter(Boolean).length;
  const scoreA = TOTAL_CUPS - cupsRemainingB;
  const scoreB = TOTAL_CUPS - cupsRemainingA;

  const winner: Team | null =
    cupsRemainingB === 0 && cupsRemainingA > 0
      ? "A"
      : cupsRemainingA === 0 && cupsRemainingB > 0
        ? "B"
        : null;

  const isScoreValid = winner !== null;

  /* Actions — compose */
  const handleSelectPlayer = (playerId: string) => {
    setPlayerTeams((prev) => {
      if (prev[playerId]) return prev;
      const target = activeTeam;
      if (teamSize !== null) {
        const targetCount = Object.values(prev).filter((t) => t === target).length;
        if (targetCount >= teamSize) {
          const other: Team = target === "A" ? "B" : "A";
          const otherCount = Object.values(prev).filter((t) => t === other).length;
          if (otherCount >= teamSize) return prev;
          return { ...prev, [playerId]: other };
        }
      }
      return { ...prev, [playerId]: target };
    });

    /* Auto-switch if active team fills up (fixed format only) */
    if (teamSize !== null) {
      const nextCount =
        Object.values(playerTeams).filter((t) => t === activeTeam).length + 1;
      if (nextCount >= teamSize) {
        setActiveTeam((prev) => (prev === "A" ? "B" : "A"));
      }
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    setPlayerTeams((prev) => {
      const next = { ...prev };
      delete next[playerId];
      return next;
    });
  };

  const handleActivateTeam = (team: Team) => {
    setActiveTeam(team);
  };

  const handleCreatePlayer = async (name: string) => {
    if (!id) return;
    setIsCreatingPlayer(true);
    try {
      let newPlayerId: string | null = null;

      if (contextType === "tournament") {
        newPlayerId = await addAnonymousPlayerToTournament(id, name);
        setParticipants((prev) => [
          ...prev,
          {
            id: newPlayerId!,
            name,
            elo: 1000,
            wins: 0,
            losses: 0,
            matchesPlayed: 0,
            streak: 0,
          },
        ]);
      } else if (contextType === "league") {
        const tempId = crypto.randomUUID();
        await addPlayer(id, name);
        /* addPlayer creates with a UUID internally; we can't get it back directly.
           Rely on the next-render sync from league.players. */
        newPlayerId = tempId;
      }

      if (newPlayerId && contextType === "tournament") {
        /* Auto-assign to the currently active team (respecting caps) */
        handleSelectPlayer(newPlayerId);
      }
      toast.success(`Joueur "${name}" ajouté`);
    } catch (error) {
      console.error("Error creating player:", error);
      toast.error("Erreur lors de la création du joueur");
    } finally {
      setIsCreatingPlayer(false);
    }
  };

  /* Actions — score */
  const toggleCup = (team: Team, index: number) => {
    if (team === "A") {
      setCupsA((prev) => prev.map((v, i) => (i === index ? !v : v)));
    } else {
      setCupsB((prev) => prev.map((v, i) => (i === index ? !v : v)));
    }
  };

  const resetCups = (team: Team) => {
    if (team === "A") setCupsA(makeCups());
    else setCupsB(makeCups());
  };

  /* Submit */
  const handleSubmit = async () => {
    if (!isScoreValid || !winner || !id) return;
    const teamAIds = teamAPlayers.map((p) => p.id);
    const teamBIds = teamBPlayers.map((p) => p.id);

    setIsSubmitting(true);
    try {
      if (contextType === "tournament" && tournament) {
        const eloChanges = await recordTournamentMatch(
          id,
          teamAIds,
          teamBIds,
          winner,
          { scoreA, scoreB },
          participants,
        );
        if (eloChanges) {
          sessionStorage.setItem(`eloChanges_${id}`, JSON.stringify(eloChanges));
        }
      } else if (contextType === "league") {
        const eloChanges = await recordMatch(id, teamAIds, teamBIds, winner);
        if (eloChanges) {
          sessionStorage.setItem(`eloChanges_${id}`, JSON.stringify(eloChanges));
        }
      }
      toast.success("Match enregistré !");
      navigate(backPath);
    } catch (error) {
      console.error("Error recording match:", error);
      toast.error("Erreur lors de l'enregistrement du match");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* Loading + not-found */
  if (isLoadingInitialData || isLoadingParticipants) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!tournament && !league) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-archivo font-extrabold uppercase tracking-tight text-white">
            Contexte introuvable
          </h1>
          <PButton variant="primary" onClick={() => navigate("/")}>
            Retour à l'accueil
          </PButton>
        </div>
      </div>
    );
  }

  const formatLabel = format === "libre" ? "Libre" : format.toUpperCase().replace("V", "v");

  return (
    <div className="min-h-screen bg-navy">
      <ContextualHeader
        title="Nouveau match"
        showBackButton
        onBack={() => {
          if (step === "score") setStep("compose");
          else navigate(backPath);
        }}
      />

      <div className="max-w-lg mx-auto px-4 md:px-6 pt-4 pb-[140px] space-y-4">
        {/* Sub-header: event + format */}
        <div className="text-center space-y-1">
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-cool-gray">
            {contextType === "tournament" ? "Événement" : "Ligue"} · {formatLabel}
          </div>
          <div className="text-sm font-archivo font-extrabold uppercase tracking-tight text-white truncate">
            {contextName}
          </div>
        </div>

        <Stepper current={step === "compose" ? 1 : 2} />

        {step === "compose" ? (
          <>
            <TeamCompositionCard
              team="A"
              players={teamAPlayers}
              maxSize={teamSize}
              active={activeTeam === "A"}
              onActivate={() => handleActivateTeam("A")}
              onRemove={handleRemovePlayer}
            />
            <TeamCompositionCard
              team="B"
              players={teamBPlayers}
              maxSize={teamSize}
              active={activeTeam === "B"}
              onActivate={() => handleActivateTeam("B")}
              onRemove={handleRemovePlayer}
            />

            {teamSize !== null && teamAFull && teamBFull && (
              <p className="text-center text-[10px] font-mono uppercase tracking-widest text-lime">
                Équipes complètes — prêt à continuer
              </p>
            )}

            <PlayerPool
              players={poolPlayers}
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onSelect={handleSelectPlayer}
              onCreateNew={handleCreatePlayer}
              isCreating={isCreatingPlayer}
              canCreate={contextType === "tournament"}
            />
          </>
        ) : (
          <>
            <TeamScoreCard
              team="A"
              players={teamAPlayers}
              cups={cupsA}
              isWinner={winner === "A"}
              onToggleCup={(i) => toggleCup("A", i)}
              onResetCups={() => resetCups("A")}
            />
            <TeamScoreCard
              team="B"
              players={teamBPlayers}
              cups={cupsB}
              isWinner={winner === "B"}
              onToggleCup={(i) => toggleCup("B", i)}
              onResetCups={() => resetCups("B")}
            />

            <div className="bg-navy-soft rounded-card p-3 border border-card text-center">
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-cool-gray mb-1">
                Score
              </div>
              <div className="font-archivo font-extrabold text-2xl tabular-nums text-white">
                <span className={winner === "A" ? "text-electric-blue" : ""}>{scoreA}</span>
                <span className="mx-3 text-cool-gray">–</span>
                <span className={winner === "B" ? "text-signal-red" : ""}>{scoreB}</span>
              </div>
              {!isScoreValid && (
                <p className="text-[11px] text-cool-gray mt-2">
                  Tape sur les cups pour éliminer l'adversaire — il faut finir la partie.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pt-4 pb-bottom-nav lg:pb-bottom-nav-lg bg-gradient-to-t from-navy via-navy/95 to-transparent">
        <div className="max-w-lg mx-auto">
          {step === "compose" ? (
            <PButton
              variant="primary"
              size="lg"
              full
              disabled={!isComposeValid}
              onClick={() => setStep("score")}
            >
              Continuer →
            </PButton>
          ) : (
            <PButton
              variant="primary"
              size="lg"
              full
              disabled={!isScoreValid || isSubmitting}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting ? "Enregistrement…" : "Enregistrer le match"}
            </PButton>
          )}
        </div>
      </div>
    </div>
  );
};
