import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ContextualBar } from '../../../src/components/navigation/ContextualBar';
import { Zap, UserPlus } from 'lucide-react';

// Mock useBreakpoint hook
vi.mock('../../../src/hooks/useBreakpoint', () => ({
  useIsDesktop: vi.fn(),
}));

import { useIsDesktop } from '../../../src/hooks/useBreakpoint';

describe('ContextualBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render with 1 action', () => {
      vi.mocked(useIsDesktop).mockReturnValue(false);
      
      const actions = [
        {
          id: 'match',
          label: 'NOUVEAU MATCH',
          icon: <Zap size={20} />,
          onClick: vi.fn(),
          visible: true,
        },
      ];

      render(<ContextualBar actions={actions} />);

      expect(screen.getByText('NOUVEAU MATCH')).toBeInTheDocument();
    });

    it('should render with 2 actions', () => {
      vi.mocked(useIsDesktop).mockReturnValue(false);
      
      const actions = [
        {
          id: 'match',
          label: 'NOUVEAU MATCH',
          icon: <Zap size={20} />,
          onClick: vi.fn(),
          visible: true,
        },
        {
          id: 'invite',
          label: 'INVITER',
          icon: <UserPlus size={20} />,
          onClick: vi.fn(),
          visible: true,
        },
      ];

      render(<ContextualBar actions={actions} />);

      expect(screen.getByText('NOUVEAU MATCH')).toBeInTheDocument();
      expect(screen.getByText('INVITER')).toBeInTheDocument();
    });

    it('should not render if all actions are invisible', () => {
      vi.mocked(useIsDesktop).mockReturnValue(false);
      
      const actions = [
        {
          id: 'match',
          label: 'NOUVEAU MATCH',
          icon: <Zap size={20} />,
          onClick: vi.fn(),
          visible: false,
        },
      ];

      const { container } = render(<ContextualBar actions={actions} />);

      expect(container.firstChild).toBeNull();
    });

    it('should filter out actions with visible=false', () => {
      vi.mocked(useIsDesktop).mockReturnValue(false);
      
      const actions = [
        {
          id: 'match',
          label: 'NOUVEAU MATCH',
          icon: <Zap size={20} />,
          onClick: vi.fn(),
          visible: true,
        },
        {
          id: 'invite',
          label: 'INVITER',
          icon: <UserPlus size={20} />,
          onClick: vi.fn(),
          visible: false,
        },
      ];

      render(<ContextualBar actions={actions} />);

      expect(screen.getByText('NOUVEAU MATCH')).toBeInTheDocument();
      expect(screen.queryByText('INVITER')).not.toBeInTheDocument();
    });
  });

  describe('Button Layout', () => {
    it('should render single button full width on mobile', () => {
      vi.mocked(useIsDesktop).mockReturnValue(false);
      
      const actions = [
        {
          id: 'match',
          label: 'NOUVEAU MATCH',
          icon: <Zap size={20} />,
          onClick: vi.fn(),
          visible: true,
        },
      ];

      render(<ContextualBar actions={actions} />);

      const button = screen.getByText('NOUVEAU MATCH').closest('button');
      expect(button).toHaveClass('w-full');
    });

    it('should render two buttons with flex-1 on mobile', () => {
      vi.mocked(useIsDesktop).mockReturnValue(false);
      
      const actions = [
        {
          id: 'match',
          label: 'NOUVEAU MATCH',
          icon: <Zap size={20} />,
          onClick: vi.fn(),
          visible: true,
        },
        {
          id: 'invite',
          label: 'INVITER',
          icon: <UserPlus size={20} />,
          onClick: vi.fn(),
          visible: true,
        },
      ];

      render(<ContextualBar actions={actions} />);

      const button1 = screen.getByText('NOUVEAU MATCH').closest('button');
      const button2 = screen.getByText('INVITER').closest('button');
      
      expect(button1).toHaveClass('flex-1');
      expect(button2).toHaveClass('flex-1');
    });
  });

  describe('Mobile vs Desktop Rendering', () => {
    it('should render as fixed bottom bar on mobile', () => {
      vi.mocked(useIsDesktop).mockReturnValue(false);
      
      const actions = [
        {
          id: 'match',
          label: 'NOUVEAU MATCH',
          icon: <Zap size={20} />,
          onClick: vi.fn(),
          visible: true,
        },
      ];

      const { container } = render(<ContextualBar actions={actions} />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveClass('fixed');
      expect(wrapper).toHaveClass('bottom-0');
      expect(wrapper).toHaveClass('bg-slate-900/80');
      expect(wrapper).toHaveClass('backdrop-blur-md');
      expect(wrapper).toHaveClass('border-t');
    });

    it('should render as inline header buttons on desktop', () => {
      vi.mocked(useIsDesktop).mockReturnValue(true);
      
      const actions = [
        {
          id: 'match',
          label: 'NOUVEAU MATCH',
          icon: <Zap size={20} />,
          onClick: vi.fn(),
          visible: true,
        },
      ];

      const { container } = render(<ContextualBar actions={actions} />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('gap-2');
      expect(wrapper).not.toHaveClass('fixed');
    });
  });

  describe('Button Actions', () => {
    it('should call onClick when button is clicked', async () => {
      vi.mocked(useIsDesktop).mockReturnValue(false);
      const user = userEvent.setup();
      const onClick = vi.fn();
      
      const actions = [
        {
          id: 'match',
          label: 'NOUVEAU MATCH',
          icon: <Zap size={20} />,
          onClick,
          visible: true,
        },
      ];

      render(<ContextualBar actions={actions} />);

      const button = screen.getByText('NOUVEAU MATCH');
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when button is disabled', async () => {
      vi.mocked(useIsDesktop).mockReturnValue(false);
      const user = userEvent.setup();
      const onClick = vi.fn();
      
      const actions = [
        {
          id: 'match',
          label: 'NOUVEAU MATCH',
          icon: <Zap size={20} />,
          onClick,
          visible: true,
          disabled: true,
        },
      ];

      render(<ContextualBar actions={actions} />);

      const button = screen.getByText('NOUVEAU MATCH').closest('button')!;
      await user.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Visual Design', () => {
    it('should apply primary styling to buttons', () => {
      vi.mocked(useIsDesktop).mockReturnValue(false);
      
      const actions = [
        {
          id: 'match',
          label: 'NOUVEAU MATCH',
          icon: <Zap size={20} />,
          onClick: vi.fn(),
          visible: true,
        },
      ];

      render(<ContextualBar actions={actions} />);

      const button = screen.getByText('NOUVEAU MATCH').closest('button');
      
      expect(button).toHaveClass('bg-primary');
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('font-bold');
      expect(button).toHaveClass('rounded-xl');
    });

    it('should apply disabled styling when button is disabled', () => {
      vi.mocked(useIsDesktop).mockReturnValue(false);
      
      const actions = [
        {
          id: 'match',
          label: 'NOUVEAU MATCH',
          icon: <Zap size={20} />,
          onClick: vi.fn(),
          visible: true,
          disabled: true,
        },
      ];

      render(<ContextualBar actions={actions} />);

      const button = screen.getByText('NOUVEAU MATCH').closest('button');
      
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toBeDisabled();
    });

    it('should render icons within buttons', () => {
      vi.mocked(useIsDesktop).mockReturnValue(false);
      
      const actions = [
        {
          id: 'match',
          label: 'NOUVEAU MATCH',
          icon: <Zap size={20} data-testid="zap-icon" />,
          onClick: vi.fn(),
          visible: true,
        },
      ];

      render(<ContextualBar actions={actions} />);

      expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render buttons with proper ARIA attributes', () => {
      vi.mocked(useIsDesktop).mockReturnValue(false);
      
      const actions = [
        {
          id: 'match',
          label: 'NOUVEAU MATCH',
          icon: <Zap size={20} />,
          onClick: vi.fn(),
          visible: true,
        },
      ];

      const { container } = render(<ContextualBar actions={actions} />);

      const button = screen.getByText('NOUVEAU MATCH').closest('button');
      const toolbar = container.querySelector('[role="toolbar"]');
      
      expect(button).toBeInstanceOf(HTMLButtonElement);
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveAttribute('aria-label', 'NOUVEAU MATCH');
      expect(toolbar).toBeInTheDocument();
      expect(toolbar).toHaveAttribute('aria-label', 'Actions contextuelles');
    });

    it('should render disabled buttons with proper ARIA attributes', () => {
      vi.mocked(useIsDesktop).mockReturnValue(false);
      
      const actions = [
        {
          id: 'match',
          label: 'NOUVEAU MATCH',
          icon: <Zap size={20} />,
          onClick: vi.fn(),
          visible: true,
          disabled: true,
        },
      ];

      render(<ContextualBar actions={actions} />);

      const button = screen.getByText('NOUVEAU MATCH').closest('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('disabled');
      expect(button).toHaveAttribute('aria-label', 'NOUVEAU MATCH');
    });

    it('should render toolbar with proper ARIA role on desktop', () => {
      vi.mocked(useIsDesktop).mockReturnValue(true);
      
      const actions = [
        {
          id: 'match',
          label: 'NOUVEAU MATCH',
          icon: <Zap size={20} />,
          onClick: vi.fn(),
          visible: true,
        },
      ];

      const { container } = render(<ContextualBar actions={actions} />);
      const toolbar = container.querySelector('[role="toolbar"]');
      
      expect(toolbar).toBeInTheDocument();
      expect(toolbar).toHaveAttribute('aria-label', 'Actions contextuelles');
    });
  });

  describe('Z-Index', () => {
    it('should use z-40 on mobile to avoid conflicts', () => {
      vi.mocked(useIsDesktop).mockReturnValue(false);
      
      const actions = [
        {
          id: 'match',
          label: 'NOUVEAU MATCH',
          icon: <Zap size={20} />,
          onClick: vi.fn(),
          visible: true,
        },
      ];

      const { container } = render(<ContextualBar actions={actions} />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveClass('z-40');
    });
  });
});
