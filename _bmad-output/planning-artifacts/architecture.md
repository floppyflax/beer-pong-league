---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-01-23'
inputDocuments: 
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/product-brief-beer-pong-league-2026-01-23.md
  - _bmad-output/planning-artifacts/research/market-applications-gestion-ligues-sportives-bars-2026-01-23.md
  - docs/index.md
  - docs/project-overview.md
  - docs/architecture.md
  - docs/component-inventory.md
  - docs/data-models.md
  - docs/api-contracts.md
  - docs/development-guide.md
  - docs/deployment-guide.md
  - docs/source-tree-analysis.md
workflowType: 'architecture'
project_name: 'beer-pong-league'
user_name: 'floppyflax'
date: '2026-01-23'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

The PRD defines 16 major functional requirement categories (FR1-FR16) with approximately 40+ detailed sub-requirements:

**MVP Core Requirements (P0):**
- **FR1: Championnat Management** - Creation, QR code generation, participant management
- **FR2: Match Management** - Match recording, automatic ELO calculation, optional anti-cheat
- **FR3: Classements et Stats** - Real-time leaderboards, personal statistics
- **FR4: Authentification et Identité** - Optional email+OTP auth, dual identity system (authenticated + anonymous)
- **FR5: Interface Utilisateur** - "Alcohol-friendly" design, responsive web
- **FR6: Partage et Découverte** - QR code invitations, basic discovery

**Post-MVP Requirements (P1-P3):**
- **FR7: Écran de Projection** - Real-time display view (< 200ms latency)
- **FR8: Partage Social** - Social media integration
- **FR9: Notifications** - Push notifications (mobile), in-app notifications
- **FR10: Gamification** - Badges, achievements, streaks, challenges
- **FR11: Fonctionnalités Sociales Avancées** - Rivalries, friend comparisons, social feed
- **FR12: Ligues** - League creation and management (recurring tournaments)
- **FR13: Application Mobile** - Native iOS + Android apps
- **FR14: Monétisation** - One-time payments, subscription for bars
- **FR15: Analytics et Reporting** - Organizer dashboards, engagement reports
- **FR16: Multi-Platform Synchronisation** - Web ↔ Mobile sync, offline support

**Architectural Implications:**
- **Dual Identity System:** Complex requirement for managing both authenticated users and anonymous players with seamless merge capability
- **Offline-First Architecture:** Critical requirement for 100% offline functionality with localStorage fallback and automatic sync
- **Real-Time Updates:** MVP requires < 500ms for match recording → leaderboard update; Post-MVP requires < 200ms for display view
- **ELO Calculation:** Automatic, server-side calculation required after each match with immediate ranking updates
- **Anti-Cheat System:** Optional confirmation workflow requiring state management for pending/confirmed/rejected matches
- **QR Code Generation:** Client-side or server-side generation needed for tournament invitations
- **Multi-Platform Support:** Future requirement for web + mobile native apps with unified backend

**Non-Functional Requirements:**

**NFR1: Usability**
- **Target:** 90% of users complete first match recording without help
- **Requirements:** Intuitive interface, minimal flow (2-3 clicks max), clear visual feedback
- **Architectural Impact:** UI component design must prioritize simplicity, large touch targets, progressive disclosure

**NFR2: Reliability**
- **Target:** 99%+ uptime, robust error handling
- **Requirements:** Monitoring, alerting, fallback mechanisms, comprehensive error handling
- **Architectural Impact:** Need for health checks, graceful degradation, offline fallback, error recovery strategies

**NFR3: Performance**
- **Target:** < 2s initial load, < 500ms for actions (MVP), < 200ms for real-time updates (post-MVP)
- **Requirements:** Code splitting, lazy loading, optimistic updates, strategic caching, CDN for assets
- **Architectural Impact:** 
  - Optimistic UI updates required for instant feedback
  - Efficient state management to minimize re-renders
  - Asset optimization and CDN strategy
  - Real-time infrastructure (Supabase Realtime) for post-MVP features

**NFR4: Security**
- **Requirements:** GDPR compliance, Row Level Security (RLS), secure authentication, data encryption, payment security (post-MVP)
- **Architectural Impact:**
  - RLS policies on all database tables
  - Secure authentication flow (Supabase Auth)
  - Data encryption at rest and in transit
  - Payment processing security (PCI-DSS compliance for post-MVP)

**NFR5: Maintainability**
- **Requirements:** TypeScript strict mode, ESLint, code reviews, documentation
- **Architectural Impact:** Type safety, code quality standards, documentation requirements

**NFR6: Integration**
- **Requirements:** Multi-platform sync (100% success rate), external integrations (payments, social media, POS systems)
- **Architectural Impact:**
  - Unified backend (Supabase) as single source of truth
  - Conflict resolution strategies for data sync
  - Integration patterns for external services (retry logic, error handling)

**NFR7: Mobile-Specific (Post-MVP)**
- **Requirements:** < 2s app launch, < 500ms actions, store compliance, device features
- **Architectural Impact:**
  - React Native architecture for mobile apps
  - Bundle size optimization
  - Store compliance (App Store, Play Store)
  - Device feature integration (camera, geolocation, push notifications)

**NFR8: SEO and Web Vitrine**
- **Requirements:** SSR for public pages, optimized metadata, structured data, Core Web Vitals
- **Architectural Impact:**
  - Consideration of SSR (Next.js migration or Vite SSR plugin)
  - SEO optimization for public pages
  - Social sharing optimization

**Scale & Complexity:**

**Project Complexity Assessment: Medium to High**

**Complexity Indicators:**
- **Real-Time Features:** Moderate complexity - Real-time leaderboard updates (MVP), display view with < 200ms latency (post-MVP)
- **Multi-Tenancy:** Low complexity - No multi-tenancy required, single Supabase instance
- **Regulatory Compliance:** Medium complexity - GDPR compliance required (Europe), payment security (post-MVP)
- **Integration Complexity:** Medium to High - Multiple external integrations (payments, social media, POS systems post-MVP)
- **User Interaction Complexity:** Medium complexity - Dual identity system, offline/online sync, optimistic updates
- **Data Complexity:** Medium complexity - ELO calculations, ranking algorithms, statistics aggregation

**Primary Technical Domain:** Full-Stack Web Application with Mobile Extension

**Architectural Components Estimated:**
- **Frontend Components:** ~15-20 React components (existing + new custom components from UX spec)
- **Services Layer:** 6 existing services (DatabaseService, AuthService, LocalUserService, AnonymousUserService, IdentityMergeService, MigrationService)
- **State Management:** 3 React Contexts (AuthContext, IdentityContext, LeagueContext)
- **Database Schema:** 7 main tables (users, anonymous_users, leagues, league_players, tournaments, tournament_players, matches) + RLS policies + triggers
- **External Integrations:** Supabase (Auth, Postgres, Realtime), Payment systems (post-MVP), Social media APIs (post-MVP)

**UX Design Implications for Architecture:**

**Component Complexity:**
- **8 Custom Components Required:** MatchRecordingForm, QRCodeDisplay, AnimatedLeaderboard, CelebrationAnimation, TournamentJoinFlow, ScoreInput, PositionChangeIndicator, DisplayViewComponents (post-MVP)
- **Component Architecture:** Atomic → Molecular → Organism pattern recommended
- **Reusability Strategy:** Extract common patterns, create shared hooks, build component variants

**Animation/Transition Requirements:**
- **Celebration Animations:** Confetti, position change animations, achievement celebrations
- **Real-Time Updates:** Smooth leaderboard position changes (< 500ms)
- **State Transitions:** Optimistic updates with visual feedback
- **Architectural Impact:** Need for animation libraries (CSS transitions, potentially Framer Motion), performance optimization for animations

**Real-Time Update Needs:**
- **MVP:** Optimistic updates for match recording → leaderboard (< 500ms)
- **Post-MVP:** Real-time display view updates (< 200ms latency) via Supabase Realtime
- **Architectural Impact:** Supabase Realtime integration, WebSocket connections, efficient state management for real-time data

**Platform-Specific UI Requirements:**
- **Mobile-First:** Touch-optimized (44px+ targets), thumb-zone optimization
- **Bar Environment:** Large buttons, high contrast, readable in dim lighting
- **Display View:** Large typography (24px+), high contrast, distance viewing optimization
- **Architectural Impact:** Responsive design system, breakpoint strategy, component variants for different contexts

**Accessibility Standards:**
- **WCAG 2.1 Level AA:** Required compliance
- **Requirements:** ARIA labels, keyboard navigation, screen reader support, color contrast (4.5:1), reduced motion support
- **Architectural Impact:** Accessibility built into component architecture, semantic HTML, ARIA patterns

**Responsive Design Breakpoints:**
- **Mobile:** 320px - 767px (primary use case)
- **Tablet:** 768px - 1023px
- **Desktop:** 1024px+
- **Display View:** 1920px+ (custom breakpoints)
- **Architectural Impact:** Mobile-first CSS approach, Tailwind breakpoint system, responsive component variants

**Offline Capability Requirements:**
- **100% Offline Functionality:** Core features must work without internet
- **localStorage Fallback:** All data operations must support localStorage
- **Automatic Sync:** Sync on reconnection with conflict resolution
- **Architectural Impact:** Dual storage strategy (Supabase + localStorage), sync service, conflict resolution logic

**Performance Expectations:**
- **Load Times:** < 2s initial load, < 3s on 3G
- **Interaction Response:** < 100ms for button presses, < 500ms for match recording
- **Animation Performance:** 60fps animations
- **Architectural Impact:** Code splitting, lazy loading, asset optimization, efficient rendering, performance monitoring

### Technical Constraints & Dependencies

**Existing Technology Stack (Fixed):**
- **Frontend:** React 18, TypeScript 5, Vite 5, Tailwind CSS
- **Backend:** Supabase (Auth, Postgres, Realtime)
- **State Management:** React Context (no Redux/MobX)
- **Routing:** React Router 6
- **Hosting:** Vercel (SPA deployment)
- **Icons:** Lucide React
- **Toasts:** react-hot-toast

**Architectural Constraints:**
- **No Custom REST API:** All backend communication via Supabase client
- **BaaS Architecture:** Supabase provides Auth, Database, and Realtime - no custom backend server
- **SPA Deployment:** Vercel static hosting - no server-side rendering initially (SSR considered for SEO post-MVP)
- **Offline-First Requirement:** Must support 100% offline functionality with localStorage
- **Dual Identity System:** Must handle both authenticated and anonymous users seamlessly

**External Dependencies:**
- **Supabase:** Critical dependency for Auth, Database, and Realtime
- **Vercel:** Hosting platform (can be changed but requires migration)
- **Payment Systems (Post-MVP):** Stripe, Apple IAP, Google Play Billing
- **Social Media APIs (Post-MVP):** Instagram, Facebook, Twitter for sharing
- **QR Code Library:** Required for QR code generation

**Data Model Constraints:**
- **PostgreSQL Schema:** Fixed schema in `supabase/migrations/` with 7 main tables
- **RLS Policies:** Required on all tables for security
- **Dual Identity:** Complex relationship between `users` and `anonymous_users` tables
- **ELO Calculation:** Must be server-side or client-side with consistency guarantees

