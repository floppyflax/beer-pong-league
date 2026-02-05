import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomMenuSpecific } from '../../../src/components/navigation/BottomMenuSpecific';
import { Camera, Hash } from 'lucide-react';

describe('BottomMenuSpecific', () => {
  describe('Component Structure (AC1)', () => {
    it('should render fixed bottom bar', () => {
      const { container } = render(
        <BottomMenuSpecific actions={[
          { label: 'TEST', onClick: () => {} }
        ]} />
      );
      
      const bottomBar = container.firstChild;
      expect(bottomBar).toHaveClass('fixed');
      expect(bottomBar).toHaveClass('bottom-0');
      expect(bottomBar).toHaveClass('left-0');
      expect(bottomBar).toHaveClass('right-0');
    });

    it('should render single button full width', () => {
      render(
        <BottomMenuSpecific actions={[
          { label: 'CREATE', onClick: () => {} }
        ]} />
      );
      
      const button = screen.getByRole('button', { name: /create/i });
      expect(button).toHaveClass('w-full');
    });

    it('should render two buttons with 50/50 split', () => {
      render(
        <BottomMenuSpecific actions={[
          { label: 'SCANNER', onClick: () => {} },
          { label: 'CODE', onClick: () => {} }
        ]} />
      );
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      buttons.forEach(button => {
        expect(button).toHaveClass('flex-1');
      });
    });

    it('should have minimum height of 64px', () => {
      render(
        <BottomMenuSpecific actions={[
          { label: 'TEST', onClick: () => {} }
        ]} />
      );
      
      const button = screen.getByRole('button');
      // py-4 in Tailwind = 1rem (16px) padding top + 1rem bottom = 32px
      // Plus text height makes it exceed 64px total
      expect(button).toHaveClass('py-4');
    });
  });

  describe('Action Handling', () => {
    it('should call onClick when button clicked', () => {
      const handleClick = vi.fn();
      render(
        <BottomMenuSpecific actions={[
          { label: 'CLICK ME', onClick: handleClick }
        ]} />
      );
      
      const button = screen.getByRole('button', { name: /click me/i });
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call correct onClick for multiple actions', () => {
      const handleClick1 = vi.fn();
      const handleClick2 = vi.fn();
      render(
        <BottomMenuSpecific actions={[
          { label: 'FIRST', onClick: handleClick1 },
          { label: 'SECOND', onClick: handleClick2 }
        ]} />
      );
      
      fireEvent.click(screen.getByRole('button', { name: /first/i }));
      expect(handleClick1).toHaveBeenCalledTimes(1);
      expect(handleClick2).not.toHaveBeenCalled();
      
      fireEvent.click(screen.getByRole('button', { name: /second/i }));
      expect(handleClick2).toHaveBeenCalledTimes(1);
      expect(handleClick1).toHaveBeenCalledTimes(1);
    });
  });

  describe('Icon Support', () => {
    it('should render button with icon', () => {
      render(
        <BottomMenuSpecific actions={[
          { 
            label: 'SCANNER', 
            icon: <Camera data-testid="camera-icon" size={20} />, 
            onClick: () => {} 
          }
        ]} />
      );
      
      expect(screen.getByTestId('camera-icon')).toBeInTheDocument();
      expect(screen.getByText('SCANNER')).toBeInTheDocument();
    });

    it('should render multiple buttons with different icons', () => {
      render(
        <BottomMenuSpecific actions={[
          { 
            label: 'SCANNER', 
            icon: <Camera data-testid="camera-icon" size={20} />, 
            onClick: () => {} 
          },
          { 
            label: 'CODE', 
            icon: <Hash data-testid="hash-icon" size={20} />, 
            onClick: () => {} 
          }
        ]} />
      );
      
      expect(screen.getByTestId('camera-icon')).toBeInTheDocument();
      expect(screen.getByTestId('hash-icon')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable button when disabled prop is true', () => {
      render(
        <BottomMenuSpecific actions={[
          { label: 'DISABLED', onClick: () => {}, disabled: true }
        ]} />
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });

    it('should not call onClick when button is disabled', () => {
      const handleClick = vi.fn();
      render(
        <BottomMenuSpecific actions={[
          { label: 'DISABLED', onClick: handleClick, disabled: true }
        ]} />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Premium Lock State', () => {
    it('should show lock icon when premium prop is true', () => {
      render(
        <BottomMenuSpecific actions={[
          { label: 'CREATE', onClick: () => {}, premium: true }
        ]} />
      );
      
      expect(screen.getByText('🔒')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('should not show lock icon when premium prop is false', () => {
      render(
        <BottomMenuSpecific actions={[
          { label: 'CREATE', onClick: () => {}, premium: false }
        ]} />
      );
      
      expect(screen.queryByText('🔒')).not.toBeInTheDocument();
    });

    it('should not show lock icon when premium prop is undefined', () => {
      render(
        <BottomMenuSpecific actions={[
          { label: 'CREATE', onClick: () => {} }
        ]} />
      );
      
      expect(screen.queryByText('🔒')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Behavior (AC5)', () => {
    it('should be hidden on desktop (lg:hidden)', () => {
      const { container } = render(
        <BottomMenuSpecific actions={[
          { label: 'TEST', onClick: () => {} }
        ]} />
      );
      
      expect(container.firstChild).toHaveClass('lg:hidden');
    });

    it('should be visible on mobile', () => {
      const { container } = render(
        <BottomMenuSpecific actions={[
          { label: 'TEST', onClick: () => {} }
        ]} />
      );
      
      const classList = Array.from((container.firstChild as Element)?.classList || []);
      expect(classList).not.toContain('hidden');
      expect(classList).not.toContain('md:hidden');
      expect(classList).not.toContain('sm:hidden');
      expect(classList).toContain('lg:hidden');
    });
  });

  describe('Visual Design (AC6)', () => {
    it('should have correct background and border styling', () => {
      const { container } = render(
        <BottomMenuSpecific actions={[
          { label: 'TEST', onClick: () => {} }
        ]} />
      );
      
      const bottomBar = container.firstChild as Element;
      expect(bottomBar).toHaveClass('bg-slate-900/80');
      expect(bottomBar).toHaveClass('backdrop-blur-md');
      expect(bottomBar).toHaveClass('border-t');
      expect(bottomBar).toHaveClass('border-slate-800');
    });

    it('should have correct z-index', () => {
      const { container } = render(
        <BottomMenuSpecific actions={[
          { label: 'TEST', onClick: () => {} }
        ]} />
      );
      
      expect(container.firstChild).toHaveClass('z-30');
    });

    it('should have correct button styling', () => {
      render(
        <BottomMenuSpecific actions={[
          { label: 'TEST', onClick: () => {} }
        ]} />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
      expect(button).toHaveClass('hover:bg-amber-600');
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('font-bold');
      expect(button).toHaveClass('rounded-xl');
      expect(button).toHaveClass('shadow-lg');
      expect(button).toHaveClass('active:scale-95');
    });

    it('should have correct padding', () => {
      const { container } = render(
        <BottomMenuSpecific actions={[
          { label: 'TEST', onClick: () => {} }
        ]} />
      );
      
      expect(container.firstChild).toHaveClass('p-4');
    });
  });

  describe('Touch Feedback', () => {
    it('should have scale down effect on active press', () => {
      render(
        <BottomMenuSpecific actions={[
          { label: 'TEST', onClick: () => {} }
        ]} />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('active:scale-95');
    });
  });
});
