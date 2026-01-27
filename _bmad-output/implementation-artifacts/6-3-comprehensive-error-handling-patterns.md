# Story 6.3: Comprehensive Error Handling Patterns

Status: ready-for-dev

## Story

As a user,
I want clear error messages when something goes wrong,
So that I understand what happened and what to do next.

## Acceptance Criteria

**Given** various error scenarios
**When** network errors occur
**Then** user sees friendly message with retry option
**And** app falls back to localStorage
**When** validation errors occur
**Then** user sees field-specific error messages
**And** form highlights invalid fields
**When** authentication errors occur
**Then** user is redirected to login with context
**And** error message explains the issue
**When** unknown errors occur
**Then** user sees generic friendly message
**And** error is logged to Sentry for investigation
**And** all errors use react-hot-toast for notifications

## Tasks / Subtasks

- [ ] Define error message constants (AC: Error messages)
  - [ ] Create src/constants/errorMessages.ts
  - [ ] Define messages for all error types
  - [ ] Use French language
  - [ ] Test messages are clear

- [ ] Implement network error handling (AC: Network errors)
  - [ ] Detect network errors
  - [ ] Show friendly message
  - [ ] Offer retry action
  - [ ] Fall back to localStorage
  - [ ] Test network error handling

- [ ] Implement validation error handling (AC: Validation errors)
  - [ ] Display field-specific errors
  - [ ] Highlight invalid fields
  - [ ] Show inline error messages
  - [ ] Use Zod error formatting
  - [ ] Test validation errors

- [ ] Implement authentication error handling (AC: Auth errors)
  - [ ] Detect auth failures
  - [ ] Show clear error message
  - [ ] Redirect to auth modal
  - [ ] Preserve user's intended action
  - [ ] Test auth error handling

- [ ] Implement generic error handling (AC: Unknown errors)
  - [ ] Catch unexpected errors
  - [ ] Show generic friendly message
  - [ ] Log to Sentry
  - [ ] Provide support contact
  - [ ] Test generic error handling

- [ ] Standardize error notifications (AC: Use react-hot-toast)
  - [ ] Use toast.error() consistently
  - [ ] Configure toast styling
  - [ ] Set appropriate duration
  - [ ] Test toast notifications

- [ ] Add error handling to all services (AC: Comprehensive coverage)
  - [ ] DatabaseService error handling
  - [ ] AuthService error handling
  - [ ] AnonymousUserService error handling
  - [ ] IdentityMergeService error handling
  - [ ] Test all error paths

## Dev Notes

### Error Message Constants

**src/constants/errorMessages.ts:**
```typescript
export const ErrorMessages = {
  // Network errors
  NETWORK_ERROR: 'Problème de connexion. Vérifiez votre internet et réessayez.',
  NETWORK_TIMEOUT: 'La requête a pris trop de temps. Réessayez.',
  OFFLINE: 'Vous êtes hors ligne. Les données seront synchronisées quand vous serez en ligne.',
  
  // Authentication errors
  AUTH_REQUIRED: 'Vous devez vous connecter pour continuer.',
  AUTH_FAILED: 'Échec de l\'authentification. Réessayez.',
  SESSION_EXPIRED: 'Votre session a expiré. Reconnectez-vous.',
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
  
  // Validation errors
  VALIDATION_FAILED: 'Veuillez corriger les erreurs dans le formulaire.',
  REQUIRED_FIELD: 'Ce champ est requis.',
  INVALID_EMAIL: 'Adresse email invalide.',
  INVALID_DATE: 'Date invalide.',
  INVALID_FORMAT: 'Format invalide.',
  
  // Tournament errors
  TOURNAMENT_NOT_FOUND: 'Tournament introuvable. Vérifiez le lien ou le QR code.',
  TOURNAMENT_FINISHED: 'Ce tournament est terminé.',
  ALREADY_JOINED: 'Vous avez déjà rejoint ce tournament.',
  
  // Match errors
  MATCH_RECORDING_FAILED: 'Impossible d\'enregistrer le match. Réessayez.',
  INVALID_SCORES: 'Scores invalides. Vérifiez les valeurs.',
  DUPLICATE_PLAYERS: 'Un joueur ne peut pas être dans les deux équipes.',
  
  // Generic errors
  UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite. Réessayez ou contactez le support.',
  SERVER_ERROR: 'Erreur serveur. Réessayez dans quelques instants.',
  NOT_FOUND: 'Élément introuvable.',
  PERMISSION_DENIED: 'Vous n\'avez pas la permission d\'effectuer cette action.',
} as const;
```

### Error Handling Utility

