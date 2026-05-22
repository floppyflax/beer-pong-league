import { useEffect, useRef, useState } from "react";
import type { Match } from "@/types";
import type { DisplaySource } from "../types";
import { isAudioReady, playChime, unlockAudio } from "../sound";

export interface NewMatchAlert {
  /** Match qui vient d'arriver (auto-effacé après ~3.2s). null sinon. */
  alertMatch: Match | null;
  /** Le son est-il activé (toggle clavier M). */
  soundOn: boolean;
  /** L'audio a-t-il été armé par un geste (sinon le son ne peut pas jouer). */
  audioArmed: boolean;
}

const ALERT_DURATION_MS = 3_200;

/**
 * Détecte l'arrivée d'un nouveau match et déclenche le feedback : expose le
 * match pour la bannière visuelle (canal primaire) et joue une sonnerie (renfort).
 *
 * - Garde de 1er mount : on ne déclenche pas pour l'état initial.
 * - Son : armé au 1er geste utilisateur (politique autoplay) ; toggle via `M`.
 * - Le visuel reste fonctionnel même si le son n'est jamais armé / est coupé.
 */
export function useNewMatchAlert(source: DisplaySource | null): NewMatchAlert {
  const [alertMatch, setAlertMatch] = useState<Match | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [audioArmed, setAudioArmed] = useState(false);

  const initializedRef = useRef(false);
  const lastSeenRef = useRef<string | null>(null);
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;

  // Armement audio au 1er geste (clavier ou pointeur), puis on se détache.
  useEffect(() => {
    const arm = () => {
      unlockAudio();
      setAudioArmed(isAudioReady());
    };
    window.addEventListener("keydown", arm, { once: true });
    window.addEventListener("pointerdown", arm, { once: true });
    return () => {
      window.removeEventListener("keydown", arm);
      window.removeEventListener("pointerdown", arm);
    };
  }, []);

  // Toggle son via la touche M.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "m" || e.key === "M") setSoundOn((s) => !s);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Détection nouveau match → bannière + son.
  useEffect(() => {
    if (!source) return;
    const latest = source.matches[0]?.id ?? null;

    if (!initializedRef.current) {
      initializedRef.current = true;
      lastSeenRef.current = latest;
      return;
    }
    if (!latest || latest === lastSeenRef.current) return;

    lastSeenRef.current = latest;
    const match = source.matches[0];
    if (!match) return;

    setAlertMatch(match);
    if (soundOnRef.current) playChime();

    const t = setTimeout(() => setAlertMatch(null), ALERT_DURATION_MS);
    return () => clearTimeout(t);
  }, [source]);

  return { alertMatch, soundOn, audioArmed };
}
