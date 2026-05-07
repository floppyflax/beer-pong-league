import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { LucideIcon } from 'lucide-react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: LucideIcon;
  suffix?: ReactNode;
  inputSize?: InputSize;
  fullWidth?: boolean;
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-4 py-3.5 text-lg',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      icon: Icon,
      suffix,
      inputSize = 'md',
      fullWidth = true,
      className,
      id,
      ...rest
    },
    ref,
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hasError = Boolean(error);

    return (
      <div className={clsx(fullWidth && 'w-full')} data-testid="ds-input-wrapper">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-white mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cool-gray pointer-events-none">
              <Icon size={18} />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={twMerge(
              clsx(
                'bg-navy-soft text-white rounded-input border transition-all duration-150 w-full',
                'placeholder:text-cool-gray placeholder:opacity-70',
                'focus:outline-none focus:ring-2 focus:ring-electric-blue/50 focus:border-electric-blue',
                sizeClasses[inputSize],
                Icon && 'pl-10',
                suffix && 'pr-10',
                hasError
                  ? 'border-signal-red focus:ring-signal-red/50 focus:border-signal-red'
                  : 'border-card hover:border-cool-gray/40',
              ),
              className,
            )}
            aria-invalid={hasError || undefined}
            aria-describedby={
              hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            data-testid="ds-input"
            {...rest}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-cool-gray">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-sm text-signal-red"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="mt-1 text-sm text-cool-gray opacity-80">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
