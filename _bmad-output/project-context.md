---
project_name: 'beer-pong-league'
user_name: 'floppyflax'
date: '2026-01-23'
sections_completed: ['technology_stack', 'critical_rules', 'patterns', 'anti_patterns']
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

**Frontend:**
- React 18.2.0 (strict mode, hooks only, no class components)
- TypeScript 5.2.2 (strict mode enabled, noUnusedLocals, noUnusedParameters)
- Vite 5.1.4 (ESM, path aliases `@/*` → `src/*`)
- Tailwind CSS 3.4.1 (utility-first, custom theme in `tailwind.config.js`)
- React Router 6.22.0 (client-side routing)

**Backend:**
- Supabase (@supabase/supabase-js ^2.39.0)
  - Auth: Email + OTP (passwordless)
  - Database: PostgreSQL with RLS policies
  - Realtime: For post-MVP display view

**State Management:**
- React Context API (no Redux/MobX)
- Custom hooks: useAuth, useIdentity, useLeague

**Styling:**
- Tailwind CSS utility classes
- Custom colors: primary (amber), secondary (slate), accent (red)
- Lucide React icons (^0.344.0)

**Build & Deploy:**
- Vite for bundling
- Vercel for hosting (SPA static deployment)
- TypeScript compilation before build (`tsc && vite build`)

**Validation (To Be Added):**
- Zod 4.3.6 for client-side validation
- PostgreSQL constraints + RLS for server-side validation

**Testing (To Be Added):**
- Vitest + React Testing Library
- jsdom for DOM testing

**Monitoring (To Be Added):**
- Sentry React SDK for error tracking

---

## Critical Implementation Rules

### TypeScript Rules

**Strict Mode Requirements:**
- `strict: true` - All strict checks enabled
- `noUnusedLocals: true` - Remove unused variables
- `noUnusedParameters: true` - Remove unused function parameters
- `noFallthroughCasesInSwitch: true` - Explicit break statements

**Type Safety:**
- Always use explicit types for function parameters and return values
- Use `interface` for object shapes, `type` for unions/intersections
- Never use `any` - use `unknown` if type is truly unknown
- Import types with `import type` when importing only types

**Path Aliases:**
- Use `@/components/...` instead of `../components/...`
- Use `@/services/...` instead of `../services/...`
- Configured in `tsconfig.json` and `vite.config.ts`

### React Patterns

**Component Structure:**
- Use functional components only (no class components)
- Props interface: `{ComponentName}Props` (e.g., `EmptyStateProps`)
- Export: Named export `export const ComponentName = (...) => {}`
- File naming: PascalCase matching component name (e.g., `EmptyState.tsx`)

**Hooks Usage:**
- Custom hooks: camelCase with `use` prefix (e.g., `useAuth`, `useIdentity`)
- Hook files: camelCase matching hook name (e.g., `useAuth.ts`)
- Always call hooks at top level, never in conditionals or loops
- Use `useMemo` and `useCallback` for expensive computations

**State Management:**
- Global state: React Context (AuthContext, IdentityContext, LeagueContext)
- Local state: `useState` for component-specific state
- State updates: Always use immutable updates with functional setState
  - ✅ Correct: `setLeagues(prev => [...prev, newLeague])`
  - ❌ Wrong: `leagues.push(newLeague)`

**Error Boundaries:**
- Wrap route components in error boundaries (to be implemented)
- Use `react-hot-toast` for user-facing error messages
- Never use `alert()` or `console.error()` only

### Database & API Patterns

**Supabase Client:**
- Single instance: Import from `src/lib/supabase.ts`
- Always check `isSupabaseAvailable()` before operations
- Fallback to localStorage when offline

**Data Transformation:**
- Database → App: Convert `snake_case` to `camelCase`
  - `created_at` → `createdAt`
  - `user_id` → `userId`
- App → Database: Convert `camelCase` to `snake_case`
  - `createdAt` → `created_at`
  - `userId` → `user_id`

