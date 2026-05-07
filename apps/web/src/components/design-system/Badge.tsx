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
  default: 'bg-navy-soft text-cool-gray',
  active: 'bg-ping-yellow/20 text-ping-yellow',
  success: 'bg-lime/20 text-lime',
  error: 'bg-signal-red/20 text-signal-red',
  premium: 'bg-gradient-to-r from-ping-yellow/20 to-lime/20 text-ping-yellow',
  info: 'bg-electric-blue/20 text-electric-blue',
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
