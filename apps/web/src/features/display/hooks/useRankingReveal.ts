import { useEffect, useRef, useState } from "react";
import type { DisplaySource, DisplaySourcePlayer } from "../types";
import type { SceneId } from "./useDisplayScenes";

export interface RankingReveal {
  /**
   * Ordre du classement **affiché** (gelé jusqu'au reveal). Diffère de
   * `source.players` tant qu'un nouveau match n'a pas été "révélé" sur le
   * slide Classement.
   */
  committedPlayers: DisplaySourcePlayer[];
  /** Joueurs du dernier match en surbrillance pendant le reveal. */
  highlightedPlayerIds: Set<string>;
  /** Id du match à faire clignoter dans le panneau "Derniers matchs". */
  blinkMatchId: string | null;
}

const REVEAL_DELAY_MS = 1_500;
const GLOW_DURATION_MS = 6_000;
const BLINK_DURATION_MS = 6_000;

/**
 * Orchestre la révélation d'un nouveau match en mode diffusion.
 *
 * Principe : on **ne met pas à jour le classement en arrière-plan**. Quand un
 * match tombe (depuis un autre appareil), on gèle l'ordre affiché et on note
 * un match "en attente". Dès que le slide Classement (re)devient actif, on
 * attend `REVEAL_DELAY_MS` puis on commit le nouvel ordre — ce qui déclenche
 * l'animation de réordonnancement (auto-animate) — et on met les protagonistes
 * en surbrillance. Le nouveau match clignote aussi dans le panneau dédié.
 *
 * Vit dans le DisplayShell (persiste entre les scènes), car `RankingScene` se
 * démonte quand elle n'est pas active et ne peut pas mémoriser l'ancien ordre.
 */
export function useRankingReveal(
  source: DisplaySource | null,
  activeSceneId: SceneId,
): RankingReveal {
  const [committedPlayers, setCommittedPlayers] = useState<
    DisplaySourcePlayer[] | null
  >(null);
  const [highlightedPlayerIds, setHighlightedPlayerIds] = useState<Set<string>>(
    new Set(),
  );
  const [blinkMatchId, setBlinkMatchId] = useState<string | null>(null);
  const [pendingMatchId, setPendingMatchId] = useState<string | null>(null);

  const initializedRef = useRef(false);
  const lastSeenMatchIdRef = useRef<string | null>(null);
  const sourceRef = useRef<DisplaySource | null>(source);
  sourceRef.current = source;

  // Détection d'un nouveau match — sans toucher au classement affiché.
  useEffect(() => {
    if (!source) return;
    const latest = source.matches[0]?.id ?? null;

    if (!initializedRef.current) {
      initializedRef.current = true;
      lastSeenMatchIdRef.current = latest;
      setCommittedPlayers(source.players);
      return;
    }

    if (latest && latest !== lastSeenMatchIdRef.current) {
      lastSeenMatchIdRef.current = latest;
      setPendingMatchId(latest);
      setBlinkMatchId(latest);
    }
  }, [source]);

  // Reveal : quand on arrive sur le Classement avec un match en attente.
  useEffect(() => {
    if (activeSceneId !== "ranking") return;
    if (!pendingMatchId) return;
    const revealedId = pendingMatchId;
    const timer = setTimeout(() => {
      const src = sourceRef.current;
      if (src) {
        setCommittedPlayers(src.players);
        const m = src.matches.find((mm) => mm.id === revealedId);
        if (m) {
          setHighlightedPlayerIds(new Set([...m.teamA, ...m.teamB]));
        }
      }
      setPendingMatchId(null);
    }, REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [activeSceneId, pendingMatchId]);

  // Extinction de la surbrillance.
  useEffect(() => {
    if (highlightedPlayerIds.size === 0) return;
    const t = setTimeout(() => setHighlightedPlayerIds(new Set()), GLOW_DURATION_MS);
    return () => clearTimeout(t);
  }, [highlightedPlayerIds]);

  // Extinction du clignotement du match.
  useEffect(() => {
    if (!blinkMatchId) return;
    const t = setTimeout(() => setBlinkMatchId(null), BLINK_DURATION_MS);
    return () => clearTimeout(t);
  }, [blinkMatchId]);

  return {
    committedPlayers: committedPlayers ?? source?.players ?? [],
    highlightedPlayerIds,
    blinkMatchId,
  };
}
