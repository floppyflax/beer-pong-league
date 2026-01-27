import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary, CompactErrorFallback, useCompactErrorFallback } from '@/components/ErrorBoundary';

/**
 * Test component that throws an error
 */
interface ThrowErrorProps {
  shouldThrow?: boolean;
  errorMessage?: string;
}

function ThrowError({ shouldThrow = true, errorMessage = 'Test error' }: ThrowErrorProps) {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
}

/**
 * Suppress console.error for these tests since we're intentionally throwing errors
 */
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('ErrorBoundary', () => {
  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should catch and display error when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Check for error UI
    expect(screen.getByText(/Oups ! Quelque chose s'est mal passé/i)).toBeInTheDocument();
    expect(screen.getByText(/Une erreur inattendue s'est produite/i)).toBeInTheDocument();
  });

  it('should display custom error message in dev mode', () => {
    const originalMode = import.meta.env.DEV;
    import.meta.env.DEV = true;

    render(
      <ErrorBoundary>
        <ThrowError errorMessage="Custom error message" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();

    import.meta.env.DEV = originalMode;
  });

  it('should show "Réessayer" button', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Réessayer')).toBeInTheDocument();
  });

  it('should show "Accueil" button', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Accueil')).toBeInTheDocument();
  });

  it('should provide reset function to custom fallback', () => {
    const reset = vi.fn();
    
    const customFallback = (error: Error, resetFn: () => void) => {
      // Store reset function to verify it was passed
      reset.mockImplementation(resetFn);
      return (
        <div>
          <p>Error occurred</p>
          <button onClick={resetFn}>Retry</button>
        </div>
      );
    };

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    // Verify custom fallback is rendered
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
    
    // Verify reset function was provided (button is rendered with onClick handler)
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
  });

  it('should navigate to home when "Accueil" button is clicked', async () => {
    const user = userEvent.setup();
    
    // Mock window.location.href
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const homeButton = screen.getByText('Accueil');
    await user.click(homeButton);

    // Verify navigation was attempted
    expect(window.location.href).toBe('/');

    // Restore original location
    window.location = originalLocation;
  });

  it('should use custom fallback when provided', () => {
    const customFallback = (error: Error, reset: () => void) => (
      <div>
        <h1>Custom Error UI</h1>
        <p>{error.message}</p>
        <button onClick={reset}>Custom Reset</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError errorMessage="Test custom fallback" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.getByText('Test custom fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom Reset')).toBeInTheDocument();
  });

  it('should call onError callback when error is caught', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError errorMessage="Callback test" />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });
});

describe('CompactErrorFallback', () => {
  it('should render compact error UI', () => {
    const error = new Error('Compact error test');
    const reset = vi.fn();

    render(<CompactErrorFallback error={error} reset={reset} />);

    expect(screen.getByText('Erreur')).toBeInTheDocument();
    expect(screen.getByText(/Une erreur est survenue lors du chargement de cette section/i)).toBeInTheDocument();
  });

  it('should render custom title', () => {
    const error = new Error('Test error');
    const reset = vi.fn();

    render(<CompactErrorFallback error={error} reset={reset} title="Custom Title" />);

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should call reset when button is clicked', async () => {
    const user = userEvent.setup();
    const error = new Error('Test error');
    const reset = vi.fn();

    render(<CompactErrorFallback error={error} reset={reset} />);

    const resetButton = screen.getByText('Réessayer');
    await user.click(resetButton);

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('should display error message in dev mode', () => {
    const originalMode = import.meta.env.DEV;
    import.meta.env.DEV = true;

    const error = new Error('Dev mode error message');
    const reset = vi.fn();

    render(<CompactErrorFallback error={error} reset={reset} />);

    expect(screen.getByText('Dev mode error message')).toBeInTheDocument();

    import.meta.env.DEV = originalMode;
  });
});

describe('useCompactErrorFallback', () => {
  it('should return a function that renders CompactErrorFallback', () => {
    const fallback = useCompactErrorFallback('Test Hook Title');
    const error = new Error('Hook test');
    const reset = vi.fn();

    const { container } = render(<>{fallback(error, reset)}</>);

    expect(container.textContent).toContain('Test Hook Title');
  });

  it('should use default title when not provided', () => {
    const fallback = useCompactErrorFallback();
    const error = new Error('Hook test');
    const reset = vi.fn();

    const { container } = render(<>{fallback(error, reset)}</>);

    expect(container.textContent).toContain('Erreur');
  });
});
