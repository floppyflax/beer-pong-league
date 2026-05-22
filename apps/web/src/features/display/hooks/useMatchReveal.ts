import { useEffect, useRef, useState } from "react";
import type { Match } from "@/types";
import type { DisplaySource, DisplaySourcePlayer } from "../types";
import { isAudioReady, playChime, unlockAudio } from "../sound";

export type RevealPhase = "idle" | "alert" | "reveal";

export interface MatchReveal {
  phase: RevealPhase;
  /** true pendant l'alerte → flou de l'arrière-plan. */
  blur: boolean;
  /** Match affiché dans l'alerte plein écran (phase "alert"). */
  alertMatch: Match | null;
  /** Ordre du classement affiché (gelé hors reveal, committé au reveal). */
  committedPlayers: DisplaySourcePlayer[];
  /** Protagonistes en surbrillance (vert si gain, rouge si perte — via eloDelta). */
  highlightedPlayerIds: Set<string>;
  /** Joueur sur lequel le classement doit scroller pendant la visite. */
  focusedPlayerId: string | null;
  /** Match qui clignote dans le panneau "Derniers matchs". */
  blinkMatchId: string | null;
  /** Séquence en cours → DisplayShell met en pause la rotation + force le Classement. */
  active: boolean;
  soundOn: boolean;
  audioArmed: boolean;
}

const ALERT_MS = 3_500;
const VISIT_STEP_MS = 1_900;
const END_HOLD_MS = 1_400;

function byRank(
  ids: string[],
  players: DisplaySourcePlayer[],
): string[] {
  return ids
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is DisplaySourcePlayer => !!p)
    .sort((a, b) => a.rank - b.rank)
    .map((p) => p.id);
}

/**
 * Orchestre toute la séquence d'arrivée d'un nouveau match en mode diffusion :
 *
 * 1. **alert** (~3.5s) : flou de l'arrière-plan + alerte plein écran clignotante
 *    "NOUVEAU MATCH" + résultat + sonnerie.
 * 2. **reveal** : retour au Classement (déflouté), commit du nouvel ordre (les
 *    lignes glissent), surbrillance vert/rouge des protagonistes, puis **visite
 *    séquentielle** : on scrolle sur chaque vainqueur (du mieux classé au moins
 *    bien) puis chaque perdant, un par un.
 * 3. **idle** : reprise du slideshow.
 *
 * Tout est consolidé ici (une seule détection de nouveau match) pour éviter des
 * séquences concurrentes. Vit dans le DisplayShell (persiste entre les scènes).
 */
export function useMatchReveal(source: DisplaySource | null): MatchReveal {
  const [phase, setPhase] = useState<RevealPhase>("idle");
  const [blur, setBlur] = useState(false);
  const [alertMatch, setAlertMatch] = useState<Match | null>(null);
  const [committedPlayers, setCommittedPlayers] = useState<
    DisplaySourcePlayer[] | null
  >(null);
  const [highlightedPlayerIds, setHighlightedPlayerIds] = useState<Set<string>>(
    new Set(),
  );
  const [focusedPlayerId, setFocusedPlayerId] = useState<string | null>(null);
  const [blinkMatchId, setBlinkMatchId] = useState<string | null>(null);
  const [pendingMatchId, setPendingMatchId] = useState<string | null>(null);

  const [soundOn, setSoundOn] = useState(true);
  const [audioArmed, setAudioArmed] = useState(false);

  const initializedRef = useRef(false);
  const lastSeenRef = useRef<string | null>(null);
  const sourceRef = useRef<DisplaySource | null>(source);
  sourceRef.current = source;
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;

  // Armement audio au 1er geste (politique autoplay).
  useEffect(() => {
    const arm = () => {
      unlockAudio();
      setAudioArmed(isAudioReady());
    };
    window.addEventListener("keydown", arm);
    window.addEventListener("pointerdown", arm);
    return () => {
      window.removeEventListener("keydown", arm);
      window.removeEventListener("pointerdown", arm);
    };
  }, []);

  // Toggle son (touche M).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "m" || e.key === "M") setSoundOn((s) => !s);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Détection d'un nouveau match — sans réordonner le classement en arrière-plan.
  useEffect(() => {
    if (!source) return;
    const latest = source.matches[0]?.id ?? null;
    if (!initializedRef.current) {
      initializedRef.current = true;
      lastSeenRef.current = latest;
      setCommittedPlayers(source.players);
      return;
    }
    if (latest && latest !== lastSeenRef.current) {
      lastSeenRef.current = latest;
      setPendingMatchId(latest);
      setBlinkMatchId(latest);
    }
  }, [source]);

  // Extinction du clignotement du match dans le panneau.
  useEffect(() => {
    if (!blinkMatchId) return;
    const t = setTimeout(() => setBlinkMatchId(null), 8_000);
    return () => clearTimeout(t);
  }, [blinkMatchId]);

  // Séquence complète, déclenchée par un match en attente.
  useEffect(() => {
    if (!pendingMatchId) return;
    const src = sourceRef.current;
    const match = src?.matches.find((m) => m.id === pendingMatchId);
    if (!src || !match) {
      setPendingMatchId(null);
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => {
      timers.push(
        setTimeout(() => {
          if (!cancelled) fn();
        }, ms),
      );
    };

    // 1) ALERTE : flou + alerte clignotante + sonnerie.
    setPhase("alert");
    setBlur(true);
    setAlertMatch(match);
    if (soundOnRef.current) playChime();

    // 2) REVEAL : retour Classement, commit du nouvel ordre, surbrillance.
    at(ALERT_MS, () => {
      const s = sourceRef.current;
      if (!s) return;
      setPhase("reveal");
      setBlur(false);
      setAlertMatch(null);
      setCommittedPlayers(s.players);
      const protagonists = [...match.teamA, ...match.teamB];
      setHighlightedPlayerIds(new Set(protagonists));

      // 3) VISITE séquentielle : vainqueurs (mieux classés d'abord) puis perdants.
      const winnerA = match.scoreA > match.scoreB;
      const winners = winnerA ? match.teamA : match.teamB;
      const losers = winnerA ? match.teamB : match.teamA;
      const order = [...byRank(winners, s.players), ...byRank(losers, s.players)];

      // NB : ces timers sont planifiés DANS le callback d'alerte (donc à
      // t=ALERT_MS), les offsets sont relatifs au début du reveal.
      order.forEach((pid, i) => {
        at(400 + i * VISIT_STEP_MS, () => setFocusedPlayerId(pid));
      });

      // 4) Fin : reprise du slideshow.
      at(400 + order.length * VISIT_STEP_MS + END_HOLD_MS, () => {
        setFocusedPlayerId(null);
        setHighlightedPlayerIds(new Set());
        setPhase("idle");
        setPendingMatchId(null);
      });
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [pendingMatchId]);

  return {
    phase,
    blur,
    alertMatch,
    committedPlayers: committedPlayers ?? source?.players ?? [],
    highlightedPlayerIds,
    focusedPlayerId,
    blinkMatchId,
    active: phase !== "idle",
    soundOn,
    audioArmed,
  };
}
