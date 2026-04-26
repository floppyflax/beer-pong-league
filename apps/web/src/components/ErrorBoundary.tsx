import { Component, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { PButton } from './ponglo/PButton';

/**
 * Error Boundary component props
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error Boundary component state
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary class component (React error boundaries must be class components)
 * This component catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  /**
   * Log error information
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', {
      error,
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Store error info in state
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Send to Sentry (Epic 6: Monitoring & Production)
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     extra: {
    //       errorInfo,
    //       componentStack: errorInfo.componentStack,
    //     },
    //   });
    // }
  }

  /**
   * Reset error state to retry rendering
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Use default fallback
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          reset={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback Component
 * Displays a user-friendly error message with recovery options
 */
interface DefaultErrorFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo | null;
  reset: () => void;
}

function DefaultErrorFallback({ error, errorInfo, reset }: DefaultErrorFallbackProps) {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-navy-soft rounded-card border border-card shadow-modal p-7 text-center">
        <div className="inline-flex items-center justify-center w-[68px] h-[68px] rounded-full bg-signal-red/15 mb-5">
          <AlertTriangle size={36} className="text-signal-red" />
        </div>

        <h1 className="font-archivo font-extrabold uppercase tracking-[-0.5px] text-white text-2xl mb-2">
          Oups ! Quelque chose s'est mal passé
        </h1>
        <p className="text-cool-gray text-sm leading-relaxed mb-6">
          Une erreur inattendue s'est produite. Réessaie ou retourne à l'accueil.
        </p>

        {import.meta.env.DEV && (
          <div className="mb-6 p-4 bg-navy/60 border border-card rounded-card text-left max-h-48 overflow-auto">
            <p className="text-xs font-semibold text-signal-red mb-2">Détails de l'erreur (mode dev) :</p>
            <p className="text-sm font-mono text-signal-red break-all mb-2">
              {error.message}
            </p>
            {errorInfo?.componentStack && (
              <details className="text-xs font-mono text-cool-gray">
                <summary className="cursor-pointer hover:text-white">Component Stack</summary>
                <pre className="mt-2 whitespace-pre-wrap">{errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <PButton
            variant="primary"
            size="lg"
            full
            icon={<RefreshCw size={18} />}
            onClick={reset}
          >
            Réessayer
          </PButton>
          <PButton
            variant="ghost"
            size="md"
            full
            icon={<Home size={16} />}
            onClick={handleGoHome}
          >
            Accueil
          </PButton>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Error Fallback for component-level errors
 * Smaller, less intrusive fallback for errors in individual components
 */
interface CompactErrorFallbackProps {
  error: Error;
  reset: () => void;
  title?: string;
}

export function CompactErrorFallback({ error, reset, title = "Erreur" }: CompactErrorFallbackProps) {
  return (
    <div className="bg-navy-soft rounded-card border border-signal-red/30 p-6 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-signal-red/15 mb-3">
        <AlertTriangle size={24} className="text-signal-red" />
      </div>
      <h3 className="font-archivo font-extrabold uppercase tracking-[-0.3px] text-white text-base mb-1.5">
        {title}
      </h3>
      <p className="text-cool-gray text-sm mb-4">
        Une erreur est survenue lors du chargement de cette section.
      </p>

      {import.meta.env.DEV && (
        <p className="text-xs font-mono text-signal-red mb-4 break-all">
          {error.message}
        </p>
      )}

      <div className="inline-flex">
        <PButton
          variant="primary"
          size="sm"
          icon={<RefreshCw size={14} />}
          onClick={reset}
        >
          Réessayer
        </PButton>
      </div>
    </div>
  );
}

/**
 * Error Boundary wrapper with hooks support
 * This is the main export that should be used in the application
 */
export function ErrorBoundary({ children, fallback, onError }: ErrorBoundaryProps) {
  return (
    <ErrorBoundaryClass fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundaryClass>
  );
}

/**
 * Hook to create a compact error fallback for component-level errors
 */
export function useCompactErrorFallback(title?: string) {
  return (error: Error, reset: () => void) => (
    <CompactErrorFallback error={error} reset={reset} title={title} />
  );
}
