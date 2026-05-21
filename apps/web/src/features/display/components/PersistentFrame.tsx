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
 * Layout plein écran : header + zone scène (col gauche) + rail droit garanti
 * 380-440px qui contient QR + podium widget + autres.
 *
 * Garantie clé : le QR (en bas du rail droit) est toujours visible quelle que
 * soit la résolution, peu importe ce que la zone scène rend.
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

      {/* Header — fixe en haut */}
      <div className="absolute top-0 left-0 right-0 px-6 md:px-10 py-4 md:py-5 bg-navy/80 backdrop-blur-md border-b border-card z-20">
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
              {source.joinCode && (
                <span className="font-mono text-[10px] md:text-xs uppercase tracking-[2px] font-bold text-cool-gray">
                  Code ·{" "}
                  <span className="text-lime">{source.joinCode}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body — grid 2 colonnes : scène + rail droit */}
      <div className="pt-24 md:pt-32 pb-6 md:pb-8 px-6 md:px-10 lg:px-12 h-full w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5 md:gap-8 lg:gap-10 h-full">
          {/* Col gauche : scène active (passée en children) */}
          <div className="min-w-0 h-full overflow-hidden flex flex-col">
            {children}
          </div>

          {/* Col droite : rail garanti 400px (podium + QR fixe en bas) */}
          <div className="hidden lg:flex flex-col gap-4 md:gap-6 h-full overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 md:gap-6">
              {rightRail}
            </div>
            <QRBlock source={source} />
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

function QRBlock({ source }: { source: DisplaySource }) {
  if (!source.joinUrl) return null;
  return (
    <div className="bg-navy-soft border border-card rounded-card p-4 md:p-6 flex flex-col items-center flex-shrink-0">
      <h3 className="font-archivo font-extrabold uppercase tracking-[-0.4px] text-lg md:text-xl mb-3 text-center">
        Rejoins le live
      </h3>
      <div className="bg-white p-3 md:p-4 rounded-card border-[1.5px] border-white shadow-[0_3px_0_#F4F2E8] mb-3">
        <QRCodeSVG value={source.joinUrl} size={180} />
      </div>
      <p className="font-mono text-[10px] md:text-xs uppercase tracking-[2px] text-cool-gray font-bold text-center">
        Scanne avec ton téléphone
      </p>
    </div>
  );
}
