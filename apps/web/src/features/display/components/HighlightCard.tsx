import { getInitials } from "@/utils/string";
import type { Highlight } from "../hooks/useDisplayHighlights";

interface Props {
  highlight: Highlight;
}

/**
 * Card visuelle d'un highlight (gain ELO, nemesis, upset, etc.).
 * Headline en mono uppercase, sujet(s) en grand avec avatar, métrique en
 * archivo XXL, tagline humaine.
 */
export function HighlightCard({ highlight }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6">
      <div className="font-mono text-sm md:text-base uppercase tracking-[6px] text-electric-blue font-bold mb-8">
        {highlight.headline}
      </div>

      {highlight.kind === "player" ? (
        <SubjectAvatar
          name={highlight.subject.name}
          avatarUrl={highlight.subject.avatarUrl}
        />
      ) : (
        <div className="flex items-center gap-6">
          <SubjectAvatar
            name={highlight.subjectA.name}
            avatarUrl={highlight.subjectA.avatarUrl}
          />
          <span className="font-archivo font-black text-5xl text-cool-gray">
            vs
          </span>
          <SubjectAvatar
            name={highlight.subjectB.name}
            avatarUrl={highlight.subjectB.avatarUrl}
          />
        </div>
      )}

      <div
        className="font-archivo font-black tabular-nums text-white leading-none mt-8 mb-4"
        style={{ fontSize: "min(160px, 18vh)", letterSpacing: "-5px" }}
      >
        {highlight.metric}
      </div>

      <p className="font-archivo font-extrabold uppercase tracking-tight text-xl md:text-3xl text-cool-gray max-w-2xl">
        {highlight.tagline}
      </p>
    </div>
  );
}

function SubjectAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string;
}) {
  const initials = getInitials(name);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-navy-deep flex items-center justify-center font-mono font-bold text-white overflow-hidden border-2 border-card ring-4 ring-electric-blue/60 text-5xl">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <span className="font-archivo font-extrabold uppercase tracking-tight text-2xl md:text-3xl text-white max-w-[180px] truncate">
        {name}
      </span>
    </div>
  );
}
