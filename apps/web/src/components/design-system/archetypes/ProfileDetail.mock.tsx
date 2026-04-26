/**
 * ProfileDetail archetype — represents PlayerProfile / UserProfile.
 *
 * Pattern: avatar + pseudo header + 3 stat cards + bio strip + achievement
 * card list.
 */

import { Trophy, Star, Flame } from "lucide-react";
import { AchievementCard } from "../molecules/AchievementCard";
import { FIXTURE_ACHIEVEMENT } from "./_fixtures";

export function ProfileDetailMock() {
  return (
    <div className="min-h-full bg-navy text-white px-4 pt-4 pb-6">
      {/* Avatar header */}
      <div className="flex flex-col items-center gap-3 pt-2 pb-4">
        <div className="w-24 h-24 rounded-full ring-4 ring-electric-blue/40 bg-electric-blue/15 text-electric-blue flex items-center justify-center font-archivo font-extrabold text-3xl">
          FL
        </div>
        <div className="text-center">
          <div className="font-archivo font-black text-2xl uppercase tracking-tight">
            Florian
          </div>
          <div className="text-[11px] font-mono uppercase tracking-[1.5px] text-lime mt-0.5">
            ELO 1234
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { label: "Matchs", value: 28, icon: Trophy },
          { label: "Wins", value: 19, icon: Star },
          { label: "Streak", value: 4, icon: Flame },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-navy-soft border border-card rounded-card p-3 text-center"
          >
            <s.icon size={14} className="text-electric-blue mx-auto mb-1" />
            <div className="font-archivo font-extrabold text-xl tabular-nums">
              {s.value}
            </div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-cool-gray mt-0.5">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <h2 className="text-xs font-mono uppercase tracking-[2px] text-cool-gray mt-6 mb-2">
        Succès
      </h2>
      <div className="space-y-2">
        <AchievementCard achievement={FIXTURE_ACHIEVEMENT} />
        <AchievementCard
          achievement={{
            ...FIXTURE_ACHIEVEMENT,
            slug: "streak_3",
            label: "Série de 3",
            description: "3 victoires d'affilée. Tu chauffes.",
            icon_key: "flame",
          }}
        />
      </div>
    </div>
  );
}
