/**
 * PAvatar — Everything ELO DS (§5.1)
 *
 * Circular avatar with image fallback (initials) and optional colored ring.
 * Coexists with `Avatar` (design-system) — PAvatar is the brand-aware version
 * with ring support for rank/status signaling.
 *
 * Ring colors:
 *   - 1st place: ping-yellow (#FFD400)
 *   - 2nd place: cool-gray (#A8B0C0)
 *   - 3rd place: bronze (#CD7F32)
 *   - Current user: lime (#B7FF3B)
 *   - Any arbitrary CSS color string
 */

import { useState } from 'react';
import { getInitials } from '@/utils/string';

export interface PAvatarProps {
  name: string;
  /** Size in px — default 40 */
  size?: number;
  /** Ring color as CSS color string (hex/token) — no ring if omitted */
  ring?: string;
  imageUrl?: string;
  className?: string;
}

export function PAvatar({ name, size = 40, ring, imageUrl, className }: PAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = imageUrl && !imgError;
  const initials = getInitials(name);
  const fontSize = Math.max(10, Math.round(size * 0.35));
  const ringWidth = size >= 48 ? 3 : 2;

  return (
    <div
      className={`relative flex-shrink-0 rounded-full overflow-hidden ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        boxShadow: ring ? `0 0 0 ${ringWidth}px ${ring}` : undefined,
        background: '#1A2540', // navy-soft mid
      }}
      data-testid="pavatar"
      data-name={name}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center font-bold text-cool-gray"
          style={{ fontSize }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}
