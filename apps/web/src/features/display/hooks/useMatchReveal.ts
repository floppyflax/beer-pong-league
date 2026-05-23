import { useEffect, useRef, useState } from "react";
import type { Match } from "@/types";
import type { DisplaySource, DisplaySourcePlayer } from "../types";
import { isAudioReady, playChime, unlockAudio } from "../sound";

/**
 * À l'arrivée d'un nouveau match : courte phase "alert" qui pose un overlay
 * plein écran avec le résultat (mêmes codes visuels que l'alerte "nouveau
 * joueur"), puis retour à idle. Pas de visite séquentielle des protagonistes
 * ni de force-jump vers le classement — le diaporama reprend exactement là
 * où il était à la fin de l'overlay.
 */
export type RevealPhase = "idle" | "alert";

export interface MatchReveal {
  phase: RevealPhase;
  /** true pendant l'alerte → utilisé pour le backdrop blur de l'overlay. */
  blur: boolean;
  /** Match affiché dans l'overlay plein écran (phase "alert"). */
  alertMatch: Match | null;
  /** Ordre du classement affiché (committé dès qu'un nouveau match arrive). */
  committedPlayers: DisplaySourcePlayer[];
  /** Protagonistes en surbrillance pendant ~HIGHLIGHT_MS après le match. */
  highlightedPlayerIds: Set<string>;
  /** Vainqueurs du dernier match → brillance verte (timed). */
  winnerIds: Set<string>;
  /** Perdants du dernier match → brillance rouge (timed). */
  loserIds: Set<string>;
  /** Joueur focalisé — toujours null (plus de visite séquentielle). */
  focusedPlayerId: null;
  /** Match qui clignote dans le panneau "Derniers matchs". */
  blinkMatchId: string | null;
  /** true pendant l'overlay → DisplayShell met la rotation en pause. */
  active: boolean;
  soundOn: boolean;
  audioArmed: boolean;
}

/** Durée de l'overlay plein écran. Aligné sur l'alerte "nouveau joueur"
 *  pour cohérence visuelle (cf. useNewPlayerReveal.ALERT_MS). */
const ALERT_MS = 4_000;

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
 * - Phase "alert" (~ALERT_MS) : overlay plein écran avec le résultat — la
 *   rotation est mise en pause par DisplayShell mais reprend juste après,
 *   sans visite séquentielle ni force-jump vers le classement.
 * - Commit du nouvel ordre avec deltas de transition (le morph auto-animate
 *   joue dès qu'on repasse sur la scène ranking).
 * - Brillance lime/red des vainqueurs/perdants pendant `HIGHLIGHT_MS`.
 * - Clignotement du match dans "Derniers matchs" pendant `BLINK_MS`.
 * - Sonnerie courte si le son est armé/activé.
 */
export function useMatchReveal(source: DisplaySource | null): MatchReveal {
  const [phase, setPhase] = useState<RevealPhase>("idle");
  const [alertMatch, setAlertMatch] = useState<Match | null>(null);
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

  // Trigger : un match arrive → commit + ouverture de l'overlay (phase alert).
  // Le minuteur de fermeture est porté par un useEffect séparé pour éviter
  // que son cleanup ne soit annulé par le re-render qui suit setPhase.
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

    // Commit du nouvel ordre : le morph auto-animate joue dès qu'on
    // repasse sur la scène ranking (la rotation reprend juste après l'overlay).
    setCommittedPlayers(withTransitionDeltas(src.players, beforeOrder));
    setWinnerIds(new Set(winners));
    setLoserIds(new Set(losers));
    setHighlightedPlayerIds(new Set([...winners, ...losers]));

    // Sonnerie courte (renfort de l'overlay visuel).
    if (soundOnRef.current && isAudioReady()) playChime();

    // Overlay plein écran — fermeture gérée par l'effet suivant.
    setAlertMatch(match);
    setPhase("alert");
    setPendingMatchId(null);
  }, [pendingMatchId]);

  // Fermeture de l'overlay après ALERT_MS. Effet séparé pour éviter que le
  // cleanup au re-render qui suit setPhase("alert") n'annule le timer (cf.
  // useNewPlayerReveal — même piège).
  useEffect(() => {
    if (phase !== "alert") return;
    const t = setTimeout(() => {
      setPhase("idle");
      setAlertMatch(null);
    }, ALERT_MS);
    return () => clearTimeout(t);
  }, [phase]);

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
    phase,
    blur: phase === "alert",
    alertMatch,
    committedPlayers: committedPlayers ?? source?.players ?? [],
    highlightedPlayerIds,
    winnerIds,
    loserIds,
    focusedPlayerId: null,
    blinkMatchId,
    active: phase !== "idle",
    soundOn,
    audioArmed,
  };
}
