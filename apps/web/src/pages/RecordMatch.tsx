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
 * Route : /record-match/:contextType/:id  (contextType = "event" | "league")
 */

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLeague } from "@/context/LeagueContext";
import { databaseService } from "@/services/DatabaseService";
import { matchAdminService } from "@/services/MatchAdminService";
import { eloRecalcService } from "@/services/EloRecalcService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Sheet } from "@/components/design-system/Sheet";
import { PButton } from "@/components/ponglo/PButton";
import { SearchBar, ScreenLayout, StickyCTA } from "@/components/design-system";
import { X, UserPlus, Check, ChevronDown, ChevronLeft, Trophy, Calendar, Minus, Plus, Lock } from "lucide-react";
import toast from "react-hot-toast";
import type { Player } from "@/types";
import { canLogMatch } from "@/utils/eventLifecycle";
import { canRecordLeagueMatch } from "@/utils/leagueLifecycle";

type ContextType = "event" | "league";
type Step = "compose" | "score";
type Team = "A" | "B";

const TEAM_SIZE_BY_FORMAT: Record<string, number | null> = {
  "1v1": 1,
  "2v2": 2,
  "3v3": 3,
  libre: null,
};

const TOTAL_CUPS = 10;
// Standard beer pong rack viewed from above: back row first (4 cups), then 3, 2, 1
const CUP_ROWS = [4, 3, 2, 1];

// Canonical cup id for a (rack row, column) position. Rack row 0 = back (4 cups),
// rack row 3 = tip (1 cup). Used to identify individual cups across both teams.
const cupId = (rackRow: number, col: number) => `r${rackRow}c${col}`;

// Order in which cups fall when the score is adjusted via +/- (front-most first,
// back row last — matches the back-to-front "rack drains" visual).
const ELIMINATION_ORDER: string[] = (() => {
  const ids: string[] = [];
  for (let r = CUP_ROWS.length - 1; r >= 0; r--) {
    for (let c = 0; c < CUP_ROWS[r]; c++) ids.push(cupId(r, c));
  }
  return ids;
})();

const EMPTY_DROPPED: Set<string> = new Set();

type EnrichedPlayer = Player & { avatarUrl?: string | null };

/** Initials fallback when no avatar URL is available. */
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

