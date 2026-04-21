import { Component, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 rounded-lg p-8 text-center">
        {/* Error Icon */}
        <AlertTriangle size={64} className="text-red-500 mx-auto mb-4" />

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-white mb-2">
          Oups ! Quelque chose s'est mal passé
        </h1>

        {/* Error Message */}
        <p className="text-slate-400 mb-6 text-lg">
          Une erreur inattendue s'est produite. Veuillez réessayer ou retourner à l'accueil.
        </p>

        {/* Error Details (dev mode only) */}
        {import.meta.env.DEV && (
          <div className="mb-6 p-4 bg-slate-900 rounded text-left max-h-48 overflow-auto">
            <p className="text-xs font-semibold text-red-400 mb-2">Détails de l'erreur (mode dev):</p>
            <p className="text-sm font-mono text-red-400 break-all mb-2">
              {error.message}
            </p>
            {errorInfo?.componentStack && (
              <details className="text-xs font-mono text-slate-500">
                <summary className="cursor-pointer hover:text-slate-400">Component Stack</summary>
                <pre className="mt-2 whitespace-pre-wrap">{errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
        )}

        {/* Action Buttons - Alcohol-friendly design: large, high contrast */}
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-amber-500 text-slate-900 rounded-lg font-semibold hover:bg-amber-600 transition-colors text-lg min-h-[44px]"
          >
            <RefreshCw size={24} />
            Réessayer
          </button>

          <button
            onClick={handleGoHome}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors text-lg min-h-[44px]"
          >
            <Home size={24} />
            Accueil
          </button>
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
    <div className="bg-slate-800 rounded-lg p-6 text-center border-2 border-red-500/20">
      <AlertTriangle size={32} className="text-red-500 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 mb-4 text-sm">
        Une erreur est survenue lors du chargement de cette section.
      </p>

      {import.meta.env.DEV && (
        <p className="text-xs font-mono text-red-400 mb-4 break-all">
          {error.message}
        </p>
      )}

      <button
        onClick={reset}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-slate-900 rounded-lg font-semibold hover:bg-amber-600 transition-colors text-sm min-h-[44px] mx-auto"
      >
        <RefreshCw size={18} />
        Réessayer
      </button>
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
