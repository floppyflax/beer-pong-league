# Story 1.5: Error Boundaries Implementation

Status: ready-for-dev

## Story

As a user,
I want errors to be handled gracefully with user-friendly messages,
So that the application doesn't crash and I understand what went wrong.

## Acceptance Criteria

**Given** the need for error handling
**When** I implement error boundaries
**Then** error boundary component is created in `src/components/ErrorBoundary.tsx`
**And** error boundary wraps route components in `App.tsx`
**And** error boundary displays user-friendly error message
**And** error boundary logs errors for debugging
**And** error boundary provides recovery option (retry, go home)
**And** Sentry integration is prepared (to be connected in Epic 6)

## Tasks / Subtasks

- [ ] Create ErrorBoundary component (AC: Component)
  - [ ] Create src/components/ErrorBoundary.tsx
  - [ ] Implement React error boundary class component
  - [ ] Add state for error tracking (hasError, error)
  - [ ] Implement componentDidCatch lifecycle
  - [ ] Implement static getDerivedStateFromError

- [ ] Design error UI (AC: User-friendly message)
  - [ ] Create error display with icon
  - [ ] Show error title and message
  - [ ] Add error details (in dev mode only)
  - [ ] Style with Tailwind CSS
  - [ ] Ensure "alcohol-friendly" design (large buttons, clear text)

- [ ] Add recovery options (AC: Recovery)
  - [ ] Add "Try Again" button (reload component)
  - [ ] Add "Go Home" button (navigate to /)
  - [ ] Implement reset error state on retry
  - [ ] Test recovery actions work

- [ ] Add error logging (AC: Logging)
  - [ ] Log errors to console (dev)
  - [ ] Prepare Sentry integration point
  - [ ] Include error context (component stack, user info)
  - [ ] Add error timestamp

- [ ] Wrap routes in App.tsx (AC: Route wrapping)
  - [ ] Import ErrorBoundary
  - [ ] Wrap each route with ErrorBoundary
  - [ ] Test error boundary catches route errors
  - [ ] Verify app doesn't crash on error

- [ ] Create fallback UI variants (AC: Display)
  - [ ] Create route-level error fallback
  - [ ] Create component-level error fallback (smaller)
  - [ ] Add props for custom error messages
  - [ ] Test different error scenarios

- [ ] Add tests (AC: Testing)
  - [ ] Create tests/unit/components/ErrorBoundary.test.tsx
  - [ ] Test error is caught
  - [ ] Test error UI is displayed
  - [ ] Test recovery actions work
  - [ ] Run tests

## Dev Notes

### ErrorBoundary Component

**src/components/ErrorBoundary.tsx:**
```typescript
import { Component, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // TODO: Send to Sentry (Epic 6)
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return (
        <DefaultErrorFallback 
          error={this.state.error} 
          reset={this.resetError} 
        />
      );
    }

    return this.props.children;
  }
}

// Default Error Fallback Component
function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 rounded-lg p-8 text-center">
        <AlertTriangle size={64} className="text-red-500 mx-auto mb-4" />
        
        <h1 className="text-2xl font-bold text-white mb-2">
          Oups ! Quelque chose s'est mal passé
        </h1>
        
        <p className="text-slate-400 mb-6">
          Une erreur inattendue s'est produite. Veuillez réessayer ou retourner à l'accueil.
        </p>

        {/* Error details (dev mode only) */}
        {import.meta.env.DEV && (
          <div className="mb-6 p-4 bg-slate-900 rounded text-left">
            <p className="text-sm font-mono text-red-400 break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-slate-900 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
          >
            <RefreshCw size={20} />
            Réessayer
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors"
          >
            <Home size={20} />
            Accueil
          </button>
        </div>
      </div>
    </div>
  );
}

// Wrapper with hooks support
export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  return (
    <ErrorBoundaryClass fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
}
```

**App.tsx Integration:**
```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/league/:leagueId" element={
            <ErrorBoundary>
              <LeagueDashboard />
            </ErrorBoundary>
          } />
          {/* Other routes... */}
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}
```

### Project Structure Notes

**Alcohol-Friendly Design:**
- Large buttons (min 44x44px)
- High contrast text
- Clear, simple messages
- Prominent action buttons

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 3.2: Error Handling Standards]
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns - Error Handling]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR1: Usability]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1: Foundation & Code Quality]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Create:**
- src/components/ErrorBoundary.tsx
- tests/unit/components/ErrorBoundary.test.tsx

**Files to Modify:**
- src/App.tsx (wrap routes with ErrorBoundary)
