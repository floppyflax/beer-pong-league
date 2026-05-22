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
   * Quand `true`, freeze : les timers sont stoppés. À la reprise (`false`),
   * la séquence redémarre depuis hold-top (cas rare, on ne mémorise pas la
   * progression intermédiaire).
   */
  paused?: boolean;
}

/**
 * Pilote un container scrollable en 3 phases : hold-top → scrolling lent →
 * hold-bottom → onComplete.
 *
 * IMPORTANT — robustesse arrière-plan : la complétion (`onComplete`) est
 * garantie par un **timer maître `setTimeout`** dont la durée est calculée une
 * fois au démarrage (`holdTop + overflowPx/speed + holdBottom`). On n'utilise
 * PAS `requestAnimationFrame` : il est suspendu quand l'onglet n'est pas
 * visible / focus (cas typique d'un écran de diffusion sur un second moniteur
 * ou en arrière-plan), ce qui bloquait la rotation. Le défilement visuel est
 * appliqué par un `setInterval` purement cosmétique : même throttlé en
 * arrière-plan, le timer maître fait avancer la scène.
 *
 * Skip "scrolling" + "hold-bottom" si le contenu tient dans le viewport.
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
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!enabled || paused) {
      setPhase("idle");
      const el = ref.current;
      if (el) el.scrollTop = 0;
      return;
    }

    const el = ref.current;
    if (el) el.scrollTop = 0;

    // Mesure de l'overflow une seule fois (le layout est settle après paint).
    const overflow = el ? Math.max(0, el.scrollHeight - el.clientHeight) : 0;
    const hasOverflow = overflow > 4;
    const scrollMs = hasOverflow
      ? (overflow / scrollSpeedPxPerSec) * 1000
      : 0;
    const totalMs = holdTopMs + scrollMs + holdBottomMs;

    setPhase("hold-top");
    const t0 = Date.now();

    // Stepping cosmétique du scroll + libellé de phase.
    const stepIv = setInterval(() => {
      const elapsed = Date.now() - t0;
      const target = ref.current;
      if (elapsed < holdTopMs) {
        setPhase("hold-top");
        if (target) target.scrollTop = 0;
      } else if (hasOverflow && elapsed < holdTopMs + scrollMs) {
        setPhase("scrolling");
        if (target) {
          const p = (elapsed - holdTopMs) / scrollMs;
          target.scrollTop = overflow * p;
        }
      } else {
        setPhase("hold-bottom");
        if (target) target.scrollTop = overflow;
      }
    }, 50);

    // Timer maître : garantit l'advance même si setInterval est throttlé.
    // Clear l'interval cosmétique pour qu'il n'écrase pas la phase "done".
    const completeTimer = setTimeout(() => {
      clearInterval(stepIv);
      setPhase("done");
      onCompleteRef.current();
    }, totalMs);

    return () => {
      clearTimeout(completeTimer);
      clearInterval(stepIv);
    };
  }, [enabled, holdTopMs, scrollSpeedPxPerSec, holdBottomMs, ref, paused]);

  return phase;
}
