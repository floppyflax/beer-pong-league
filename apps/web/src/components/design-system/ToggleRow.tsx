/**
 * ToggleRow — Everything ELO DS (§5.2)
 *
 * Label row with toggle switch (boolean). Used in settings and create forms
 * (ELO mode toggle, anti-cheat, notifications).
 */

import clsx from 'clsx';

export interface ToggleRowProps {
  label: string;
  /** Optional sub-description below the label */
  sub?: string;
  on: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function ToggleRow({
  label,
  sub,
  on,
  onToggle,
  disabled = false,
  className,
}: ToggleRowProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-4 py-3',
        className,
      )}
      data-testid="toggle-row"
    >
      <div className="flex-1 min-w-0">
        <div className={clsx('text-sm text-white', disabled && 'opacity-40')}>
          {label}
        </div>
        {sub && (
          <div className="text-xs text-cool-gray mt-0.5">{sub}</div>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onToggle(!on)}
        className={clsx(
          'relative flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200',
          on ? 'bg-electric-blue' : 'bg-navy-soft border border-card',
          disabled && 'opacity-40 cursor-not-allowed',
          !disabled && 'cursor-pointer',
        )}
        data-testid="toggle-row-switch"
      >
        <span
          className={clsx(
            'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
            on ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}
