# Story 1.6: Code Splitting and Performance Optimization

Status: ready-for-dev

## Story

As a user,
I want the application to load quickly,
So that I can start using it without long wait times.

## Acceptance Criteria

**Given** the need for performance optimization
**When** I implement code splitting
**Then** route-based code splitting is implemented using React.lazy()
**And** all page components are lazy-loaded
**And** vendor chunks are configured in `vite.config.ts` (react-vendor, supabase-vendor)
**And** Suspense boundaries are added for loading states
**And** initial bundle size is optimized
**And** build output shows chunk sizes within limits (< 500KB per chunk)

## Tasks / Subtasks

- [ ] Implement route-based code splitting (AC: Route splitting)
  - [ ] Convert all page imports to React.lazy()
  - [ ] Add Suspense boundaries around routes
  - [ ] Use LoadingSpinner for fallback UI
  - [ ] Test lazy loading works

- [ ] Configure vendor chunks in vite.config.ts (AC: Vendor chunks)
  - [ ] Create manualChunks configuration
  - [ ] Separate react-vendor chunk (React, React-DOM)
  - [ ] Separate supabase-vendor chunk (@supabase/*)
  - [ ] Create general vendor chunk for other libraries
  - [ ] Test build output shows separate chunks

- [ ] Add Suspense boundaries (AC: Loading states)
  - [ ] Wrap lazy routes with Suspense
  - [ ] Add LoadingSpinner as fallback
  - [ ] Test loading states appear during navigation
  - [ ] Ensure smooth transitions

- [ ] Optimize initial bundle (AC: Bundle size)
  - [ ] Run build analyzer (vite-bundle-visualizer)
  - [ ] Identify large dependencies
  - [ ] Optimize imports (tree-shaking)
  - [ ] Remove unused dependencies
  - [ ] Verify bundle size < 500KB per chunk

- [ ] Test performance (AC: Performance)
  - [ ] Test initial load time (< 2s target)
  - [ ] Test route navigation speed
  - [ ] Test on slow 3G network
  - [ ] Measure Time to Interactive (TTI)
  - [ ] Verify Core Web Vitals

- [ ] Add bundle analyzer (AC: Monitoring)
  - [ ] Install vite-bundle-visualizer
  - [ ] Add analyze script to package.json
  - [ ] Generate bundle report
  - [ ] Document bundle optimization strategy

## Dev Notes

### Code Splitting Implementation

**App.tsx with React.lazy():**
```typescript
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy-loaded pages
const CreateLeague = lazy(() => import('./pages/CreateLeague'));
const CreateTournament = lazy(() => import('./pages/CreateTournament'));
const LeagueDashboard = lazy(() => import('./pages/LeagueDashboard'));
const TournamentDashboard = lazy(() => import('./pages/TournamentDashboard'));
const TournamentJoin = lazy(() => import('./pages/TournamentJoin'));
const TournamentInvite = lazy(() => import('./pages/TournamentInvite'));
const PlayerProfile = lazy(() => import('./pages/PlayerProfile'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const DisplayView = lazy(() => import('./pages/DisplayView'));
const TournamentDisplayView = lazy(() => import('./pages/TournamentDisplayView'));

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Suspense fallback={
          <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <LoadingSpinner size={48} />
          </div>
        }>
          <Routes>
            <Route path="/create-league" element={<CreateLeague />} />
            <Route path="/league/:leagueId" element={<LeagueDashboard />} />
            <Route path="/league/:leagueId/create-tournament" element={<CreateTournament />} />
            <Route path="/tournament/:tournamentId" element={<TournamentDashboard />} />
            <Route path="/tournament/join/:tournamentId" element={<TournamentJoin />} />
            <Route path="/tournament/invite/:tournamentId" element={<TournamentInvite />} />
            <Route path="/player/:playerId" element={<PlayerProfile />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/display/:leagueId" element={<DisplayView />} />
            <Route path="/tournament-display/:tournamentId" element={<TournamentDisplayView />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
```

### Vite Configuration

**vite.config.ts with vendor chunks:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ filename: './dist/stats.html', open: false })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React vendor chunk
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            
            // Supabase vendor chunk
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            
            // Other vendor chunk
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500, // 500KB limit
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Bundle Analyzer

**Install:**
```bash
npm install -D rollup-plugin-visualizer
```

**Package.json scripts:**
```json
{
  "scripts": {
    "analyze": "vite build && open dist/stats.html"
  }
}
```

### Performance Targets

**Target Metrics:**
- Initial Load: < 2s (MVP target: < 3s)
- Time to Interactive: < 3s
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Total Bundle Size: < 1MB
- Per-Chunk Size: < 500KB

### Project Structure Notes

**Lazy Loading Pattern:**
- All page components use React.lazy()
- Suspense boundaries at route level
- LoadingSpinner as consistent fallback
- ErrorBoundary wraps Suspense for error handling

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 4.3: Performance Optimization Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md#NFR3: Performance]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR3.1: Temps de Réponse]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1: Foundation & Code Quality]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Modify:**
- src/App.tsx (convert imports to React.lazy())
- vite.config.ts (add manualChunks configuration)
- package.json (add analyze script, rollup-plugin-visualizer)
