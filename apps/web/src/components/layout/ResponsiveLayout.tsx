import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '../navigation/Sidebar';
import { shouldShowSidebar } from '../../utils/navigationHelpers';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

/**
 * ResponsiveLayout component that adapts layout based on viewport width
 * 
 * Mobile (< 768px): Full width with padding, centered
 * Tablet (768px - 1023px): Max-width with centered content
 * Desktop (>= 1024px): Flex layout with optional sidebar
 * 
 * @param children - Content to render inside the layout
 * @param showSidebar - Whether to show sidebar on desktop (default: auto-determined)
 * 
 * @example
 * ```tsx
 * <ResponsiveLayout>
 *   <YourContent />
 * </ResponsiveLayout>
 * ```
 */
export const ResponsiveLayout = ({ 
  children, 
  showSidebar 
}: ResponsiveLayoutProps) => {
  const breakpoint = useBreakpoint();
  const location = useLocation();
  const isDesktop = breakpoint === 'desktop' || breakpoint === 'desktop-large';
  
  // Determine if sidebar should be shown (default to auto-detection based on route)
  const sidebarVisible = showSidebar !== undefined 
    ? showSidebar 
    : shouldShowSidebar(location.pathname);

  // Desktop layout with optional sidebar
  if (isDesktop && sidebarVisible) {
    return (
      <div className="flex h-screen">
        {/* Story 9-6: Desktop Sidebar Navigation */}
        <Sidebar />
        
        {/* Main content area - offset for fixed sidebar */}
        <div className="flex-1 ml-60 overflow-auto">
          {children}
        </div>
      </div>
    );
  }

  // Desktop layout without sidebar
  if (isDesktop && !sidebarVisible) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    );
  }

  // Mobile & Tablet layout
  return (
    <div className="w-full max-w-md mx-auto px-4">
      {children}
    </div>
  );
};
