/**
 * Sheet — generic bottom-sheet (mobile) / centered modal (desktop) shell.
 *
 * Canonical surface for any dismissible dialog in the DS. Replaces the legacy
 * centered `Modal` component. Mirrors the layout already used by
 * IdentityGateSheet / ClaimGuestSheet / InviteSheet so all dialogs feel
 * consistent.
 *
 * Use this as a building block when you don't have a more specialized sheet
 * (e.g. ClaimGuestSheet for the claim flow). Pass `title`, `children`, and an
 * optional `footer`.
 */

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export type SheetMaxWidth = "sm" | "md" | "lg";

const MAX_WIDTH_CLASS: Record<SheetMaxWidth, string> = {
  sm: "md:max-w-sm",
  md: "md:max-w-md",
  lg: "md:max-w-lg",
};

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Sheet title — rendered centered, uppercase. ReactNode allows inline icons. */
  title: React.ReactNode;
  children: React.ReactNode;
  /** Optional sticky footer area (typically CTAs). */
  footer?: React.ReactNode;
  /** Width on desktop (mobile is always full-width). Default: "md". */
  maxWidth?: SheetMaxWidth;
  /** Bumps the mobile max-height from 66dvh to 88dvh. Desktop unaffected. */
  mobileExpanded?: boolean;
  /** Hide the X close button. Default: false. */
  hideCloseButton?: boolean;
  /** Disable Escape, backdrop click, and X. Use for blocking ops (loading). */
  disableClose?: boolean;
  /** Stack layer — "top" bumps z-index for nested sheets. Default: "default". */
  layer?: "default" | "top";
  /** Optional aria-labelledby override (default uses internal id). */
  ariaLabelledBy?: string;
}

export function Sheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "md",
  mobileExpanded = false,
  hideCloseButton = false,
  disableClose = false,
  layer = "default",
  ariaLabelledBy,
}: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = ariaLabelledBy ?? "sheet-title";

  // Escape closes (unless blocked)
  useEffect(() => {
    if (!isOpen || disableClose) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, disableClose]);

  // Focus management — first focusable on open, restore on close
  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable && focusable.length > 0) {
      focusable[0].focus();
    }
    return () => {
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disableClose) return;
    if (e.target === e.currentTarget) onClose();
  };

  const zClass = layer === "top" ? "z-[60]" : "z-50";

  return (
    <div
      className={`fixed inset-0 ${zClass} bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        ref={sheetRef}
        className={`w-full ${MAX_WIDTH_CLASS[maxWidth]} bg-navy-soft border-t border-card md:border md:border-card rounded-t-2xl md:rounded-2xl shadow-modal flex flex-col ${mobileExpanded ? "max-h-[88dvh]" : "max-h-[66dvh]"} md:max-h-[92vh] animate-invite-sheet-up`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grabber (mobile only) */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-center px-5 pt-4 pb-3">
          <h2
            id={titleId}
            className="font-archivo font-extrabold uppercase text-white text-[15px] tracking-[-0.3px] text-center px-8"
          >
            {title}
          </h2>
          {!hideCloseButton && (
            <button
              type="button"
              onClick={onClose}
              disabled={disableClose}
              className="absolute right-3 top-3 w-9 h-9 rounded-full flex items-center justify-center text-cool-gray hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 pb-5 overflow-y-auto flex-1">{children}</div>

        {/* Footer (sticky) */}
        {footer && (
          <div className="px-5 py-4 border-t border-card bg-navy-soft">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
