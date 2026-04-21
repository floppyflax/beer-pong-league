import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { getInitials } from '@/utils/string';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-xl',
};

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const showImage = src && !imgError;
  const initials = getInitials(name);

  return (
    <div
      className={clsx(
        'rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 overflow-hidden flex-shrink-0',
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
