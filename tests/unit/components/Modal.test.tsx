import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../../../src/components/Modal';

describe('Modal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('Basic Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('should render footer when provided', () => {
      render(
        <Modal
          isOpen={true}
          onClose={mockOnClose}
          title="Test Modal"
          footer={<button>Footer Button</button>}
        >
          <p>Modal content</p>
        </Modal>
      );

      expect(screen.getByText('Footer Button')).toBeInTheDocument();
    });

    it('should hide close button when hideCloseButton is true', () => {
      render(
        <Modal
          isOpen={true}
          onClose={mockOnClose}
          title="Test Modal"
          hideCloseButton={true}
        >
          <p>Modal content</p>
        </Modal>
      );

      expect(screen.queryByLabelText('Fermer')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility (ARIA)', () => {
    it('should have correct ARIA attributes', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('should have accessible title with id', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Accessible Title">
          <p>Modal content</p>
        </Modal>
      );

      const title = screen.getByText('Accessible Title');
      expect(title).toHaveAttribute('id', 'modal-title');
    });

    it('should have accessible close button with aria-label', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Fermer');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Close Behavior', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Fermer');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key is pressed', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      const backdrop = container.querySelector('[role="dialog"]');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content is clicked', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      const content = screen.getByText('Modal content');
      fireEvent.click(content);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not respond to Escape when modal is closed', () => {
      render(
        <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Styling', () => {
    it('should apply default max-width class', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      const modalContent = container.querySelector('.max-w-md');
      expect(modalContent).toBeInTheDocument();
    });

    it('should apply custom max-width class', () => {
      const { container } = render(
        <Modal
          isOpen={true}
          onClose={mockOnClose}
          title="Test Modal"
          maxWidth="max-w-lg"
        >
          <p>Modal content</p>
        </Modal>
      );

      const modalContent = container.querySelector('.max-w-lg');
      expect(modalContent).toBeInTheDocument();
    });

    it('should have backdrop blur effect', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      const backdrop = container.querySelector('[role="dialog"]');
      expect(backdrop).toHaveClass('backdrop-blur-sm');
    });
  });
});
