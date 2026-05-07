import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type CardVariant = 'default' | 'gradient' | 'transparent' | 'interactive';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-navy-soft/90 border border-card',
  gradient: 'bg-gradient-card border border-card',
  transparent: 'bg-gradient-card-transparent border border-card',
  interactive: 'bg-navy-soft border border-card hover:border-cool-gray/40 transition-all cursor-pointer',
};

const paddingClasses: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', className, children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          clsx(
            'rounded-card backdrop-blur-sm',
            variantClasses[variant],
            paddingClasses[padding],
          ),
          className,
        )}
        data-testid="ds-card"
        {...rest}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';
