import { useState, useEffect } from 'react';

/**
 * Breakpoint types matching Tailwind CSS default breakpoints
 * mobile: < 768px
 * tablet: 768px - 1023px
 * desktop: 1024px - 1439px
 * desktop-large: >= 1440px
 */
export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'desktop-large';

/**
 * Custom hook to detect current viewport breakpoint
 * Automatically updates on window resize
 * SSR-safe (returns 'mobile' during SSR)
 * 
 * @returns Current breakpoint
 * 
 * @example
 * ```tsx
 * const breakpoint = useBreakpoint();
 * if (breakpoint === 'mobile') {
 *   // Show mobile layout
 * }
 * ```
 */
export const useBreakpoint = (): Breakpoint => {
  // SSR-safe: Default to mobile if window is not available
  const getBreakpoint = (): Breakpoint => {
    if (typeof window === 'undefined') {
      return 'mobile';
    }

    const width = window.innerWidth;
    
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    if (width < 1440) return 'desktop';
    return 'desktop-large';
  };

  const [breakpoint, setBreakpoint] = useState<Breakpoint>(getBreakpoint);

  useEffect(() => {
    // SSR safety check
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      const newBreakpoint = getBreakpoint();
      setBreakpoint(newBreakpoint);
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return breakpoint;
};

/**
 * Custom hook to check if current viewport is mobile
 * 
 * @returns true if viewport width < 768px
 * 
 * @example
 * ```tsx
 * const isMobile = useIsMobile();
 * return isMobile ? <MobileNav /> : <DesktopNav />;
 * ```
 */
export const useIsMobile = (): boolean => {
  const breakpoint = useBreakpoint();
  return breakpoint === 'mobile';
};

/**
 * Custom hook to check if current viewport is desktop or larger
 * 
 * @returns true if viewport width >= 1024px
 * 
 * @example
 * ```tsx
 * const isDesktop = useIsDesktop();
 * return isDesktop && <Sidebar />;
 * ```
 */
export const useIsDesktop = (): boolean => {
  const breakpoint = useBreakpoint();
  return breakpoint === 'desktop' || breakpoint === 'desktop-large';
};
