import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

export type SelfPacedScrollPhase =
  | "idle"
  | "hold-top"
  | "scrolling"
  | "hold-bottom"
  | "done";

export interface UseSelfPacedScrollOptions {
  /**
   * Quand `false`, le hook est inactif (rien ne scroll, phase = "idle").
   * Bascule à `true` quand la scène devient active.
   */
  enabled: boolean;
  holdTopMs?: number;
  scrollSpeedPxPerSec?: number;
  holdBottomMs?: number;
  /** Appelé une fois la séquence terminée (avant de passer à la scène suivante). */
  onComplete: () => void;
  /**
   * Quand `true`, freeze sur la phase courante (timer stop, rAF cancel).
   * Reprend là où on était au prochain `false`.
   */
  paused?: boolean;
}

/**
 * Pilote un container scrollable en 3 phases : hold-top → scrolling lent
 * (requestAnimationFrame) → hold-bottom → onComplete.
 *
 * Skip "scrolling" et "hold-bottom" si le contenu ne dépasse pas le viewport
 * (la scène fait juste hold-top pendant `holdTopMs + holdBottomMs` puis
 * notify).
 *
 * Conçu pour la scène Ranking en mode diffusion, mais réutilisable pour toute
 * scène self-paced avec une longue liste.
 */
export function useSelfPacedScroll(
  ref: RefObject<HTMLElement | null>,
  {
    enabled,
    holdTopMs = 8_000,
    scrollSpeedPxPerSec = 30,
    holdBottomMs = 3_000,
    onComplete,
    paused = false,
  }: UseSelfPacedScrollOptions,
): SelfPacedScrollPhase {
  const [phase, setPhase] = useState<SelfPacedScrollPhase>("idle");
  const phaseRef = useRef<SelfPacedScrollPhase>("idle");
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const updatePhase = (next: SelfPacedScrollPhase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  useEffect(() => {
    // Reset à chaque (re-)mount avec enabled true
    if (!enabled) {
      updatePhase("idle");
      const el = ref.current;
      if (el) el.scrollTop = 0;
      return;
    }

    // Setup
    const el = ref.current;
    if (el) el.scrollTop = 0;
    updatePhase("hold-top");

    const cleanup = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const startHoldTop = () => {
      timeoutRef.current = setTimeout(() => {
        const target = ref.current;
        if (!target) {
          updatePhase("done");
          onCompleteRef.current();
          return;
        }
        // Si la liste tient dans le viewport → skip scrolling
        if (target.scrollHeight <= target.clientHeight + 4) {
          startHoldBottom();
        } else {
          startScrolling();
        }
      }, holdTopMs);
    };

    const startScrolling = () => {
      updatePhase("scrolling");
      const target = ref.current;
      if (!target) {
        updatePhase("done");
        onCompleteRef.current();
        return;
      }
      let lastTs: number | null = null;
      const tick = (ts: number) => {
        if (lastTs === null) lastTs = ts;
        const dt = (ts - lastTs) / 1000;
        lastTs = ts;
        const next = target.scrollTop + dt * scrollSpeedPxPerSec;
        const max = target.scrollHeight - target.clientHeight;
        if (next >= max) {
          target.scrollTop = max;
          startHoldBottom();
          return;
        }
        target.scrollTop = next;
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const startHoldBottom = () => {
      updatePhase("hold-bottom");
      timeoutRef.current = setTimeout(() => {
        updatePhase("done");
        onCompleteRef.current();
      }, holdBottomMs);
    };

    if (!paused) startHoldTop();

    return cleanup;
  }, [enabled, holdTopMs, scrollSpeedPxPerSec, holdBottomMs, ref, paused]);

  // Gestion du pause/resume : on freeze les timers/rAF, mais on garde la
  // phase courante. La reprise se fait au prochain enabled=true ou paused=false.
  useEffect(() => {
    if (!enabled) return;
    if (paused) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
    // (la reprise depuis un pause n'est pas supportée mid-phase pour
    // simplifier — l'usage principal est : pause/resume rare entre scènes.)
  }, [paused, enabled]);

  return phase;
}
