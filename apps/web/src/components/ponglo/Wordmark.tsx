import { useId } from "react";

export interface PongloGlyphProps {
  size?: number;
  /** Override tous les cercles avec une seule couleur (rendu mono). */
  color?: string;
}

/**
 * 3 cups en triangle — rappel direct du beer pong (red + blue + red avec puits cream).
 */
export function PongloGlyph({ size = 32, color }: PongloGlyphProps) {
  const mono = color !== undefined;
  const red = mono ? color : "#FF4438";
  const blue = mono ? color : "#3B8EFF";
  const cream = "#0B0D14";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <circle cx="14" cy="26" r="5.5" fill={red} />
      <circle cx="26" cy="26" r="5.5" fill={blue} />
      <circle cx="20" cy="16" r="5.5" fill={red} />
      <circle cx="20" cy="16" r="2.2" fill={cream} />
    </svg>
  );
}

export interface PongloWordmarkProps {
  size?: number;
  color?: string;
  inline?: boolean;
  /** Visual-only: on cache le mot "PONGLO" et on n'affiche que le glyph. */
  glyphOnly?: boolean;
  "aria-label"?: string;
}

/**
 * Logo wordmark Ponglo — glyph + texte "PONGLO" en Archivo 900.
 * Le nom commercial reste "Beer Pong ELO" dans l'UI, ce wordmark est le
 * logo de marque (écran d'accueil, TV display, hero landing).
 */
export function PongloWordmark({
  size = 20,
  color = "#F4F2E8",
  inline = false,
  glyphOnly = false,
  "aria-label": ariaLabel,
}: PongloWordmarkProps) {
  const id = useId();
  return (
    <div
      role="img"
      aria-label={ariaLabel ?? "Beer Pong ELO"}
      aria-labelledby={ariaLabel ? undefined : id}
      style={{
        display: inline ? "inline-flex" : "flex",
        alignItems: "center",
        gap: size * 0.35,
        fontFamily: "Archivo, 'Space Grotesk', system-ui, sans-serif",
        fontWeight: 900,
        fontSize: size,
        letterSpacing: -size * 0.04,
        color,
        lineHeight: 1,
        textTransform: "uppercase",
      }}
    >
      <PongloGlyph size={size * 1.2} />
      {!glyphOnly && <span id={id}>PONGLO</span>}
    </div>
  );
}
