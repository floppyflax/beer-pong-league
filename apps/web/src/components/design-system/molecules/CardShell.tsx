/**
 * CardShell — wrapper visuel partagé par EventCard et LeagueCard.
 *
 * Garantit que les deux cartes vivent dans la même famille visuelle :
 * fond `navy-soft`, bordure `card`, hover `cool-gray`, structure header
 * (status pill + titre + admin badge optionnel + chevron) puis un body
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
  /** Pill "ADMIN" — identique au DetailHero, affiché si l'utilisateur courant est créateur. */
  adminBadge?: boolean;
  /** Élément optionnel rendu à droite du titre sur la même ligne
   *  (ex: `<MyRankBadge>`). Reste visible quand le titre est tronqué. */
  titleSuffix?: React.ReactNode;
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
  adminBadge = false,
  titleSuffix,
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
        {(status || adminBadge) && (
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
            {adminBadge && (
              <span className="bg-ping-yellow text-navy px-2 py-0.5 rounded-sm font-archivo font-extrabold uppercase text-[10px] tracking-[1px] flex-shrink-0">
                Admin
              </span>
            )}
          </div>
        )}
        <div className="flex items-baseline gap-2 min-w-0">
          <div className="font-archivo font-extrabold text-xl tracking-[-0.4px] truncate text-white min-w-0">
            {title}
          </div>
          {titleSuffix}
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
