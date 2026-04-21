import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export type BadgeVariant = 'default' | 'active' | 'success' | 'error' | 'premium' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-700 text-slate-300',
  active: 'bg-amber-500/20 text-amber-400',
  success: 'bg-green-500/20 text-green-400',
  error: 'bg-red-500/20 text-red-400',
  premium: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400',
  info: 'bg-blue-500/20 text-blue-400',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-bold uppercase whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      data-testid="ds-badge"
    >
      {children}
    </span>
  );
}
