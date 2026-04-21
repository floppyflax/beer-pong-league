import clsx from "clsx";

export interface EloDeltaProps {
  /** Delta ELO (positif = gain, négatif = perte). 0 est traité comme positif. */
  value: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Cache la flèche si true (juste `+24` / `-12`). */
  hideArrow?: boolean;
  /** Ajoute "ELO" après le nombre. */
  showUnit?: boolean;
}

const sizeClasses: Record<NonNullable<EloDeltaProps["size"]>, string> = {
  sm: "text-[11px] px-1.5 py-0.5 gap-0.5",
  md: "text-[13px] px-2 py-0.5 gap-1",
  lg: "text-[15px] px-2.5 py-1 gap-1",
};

/**
 * Badge ELO delta : `↑ 24` (lime sur Arcade) ou `↓ 12` (ruby).
 * Typo JetBrains Mono (tabular, chiffres alignés).
 */
export function EloDelta({
  value,
  size = "md",
  className,
  hideArrow = false,
  showUnit = false,
}: EloDeltaProps) {
  const up = value >= 0;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full font-mono font-semibold tracking-tight",
        up
          ? "bg-lime/10 text-lime"
          : "bg-ruby/10 text-ruby",
        sizeClasses[size],
        className,
      )}
      data-testid="elo-delta"
      data-sign={up ? "up" : "down"}
    >
      {!hideArrow && <span aria-hidden="true">{up ? "↑" : "↓"}</span>}
      <span>{Math.abs(value)}</span>
      {showUnit && <span className="opacity-70">ELO</span>}
      <span className="sr-only">
        {up ? "Gain" : "Perte"} de {Math.abs(value)} ELO
      </span>
    </span>
  );
}
