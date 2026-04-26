/**
 * DisplayTV archetype — represents DisplayView / EventDisplayView (full-screen
 * leaderboard for a TV mounted on the wall).
 *
 * Pattern: large title, scrolling ranked list, big QR code on the side.
 */

import { RankBadge } from "../atoms/RankBadge";
import { FIXTURE_PLAYERS } from "./_fixtures";

export function DisplayTVMock() {
  return (
    <div className="min-h-full bg-navy text-white p-5 flex flex-col gap-4">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[2px] text-electric-blue">
          Live
        </p>
        <h1 className="font-archivo font-black text-3xl uppercase tracking-tight">
          Méchoui XIII
        </h1>
        <p className="text-xs text-cool-gray mt-0.5">
          Classement en direct · ELO ranked
        </p>
      </div>

      <div className="flex-1 space-y-1.5">
        {FIXTURE_PLAYERS.map((p, i) => {
          const rank = i + 1;
          return (
            <div
              key={p.id}
              className="bg-navy-soft rounded-card border border-card px-3 py-2.5 flex items-center gap-3"
            >
              <RankBadge rank={rank} size="sm" />
              <div className="flex-1 font-archivo font-extrabold text-sm uppercase tracking-tight truncate">
                {p.name}
              </div>
              <div className="font-mono text-sm text-lime tabular-nums">
                {p.elo}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mock QR */}
      <div className="bg-white rounded-lg p-2 self-end w-20 h-20 grid grid-cols-5 gap-px">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className={`aspect-square ${Math.random() > 0.5 ? "bg-navy" : "bg-white"}`}
          />
        ))}
      </div>
    </div>
  );
}
