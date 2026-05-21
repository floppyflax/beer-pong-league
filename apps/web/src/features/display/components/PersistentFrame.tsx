import type { ReactNode } from "react";
import { Calendar, Zap } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { DisplaySource } from "../types";

interface Props {
  source: DisplaySource;
  /** Contenu principal — scène active (classement, podium, etc.). */
  children: ReactNode;
  /** Encart "rail" droit : podium + autres widgets persistants. */
  rightRail?: ReactNode;
}

/**
 * Layout plein écran : header (titre + méta à gauche, **QR à droite**) + zone
 * scène (col gauche) + rail droit libéré pour les matchs.
 *
 * Le QR vit dans le header → visible sur **toutes** les scènes et jamais
 * croqué, et le rail droit récupère toute sa hauteur pour afficher plus de
 * matchs.
 */
export function PersistentFrame({ source, children, rightRail }: Props) {
  return (
    <div className="h-screen w-screen bg-navy text-white overflow-hidden relative select-none fixed inset-0">
      {/* Cup pattern décoratif */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        {Array.from({ length: 60 }).map((_, i) => (
          <circle
            key={i}
            cx={(i * 67) % 400}
            cy={(i * 93) % 800}
            r="20"
            fill="white"
          />
        ))}
      </svg>

      {/* Header — titre/méta à gauche, QR à droite */}
      <div className="absolute top-0 left-0 right-0 px-6 md:px-10 py-3 md:py-4 bg-navy/80 backdrop-blur-md border-b border-card z-20">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="font-archivo font-black uppercase tracking-[-1px] text-2xl md:text-5xl truncate leading-none">
              {source.name}
            </h1>
            <div className="flex items-center gap-3 md:gap-5 mt-2 flex-wrap">
              {source.subtitle && (
                <div className="flex items-center gap-1.5 text-cool-gray">
                  <Calendar size={12} />
                  <span className="font-mono text-[10px] md:text-xs uppercase tracking-[2px] font-bold">
                    {source.subtitle}
                  </span>
                </div>
              )}
              {source.isLive && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-electric-blue/15 border border-electric-blue/40">
                  <Zap
                    size={12}
                    className="text-electric-blue animate-pulse"
                  />
                  <span className="font-mono text-[10px] md:text-xs uppercase tracking-[2px] font-bold text-electric-blue">
                    Live
                  </span>
                </div>
              )}
              <span className="font-mono text-[10px] md:text-xs uppercase tracking-[2px] font-bold text-cool-gray">
                {source.matchesPlayedCount} matchs
              </span>
            </div>
          </div>

          {/* QR header — toujours visible, jamais croqué */}
          {source.joinUrl && (
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right hidden md:block">
                <div className="font-mono text-[10px] uppercase tracking-[2px] text-cool-gray font-bold">
                  Rejoins le live
                </div>
                {source.joinCode && (
                  <div className="font-archivo font-black text-lg md:text-2xl text-lime tracking-tight leading-none mt-0.5">
                    {source.joinCode}
                  </div>
                )}
                <div className="font-mono text-[9px] uppercase tracking-[1.5px] text-cool-gray mt-0.5">
                  Scanne ↗
                </div>
              </div>
              <div className="bg-white p-1.5 md:p-2 rounded-lg border border-white">
                <QRCodeSVG value={source.joinUrl} size={72} className="md:hidden" />
                <QRCodeSVG
                  value={source.joinUrl}
                  size={96}
                  className="hidden md:block"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Body — grid 2 colonnes : scène + rail droit */}
      <div className="pt-20 md:pt-28 pb-6 md:pb-8 px-6 md:px-10 lg:px-12 h-full w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5 md:gap-8 lg:gap-10 h-full">
          {/* Col gauche : scène active */}
          <div className="min-w-0 h-full overflow-hidden flex flex-col">
            {children}
          </div>

          {/* Col droite : rail (podium + matchs), pleine hauteur */}
          <div className="hidden lg:flex flex-col gap-4 md:gap-6 h-full overflow-hidden min-h-0">
            {rightRail}
          </div>
        </div>
      </div>

      {/* Exit hint */}
      <div className="absolute bottom-3 right-4 font-mono text-[10px] md:text-xs uppercase tracking-[1.5px] text-cool-gray font-bold pointer-events-none z-30">
        ESC pour quitter
      </div>
    </div>
  );
}
