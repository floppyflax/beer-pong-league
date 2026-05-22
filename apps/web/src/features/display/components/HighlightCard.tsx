import {
  ChevronsUp,
  Flame,
  Skull,
  Swords,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { getInitials } from "@/utils/string";
import type { Highlight, HighlightType } from "../hooks/useDisplayHighlights";

interface Props {
  highlight: Highlight;
  /** `full` = plein écran centré ; `column` = compact pour 3 de front. */
  variant?: "full" | "column";
}

/** Accent visuel (couleur + picto) propre à chaque type de highlight, pour les
 *  distinguer d'un coup d'œil. Classes statiques (pas d'interpolation) pour
 *  rester compatibles avec le purge Tailwind. */
interface HighlightAccent {
  Icon: LucideIcon;
  text: string;
  ring: string;
  border: string;
  chip: string;
}

const HIGHLIGHT_ACCENT: Record<HighlightType, HighlightAccent> = {
  "biggest-elo-gain": {
    Icon: TrendingUp,
    text: "text-lime",
    ring: "ring-lime",
    border: "border-lime/60",
    chip: "bg-lime/15",
  },
  "biggest-rank-climb": {
    Icon: ChevronsUp,
    text: "text-electric-blue",
    ring: "ring-electric-blue",
    border: "border-electric-blue/60",
    chip: "bg-electric-blue/15",
  },
  "current-streak": {
    Icon: Flame,
    text: "text-ping-yellow",
    ring: "ring-ping-yellow",
    border: "border-ping-yellow/60",
    chip: "bg-ping-yellow/15",
  },
  upset: {
    Icon: Swords,
    text: "text-signal-red",
    ring: "ring-signal-red",
    border: "border-signal-red/60",
    chip: "bg-signal-red/15",
  },
  nemesis: {
    Icon: Skull,
    text: "text-bronze",
    ring: "ring-bronze",
    border: "border-bronze/60",
    chip: "bg-bronze/20",
  },
  "best-pair": {
    Icon: Users,
    text: "text-electric-blue",
    ring: "ring-electric-blue",
    border: "border-electric-blue/60",
    chip: "bg-electric-blue/15",
  },
};

export function getHighlightAccent(type: HighlightType): HighlightAccent {
  return HIGHLIGHT_ACCENT[type];
}

/**
 * Card visuelle d'un highlight (gain ELO, nemesis, upset, etc.).
 * `full` : un seul highlight plein écran. `column` : version compacte pour
 * afficher 3 highlights côte à côte. Chaque type a sa couleur + son picto.
 */
export function HighlightCard({ highlight, variant = "full" }: Props) {
  const compact = variant === "column";
  const accent = getHighlightAccent(highlight.type);
  const Icon = accent.Icon;
  const avatarSize = compact ? "md" : "xl";
  const metricStyle = compact
    ? { fontSize: "clamp(40px, 9vh, 88px)", letterSpacing: "-3px" }
    : { fontSize: "min(160px, 18vh)", letterSpacing: "-5px" };

  return (
    <div
      className={`h-full flex flex-col items-center justify-center text-center ${
        compact ? "px-4 py-6 gap-3" : "px-6"
      }`}
    >
      {/* Picto + headline colorés par type */}
      <div
        className={`flex items-center justify-center rounded-full ${accent.chip} ${
          compact ? "w-12 h-12 mb-1" : "w-16 h-16 mb-4"
        }`}
      >
        <Icon className={accent.text} size={compact ? 24 : 32} aria-hidden />
      </div>
      <div
        className={`font-mono uppercase font-bold ${accent.text} ${
          compact
            ? "text-xs tracking-[3px] mb-1"
            : "text-sm md:text-base tracking-[6px] mb-6"
        }`}
      >
        {highlight.headline}
      </div>

      {highlight.kind === "player" ? (
        <SubjectAvatar
          name={highlight.subject.name}
          avatarUrl={highlight.subject.avatarUrl}
          size={avatarSize}
          ringClass={accent.ring}
        />
      ) : (
        <div className={`flex items-center ${compact ? "gap-2" : "gap-6"}`}>
          <SubjectAvatar
            name={highlight.subjectA.name}
            avatarUrl={highlight.subjectA.avatarUrl}
            size={avatarSize}
            ringClass={accent.ring}
          />
          <span
            className={`font-archivo font-black text-cool-gray ${
              compact ? "text-2xl" : "text-5xl"
            }`}
          >
            vs
          </span>
          <SubjectAvatar
            name={highlight.subjectB.name}
            avatarUrl={highlight.subjectB.avatarUrl}
            size={avatarSize}
            ringClass={accent.ring}
          />
        </div>
      )}

      <div
        className={`font-archivo font-black tabular-nums leading-none ${accent.text} ${
          compact ? "" : "mt-8 mb-4"
        }`}
        style={metricStyle}
      >
        {highlight.metric}
      </div>

      <p
        className={`font-archivo font-extrabold uppercase tracking-tight text-cool-gray ${
          compact ? "text-sm md:text-lg" : "text-xl md:text-3xl max-w-2xl"
        }`}
      >
        {highlight.tagline}
      </p>
    </div>
  );
}

function SubjectAvatar({
  name,
  avatarUrl,
  size = "xl",
  ringClass,
}: {
  name: string;
  avatarUrl?: string;
  size?: "md" | "xl";
  ringClass: string;
}) {
  const cls =
    size === "md"
      ? "w-20 h-20 md:w-24 md:h-24 text-2xl"
      : "w-32 h-32 md:w-40 md:h-40 text-5xl";
  const nameCls =
    size === "md"
      ? "text-lg md:text-xl max-w-[120px]"
      : "text-2xl md:text-3xl max-w-[180px]";
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`rounded-full bg-navy-deep flex items-center justify-center font-mono font-bold text-white overflow-hidden border-2 border-card ring-4 ${ringClass} ${cls}`}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      <span
        className={`font-archivo font-extrabold uppercase tracking-tight text-white truncate ${nameCls}`}
      >
        {name}
      </span>
    </div>
  );
}
