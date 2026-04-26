/**
 * CardShell — wrapper visuel partagé par EventCard et LeagueCard.
 *
 * Garantit que les deux cartes vivent dans la même famille visuelle :
 * fond `navy-soft`, bordure `card`, hover `cool-gray`, structure header
 * (status pill + titre + owner badge optionnel + chevron) puis un body
 * libre dessous (meta inline ou colonnes de stats).
 */

import React from "react";
import { ChevronRight } from "lucide-react";

export type CardShellStatusTone = "live" | "muted";

export interface CardShellStatus {
  label: string;
  /** `live` = lime, `muted` = cool-gray. */
  tone: CardShellStatusTone;
}

export interface CardShellProps {
  title: string;
  status?: CardShellStatus;
  /** Pill secondaire après le statut (ex: "Propriétaire"). */
  ownerLabel?: string;
  /** Bloc principal sous le header (meta inline ou colonnes de stats). */
  body?: React.ReactNode;
  /** Quand fourni, le shell devient un bouton et navigue. */
  onClick?: () => void;
  ariaLabel?: string;
  testId?: string;
}

export const CardShell: React.FC<CardShellProps> = ({
  title,
  status,
  ownerLabel,
  body,
  onClick,
  ariaLabel,
  testId,
}) => {
  const dotCls = status?.tone === "live" ? "bg-lime" : "bg-cool-gray";
  const textCls =
    status?.tone === "live" ? "text-lime" : "text-cool-gray";

  const inner = (
    <>
      <div className="flex-1 min-w-0">
        {(status || ownerLabel) && (
          <div className="flex items-center gap-2 mb-1.5">
            {status && (
              <>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${dotCls}`}
                  style={
                    status.tone === "live"
                      ? { boxShadow: "0 0 0 4px rgba(183,255,59,0.18)" }
                      : undefined
                  }
                />
                <span
                  className={`font-mono text-[10px] tracking-[1.5px] uppercase font-bold ${textCls}`}
                >
                  {status.label}
                </span>
              </>
            )}
            {ownerLabel && (
              <span className="font-mono text-[10px] tracking-[1.5px] uppercase font-bold text-ping-yellow">
                · {ownerLabel}
              </span>
            )}
          </div>
        )}
        <div className="font-archivo font-extrabold text-xl tracking-[-0.4px] truncate text-white">
          {title}
        </div>
        {body}
      </div>
      {onClick && (
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <ChevronRight size={18} className="text-white" />
        </div>
      )}
    </>
  );

  const className =
    "w-full bg-navy-soft border border-card rounded-card p-4 flex items-start gap-3 text-left hover:border-cool-gray transition-colors duration-75";

  if (!onClick) {
    return (
      <div className={className} data-testid={testId}>
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      data-testid={testId}
      aria-label={ariaLabel}
    >
      {inner}
    </button>
  );
};
