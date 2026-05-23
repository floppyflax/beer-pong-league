import { useEffect, useRef, useState } from "react";
import type { DisplaySource, DisplaySourcePlayer } from "../types";
import { isAudioReady, playChime, unlockAudio } from "../sound";

/**
 * Le hook ne pose plus jamais d'overlay plein écran ni de pause de la
 * rotation : l'ancien type avec phases "alert"/"reveal" a été remplacé par
 * un simple flag idle/silent. Les champs retournés gardent les mêmes noms
 * pour que DisplayShell + scenes restent compatibles.
 */
export type RevealPhase = "idle";

export interface MatchReveal {
  phase: RevealPhase;
  /** Toujours false — historiquement déclenchait un blur de l'arrière-plan. */
  blur: false;
  /** Toujours null — historiquement le match affiché en plein écran. */
  alertMatch: null;
  /** Ordre du classement affiché (committé dès qu'un nouveau match arrive). */
  committedPlayers: DisplaySourcePlayer[];
  /** Protagonistes en surbrillance pendant ~HIGHLIGHT_MS après le match. */
  highlightedPlayerIds: Set<string>;
  /** Vainqueurs du dernier match → brillance verte (timed). */
  winnerIds: Set<string>;
  /** Perdants du dernier match → brillance rouge (timed). */
  loserIds: Set<string>;
  /** Joueur focalisé — toujours null désormais (plus de visite séquentielle). */
  focusedPlayerId: null;
  /** Match qui clignote dans le panneau "Derniers matchs". */
  blinkMatchId: string | null;
  /** Toujours false — la rotation ne s'arrête plus pour un match. */
  active: false;
  soundOn: boolean;
  audioArmed: boolean;
}

/** Durée pendant laquelle les gagnants/perdants sont mis en surbrillance
 *  sur le Classement après l'arrivée d'un match. Pas de pause de rotation :
 *  si la scène ranking n'est pas visible à ce moment, c'est invisible — pas
 *  grave, le diaporama prime. */
const HIGHLIGHT_MS = 6_000;
/** Durée du clignotement du match dans le panneau "Derniers matchs". */
const BLINK_MS = 8_000;

/**
 * Calcule les deltas de transition (places gagnées/perdues + ELO gagné/perdu)
 * en comparant le nouvel ordre à l'ordre AFFICHÉ avant le match.
 *
 * Indépendant de `match.eloChanges` (souvent vide en local / non garanti) : on
 * lit directement le rang et l'ELO de chaque joueur avant vs après.
 */
export function withTransitionDeltas(
  next: DisplaySourcePlayer[],
  before: DisplaySourcePlayer[] | null,
): DisplaySourcePlayer[] {
  if (!before || before.length === 0) return next;
  const beforeById = new Map(before.map((p) => [p.id, p]));
  return next.map((p) => {
    const prev = beforeById.get(p.id);
    if (!prev) return p; // nouveau joueur : pas de point de comparaison
    const rankDelta = prev.rank - p.rank; // >0 = a gagné des places
    const eloDelta = p.elo - prev.elo;
    return {
      ...p,
      // ▲/▼ pour tout mouvement (y compris un non-joueur dépassé) ; "=" (0)
      // uniquement pour un joueur qui A JOUÉ (eloDelta≠0) mais a gardé son rang.
      rankDelta: rankDelta !== 0 ? rankDelta : eloDelta !== 0 ? 0 : undefined,
      eloDelta: eloDelta !== 0 ? eloDelta : undefined,
    };
  });
}

/**
 * À l'arrivée d'un nouveau match :
 * - Commit silencieux du nouvel ordre avec deltas de transition (le morph
 *   auto-animate joue si la scène ranking est visible, sinon invisible).
 * - Brillance lime/red des vainqueurs/perdants pendant `HIGHLIGHT_MS`.
 * - Clignotement du match dans "Derniers matchs" pendant `BLINK_MS`.
 * - Sonnerie courte si le son est armé/activé.
 *
 * Pas d'overlay plein écran, pas de pause de la rotation, pas de force-jump
 * vers le Classement → le diaporama continue exactement là où il était.
 */
