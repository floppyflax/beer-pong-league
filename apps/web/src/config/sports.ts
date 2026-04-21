/**
 * Re-export shared sport config + web-specific icon mapping.
 */
export { SPORTS, DEFAULT_SPORT_ID } from '@elofight/shared';
export type { SportConfig } from '@elofight/shared';

import { Beer, Target, Dices, Gamepad2, Swords, type LucideIcon } from 'lucide-react';

export const SPORT_ICONS: Record<string, LucideIcon> = {
  beer: Beer,
  target: Target,
  dices: Dices,
  'gamepad-2': Gamepad2,
  swords: Swords,
};
