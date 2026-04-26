/**
 * Stepper — N-step progress indicator (lime bars).
 *
 * Used at the top of multi-step wizards (RecordMatch, future onboarding).
 */

export interface StepperProps {
  total: number;
  current: number;
  /** Optional label appended after the bars (e.g. "Étape 2/2 — Saisir score"). */
  label?: string;
}

export function Stepper({ total, current, label }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        return (
          <span
            key={n}
            className={`h-1.5 w-8 rounded-full transition-colors ${
              n <= current ? "bg-lime" : "bg-navy-soft"
            }`}
          />
        );
      })}
      {label && (
        <span className="ml-2 text-[10px] font-mono uppercase tracking-widest text-cool-gray">
          {label}
        </span>
      )}
    </div>
  );
}