**Performance Constraints:**
- **Network:** Bar environments may have unreliable WiFi
- **Device:** Mobile devices with varying performance capabilities
- **Battery:** Mobile app must be battery-efficient (post-MVP)
- **Bundle Size:** Must optimize for mobile network conditions

**Compliance Constraints:**
- **GDPR:** European data protection regulations
- **Payment Security:** PCI-DSS compliance for in-app purchases (post-MVP)
- **Store Compliance:** App Store and Play Store guidelines (post-MVP)
- **Accessibility:** WCAG 2.1 AA compliance required

### Cross-Cutting Concerns Identified

**1. State Management & Synchronization**

**Concern:** Managing application state across multiple contexts (Auth, Identity, League) with synchronization between localStorage and Supabase.

**Architectural Impact:**
- React Context pattern for global state
- Service layer abstraction for data operations
- Sync service for localStorage ↔ Supabase synchronization
- Conflict resolution strategy for concurrent updates
- Optimistic updates for instant feedback

**Components Affected:**
- All React Contexts (AuthContext, IdentityContext, LeagueContext)
- All Services (DatabaseService, LocalUserService, AnonymousUserService)
- All Components that display or modify data

**2. Offline/Online Architecture**

**Concern:** Seamless operation in both online and offline modes with automatic synchronization and conflict resolution.

**Architectural Impact:**
- Dual storage strategy (Supabase + localStorage)
- Network detection and state management
- Queue system for offline operations
- Automatic sync on reconnection
- Conflict resolution logic (last-write-wins or merge strategies)

**Components Affected:**
- DatabaseService (must support both Supabase and localStorage)
- LeagueContext (manages offline/online state)
- All data mutation operations

**3. Dual Identity Management**

**Concern:** Handling both authenticated users and anonymous users with seamless merge capability and no data loss.

**Architectural Impact:**
- IdentityMergeService for merging anonymous → authenticated
- Device fingerprinting for anonymous user identification
- Data migration logic during merge
- UI flows for promoting guest to account
- Consistent identity handling across all features

**Components Affected:**
- IdentityContext (manages current identity)
- AnonymousUserService (manages anonymous users)
- IdentityMergeService (handles merge operations)
- All components that create or reference user data

**4. Real-Time Updates & Optimistic UI**

**Concern:** Providing instant feedback (< 500ms) while ensuring data consistency and handling server confirmations.

**Architectural Impact:**
- Optimistic update pattern for immediate UI feedback
- Background confirmation with rollback capability
- State management for pending/confirmed states
- Error handling and retry logic
- Real-time subscriptions (Supabase Realtime for post-MVP)

**Components Affected:**
- MatchRecordingForm (optimistic leaderboard update)
- AnimatedLeaderboard (real-time position changes)
- LeagueContext (manages optimistic state)
- All components displaying dynamic data

**5. Performance Optimization**

**Concern:** Meeting strict performance targets (< 2s load, < 500ms actions) while maintaining rich UX with animations.

**Architectural Impact:**
- Code splitting by route and feature
- Lazy loading for non-critical components
- Asset optimization (images, fonts)
- Efficient re-rendering (React.memo, useMemo)
- Animation performance (CSS transitions, requestAnimationFrame)
- CDN strategy for static assets

**Components Affected:**
- All page components (route-based code splitting)
- Heavy components (lazy loading)
- Animation components (performance optimization)
- Asset loading strategy

**6. Security & Data Protection**

**Concern:** Ensuring GDPR compliance, secure authentication, and data protection across all operations.

**Architectural Impact:**
- Row Level Security (RLS) policies on all tables
- Secure authentication flow (Supabase Auth)
- Data encryption (at rest and in transit via Supabase)
- Consent management for GDPR
- Data deletion capabilities
- Audit logging for sensitive operations

**Components Affected:**
- All database operations (RLS enforcement)
- AuthService (secure authentication)
- User data management (GDPR compliance)
- All services accessing user data

**7. Error Handling & Resilience**

**Concern:** Graceful error handling, user-friendly error messages, and system resilience in bar environments.

**Architectural Impact:**
- Comprehensive error handling in all services
- User-friendly error messages
- Retry logic for network failures
- Offline fallback mechanisms
- Error logging and monitoring
- Graceful degradation strategies

**Components Affected:**
- All Services (error handling)
- All UI Components (error display)
- Network layer (retry logic)
- Error boundary components

**8. Multi-Platform Synchronization (Post-MVP)**

**Concern:** Ensuring consistent data across web and mobile platforms with conflict resolution.

**Architectural Impact:**
- Unified backend (Supabase) as single source of truth
- Shared data models and types
- Conflict resolution strategies
- Sync service for multi-platform
- Offline support on web, online-only on mobile (per requirements)

**Components Affected:**
- All data operations (must work across platforms)
- Sync services
- Mobile app architecture (React Native)
- Shared code strategy (monorepo)

**9. Accessibility Compliance**

**Concern:** Meeting WCAG 2.1 AA standards for all users, including those with disabilities.

**Architectural Impact:**
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Reduced motion support

**Components Affected:**
- All UI Components (accessibility built-in)
- Navigation components (keyboard support)
- Form components (ARIA labels)
- Interactive elements (focus management)

**10. Component Architecture & Reusability**

**Concern:** Building maintainable, reusable components that support the UX requirements while maintaining consistency.

**Architectural Impact:**
- Component hierarchy (Atomic → Molecular → Organism)
- Shared component library
- Design token system (Tailwind + custom tokens)
- Component variants for different contexts
- Documentation and usage guidelines

**Components Affected:**
- All custom components (8 new components from UX spec)
- Existing components (refactoring for consistency)
- Component library structure
- Design system implementation

## Starter Template Evaluation

### Primary Technology Domain

**Web Application (SPA)** - Single Page Application with React frontend and Supabase backend, deployed as static site on Vercel.

### Current Setup Analysis

The project is already initialized with **Vite + React + TypeScript**, which is an excellent foundation choice for this project type.

**Initialization Command Used:**
```bash
npm create vite@latest beer-pong-league -- --template react-ts
```

### Starter Options Considered

**1. Current Setup: Vite + React + TypeScript (Selected)**

**Rationale for Selection:**
- ✅ **Fast Development Experience**: Vite provides instant HMR and fast builds
- ✅ **Modern Stack**: React 18 with TypeScript 5 provides type safety and modern React features
- ✅ **Production Ready**: Vite's optimized build output meets performance requirements
- ✅ **Flexibility**: Allows custom configuration for offline-first architecture
- ✅ **Supabase Integration**: Works seamlessly with Supabase client library
- ✅ **Vercel Deployment**: Optimized for static SPA deployment on Vercel

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript 5.2.2 with strict mode enabled
- ES2020 target with ESNext modules
- React 18.2.0 with JSX transform
- Path aliases configured (`@/*` → `src/*`)

**Styling Solution:**
- Tailwind CSS 3.4.1 with custom theme extensions
- PostCSS with Autoprefixer
- Custom color palette (primary: amber, secondary: slate, accent: red)
- Responsive design system built-in

**Build Tooling:**
- Vite 5.1.4 for fast builds and HMR
- TypeScript compilation with `tsc` before build
- Optimized production builds with code splitting
- Asset optimization and minification

**Code Organization:**
- Modular structure: `components/`, `services/`, `context/`, `hooks/`, `pages/`, `types/`, `utils/`
- Path aliases for clean imports (`@/components/...`)
- Separation of concerns: services for business logic, contexts for state, components for UI

**Development Experience:**
- Fast HMR (Hot Module Replacement)
- ESLint configured with React hooks and TypeScript rules
- TypeScript strict mode for type safety
- Development server with automatic reload

**2. Alternative Considered: Next.js**

**Why Not Selected:**
- ❌ SSR not required for MVP (SPA sufficient)
- ❌ Adds complexity without immediate benefit
- ❌ Vercel static export works better with Vite for SPA
- ❌ Current Vite setup already meets all requirements
- ✅ SSR can be added later if needed for SEO (post-MVP)

**3. Alternative Considered: Create React App (CRA)**

**Why Not Selected:**
- ❌ Deprecated by React team
- ❌ Slower build times than Vite
- ❌ Less flexible configuration
- ❌ No longer maintained actively

### Recommended Enhancements

While the current Vite + React + TypeScript setup is excellent, the following enhancements are recommended to fully meet project requirements:

**1. PWA Support (Critical for Offline-First)**

**Package:** `vite-plugin-pwa`

**Rationale:**
- Required for 100% offline functionality (FR requirement)
- Enables service worker for asset caching
- Allows app installation on mobile devices
- Provides offline fallback for Supabase operations

**Implementation:**
```bash
npm install -D vite-plugin-pwa
```

**Configuration:**
- Service worker with Workbox
- Asset caching strategy (stale-while-revalidate)
- Offline page fallback
- Update prompts for new versions

**2. Testing Framework (Required for Maintainability)**

**Package:** `vitest` + `@testing-library/react`

**Rationale:**
- NFR5 requires testing infrastructure
- Ensures code quality and prevents regressions
- Supports TDD workflow for new features

**Implementation:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Configuration:**
- Unit tests for services and utilities
- Component tests for UI components
- Integration tests for critical flows
- Test coverage reporting

**3. Build Optimizations**

**Enhancements:**
- Route-based code splitting (already supported by Vite)
- Lazy loading for heavy components
- Asset optimization (images, fonts)
- Bundle analysis tools

**4. Development Tools**

**Recommended:**
- Prettier for code formatting (if not already configured)
- Husky for git hooks (pre-commit linting)
- Bundle analyzer for optimization insights

### Architectural Decisions Established

**Build System:**
- ✅ Vite for fast development and optimized production builds
- ✅ TypeScript compilation before build for type checking
- ✅ Path aliases for clean imports

**Project Structure:**
- ✅ Feature-based organization (components, services, contexts)
- ✅ Separation of concerns (UI, business logic, state management)
- ✅ Type definitions centralized in `types/`

**State Management:**
- ✅ React Context API (no Redux/MobX needed)
- ✅ Service layer for data operations
- ✅ LocalStorage for offline-first support

**Styling:**
- ✅ Tailwind CSS utility-first approach
- ✅ Custom design tokens (colors, spacing)
- ✅ Responsive breakpoints configured

**Routing:**
- ✅ React Router 6 for client-side routing
- ✅ Route-based code organization

**Backend Integration:**
- ✅ Supabase client for all backend operations
- ✅ No custom REST API required
- ✅ Real-time subscriptions via Supabase Realtime (post-MVP)

### Next Steps

**Implementation Priority:**

1. **P0 (Critical):** Add `vite-plugin-pwa` for offline-first support
2. **P0 (Critical):** Configure Vitest + React Testing Library for testing
3. **P1 (High):** Implement route-based code splitting
4. **P2 (Medium):** Add bundle analyzer and optimization tools

**Note:** The current Vite + React + TypeScript setup provides an excellent foundation. The recommended enhancements address specific project requirements (offline-first, testing, performance) without requiring a starter template change.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- ✅ Data validation strategy (client-side + server-side hybrid)
- ✅ Offline/online synchronization strategy (last-write-wins with conflict detection)
- ✅ Error handling and monitoring approach (comprehensive error boundaries + Sentry)
- ✅ Performance optimization strategy (route-based + component lazy loading)

