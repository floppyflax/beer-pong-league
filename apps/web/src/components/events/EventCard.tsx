import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Tournament } from "../../types";

interface EventCardProps {
  tournament: Tournament;
  interactive?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  tournament,
  interactive = true,
}) => {
  const navigate = useNavigate();

  const playerCount = tournament.playerIds?.length ?? 0;
  const matchCount = tournament.matches?.length ?? 0;

  const formatLabel =
    tournament.format === "libre"
      ? "Libre"
      : tournament.format.toUpperCase().replace("V", "v");

  const today = new Date().toISOString().slice(0, 10);
  const eventDay = tournament.date ? new Date(tournament.date).toISOString().slice(0, 10) : null;
  const isFuture = eventDay ? eventDay > today : false;
  const isLive = !tournament.isFinished && !isFuture;

  const badgeLabel = tournament.isFinished
    ? "Terminé"
    : isFuture && eventDay
    ? new Date(tournament.date!).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : "En ce moment";

  const badgeColor = isLive ? "text-lime" : "text-cool-gray";
  const dotColor = isLive ? "bg-lime" : "bg-cool-gray";

  const content = (
    <>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}
            style={isLive ? { boxShadow: "0 0 0 4px rgba(183,255,59,0.18)" } : undefined}
          />
          <span className={`font-mono text-[10px] tracking-[1.5px] uppercase font-bold ${badgeColor}`}>
            {badgeLabel}
          </span>
        </div>
        <div className="font-archivo font-extrabold text-xl tracking-[-0.4px] truncate text-white">
          {tournament.name}
        </div>
        <div className="text-[13px] text-cool-gray mt-0.5 flex items-center gap-1.5 flex-wrap">
          <span>{playerCount} {playerCount === 1 ? "joueur" : "joueurs"}</span>
          <span className="opacity-40">·</span>
          <span>{matchCount} {matchCount === 1 ? "match" : "matchs"}</span>
          <span className="opacity-40">·</span>
          <span>{formatLabel}</span>
          <span className="opacity-40">·</span>
          <span className="text-lime font-bold">ELO</span>
        </div>
      </div>
      {interactive && (
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <ChevronRight size={18} className="text-white" />
        </div>
      )}
    </>
  );

  if (!interactive) {
    return (
      <div
        className="w-full bg-navy-soft border-[1.5px] border-white/20 rounded-lg p-4 flex items-center gap-3"
        data-testid="tournament-card"
      >
        {content}
      </div>
    );
  }

  return (
    <button
      className="w-full bg-navy-soft border-[1.5px] border-white rounded-lg p-4 shadow-[0_3px_0_#F4F2E8] flex items-center gap-3 text-left hover:brightness-110 transition-[filter] duration-75 active:translate-y-[2px] active:shadow-none"
      onClick={() => navigate(`/event/${tournament.id}`)}
      data-testid="tournament-card"
      aria-label={`Voir l'événement ${tournament.name}`}
    >
      {content}
    </button>
  );
};
