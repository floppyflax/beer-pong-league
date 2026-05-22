import {
  ChevronsUp,
  Flame,
  Ghost,
  Handshake,
  Heart,
  HeartCrack,
  Swords,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { getInitials } from "@/utils/string";

/** Type de stat → accent visuel (couleur + picto). */
export type StatAccentKey =
  | "elo-gain"
  | "rank-climb"
  | "streak"
  | "upset"
  | "best-pair"
  | "worst-pair"
  | "best-ally"
  | "nemesis"
  | "rivalry";

export interface StatSubject {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface StatCardData {
  /** Clé unique React. */
  key: string;
  accent: StatAccentKey;
  headline: string;
  metric: string;
  tagline: string;
  /** 1 sujet (joueur seul) ou 2 (paire / duel). */
  subjects: StatSubject[];
  /** Connecteur entre 2 sujets : "&" (duo) ou "vs" (duel). */
  pairMode?: "and" | "vs";
}

interface Accent {
  Icon: LucideIcon;
  text: string;
  ring: string;
  border: string;
  chip: string;
}

const STAT_ACCENT: Record<StatAccentKey, Accent> = {
  "elo-gain": { Icon: TrendingUp, text: "text-lime", ring: "ring-lime", border: "border-lime/60", chip: "bg-lime/15" },
  "rank-climb": { Icon: ChevronsUp, text: "text-electric-blue", ring: "ring-electric-blue", border: "border-electric-blue/60", chip: "bg-electric-blue/15" },
  streak: { Icon: Flame, text: "text-ping-yellow", ring: "ring-ping-yellow", border: "border-ping-yellow/60", chip: "bg-ping-yellow/15" },
  upset: { Icon: Swords, text: "text-signal-red", ring: "ring-signal-red", border: "border-signal-red/60", chip: "bg-signal-red/15" },
  "best-pair": { Icon: Heart, text: "text-lime", ring: "ring-lime", border: "border-lime/60", chip: "bg-lime/15" },
  "worst-pair": { Icon: HeartCrack, text: "text-signal-red", ring: "ring-signal-red", border: "border-signal-red/60", chip: "bg-signal-red/15" },
  "best-ally": { Icon: Handshake, text: "text-electric-blue", ring: "ring-electric-blue", border: "border-electric-blue/60", chip: "bg-electric-blue/15" },
  nemesis: { Icon: Ghost, text: "text-bronze", ring: "ring-bronze", border: "border-bronze/60", chip: "bg-bronze/20" },
  rivalry: { Icon: Swords, text: "text-ping-yellow", ring: "ring-ping-yellow", border: "border-ping-yellow/60", chip: "bg-ping-yellow/15" },
};

export function getStatAccent(key: StatAccentKey): Accent {
  return STAT_ACCENT[key];
}

interface Props {
  data: StatCardData;
  /** `full` = plein écran centré ; `column` = compact pour 3 de front. */
  variant?: "full" | "column";
}

/**
 * Carte générique d'une stat marquante (moment joueur OU duo/rivalité).
 * Consommée par `HighlightScene` et `DuosRivalriesScene`. Chaque type a sa
 * couleur + son picto.
 */
export function StatRevealCard({ data, variant = "column" }: Props) {
  const compact = variant === "column";
  const accent = STAT_ACCENT[data.accent];
  const Icon = accent.Icon;
  const avatarSize = compact ? "md" : "xl";
  const metricStyle = compact
    ? { fontSize: "clamp(40px, 9vh, 88px)", letterSpacing: "-3px" }
    : { fontSize: "min(160px, 18vh)", letterSpacing: "-5px" };
  const connector = data.pairMode === "vs" ? "vs" : "&";

  return (
    <div
      className={`h-full flex flex-col items-center justify-center text-center ${
        compact ? "px-4 py-6 gap-3" : "px-6"
      }`}
    >
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
            ? "text-xs tracking-[2px] mb-1"
            : "text-sm md:text-base tracking-[5px] mb-6"
        }`}
      >
        {data.headline}
      </div>

      {data.subjects.length === 1 ? (
        <SubjectAvatar subject={data.subjects[0]} size={avatarSize} ringClass={accent.ring} />
      ) : (
        <div className={`flex items-center ${compact ? "gap-2" : "gap-6"}`}>
          <SubjectAvatar subject={data.subjects[0]} size={avatarSize} ringClass={accent.ring} />
          <span
            className={`font-archivo font-black text-cool-gray ${
              compact ? "text-xl" : "text-5xl"
            }`}
          >
            {connector}
          </span>
          <SubjectAvatar subject={data.subjects[1]} size={avatarSize} ringClass={accent.ring} />
        </div>
      )}

      <div
        className={`font-archivo font-black tabular-nums leading-none ${accent.text} ${
          compact ? "" : "mt-8 mb-4"
        }`}
        style={metricStyle}
      >
        {data.metric}
      </div>

      <p
        className={`font-archivo font-extrabold uppercase tracking-tight text-cool-gray ${
          compact ? "text-sm md:text-base" : "text-xl md:text-3xl max-w-2xl"
        }`}
      >
        {data.tagline}
      </p>
    </div>
  );
}

function SubjectAvatar({
  subject,
  size = "xl",
  ringClass,
}: {
  subject: StatSubject;
  size?: "md" | "xl";
  ringClass: string;
}) {
  const cls =
    size === "md"
      ? "w-16 h-16 md:w-20 md:h-20 text-xl"
      : "w-32 h-32 md:w-40 md:h-40 text-5xl";
  const nameCls =
    size === "md"
      ? "text-base md:text-lg max-w-[110px]"
      : "text-2xl md:text-3xl max-w-[180px]";
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`rounded-full bg-navy-deep flex items-center justify-center font-mono font-bold text-white overflow-hidden border-2 border-card ring-4 ${ringClass} ${cls}`}
      >
        {subject.avatarUrl ? (
          <img src={subject.avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>{getInitials(subject.name)}</span>
        )}
      </div>
      <span
        className={`font-archivo font-extrabold uppercase tracking-tight text-white truncate ${nameCls}`}
      >
        {subject.name}
      </span>
    </div>
  );
}
