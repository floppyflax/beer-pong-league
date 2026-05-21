/**
 * LifecycleStrip — bandeau d'état pleine largeur, sticky, jaune.
 *
 * Utilisé par EventDashboard et LeagueDashboard pour signaler un état
 * non-actif (not_started, paused, finished) qui bloque l'enregistrement
 * de matchs.
 *
 * Visuellement distinct des cartes (fond `ping-yellow/10` + bordures
 * `ping-yellow/30` + sticky) pour ne pas se confondre avec le contenu.
 *
 * Mig 030 — nouveau ton `pending_validation` pour signaler les matchs en
 * attente sous anti-cheat. Props additives `actionLabel` + `onAction`
 * (optionnelles, rétrocompatibles) pour brancher un CTA inline.
 */

import React from 'react';
import {
  Pause,
  Play,
  Archive,
  Clock,
  Hourglass,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';

export type LifecycleStripTone =
  | 'not_started'
  | 'paused'
  | 'between_seasons'
  | 'finished'
  | 'reminder'
  | 'pending_validation';

export interface LifecycleStripProps {
  tone: LifecycleStripTone;
  title: string;
  description: string;
  /** Data-testid for assertions. */
  testId?: string;
  /**
   * Optional inline CTA. When both are provided the strip renders a
   * compact button on the right. Otherwise the strip stays purely
   * informational (legacy behaviour).
   */
  actionLabel?: string;
  onAction?: () => void;
}

const TONE_ICON: Record<LifecycleStripTone, LucideIcon> = {
  not_started: Play,
  paused: Pause,
  between_seasons: RotateCcw,
  finished: Archive,
  reminder: Clock,
  pending_validation: Hourglass,
};

// `reminder` est volontairement légèrement plus saturé pour le différencier
// d'un strip lifecycle bloquant : c'est une action douce attendue, pas un état.
// `pending_validation` partage la palette `ping-yellow` (cohérent avec les
// badges sablier sur les match cards).
const TONE_CLASSES: Record<LifecycleStripTone, string> = {
  not_started: 'border-ping-yellow/30 bg-ping-yellow/10',
  paused: 'border-ping-yellow/30 bg-ping-yellow/10',
  between_seasons: 'border-ping-yellow/30 bg-ping-yellow/10',
  finished: 'border-ping-yellow/30 bg-ping-yellow/10',
  reminder: 'border-ping-yellow/50 bg-ping-yellow/15',
  pending_validation: 'border-ping-yellow/50 bg-ping-yellow/15',
};

export const LifecycleStrip: React.FC<LifecycleStripProps> = ({
  tone,
  title,
  description,
  testId,
  actionLabel,
  onAction,
}) => {
  const Icon = TONE_ICON[tone];
  const toneClasses = TONE_CLASSES[tone];
  const hasAction = Boolean(actionLabel && onAction);
  return (
    <div
      role="status"
      data-testid={testId}
      className={`sticky top-0 z-20 -mx-4 md:mx-0 border-y backdrop-blur-sm px-4 py-3 flex items-start gap-3 ${toneClasses}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0 text-ping-yellow" />
      <div className="flex-1 leading-snug text-sm">
        <div className="font-bold text-white">{title}</div>
        <div className="mt-0.5 text-cool-gray">{description}</div>
      </div>
      {hasAction && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 self-center px-3 h-8 rounded-full bg-ping-yellow text-navy-deep font-archivo font-extrabold uppercase text-[10px] tracking-[1px] hover:bg-ping-yellow-deep transition-colors"
          data-testid={testId ? `${testId}-action` : undefined}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
