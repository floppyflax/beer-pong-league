/**
 * AchievementCard — displays a single earned achievement.
 *
 * Phase D.3 — Beer Pong ELO redesign.
 *
 * Uses only Tailwind tokens from the Everything ELO palette (invariant #4).
 */

import { Flag, Star, Flame, Trophy } from "lucide-react";

export interface Achievement {
  slug: string;
  label: string;
  description: string;
  icon_key: string;
  earned_at: string;
}

interface AchievementCardProps {
  achievement: Achievement;
  className?: string;
}

function AchievementIcon({ iconKey }: { iconKey: string }) {
  const cls = "text-ping-yellow";
  const size = 20;
  switch (iconKey) {
    case "flag":  return <Flag  size={size} className={cls} />;
    case "star":  return <Star  size={size} className={cls} />;
    case "flame": return <Flame size={size} className={cls} />;
    default:      return <Trophy size={size} className={cls} />;
  }
}

export function AchievementCard({ achievement, className = "" }: AchievementCardProps) {
  const earnedDate = new Date(achievement.earned_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      data-testid="achievement-card"
      className={`flex items-center gap-3 bg-navy-soft rounded-card border border-card p-3 ${className}`}
    >
      {/* Icon badge */}
      <div className="w-10 h-10 rounded-full bg-ping-yellow/15 border border-ping-yellow/40 flex items-center justify-center flex-shrink-0">
        <AchievementIcon iconKey={achievement.icon_key} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-archivo font-extrabold uppercase tracking-tight text-white truncate">
          {achievement.label}
        </p>
        <p className="text-xs text-cool-gray truncate">{achievement.description}</p>
        <p className="text-[10px] font-mono text-cool-gray/60 mt-0.5">{earnedDate}</p>
      </div>
    </div>
  );
}
