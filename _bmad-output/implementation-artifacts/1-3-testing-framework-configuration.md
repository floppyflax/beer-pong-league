# Story 1.3: Testing Framework Configuration

Status: done

## Change Log

**2026-01-27** - Testing framework fully configured and validated
- Installed Vitest 4.0.18 with React Testing Library and happy-dom
- Created complete test directory structure (unit/, integration/, e2e/, __mocks__/, setup/)
- Configured vitest.config.ts with happy-dom environment (switched from jsdom for compatibility)
- Created test setup file with jest-dom matchers and automatic cleanup
- Created custom test utilities with BrowserRouter wrapper
- Created Supabase client mock for testing
- Added 4 test scripts to package.json (test, test:ui, test:coverage, test:watch)
- Created and validated sample ELO tests (4/4 passing)
- Installed @vitest/ui for interactive test debugging
- All acceptance criteria satisfied and tests passing

## Story

As a developer,
I want a testing framework configured,
So that I can write and run tests to ensure code quality and prevent regressions.

## Acceptance Criteria

**Given** the project needs testing infrastructure
**When** I set up Vitest and React Testing Library
**Then** Vitest is installed with React Testing Library dependencies
**And** `vitest.config.ts` is created with proper configuration
**And** `tests/` directory structure is created (unit/, integration/, e2e/)
**And** test setup file `tests/setup/vitest.setup.ts` is created
**And** test utilities `tests/setup/test-utils.tsx` are created
**And** Supabase mock is created in `tests/__mocks__/supabase.ts`
**And** test script is added to `package.json` (`npm run test`)
**And** sample test demonstrates the setup works

## Tasks / Subtasks

- [x] Install testing dependencies (AC: Installation)
  - [x] Run: `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
  - [x] Verify installations in package.json

- [x] Create vitest.config.ts (AC: Configuration)
  - [x] Configure test environment (happy-dom - switched from jsdom for better compatibility)
  - [x] Set up path aliases (@/*)
  - [x] Configure coverage settings
  - [x] Define globals for test functions

- [x] Create tests directory structure (AC: Structure)
  - [x] Create tests/unit/ directory
  - [x] Create tests/integration/ directory
  - [x] Create tests/e2e/ directory
  - [x] Create tests/__mocks__/ directory
  - [x] Create tests/setup/ directory

- [x] Create test setup file (AC: Setup)
  - [x] Create tests/setup/vitest.setup.ts
  - [x] Import @testing-library/jest-dom
  - [x] Configure global test utilities
  - [x] Set up cleanup after each test

- [x] Create test utilities (AC: Utilities)
  - [x] Create tests/setup/test-utils.tsx
  - [x] Create custom render function with providers
  - [x] Export all testing-library utilities
  - [x] Add helper functions for common test scenarios

- [x] Create Supabase mock (AC: Mocks)
  - [x] Create tests/__mocks__/supabase.ts
  - [x] Mock Supabase client methods
  - [x] Mock auth methods
  - [x] Mock database methods (select, insert, update, delete)

- [x] Add test scripts to package.json (AC: Scripts)
  - [x] Add "test" script
  - [x] Add "test:ui" script for UI mode
  - [x] Add "test:coverage" script
  - [x] Add "test:watch" script

- [x] Create sample test (AC: Sample)
  - [x] Create tests/unit/utils/elo.test.ts
  - [x] Write tests for ELO calculation
  - [x] Run tests to verify setup works
  - [x] Verify coverage report generation

## Dev Notes

### Installation Commands

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Vitest Configuration

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

**tests/setup/vitest.setup.ts:**
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

**tests/setup/test-utils.tsx:**
```typescript
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Custom render with providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    ),
    ...options
  });
}

export * from '@testing-library/react';
export { customRender as render };
```

**tests/__mocks__/supabase.ts:**
```typescript
import { vi } from 'vitest';