**src/utils/errorHandler.ts:**
```typescript
import toast from 'react-hot-toast';
import * as Sentry from '@sentry/react';
import { ErrorMessages } from '@/constants/errorMessages';

export function handleError(
  error: unknown,
  context?: Record<string, any>
): void {
  // Log to console in dev
  if (import.meta.env.DEV) {
    console.error('Error:', error, context);
  }
  
  // Log to Sentry in production
  if (import.meta.env.PROD) {
    Sentry.captureException(error, { extra: context });
  }
  
  // Determine error message
  let message = ErrorMessages.UNKNOWN_ERROR;
  
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      message = ErrorMessages.NETWORK_ERROR;
    }
    // Auth errors
    else if (error.message.includes('auth') || error.message.includes('session')) {
      message = ErrorMessages.AUTH_FAILED;
    }
    // Validation errors
    else if (error.message.includes('validation')) {
      message = ErrorMessages.VALIDATION_FAILED;
    }
  }
  
  // Supabase errors
  if (isSupabaseError(error)) {
    message = handleSupabaseError(error);
  }
  
  // Show toast notification
  toast.error(message, {
    duration: 5000,
    position: 'top-center',
  });
}

function isSupabaseError(error: any): boolean {
  return error && typeof error === 'object' && 'code' in error;
}

function handleSupabaseError(error: any): string {
  const code = error.code;
  
  // Common Supabase error codes
  switch (code) {
    case 'PGRST116':
      return ErrorMessages.NOT_FOUND;
    case '23505':
      return 'Cet élément existe déjà.';
    case '42501':
      return ErrorMessages.PERMISSION_DENIED;
    default:
      return ErrorMessages.SERVER_ERROR;
  }
}

// Retry wrapper
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Offline fallback wrapper
export async function withOfflineFallback<T>(
  fn: () => Promise<T>,
  fallback: () => T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!navigator.onLine) {
      toast.info(ErrorMessages.OFFLINE);
      return fallback();
    }
    throw error;
  }
}
```

### Service Error Handling Example

**DatabaseService with error handling:**
```typescript
async recordMatch(matchData: MatchInput): Promise<Match> {
  try {
    // Try Supabase first
    const { data, error } = await supabase
      .from('matches')
      .insert(matchData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Save to localStorage as backup
    localStorage.setItem(`match_${data.id}`, JSON.stringify(data));
    
    return data;
    
  } catch (error) {
    // If offline, save to localStorage only
    if (!navigator.onLine) {
      const tempMatch = {
        ...matchData,
        id: `temp-${Date.now()}`,
        synced: false
      };
      
      localStorage.setItem(`match_${tempMatch.id}`, JSON.stringify(tempMatch));
      toast.info(ErrorMessages.OFFLINE);
      
      return tempMatch as Match;
    }
    
    // Handle and rethrow
    handleError(error, { matchData });
    throw error;
  }
}
```

### Form Validation Error Display

**Using Zod with react-hook-form:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function Form() {
  const form = useForm({
    resolver: zodResolver(schema)
  });
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input
        {...form.register('name')}
        className={form.formState.errors.name ? 'border-red-500' : ''}
      />
      {form.formState.errors.name && (
        <p className="text-red-500 text-sm mt-1">
          {form.formState.errors.name.message}
        </p>
      )}
    </form>
  );
}
```

### Toast Configuration

**Configure in main.tsx:**
```typescript
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          // Success
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#fff',
            },
          },
          // Error
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          },
          // Info
          loading: {
            duration: Infinity,
          },
        }}
      />
      
      {/* App content */}
    </>
  );
}
```

### Testing Checklist

**Error Handling:**
- [ ] Network errors show friendly message
- [ ] Network errors trigger localStorage fallback
- [ ] Validation errors highlight fields
- [ ] Auth errors redirect to login
- [ ] Unknown errors show generic message
- [ ] All errors logged to Sentry

**User Experience:**
- [ ] Error messages in French
- [ ] Messages are clear and actionable
- [ ] Toast notifications consistent
- [ ] Retry options where appropriate
- [ ] No technical jargon

**Coverage:**
- [ ] All services handle errors
- [ ] All forms handle validation
- [ ] All API calls handle failures
- [ ] Offline mode works
- [ ] No unhandled promise rejections

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 3.2: Error Handling Standards]
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns - Error Handling]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR2: Reliability]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6: Error Handling & Monitoring]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.3]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Create:**
- src/constants/errorMessages.ts
- src/utils/errorHandler.ts

**Files to Modify:**
- src/services/DatabaseService.ts (add error handling)
- src/services/AuthService.ts (add error handling)
- src/services/AnonymousUserService.ts (add error handling)
- src/services/IdentityMergeService.ts (add error handling)
- src/main.tsx (add Toaster configuration)