**Important Decisions (Shape Architecture):**
- ✅ Code splitting strategy (route-based with vendor chunks)
- ✅ Caching strategy (localStorage + Supabase cache with TTL)
- ✅ CI/CD pipeline approach (GitHub Actions + Vercel auto-deploy)
- ✅ Environment configuration management (Vercel env vars + .env.local)

**Deferred Decisions (Post-MVP):**
- Advanced conflict resolution (merge strategies) - Current last-write-wins sufficient for MVP
- Custom monitoring dashboard - Supabase logs + Sentry sufficient for MVP
- Advanced caching strategies (Redis, CDN) - Not needed until scale requires it
- Multi-region deployment - Single region (Europe) sufficient for MVP

### Data Architecture

#### Decision 1.1: Data Validation Strategy

**Decision:** Hybrid validation approach (client-side + server-side)

**Rationale:**
- **Client-side validation (Zod 4.3.6):** Provides immediate feedback, reduces server load, improves UX
- **Server-side validation (RLS + PostgreSQL triggers):** Ensures data integrity, security, prevents malicious data
- **Type safety:** TypeScript types + Zod schemas ensure compile-time and runtime safety

**Implementation:**
- **Client-side:** Zod 4.3.6 for form validation and API response validation
- **Server-side:** PostgreSQL CHECK constraints + RLS policies (already implemented)
- **Type generation:** Supabase types + Zod schemas for shared validation

**Affects:**
- All form components (MatchRecordingForm, TournamentJoinFlow, etc.)
- All service layer methods (DatabaseService, AuthService, etc.)
- API response handling

**Version:** Zod 4.3.6 (latest stable, production-ready)

#### Decision 1.2: Caching Strategy

**Decision:** Multi-layer caching with localStorage + Supabase cache

**Rationale:**
- **localStorage:** Primary cache for offline-first requirement (100% offline functionality)
- **Supabase cache:** Automatic HTTP caching for frequently accessed data
- **TTL strategy:** Cache invalidation on data mutations, manual refresh option

**Implementation:**
- **Layer 1:** localStorage for leagues, tournaments, matches (already implemented)
- **Layer 2:** Supabase client automatic HTTP caching
- **Layer 3:** React Context state (in-memory cache)
- **Invalidation:** On create/update/delete operations, clear relevant cache entries

**Affects:**
- DatabaseService (cache management)
- LeagueContext (state synchronization)
- All data fetching operations

#### Decision 1.3: Offline/Online Synchronization Strategy

**Decision:** Last-write-wins with conflict detection and user notification

**Rationale:**
- **Simplicity:** Last-write-wins is sufficient for MVP (no complex merge logic needed)
- **Conflict detection:** Timestamp-based detection to notify users of potential data loss
- **User control:** Manual merge option for critical conflicts (post-MVP enhancement)

**Implementation:**
- **Sync queue:** Queue offline operations, retry on reconnection
- **Conflict detection:** Compare `updated_at` timestamps, notify user if conflict detected
- **Resolution:** Last-write-wins (newest timestamp wins), log conflicts for review
- **Future enhancement:** Merge strategies for post-MVP (field-level merging, user choice)

**Affects:**
- DatabaseService (sync logic)
- LeagueContext (offline queue management)
- MigrationService (conflict resolution)

### Authentication & Security

#### Decision 2.1: Authentication Method

**Decision:** Supabase Auth with Email + OTP (already implemented)

**Rationale:**
- **Passwordless:** Better UX, no password management, more secure
- **Supabase integration:** Seamless integration with existing backend
- **Dual identity:** Supports both authenticated and anonymous users

**Version:** Supabase Auth (current implementation)

**Affects:**
- AuthService (already implemented)
- AuthContext (already implemented)
- All protected routes

#### Decision 2.2: Security Middleware & Rate Limiting

**Decision:** Supabase RLS policies + client-side rate limiting

**Rationale:**
- **RLS policies:** Already implemented, provides server-side security
- **Client-side rate limiting:** Prevents abuse, reduces server load
- **Future:** Server-side rate limiting via Supabase Edge Functions (post-MVP)

**Implementation:**
- **RLS:** All tables protected (already implemented)
- **Client-side:** Rate limiting for API calls (debounce/throttle)
- **Device fingerprinting:** Already implemented for anonymous users

**Affects:**
- All service methods (rate limiting)
- AnonymousUserService (device fingerprinting)
- DatabaseService (RLS enforcement)

### API & Communication Patterns

#### Decision 3.1: API Design Pattern

**Decision:** Supabase client pattern (no custom REST API)

**Rationale:**
- **BaaS architecture:** Supabase provides all backend functionality
- **No custom endpoints:** Reduces complexity, maintenance, deployment overhead
- **Type safety:** Supabase TypeScript client provides type-safe API calls

**Implementation:**
- **Service layer:** Abstracts Supabase client calls
- **Error handling:** Standardized error types and handling
- **Real-time:** Supabase Realtime for post-MVP display view

**Affects:**
- All services (DatabaseService, AuthService, etc.)
- API contracts (already documented)

#### Decision 3.2: Error Handling Standards

**Decision:** Comprehensive error boundaries + structured error handling

**Rationale:**
- **User experience:** Graceful error handling with user-friendly messages
- **Developer experience:** Structured errors for debugging
- **Monitoring:** Error tracking via Sentry for production issues

**Implementation:**
- **Error boundaries:** React error boundaries for component-level error handling
- **Service layer:** Try-catch with structured error objects
- **UI feedback:** react-hot-toast for user notifications
- **Monitoring:** Sentry integration for error tracking

**Error Types:**
- **Network errors:** Retry logic with exponential backoff
- **Validation errors:** User-friendly messages with field-level feedback
- **Authentication errors:** Redirect to login with context
- **Unknown errors:** Generic message + Sentry logging

**Affects:**
- All components (error boundaries)
- All services (error handling)
- App.tsx (root error boundary)

### Frontend Architecture

#### Decision 4.1: State Management Approach

**Decision:** React Context API (already implemented)

**Rationale:**
- **Simplicity:** No need for Redux/MobX complexity
- **Sufficient:** Context API handles all state management needs
- **Performance:** Optimized with useMemo/useCallback where needed

**Implementation:**
- **Contexts:** AuthContext, IdentityContext, LeagueContext (already implemented)
- **Hooks:** Custom hooks (useAuth, useIdentity) for context consumption
- **Local state:** useState for component-specific state

**Affects:**
- All components (state consumption)
- Context providers (state management)

#### Decision 4.2: Component Architecture Pattern

**Decision:** Atomic Design with feature-based organization

**Rationale:**
- **Reusability:** Atomic components (atoms, molecules, organisms)
- **Maintainability:** Feature-based organization for complex components
- **Consistency:** Design system approach ensures UI consistency

**Implementation:**
- **Atoms:** Basic UI elements (Button, Input, Badge)
- **Molecules:** Composite components (FormField, Card, Modal)
- **Organisms:** Complex components (MatchRecordingForm, Leaderboard)
- **Pages:** Route-level components (LeagueDashboard, TournamentDashboard)

**Affects:**
- Component structure (already partially implemented)
- Design system (Tailwind + custom components)

#### Decision 4.3: Performance Optimization Strategy

**Decision:** Route-based code splitting + component lazy loading

**Rationale:**
- **Initial load:** Route-based splitting reduces initial bundle size
- **Component loading:** Lazy loading for heavy components (animations, charts)
- **Performance targets:** Meets < 2s load time requirement

**Implementation:**
- **Route splitting:** React.lazy() for all page components
- **Vendor chunks:** Manual chunks for React, Supabase, heavy libraries
- **Component lazy loading:** Heavy components (AnimatedLeaderboard, DisplayView)
- **Image optimization:** Lazy loading for images, WebP format