**Error Handling:**
- Always use try-catch for async operations
- Check `error` property from Supabase responses
- Fallback to localStorage on error
- Show user-friendly messages with `toast.error()`

**Service Layer:**
- Services are stateless classes
- Export singleton instance: `export const serviceName = new ServiceName()`
- Methods are async and return Promises
- Handle offline mode with localStorage fallback

### Naming Conventions

**Files:**
- Components/Pages: PascalCase (`EmptyState.tsx`, `LeagueDashboard.tsx`)
- Services/Utils: camelCase (`databaseService.ts`, `elo.ts`)
- Types: camelCase for files (`types.ts`), PascalCase for types (`Player`, `League`)

**Code:**
- Components: PascalCase (`EmptyState`, `AuthModal`)
- Functions: camelCase with verb (`createLeague`, `loadLeagues`)
- Variables: camelCase (`userId`, `currentLeague`, `isLoading`)
- Constants: UPPER_SNAKE_CASE (`MIGRATION_FLAG_KEY`)
- Database: snake_case (`leagues`, `created_at`, `user_id`)

**Props Interfaces:**
- Pattern: `{ComponentName}Props`
- ✅ Correct: `EmptyStateProps`, `AuthModalProps`
- ❌ Wrong: `IEmptyStateProps`, `emptyStateProps`

### Code Organization

**Directory Structure:**
- `src/components/` - Reusable UI components
- `src/pages/` - Route-level page components
- `src/services/` - Business logic and data access
- `src/context/` - React Context providers
- `src/hooks/` - Custom React hooks
- `src/lib/` - Third-party library configurations
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions

**Component Organization:**
- Atomic Design pattern (atoms → molecules → organisms → pages)
- Co-locate related files in same directory
- Layout components in `components/layout/`

**Test Organization (To Be Created):**
- `tests/unit/` - Unit tests
- `tests/integration/` - Integration tests
- `tests/e2e/` - End-to-end tests
- Tests NOT co-located with source files

### Format Patterns

**Dates:**
- Always use ISO 8601 strings: `"2026-01-23T10:30:00Z"` or `"2026-01-23"`
- Never use Unix timestamps or custom formats

**Booleans:**
- Use `true`/`false` (never `1`/`0`)
- Database fields: `is_finished: boolean` (not `isFinished?: boolean` for DB)

**Null Handling:**
- Use `null` for optional database fields (not `undefined`)
- Type: `creator_user_id: string | null`

**Arrays:**
- Always use arrays for collections (never single objects when multiple expected)
- Type: `players: Player[]`, `matches: Match[]`

### Communication Patterns

**Loading States:**
- Naming: `isLoading{Context}` (e.g., `isLoadingInitialData`, `authLoading`)
- Global: Context loading states for initial data
- Local: Component state for action-specific loading
- UI: Always use `LoadingSpinner` component

**Optimistic Updates:**
- Update UI immediately, sync to Supabase in background
- Update state first, then perform async operation
- Rollback on error with user notification

**Error Messages:**
- User-facing: `toast.error('User-friendly message')`
- Developer: `console.error('Technical details', error)`
- Never expose technical errors to users

---

## Patterns to Follow

### Service Pattern

```typescript
// DatabaseService.ts
import { supabase } from '../lib/supabase';
import type { League } from '../types';

class DatabaseService {
  private isSupabaseAvailable(): boolean {
    return supabase !== null;
  }

  async loadLeagues(userId?: string): Promise<League[]> {
    if (!this.isSupabaseAvailable()) {
      return this.loadLeaguesFromLocalStorage();
    }

    try {
      const { data, error } = await supabase!
        .from('leagues')
        .select('*')
        .eq('creator_user_id', userId || '');
      
      if (error) throw error;
      return this.transformLeaguesFromDB(data || []);
    } catch (error) {
      console.error('Failed to load leagues:', error);
      return this.loadLeaguesFromLocalStorage();
    }
  }
}

export const databaseService = new DatabaseService();
```

