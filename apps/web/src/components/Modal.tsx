import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title (required for accessibility) */
  title: React.ReactNode;
  /** Modal content */
  children: React.ReactNode;
  /** Optional footer content (e.g., action buttons) */
  footer?: React.ReactNode;
  /** Optional max width class (default: 'max-w-md') */
  maxWidth?: string;
  /** Hide the close X button (default: false) */
  hideCloseButton?: boolean;
  /** Disable close affordances (X, Escape, backdrop click) */
  disableClose?: boolean;
  /** Stack layer — use 'top' for nested modals (z-[60]) */
  layer?: 'default' | 'top';
  /** Custom class on the modal surface (advanced) */
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-md',
  hideCloseButton = false,
  disableClose = false,
  layer = 'default',
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen || disableClose) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, disableClose]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    return () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disableClose) return;
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const zClass = layer === 'top' ? 'z-[60]' : 'z-50';

  return (
    <div
      className={`fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center ${zClass} p-4`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`bg-navy-soft rounded-card ${maxWidth} w-full mx-auto border border-card shadow-modal ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 id="modal-title" className="text-xl font-bold text-white">
            {title}
          </h2>
          {!hideCloseButton && (
            <button
              onClick={onClose}
              disabled={disableClose}
              className="p-2 hover:bg-navy-soft rounded-button transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Fermer"
            >
              <X size={20} className="text-cool-gray" />
            </button>
          )}
        </div>

        <div className="px-6 pb-6">{children}</div>

        {footer && <div className="px-6 pb-6">{footer}</div>}
      </div>
    </div>
  );
};