**Vite Configuration:**
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes('node_modules')) {
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('@supabase')) {
            return 'supabase-vendor';
          }
          return 'vendor';
        }
      },
    },
  },
}
```

**Affects:**
- App.tsx (route definitions)
- Heavy components (lazy loading)
- vite.config.ts (build configuration)

### Infrastructure & Deployment

#### Decision 5.1: CI/CD Pipeline Approach

**Decision:** GitHub Actions + Vercel auto-deploy

**Rationale:**
- **Vercel integration:** Automatic deployments on git push (already configured)
- **GitHub Actions:** Pre-deployment checks (linting, tests, type checking)
- **Simplicity:** No complex pipeline needed for MVP

**Implementation:**
- **Pre-commit:** Husky hooks for linting and formatting
- **GitHub Actions:** 
  - Lint check
  - Type check (tsc --noEmit)
  - Test suite (when implemented)
  - Build verification
- **Vercel:** Auto-deploy on merge to main branch

**Affects:**
- .github/workflows/ci.yml (to be created)
- package.json (scripts)
- .husky/ (pre-commit hooks)

#### Decision 5.2: Environment Configuration Management

**Decision:** Vercel environment variables + .env.local for development

**Rationale:**
- **Security:** Sensitive keys stored in Vercel, not in code
- **Flexibility:** Different configs for dev/staging/production
- **Developer experience:** .env.local for local development

**Implementation:**
- **Production:** Vercel environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLIC_KEY, SENTRY_DSN)
- **Development:** .env.local file (gitignored)
- **Type safety:** Environment variable validation with Zod
- **Note:** Using new Supabase publishable key system (format `sb_publishable_xxx`), old anon key is deprecated

**Affects:**
- Environment configuration
- Build process
- Deployment configuration

#### Decision 5.3: Monitoring & Logging Strategy

**Decision:** Supabase logs + Sentry for error monitoring

**Rationale:**
- **Supabase logs:** Built-in logging for database operations, auth events
- **Sentry:** Comprehensive error tracking, performance monitoring, user feedback
- **Cost-effective:** Free tier sufficient for MVP, scales with growth

**Implementation:**
- **Sentry React SDK:** Error boundaries, exception tracking, performance monitoring
- **Vercel integration:** Automatic source map upload, release tracking
- **Logging levels:**
  - **Development:** Console logging
  - **Production:** Sentry + Supabase logs only

**Version:** @sentry/react (latest stable)

**Affects:**
- Error boundaries (Sentry integration)
- Service layer (error logging)
- Performance monitoring (Sentry transactions)

### Decision Impact Analysis

**Implementation Sequence:**

1. **P0 (Critical - Block MVP):**
   - Add Zod validation to forms and services
   - Implement error boundaries with Sentry
   - Configure route-based code splitting
   - Set up GitHub Actions CI pipeline

2. **P1 (High - Performance):**
   - Implement component lazy loading
   - Configure vendor chunks in Vite
   - Add image optimization
   - Set up caching strategy

3. **P2 (Medium - Developer Experience):**
   - Add Husky pre-commit hooks
   - Environment variable validation
   - Enhanced error handling patterns
   - Documentation updates

**Cross-Component Dependencies:**

- **Validation → Services:** Zod schemas must be defined before service validation
- **Error Handling → Components:** Error boundaries must be set up before component error handling
- **Code Splitting → Routes:** Route definitions must use React.lazy() before build optimization
- **Monitoring → Error Handling:** Sentry must be initialized before error boundaries
- **CI/CD → Testing:** Test framework must be set up before CI pipeline

**Technology Versions:**
- **Zod:** 4.3.6 (latest stable)
- **Sentry React:** Latest stable (verify on implementation)
- **Vite:** 5.1.4 (current)
- **React:** 18.2.0 (current)
- **TypeScript:** 5.2.2 (current)

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
15+ areas where AI agents could make different choices, potentially causing conflicts, inconsistencies, or integration issues.

### Naming Patterns

#### Database Naming Conventions

**Tables:** Use `snake_case`, plural form
- ✅ Correct: `leagues`, `league_players`, `tournaments`, `matches`
- ❌ Wrong: `Leagues`, `leaguePlayers`, `League`, `user`

**Columns:** Use `snake_case`
- ✅ Correct: `created_at`, `user_id`, `league_id`, `is_finished`
- ❌ Wrong: `createdAt`, `userId`, `isFinished`

**Foreign Keys:** Use `{referenced_table}_id` pattern
- ✅ Correct: `league_id`, `tournament_id`, `user_id`, `anonymous_user_id`
- ❌ Wrong: `leagueId`, `fk_league`, `leagueRef`

**Indexes:** Use descriptive names with table prefix
- ✅ Correct: `idx_leagues_creator`, `idx_matches_league_id`
- ❌ Wrong: `leagues_index`, `index1`

**Constraints:** Use descriptive names
- ✅ Correct: `check_league_type`, `fk_league_players_league`
- ❌ Wrong: `constraint1`, `fk1`

**Enforcement:** All database operations MUST use snake_case for table and column names when interacting with Supabase.

#### API Naming Conventions

**Supabase Queries:** Use snake_case matching database schema
- ✅ Correct: `.from('leagues')`, `.select('created_at')`, `.eq('league_id', id)`
- ❌ Wrong: `.from('Leagues')`, `.select('createdAt')`

**Route Parameters:** Use camelCase in React Router
- ✅ Correct: `/league/:leagueId`, `/tournament/:tournamentId`
- ❌ Wrong: `/league/:league_id`, `/tournament/:tournament_id`

**Query Parameters:** Use camelCase
- ✅ Correct: `?leagueId=123`, `?tournamentId=456`
- ❌ Wrong: `?league_id=123`

**Local Storage Keys:** Use `bpl_` prefix with snake_case
- ✅ Correct: `bpl_leagues`, `bpl_current_league_id`, `bpl_device_fingerprint`
- ❌ Wrong: `leagues`, `currentLeagueId`, `BPL_LEAGUES`

#### Code Naming Conventions

**Components:** Use PascalCase
- ✅ Correct: `EmptyState`, `AuthModal`, `LeagueDashboard`, `TournamentDisplayView`
- ❌ Wrong: `emptyState`, `auth-modal`, `league-dashboard`

**Component Props Interfaces:** Use `{ComponentName}Props` pattern
- ✅ Correct: `EmptyStateProps`, `AuthModalProps`, `LeagueDashboardProps`
- ❌ Wrong: `EmptyStatePropsType`, `IEmptyStateProps`, `emptyStateProps`

**Component Files:** Use PascalCase matching component name
- ✅ Correct: `EmptyState.tsx`, `AuthModal.tsx`, `LeagueDashboard.tsx`
- ❌ Wrong: `empty-state.tsx`, `authModal.tsx`, `league-dashboard.tsx`

**Pages:** Use PascalCase
- ✅ Correct: `CreateLeague.tsx`, `TournamentDashboard.tsx`, `UserProfile.tsx`
- ❌ Wrong: `create-league.tsx`, `tournamentDashboard.tsx`

**Services:** Use PascalCase for classes, camelCase for instances
- ✅ Correct: `class DatabaseService`, `export const databaseService = new DatabaseService()`
- ✅ Correct: `class AuthService`, `export const authService = new AuthService()`
- ❌ Wrong: `class databaseService`, `export const DatabaseService = ...`

**Hooks:** Use camelCase with `use` prefix
- ✅ Correct: `useAuth`, `useIdentity`, `useLeague`
- ❌ Wrong: `UseAuth`, `use_auth`, `getAuth`

**Hook Files:** Use camelCase matching hook name
- ✅ Correct: `useAuth.ts`, `useIdentity.ts`
- ❌ Wrong: `UseAuth.ts`, `use-auth.ts`

**Types/Interfaces:** Use PascalCase
- ✅ Correct: `Player`, `League`, `Tournament`, `Match`, `Team`
- ❌ Wrong: `player`, `league`, `IPlayer`, `TLeague`

**Type Files:** Use camelCase for utility types, PascalCase for main types
- ✅ Correct: `types.ts` (main types), `supabase.ts` (generated types)
- ❌ Wrong: `Types.ts`, `types.d.ts`

**Variables:** Use camelCase
- ✅ Correct: `userId`, `leagueId`, `currentLeague`, `isLoading`
- ❌ Wrong: `user_id`, `UserId`, `current_league`, `is_loading`

**Functions:** Use camelCase with verb prefix
- ✅ Correct: `createLeague`, `loadLeagues`, `calculateEloChange`, `getDeviceFingerprint`
- ❌ Wrong: `CreateLeague`, `load_leagues`, `CalculateElo`, `get_device_fingerprint`

**Constants:** Use UPPER_SNAKE_CASE
- ✅ Correct: `MIGRATION_FLAG_KEY`, `STORAGE_KEY`
- ❌ Wrong: `migrationFlagKey`, `StorageKey`

**Enforcement:** All code MUST follow these naming conventions. ESLint rules should enforce these patterns.

### Structure Patterns

#### Project Organization

**Directory Structure:**
```
src/
├── components/          # Reusable UI components
│   └── layout/          # Layout components (MenuDrawer, etc.)
├── pages/               # Route-level page components
├── services/            # Business logic and data access
├── context/             # React Context providers
├── hooks/               # Custom React hooks
├── lib/                 # Third-party library configurations
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── App.tsx              # Root component
```

**Component Organization:**
- ✅ Organize by type (components/, pages/, services/)
- ✅ Co-locate related files (component + its types in same directory)
- ❌ Don't mix feature-based and type-based organization
- ❌ Don't create deep nesting (max 2-3 levels)

**Test Organization:**
- Tests should be in `tests/` directory (to be created)
- Structure: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- ✅ Correct: `tests/unit/services/DatabaseService.test.ts`
- ❌ Wrong: `src/services/DatabaseService.test.ts` (co-located)

**File Naming:**
- Components/Pages: `PascalCase.tsx`
- Services/Utils: `camelCase.ts`
- Types: `camelCase.ts` or `types.ts`
- Config: `kebab-case.config.js` (e.g., `vite.config.ts`, `tailwind.config.js`)

#### File Structure Patterns

**Component Files:**
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
  // Implementation
};
```

**Service Files:**
```typescript
// DatabaseService.ts
import { supabase } from '../lib/supabase';
import type { League, Tournament } from '../types';

class DatabaseService {
  // Private methods
  private isSupabaseAvailable(): boolean {
    // Implementation
  }

  // Public methods
  async loadLeagues(): Promise<League[]> {
    // Implementation
  }
}

export const databaseService = new DatabaseService();
```

**Context Files:**
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
  // Implementation
};
```

**Enforcement:** All files MUST follow this structure pattern. New files should match existing patterns.

### Format Patterns

#### API Response Formats

**Supabase Responses:** Use Supabase client response format directly
- ✅ Correct: `const { data, error } = await supabase.from('leagues').select('*')`
- ❌ Wrong: Wrapping in custom response format

**Error Handling:** Check `error` property, throw if needed
- ✅ Correct:
```typescript
const { data, error } = await supabase.from('leagues').select('*');
if (error) throw error;
return data;
```

**Success Response:** Return data directly (no wrapper)
- ✅ Correct: `return leagues;` (array of League objects)
- ❌ Wrong: `return { success: true, data: leagues };`

#### Data Exchange Formats

**JSON Field Naming:**
- **Database → App:** Convert snake_case to camelCase
  - ✅ Correct: `created_at` → `createdAt`, `user_id` → `userId`
- **App → Database:** Convert camelCase to snake_case
  - ✅ Correct: `createdAt` → `created_at`, `userId` → `user_id`

**Date Format:** Use ISO 8601 strings
- ✅ Correct: `"2026-01-23T10:30:00Z"`, `"2026-01-23"`
- ❌ Wrong: Unix timestamps, custom formats

**Boolean Values:** Use `true`/`false` (not `1`/`0`)
- ✅ Correct: `isFinished: true`, `anti_cheat_enabled: false`
- ❌ Wrong: `isFinished: 1`, `anti_cheat_enabled: 0`

**Null Handling:** Use `null` (not `undefined`) for optional database fields
- ✅ Correct: `creator_user_id: string | null`
- ❌ Wrong: `creator_user_id?: string` (for database fields)

**Arrays:** Always use arrays, never single objects for collections
- ✅ Correct: `players: Player[]`, `matches: Match[]`
- ❌ Wrong: `player: Player` (when multiple expected)

**Enforcement:** All data transformations MUST follow these format rules.

### Communication Patterns

#### Event System Patterns

**Not Applicable:** No custom event system currently. Supabase Realtime used for post-MVP features.

**Future Pattern (Post-MVP):**
- Event naming: `snake_case` with entity and action
- ✅ Correct: `match.recorded`, `player.joined`, `tournament.finished`
- ❌ Wrong: `MatchRecorded`, `playerJoined`, `TOURNAMENT_FINISHED`

#### State Management Patterns

**Context State Updates:** Use immutable updates
- ✅ Correct:
```typescript
setLeagues(prevLeagues => [...prevLeagues, newLeague]);
setMatches(prevMatches => prevMatches.filter(m => m.id !== matchId));
```
- ❌ Wrong: Direct mutation `leagues.push(newLeague)`

**State Organization:** Group related state in same context
- ✅ Correct: `leagues`, `tournaments`, `currentLeague` in `LeagueContext`
- ❌ Wrong: Splitting across multiple contexts unnecessarily

**Loading States:** Use descriptive boolean names
- ✅ Correct: `isLoadingInitialData`, `isLoading`, `authLoading`
- ❌ Wrong: `loading`, `isLoading1`, `loadingState`

**Error States:** Store error objects, not just messages
- ✅ Correct: `error: Error | null`, `error: { message: string, code?: string }`
- ❌ Wrong: `errorMessage: string | null`

**Enforcement:** All state updates MUST be immutable. Use functional updates with `setState(prev => ...)`.

### Process Patterns

#### Error Handling Patterns

**Service Layer Errors:**
- ✅ Correct:
```typescript
try {
  const { data, error } = await supabase.from('leagues').select('*');
  if (error) throw error;
  return data;
} catch (error) {
  console.error('Failed to load leagues:', error);
  // Fallback to localStorage
  return this.loadLeaguesFromLocalStorage();
}
```

**User-Facing Errors:** Use `react-hot-toast` for notifications
- ✅ Correct: `toast.error('Failed to create league. Please try again.')`
- ❌ Wrong: `alert()`, `console.error()` only

**Error Boundaries:** Wrap route components in error boundaries
- ✅ Correct: `<ErrorBoundary><Route path="/league" element={<LeagueDashboard />} /></ErrorBoundary>`
- ❌ Wrong: No error boundaries

**Error Types:** Create specific error types for different scenarios
- ✅ Correct: `class ValidationError extends Error`, `class NetworkError extends Error`
- ❌ Wrong: Generic `Error` for all cases

**Enforcement:** All async operations MUST have error handling. User-facing errors MUST use toast notifications.

#### Loading State Patterns

**Loading State Naming:** Use `isLoading{Context}` pattern
- ✅ Correct: `isLoadingInitialData`, `isLoading`, `authLoading`, `identityLoading`
- ❌ Wrong: `loading`, `isLoading1`, `loadingState`

**Global vs Local Loading:**
- **Global:** Use context loading states for initial data load
- **Local:** Use component state for action-specific loading
- ✅ Correct: `const [isSubmitting, setIsSubmitting] = useState(false)`
- ❌ Wrong: Using global loading for every action

**Loading UI:** Use `LoadingSpinner` component consistently
- ✅ Correct: `<LoadingSpinner size={24} />`
- ❌ Wrong: Custom loading implementations, inline spinners

**Optimistic Updates:** Update UI immediately, sync in background
- ✅ Correct: Update state first, then sync to Supabase
- ❌ Wrong: Wait for server response before updating UI

**Enforcement:** All loading states MUST use consistent naming. All loading UI MUST use `LoadingSpinner` component.

### Enforcement Guidelines

**All AI Agents MUST:**

1. **Follow Naming Conventions:**
   - Use PascalCase for components, types, classes
   - Use camelCase for variables, functions, instances
   - Use snake_case for database tables/columns
   - Use UPPER_SNAKE_CASE for constants

2. **Follow Structure Patterns:**
   - Organize files by type (components/, pages/, services/)
   - Use consistent file naming (PascalCase for components, camelCase for services)
   - Co-locate related files in same directory

3. **Follow Format Patterns:**
   - Convert snake_case ↔ camelCase when transforming database ↔ app data
   - Use ISO 8601 for dates
   - Use `true`/`false` for booleans
   - Use `null` for optional database fields

4. **Follow Communication Patterns:**
   - Use immutable state updates
   - Group related state in contexts
   - Use descriptive loading state names

5. **Follow Process Patterns:**
   - Handle all async operations with try-catch
   - Use `react-hot-toast` for user-facing errors
   - Use `LoadingSpinner` component for loading UI
   - Implement optimistic updates where appropriate

**Pattern Enforcement:**

- **ESLint Rules:** Configure ESLint to enforce naming conventions
- **TypeScript:** Use strict mode to catch type errors
- **Code Review:** Review for pattern compliance
- **Documentation:** Update this document when patterns change

**Pattern Updates:**

- Patterns can be updated through collaborative discussion
- Changes must be documented in this architecture document
- All agents must be notified of pattern changes

### Pattern Examples

#### Good Examples

**Component with Props:**
```typescript
// EmptyState.tsx
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