export const mockSupabase = {
  auth: {
    signInWithOtp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn()
  }))
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}));
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest"
  }
}
```

### Sample Test

**tests/unit/utils/elo.test.ts:**
```typescript
import { describe, it, expect } from 'vitest';
import { calculateEloChange } from '@/utils/elo';

describe('ELO Calculation', () => {
  it('should calculate ELO change for equal players', () => {
    const result = calculateEloChange(1500, 1500, true);
    expect(result).toBeCloseTo(16, 0);
  });

  it('should calculate larger ELO change for underdog win', () => {
    const result = calculateEloChange(1400, 1600, true);
    expect(result).toBeGreaterThan(16);
  });

  it('should calculate smaller ELO change for favorite win', () => {
    const result = calculateEloChange(1600, 1400, true);
    expect(result).toBeLessThan(16);
  });

  it('should calculate negative ELO change for loss', () => {
    const result = calculateEloChange(1500, 1500, false);
    expect(result).toBeCloseTo(-16, 0);
  });
});
```

### Project Structure Notes

**Test Directory Structure:**
```
tests/
├── __mocks__/
│   └── supabase.ts
├── setup/
│   ├── vitest.setup.ts
│   └── test-utils.tsx
├── unit/
│   ├── services/
│   ├── utils/
│   └── components/
├── integration/
│   ├── services/
│   └── context/
└── e2e/
    └── flows/
```

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#NFR5: Maintainability]
- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation - Testing Framework]
- [Source: _bmad-output/planning-artifacts/architecture.md#Test Organization]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1: Foundation & Code Quality]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (via Cursor)

### Debug Log References

- **jsdom compatibility issue**: Initial setup with jsdom failed due to parse5 ES Module import error. Resolved by switching to `happy-dom` which provides better compatibility with Vitest 4.x
- **Test signature correction**: Initial ELO tests used incorrect function signature (passing numbers instead of Player arrays). Corrected to match actual `calculateEloChange` implementation

### Completion Notes List

- ✅ **Testing framework fully configured** with Vitest 4.0.18 and React Testing Library
- ✅ **Test environment**: Using `happy-dom` for DOM testing (faster and more compatible than jsdom)
- ✅ **Directory structure** created: `tests/{unit,integration,e2e,__mocks__,setup}`
- ✅ **Test utilities** created with custom render function including BrowserRouter wrapper
- ✅ **Supabase mock** configured with vitest mocks for all database and auth methods
- ✅ **Test scripts** added: `test`, `test:ui`, `test:coverage`, `test:watch`
- ✅ **Sample ELO tests** created and passing (4/4 tests)
- ✅ **Coverage configuration** set up with v8 provider and HTML/JSON/text reporters
- ✅ **Path aliases** configured (`@/*` resolves to `src/*`)
- ✅ **Vitest UI** installed for interactive test debugging

**Additional packages installed:**
- `@vitest/ui` - Interactive test UI for better debugging experience
- `happy-dom` - Fast and compatible DOM implementation for testing

### File List

**Files Created:**
- `vitest.config.ts` - Vitest configuration with happy-dom environment, coverage settings, and path aliases
- `tests/setup/vitest.setup.ts` - Global test setup with jest-dom matchers and cleanup
- `tests/setup/test-utils.tsx` - Custom render function with BrowserRouter provider
- `tests/__mocks__/supabase.ts` - Supabase client mock with auth and database methods
- `tests/unit/utils/elo.test.ts` - Sample ELO calculation tests (4 tests, all passing)

**Directories Created:**
- `tests/unit/` - Unit tests directory
- `tests/unit/utils/` - Utils unit tests
- `tests/integration/` - Integration tests directory
- `tests/e2e/` - End-to-end tests directory
- `tests/__mocks__/` - Mock files directory
- `tests/setup/` - Test setup files directory

**Files Modified:**
- `package.json` - Added test scripts (test, test:ui, test:coverage, test:watch) and dev dependencies
