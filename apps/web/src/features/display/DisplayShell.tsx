import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PersistentFrame } from "./components/PersistentFrame";
import { PodiumStand } from "./components/PodiumStand";
import { RecentMatchesPanel } from "./components/RecentMatchesPanel";
import { RankingScene } from "./scenes/RankingScene";
import type { DisplaySource } from "./types";

interface Props {
  source: DisplaySource | null;
}

/**
 * Shell de la vue diffusion. PR1 : monte `PersistentFrame` avec :
 * - Col gauche : `RankingScene` (seule scène en PR1).
 * - Col droite : `PodiumStand compact` + `RecentMatchesPanel` + QR fixe.
 *
 * Gère ESC pour quitter, et l'effet "highlight 5s sur les joueurs du dernier
 * match" quand un nouveau match arrive.
 *
 * PR2 ajoutera `useDisplayScenes` + plusieurs scènes alternables ici.
 */
export function DisplayShell({ source }: Props) {
  const navigate = useNavigate();
  const lastMatchIdRef = useRef<string | null>(null);
  const [highlightedPlayerIds, setHighlightedPlayerIds] = useState<Set<string>>(
    new Set(),
  );

  // ESC = retour à la page parente
  useEffect(() => {
    if (!source) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate(source.exitPath);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [source, navigate]);

  // Highlight 5s les joueurs du dernier match dès qu'il change
  useEffect(() => {
    if (!source || source.matches.length === 0) return;
    const lastMatch = source.matches[0];
    if (lastMatch.id === lastMatchIdRef.current) return;
    lastMatchIdRef.current = lastMatch.id;
    setHighlightedPlayerIds(new Set([...lastMatch.teamA, ...lastMatch.teamB]));
    const timeout = setTimeout(() => setHighlightedPlayerIds(new Set()), 5000);
    return () => clearTimeout(timeout);
  }, [source]);

  if (!source) {
    return (
      <div className="h-screen flex items-center justify-center bg-navy text-white">
        <p className="font-archivo font-extrabold uppercase tracking-tight">
          Ressource introuvable.
        </p>
      </div>
    );
  }

  if (source.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-navy text-white">
        <p className="font-mono uppercase tracking-[2px] text-cool-gray text-sm">
          Chargement…
        </p>
      </div>
    );
  }

  const top3 = source.players.slice(0, 3);

  return (
    <PersistentFrame
      source={source}
      rightRail={
        <>
          <PodiumStand players={top3} variant="compact" />
          <RecentMatchesPanel source={source} max={5} />
        </>
      }
    >
      <RankingScene
        source={source}
        highlightedPlayerIds={highlightedPlayerIds}
      />
    </PersistentFrame>
  );
}
