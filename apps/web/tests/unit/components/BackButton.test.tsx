import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BackButton } from '../../../src/components/navigation/BackButton';

// Mock react-router-dom
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('BackButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render button with arrow icon', () => {
      render(<BackButton />);
      
      const button = screen.getByLabelText('Retour');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should have proper styling', () => {
      render(<BackButton />);
      
      const button = screen.getByLabelText('Retour');
      expect(button).toHaveClass('p-2');
      expect(button).toHaveClass('hover:bg-slate-700');
      expect(button).toHaveClass('rounded-lg');
      expect(button).toHaveClass('transition-colors');
      expect(button).toHaveClass('active:scale-95');
    });
  });

  describe('Navigation Behavior', () => {
    it('should navigate back in history when clicked', () => {
      render(<BackButton />);
      
      const button = screen.getByLabelText('Retour');
      fireEvent.click(button);
      
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('should call custom onClick when provided', () => {
      const customClick = vi.fn();
      render(<BackButton onClick={customClick} />);
      
      const button = screen.getByLabelText('Retour');
      fireEvent.click(button);
      
      expect(customClick).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have default aria-label', () => {
      render(<BackButton />);
      
      expect(screen.getByLabelText('Retour')).toBeInTheDocument();
    });

    it('should accept custom aria-label', () => {
      render(<BackButton ariaLabel="Go back" />);
      
      expect(screen.getByLabelText('Go back')).toBeInTheDocument();
      expect(screen.queryByLabelText('Retour')).not.toBeInTheDocument();
    });

    it('should have proper button role', () => {
      render(<BackButton />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
    });
  });

  describe('Touch Feedback', () => {
    it('should have scale down effect on active press', () => {
      render(<BackButton />);
      
      const button = screen.getByLabelText('Retour');
      expect(button).toHaveClass('active:scale-95');
    });
  });
});
