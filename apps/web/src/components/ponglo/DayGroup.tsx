/**
 * DayGroup — Everything ELO DS (§5.3)
 *
 * Groups match history rows under a date header.
 * Shows: date label + match count (mono) + cumulative ELO delta (colored).
 */

import type { ReactNode } from 'react';

export interface DayGroupProps {
  /** Date label (ex: "Hier", "15 jan.", "Cette semaine") */
  label: string;
  /** Match count display string (ex: "3 matchs") */
  count: string;
  /** Net ELO delta for the period */
  deltaSum: number;
  children: ReactNode;
  className?: string;
}

export function DayGroup({ label, count, deltaSum, children, className }: DayGroupProps) {
  const deltaPositive = deltaSum > 0;
  const deltaZero = deltaSum === 0;

  return (
    <div className={`flex flex-col gap-2 ${className ?? ''}`} data-testid="day-group">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cool-gray">
            {label}
          </span>
          <span className="text-[10px] font-mono text-cool-gray/60">{count}</span>
        </div>

        {!deltaZero && (
          <span
            className={`text-[10px] font-mono tabular-nums ${
              deltaPositive ? 'text-lime' : 'text-signal-red'
            }`}
          >
            {deltaPositive ? '+' : ''}{deltaSum} ELO
          </span>
        )}
      </div>

      {/* Children (MatchRow list) */}
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}
