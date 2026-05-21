import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SceneId =
  | "ranking"
  | "podium"
  | "live-match"
  | "highlight"
  | "stats";

export type SceneMode = "timed" | "self-paced";

export interface SceneConfig {
  id: SceneId;
  mode: SceneMode;
  /** Pour `timed` : durée en ms. Ignoré pour `self-paced`. */
  durationMs?: number;
  /**
   * Quand true, la scène est insérée entre chaque autre scène dans la
   * séquence de rotation. Une seule scène pinned est supportée (la première
   * trouvée). Utile pour donner ~50% du temps au classement.
   */
  pinned?: boolean;
}

export interface UseDisplayScenesOptions {
  scenes: SceneConfig[];
  /** Saut automatique sur cette scène quand un nouveau match arrive. */
  pauseOnNewMatch?: boolean;
  newMatchSceneId?: SceneId;
  newMatchHoldMs?: number;
  /** Limite haute sur les scènes self-paced pour éviter qu'elles bloquent. */
  maxDurationMs?: number;
  /**
   * Trigger d'interruption "nouveau match". Le hook compare cette valeur à
   * sa précédente : tout changement déclenche le saut vers `newMatchSceneId`.
   * En pratique : passer l'id du dernier match.
   */
  newMatchSignal?: string | null;
}

export interface UseDisplayScenesResult {
  activeSceneId: SceneId;
  activeMode: SceneMode;
  /** Index dans la séquence "unique" (déduplique les pinned). Pour les dots. */
  uniqueSceneIndex: number;
  /** Liste dédupliquée des scènes pour les indicators. Ordre : pinned d'abord. */
  uniqueScenes: SceneConfig[];
  /** Progression de la scène timed active, 0..1. -1 pour self-paced. */
  progress: number;
  isPaused: boolean;
  next: () => void;
  prev: () => void;
  pause: () => void;
  resume: () => void;
  togglePause: () => void;
  jumpTo: (id: SceneId) => void;
  /** Appeler depuis une scène self-paced pour signaler sa fin. */
  notifyComplete: () => void;
}

/**
 * Génère la séquence effective de scènes en interlacent le pinned entre
 * chaque autre scène.
 *
 * Ex : pinned = ranking, autres = [podium, live-match, highlight, stats]
 *  → [ranking, podium, ranking, live-match, ranking, highlight, ranking, stats]
 *
 * Si aucune scène n'est pinned, retourne la liste telle quelle.
 */
function buildSequence(scenes: SceneConfig[]): SceneConfig[] {
  const pinned = scenes.find((s) => s.pinned);
  if (!pinned) return scenes;
  const others = scenes.filter((s) => s.id !== pinned.id);
  if (others.length === 0) return [pinned];
  const seq: SceneConfig[] = [];
  for (const o of others) {
    seq.push(pinned, o);
  }
  return seq;
}

/**
 * Liste unique des scènes pour l'UI indicators : pinned d'abord, puis les
 * autres dans l'ordre. Permet d'afficher 1 dot par scène distincte.
 */
function buildUniqueScenes(scenes: SceneConfig[]): SceneConfig[] {
  const pinned = scenes.find((s) => s.pinned);
  const others = scenes.filter((s) => s.id !== pinned?.id);
  return pinned ? [pinned, ...others] : others;
}

const DEFAULT_MAX_SELF_PACED_MS = 60_000;
const DEFAULT_NEW_MATCH_HOLD_MS = 8_000;

