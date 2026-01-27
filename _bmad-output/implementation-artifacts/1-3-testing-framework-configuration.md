# Story 1.3: Testing Framework Configuration

Status: ready-for-dev

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

- [ ] Install testing dependencies (AC: Installation)
  - [ ] Run: `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
  - [ ] Verify installations in package.json

- [ ] Create vitest.config.ts (AC: Configuration)
  - [ ] Configure test environment (jsdom)
  - [ ] Set up path aliases (@/*)
  - [ ] Configure coverage settings
  - [ ] Define globals for test functions

- [ ] Create tests directory structure (AC: Structure)
  - [ ] Create tests/unit/ directory
  - [ ] Create tests/integration/ directory
  - [ ] Create tests/e2e/ directory
  - [ ] Create tests/__mocks__/ directory
  - [ ] Create tests/setup/ directory

- [ ] Create test setup file (AC: Setup)
  - [ ] Create tests/setup/vitest.setup.ts
  - [ ] Import @testing-library/jest-dom
  - [ ] Configure global test utilities
  - [ ] Set up cleanup after each test

- [ ] Create test utilities (AC: Utilities)
  - [ ] Create tests/setup/test-utils.tsx
  - [ ] Create custom render function with providers
  - [ ] Export all testing-library utilities
  - [ ] Add helper functions for common test scenarios

- [ ] Create Supabase mock (AC: Mocks)
  - [ ] Create tests/__mocks__/supabase.ts
  - [ ] Mock Supabase client methods
  - [ ] Mock auth methods
  - [ ] Mock database methods (select, insert, update, delete)

- [ ] Add test scripts to package.json (AC: Scripts)
  - [ ] Add "test" script
  - [ ] Add "test:ui" script for UI mode
  - [ ] Add "test:coverage" script
  - [ ] Add "test:watch" script

- [ ] Create sample test (AC: Sample)
  - [ ] Create tests/unit/utils/elo.test.ts
  - [ ] Write tests for ELO calculation
  - [ ] Run tests to verify setup works
  - [ ] Verify coverage report generation

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

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Create:**
- vitest.config.ts
- tests/setup/vitest.setup.ts
- tests/setup/test-utils.tsx
- tests/__mocks__/supabase.ts
- tests/unit/utils/elo.test.ts (sample test)

**Files to Modify:**
- package.json (add test scripts and dependencies)
