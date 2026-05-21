/**
 * EventCard — listing pressed-card pour un événement.
 *
 * Construit sur `CardShell` (partagé avec `LeagueCard`).
 * Header : pill statut (en cours / à venir / terminé) + rang `1er / N` à
 * droite du titre quand je participe. Body : meta inline
 * (joueurs · matchs · format · ELO).
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import type { Event } from "@/types";
import { CardShell, type CardShellStatus } from "./CardShell";
import { getEventLifecycle } from "@/utils/eventLifecycle";
import { useMyEventRank } from "@/hooks/useMyContextRankings";
import { MyRankBadge } from "../atoms/MyRankBadge";

export interface EventCardProps {
  event: Event;
  /** `true` (default) navigue vers `/event/:id`. `false` = lecture seule. */
  interactive?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  interactive = true,
}) => {
  const navigate = useNavigate();
  const myRank = useMyEventRank(event.id);

  const playerCount = event.playerIds?.length ?? 0;
  const matchCount = event.matches?.length ?? 0;

  const formatLabel =
    event.format === "libre"
      ? "Libre"
      : event.format.toUpperCase().replace("V", "v");

  const lifecycle = getEventLifecycle(event);
  const futureDateLabel = event.date
    ? new Date(event.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
    : "À venir";

  const status: CardShellStatus = {
    label:
      lifecycle === "finished"
        ? "Terminé"
        : lifecycle === "paused"
          ? "En pause"
          : lifecycle === "not_started"
            ? futureDateLabel
            : "En ce moment",
    tone: lifecycle === "in_progress" ? "live" : "muted",
  };

  const body = (
    <div className="text-[13px] text-cool-gray mt-0.5 flex items-center gap-1.5 flex-wrap">
      <span>
        {playerCount} {playerCount === 1 ? "joueur" : "joueurs"}
      </span>
      <span className="opacity-40">·</span>
      <span>
        {matchCount} {matchCount === 1 ? "match" : "matchs"}
      </span>
      <span className="opacity-40">·</span>
      <span>{formatLabel}</span>
      <span className="opacity-40">·</span>
      <span className="text-lime font-bold">ELO</span>
    </div>
  );

  return (
    <CardShell
      title={event.name}
      status={status}
      titleSuffix={
        myRank ? <MyRankBadge rank={myRank.rank} total={myRank.total} /> : undefined
      }
      body={body}
      testId="event-card"
      ariaLabel={`Voir l'événement ${event.name}`}
      onClick={
        interactive ? () => navigate(`/event/${event.id}`) : undefined
      }
    />
  );
};