export function useDisplayScenes({
  scenes,
  pauseOnNewMatch = false,
  newMatchSceneId,
  newMatchHoldMs = DEFAULT_NEW_MATCH_HOLD_MS,
  maxDurationMs = DEFAULT_MAX_SELF_PACED_MS,
  newMatchSignal = null,
}: UseDisplayScenesOptions): UseDisplayScenesResult {
  const sequence = useMemo(() => buildSequence(scenes), [scenes]);
  const uniqueScenes = useMemo(() => buildUniqueScenes(scenes), [scenes]);

  const [seqIndex, setSeqIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<number>(-1);

  const activeScene = sequence[seqIndex % Math.max(sequence.length, 1)] ?? sequence[0];
  const activeSceneId = activeScene?.id ?? "ranking";
  const activeMode = activeScene?.mode ?? "timed";

  const advance = useCallback(() => {
    setSeqIndex((i) => (i + 1) % Math.max(sequence.length, 1));
  }, [sequence.length]);

  const goBack = useCallback(() => {
    setSeqIndex((i) => {
      const len = Math.max(sequence.length, 1);
      return (i - 1 + len) % len;
    });
  }, [sequence.length]);

  const jumpTo = useCallback(
    (id: SceneId) => {
      const idx = sequence.findIndex((s) => s.id === id);
      if (idx >= 0) setSeqIndex(idx);
    },
    [sequence],
  );

  // Timer pour les scènes timed.
  // IMPORTANT : advance piloté par `setTimeout` (robuste même en arrière-plan,
  // contrairement à requestAnimationFrame qui est suspendu quand l'onglet
  // n'est pas visible/focus — cas d'un écran de diffusion). La progression est
  // un `setInterval` cosmétique (peut être throttlé sans casser l'advance).
  useEffect(() => {
    if (isPaused) return;
    if (activeMode !== "timed") {
      setProgress(-1);
      return;
    }
    const duration = activeScene?.durationMs ?? 10_000;
    const t0 = Date.now();
    setProgress(0);

    const advanceTimer = setTimeout(() => advance(), duration);
    const progressIv = setInterval(() => {
      setProgress(Math.min((Date.now() - t0) / duration, 1));
    }, 100);

    return () => {
      clearTimeout(advanceTimer);
      clearInterval(progressIv);
    };
  }, [activeMode, activeScene?.durationMs, advance, isPaused, seqIndex]);

  // Safety net pour les self-paced qui ne notifient jamais
  useEffect(() => {
    if (isPaused) return;
    if (activeMode !== "self-paced") return;
    const timeout = setTimeout(() => {
      // Pas de log en prod, on évite tout console noise sur le grand écran.
      if (typeof window !== "undefined" && !import.meta.env.PROD) {
        console.warn(
          `[useDisplayScenes] self-paced scene "${activeSceneId}" exceeded ${maxDurationMs}ms, forcing next.`,
        );
      }
      advance();
    }, maxDurationMs);
    return () => clearTimeout(timeout);
  }, [activeMode, activeSceneId, advance, isPaused, maxDurationMs, seqIndex]);

  // Interruption "nouveau match"
  const lastSignalRef = useRef<string | null>(newMatchSignal);
  useEffect(() => {
    if (!pauseOnNewMatch) return;
    if (!newMatchSceneId) return;
    if (newMatchSignal === lastSignalRef.current) return;
    lastSignalRef.current = newMatchSignal;
    // Premier set (mount) : on ignore l'absence-of-signal
    if (newMatchSignal === null) return;
    jumpTo(newMatchSceneId);
    setIsPaused(false);
    // Force la durée du newMatchHold quel que soit le mode
    const timeout = setTimeout(() => {
      advance();
    }, newMatchHoldMs);
    return () => clearTimeout(timeout);
  }, [
    advance,
    jumpTo,
    newMatchHoldMs,
    newMatchSceneId,
    newMatchSignal,
    pauseOnNewMatch,
  ]);

  // Clavier ←/→/Espace/0-9
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        advance();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goBack();
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setIsPaused((p) => !p);
      } else if (/^[0-9]$/.test(e.key)) {
        const n = parseInt(e.key, 10);
        const target = uniqueScenes[n === 0 ? 9 : n - 1];
        if (target) jumpTo(target.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, goBack, jumpTo, uniqueScenes]);

  const uniqueSceneIndex = useMemo(
    () => uniqueScenes.findIndex((s) => s.id === activeSceneId),
    [uniqueScenes, activeSceneId],
  );

  const notifyComplete = useCallback(() => {
    if (activeMode === "self-paced" && !isPaused) {
      advance();
    }
  }, [activeMode, advance, isPaused]);

  return {
    activeSceneId,
    activeMode,
    uniqueSceneIndex: uniqueSceneIndex >= 0 ? uniqueSceneIndex : 0,
    uniqueScenes,
    progress,
    isPaused,
    next: advance,
    prev: goBack,
    pause: () => setIsPaused(true),
    resume: () => setIsPaused(false),
    togglePause: () => setIsPaused((p) => !p),
    jumpTo,
    notifyComplete,
  };
}
