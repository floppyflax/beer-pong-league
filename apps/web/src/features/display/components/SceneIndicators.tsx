import type {
  SceneConfig,
  SceneId,
} from "../hooks/useDisplayScenes";
import type { SelfPacedScrollPhase } from "../hooks/useSelfPacedScroll";

interface Props {
  scenes: SceneConfig[];
  activeId: SceneId;
  /** Pour les scènes timed : 0..1. Pour self-paced : ignoré. */
  progress: number;
  /** Pour la scène self-paced active : sa phase actuelle. */
  selfPacedPhase?: SelfPacedScrollPhase;
  isPaused: boolean;
}

const SCENE_LABEL: Record<SceneId, string> = {
  ranking: "Classement",
  "ranking-wide": "Classement +",
  podium: "Podium",
  "live-match": "Dernier match",
  highlight: "Highlight",
  stats: "Stats",
  "photo-wall": "Photos",
  duos: "Duos",
  "player-focus": "Joueur",
};

const PHASE_LABEL: Record<SelfPacedScrollPhase, string> = {
  idle: "—",
  "hold-top": "Tête de liste",
  scrolling: "Scroll",
  "hold-bottom": "Fin de liste",
  done: "Bouclé",
};

/**
 * Barre de dots scènes en bas du SceneStage. Pour la scène active :
 * - timed → barre de progression linéaire qui se remplit avec `progress`.
 * - self-paced → dot pulse + sous-libellé `phase`.
 */
export function SceneIndicators({
  scenes,
  activeId,
  progress,
  selfPacedPhase,
  isPaused,
}: Props) {
  return (
    <div
      className="flex items-center justify-center gap-3 md:gap-5 py-3"
      data-testid="scene-indicators"
    >
      {scenes.map((s) => {
        const isActive = s.id === activeId;
        const isTimed = s.mode === "timed";
        return (
          <div key={s.id} className="flex flex-col items-center gap-1 min-w-[80px]">
            <div
              className={`relative h-2 w-16 md:w-20 rounded-full overflow-hidden ${
                isActive ? "bg-cool-gray/45" : "bg-cool-gray/25"
              }`}
            >
              {isActive && isTimed && (
                <div
                  className="absolute inset-y-0 left-0 bg-electric-blue transition-[width] duration-100"
                  style={{ width: `${Math.max(0, progress) * 100}%` }}
                />
              )}
              {isActive && !isTimed && (
                <div className="absolute inset-0 bg-electric-blue animate-pulse" />
              )}
            </div>
            <span
              className={`font-mono text-[9px] md:text-[10px] uppercase tracking-[1.5px] font-bold ${
                isActive ? "text-white" : "text-cool-gray"
              }`}
            >
              {SCENE_LABEL[s.id]}
            </span>
            {isActive && !isTimed && selfPacedPhase && (
              <span className="font-mono text-[8px] md:text-[9px] uppercase tracking-[1px] text-electric-blue">
                {PHASE_LABEL[selfPacedPhase]}
              </span>
            )}
          </div>
        );
      })}
      {isPaused && (
        <span className="font-mono text-[10px] uppercase tracking-[2px] text-ping-yellow font-bold ml-3">
          ⏸ Pause
        </span>
      )}
    </div>
  );
}
