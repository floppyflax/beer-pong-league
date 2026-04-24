/**
 * FormField — Everything ELO DS (§5.2)
 *
 * Label + read-only display row with optional chevron and error state.
 * Covers the "tappable field" pattern from create flows (CreateLeague, Profile edit).
 * For editable inputs use FormField with an input child directly.
 */

import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export interface FormFieldProps {
  label: string;
  /** Displayed value (or placeholder text) */
  value: string;
  /** Show a right-side chevron (tappable row pattern) */
  chevron?: boolean;
  /** Click handler — makes the field a tappable row */
  onClick?: () => void;
  /** Validation error message */
  error?: string;
  /** Render value in monospace font */
  mono?: boolean;
  className?: string;
}

export function FormField({
  label,
  value,
  chevron = false,
  onClick,
  error,
  mono = false,
  className,
}: FormFieldProps) {
  const Wrapper = onClick ? 'button' : 'div';
  const wrapperProps = onClick
    ? { type: 'button' as const, onClick }
    : {};

  return (
    <div className={clsx('flex flex-col gap-1', className)} data-testid="formfield">
      <label className="text-xs font-mono uppercase tracking-[0.6px] text-cool-gray">
        {label}
      </label>

      <Wrapper
        className={clsx(
          'flex items-center justify-between px-3 py-2.5 rounded-md border transition-colors',
          'bg-navy-soft',
          error
            ? 'border-signal-red'
            : 'border-card hover:border-cool-gray/40',
          onClick && 'cursor-pointer',
        )}
        {...wrapperProps}
      >
        <span
          className={clsx(
            'text-sm text-white',
            mono && 'font-mono',
            !value && 'text-cool-gray',
          )}
        >
          {value || '—'}
        </span>
        {chevron && (
          <ChevronRight size={16} className="text-cool-gray flex-shrink-0" aria-hidden />
        )}
      </Wrapper>

      {error && (
        <span className="text-xs text-signal-red" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
