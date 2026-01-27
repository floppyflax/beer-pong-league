# Story 6.2: CI/CD Pipeline Setup

Status: ready-for-dev

## Story

As a developer,
I want automated quality checks before deployment,
So that only tested, validated code is deployed to production.

## Acceptance Criteria

**Given** the need for CI/CD
**When** GitHub Actions workflow is created
**Then** `.github/workflows/ci.yml` is created
**And** workflow runs on push to main and pull requests
**And** workflow runs ESLint check
**And** workflow runs TypeScript type check (`tsc --noEmit`)
**And** workflow runs test suite (`npm run test`)
**And** workflow runs build verification (`npm run build`)
**And** workflow fails if any check fails
**And** workflow status is visible in GitHub

## Tasks / Subtasks

- [ ] Create GitHub Actions workflow (AC: Workflow created)
  - [ ] Create `.github/workflows/` directory
  - [ ] Create `ci.yml` file
  - [ ] Define workflow triggers
  - [ ] Test workflow structure

- [ ] Configure workflow triggers (AC: Runs on push and PRs)
  - [ ] Trigger on push to main
  - [ ] Trigger on pull requests
  - [ ] Optionally trigger on other branches
  - [ ] Test triggers work

- [ ] Add ESLint check (AC: ESLint check runs)
  - [ ] Add lint job/step
  - [ ] Run `npm run lint`
  - [ ] Fail workflow on errors
  - [ ] Test lint check works

- [ ] Add TypeScript type check (AC: Type check runs)
  - [ ] Add type check step
  - [ ] Run `tsc --noEmit`
  - [ ] Fail workflow on type errors
  - [ ] Test type check works

- [ ] Add test suite (AC: Test suite runs)
  - [ ] Add test step
  - [ ] Run `npm run test`
  - [ ] Fail workflow on test failures
  - [ ] Test suite executes

- [ ] Add build verification (AC: Build runs)
  - [ ] Add build step
  - [ ] Run `npm run build`
  - [ ] Fail workflow on build errors
  - [ ] Test build succeeds

- [ ] Configure failure handling (AC: Fails on any check failure)
  - [ ] Ensure steps fail on error
  - [ ] Set proper exit codes
  - [ ] Test failure scenarios
  - [ ] Verify workflow fails correctly

- [ ] Test workflow in GitHub (AC: Status visible)
  - [ ] Push test commit
  - [ ] Verify workflow runs
  - [ ] Check status badge
  - [ ] Test PR status checks

## Dev Notes

### GitHub Actions Workflow

**.github/workflows/ci.yml:**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  quality-checks:
    name: Quality Checks
    runs-on: ubuntu-latest
    
    steps:
      # Checkout code
      - name: Checkout code
        uses: actions/checkout@v4
      
      # Setup Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      # Install dependencies
      - name: Install dependencies
        run: npm ci
      
      # Run ESLint
      - name: Run ESLint
        run: npm run lint
      
      # Run TypeScript type check
      - name: TypeScript type check
        run: npx tsc --noEmit
      
      # Run tests
      - name: Run tests
        run: npm run test
      
      # Build application
      - name: Build application
        run: npm run build
      
      # Optional: Upload build artifacts
      - name: Upload build artifacts
        if: success()
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/
          retention-days: 7
```

### Package.json Scripts

**Ensure these scripts exist:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

### ESLint Configuration

**Ensure .eslintrc.json exists:**
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["react-refresh"],
  "rules": {
    "react-refresh/only-export-components": [
      "warn",
      { "allowConstantExport": true }
    ]
  }
}
```

### TypeScript Configuration

**Ensure tsconfig.json is strict:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Status Badge

**Add to README.md:**
```markdown
# Beer Pong League

![CI Status](https://github.com/your-username/beer-pong-league/workflows/CI/badge.svg)

...
```

### Branch Protection Rules

**Configure in GitHub:**
1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable "Require status checks to pass before merging"
4. Select "Quality Checks" workflow
5. Enable "Require branches to be up to date"

### Testing Checklist

**Workflow Creation:**
- [ ] `.github/workflows/ci.yml` created
- [ ] Workflow syntax valid
- [ ] Triggers configured correctly
- [ ] Jobs and steps defined

**Quality Checks:**
- [ ] ESLint runs and passes
- [ ] TypeScript type check runs and passes
- [ ] Tests run and pass
- [ ] Build runs and succeeds

**Failure Scenarios:**
- [ ] Lint error → Workflow fails
- [ ] Type error → Workflow fails
- [ ] Test failure → Workflow fails
- [ ] Build error → Workflow fails

**GitHub Integration:**
- [ ] Workflow runs on push
- [ ] Workflow runs on PR
- [ ] Status visible in PR
- [ ] Status badge works in README

### Advanced Features (Optional)

**Caching for faster builds:**
```yaml
- name: Cache node modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

**Test coverage reporting:**
```yaml
- name: Upload coverage reports
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
```

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 5.2: CI/CD Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure - CI/CD Pipeline]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR5: Maintainability]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6: Error Handling & Monitoring]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.2]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Create:**
- .github/workflows/ci.yml
- .eslintrc.json (if not exists)

**Files to Modify:**
- README.md (add CI status badge)
- package.json (verify scripts exist)
- tsconfig.json (ensure strict mode)