/* ─────────────────────────────────────────────────────────────────────────── */
/* Stepper                                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */
function Stepper({ current }: { current: 1 | 2 }) {
  const label = current === 1 ? "Saisir équipes" : "Saisir score";
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
        Étape {current}/2 — {label}
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
            Ajouter un joueur
          </button>
        )
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Player chip — small avatar + pseudo (used in score view)                    */
/* ─────────────────────────────────────────────────────────────────────────── */
function PlayerChip({
  player,
  side,
  dim,
}: {
  player: EnrichedPlayer;
  side: Team;
  dim?: boolean;
}) {
  const isA = side === "A";
  const ringCls = isA ? "ring-electric-blue/50" : "ring-signal-red/50";
  const fallbackBg = isA
    ? "bg-electric-blue/15 text-electric-blue"
    : "bg-signal-red/15 text-signal-red";

  return (
    <div
      className={`inline-flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full bg-navy/50 border border-card transition-opacity ${
        dim ? "opacity-50" : ""
      }`}
    >
      {player.avatarUrl ? (
        <img
          src={player.avatarUrl}
          alt=""
          className={`w-5 h-5 rounded-full object-cover ring-1 ${ringCls}`}
        />
      ) : (
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-archivo font-extrabold ring-1 ${ringCls} ${fallbackBg}`}
          aria-hidden
        >
          {initialsOf(player.name) || "?"}
        </div>
      )}
      <span className="text-xs font-archivo font-bold text-white truncate max-w-[80px]">
        {player.name}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* TableSide — one half of the beer-pong table viewed from above               */
/*   Vertical layout: A on top (back row at top, tip pointing down towards     */
/*   center), B at bottom (tip at top pointing up, back row at bottom).        */
/*   - tap the side to declare it winner                                       */
/*   - winner: cups solid, score editable (+/- or tap a cup)                   */
/*   - loser: empty positions, score = 0                                       */
/* ─────────────────────────────────────────────────────────────────────────── */
function TableSide({
  team,
  players,
  droppedCups,
  state, // 'pending' | 'winner' | 'loser'
  onSelectWinner,
  onAdjustCups,
  onToggleCup,
}: {
  team: Team;
  players: EnrichedPlayer[];
  droppedCups: Set<string>;
  state: "pending" | "winner" | "loser";
  onSelectWinner: () => void;
  onAdjustCups: (next: number) => void;
  onToggleCup: (id: string) => void;
}) {
  const cupsRemaining = TOTAL_CUPS - droppedCups.size;
  const isA = team === "A";
  const accentText = isA ? "text-electric-blue" : "text-signal-red";
  const cupSolid = isA
    ? "bg-electric-blue border-electric-blue"
    : "bg-signal-red border-signal-red";
  const dotBg = isA ? "bg-electric-blue" : "bg-signal-red";

  // Render rows top-to-bottom. A: wide row at top, tip at bottom (points down
  // towards center). B: tip at top (points up towards center), wide row at
  // the bottom edge.
  const rows = isA ? CUP_ROWS : [...CUP_ROWS].reverse();
  // Map render-row index → canonical rack-row index (0 = back row, 3 = tip).
  const rackRowFor = (renderRow: number) => (isA ? renderRow : 3 - renderRow);

  // Pending and loser are both clickable: pending → pick winner, loser → swap.
  // Winner is non-clickable at the wrapper level (cups handle their own clicks).
  const sideClickable = state !== "winner";
  const interactiveSide = sideClickable ? "cursor-pointer" : "";

  const handleSideClick = () => {
    if (state !== "winner") onSelectWinner();
  };

  const sideAccentBg = isA ? "bg-electric-blue/10" : "bg-signal-red/10";
  const sideAccentBorder = isA ? "border-electric-blue" : "border-signal-red";
  const sideAccentShadow = isA ? "shadow-[0_3px_0_#0052D4]" : "shadow-[0_3px_0_#C42418]";

  const sideStateClass =
    state === "winner"
      ? `${sideAccentBg} border-[1.5px] ${sideAccentBorder} ${sideAccentShadow}`
      : state === "loser"
        ? "bg-navy/40 border-[1.5px] border-card hover:border-cool-gray hover:bg-navy/60"
        : "border-[1.5px] border-dashed border-cool-gray/40 hover:border-cool-gray hover:bg-white/[0.02]";

  const handleCupTap = (id: string) => {
    if (state !== "winner") return;
    onToggleCup(id);
  };

  /* Sub-blocks */

  const headerRow = (
    <div className="flex items-center justify-between gap-3 w-full">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotBg}`} />
        <h3
          className={`font-archivo font-extrabold uppercase tracking-tight text-sm ${accentText}`}
        >
          Équipe {team}
        </h3>
        {state === "winner" && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-lime">
            🏆
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {state === "winner" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdjustCups(Math.max(1, cupsRemaining - 1));
            }}
            className="w-7 h-7 rounded-full border border-card flex items-center justify-center text-cool-gray hover:text-white hover:border-cool-gray transition-colors"
            aria-label="Diminuer les cups restants"
          >
            <Minus size={12} />
          </button>
        )}
        <div
          className={`text-[56px] font-archivo font-black tabular-nums leading-none ${
            state === "loser" ? "text-cool-gray/40" : accentText
          }`}
        >
          {state === "loser" ? 0 : cupsRemaining}
        </div>
        {state === "winner" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdjustCups(Math.min(TOTAL_CUPS, cupsRemaining + 1));
            }}
            className="w-7 h-7 rounded-full border border-card flex items-center justify-center text-cool-gray hover:text-white hover:border-cool-gray transition-colors"
            aria-label="Augmenter les cups restants"
          >
            <Plus size={12} />
          </button>
        )}
      </div>
    </div>
  );

  const chipsRow = (
    <div className="flex flex-wrap gap-2 w-full">
      {players.map((p) => (
        <PlayerChip key={p.id} player={p} side={team} dim={state === "loser"} />
      ))}
    </div>
  );

  const pyramid = (
    <div className="flex flex-col items-center gap-1.5 w-full py-1">
      {rows.map((rowCount, rowIdx) => {
        const rackRow = rackRowFor(rowIdx);
        return (
          <div key={rowIdx} className="flex gap-1.5">
            {Array.from({ length: rowCount }).map((_, posInRow) => {
              const id = cupId(rackRow, posInRow);
              const isDropped = droppedCups.has(id);
              const visible = state === "loser" ? false : !isDropped;
              const interactive = state === "winner";
              return (
                <button
                  key={posInRow}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (interactive) handleCupTap(id);
                  }}
                  disabled={!interactive}
                  aria-label={visible ? "Cup debout — tape pour le faire tomber" : "Cup tombé — tape pour le remettre"}
                  className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 transition-all ${
                    interactive ? "active:scale-90 cursor-pointer" : ""
                  } ${
                    visible
                      ? cupSolid
                      : "bg-transparent border-cool-gray/30 opacity-40"
                  }`}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      onClick={handleSideClick}
      onKeyDown={(e) => {
        if (sideClickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleSideClick();
        }
      }}
      role={sideClickable ? "button" : undefined}
      tabIndex={sideClickable ? 0 : undefined}
      className={`group relative w-full flex flex-col gap-3 px-4 py-3 text-left rounded-card transition-all duration-150 ${interactiveSide} ${sideStateClass}`}
      aria-label={
        state === "winner"
          ? undefined
          : `Choisir l'équipe ${team} comme vainqueur`
      }
    >
      {/* A: header → chips → pyramid (tip down, towards center).
          B: pyramid (tip up, towards center) → chips → header. */}
      {isA ? (
        <>
          {headerRow}
          {chipsRow}
          {pyramid}
        </>
      ) : (
        <>
          {pyramid}
          {chipsRow}
          {headerRow}
        </>
      )}

      {state === "pending" && (
        <span className="text-center text-[10px] font-mono uppercase tracking-widest text-cool-gray/70 group-hover:text-white transition-colors w-full">
          Tape pour déclarer vainqueur
        </span>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Main page                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */
export const RecordMatch = () => {
  const { contextType: urlContextType, id: urlId } = useParams<{
    contextType: ContextType;
    id: string;
  }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editMatchId = searchParams.get("editMatchId");
  const isEditMode = Boolean(editMatchId);
  const {
    events,
    leagues,
    recordEventMatch,
    recordMatch,
    addGuestPlayerToEvent,
    addPlayer,
    isLoadingInitialData,
    reloadData,
  } = useLeague();

  /* Context is URL-seeded but locally switchable */
  const [contextType, setContextType] = useState<ContextType | null>(
    urlContextType ?? null,
  );
  const [contextId, setContextId] = useState<string | null>(urlId ?? null);
  const [showContextPicker, setShowContextPicker] = useState(false);

  const [step, setStep] = useState<Step>("compose");
  const [activeTeam, setActiveTeam] = useState<Team>("A");
  const [playerTeams, setPlayerTeams] = useState<Record<string, Team>>({});
  const [participants, setParticipants] = useState<EnrichedPlayer[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);
  // Score-step model: pick a winner first, then adjust the winner's
  // remaining cups (1..10). The loser's cups are implicitly 0.
  const [winnerTeam, setWinnerTeam] = useState<Team | null>(null);
  const [winnerDroppedCups, setWinnerDroppedCups] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Context resolution */
  const event =
    contextType === "event" && contextId
      ? events.find((t) => t.id === contextId)
      : null;
  const league =
    contextType === "league" && contextId
      ? leagues.find((l) => l.id === contextId)
      : null;

  /* Mig 027 — guard direct URL access: if the event lifecycle blocks match
   * logging (not_started / paused / finished), bounce back to the event page.
   * `isEditMode` is allowed through: editing an existing match must remain
   * possible even after the event is closed. */
  useEffect(() => {
    if (!event || isEditMode) return;
    if (canLogMatch(event)) return;
    toast.error(
      event.isFinished
        ? "Cet événement est terminé."
        : event.pausedAt
          ? "Cet événement est en pause."
          : "Cet événement n'a pas encore démarré.",
    );
    navigate(`/event/${event.id}`, { replace: true });
  }, [event, isEditMode, navigate]);

  /* Mig 028 — same guard for leagues (paused / finished). */
  useEffect(() => {
    if (!league || isEditMode) return;
    if (canRecordLeagueMatch(league)) return;
    toast.error(
      league.endedAt
        ? "Cette ligue est terminée."
        : "Cette ligue est en pause.",
    );
    navigate(`/league/${league.id}`, { replace: true });
  }, [league, isEditMode, navigate]);

  const hasContext = Boolean(event || league);
  const contextName = event?.name ?? league?.name ?? "";
  const format = event?.format ?? "libre";
  const teamSize = TEAM_SIZE_BY_FORMAT[format] ?? null;
  const backPath =
    contextType === "event" && contextId
      ? `/event/${contextId}`
      : contextType === "league" && contextId
        ? `/league/${contextId}`
        : "/";

  const id = contextId;

  const handlePickContext = (type: ContextType, nextId: string) => {
    if (type === contextType && nextId === contextId) {
      setShowContextPicker(false);
      return;
    }
    setContextType(type);
    setContextId(nextId);
    setPlayerTeams({});
    setParticipants([]);
    setSearchQuery("");
    setActiveTeam("A");
    setWinnerTeam(null);
    setWinnerDroppedCups(new Set());
    setStep("compose");
    setShowContextPicker(false);
  };

  /* Load participants. In edit mode we keep archived players that are part of
   * the edited match so their chips don't vanish (admin can still remove them
   * from the team, but cannot re-add). */
  const editedMatch = useMemo(() => {
    if (!editMatchId) return null;
    if (contextType === "event" && event) {
      return event.matches.find((m) => m.id === editMatchId) ?? null;
    }
    if (contextType === "league" && league) {
      return league.matches.find((m) => m.id === editMatchId) ?? null;
    }
    return null;
  }, [editMatchId, contextType, event, league]);

  useEffect(() => {
    if (!id) return;

    if (contextType === "event" && event) {
      setIsLoadingParticipants(true);
      databaseService
        .loadEventParticipants(id)
        .then((ps) => {
          const keepArchivedIds = new Set<string>();
          if (editedMatch) {
            editedMatch.teamA.forEach((pid) => keepArchivedIds.add(pid));
            editedMatch.teamB.forEach((pid) => keepArchivedIds.add(pid));
          }
          setParticipants(
            ps
              // Hide archived ghosts from the picker (they remain in past
              // matches via stored team_a/b_player_ids), unless the match
              // currently being edited references them.
              .filter((p) => !p.isArchived || keepArchivedIds.has(p.id))
              .map((p) => ({
                id: p.id,
                name: p.name,
                elo: p.elo,
                wins: p.wins,
                losses: p.losses,
                matchesPlayed: p.matchesPlayed,
                streak: 0,
                avatarUrl: p.avatarUrl ?? null,
              })),
          );
        })
        .catch(() => setParticipants([]))
        .finally(() => setIsLoadingParticipants(false));
    } else if (contextType === "league" && league) {
      setParticipants(league.players.map((p) => ({ ...p, avatarUrl: null })));
    }

  }, [id, contextType, editedMatch]);

  /* Edit-mode prefill: hydrate teams + score from the edited match once
   * participants have loaded. */
  const [editPrefilled, setEditPrefilled] = useState(false);
  useEffect(() => {
    if (!isEditMode || editPrefilled || !editedMatch || participants.length === 0) {
      return;
    }
    const teams: Record<string, Team> = {};
    editedMatch.teamA.forEach((pid) => {
      teams[pid] = "A";
    });
    editedMatch.teamB.forEach((pid) => {
      teams[pid] = "B";
    });
    setPlayerTeams(teams);
    const winner: Team = editedMatch.scoreA > editedMatch.scoreB ? "A" : "B";
    setWinnerTeam(winner);
    const winnerScore = winner === "A" ? editedMatch.scoreA : editedMatch.scoreB;
    const loserScore = winner === "A" ? editedMatch.scoreB : editedMatch.scoreA;
    // Winner has TOTAL_CUPS - (10 - loserScore) cups remaining = loserScore
    // dropped on its rack? Actually our model: dropped cups on winner's rack
    // = TOTAL_CUPS - winner_cups_remaining. The recorded scoreA/scoreB only
    // tells us the loser's points (winner always = TOTAL_CUPS = 10). So
    // dropped on winner = TOTAL_CUPS - winnerCupsRemaining where
    // winnerCupsRemaining = TOTAL_CUPS - loserScore.
    const droppedCount = Math.max(0, TOTAL_CUPS - (TOTAL_CUPS - loserScore));
    void winnerScore;
    setWinnerDroppedCups(new Set(ELIMINATION_ORDER.slice(0, droppedCount)));
    setStep("compose");
    setEditPrefilled(true);
  }, [isEditMode, editPrefilled, editedMatch, participants.length]);

  /* Keep league participants in sync with context */
  useEffect(() => {
    if (contextType === "league" && league) {
      setParticipants(league.players.map((p) => ({ ...p, avatarUrl: null })));
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

  // Derived scores: winner's points = 10 (always — they reached the goal),
  // loser's points = 10 - (winner's cups remaining).
  const winnerCupsRemaining = TOTAL_CUPS - winnerDroppedCups.size;
  const droppedA = winnerTeam === "A" ? winnerDroppedCups : EMPTY_DROPPED;
  const droppedB = winnerTeam === "B" ? winnerDroppedCups : EMPTY_DROPPED;
  const scoreA =
    winnerTeam === "A"
      ? TOTAL_CUPS
      : winnerTeam === "B"
        ? TOTAL_CUPS - winnerCupsRemaining
        : 0;
  const scoreB =
    winnerTeam === "B"
      ? TOTAL_CUPS
      : winnerTeam === "A"
        ? TOTAL_CUPS - winnerCupsRemaining
        : 0;
  const winner: Team | null = winnerTeam;
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

      if (contextType === "event") {
        newPlayerId = await addGuestPlayerToEvent(id, name);
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

      if (newPlayerId && contextType === "event") {
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
  const handleSelectWinner = (team: Team) => {
    setWinnerTeam(team);
    setWinnerDroppedCups(new Set());
  };

  // +/- buttons: rebuild the dropped set in canonical elimination order so the
  // rack visually drains back-to-front (overrides individual cup taps).
  const handleAdjustWinnerCups = (next: number) => {
    const clamped = Math.max(1, Math.min(TOTAL_CUPS, next));
    setWinnerDroppedCups(new Set(ELIMINATION_ORDER.slice(0, TOTAL_CUPS - clamped)));
  };

  // Tap a specific cup → toggle just that cup. Score = number of dropped cups.
  const handleToggleCup = (id: string) => {
    setWinnerDroppedCups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // Never let the winner reach 0 cups (winner always has ≥ 1 cup remaining).
      if (next.size >= TOTAL_CUPS) return prev;
      return next;
    });
  };

  /* Submit */
  const handleSubmit = async () => {
    if (!isScoreValid || !winner || !id) return;
    const teamAIds = teamAPlayers.map((p) => p.id);
    const teamBIds = teamBPlayers.map((p) => p.id);

    setIsSubmitting(true);
    try {
      if (isEditMode && editMatchId) {
        const result = await matchAdminService.updateMatch(
          editMatchId,
          teamAIds,
          teamBIds,
          scoreA,
          scoreB,
        );
        if (!result.success) {
          toast.error(result.error || "Modification impossible");
          return;
        }
        if (result.leagueId) {
          const recalc = await eloRecalcService.recalculateLeagueElo(
            result.leagueId,
          );
          if (!recalc.success) {
            toast.error(`Match modifié mais recalcul ELO échoué : ${recalc.error}`);
          } else {
            toast.success("Match modifié, ELO recalculé");
          }
        } else {
          toast.success("Match modifié");
        }
        await reloadData();
      } else if (contextType === "event" && event) {
        const eloChanges = await recordEventMatch(
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
        toast.success("Match enregistré !");
      } else if (contextType === "league") {
        const eloChanges = await recordMatch(id, teamAIds, teamBIds, winner);
        if (eloChanges) {
          sessionStorage.setItem(`eloChanges_${id}`, JSON.stringify(eloChanges));
        }
        toast.success("Match enregistré !");
      }
      navigate(backPath);
    } catch (error) {
      console.error("Error recording match:", error);
      toast.error(
        isEditMode
          ? "Erreur lors de la modification du match"
          : "Erreur lors de l'enregistrement du match",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* Loading */
  if (isLoadingInitialData || (hasContext && isLoadingParticipants)) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  const formatLabel = format === "libre" ? "Libre" : format.toUpperCase().replace("V", "v");

  const handleBack = () => {
    if (step === "score") setStep("compose");
    else navigate(backPath);
  };

  const hero = (
    <div className="flex items-center gap-2.5 pt-2 pb-2">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Retour"
        className="w-9 h-9 rounded-full border-[1.5px] border-card flex items-center justify-center text-white hover:bg-navy-soft transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      <div className="font-archivo font-extrabold uppercase text-[17px] tracking-[-0.3px] text-white">
        Nouveau match
      </div>
    </div>
  );

  const contextLocked = step === "score";
  const contextChip = contextLocked ? (
    <div
      className="w-full flex items-center gap-3 bg-navy-soft/60 border border-card rounded-card px-4 py-3 opacity-80"
      aria-label="Contexte verrouillé pour cette étape"
    >
      <div
        className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center ${
          contextType === "league"
            ? "bg-electric-blue/15 text-electric-blue"
            : "bg-ping-yellow/15 text-ping-yellow"
        }`}
      >
        {contextType === "league" ? <Trophy size={16} /> : <Calendar size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-cool-gray">
          {contextType === "event"
            ? `Événement · ${formatLabel}`
            : "Ligue · Libre"}
        </div>
        <div className="text-sm font-archivo font-extrabold uppercase tracking-tight text-white truncate">
          {contextName}
        </div>
      </div>
      <Lock size={14} className="text-cool-gray shrink-0" aria-hidden />
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setShowContextPicker(true)}
      className="w-full flex items-center gap-3 bg-navy-soft border border-card hover:border-cool-gray rounded-card px-4 py-3 transition-colors text-left"
      aria-label="Changer de contexte"
    >
      <div
        className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center ${
          contextType === "league"
            ? "bg-electric-blue/15 text-electric-blue"
            : "bg-ping-yellow/15 text-ping-yellow"
        }`}
      >
        {contextType === "league" ? <Trophy size={16} /> : <Calendar size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-cool-gray">
          {hasContext
            ? contextType === "event"
              ? `Événement · ${formatLabel}`
              : "Ligue · Libre"
            : "Contexte"}
        </div>
        <div className="text-sm font-archivo font-extrabold uppercase tracking-tight text-white truncate">
          {hasContext ? contextName : "Choisir un contexte"}
        </div>
      </div>
      <ChevronDown size={18} className="text-cool-gray shrink-0" />
    </button>
  );

  const overlay = (
    <StickyCTA>
      {step === "compose" ? (
        <PButton
          variant="primary"
          size="lg"
          full
          disabled={!hasContext || !isComposeValid}
          onClick={() => setStep("score")}
        >
          {hasContext ? "Continuer →" : "Choisir un contexte"}
        </PButton>
      ) : (
        <PButton
          variant="primary"
          size="lg"
          full
          disabled={!isScoreValid || isSubmitting}
          onClick={() => void handleSubmit()}
        >
          {isSubmitting
            ? isEditMode
              ? "Mise à jour…"
              : "Enregistrement…"
            : isEditMode
              ? "Mettre à jour le match"
              : "Enregistrer le match"}
        </PButton>
      )}
    </StickyCTA>
  );

  return (
    <ScreenLayout maxWidth="narrow" overlay={overlay} contentClassName="pb-28 space-y-5">
      {hero}
      {contextChip}

      <Stepper current={step === "compose" ? 1 : 2} />

      {!hasContext ? (
        <div className="bg-navy-soft rounded-card p-6 border border-card text-center space-y-3">
          <p className="text-sm text-cool-gray">
            Sélectionne un événement ou une ligue pour commencer.
          </p>
          <PButton
            variant="accent"
            size="md"
            onClick={() => setShowContextPicker(true)}
          >
            Choisir un contexte
          </PButton>
        </div>
      ) : step === "compose" ? (
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
              canCreate={contextType === "event"}
            />
          </>
        ) : (
          <>
            {/* Beer-pong table viewed from above. Sides face each other across
                the center divider. Tap a side to crown the winner. */}
            <div className="bg-navy-soft border-[1.5px] border-card rounded-card overflow-hidden">
              <div className="flex flex-col">
                <TableSide
                  team="A"
                  players={teamAPlayers as EnrichedPlayer[]}
                  droppedCups={droppedA}
                  state={
                    winnerTeam === null
                      ? "pending"
                      : winnerTeam === "A"
                        ? "winner"
                        : "loser"
                  }
                  onSelectWinner={() => handleSelectWinner("A")}
                  onAdjustCups={handleAdjustWinnerCups}
                  onToggleCup={handleToggleCup}
                />
                {/* Center divider — the "table line" */}
                <div className="h-px bg-card mx-4" aria-hidden />
                <TableSide
                  team="B"
                  players={teamBPlayers as EnrichedPlayer[]}
                  droppedCups={droppedB}
                  state={
                    winnerTeam === null
                      ? "pending"
                      : winnerTeam === "B"
                        ? "winner"
                        : "loser"
                  }
                  onSelectWinner={() => handleSelectWinner("B")}
                  onAdjustCups={handleAdjustWinnerCups}
                  onToggleCup={handleToggleCup}
                />
              </div>
            </div>
          </>
        )}

      <ContextPickerModal
        isOpen={showContextPicker}
        onClose={() => setShowContextPicker(false)}
        events={events}
        leagues={leagues}
        currentType={contextType}
        currentId={contextId}
        onPick={handlePickContext}
      />
    </ScreenLayout>
  );
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* Context picker modal                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */
function ContextPickerModal({
  isOpen,
  onClose,
  events,
  leagues,
  currentType,
  currentId,
  onPick,
}: {
  isOpen: boolean;
  onClose: () => void;
  events: Array<{
    id: string;
    name: string;
    isFinished?: boolean;
    format?: string;
    date?: string;
    startedAt?: string | null;
    pausedAt?: string | null;
  }>;
  leagues: Array<{
    id: string;
    name: string;
    status?: string;
    pausedAt?: string | null;
    endedAt?: string | null;
  }>;
  currentType: ContextType | null;
  currentId: string | null;
  onPick: (type: ContextType, id: string) => void;
}) {
  // Mig 027 — only events whose lifecycle is `in_progress` can host a match.
  const activeEvents = events.filter((t) =>
    canLogMatch({
      isFinished: Boolean(t.isFinished),
      date: t.date ?? "",
      startedAt: t.startedAt ?? null,
      pausedAt: t.pausedAt ?? null,
    }),
  );
  // Mig 028 — only league with lifecycle `active` can host a match.
  const activeLeagues = leagues.filter((l) =>
    canRecordLeagueMatch({
      pausedAt: l.pausedAt ?? null,
      endedAt: l.endedAt ?? null,
    }),
  );

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Choisir un contexte" maxWidth="md">
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-ping-yellow" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-cool-gray">
              Événements
            </h3>
          </div>
          {activeEvents.length === 0 ? (
            <p className="text-xs text-cool-gray/60 italic px-1 py-2">
              Aucun événement actif.
            </p>
          ) : (
            <div className="space-y-1.5">
              {activeEvents.map((t) => {
                const active = currentType === "event" && currentId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onPick("event", t.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-card border transition-colors ${
                      active
                        ? "bg-electric-blue/15 border-electric-blue text-white"
                        : "bg-navy border-card hover:border-cool-gray text-white"
                    }`}
                  >
                    <div className="font-archivo font-bold uppercase tracking-tight text-sm truncate">
                      {t.name}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-cool-gray mt-0.5">
                      {t.format ?? "libre"}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={14} className="text-electric-blue" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-cool-gray">
              Ligues
            </h3>
          </div>
          {activeLeagues.length === 0 ? (
            <p className="text-xs text-cool-gray/60 italic px-1 py-2">
              Aucune ligue active.
            </p>
          ) : (
            <div className="space-y-1.5">
              {activeLeagues.map((l) => {
                const active = currentType === "league" && currentId === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => onPick("league", l.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-card border transition-colors ${
                      active
                        ? "bg-electric-blue/15 border-electric-blue text-white"
                        : "bg-navy border-card hover:border-cool-gray text-white"
                    }`}
                  >
                    <div className="font-archivo font-bold uppercase tracking-tight text-sm truncate">
                      {l.name}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
