import { useState } from "react";
import type { Match } from "@/types";
import type { DisplaySource } from "../types";

interface Props {
  source: DisplaySource;
  /** Nombre max de photos affichées. */
  max?: number;
}

/**
 * Renvoie les matchs ayant une photo, le plus récent en premier.
 * Exporté pour que le DisplayShell décide d'inclure (ou non) la scène dans la
 * rotation selon qu'il y a des photos.
 */
export function matchesWithPhotos(source: DisplaySource): Match[] {
  return source.matches.filter((m) => !!m.photo_url);
}

/** Angle de rotation déterministe (-5°..+5°) dérivé de l'id du match, pour un
 *  rendu "freestyle" stable (pas de jitter à chaque render). */
function angleFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (Math.abs(h) % 11) - 5;
}

/**
 * Scène "mur de photos" : collage freestyle des dernières photos de victoire
 * (polaroids légèrement inclinés). Chaque polaroid légende l'équipe gagnante
 * + le score. Les photos en erreur de chargement se retirent d'elles-mêmes.
 */
export function PhotoWallScene({ source, max = 8 }: Props) {
  const photos = matchesWithPhotos(source).slice(0, max);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-0 items-center justify-center">
        <p className="font-archivo font-black uppercase tracking-tight text-3xl text-cool-gray text-center">
          Pas encore de photos
        </p>
        <p className="font-mono text-xs uppercase tracking-[2px] text-cool-gray/70 mt-3">
          Les photos de victoire apparaîtront ici
        </p>
      </div>
    );
  }

  const playerName = (id: string) =>
    source.players.find((p) => p.id === id)?.name ?? "Joueur";

  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="font-archivo font-black uppercase tracking-[-0.6px] text-xl md:text-3xl mb-4 flex-shrink-0">
        Le mur des champions
      </h2>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-wrap items-center justify-center gap-2 md:gap-4 content-center">
        {photos.map((m) => {
          const winnerA = m.scoreA > m.scoreB;
          const winners = (winnerA ? m.teamA : m.teamB)
            .map(playerName)
            .join(" & ");
          return (
            <Polaroid
              key={m.id}
              photoUrl={m.photo_url as string}
              winners={winners}
              score={`${Math.max(m.scoreA, m.scoreB)}-${Math.min(
                m.scoreA,
                m.scoreB,
              )}`}
              time={new Date(m.date).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              angle={angleFor(m.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function Polaroid({
  photoUrl,
  winners,
  score,
  time,
  angle,
}: {
  photoUrl: string;
  winners: string;
  score: string;
  time: string;
  angle: number;
}) {
  const [errored, setErrored] = useState(false);
  if (errored) return null;

  return (
    <div
      className="bg-white rounded-sm shadow-modal border border-white flex flex-col w-[26%] max-w-[260px] min-w-[150px] flex-shrink-0"
      style={{ transform: `rotate(${angle}deg)` }}
    >
      <div className="p-2 pb-1">
        <div className="aspect-square w-full bg-navy-deep rounded-sm overflow-hidden">
          <img
            src={photoUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setErrored(true)}
          />
        </div>
      </div>
      <div className="px-2 pb-2 flex items-center justify-center gap-2">
        <span className="font-archivo font-black tabular-nums text-navy bg-lime rounded px-1.5 text-xs md:text-sm flex-shrink-0">
          {score}
        </span>
        <span className="font-archivo font-extrabold uppercase tracking-tight text-navy truncate text-sm md:text-lg leading-tight">
          {winners}
        </span>
      </div>
      <div className="font-mono text-[9px] md:text-[10px] uppercase tracking-[1.5px] text-navy/50 font-bold text-center pb-2">
        {time}
      </div>
    </div>
  );
}
