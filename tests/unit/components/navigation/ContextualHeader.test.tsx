import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContextualHeader } from '../../../../src/components/navigation/ContextualHeader';
import { Plus, Zap, Settings } from 'lucide-react';

/**
 * ContextualHeader Component Tests
 * 
 * Tests for Story 13.2 - Contextual Header
 * 
 * Coverage:
 * - AC1: Component renders with title, optional back button, optional actions, optional menu
 * - AC2: Single source of truth for page title
 * - AC3: Back button navigation
 * - AC4: Responsive actions (desktop: buttons, mobile: hidden)
 * - AC5: Responsive actions (mobile: menu button if menuItems provided)
 * - AC6: Menu dropdown functionality
 * - AC7: Premium indicators (lock icon)
 * - AC9: Accessibility (keyboard navigation, ARIA labels)
 * - AC10: Title truncation (ellipsis, title attribute)
 */

describe('ContextualHeader', () => {
  describe('AC1: Component Structure', () => {
    it('renders with title prop', () => {
      render(<ContextualHeader title="Test Title" />);
      expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument();
    });

    it('renders back button when showBackButton is true', () => {
      const onBack = vi.fn();
      render(<ContextualHeader title="Test" showBackButton={true} onBack={onBack} />);
      
      const backButton = screen.getByRole('button', { name: 'Retour' });
      expect(backButton).toBeInTheDocument();
    });

    it('does not render back button when showBackButton is false', () => {
      render(<ContextualHeader title="Test" showBackButton={false} />);
      expect(screen.queryByRole('button', { name: 'Retour' })).not.toBeInTheDocument();
    });

    it('renders action buttons when actions are provided', () => {
      const actions = [
        {
          label: 'CRÉER',
          icon: <Plus size={20} />,
          onClick: vi.fn(),
        },
      ];

      render(<ContextualHeader title="Test" actions={actions} />);
      expect(screen.getByRole('button', { name: 'CRÉER' })).toBeInTheDocument();
    });

    it('renders menu button when menuItems are provided', () => {
      const menuItems = [
        {
          label: 'Settings',
          icon: <Settings size={20} />,
          onClick: vi.fn(),
        },
      ];

      render(<ContextualHeader title="Test" menuItems={menuItems} />);
      expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
    });
  });

  describe('AC3: Back Button Navigation', () => {
    it('calls onBack when back button is clicked', () => {
      const onBack = vi.fn();
      render(<ContextualHeader title="Test" showBackButton={true} onBack={onBack} />);
      
      const backButton = screen.getByRole('button', { name: 'Retour' });
      fireEvent.click(backButton);
      
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('AC4: Responsive Actions - Desktop', () => {
    it('renders multiple action buttons', () => {
      const actions = [
        {
          label: 'NOUVEAU MATCH',
          icon: <Zap size={20} />,
          onClick: vi.fn(),
          variant: 'primary' as const,
        },
        {
          label: 'INVITER',
          icon: <Plus size={20} />,
          onClick: vi.fn(),
          variant: 'secondary' as const,
        },
      ];

      render(<ContextualHeader title="Test" actions={actions} />);
      
      expect(screen.getByRole('button', { name: 'NOUVEAU MATCH' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'INVITER' })).toBeInTheDocument();
    });

    it('calls onClick when action button is clicked', () => {
      const onClick = vi.fn();
      const actions = [
        {
          label: 'CRÉER',
          onClick,
        },
      ];

      render(<ContextualHeader title="Test" actions={actions} />);
      
      const button = screen.getByRole('button', { name: 'CRÉER' });
      fireEvent.click(button);
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('disables button when disabled prop is true', () => {
      const actions = [
        {
          label: 'CRÉER',
          onClick: vi.fn(),
          disabled: true,
        },
      ];

      render(<ContextualHeader title="Test" actions={actions} />);
      
      const button = screen.getByRole('button', { name: 'CRÉER' });
      expect(button).toBeDisabled();
    });
  });

  describe('AC6: Menu Dropdown Functionality', () => {
    it('opens dropdown when menu button is clicked', () => {
      const menuItems = [
        {
          label: 'Paramètres',
          icon: <Settings size={20} />,
          onClick: vi.fn(),
        },
      ];

      render(<ContextualHeader title="Test" menuItems={menuItems} />);
      
      const menuButton = screen.getByRole('button', { name: 'Menu' });
      fireEvent.click(menuButton);
      
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Paramètres' })).toBeInTheDocument();
    });

    it('closes dropdown when menu item is clicked', async () => {
      const onClick = vi.fn();
      const menuItems = [
        {
          label: 'Paramètres',
          onClick,
        },
      ];

      render(<ContextualHeader title="Test" menuItems={menuItems} />);
      
      // Open menu
      const menuButton = screen.getByRole('button', { name: 'Menu' });
      fireEvent.click(menuButton);
      
      // Click menu item
      const menuItem = screen.getByRole('menuitem', { name: 'Paramètres' });
      fireEvent.click(menuItem);
      
      expect(onClick).toHaveBeenCalledTimes(1);
      
      // Menu should be closed
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('closes dropdown when clicking outside', async () => {
      const menuItems = [
        {
          label: 'Paramètres',
          onClick: vi.fn(),
        },
      ];

      render(<ContextualHeader title="Test" menuItems={menuItems} />);
      
      // Open menu
      const menuButton = screen.getByRole('button', { name: 'Menu' });
      fireEvent.click(menuButton);
      
      expect(screen.getByRole('menu')).toBeInTheDocument();
      
      // Click outside
      fireEvent.mouseDown(document.body);
      
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('closes dropdown when Escape key is pressed', async () => {
      const menuItems = [
        {
          label: 'Paramètres',
          onClick: vi.fn(),
        },
      ];

      render(<ContextualHeader title="Test" menuItems={menuItems} />);
      
      // Open menu
      const menuButton = screen.getByRole('button', { name: 'Menu' });
      fireEvent.click(menuButton);
      
      expect(screen.getByRole('menu')).toBeInTheDocument();
      
      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('AC7: Premium Indicators', () => {
    it('displays lock icon when premium is true', () => {
      const actions = [
        {
          label: 'CRÉER TOURNOI',
          onClick: vi.fn(),
          premium: true,
        },
      ];

      render(<ContextualHeader title="Test" actions={actions} />);
      
      const button = screen.getByRole('button', { name: 'CRÉER TOURNOI' });
      expect(button).toHaveTextContent('🔒');
    });

    it('does not display lock icon when premium is false', () => {
      const actions = [
        {
          label: 'CRÉER TOURNOI',
          onClick: vi.fn(),
          premium: false,
        },
      ];

      render(<ContextualHeader title="Test" actions={actions} />);
      
      const button = screen.getByRole('button', { name: 'CRÉER TOURNOI' });
      expect(button).not.toHaveTextContent('🔒');
    });
  });

  describe('AC9: Accessibility', () => {
    it('all interactive elements are focusable', () => {
      const actions = [
        {
          label: 'CRÉER',
          onClick: vi.fn(),
        },
      ];

      const menuItems = [
        {
          label: 'Paramètres',
          onClick: vi.fn(),
        },
      ];

      render(
        <ContextualHeader 
          title="Test" 
          showBackButton={true}
          onBack={vi.fn()}
          actions={actions}
          menuItems={menuItems}
        />
      );
      
      const backButton = screen.getByRole('button', { name: 'Retour' });
      const actionButton = screen.getByRole('button', { name: 'CRÉER' });
      const menuButton = screen.getByRole('button', { name: 'Menu' });
      
      expect(backButton).toHaveAttribute('tabIndex', '0');
      expect(actionButton).toHaveAttribute('tabIndex', '0');
      expect(menuButton).toHaveAttribute('tabIndex', '0');
    });

    it('has proper ARIA labels', () => {
      const actions = [
        {
          label: 'CRÉER',
          onClick: vi.fn(),
        },
      ];

      render(<ContextualHeader title="Test" showBackButton={true} onBack={vi.fn()} actions={actions} />);
      
      expect(screen.getByRole('button', { name: 'Retour' })).toHaveAttribute('aria-label', 'Retour');
      expect(screen.getByRole('button', { name: 'CRÉER' })).toHaveAttribute('aria-label', 'CRÉER');
    });

    it('menu button has proper ARIA attributes', () => {
      const menuItems = [
        {
          label: 'Paramètres',
          onClick: vi.fn(),
        },
      ];

      render(<ContextualHeader title="Test" menuItems={menuItems} />);
      
      const menuButton = screen.getByRole('button', { name: 'Menu' });
      expect(menuButton).toHaveAttribute('aria-label', 'Menu');
      expect(menuButton).toHaveAttribute('aria-haspopup', 'true');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      
      // Open menu
      fireEvent.click(menuButton);
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('AC10: Title Truncation', () => {
    it('adds title attribute for full name on hover', () => {
      const longTitle = 'This is a very long tournament name that should be truncated with ellipsis';
      render(<ContextualHeader title={longTitle} />);
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveAttribute('title', longTitle);
    });

    it('applies truncate class to title', () => {
      render(<ContextualHeader title="Test Title" />);
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('truncate');
    });
  });

  describe('Styling', () => {
    it('has correct height and positioning classes', () => {
      const { container } = render(<ContextualHeader title="Test" />);
      
      const header = container.querySelector('header');
      expect(header).toHaveClass('sticky');
      expect(header).toHaveClass('top-0');
      expect(header).toHaveClass('z-30');
      expect(header).toHaveClass('h-16');
      expect(header).toHaveClass('bg-slate-900');
      expect(header).toHaveClass('border-b');
      expect(header).toHaveClass('border-slate-800');
    });
  });

  describe('Button Variants', () => {
    it('applies primary variant classes', () => {
      const actions = [
        {
          label: 'CRÉER',
          onClick: vi.fn(),
          variant: 'primary' as const,
        },
      ];

      render(<ContextualHeader title="Test" actions={actions} />);
      
      const button = screen.getByRole('button', { name: 'CRÉER' });
      expect(button).toHaveClass('bg-primary');
    });

    it('applies secondary variant classes', () => {
      const actions = [
        {
          label: 'INVITER',
          onClick: vi.fn(),
          variant: 'secondary' as const,
        },
      ];

      render(<ContextualHeader title="Test" actions={actions} />);
      
      const button = screen.getByRole('button', { name: 'INVITER' });
      expect(button).toHaveClass('bg-slate-700');
    });

    it('applies ghost variant classes', () => {
      const actions = [
        {
          label: 'OPTIONS',
          onClick: vi.fn(),
          variant: 'ghost' as const,
        },
      ];

      render(<ContextualHeader title="Test" actions={actions} />);
      
      const button = screen.getByRole('button', { name: 'OPTIONS' });
      expect(button).toHaveClass('text-slate-400');
    });
  });

  describe('Destructive Menu Items', () => {
    it('applies red color to destructive menu items', () => {
      const menuItems = [
        {
          label: 'Supprimer',
          onClick: vi.fn(),
          destructive: true,
        },
      ];

      render(<ContextualHeader title="Test" menuItems={menuItems} />);
      
      // Open menu
      const menuButton = screen.getByRole('button', { name: 'Menu' });
      fireEvent.click(menuButton);
      
      const menuItem = screen.getByRole('menuitem', { name: 'Supprimer' });
      expect(menuItem).toHaveClass('text-red-400');
    });
  });
});
