/**
 * TimelineView — mode "Timeline" du tab Activité d'une ligue.
 *
 * Affiche tous les matchs (libres + dans events) classés chronologiquement
 * en ordre décroissant, regroupés par headers de date ("Aujourd'hui",
 * "Hier", jour de semaine si < 7j, sinon "18 mai" ou "18 mai 25").
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { History, Plus } from "lucide-react";
import type { Event, Match, Player } from "@/types";
import { EmptyState } from "@/components/EmptyState";
import { PButton } from "@/components/ponglo/PButton";
import { TimelineMatchCard } from "./TimelineMatchCard";

export interface TimelineMatchEntry {
  match: Match;
  event: Event | null;
}

export interface TimelineViewProps {
  entries: TimelineMatchEntry[];
  players: Player[];
  leagueId: string;
}

const WEEKDAY_NAMES = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

const SHORT_MONTHS = [
  "jan.",
  "fév.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

function dateHeaderLabel(isoDay: string): string {
  const date = new Date(`${isoDay}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays > 1 && diffDays < 7) return WEEKDAY_NAMES[date.getDay()];

  const sameYear = date.getFullYear() === now.getFullYear();
  const day = date.getDate();
  const month = SHORT_MONTHS[date.getMonth()];
  if (sameYear) return `${day} ${month}`;
  return `${day} ${month} ${String(date.getFullYear()).slice(-2)}`;
}

export const TimelineView = ({
  entries,
  players,
  leagueId,
}: TimelineViewProps) => {
  const navigate = useNavigate();

  const groups = useMemo(() => {
    const sorted = [...entries].sort(
      (a, b) =>
        new Date(b.match.date).getTime() - new Date(a.match.date).getTime(),
    );

    const map = new Map<string, TimelineMatchEntry[]>();
    sorted.forEach((entry) => {
      const key = dateKey(entry.match.date);
      const bucket = map.get(key);
      if (bucket) {
        bucket.push(entry);
      } else {
        map.set(key, [entry]);
      }
    });
    return Array.from(map.entries());
  }, [entries]);

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Aucun match"
        description="Enregistre ton premier match pour démarrer l'historique."
        action={
          <PButton
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => navigate(`/record-match/league/${leagueId}`)}
          >
            Enregistrer un match
          </PButton>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {groups.map(([day, items]) => (
        <section key={day} aria-label={dateHeaderLabel(day)} className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-cool-gray font-bold">
              {dateHeaderLabel(day)}
            </span>
            <span className="flex-1 h-px bg-card/30" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            {items.map((entry) => (
              <TimelineMatchCard
                key={entry.match.id}
                match={entry.match}
                event={entry.event}
                players={players}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
