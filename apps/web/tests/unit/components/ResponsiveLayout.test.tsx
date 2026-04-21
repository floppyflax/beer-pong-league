import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ResponsiveLayout } from '../../../src/components/layout/ResponsiveLayout';

// Mock the useBreakpoint hook
vi.mock('../../../src/hooks/useBreakpoint', () => ({
  useBreakpoint: vi.fn(),
}));

// Mock navigationHelpers
vi.mock('../../../src/utils/navigationHelpers', () => ({
  shouldShowSidebar: vi.fn(() => true),
}));

// Mock Sidebar component
vi.mock('../../../src/components/navigation/Sidebar', () => ({
  Sidebar: () => <aside role="complementary" className="w-60 bg-slate-800">Mocked Sidebar</aside>,
}));

import { useBreakpoint } from '../../../src/hooks/useBreakpoint';

// Helper to wrap component with Router
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('ResponsiveLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Mobile Layout', () => {
    it('should render mobile layout when breakpoint is mobile', () => {
      vi.mocked(useBreakpoint).mockReturnValue('mobile');

      renderWithRouter(
        <ResponsiveLayout>
          <div data-testid="content">Test Content</div>
        </ResponsiveLayout>
      );

      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
      
      // Check for mobile classes
      const wrapper = content.parentElement;
      expect(wrapper).toHaveClass('w-full');
      expect(wrapper).toHaveClass('max-w-md');
      expect(wrapper).toHaveClass('mx-auto');
      expect(wrapper).toHaveClass('px-4');
    });

    it('should not render sidebar in mobile layout', () => {
      vi.mocked(useBreakpoint).mockReturnValue('mobile');

      renderWithRouter(
        <ResponsiveLayout>
          <div data-testid="content">Test Content</div>
        </ResponsiveLayout>
      );

      // Sidebar should not exist
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });
  });

  describe('Tablet Layout', () => {
    it('should render tablet layout with centered content', () => {
      vi.mocked(useBreakpoint).mockReturnValue('tablet');

      renderWithRouter(
        <ResponsiveLayout>
          <div data-testid="content">Test Content</div>
        </ResponsiveLayout>
      );

      const content = screen.getByTestId('content');
      const wrapper = content.parentElement;
      
      // Should have tablet-friendly max-width
      expect(wrapper).toHaveClass('max-w-md');
      expect(wrapper).toHaveClass('mx-auto');
    });
  });

  describe('Desktop Layout', () => {
    it('should render desktop layout with flex container', () => {
      vi.mocked(useBreakpoint).mockReturnValue('desktop');

      const { container } = renderWithRouter(
        <ResponsiveLayout>
          <div data-testid="content">Test Content</div>
        </ResponsiveLayout>
      );

      const content = screen.getByTestId('content');
      
      // Desktop should have flex layout
      const flexContainer = container.querySelector('.flex.h-screen');
      expect(flexContainer).toBeInTheDocument();
      
      // Content should be in flex-1 container
      expect(content.parentElement).toHaveClass('flex-1');
      expect(content.parentElement).toHaveClass('overflow-auto');
    });

    it('should render sidebar placeholder in desktop layout by default', () => {
      vi.mocked(useBreakpoint).mockReturnValue('desktop');

      renderWithRouter(
        <ResponsiveLayout>
          <div data-testid="content">Test Content</div>
        </ResponsiveLayout>
      );

      // Should have sidebar area
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveClass('w-60');
      expect(sidebar).toHaveClass('bg-slate-800');
    });

    it('should hide sidebar when showSidebar is false', () => {
      vi.mocked(useBreakpoint).mockReturnValue('desktop');

      renderWithRouter(
        <ResponsiveLayout showSidebar={false}>
          <div data-testid="content">Test Content</div>
        </ResponsiveLayout>
      );

      // Sidebar should not exist
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });
  });

  describe('Desktop Large Layout', () => {
    it('should render desktop-large layout with sidebar', () => {
      vi.mocked(useBreakpoint).mockReturnValue('desktop-large');

      renderWithRouter(
        <ResponsiveLayout>
          <div data-testid="content">Test Content</div>
        </ResponsiveLayout>
      );

      const content = screen.getByTestId('content');
      const sidebar = screen.getByRole('complementary');

      expect(sidebar).toBeInTheDocument();
      expect(content).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept and render children', () => {
      vi.mocked(useBreakpoint).mockReturnValue('mobile');

      renderWithRouter(
        <ResponsiveLayout>
          <div>Child 1</div>
          <div>Child 2</div>
        </ResponsiveLayout>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('should respect showSidebar prop', () => {
      vi.mocked(useBreakpoint).mockReturnValue('desktop');

      const { rerender } = renderWithRouter(
        <ResponsiveLayout showSidebar={true}>
          <div data-testid="content">Test Content</div>
        </ResponsiveLayout>
      );

      expect(screen.getByRole('complementary')).toBeInTheDocument();

      rerender(
        <MemoryRouter>
          <ResponsiveLayout showSidebar={false}>
            <div data-testid="content">Test Content</div>
          </ResponsiveLayout>
        </MemoryRouter>
      );

      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });
  });

  describe('Responsive behavior', () => {
    it('should change layout when breakpoint changes from mobile to desktop', () => {
      vi.mocked(useBreakpoint).mockReturnValue('mobile');

      const { rerender } = renderWithRouter(
        <ResponsiveLayout>
          <div data-testid="content">Test Content</div>
        </ResponsiveLayout>
      );

      // Mobile: no sidebar
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();

      // Change to desktop
      vi.mocked(useBreakpoint).mockReturnValue('desktop');
      rerender(
        <MemoryRouter>
          <ResponsiveLayout>
            <div data-testid="content">Test Content</div>
          </ResponsiveLayout>
        </MemoryRouter>
      );

      // Desktop: sidebar exists
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });
  });
});
