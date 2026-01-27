# Story 6.1: Sentry Error Monitoring Integration

Status: ready-for-dev

## Story

As a developer,
I want error monitoring and tracking,
So that I can identify and fix issues in production quickly.

## Acceptance Criteria

**Given** the need for production monitoring
**When** Sentry is integrated
**Then** @sentry/react is installed
**And** Sentry is initialized in the application
**And** error boundaries send errors to Sentry
**And** unhandled errors are captured and reported
**And** error context is included (user info, stack traces)
**And** source maps are configured for debugging
**And** Vercel integration is set up for automatic source map uploads
**And** error tracking works in production

## Tasks / Subtasks

- [ ] Install Sentry SDK (AC: @sentry/react installed)
  - [ ] Run: `npm install @sentry/react`
  - [ ] Verify installation in package.json
  - [ ] Test import works

- [ ] Initialize Sentry (AC: Sentry initialized)
  - [ ] Create Sentry configuration
  - [ ] Add DSN from environment variables
  - [ ] Initialize in main.tsx
  - [ ] Configure sample rate
  - [ ] Test initialization works

- [ ] Integrate with ErrorBoundary (AC: Error boundaries send errors)
  - [ ] Import Sentry in ErrorBoundary
  - [ ] Capture errors in componentDidCatch
  - [ ] Include error context
  - [ ] Test errors are sent to Sentry

- [ ] Capture unhandled errors (AC: Unhandled errors captured)
  - [ ] Sentry captures window errors
  - [ ] Sentry captures promise rejections
  - [ ] Test unhandled errors are captured
  - [ ] Verify errors appear in Sentry dashboard

- [ ] Add error context (AC: Context included)
  - [ ] Include user ID/email
  - [ ] Include browser info
  - [ ] Include URL and route
  - [ ] Add custom tags
  - [ ] Test context is sent

- [ ] Configure source maps (AC: Source maps configured)
  - [ ] Enable source maps in vite.config.ts
  - [ ] Configure Sentry CLI
  - [ ] Test source maps work in dev
  - [ ] Verify stack traces are readable

- [ ] Set up Vercel integration (AC: Vercel integration)
  - [ ] Add Sentry Vercel integration
  - [ ] Configure automatic uploads
  - [ ] Add Sentry auth token to Vercel
  - [ ] Test source maps upload on deploy

- [ ] Test in production (AC: Works in production)
  - [ ] Trigger test error
  - [ ] Verify error appears in Sentry
  - [ ] Check source maps work
  - [ ] Verify context is correct

## Dev Notes

### Installation

```bash
npm install @sentry/react
```

### Sentry Configuration

**src/lib/sentry.ts:**
```typescript
import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

export function initSentry() {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      
      // Performance monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      
      // Environment
      environment: import.meta.env.MODE,
      
      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || 'unknown',
      
      // React Router integration
      integrations: [
        Sentry.reactRouterV6BrowserTracingIntegration({
          useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes,
        }),
        Sentry.replayIntegration(),
      ],
      
      // Session replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    });
  }
}

// Set user context
export function setUser(user: { id: string; email?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
  });
}

// Clear user context
export function clearUser() {
  Sentry.setUser(null);
}

// Add custom context
export function setContext(context: Record<string, any>) {
  Sentry.setContext('custom', context);
}

// Capture exception manually
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}
```

**Initialize in main.tsx:**
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initSentry } from './lib/sentry';

// Initialize Sentry first
initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### ErrorBoundary Integration

**Update ErrorBoundary.tsx:**
```typescript
import * as Sentry from '@sentry/react';

componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  // Log to console
  console.error('ErrorBoundary caught an error:', error, errorInfo);
  
  // Send to Sentry
  Sentry.captureException(error, {
    extra: {
      componentStack: errorInfo.componentStack,
    },
  });
}
```

### Environment Variables

**Add to .env:**
```
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_APP_VERSION=1.0.0
```

**Add to .env.example:**
```
VITE_SENTRY_DSN=
VITE_APP_VERSION=
```

### Source Maps Configuration

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    
    // Sentry plugin for source map upload
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  
  build: {
    sourcemap: true,  // Enable source maps in production
  },
});
```

### Vercel Integration

**Steps:**
1. Go to Vercel Dashboard → Project Settings → Integrations
2. Add Sentry integration
3. Connect Sentry account
4. Configure project mapping
5. Add environment variables:
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
   - `SENTRY_AUTH_TOKEN`

### Testing

**Trigger test error:**
```typescript
// Add a test button in dev mode
{import.meta.env.DEV && (
  <button onClick={() => {
    throw new Error('Test Sentry error');
  }}>
    Test Sentry
  </button>
)}
```

### Testing Checklist

**Sentry Setup:**
- [ ] Sentry installed
- [ ] DSN configured
- [ ] Initialization works
- [ ] Environment variables set

**Error Capture:**
- [ ] ErrorBoundary errors captured
- [ ] Unhandled errors captured
- [ ] Promise rejections captured
- [ ] Context included

**Source Maps:**
- [ ] Source maps enabled
- [ ] Stack traces readable
- [ ] Vercel uploads work
- [ ] Production errors debuggable

**Production:**
- [ ] Test error in production
- [ ] Error appears in Sentry dashboard
- [ ] Source maps work
- [ ] Context is correct

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 3.3: Monitoring and Observability]
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure - Error Monitoring]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR2: Reliability]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6: Error Handling & Monitoring]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Create:**
- src/lib/sentry.ts

**Files to Modify:**
- src/main.tsx (initialize Sentry)
- src/components/ErrorBoundary.tsx (integrate Sentry)
- vite.config.ts (add Sentry plugin)
- package.json (add @sentry/react dependency)
- .env.example (add Sentry variables)
