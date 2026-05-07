import { forwardRef, type SelectHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, options, placeholder, fullWidth = true, className, id, ...rest }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hasError = Boolean(error);

    return (
      <div className={clsx(fullWidth && 'w-full')} data-testid="ds-select-wrapper">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-white mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={twMerge(
              clsx(
                'appearance-none bg-navy-soft text-white rounded-input border px-4 py-2.5 pr-10 w-full transition-all duration-150',
                'focus:outline-none focus:ring-2 focus:ring-electric-blue/50 focus:border-electric-blue',
                hasError
                  ? 'border-signal-red focus:ring-signal-red/50 focus:border-signal-red'
                  : 'border-card hover:border-cool-gray/40',
              ),
              className,
            )}
            aria-invalid={hasError || undefined}
            data-testid="ds-select"
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cool-gray pointer-events-none"
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-signal-red" role="alert">
            {error}
          </p>
        )}
        {!error && hint && <p className="mt-1 text-sm text-cool-gray opacity-80">{hint}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
