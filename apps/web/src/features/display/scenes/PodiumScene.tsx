import { PodiumStand } from "../components/PodiumStand";
import type { DisplaySource } from "../types";

interface Props {
  source: DisplaySource;
}

/**
 * Scène Podium plein écran : top 3 géants au centre, ticker des suivants
 * en bas pour le contexte.
 */
export function PodiumScene({ source }: Props) {
  const top3 = source.players.slice(0, 3);
  const next = source.players.slice(3, 10);

  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="font-archivo font-black uppercase tracking-[-0.6px] text-xl md:text-3xl mb-4 flex-shrink-0">
        Podium
      </h2>

      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="w-full max-w-3xl">
          <PodiumStand players={top3} variant="fullscreen" />
        </div>
      </div>

      {next.length > 0 && (
        <div className="flex-shrink-0 bg-navy-soft border border-card rounded-card px-4 py-3 mt-4 overflow-hidden">
          <div className="flex items-center gap-3 font-mono text-xs md:text-sm uppercase tracking-[2px] text-cool-gray font-bold whitespace-nowrap overflow-hidden">
            <span className="text-electric-blue">Suite ›</span>
            {next.map((p) => (
              <span key={p.id} className="flex items-center gap-1">
                <span className="text-white">#{p.rank}</span>
                <span>{p.name}</span>
                <span className="text-lime">{p.elo}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
