/**
 * LifecycleStrip — bandeau d'état pleine largeur, sticky, jaune.
 *
 * Utilisé par EventDashboard et LeagueDashboard pour signaler un état
 * non-actif (not_started, paused, finished) qui bloque l'enregistrement
 * de matchs.
 *
 * Visuellement distinct des cartes (fond `ping-yellow/10` + bordures
 * `ping-yellow/30` + sticky) pour ne pas se confondre avec le contenu.
 */

import React from 'react';
import { Pause, Play, Archive, RotateCcw, Clock, type LucideIcon } from 'lucide-react';

export type LifecycleStripTone =
  | 'not_started'
  | 'paused'
  | 'between_seasons'
  | 'finished'
  | 'reminder';

export interface LifecycleStripProps {
  tone: LifecycleStripTone;
  title: string;
  description: string;
  /** Data-testid for assertions. */
  testId?: string;
}

const TONE_ICON: Record<LifecycleStripTone, LucideIcon> = {
  not_started: Play,
  paused: Pause,
  between_seasons: RotateCcw,
  finished: Archive,
  reminder: Clock,
};

// `reminder` est volontairement légèrement plus saturé pour le différencier
// d'un strip lifecycle bloquant : c'est une action douce attendue, pas un état.
const TONE_CLASSES: Record<LifecycleStripTone, string> = {
  not_started: 'border-ping-yellow/30 bg-ping-yellow/10',
  paused: 'border-ping-yellow/30 bg-ping-yellow/10',
  between_seasons: 'border-ping-yellow/30 bg-ping-yellow/10',
  finished: 'border-ping-yellow/30 bg-ping-yellow/10',
  reminder: 'border-ping-yellow/50 bg-ping-yellow/15',
};

export const LifecycleStrip: React.FC<LifecycleStripProps> = ({
  tone,
  title,
  description,
  testId,
}) => {
  const Icon = TONE_ICON[tone];
  const toneClasses = TONE_CLASSES[tone];
  return (
    <div
      role="status"
      data-testid={testId}
      className={`sticky top-0 z-20 -mx-4 md:mx-0 border-y backdrop-blur-sm px-4 py-3 flex items-start gap-3 ${toneClasses}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0 text-ping-yellow" />
      <div className="leading-snug text-sm">
        <div className="font-bold text-white">{title}</div>
        <div className="mt-0.5 text-cool-gray">{description}</div>
      </div>
    </div>
  );
};