**Service with Error Handling:**
```typescript
// DatabaseService.ts
class DatabaseService {
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
```

**Context with Immutable Updates:**
```typescript
// LeagueContext.tsx
const createLeague = async (name: string, type: "event" | "season") => {
  setIsLoading(true);
  try {
    const leagueId = await databaseService.createLeague(name, type);
    setLeagues(prevLeagues => [...prevLeagues, newLeague]);
    toast.success('League created successfully!');
    return leagueId;
  } catch (error) {
    toast.error('Failed to create league. Please try again.');
    throw error;
  } finally {
    setIsLoading(false);
  }
};
```

#### Anti-Patterns

**❌ Wrong Naming:**
```typescript
// Wrong: Inconsistent naming
export const empty_state = () => { ... }  // Should be EmptyState
const user_id = "123";  // Should be userId
class databaseService { ... }  // Should be DatabaseService
```

**❌ Wrong Structure:**
```typescript
// Wrong: Direct mutation
leagues.push(newLeague);  // Should use setLeagues(prev => [...prev, newLeague])

// Wrong: No error handling
const data = await supabase.from('leagues').select('*');  // Should check error

// Wrong: Inconsistent loading state
const loading = true;  // Should be isLoading or isLoadingLeagues
```

**❌ Wrong Format:**
```typescript
// Wrong: No data transformation
const league = { created_at: "2026-01-23", user_id: "123" };  // Should convert to camelCase

// Wrong: Inconsistent date format
const date = 1706006400;  // Should use ISO string "2026-01-23T10:30:00Z"
```

**Enforcement:** All code MUST avoid these anti-patterns. Code reviews should catch and correct these issues.

## Project Structure & Boundaries

### Complete Project Directory Structure

```
beer-pong-league/
├── README.md                          # Project overview and setup instructions
├── package.json                       # Dependencies and scripts
├── package-lock.json                  # Locked dependency versions
├── tsconfig.json                      # TypeScript configuration (strict mode)
├── tsconfig.node.json                 # TypeScript config for Node.js files
├── vite.config.ts                     # Vite build configuration
├── tailwind.config.js                 # Tailwind CSS configuration
├── postcss.config.js                  # PostCSS configuration
├── vercel.json                        # Vercel deployment configuration
├── index.html                         # HTML entry point
├── .gitignore                         # Git ignore patterns
├── .env.example                       # Environment variables template
├── .env.local                         # Local environment variables (gitignored)
│
├── .github/                           # GitHub configuration
│   └── workflows/
│       └── ci.yml                     # CI/CD pipeline (lint, type-check, test, build)
│
├── .husky/                            # Git hooks (pre-commit linting)
│   └── pre-commit                      # Pre-commit hook script
│
├── src/                               # Source code
│   ├── main.tsx                       # Application entry point
│   ├── App.tsx                        # Root React component with routing
│   ├── index.css                      # Global styles and Tailwind imports
│   ├── vite-env.d.ts                  # Vite type definitions
│   │
│   ├── components/                    # Reusable UI components
│   │   ├── AuthModal.tsx             # Authentication modal (email + OTP)
│   │   ├── CreateIdentityModal.tsx    # Create local identity modal
│   │   ├── EloChangeDisplay.tsx       # ELO change animation component
│   │   ├── EmptyState.tsx            # Empty state component
│   │   ├── IdentityInitializer.tsx   # Identity initialization component
│   │   ├── IdentityModal.tsx         # Identity selection modal
│   │   ├── LoadingSpinner.tsx        # Loading spinner component
│   │   ├── layout/                   # Layout components
│   │   │   └── MenuDrawer.tsx        # Navigation drawer/menu
│   │   │
│   │   └── [Future Components]       # To be created per UX spec
│   │       ├── MatchRecordingForm.tsx    # Match recording form (from UX spec)
│   │       ├── QRCodeDisplay.tsx         # QR code display component
│   │       ├── AnimatedLeaderboard.tsx   # Animated leaderboard (post-MVP)
│   │       ├── CelebrationAnimation.tsx  # Celebration animations
│   │       ├── TournamentJoinFlow.tsx   # Tournament join flow
│   │       ├── ScoreInput.tsx            # Score input component
│   │       ├── PositionChangeIndicator.tsx  # Position change indicator
│   │       └── DisplayViewComponents.tsx   # Display view components (post-MVP)
│   │
│   ├── pages/                         # Route-level page components
│   │   ├── AuthCallback.tsx          # OAuth/OTP callback handler
│   │   ├── CreateLeague.tsx          # League creation page
│   │   ├── CreateTournament.tsx      # Tournament creation page
│   │   ├── DisplayView.tsx           # Display view for projection (post-MVP)
│   │   ├── LeagueDashboard.tsx       # League dashboard with tabs
│   │   ├── PlayerProfile.tsx         # Player profile page
│   │   ├── TournamentDashboard.tsx   # Tournament dashboard
│   │   ├── TournamentDisplayView.tsx # Tournament display view (post-MVP)
│   │   ├── TournamentInvite.tsx       # Tournament invitation page
│   │   ├── TournamentJoin.tsx        # Tournament join page
│   │   └── UserProfile.tsx           # User profile page
│   │
│   ├── services/                      # Business logic and data access layer
│   │   ├── AnonymousUserService.ts   # Anonymous user management
│   │   ├── AuthService.ts            # Authentication service (Supabase Auth)
│   │   ├── DatabaseService.ts        # Database operations (Supabase + localStorage)
│   │   ├── IdentityMergeService.ts   # Identity merge (anonymous → authenticated)
│   │   ├── LocalUserService.ts       # Local user management (localStorage)
│   │   └── MigrationService.ts      # Data migration service
│   │
│   ├── context/                      # React Context providers
│   │   ├── AuthContext.tsx           # Authentication context
│   │   ├── IdentityContext.tsx       # Identity management context
│   │   └── LeagueContext.tsx         # League/tournament state context
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.ts                # Authentication hook
│   │   └── useIdentity.ts            # Identity management hook
│   │
│   ├── lib/                          # Third-party library configurations
│   │   └── supabase.ts               # Supabase client configuration
│   │
│   ├── types/                        # TypeScript type definitions
│   │   ├── supabase.ts               # Generated Supabase types
│   │   └── index.ts                  # App-specific type definitions (if needed)
│   │
│   ├── types.ts                      # Main application types (Player, League, Tournament, Match)
│   │
│   ├── utils/                        # Utility functions
│   │   ├── deviceFingerprint.ts      # Device fingerprinting for anonymous users
│   │   ├── elo.ts                    # ELO calculation utilities
│   │   └── validation.ts             # Zod validation schemas (to be created)
│   │
│   └── [Future Directories]           # Post-MVP additions
│       ├── features/                  # Feature-based organization (post-MVP)
│       │   ├── gamification/         # Badges, achievements, streaks
│       │   ├── social/               # Friend connections, rivalries
│       │   └── notifications/        # Push notifications, in-app notifications
│       │
│       └── workers/                  # Service workers (PWA)
│           └── service-worker.ts     # Service worker for offline support
│
├── supabase/                         # Supabase configuration and migrations
│   └── migrations/                   # Database migrations
│       ├── 001_initial_schema.sql    # Initial database schema
│       └── 002_add_anti_cheat.sql    # Anti-cheat system additions
│
├── tests/                            # Test files (to be created)
│   ├── __mocks__/                    # Mock implementations
│   │   └── supabase.ts               # Supabase client mock
│   │
│   ├── unit/                         # Unit tests
│   │   ├── services/                 # Service layer tests
│   │   │   ├── DatabaseService.test.ts
│   │   │   ├── AuthService.test.ts
│   │   │   └── EloCalculation.test.ts
│   │   │
│   │   ├── utils/                    # Utility function tests
│   │   │   ├── elo.test.ts
│   │   │   └── deviceFingerprint.test.ts
│   │   │
│   │   └── validation/               # Validation schema tests
│   │       └── validation.test.ts
│   │
│   ├── integration/                  # Integration tests
│   │   ├── services/                  # Service integration tests
│   │   │   └── DatabaseService.integration.test.ts
│   │   │
│   │   └── context/                  # Context integration tests
│   │       └── LeagueContext.integration.test.ts
│   │
│   ├── e2e/                          # End-to-end tests (to be created)
│   │   ├── flows/                    # User flow tests
│   │   │   ├── create-league.spec.ts
│   │   │   ├── record-match.spec.ts
│   │   │   └── tournament-join.spec.ts
│   │   │
│   │   └── support/                  # E2E test support
│   │       ├── fixtures/             # Test data fixtures
│   │       ├── helpers/              # Test helper functions
│   │       └── page-objects/        # Page object models
│   │
│   └── setup/                        # Test setup and configuration
│       ├── vitest.setup.ts           # Vitest configuration
│       └── test-utils.tsx            # React Testing Library utilities
│
├── public/                           # Static assets
│   ├── icons/                        # App icons (PWA)
│   │   ├── icon-192x192.png
│   │   ├── icon-512x512.png
│   │   └── apple-touch-icon.png
│   │
│   ├── manifest.json                 # PWA manifest (to be created)
│   │
│   └── assets/                       # Other static assets
│       └── images/                   # Images (if needed)
│
├── docs/                             # Project documentation
│   ├── index.md                      # Documentation index
│   ├── project-overview.md           # Project overview
│   ├── architecture.md               # Architecture documentation
│   ├── component-inventory.md        # Component inventory
│   ├── data-models.md                # Data model documentation
│   ├── api-contracts.md              # API contracts (Supabase)
│   ├── development-guide.md          # Development guide
│   ├── deployment-guide.md           # Deployment guide
│   ├── source-tree-analysis.md       # Source tree analysis
│   └── project-scan-report.json      # Project scan report
│
└── _bmad/                            # BMAD workflow files (development tooling)
    └── [BMAD workflow files]
```

