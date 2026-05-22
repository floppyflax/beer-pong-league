import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { getInitials } from '@/utils/string';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
/** Fond du fallback initiales. `soft` (défaut) ou `deep` (très foncé, pour contraster sur une carte navy-soft). */
export type AvatarTone = 'soft' | 'deep';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  tone?: AvatarTone;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-xl',
};

const toneClasses: Record<AvatarTone, string> = {
  soft: 'bg-navy-soft',
  deep: 'bg-navy-deep',
};

export function Avatar({ name, src, size = 'md', tone = 'soft', className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const showImage = src && !imgError;
  const initials = getInitials(name);

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-bold text-cool-gray overflow-hidden flex-shrink-0',
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
      data-testid="ds-avatar"
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
