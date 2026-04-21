import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

export type PButtonVariant =
  | "primary" // cup-red — CTA principal
  | "accent" // cup-blue — action secondaire
  | "tertiary" // cup-green — action tertiaire
  | "lime" // lime — GG / positif
  | "dark" // ink — noir plein
  | "ghost"; // transparent avec bordure

export type PButtonSize = "sm" | "md" | "lg";

export interface PButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PButtonVariant;
  size?: PButtonSize;
  icon?: ReactNode;
  /** Bouton plein largeur. */
  full?: boolean;
}

const sizeClasses: Record<PButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5",
  md: "h-12 px-5 text-[15px] gap-2",
  lg: "h-[60px] px-7 text-[18px] gap-2.5",
};

const variantClasses: Record<PButtonVariant, string> = {
  primary:
    "bg-cup-red text-ink border-cup-red-deep shadow-[0_3px_0_#C42418] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#C42418]",
  accent:
    "bg-cup-blue text-ink border-cup-blue-deep shadow-[0_3px_0_#0052D4] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#0052D4]",
  tertiary:
    "bg-cup-green text-cream border-cup-green-deep shadow-[0_3px_0_#8BCC1F] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#8BCC1F]",
  lime: "bg-lime text-cream border-[#8BCC1F] shadow-[0_3px_0_#8BCC1F] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#8BCC1F]",
  dark: "bg-ink text-cream border-black shadow-[0_3px_0_#000] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#000]",
  ghost:
    "bg-transparent text-ink border-[rgba(244,242,232,0.14)] hover:bg-[rgba(244,242,232,0.04)] active:bg-[rgba(244,242,232,0.08)]",
};

/**
 * PButton — bouton Ponglo Arcade.
 *
 * - Forme capsule (`rounded-full`), bordure 1.5px, ombre plate offset de 3px
 *   (skeuomorphic "carton" press — se compresse à 1px au click).
 * - Typo Archivo 700 uppercase, letter-spacing serré.
 */
export const PButton = forwardRef<HTMLButtonElement, PButtonProps>(
  function PButton(
    {
      children,
      variant = "primary",
      size = "md",
      icon,
      full,
      className,
      type = "button",
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={clsx(
          "inline-flex items-center justify-center rounded-full",
          "border-[1.5px] font-archivo font-bold uppercase tracking-[-0.2px]",
          "transition-[transform,box-shadow,filter] duration-75",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0",
          sizeClasses[size],
          variantClasses[variant],
          full && "w-full",
          className,
        )}
        data-testid="pbutton"
        data-variant={variant}
        {...rest}
      >
        {icon}
        {children}
      </button>
    );
  },
);