### Architectural Boundaries

#### API Boundaries

**External API:**
- **Supabase API:** All backend communication via Supabase client
  - **Auth API:** `supabase.auth.*` methods (signInWithOtp, signOut, etc.)
  - **Database API:** `supabase.from('table').*` methods (select, insert, update, delete)
  - **Realtime API:** `supabase.channel('*').on('*', ...)` (post-MVP for display view)
  - **Storage API:** Not used in MVP (future for avatars, images)

**No Custom REST API:**
- All data access goes through Supabase client
- No custom backend server or API endpoints
- Service layer abstracts Supabase calls

**API Integration Points:**
- `src/lib/supabase.ts` - Single Supabase client instance
- `src/services/*.ts` - Service layer wrapping Supabase calls
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLIC_KEY`

#### Component Boundaries

**Frontend Component Communication:**
- **Props Down, Events Up:** Standard React data flow
- **Context for Global State:** AuthContext, IdentityContext, LeagueContext
- **Custom Hooks:** useAuth, useIdentity, useLeague for context consumption
- **No Global Event Bus:** React Context + props sufficient

**State Management Boundaries:**
- **Global State:** React Context (Auth, Identity, League)
- **Local State:** useState for component-specific state
- **No Redux/MobX:** Context API sufficient for project scale
- **Service Layer:** Stateless services, state managed in contexts

**Component Organization:**
- **Atomic Design:** Atoms → Molecules → Organisms → Pages
- **Feature Co-location:** Related components in same directory
- **Shared Components:** Reusable components in `src/components/`
- **Page Components:** Route-level components in `src/pages/`

#### Service Boundaries

**Service Layer Pattern:**
- **Single Responsibility:** Each service handles one domain (Auth, Database, Identity)
- **Stateless Services:** Services don't maintain state, contexts do
- **Error Handling:** Services throw errors, contexts handle user feedback
- **Offline Support:** Services check Supabase availability, fallback to localStorage

**Service Communication:**
- **No Inter-Service Dependencies:** Services are independent
- **Context Orchestration:** Contexts coordinate multiple services
- **DatabaseService:** Primary data access layer
- **AuthService:** Authentication operations only
- **Identity Services:** AnonymousUserService, LocalUserService, IdentityMergeService

#### Data Boundaries

**Database Schema Boundaries:**
- **Supabase PostgreSQL:** All persistent data
- **Tables:** `users`, `anonymous_users`, `leagues`, `league_players`, `tournaments`, `tournament_players`, `matches`, `elo_history`, `user_identity_merges`
- **RLS Policies:** Row Level Security enforced on all tables
- **Migrations:** Versioned in `supabase/migrations/`

**Data Access Patterns:**
- **Read:** Supabase `.select()` → Transform to app format (snake_case → camelCase)
- **Write:** Transform app format → Supabase format (camelCase → snake_case) → `.insert()`/`.update()`
- **Offline:** localStorage fallback with same data structure
- **Sync:** Automatic sync on reconnection, conflict resolution (last-write-wins)

**Caching Boundaries:**
- **Layer 1:** React Context state (in-memory)
- **Layer 2:** localStorage (persistent, offline)
- **Layer 3:** Supabase HTTP cache (automatic)
- **Invalidation:** Clear cache on mutations, refresh on mount

### Requirements to Structure Mapping

#### Feature/Epic Mapping

**FR1: Championnat Management →**
- **Components:** `src/components/MatchRecordingForm.tsx`, `src/components/QRCodeDisplay.tsx`
- **Pages:** `src/pages/CreateLeague.tsx`, `src/pages/CreateTournament.tsx`, `src/pages/LeagueDashboard.tsx`
- **Services:** `src/services/DatabaseService.ts` (createLeague, createTournament)
- **Context:** `src/context/LeagueContext.tsx` (league/tournament state)
- **Database:** `supabase/migrations/001_initial_schema.sql` (leagues, tournaments tables)
- **Tests:** `tests/unit/services/DatabaseService.test.ts`, `tests/e2e/flows/create-league.spec.ts`

**FR2: Match Management →**
- **Components:** `src/components/MatchRecordingForm.tsx`, `src/components/EloChangeDisplay.tsx`
- **Services:** `src/services/DatabaseService.ts` (recordMatch, recordTournamentMatch)
- **Utils:** `src/utils/elo.ts` (calculateEloChange)
- **Context:** `src/context/LeagueContext.tsx` (recordMatch method)
- **Database:** `supabase/migrations/001_initial_schema.sql` (matches, elo_history tables)
- **Tests:** `tests/unit/utils/elo.test.ts`, `tests/e2e/flows/record-match.spec.ts`

**FR3: Classements et Stats →**
- **Components:** `src/components/AnimatedLeaderboard.tsx` (post-MVP), `src/pages/PlayerProfile.tsx`
- **Pages:** `src/pages/LeagueDashboard.tsx` (leaderboard tab), `src/pages/TournamentDashboard.tsx`
- **Services:** `src/services/DatabaseService.ts` (getLeagueGlobalRanking, getTournamentLocalRanking)
- **Context:** `src/context/LeagueContext.tsx` (ranking methods)
- **Database:** `supabase/migrations/001_initial_schema.sql` (league_players with ELO stats)
- **Tests:** `tests/unit/services/DatabaseService.test.ts` (ranking tests)

**FR4: Authentification et Identité →**
- **Components:** `src/components/AuthModal.tsx`, `src/components/IdentityModal.tsx`, `src/components/CreateIdentityModal.tsx`
- **Pages:** `src/pages/AuthCallback.tsx`, `src/pages/UserProfile.tsx`
- **Services:** `src/services/AuthService.ts`, `src/services/AnonymousUserService.ts`, `src/services/LocalUserService.ts`, `src/services/IdentityMergeService.ts`
- **Context:** `src/context/AuthContext.tsx`, `src/context/IdentityContext.tsx`
- **Hooks:** `src/hooks/useAuth.ts`, `src/hooks/useIdentity.ts`
- **Database:** `supabase/migrations/001_initial_schema.sql` (users, anonymous_users, user_identity_merges tables)
- **Tests:** `tests/unit/services/AuthService.test.ts`, `tests/unit/services/IdentityMergeService.test.ts`

**FR5: Interface Utilisateur →**
- **Components:** All components in `src/components/`
- **Pages:** All pages in `src/pages/`
- **Styling:** `src/index.css`, `tailwind.config.js`
- **Layout:** `src/components/layout/MenuDrawer.tsx`
- **Tests:** `tests/unit/components/*.test.tsx`, `tests/e2e/flows/*.spec.ts`

**FR6: Partage et Découverte →**
- **Components:** `src/components/QRCodeDisplay.tsx`, `src/components/TournamentJoinFlow.tsx`
- **Pages:** `src/pages/TournamentInvite.tsx`, `src/pages/TournamentJoin.tsx`
- **Services:** `src/services/DatabaseService.ts` (QR code generation logic)
- **Tests:** `tests/e2e/flows/tournament-join.spec.ts`

**FR7: Écran de Projection (Post-MVP) →**
- **Pages:** `src/pages/DisplayView.tsx`, `src/pages/TournamentDisplayView.tsx`
- **Components:** `src/components/DisplayViewComponents.tsx`
- **Services:** Supabase Realtime subscriptions
- **Database:** Real-time updates via Supabase Realtime
- **Tests:** `tests/integration/realtime.test.ts`

#### Cross-Cutting Concerns

**Authentication System →**
- **Components:** `src/components/AuthModal.tsx`
- **Services:** `src/services/AuthService.ts`
- **Context:** `src/context/AuthContext.tsx`
- **Hooks:** `src/hooks/useAuth.ts`
- **Pages:** `src/pages/AuthCallback.tsx`
- **Database:** Supabase Auth (external)
- **Tests:** `tests/unit/services/AuthService.test.ts`, `tests/integration/auth.test.ts`

**Offline-First Architecture →**
- **Services:** All services in `src/services/` (localStorage fallback)
- **Context:** `src/context/LeagueContext.tsx` (offline queue management)
- **Utils:** `src/utils/deviceFingerprint.ts` (anonymous user identification)
- **PWA:** `public/manifest.json`, `src/workers/service-worker.ts` (to be created)
- **Tests:** `tests/integration/offline.test.ts`

**Error Handling →**
- **Components:** Error boundaries (to be created)
- **Services:** Try-catch in all service methods
- **Context:** Error state management in contexts
- **Utils:** Error formatting utilities (to be created)
- **Monitoring:** Sentry integration (to be created)
- **Tests:** `tests/unit/error-handling.test.ts`

**Validation →**
- **Utils:** `src/utils/validation.ts` (Zod schemas - to be created)
- **Components:** Form validation in components
- **Services:** Input validation before database operations
- **Tests:** `tests/unit/validation/validation.test.ts`

### Integration Points

#### Internal Communication

**Component → Context:**
- Components use hooks (useAuth, useIdentity, useLeague) to access context
- Components call context methods to trigger state updates
- Context methods call services to perform operations

**Context → Service:**
- Contexts import and use service instances (databaseService, authService)
- Contexts handle service errors and update state accordingly
- Services are stateless, contexts manage state

**Service → Supabase:**
- Services import `supabase` client from `src/lib/supabase.ts`
- Services perform database operations via Supabase client
- Services transform data between app format and database format

**Service → localStorage:**
- Services check Supabase availability before operations
- Services fallback to localStorage methods when offline
- Services use same data structure for both Supabase and localStorage

#### External Integrations

**Supabase Integration:**
- **Auth:** Supabase Auth for email + OTP authentication
- **Database:** Supabase PostgreSQL for all persistent data
- **Realtime:** Supabase Realtime for post-MVP display view updates
- **Configuration:** Environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLIC_KEY)

**Vercel Integration:**
- **Hosting:** Static SPA deployment on Vercel
- **Environment Variables:** Configured in Vercel dashboard
- **Auto-Deploy:** Automatic deployment on git push to main branch
- **Configuration:** `vercel.json` for deployment settings

**Sentry Integration (To Be Added):**
- **Error Monitoring:** Sentry React SDK for error tracking
- **Performance Monitoring:** Sentry transactions for performance insights
- **Source Maps:** Automatic source map upload via Vercel integration
- **Configuration:** Environment variable (SENTRY_DSN)

**PWA Integration (To Be Added):**
- **Service Worker:** `vite-plugin-pwa` for offline support
- **Manifest:** `public/manifest.json` for app installation
- **Icons:** `public/icons/` for PWA icons
- **Configuration:** `vite.config.ts` PWA plugin configuration

#### Data Flow

**Data Flow Pattern:**
1. **User Action:** Component receives user interaction
2. **Context Method:** Component calls context method (e.g., `createLeague`)
3. **Service Call:** Context method calls service (e.g., `databaseService.createLeague`)
4. **Supabase Operation:** Service performs Supabase operation
5. **Data Transformation:** Service transforms database format → app format
6. **State Update:** Context updates state with new data
7. **UI Update:** Component re-renders with updated state

**Offline Flow:**
1. **User Action:** Component receives user interaction
2. **Context Method:** Component calls context method
3. **Service Check:** Service checks Supabase availability
4. **localStorage Fallback:** If offline, service uses localStorage
5. **Optimistic Update:** Context updates state immediately
6. **Sync Queue:** Operation queued for sync when online
7. **Background Sync:** Service syncs to Supabase when connection restored

### File Organization Patterns

#### Configuration Files

**Root Level:**
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `vercel.json` - Vercel deployment configuration
- `.env.example` - Environment variables template
- `.env.local` - Local environment variables (gitignored)

**Git Configuration:**
- `.github/workflows/ci.yml` - CI/CD pipeline
- `.husky/pre-commit` - Pre-commit hooks
- `.gitignore` - Git ignore patterns

#### Source Organization

**By Type (Current Pattern):**
- `src/components/` - Reusable UI components
- `src/pages/` - Route-level page components
- `src/services/` - Business logic and data access
- `src/context/` - React Context providers
- `src/hooks/` - Custom React hooks
- `src/lib/` - Third-party library configurations
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions

**Future: Feature-Based (Post-MVP):**
- `src/features/gamification/` - Badges, achievements
- `src/features/social/` - Friend connections, rivalries
- `src/features/notifications/` - Push notifications

#### Test Organization

**By Test Type:**
- `tests/unit/` - Unit tests (services, utils, components)
- `tests/integration/` - Integration tests (services + contexts)
- `tests/e2e/` - End-to-end tests (user flows)

**By Domain:**
- `tests/unit/services/` - Service layer tests
- `tests/unit/utils/` - Utility function tests
- `tests/unit/components/` - Component tests
- `tests/integration/context/` - Context integration tests
- `tests/e2e/flows/` - User flow tests

**Test Support:**
- `tests/__mocks__/` - Mock implementations
- `tests/setup/` - Test configuration and utilities
- `tests/e2e/support/` - E2E test support (fixtures, helpers, page objects)

#### Asset Organization

**Static Assets:**
- `public/icons/` - PWA icons (192x192, 512x512, apple-touch-icon)
- `public/manifest.json` - PWA manifest
- `public/assets/images/` - Images (if needed)

**Build Output:**
- `dist/` - Vite build output (gitignored)
- `dist/assets/` - Compiled assets (JS, CSS, images)

### Development Workflow Integration

#### Development Server Structure

**Vite Dev Server:**
- Entry: `index.html` → `src/main.tsx`
- HMR: Hot Module Replacement for fast development
- Path Aliases: `@/*` → `src/*` (configured in `vite.config.ts` and `tsconfig.json`)
- Environment: `.env.local` loaded automatically

**Development Scripts:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests (to be added)

#### Build Process Structure

**Vite Build:**
1. **Type Check:** `tsc --noEmit` (before build)
2. **Bundle:** Vite bundles with code splitting
3. **Optimize:** Minification, tree-shaking, asset optimization
4. **Output:** `dist/` directory with static files

**Build Optimizations:**
- **Code Splitting:** Route-based + vendor chunks
- **Lazy Loading:** React.lazy() for page components
- **Asset Optimization:** Image optimization, font subsetting
- **PWA:** Service worker generation via vite-plugin-pwa

#### Deployment Structure

**Vercel Deployment:**
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:** Configured in Vercel dashboard
- **Auto-Deploy:** On push to main branch
- **Preview Deployments:** On pull requests

**Deployment Files:**
- `vercel.json` - Vercel configuration
- `.github/workflows/ci.yml` - Pre-deployment checks
- `public/` - Static assets included in deployment

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**

All architectural decisions are fully compatible and work together seamlessly:

- ✅ **Technology Stack:** Vite 5.1.4 + React 18.2.0 + TypeScript 5.2.2 are all compatible and current
- ✅ **Backend Integration:** Supabase client works perfectly with React and TypeScript
- ✅ **State Management:** React Context API is appropriate for project scale and integrates with all services
- ✅ **Build & Deployment:** Vite build output is optimized for Vercel static hosting
- ✅ **Validation Strategy:** Zod 4.3.6 integrates seamlessly with TypeScript and React forms
- ✅ **Monitoring:** Sentry React SDK compatible with Vite and Vercel deployment
- ✅ **PWA Support:** vite-plugin-pwa works with Vite 5 and React 18

**No Conflicts Identified:**
- All technology versions are compatible
- No contradictory architectural decisions
- All patterns align with technology choices

**Pattern Consistency:**

Implementation patterns fully support architectural decisions:

- ✅ **Naming Patterns:** Consistent snake_case (DB) ↔ camelCase (app) transformation aligns with Supabase + TypeScript
- ✅ **Structure Patterns:** Type-based organization (components/, services/, pages/) supports React + TypeScript stack
- ✅ **Communication Patterns:** React Context + props pattern aligns with chosen state management approach
- ✅ **Process Patterns:** Error handling and loading state patterns support offline-first architecture

**Structure Alignment:**

Project structure fully supports all architectural decisions:

- ✅ **Service Layer:** Structure enables stateless services with localStorage fallback
- ✅ **Context Organization:** Separate contexts (Auth, Identity, League) support separation of concerns
- ✅ **Component Organization:** Atomic Design pattern supports reusability and maintainability
- ✅ **Test Organization:** Separate test directory structure supports Vitest + React Testing Library
- ✅ **Integration Points:** Clear boundaries enable Supabase integration without custom API layer

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**

All MVP functional requirements (FR1-FR6) are fully architecturally supported:

- ✅ **FR1: Championnat Management**
  - Architectural Support: DatabaseService, LeagueContext, CreateLeague/CreateTournament pages
  - Database: leagues, tournaments tables with RLS policies
  - Components: QRCodeDisplay (to be created), MatchRecordingForm (to be created)
  - Status: Fully supported

- ✅ **FR2: Match Management**
  - Architectural Support: DatabaseService.recordMatch(), ELO calculation utilities
  - Database: matches, elo_history tables with automatic ELO updates
  - Components: MatchRecordingForm, EloChangeDisplay (existing)
  - Status: Fully supported

- ✅ **FR3: Classements et Stats**
  - Architectural Support: DatabaseService ranking methods, LeagueContext state
  - Database: league_players with ELO stats, ranking queries
  - Components: AnimatedLeaderboard (post-MVP), PlayerProfile page
  - Status: Fully supported (MVP), enhanced for post-MVP

- ✅ **FR4: Authentification et Identité**
  - Architectural Support: AuthService, AnonymousUserService, LocalUserService, IdentityMergeService
  - Database: users, anonymous_users, user_identity_merges tables
  - Components: AuthModal, IdentityModal, CreateIdentityModal (all existing)
  - Status: Fully supported

- ✅ **FR5: Interface Utilisateur**
  - Architectural Support: All components, Tailwind CSS, responsive design
  - Structure: Complete component library with Atomic Design pattern
  - Status: Fully supported

- ✅ **FR6: Partage et Découverte**
  - Architectural Support: QRCodeDisplay component, TournamentJoinFlow
  - Pages: TournamentInvite, TournamentJoin (existing)
  - Status: Fully supported

**Post-MVP Requirements (FR7-FR16):**
- ✅ **FR7: Écran de Projection:** Supabase Realtime architecture defined, DisplayView pages exist
- ✅ **FR8-FR16:** Architecture supports future extensions (features/ directory structure defined)

**Non-Functional Requirements Coverage:**

All NFRs are architecturally addressed:

- ✅ **NFR1: Usability**
  - Support: Component architecture prioritizes simplicity, large touch targets
  - Implementation: Atomic Design pattern, progressive disclosure
  - Status: Fully supported

- ✅ **NFR2: Reliability**
  - Support: Error boundaries, comprehensive error handling, offline fallback
  - Implementation: Sentry monitoring, localStorage fallback, retry logic
  - Status: Fully supported

- ✅ **NFR3: Performance**
  - Support: Code splitting, lazy loading, optimistic updates, caching strategy
  - Implementation: Route-based splitting, vendor chunks, React.lazy()
  - Status: Fully supported

- ✅ **NFR4: Security**
  - Support: RLS policies, Supabase Auth, data encryption
  - Implementation: All tables protected, secure authentication flow
  - Status: Fully supported

- ✅ **NFR5: Maintainability**
  - Support: TypeScript strict mode, ESLint, comprehensive patterns
  - Implementation: Type safety, code quality standards, documentation
  - Status: Fully supported

- ✅ **NFR6: Integration**
  - Support: Unified Supabase backend, multi-platform sync architecture
  - Implementation: Single source of truth, conflict resolution strategy
  - Status: Fully supported

- ✅ **NFR7: Mobile-Specific (Post-MVP)**
  - Support: Architecture supports React Native extension
  - Implementation: Shared backend, unified data models
  - Status: Architecture ready for post-MVP

- ✅ **NFR8: SEO and Web Vitrine (Post-MVP)**
  - Support: SSR can be added via Next.js migration or Vite SSR plugin
  - Implementation: Current SPA structure can be enhanced
  - Status: Architecture supports future enhancement

### Implementation Readiness Validation ✅

**Decision Completeness:**

All critical architectural decisions are fully documented:

- ✅ **Technology Versions:** All versions specified and verified (Vite 5.1.4, React 18.2.0, TypeScript 5.2.2, Zod 4.3.6)
- ✅ **Architectural Decisions:** 10 major decisions documented with rationale and impact
- ✅ **Implementation Patterns:** Comprehensive patterns for naming, structure, format, communication, process
- ✅ **Examples:** Good examples and anti-patterns provided for all major patterns

**Structure Completeness:**

Project structure is complete and specific:

- ✅ **Directory Tree:** Complete directory structure with all files and directories defined
- ✅ **File Organization:** Clear organization patterns for configuration, source, tests, assets
- ✅ **Integration Points:** All integration points clearly specified (Supabase, Vercel, Sentry, PWA)
- ✅ **Component Boundaries:** Well-defined boundaries between components, services, contexts

**Pattern Completeness:**

All potential conflict points are addressed:

- ✅ **Naming Conventions:** Comprehensive rules for database, API, code naming with examples
- ✅ **Structure Patterns:** Complete project organization and file structure patterns
- ✅ **Format Patterns:** API response and data exchange format rules
- ✅ **Communication Patterns:** State management and event system patterns
- ✅ **Process Patterns:** Error handling and loading state patterns with enforcement guidelines

### Gap Analysis Results

**Critical Gaps: None Identified**

All critical architectural decisions are complete. No blocking gaps found.

**Important Gaps (To Be Addressed During Implementation):**

1. **PWA Configuration:**
   - Gap: `vite-plugin-pwa` configuration not yet implemented
   - Impact: Offline-first requirement (FR requirement) needs PWA support
   - Resolution: Add vite-plugin-pwa to vite.config.ts during implementation
   - Priority: P0 (Critical for offline-first)

2. **Testing Framework Setup:**
   - Gap: Vitest + React Testing Library not yet configured
   - Impact: NFR5 (Maintainability) requires testing infrastructure
   - Resolution: Configure Vitest, create test structure, add test scripts
   - Priority: P0 (Critical for maintainability)

3. **Zod Validation Schemas:**
   - Gap: Validation schemas not yet created in `src/utils/validation.ts`
   - Impact: Decision 1.1 (Data Validation Strategy) requires Zod schemas
   - Resolution: Create Zod schemas for all data types during implementation
   - Priority: P0 (Critical for data validation)

4. **Error Boundaries:**
   - Gap: React error boundaries not yet implemented
   - Impact: Decision 3.2 (Error Handling Standards) requires error boundaries
   - Resolution: Create error boundary components during implementation
   - Priority: P1 (High - needed for production)

5. **Sentry Integration:**
   - Gap: Sentry React SDK not yet integrated
   - Impact: Decision 5.3 (Monitoring & Logging) requires Sentry
   - Resolution: Add Sentry SDK, configure error boundaries, set up Vercel integration
   - Priority: P1 (High - needed for production monitoring)

6. **CI/CD Pipeline:**
   - Gap: GitHub Actions workflow not yet created
   - Impact: Decision 5.1 (CI/CD Pipeline) requires GitHub Actions
   - Resolution: Create `.github/workflows/ci.yml` with lint, type-check, test, build
   - Priority: P1 (High - needed for quality assurance)

**Nice-to-Have Gaps (Future Enhancements):**

1. **Bundle Analyzer:**
   - Gap: Bundle size analysis tool not configured
   - Impact: Performance optimization insights
   - Resolution: Add webpack-bundle-analyzer or similar
   - Priority: P2 (Medium - helpful for optimization)

2. **Prettier Configuration:**
   - Gap: Prettier not yet configured (if not already)
   - Impact: Code formatting consistency
   - Resolution: Add Prettier config and pre-commit hook
   - Priority: P2 (Medium - improves developer experience)

3. **Husky Pre-commit Hooks:**
   - Gap: Husky hooks not yet set up
   - Impact: Pre-commit linting and formatting
   - Resolution: Configure Husky with pre-commit hooks
   - Priority: P2 (Medium - improves code quality)

### Validation Issues Addressed

**No Critical Issues Found**

The architecture is coherent, complete, and ready for implementation. All identified gaps are implementation tasks, not architectural issues.

**Recommendations for Implementation:**

1. **Follow Implementation Sequence:**
   - P0: Add PWA support, configure testing, create Zod schemas
   - P1: Implement error boundaries, integrate Sentry, set up CI/CD
   - P2: Add development tools (Prettier, Husky, bundle analyzer)

2. **Reference Architecture Document:**
   - All AI agents should reference this document for architectural decisions
   - Follow patterns exactly as documented
   - Respect project structure and boundaries

3. **Incremental Implementation:**
   - Start with MVP features (FR1-FR6)
   - Add enhancements (PWA, testing, monitoring) incrementally
   - Post-MVP features can be added following the same architectural patterns

### Architecture Completeness Checklist

**✅ Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Medium to High)
- [x] Technical constraints identified (React, Supabase, Vercel, offline-first)
- [x] Cross-cutting concerns mapped (10 concerns identified)

**✅ Architectural Decisions**

- [x] Critical decisions documented with versions (10 major decisions)
- [x] Technology stack fully specified (Vite, React, TypeScript, Supabase)
- [x] Integration patterns defined (Supabase client, Vercel deployment)
- [x] Performance considerations addressed (code splitting, lazy loading, caching)

**✅ Implementation Patterns**

- [x] Naming conventions established (database, API, code)
- [x] Structure patterns defined (project organization, file structure)
- [x] Communication patterns specified (state management, error handling)
- [x] Process patterns documented (error handling, loading states)

**✅ Project Structure**

- [x] Complete directory structure defined (all files and directories)
- [x] Component boundaries established (API, component, service, data boundaries)
- [x] Integration points mapped (internal, external, data flow)
- [x] Requirements to structure mapping complete (FR1-FR6 mapped)

### Architecture Readiness Assessment

**Overall Status:** ✅ **READY FOR IMPLEMENTATION**

**Confidence Level:** **HIGH** - Architecture is complete, coherent, and comprehensive

**Key Strengths:**

1. **Complete Technology Stack:** All technologies specified with verified versions
2. **Comprehensive Patterns:** Detailed patterns prevent AI agent conflicts
3. **Clear Structure:** Complete project structure with all files defined
4. **Requirements Coverage:** All MVP requirements (FR1-FR6) fully supported
5. **NFR Support:** All non-functional requirements architecturally addressed
6. **Offline-First:** Architecture fully supports 100% offline functionality
7. **Scalability:** Structure supports post-MVP features (gamification, social, mobile)
8. **Maintainability:** TypeScript strict mode, testing infrastructure, comprehensive documentation

**Areas for Future Enhancement:**

1. **Post-MVP Features:** Architecture ready for gamification, social features, mobile apps
2. **Performance Optimization:** Bundle analyzer, advanced caching strategies
3. **Developer Experience:** Additional tooling (Prettier, Husky, advanced ESLint rules)
4. **Monitoring:** Advanced analytics, performance monitoring dashboards
5. **SEO:** SSR migration for public pages (post-MVP)

### Implementation Handoff

**AI Agent Guidelines:**

1. **Follow Architectural Decisions Exactly:**
   - Use specified technology versions (Vite 5.1.4, React 18.2.0, TypeScript 5.2.2)
   - Follow all naming conventions (snake_case for DB, camelCase for app)
   - Respect project structure (components/, pages/, services/, context/)
   - Use patterns consistently (immutable state updates, error handling, loading states)

2. **Reference This Document:**
   - Check architectural decisions before making technology choices
   - Follow implementation patterns for consistency
   - Respect component and service boundaries
   - Use provided examples as templates

3. **Implementation Priorities:**
   - **P0 (Critical):** PWA support, testing framework, Zod validation schemas
   - **P1 (High):** Error boundaries, Sentry integration, CI/CD pipeline
   - **P2 (Medium):** Development tools (Prettier, Husky, bundle analyzer)

4. **Code Quality Standards:**
   - TypeScript strict mode enabled
   - ESLint rules enforced
   - All patterns followed (naming, structure, communication, process)
   - Tests written for all services and utilities

**First Implementation Priority:**

1. **Add PWA Support:**
   ```bash
   npm install -D vite-plugin-pwa
   ```
   Configure in `vite.config.ts` for offline-first requirement

2. **Configure Testing Framework:**
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
   ```
   Set up Vitest configuration and test structure

3. **Create Zod Validation Schemas:**
   Create `src/utils/validation.ts` with schemas for Player, League, Tournament, Match

4. **Implement Error Boundaries:**
   Create error boundary components for route-level error handling

**Architecture Document Status:** ✅ **COMPLETE AND VALIDATED**

This architecture document provides comprehensive guidance for consistent, high-quality implementation by AI agents. All decisions are documented, patterns are established, and structure is defined. The architecture is ready to guide the implementation phase.

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2026-01-23
**Document Location:** _bmad-output/planning-artifacts/architecture.md

### Final Architecture Deliverables

**📋 Complete Architecture Document**

- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**🏗️ Implementation Ready Foundation**

- **10** architectural decisions made (Data Architecture, Authentication & Security, API & Communication, Frontend Architecture, Infrastructure & Deployment)
- **5** pattern categories defined (Naming, Structure, Format, Communication, Process)
- **15+** architectural components specified (services, contexts, components, pages)
- **6** MVP functional requirements fully supported (FR1-FR6)
- **8** non-functional requirements architecturally addressed (NFR1-NFR8)

**📚 AI Agent Implementation Guide**

- Technology stack with verified versions (Vite 5.1.4, React 18.2.0, TypeScript 5.2.2, Zod 4.3.6)
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Implementation Handoff

**For AI Agents:**
This architecture document is your complete guide for implementing beer-pong-league. Follow all decisions, patterns, and structures exactly as documented.

**First Implementation Priority:**

1. **Add PWA Support:**
   ```bash
   npm install -D vite-plugin-pwa
   ```
   Configure in `vite.config.ts` for offline-first requirement

2. **Configure Testing Framework:**
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
   ```
   Set up Vitest configuration and test structure

3. **Create Zod Validation Schemas:**
   Create `src/utils/validation.ts` with schemas for Player, League, Tournament, Match

4. **Implement Error Boundaries:**
   Create error boundary components for route-level error handling

**Development Sequence:**

1. Initialize project using documented starter template (already done - Vite + React + TypeScript)
2. Set up development environment per architecture (PWA, testing, validation, error boundaries)
3. Implement core architectural foundations (services, contexts, patterns)
4. Build features following established patterns (FR1-FR6)
5. Maintain consistency with documented rules (naming, structure, communication, process)

### Quality Assurance Checklist

**✅ Architecture Coherence**

- [x] All decisions work together without conflicts
- [x] Technology choices are compatible (Vite, React, TypeScript, Supabase)
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices

**✅ Requirements Coverage**

- [x] All functional requirements are supported (FR1-FR6 MVP, FR7-FR16 post-MVP)
- [x] All non-functional requirements are addressed (NFR1-NFR8)
- [x] Cross-cutting concerns are handled (10 concerns identified and addressed)
- [x] Integration points are defined (Supabase, Vercel, Sentry, PWA)

**✅ Implementation Readiness**

- [x] Decisions are specific and actionable (all with versions and rationale)
- [x] Patterns prevent agent conflicts (comprehensive naming, structure, format rules)
- [x] Structure is complete and unambiguous (all files and directories defined)
- [x] Examples are provided for clarity (good examples and anti-patterns for all patterns)

### Project Success Factors

**🎯 Clear Decision Framework**
Every technology choice was made collaboratively with clear rationale, ensuring all stakeholders understand the architectural direction. All 10 major decisions are documented with specific versions, rationale, and impact analysis.

**🔧 Consistency Guarantee**
Implementation patterns and rules ensure that multiple AI agents will produce compatible, consistent code that works together seamlessly. 15+ potential conflict points identified and addressed with comprehensive patterns.

**📋 Complete Coverage**
All project requirements are architecturally supported, with clear mapping from business needs (FR1-FR6) to technical implementation (services, components, database). 6 MVP requirements + 8 NFRs fully addressed.

**🏗️ Solid Foundation**
The chosen starter template (Vite + React + TypeScript) and architectural patterns provide a production-ready foundation following current best practices. All technology versions verified and compatible.

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.
