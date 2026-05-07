import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'premium';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-cta text-white font-bold shadow-md hover:opacity-90 active:opacity-80',
  secondary: 'bg-navy-soft text-white font-semibold border border-card hover:bg-navy active:bg-navy-deep',
  ghost: 'bg-transparent text-cool-gray hover:bg-navy-soft hover:text-white active:bg-navy',
  danger: 'bg-signal-red/10 text-signal-red font-semibold border border-signal-red/30 hover:bg-signal-red/20 active:bg-signal-red/30',
  premium: 'bg-gradient-fab text-navy font-bold shadow-md hover:opacity-90 active:opacity-80',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-base rounded-button gap-2',
  lg: 'px-6 py-3.5 text-lg rounded-button gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon: IconLeft,
      iconRight: IconRight,
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={twMerge(
          clsx(
            'inline-flex items-center justify-center transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-electric-blue/50 focus:ring-offset-2 focus:ring-offset-background-primary',
            variantClasses[variant],
            sizeClasses[size],
            fullWidth && 'w-full',
            isDisabled && 'opacity-50 cursor-not-allowed',
          ),
          className,
        )}
        data-testid="ds-button"
        {...rest}
      >
        {loading ? (
          <Loader2 size={iconSize} className="animate-spin" />
        ) : IconLeft ? (
          <IconLeft size={iconSize} />
        ) : null}
        {children}
        {!loading && IconRight && <IconRight size={iconSize} />}
      </button>
    );
  },
);

Button.displayName = 'Button';
