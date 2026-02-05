import { createContext, useContext, useState, ReactNode } from 'react';
import { useIsMobile, useIsDesktop } from '../hooks/useBreakpoint';
import { useNavigate } from 'react-router-dom';

/**
 * Navigation context type definition
 */
export interface NavigationContextType {
  /** Currently active tab in bottom navigation */
  activeTab: string;
  /** Set the active tab */
  setActiveTab: (tab: string) => void;
  /** Whether viewport is mobile */
  isMobile: boolean;
  /** Whether viewport is desktop */
  isDesktop: boolean;
  /** Whether to show back button */
  showBackButton: boolean;
  /** Back button handler */
  onBack: () => void;
}

/**
 * Navigation context for managing navigation state across the app
 */
const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

/**
 * NavigationProvider component that provides navigation state to the app
 * 
 * Manages:
 * - Active tab state (for bottom tab menu)
 * - Back button visibility and handling
 * - Breakpoint state (mobile/desktop)
 * 
 * @example
 * ```tsx
 * <NavigationProvider>
 *   <App />
 * </NavigationProvider>
 * ```
 */
export const NavigationProvider = ({ children }: NavigationProviderProps) => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [showBackButton] = useState(false);
  const navigate = useNavigate();
  
  // Track breakpoint state
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();

  /**
   * Handle back navigation
   * Default behavior: navigate back in browser history
   * Can be customized per page by updating this handler
   */
  const onBack = () => {
    navigate(-1);
  };

  const value: NavigationContextType = {
    activeTab,
    setActiveTab,
    isMobile,
    isDesktop,
    showBackButton,
    onBack,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

/**
 * Custom hook to access navigation context
 * 
 * Must be used within NavigationProvider
 * 
 * @throws Error if used outside NavigationProvider
 * 
 * @example
 * ```tsx
 * const { activeTab, setActiveTab, isMobile } = useNavigation();
 * ```
 */
export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  
  return context;
};
