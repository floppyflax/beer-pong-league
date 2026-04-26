/**
 * ContextPickerModal — sheet that lets a user pick which event or
 * league a new match belongs to. Used by RecordMatch.
 */

import { Calendar, Trophy } from "lucide-react";
import { Sheet } from "../Sheet";
import type { Team } from "./recordMatchInternals";

type ContextType = "event" | "league";

export interface ContextPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: Array<{
    id: string;
    name: string;
    isFinished?: boolean;
    format?: string;
  }>;
  leagues: Array<{ id: string; name: string; status?: string }>;
  currentType: ContextType | null;
  currentId: string | null;
  onPick: (type: ContextType, id: string) => void;
}

// Re-export Team so callers grouping imports get one entry point.
export type { Team };

export function ContextPickerModal({
  isOpen,
  onClose,
  events,
  leagues,
  currentType,
  currentId,
  onPick,
}: ContextPickerModalProps) {
  const activeEvents = events.filter((t) => !t.isFinished);
  const activeLeagues = leagues.filter((l) => l.status !== "finished");

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Choisir un contexte" maxWidth="md">
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-ping-yellow" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-cool-gray">
              Événements
            </h3>
          </div>
          {activeEvents.length === 0 ? (
            <p className="text-xs text-cool-gray/60 italic px-1 py-2">
              Aucun événement actif.
            </p>
          ) : (
            <div className="space-y-1.5">
              {activeEvents.map((t) => {
                const active =
                  currentType === "event" && currentId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onPick("event", t.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-card border transition-colors ${
                      active
                        ? "bg-electric-blue/15 border-electric-blue text-white"
                        : "bg-navy border-card hover:border-cool-gray text-white"
                    }`}
                  >
                    <div className="font-archivo font-bold uppercase tracking-tight text-sm truncate">
                      {t.name}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-cool-gray mt-0.5">
                      {t.format ?? "libre"}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={14} className="text-electric-blue" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-cool-gray">
              Ligues
            </h3>
          </div>
          {activeLeagues.length === 0 ? (
            <p className="text-xs text-cool-gray/60 italic px-1 py-2">
              Aucune ligue active.
            </p>
          ) : (
            <div className="space-y-1.5">
              {activeLeagues.map((l) => {
                const active = currentType === "league" && currentId === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => onPick("league", l.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-card border transition-colors ${
                      active
                        ? "bg-electric-blue/15 border-electric-blue text-white"
                        : "bg-navy border-card hover:border-cool-gray text-white"
                    }`}
                  >
                    <div className="font-archivo font-bold uppercase tracking-tight text-sm truncate">
                      {l.name}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
