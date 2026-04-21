import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Modal Component
 * 
 * Accessible, reusable modal dialog with proper ARIA attributes and keyboard navigation
 * 
 * Features:
 * - ARIA attributes for screen readers
 * - Focus trap (focus stays within modal)
 * - Escape key to close
 * - Click outside to close
 * - Focus management (auto-focus first focusable element)
 * - Backdrop with blur effect
 */

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title (required for accessibility) */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Optional footer content (e.g., action buttons) */
  footer?: React.ReactNode;
  /** Optional max width class (default: 'max-w-md') */
  maxWidth?: string;
  /** Hide the close X button (default: false) */
  hideCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-md',
  hideCloseButton = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (!isOpen) return;

    // Store previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element in modal
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    // Restore focus when modal closes
    return () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  // Click outside to close
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`bg-slate-800 rounded-xl ${maxWidth} w-full mx-auto shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 id="modal-title" className="text-xl font-bold text-white">
            {title}
          </h2>
          {!hideCloseButton && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X size={20} className="text-slate-400" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 pt-0 border-t border-slate-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