### Component Pattern

```typescript
// EmptyState.tsx
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {Icon && <Icon size={48} className="text-slate-400" />}
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      {description && <p className="text-slate-400 mb-6">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
```

### Context Pattern

```typescript
// LeagueContext.tsx
import { createContext, useContext, ReactNode } from "react";

interface LeagueContextType {
  leagues: League[];
  // ... other properties
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export const useLeague = () => {
  const context = useContext(LeagueContext);
  if (!context) {
    throw new Error("useLeague must be used within a LeagueProvider");
  }
  return context;
};

export const LeagueProvider = ({ children }: { children: ReactNode }) => {
  // Implementation with immutable state updates
};
```

---

## Anti-Patterns to Avoid

### ❌ Wrong Naming

```typescript
// Wrong: Inconsistent naming
export const empty_state = () => { ... }  // Should be EmptyState
const user_id = "123";  // Should be userId
class databaseService { ... }  // Should be DatabaseService
```

### ❌ Wrong State Updates

```typescript
// Wrong: Direct mutation
leagues.push(newLeague);  // Should use setLeagues(prev => [...prev, newLeague])

// Wrong: No error handling
const data = await supabase.from('leagues').select('*');  // Should check error
```

### ❌ Wrong Format

```typescript
// Wrong: No data transformation
const league = { created_at: "2026-01-23", user_id: "123" };  // Should convert to camelCase

// Wrong: Inconsistent date format
const date = 1706006400;  // Should use ISO string "2026-01-23T10:30:00Z"
```

### ❌ Wrong Imports

```typescript
// Wrong: Unused imports (TypeScript strict mode will catch these)
import { unusedFunction } from './utils';  // Remove if not used

// Wrong: Missing type imports
import { User } from '@supabase/supabase-js';  // Should be: import type { User }
```

### ❌ Wrong Error Handling

```typescript
// Wrong: No error handling
const data = await supabase.from('leagues').select('*');

// Wrong: Generic error messages
catch (error) {
  console.error(error);  // Should provide context and user-friendly message
}
```

---

## Testing Requirements (To Be Implemented)

**Test Structure:**
- Unit tests: `tests/unit/services/`, `tests/unit/utils/`
- Integration tests: `tests/integration/`
- E2E tests: `tests/e2e/flows/`

**Test Naming:**
- Files: `{name}.test.ts` or `{name}.spec.ts`
- Describe blocks: Component/function name
- Test cases: `should {expected behavior} when {condition}`

**Mocking:**
- Mock Supabase client in `tests/__mocks__/supabase.ts`
- Use factories for test data
- Clean up after each test

---

## Development Workflow

**Pre-commit:**
- ESLint check (configured in package.json)
- TypeScript type check (`tsc --noEmit`)
- Remove unused imports and variables

**Git:**
- Branch naming: `feature/`, `fix/`, `refactor/`
- Commit messages: Clear, descriptive
- PR: Reference related issues/stories

**Environment:**
- Local: `.env.local` (gitignored)
- Production: Vercel environment variables
- Never commit secrets or API keys

---

## Critical Reminders

1. **Always check Supabase availability** before database operations
2. **Always transform data** between snake_case (DB) and camelCase (app)
3. **Always use immutable state updates** with functional setState
4. **Always handle errors** with try-catch and user-friendly messages
5. **Always use LoadingSpinner** component for loading states
6. **Never mutate state directly** - always use setState with functional updates
7. **Never expose technical errors** to users - use toast.error() with friendly messages
8. **Never use `any` type** - use `unknown` if type is truly unknown
9. **Always remove unused imports** - TypeScript strict mode enforces this
10. **Always follow naming conventions** - Check architecture document for patterns

---

**Last Updated:** 2026-01-23
**Reference:** See `_bmad-output/planning-artifacts/architecture.md` for complete architectural decisions and patterns.
