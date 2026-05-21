import { getInitials } from "@/utils/string";
import type { Highlight } from "../hooks/useDisplayHighlights";

interface Props {
  highlight: Highlight;
  /** `full` = plein écran centré ; `column` = compact pour 3 de front. */
  variant?: "full" | "column";
}

/**
 * Card visuelle d'un highlight (gain ELO, nemesis, upset, etc.).
 * `full` : un seul highlight plein écran. `column` : version compacte pour
 * afficher 3 highlights côte à côte.
 */
export function HighlightCard({ highlight, variant = "full" }: Props) {
  const compact = variant === "column";
  const avatarSize = compact ? "md" : "xl";
  const metricStyle = compact
    ? { fontSize: "clamp(40px, 9vh, 88px)", letterSpacing: "-3px" }
    : { fontSize: "min(160px, 18vh)", letterSpacing: "-5px" };

  return (
    <div
      className={`h-full flex flex-col items-center justify-center text-center ${
        compact ? "px-4 py-6 gap-4" : "px-6"
      }`}
    >
      <div
        className={`font-mono uppercase font-bold text-electric-blue ${
          compact
            ? "text-xs tracking-[3px] mb-2"
            : "text-sm md:text-base tracking-[6px] mb-8"
        }`}
      >
        {highlight.headline}
      </div>

      {highlight.kind === "player" ? (
        <SubjectAvatar
          name={highlight.subject.name}
          avatarUrl={highlight.subject.avatarUrl}
          size={avatarSize}
        />
      ) : (
        <div className={`flex items-center ${compact ? "gap-2" : "gap-6"}`}>
          <SubjectAvatar
            name={highlight.subjectA.name}
            avatarUrl={highlight.subjectA.avatarUrl}
            size={avatarSize}
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
          />
        </div>
      )}

      <div
        className={`font-archivo font-black tabular-nums text-white leading-none ${
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
}: {
  name: string;
  avatarUrl?: string;
  size?: "md" | "xl";
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
        className={`rounded-full bg-navy-deep flex items-center justify-center font-mono font-bold text-white overflow-hidden border-2 border-card ring-4 ring-electric-blue/60 ${cls}`}
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
