import { useEffect, useRef, useState } from "react";
import type { DisplaySource, DisplaySourcePlayer } from "../types";
import { isAudioReady, playChime } from "../sound";

export type NewPlayerRevealPhase = "idle" | "alert";

export interface NewPlayerReveal {
  phase: NewPlayerRevealPhase;
  /** true pendant l'alerte → flou de l'arrière-plan. */
  blur: boolean;
  /** Joueurs annoncés dans l'alerte (au moins 1 si phase = "alert"). */
  alertPlayers: DisplaySourcePlayer[];
  /** Séquence en cours → DisplayShell met en pause la rotation. */
  active: boolean;
}

const ALERT_MS = 4_000;

interface Options {
  /**
   * Désactive la détection (typiquement quand un match reveal est en cours,
   * pour éviter deux alertes simultanées). Les nouveaux joueurs détectés
   * pendant cette période sont mis en file et joués après réactivation.
   */
  paused?: boolean;
  /** Appelée juste après l'alerte pour forcer un refresh des données. */
  onAfterAlert?: () => void;
  soundOn?: boolean;
}

/**
 * Orchestre l'arrivée d'un (ou plusieurs) nouveau(x) joueur(s) en mode
 * diffusion. Mirror simplifié de `useMatchReveal` :
 *
 * 1. **alert** (~4s) : flou de l'arrière-plan + alerte plein écran "NOUVEAU
 *    JOUEUR" avec l'avatar et le nom — sonnerie discrète.
 * 2. **idle** : reprise du slideshow, puis `onAfterAlert()` pour pousser un
 *    refresh immédiat de la source (sans attendre le prochain tick auto).
 *
 * Détection : on compare la liste des `player.id` avec le snapshot vu au
 * dernier tick. Tout id non présent au snapshot → nouveau. À l'initialisation
 * (1er rendu avec une liste non vide), on ne déclenche pas d'alerte — on
 * mémorise juste les ids existants.
 *
 * Batching : si plusieurs joueurs apparaissent dans le même tick, ils sont
 * groupés en une seule alerte (ex. import en masse).
 */
export function useNewPlayerReveal(
  source: DisplaySource | null,
  { paused = false, onAfterAlert, soundOn = true }: Options = {},
): NewPlayerReveal {
  const [phase, setPhase] = useState<NewPlayerRevealPhase>("idle");
  const [blur, setBlur] = useState(false);
  const [alertPlayers, setAlertPlayers] = useState<DisplaySourcePlayer[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  const initializedRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const sourceRef = useRef<DisplaySource | null>(source);
  sourceRef.current = source;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;
  const onAfterAlertRef = useRef(onAfterAlert);
  onAfterAlertRef.current = onAfterAlert;

  // Détection des nouveaux ids à chaque mise à jour de `source.players`.
  useEffect(() => {
    if (!source) return;
    const ids = source.players.map((p) => p.id);

    if (!initializedRef.current) {
      // Attendre que la liste soit chargée pour ne pas considérer le 1er
      // chargement comme "tous nouveaux".
      if (source.players.length === 0) return;
      initializedRef.current = true;
      seenIdsRef.current = new Set(ids);
      return;
    }

    const fresh = ids.filter((id) => !seenIdsRef.current.has(id));
    if (fresh.length === 0) return;
    // Marqué comme vu IMMÉDIATEMENT : même si l'alerte se joue plus tard
    // (paused), on n'accumule pas indéfiniment au rendu suivant.
    fresh.forEach((id) => seenIdsRef.current.add(id));
    setPendingIds((prev) => [...prev, ...fresh]);
  }, [source]);

  // Trigger : on a des pending et la séquence n'est ni active ni mise en
  // pause par le parent (typiquement pendant un matchReveal). Ne fait QUE
  // commuter en phase "alert" — la fermeture est gérée par le useEffect
  // suivant (sinon le cleanup du même effet annule son propre timer dès
  // le re-render qui suit setPhase, et l'alerte reste bloquée).
  useEffect(() => {
    if (phase !== "idle") return;
    if (paused) return;
    if (pendingIds.length === 0) return;
    const src = sourceRef.current;
    if (!src) return;

    const players = pendingIds
      .map((id) => src.players.find((p) => p.id === id))
      .filter((p): p is DisplaySourcePlayer => !!p);

    // Si on a perdu trace des joueurs (le snapshot a changé), on drain le
    // queue silencieusement.
    if (players.length === 0) {
      setPendingIds([]);
      return;
    }

    setPhase("alert");
    setBlur(true);
    setAlertPlayers(players);
    setPendingIds([]);
    if (soundOnRef.current && isAudioReady()) playChime();
  }, [phase, paused, pendingIds]);

  // Fermeture : dès qu'on entre en phase "alert", on programme un retour à
  // "idle" après ALERT_MS. Cleanup tire uniquement à l'unmount ou si la
  // phase change pour autre chose — pas sur un simple rerender.
  useEffect(() => {
    if (phase !== "alert") return;
    const t = setTimeout(() => {
      setPhase("idle");
      setBlur(false);
      setAlertPlayers([]);
      // Refresh immédiat (les données peuvent avoir bougé entre temps :
      // photo de profil, autre joueur qui rejoint…).
      try {
        onAfterAlertRef.current?.();
      } catch {
        // Silencieux : un échec de refresh ne doit pas casser l'écran.
      }
    }, ALERT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  return {
    phase,
    blur,
    alertPlayers,
    active: phase !== "idle",
  };
}
