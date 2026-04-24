import type { ReactNode } from "react";

export interface ScreenLayoutProps {
  children: ReactNode;
  /** Header slot (ex: ContextualHeader). Rendu avant le contenu principal. */
  header?: ReactNode;
  /** Contenu fixe rendu hors du conteneur max-width (ex: FAB, modals inline). */
  overlay?: ReactNode;
  /**
   * Contraint la largeur du contenu principal.
   * - `narrow` : 720px (formulaires, détails)
   * - `wide` : 1200px (dashboards, listings)
   * - `full` : pas de contrainte
   * @default "wide"
   */
  maxWidth?: "narrow" | "wide" | "full";
  /**
   * Padding vertical du conteneur de contenu.
   * @default "md"
   */
  padding?: "none" | "sm" | "md" | "lg";
  /** Classe additionnelle sur le wrapper externe. */
  className?: string;
  /** Classe additionnelle sur le conteneur de contenu (max-width). */
  contentClassName?: string;
}

const MAX_WIDTH_CLASS: Record<NonNullable<ScreenLayoutProps["maxWidth"]>, string> = {
  narrow: "max-w-[720px]",
  wide: "max-w-[1200px]",
  full: "",
};

const PADDING_CLASS: Record<NonNullable<ScreenLayoutProps["padding"]>, string> = {
  none: "",
  sm: "py-4",
  md: "py-6 sm:py-8",
  lg: "py-10 sm:py-12",
};

export function ScreenLayout({
  children,
  header,
  overlay,
  maxWidth = "wide",
  padding = "md",
  className = "",
  contentClassName = "",
}: ScreenLayoutProps) {
  const wrapperClass = `min-h-screen bg-navy text-white ${className}`.trim();
  const contentClass = [
    MAX_WIDTH_CLASS[maxWidth],
    MAX_WIDTH_CLASS[maxWidth] ? "mx-auto" : "",
    "px-4 sm:px-6 lg:px-8",
    PADDING_CLASS[padding],
    contentClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClass} data-testid="screen-layout">
      {header}
      <div className={contentClass}>{children}</div>
      {overlay}
    </div>
  );
}