export function useMatchReveal(source: DisplaySource | null): MatchReveal {
  const [committedPlayers, setCommittedPlayers] = useState<
    DisplaySourcePlayer[] | null
  >(null);
  const [winnerIds, setWinnerIds] = useState<Set<string>>(new Set());
  const [loserIds, setLoserIds] = useState<Set<string>>(new Set());
  const [highlightedPlayerIds, setHighlightedPlayerIds] = useState<Set<string>>(
    new Set(),
  );
  const [blinkMatchId, setBlinkMatchId] = useState<string | null>(null);
  const [pendingMatchId, setPendingMatchId] = useState<string | null>(null);

  // Préférence son persistée localStorage → reste cohérente quand l'écran
  // diffuse en boucle ou qu'on alterne event/league. Par défaut ACTIVÉ.
  const [soundOn, setSoundOn] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const v = window.localStorage.getItem("display:soundOn");
      return v === null ? true : v === "1";
    } catch {
      return true;
    }
  });
  const [audioArmed, setAudioArmed] = useState(false);

  // Persiste la pref son.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("display:soundOn", soundOn ? "1" : "0");
    } catch {
      // localStorage indispo (mode privé Safari) — on continue sans persister.
    }
  }, [soundOn]);

  const initializedRef = useRef(false);
  const lastSeenRef = useRef<string | null>(null);
  const sourceRef = useRef<DisplaySource | null>(source);
  sourceRef.current = source;
  // Ordre actuellement affiché (gelé entre deux matchs) → référence pour les
  // deltas de transition.
  const committedPlayersRef = useRef<DisplaySourcePlayer[] | null>(null);
  committedPlayersRef.current = committedPlayers;
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;

  // Armement audio au 1er geste (politique autoplay des navigateurs). On
  // élargit à tous les événements user plausibles sur un écran de diffusion
  // (un simple bougé de souris suffit), avec `once: true` pour ne pas
  // spammer le listener.
  useEffect(() => {
    const arm = () => {
      unlockAudio();
      setAudioArmed(isAudioReady());
    };
    const events: (keyof WindowEventMap)[] = [
      "keydown",
      "pointerdown",
      "pointermove",
      "wheel",
      "touchstart",
      "click",
    ];
    const opts: AddEventListenerOptions = { once: true, passive: true };
    events.forEach((ev) => window.addEventListener(ev, arm, opts));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, arm, opts));
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

  // Détection d'un nouveau match + propagation des modifs joueur (pseudo,
  // avatar, ajout, suppression) entre deux matchs.
  useEffect(() => {
    if (!source) return;
    const latest = source.matches[0]?.id ?? null;
    if (!initializedRef.current) {
      // Attendre que les joueurs soient chargés pour ne pas geler un snapshot vide.
      if (source.players.length === 0) return;
      initializedRef.current = true;
      lastSeenRef.current = latest;
      setCommittedPlayers(source.players);
      return;
    }
    if (latest && latest !== lastSeenRef.current) {
      // Nouveau match → l'effet pendingMatchId va commit avec deltas. Ne pas
      // toucher committedPlayers ici (sinon on perd la référence "avant").
      lastSeenRef.current = latest;
      setPendingMatchId(latest);
      setBlinkMatchId(latest);
      return;
    }
    // Pas de nouveau match — mais source peut avoir changé pour d'autres
    // raisons (pseudo édité, avatar mis à jour, joueur ajouté/supprimé). On
    // reconcilie committedPlayers avec source.players en PRÉSERVANT les
    // deltas (rankDelta / eloDelta) calculés au dernier match.
    setCommittedPlayers((prev) => {
      if (!prev) return source.players;
      const deltasById = new Map<
        string,
        { rankDelta?: number; eloDelta?: number }
      >();
      for (const p of prev) {
        if (p.rankDelta !== undefined || p.eloDelta !== undefined) {
          deltasById.set(p.id, {
            rankDelta: p.rankDelta,
            eloDelta: p.eloDelta,
          });
        }
      }
      return source.players.map((p) => {
        const d = deltasById.get(p.id);
        return d ? { ...p, ...d } : p;
      });
    });
  }, [source]);

  // Extinction du clignotement du match dans le panneau.
  useEffect(() => {
    if (!blinkMatchId) return;
    const t = setTimeout(() => setBlinkMatchId(null), BLINK_MS);
    return () => clearTimeout(t);
  }, [blinkMatchId]);

  // Commit silencieux quand un match arrive — déclenche brillance + sonnerie
  // mais aucune pause de la rotation.
  useEffect(() => {
    if (!pendingMatchId) return;
    const src = sourceRef.current;
    const match = src?.matches.find((m) => m.id === pendingMatchId);
    if (!src || !match) {
      setPendingMatchId(null);
      return;
    }

    const beforeOrder = committedPlayersRef.current ?? src.players;
    const winnerA = match.scoreA > match.scoreB;
    const winners = winnerA ? match.teamA : match.teamB;
    const losers = winnerA ? match.teamB : match.teamA;

    // Commit immédiat : le morph auto-animate joue si la scène ranking est
    // visible — sinon invisible jusqu'au prochain passage. Le diaporama
    // continue son cycle.
    setCommittedPlayers(withTransitionDeltas(src.players, beforeOrder));
    setWinnerIds(new Set(winners));
    setLoserIds(new Set(losers));
    setHighlightedPlayerIds(new Set([...winners, ...losers]));

    // Sonnerie courte (signal non visuel, non interruptif).
    if (soundOnRef.current && isAudioReady()) playChime();

    setPendingMatchId(null);
  }, [pendingMatchId]);

  // Surbrillance auto-effacée. Effet séparé du déclencheur pour éviter que
  // le cleanup du re-render qui suit setPendingMatchId(null) n'annule le
  // timer avant qu'il ne tire (cf. useNewPlayerReveal — même piège).
  useEffect(() => {
    if (winnerIds.size === 0 && loserIds.size === 0) return;
    const t = setTimeout(() => {
      setWinnerIds(new Set());
      setLoserIds(new Set());
      setHighlightedPlayerIds(new Set());
    }, HIGHLIGHT_MS);
    return () => clearTimeout(t);
  }, [winnerIds, loserIds]);

  return {
    phase: "idle",
    blur: false,
    alertMatch: null,
    committedPlayers: committedPlayers ?? source?.players ?? [],
    highlightedPlayerIds,
    winnerIds,
    loserIds,
    focusedPlayerId: null,
    blinkMatchId,
    active: false,
    soundOn,
    audioArmed,
  };
}
