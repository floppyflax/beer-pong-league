---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: 'complete'
completedAt: '2026-01-23'
inputDocuments: 
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/project-context.md
workflowType: 'epics-and-stories'
project_name: 'beer-pong-league'
user_name: 'floppyflax'
date: '2026-01-23'
---

# beer-pong-league - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for beer-pong-league, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**FR1: Championnat Management**
- FR1.1: Création de Championnat (P0 MVP)
- FR1.2: Rejoindre un Championnat (P0 MVP)
- FR1.3: Gestion des Participants (P0 MVP)

**FR2: Match Management**
- FR2.1: Enregistrement de Match (P0 MVP)
- FR2.2: Calcul ELO Automatique (P0 MVP)
- FR2.3: Anti-Triche Optionnel (P1 MVP)

**FR3: Classements et Stats**
- FR3.1: Classement en Temps Réel (P0 MVP)
- FR3.2: Statistiques Personnelles (P0 MVP)

**FR4: Authentification et Identité**
- FR4.1: Authentification Optionnelle (P0 MVP)
- FR4.2: Gestion d'Identité Dual (P0 MVP)

**FR5: Interface Utilisateur**
- FR5.1: Design "Alcoolisé-Friendly" (P0 MVP)
- FR5.2: Responsive Web (P0 MVP)

**FR6: Partage et Découverte**
- FR6.1: QR Code d'Invitation (P0 MVP)
- FR6.2: Découverte de Championnats (P2 Post-MVP)

**FR7: Écran de Projection (Post-MVP)**
- FR7.1: Affichage Temps Réel (P1 V1.5)
- FR7.2: Animations et Effets Visuels (P2 V2)

**FR8: Partage Social (Post-MVP)**
- FR8.1: Partage de Classement (P1 V2)
- FR8.2: Partage d'Achievements (P2 V2)

**FR9: Notifications (Post-MVP)**
- FR9.1: Notifications Push Mobile (P1 V1.5)
- FR9.2: Notifications In-App (P1 V1.5)

**FR10: Gamification (Post-MVP)**
- FR10.1: Badges et Achievements (P2 V2)
- FR10.2: Streaks et Séries (P2 V2)
- FR10.3: Défis et Challenges (P3 V2.5+)

**FR11: Fonctionnalités Sociales Avancées (Post-MVP)**
- FR11.1: Rivalités Automatiques (P3 V2.5)
- FR11.2: Comparaison avec Amis (P3 V2.5)
- FR11.3: Feed Social (P3 V2.5)

**FR12: Ligues (Post-MVP)**
- FR12.1: Création de Ligue (P2 V2)
- FR12.2: Gestion de Ligue (P2 V2)
- FR12.3: Rejoindre une Ligue (P2 V2)

**FR13: Application Mobile (Post-MVP)**
- FR13.1: Application Mobile Native (P1 V1.5)
- FR13.2: Scan QR Code Mobile (P1 V1.5)
- FR13.3: Géolocalisation (P2 V2+)

**FR14: Monétisation (Post-MVP)**
- FR14.1: Paiement One-Time (P1 V1.5)
- FR14.2: Packs Supplémentaires (P1 V1.5)
- FR14.3: Abonnement Bars (P3 V3+)

**FR15: Analytics et Reporting (Post-MVP)**
- FR15.1: Dashboard Organisateur (P3 V3+)
- FR15.2: Rapports d'Engagement (P3 V3+)

**FR16: Multi-Platform Synchronisation**
- FR16.1: Synchronisation Web ↔ Mobile (P1 V1.5)
- FR16.2: Offline Support Web (P0 MVP)

### NonFunctional Requirements

**NFR1: Usability**
- NFR1.1: Simplicité d'Utilisation (Target: 90% users complete first match without help)
- NFR1.2: Accessibilité (WCAG AA minimum)

**NFR2: Reliability**
- NFR2.1: Disponibilité (Target: 99%+ uptime)
- NFR2.2: Robustesse (Comprehensive error handling, fallback mechanisms)

**NFR3: Performance**
- NFR3.1: Temps de Réponse (Target: < 2s load, < 500ms actions)
- NFR3.2: Scalabilité (Support 10x growth with < 10% degradation)
- NFR3.3: Temps Réel (Post-MVP: < 200ms latency for display view)

**NFR4: Security**
- NFR4.1: Authentification et Autorisation (Supabase Auth, RLS, CSRF protection)
- NFR4.2: Protection des Données (GDPR compliance, encryption)
- NFR4.3: Sécurité Paiements (Post-MVP: PCI-DSS compliance)

**NFR5: Maintainability**
- NFR5.1: Code Quality (TypeScript strict mode, ESLint, code reviews)
- NFR5.2: Tests (Unit, integration, E2E tests - to be implemented)

**NFR6: Integration**
- NFR6.1: Synchronisation Multi-Platform (Target: 100% sync success rate)
- NFR6.2: Intégrations Externes (Post-MVP: Payments, social media, POS systems)

**NFR7: Mobile-Specific Requirements (Post-MVP)**
- NFR7.1: Performance Mobile (Target: < 2s app launch, < 500ms actions)
- NFR7.2: Store Compliance (App Store, Play Store guidelines)
- NFR7.3: Device Features (Permissions, screen sizes, orientations)

**NFR8: SEO and Web Vitrine (Web App)**
- NFR8.1: SEO Performance (SSR for public pages, metadata optimization)
- NFR8.2: Partage Social (Open Graph, Twitter Cards)

### Additional Requirements

**From Architecture:**
- PWA Support: vite-plugin-pwa for offline-first (P0 Critical)
- Testing Framework: Vitest + React Testing Library (P0 Critical)
- Validation: Zod 4.3.6 schemas for all data types (P0 Critical)
- Error Boundaries: React error boundaries for route-level error handling (P1 High)
- Sentry Integration: Error monitoring and performance tracking (P1 High)
- CI/CD Pipeline: GitHub Actions with lint, type-check, test, build (P1 High)
- Code Splitting: Route-based + vendor chunks for performance (P1 High)
- Bundle Analyzer: Performance optimization insights (P2 Medium)
- Prettier Configuration: Code formatting consistency (P2 Medium)
- Husky Pre-commit Hooks: Pre-commit linting and formatting (P2 Medium)

**From UX Design:**
- 8 Custom Components Required: MatchRecordingForm, QRCodeDisplay, AnimatedLeaderboard, CelebrationAnimation, TournamentJoinFlow, ScoreInput, PositionChangeIndicator, DisplayViewComponents
- Animation Requirements: Celebration animations, position change animations, achievement celebrations
- Responsive Design: Mobile-first (320px-767px), Tablet (768px-1023px), Desktop (1024px+), Display View (1920px+)
- Accessibility: WCAG 2.1 Level AA compliance required
- Touch Optimization: 44px+ touch targets, thumb-zone optimization
- Bar Environment: Large buttons, high contrast, readable in dim lighting

**Code Cleanup Requirements (Ménage):**
- Remove unused imports (IdentityMergeService, AuthCallback, IdentityModal, AuthContext, DisplayView)
- Complete TODOs in code (TournamentJoin, DatabaseService, LeagueDashboard)
- Remove dead code comments (DisplayView)
- Remove unused variables (LeagueDashboard)
- Align code with architecture patterns (naming, structure, format)
- Remove obsolete status/phase report files (AUTH_IMPLEMENTATION_STATUS.md, IDENTITY_IMPLEMENTATION_STATUS.md, PHASE1-4_COMPLETION_REPORT.md)
- Remove or archive obsolete plan files (IMPLEMENTATION_PLAN_IDENTITY.md, MIGRATION_PLAN.md)
- Consolidate configuration documentation (GITHUB_PUSH.md, SUPABASE_REDIRECT_CONFIG.md, SUPABASE_SETUP.md → docs/)
- Remove unused code files (DisplayView.tsx, AuthCallback.tsx if confirmed unused)
- Consolidate duplicate documentation (docs/architecture.md vs _bmad-output/planning-artifacts/architecture.md)
- Organize all documentation in docs/ or _bmad-output/ directories

### FR Coverage Map

**FR1: Championnat Management** → Epic 3 (Tournament Creation & Management)
- FR1.1: Création de Championnat → Epic 3
- FR1.2: Rejoindre un Championnat → Epic 4 (Tournament Participation)
- FR1.3: Gestion des Participants → Epic 3

**FR2: Match Management** → Epic 5 (Match Recording & ELO System)
- FR2.1: Enregistrement de Match → Epic 5
- FR2.2: Calcul ELO Automatique → Epic 5
- FR2.3: Anti-Triche Optionnel → Epic 5

**FR3: Classements et Stats** → Epic 5 (Match Recording & ELO System)
- FR3.1: Classement en Temps Réel → Epic 5
- FR3.2: Statistiques Personnelles → Epic 5

**FR4: Authentification et Identité** → Epic 2 (User Identity & Authentication)
- FR4.1: Authentification Optionnelle → Epic 2
- FR4.2: Gestion d'Identité Dual → Epic 2

**FR5: Interface Utilisateur** → Epic 4 (Tournament Participation) + Epic 5
- FR5.1: Design "Alcoolisé-Friendly" → Epic 4
- FR5.2: Responsive Web → Epic 4

**FR6: Partage et Découverte** → Epic 3 + Epic 4
- FR6.1: QR Code d'Invitation → Epic 3
- FR6.2: Découverte de Championnats → Post-MVP (not in MVP epics)

**FR7-FR16: Post-MVP Requirements** → Future epics (not in MVP scope)

**NFR Coverage:**
- NFR1 (Usability) → Epic 4, Epic 5
- NFR2 (Reliability) → Epic 6 (Error Handling & Monitoring)
- NFR3 (Performance) → Epic 1 (Foundation), Epic 5
- NFR4 (Security) → Epic 2 (User Identity & Authentication)
- NFR5 (Maintainability) → Epic 1 (Foundation & Code Quality)
- NFR6 (Integration) → Epic 2, Epic 5
- NFR7-NFR8 (Post-MVP) → Future epics

## Epic List

### Epic 1: Foundation & Code Quality

**Goal:** Establish technical foundations and clean up existing codebase to ensure maintainable, testable, and production-ready codebase.

**User Outcome:** Developers and the system have a solid foundation with proper tooling, testing infrastructure, and clean codebase that enables reliable development and deployment.

**FRs covered:** NFR5 (Maintainability), Architecture requirements (PWA, testing, validation, monitoring, CI/CD), Code cleanup requirements

**Implementation Notes:**
- This epic includes code cleanup ("ménage") tasks: remove unused imports, complete TODOs, remove dead code, align with architecture patterns
- Sets up PWA support for offline-first requirement
- Configures testing framework for maintainability
- Implements validation schemas for data integrity
- Sets up error boundaries and monitoring infrastructure
- Establishes CI/CD pipeline for quality assurance

**Dependencies:** None (foundation epic)

---

### Epic 2: User Identity & Authentication

**Goal:** Users can authenticate with email+OTP or play as anonymous guests, with seamless identity management and data merging.

**User Outcome:** Users can create accounts to preserve their stats across devices, or play immediately as guests without friction, with automatic data merging when they create an account later.

**FRs covered:** FR4 (Authentification et Identité), NFR4 (Security), NFR6.1 (Multi-Platform Sync)

**Implementation Notes:**
- Email + OTP authentication via Supabase Auth
- Anonymous user support with device fingerprinting
- Identity merge service for seamless guest → account conversion
- Dual identity system (authenticated + anonymous)
- localStorage + Supabase synchronization

**Dependencies:** Epic 1 (Foundation) - needs validation schemas and error handling

---

### Epic 3: Tournament Creation & Management

**Goal:** Organizers can create tournaments, generate QR codes for invitations, and manage participants.

**User Outcome:** Organizers can quickly create tournaments with minimal friction, generate shareable QR codes, and see who's participating in their tournaments.

**FRs covered:** FR1.1 (Création de Championnat), FR1.3 (Gestion des Participants), FR6.1 (QR Code d'Invitation)

**Implementation Notes:**
- Simple tournament creation form (3-5 fields max)
- Automatic QR code generation for invitations
- Support for 1v1, 2v2, 3v3 formats
- Participant list and management
- Integration with Epic 2 for creator authentication

**Dependencies:** Epic 2 (User Identity) - needs authentication for tournament creation

---

### Epic 4: Tournament Participation

**Goal:** Players can join tournaments via QR code and use the application with an alcohol-friendly, responsive interface.

**User Outcome:** Players can scan a QR code and join a tournament in under 30 seconds without creating an account, using an intuitive interface optimized for mobile and bar environments.

**FRs covered:** FR1.2 (Rejoindre un Championnat), FR5 (Interface Utilisateur), FR6.1 (QR Code - joining side)

**Implementation Notes:**
- QR code scanning and tournament joining flow
- Zero-friction entry (no account required)
- Alcohol-friendly UI design (large buttons, minimal flow, high contrast)
- Responsive design (mobile-first, tablet, desktop)
- Touch-optimized interface (44px+ targets)

**Dependencies:** Epic 3 (Tournament Creation) - needs tournaments to join

---

### Epic 5: Match Recording & ELO System

**Goal:** Players can record matches, see automatic ELO calculations, and view real-time leaderboards with personal statistics.

**User Outcome:** Players can quickly record match results, see their ELO update immediately, view their position on the leaderboard, and track their personal statistics over time.

**FRs covered:** FR2 (Match Management), FR3 (Classements et Stats), NFR3.1 (Performance - < 500ms actions)

**Implementation Notes:**
- Match recording form (simple, mobile-optimized)
- Automatic ELO calculation after each match
- Real-time leaderboard updates (< 500ms)
- Personal statistics display (ELO, wins, losses, matches, streak)
- Optional anti-cheat confirmation workflow
- Optimistic UI updates for instant feedback

**Dependencies:** Epic 4 (Tournament Participation) - needs players in tournaments to record matches

---

### Epic 6: Error Handling & Monitoring

**Goal:** System has comprehensive error handling, monitoring, and deployment pipeline for production reliability.

**User Outcome:** System is reliable, errors are handled gracefully with user-friendly messages, and developers can monitor and debug issues effectively.

**FRs covered:** NFR2 (Reliability), Architecture requirements (Error boundaries, Sentry, CI/CD)

**Implementation Notes:**
- React error boundaries for route-level error handling
- Sentry integration for error tracking and performance monitoring
- CI/CD pipeline with GitHub Actions (lint, type-check, test, build)
- Comprehensive error handling patterns across all services
- User-friendly error messages via react-hot-toast

**Dependencies:** Epic 1 (Foundation) - builds on testing and validation infrastructure

## Epic 1: Foundation & Code Quality

**Goal:** Establish technical foundations and clean up existing codebase to ensure maintainable, testable, and production-ready codebase.

**User Outcome:** Developers and the system have a solid foundation with proper tooling, testing infrastructure, and clean codebase that enables reliable development and deployment.

**FRs covered:** NFR5 (Maintainability), Architecture requirements (PWA, testing, validation, monitoring, CI/CD), Code cleanup requirements

### Story 1.1: Code Cleanup and Architecture Alignment

As a developer,
I want the codebase cleaned up and aligned with architecture patterns,
So that the code is maintainable, consistent, and follows established conventions.

**Acceptance Criteria:**

**Given** the existing codebase with TODOs, unused imports, dead code, and obsolete files
**When** I review the codebase
**Then** all unused imports are removed (IdentityMergeService, AuthCallback, IdentityModal, AuthContext, DisplayView)
**And** all TODOs are completed or documented (TournamentJoin, DatabaseService, LeagueDashboard)
**And** all dead code comments are removed (DisplayView)
**And** all unused variables are removed (LeagueDashboard)
**And** all code follows architecture naming patterns (PascalCase components, camelCase functions, snake_case database)
**And** all code follows architecture structure patterns (components/, pages/, services/ organization)
**And** all code follows architecture format patterns (snake_case ↔ camelCase transformations)
**And** obsolete status/phase report files are removed (AUTH_IMPLEMENTATION_STATUS.md, IDENTITY_IMPLEMENTATION_STATUS.md, PHASE1-4_COMPLETION_REPORT.md)
**And** obsolete plan files are removed or archived (IMPLEMENTATION_PLAN_IDENTITY.md, MIGRATION_PLAN.md)
**And** obsolete configuration documentation is consolidated (GITHUB_PUSH.md, SUPABASE_REDIRECT_CONFIG.md, SUPABASE_SETUP.md → merge into docs/)
**And** unused code files are removed (DisplayView.tsx if confirmed unused, AuthCallback.tsx if replaced)
**And** duplicate documentation is consolidated (docs/architecture.md vs _bmad-output/planning-artifacts/architecture.md)
**And** all remaining documentation is organized in docs/ or _bmad-output/ directories

**Technical Notes:**
- Remove unused imports identified: `IdentityMergeService.ts`, `AuthCallback.tsx`, `IdentityModal.tsx`, `AuthContext.tsx`, `DisplayView.tsx`
- Complete TODOs: TournamentJoin (account check), DatabaseService (user_id mapping), LeagueDashboard (edit player modal)
- Align with patterns from `_bmad-output/planning-artifacts/architecture.md`
- **File Cleanup Tasks:**
  - Remove obsolete status files: `AUTH_IMPLEMENTATION_STATUS.md`, `IDENTITY_IMPLEMENTATION_STATUS.md`
  - Remove obsolete phase reports: `PHASE1_COMPLETION_REPORT.md`, `PHASE2_COMPLETION_REPORT.md`, `PHASE3_COMPLETION_REPORT.md`, `PHASE4_COMPLETION_REPORT.md`
  - Archive or remove obsolete plans: `IMPLEMENTATION_PLAN_IDENTITY.md`, `MIGRATION_PLAN.md`
  - Consolidate configuration docs: Merge `GITHUB_PUSH.md`, `SUPABASE_REDIRECT_CONFIG.md`, `SUPABASE_SETUP.md` into `docs/deployment-guide.md` or `docs/setup-guide.md`
  - Verify and remove unused code files: Check if `src/pages/DisplayView.tsx`, `src/pages/AuthCallback.tsx` are actually used
  - Consolidate duplicate docs: Keep `_bmad-output/planning-artifacts/architecture.md` as source of truth, remove or redirect `docs/architecture.md`
  - Organize remaining docs: Ensure all documentation is in `docs/` (user-facing) or `_bmad-output/` (planning artifacts)

### Story 1.2: PWA Support Setup

As a user,
I want the application to work offline with PWA support,
So that I can use it even with unstable internet connection in bar environments.

**Acceptance Criteria:**

**Given** the Vite + React project
**When** I install and configure vite-plugin-pwa
**Then** `vite-plugin-pwa` is installed as dev dependency
**And** PWA plugin is configured in `vite.config.ts`
**And** service worker is generated with Workbox
**And** `public/manifest.json` is created with app metadata
**And** PWA icons are added to `public/icons/` (192x192, 512x512, apple-touch-icon)
**And** offline support is enabled for all static assets
**And** app can be installed on mobile devices
**And** offline functionality works with localStorage fallback

**Technical Notes:**
- Install: `npm install -D vite-plugin-pwa`
- Configure in `vite.config.ts` with Workbox strategy
- Create manifest with app name, icons, theme colors
- Test offline functionality with network throttling

### Story 1.3: Testing Framework Configuration

As a developer,
I want a testing framework configured,
So that I can write and run tests to ensure code quality and prevent regressions.

**Acceptance Criteria:**

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

**Technical Notes:**
- Install: `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
- Configure Vitest for React and TypeScript
- Set up jsdom for DOM testing
- Create mock for Supabase client

### Story 1.4: Zod Validation Schemas

As a developer,
I want Zod validation schemas for all data types,
So that data is validated at runtime and type-safe throughout the application.

**Acceptance Criteria:**

**Given** the need for client-side validation
**When** I create Zod validation schemas
**Then** `src/utils/validation.ts` is created
**And** Zod 4.3.6 is installed (`npm install zod@^4.0.0`)
**And** schemas are created for Player, League, Tournament, Match types
**And** schemas match TypeScript types in `src/types.ts`
**And** schemas include validation rules (required fields, types, constraints)
**And** schemas support transformation between snake_case (DB) and camelCase (app)
**And** validation functions are exported for use in forms and services

**Technical Notes:**
- Install: `npm install zod@^4.0.0`
- Create schemas matching existing TypeScript types
- Include validation for ELO ranges, date formats, string lengths
- Support optional fields for anonymous users

### Story 1.5: Error Boundaries Implementation

As a user,
I want errors to be handled gracefully with user-friendly messages,
So that the application doesn't crash and I understand what went wrong.

**Acceptance Criteria:**

**Given** the need for error handling
**When** I implement error boundaries
**Then** error boundary component is created in `src/components/ErrorBoundary.tsx`
**And** error boundary wraps route components in `App.tsx`
**And** error boundary displays user-friendly error message
**And** error boundary logs errors for debugging
**And** error boundary provides recovery option (retry, go home)
**And** Sentry integration is prepared (to be connected in Epic 6)

**Technical Notes:**
- Create React error boundary component
- Wrap routes in App.tsx
- Use react-hot-toast for user notifications
- Prepare for Sentry error reporting

### Story 1.6: Code Splitting and Performance Optimization

As a user,
I want the application to load quickly,
So that I can start using it without long wait times.

**Acceptance Criteria:**

**Given** the need for performance optimization
**When** I implement code splitting
**Then** route-based code splitting is implemented using React.lazy()
**And** all page components are lazy-loaded
**And** vendor chunks are configured in `vite.config.ts` (react-vendor, supabase-vendor)
**And** Suspense boundaries are added for loading states
**And** initial bundle size is optimized
**And** build output shows chunk sizes within limits (< 500KB per chunk)

**Technical Notes:**
- Use React.lazy() for all pages
- Configure manualChunks in vite.config.ts
- Add Suspense with LoadingSpinner
- Verify bundle sizes with build command

## Epic 2: User Identity & Authentication

**Goal:** Users can authenticate with email+OTP or play as anonymous guests, with seamless identity management and data merging.

**User Outcome:** Users can create accounts to preserve their stats across devices, or play immediately as guests without friction, with automatic data merging when they create an account later.

**FRs covered:** FR4 (Authentification et Identité), NFR4 (Security), NFR6.1 (Multi-Platform Sync)

### Story 2.1: Email + OTP Authentication Flow

As a user,
I want to authenticate with email + OTP,
So that I can create an account without managing passwords and preserve my stats across devices.

**Acceptance Criteria:**

**Given** a user wants to create an account
**When** they enter their email in the auth modal
**Then** OTP is sent via Supabase Auth
**And** user receives email with magic link
**And** clicking the link authenticates the user
**And** user session is maintained
**And** user profile is created in Supabase `users` table
**And** user can sign out

**Technical Notes:**
- Use existing AuthService and AuthModal components
- Verify Supabase Auth email + OTP configuration
- Ensure session persistence
- Test authentication flow end-to-end

### Story 2.2: Anonymous User Support

As a user,
I want to play without creating an account,
So that I can start playing immediately without any friction.

**Acceptance Criteria:**

**Given** a user wants to play without account
**When** they join a tournament
**Then** anonymous user is created with device fingerprint
**And** anonymous user data is stored in `anonymous_users` table
**And** anonymous user can play and record matches
**And** anonymous user data is stored in localStorage
**And** anonymous user can later create account to preserve stats

**Technical Notes:**
- Use existing AnonymousUserService
- Verify device fingerprinting works
- Test localStorage fallback
- Ensure anonymous users can participate fully

### Story 2.3: Identity Merge Service

As a user,
I want my anonymous data merged when I create an account,
So that I don't lose my stats and match history.

**Acceptance Criteria:**

**Given** an anonymous user has played matches
**When** they create an account with email + OTP
**Then** IdentityMergeService merges anonymous data to authenticated user
**And** all league_players records are migrated
**And** all tournament_players records are migrated
**And** all matches are updated with new user_id
**And** all elo_history records are migrated
**And** merge is logged in `user_identity_merges` table
**And** anonymous user record is marked as merged
**And** user sees their complete stats after merge

**Technical Notes:**
- Use existing IdentityMergeService
- Verify all data migration paths
- Test merge with various data scenarios
- Ensure no data loss during merge

### Story 2.4: Dual Identity State Management

As a user,
I want the system to handle both authenticated and anonymous identities seamlessly,
So that I can switch between modes without losing functionality.

**Acceptance Criteria:**

**Given** the dual identity system
**When** user is authenticated
**Then** IdentityContext provides authenticated user data
**And** user can access all authenticated features
**When** user is anonymous
**Then** IdentityContext provides anonymous user data
**And** user can access guest features
**And** system handles identity switching smoothly
**And** localStorage and Supabase are synchronized correctly

**Technical Notes:**
- Verify IdentityContext handles both identity types
- Test localStorage ↔ Supabase sync
- Ensure smooth transitions between identity states

## Epic 3: Tournament Creation & Management

**Goal:** Organizers can create tournaments, generate QR codes for invitations, and manage participants.

**User Outcome:** Organizers can quickly create tournaments with minimal friction, generate shareable QR codes, and see who's participating in their tournaments.

**FRs covered:** FR1.1 (Création de Championnat), FR1.3 (Gestion des Participants), FR6.1 (QR Code d'Invitation)

### Story 3.1: Tournament Creation Form

As an organizer,
I want to create a tournament with minimal fields,
So that I can set up an event quickly without friction.

**Acceptance Criteria:**

**Given** an authenticated user
**When** they navigate to create tournament page
**Then** simple form is displayed with required fields (name, date, format)
**And** form has maximum 3-5 fields
**And** form supports 1v1, 2v2, 3v3 formats
**And** form validates input using Zod schemas
**And** form submits tournament to Supabase
**And** tournament is created with creator_user_id
**And** tournament is saved to localStorage as fallback
**And** user is redirected to tournament dashboard after creation
**And** success message is displayed

**Technical Notes:**
- Use existing CreateTournament page
- Integrate Zod validation from Story 1.4
- Ensure offline support with localStorage
- Test form validation and submission

### Story 3.2: QR Code Generation and Display

As an organizer,
I want a QR code for my tournament,
So that participants can join easily by scanning it.

**Acceptance Criteria:**

**Given** a tournament is created
**When** organizer views the tournament
**Then** QR code is automatically generated for the tournament
**And** QR code contains tournament join URL
**And** QR code is displayed prominently
**And** QR code can be shared (displayed, printed)
**And** scanning QR code opens tournament join page
**And** QR code works on mobile devices

**Technical Notes:**
- Use existing qrcode.react library
- Create QRCodeDisplay component (from UX spec)
- Generate URL: `/tournament/join/:tournamentId`
- Test QR code scanning on mobile

### Story 3.3: Participant Management

As an organizer,
I want to see who's participating in my tournament,
So that I can track engagement and manage the event.

**Acceptance Criteria:**

**Given** a tournament exists with participants
**When** organizer views tournament dashboard
**Then** list of participants is displayed
**And** each participant shows name and basic stats (ELO, matches played)
**And** participant list is readable and clear
**And** participant count is displayed
**And** list updates when new participants join

**Technical Notes:**
- Use existing TournamentDashboard
- Display tournament_players with user/anonymous_user info
- Show basic stats from league_players if available
- Ensure real-time updates (optimistic + Supabase sync)

## Epic 4: Tournament Participation

**Goal:** Players can join tournaments via QR code and use the application with an alcohol-friendly, responsive interface.

**User Outcome:** Players can scan a QR code and join a tournament in under 30 seconds without creating an account, using an intuitive interface optimized for mobile and bar environments.

**FRs covered:** FR1.2 (Rejoindre un Championnat), FR5 (Interface Utilisateur), FR6.1 (QR Code - joining side)

### Story 4.1: QR Code Scanning and Tournament Join

As a player,
I want to join a tournament by scanning a QR code,
So that I can participate quickly without typing URLs or creating accounts.

**Acceptance Criteria:**

**Given** a player scans a tournament QR code
**When** QR code is scanned on mobile
**Then** tournament join page opens automatically
**And** player can enter their name (no account required)
**And** player joins tournament in < 30 seconds
**And** player is added to tournament_players
**And** anonymous user is created if needed
**And** player is redirected to tournament dashboard
**And** success message confirms participation

**Technical Notes:**
- Use existing TournamentJoin page
- Implement QR code scanning (camera access on mobile)
- Support manual URL entry as fallback
- Create anonymous user if not authenticated
- Test join flow end-to-end

### Story 4.2: Alcohol-Friendly UI Design

As a player in a bar environment,
I want large, clear buttons and simple flows,
So that I can use the app easily even after a few drinks.

**Acceptance Criteria:**

**Given** the application interface
**When** user interacts with the app
**Then** all buttons are minimum 44x44px touch targets
**And** primary actions require maximum 2-3 clicks
**And** text has high contrast (WCAG AA minimum)
**And** font sizes are large and readable
**And** navigation is intuitive
**And** error messages are clear and actionable
**And** interface works in dim lighting conditions

**Technical Notes:**
- Review all components for touch target sizes
- Ensure Tailwind classes use large sizes
- Verify contrast ratios meet WCAG AA
- Test in various lighting conditions
- Optimize for thumb-zone on mobile

### Story 4.3: Responsive Design Implementation

As a user,
I want the app to work on any device,
So that I can use it on my phone, tablet, or computer.

**Acceptance Criteria:**

**Given** the application
**When** accessed on mobile (320px-767px)
**Then** layout is optimized for mobile (single column, large touch targets)
**And** navigation uses drawer/menu pattern
**And** forms are mobile-friendly
**When** accessed on tablet (768px-1023px)
**Then** layout adapts to tablet size (2-column where appropriate)
**When** accessed on desktop (1024px+)
**Then** layout uses available space efficiently
**And** all features work across all breakpoints
**And** offline functionality works on all devices

**Technical Notes:**
- Use Tailwind responsive breakpoints
- Test on multiple device sizes
- Ensure PWA works on all devices
- Verify localStorage fallback on all platforms

## Epic 5: Match Recording & ELO System

**Goal:** Players can record matches, see automatic ELO calculations, and view real-time leaderboards with personal statistics.

**User Outcome:** Players can quickly record match results, see their ELO update immediately, view their position on the leaderboard, and track their personal statistics over time.

**FRs covered:** FR2 (Match Management), FR3 (Classements et Stats), NFR3.1 (Performance - < 500ms actions)

### Story 5.1: Match Recording Form

As a player,
I want to record a match quickly,
So that the leaderboard updates immediately and I can continue playing.

**Acceptance Criteria:**

**Given** a player is in a tournament
**When** they want to record a match
**Then** match recording form is displayed
**And** form allows selection of players for team A and team B
**And** form allows entry of scores
**And** form supports 1v1, 2v2, 3v3 formats
**And** form validates input (scores, player selection)
**And** form submits match in < 1 minute
**And** match is saved to Supabase and localStorage
**And** UI updates optimistically before server confirmation
**And** success message confirms match recording

**Technical Notes:**
- Create MatchRecordingForm component (from UX spec)
- Integrate Zod validation for match data
- Use optimistic updates for instant feedback
- Support offline recording with sync

### Story 5.2: Automatic ELO Calculation

As a player,
I want my ELO to update automatically after each match,
So that I can see my progression without manual calculations.

**Acceptance Criteria:**

**Given** a match is recorded
**When** match result is saved
**Then** ELO is calculated automatically for all players
**And** ELO changes are stored in elo_history table
**And** player ELO is updated in league_players table
**And** ELO calculation uses standard ELO algorithm
**And** ELO changes are displayed to user
**And** calculation happens server-side or client-side consistently

**Technical Notes:**
- Use existing ELO calculation utility
- Verify calculation matches standard ELO formula
- Store ELO history for tracking
- Update leaderboard immediately after calculation

### Story 5.3: Real-Time Leaderboard Display

As a player,
I want to see the leaderboard update in real-time,
So that I can track my position and see how I'm doing.

**Acceptance Criteria:**

**Given** a tournament with matches
**When** player views the leaderboard
**Then** leaderboard shows all players ranked by ELO
**And** top 3 players are visually highlighted
**And** position changes are animated when ELO updates
**And** leaderboard updates automatically after each match (< 500ms)
**And** leaderboard is clear and readable
**And** player can see their own position clearly
**And** ELO changes are displayed (positive/negative indicators)

**Technical Notes:**
- Create leaderboard component (can be enhanced with AnimatedLeaderboard from UX spec post-MVP)
- Use optimistic updates for instant feedback
- Implement position change animations
- Ensure < 500ms update time

### Story 5.4: Personal Statistics Display

As a player,
I want to see my personal statistics,
So that I can track my performance over time.

**Acceptance Criteria:**

**Given** a player has played matches
**When** they view their profile or stats
**Then** current ELO is displayed prominently
**And** total matches played is shown
**And** wins and losses are displayed
**And** current streak is shown (win streak or loss streak)
**And** stats are accessible from player profile page
**And** stats update in real-time after matches

**Technical Notes:**
- Use existing PlayerProfile page
- Display stats from league_players table
- Calculate and display streak
- Ensure stats are accurate and up-to-date

### Story 5.5: Optional Anti-Cheat Confirmation

As an organizer,
I want to enable anti-cheat confirmation for my tournament,
So that match results are verified and reliable.

**Acceptance Criteria:**

**Given** a tournament with anti-cheat enabled
**When** a match is recorded
**Then** match status is set to "pending"
**And** losing team receives confirmation request
**And** match is not included in rankings until confirmed
**And** organizer can see pending matches
**And** match can be confirmed or rejected
**And** confirmed matches update rankings
**And** rejected matches are removed or flagged

**Technical Notes:**
- Use existing anti-cheat schema (matches.status field)
- Implement confirmation workflow
- Update match status based on confirmation
- Handle pending/confirmed/rejected states

## Epic 6: Error Handling & Monitoring

**Goal:** System has comprehensive error handling, monitoring, and deployment pipeline for production reliability.

**User Outcome:** System is reliable, errors are handled gracefully with user-friendly messages, and developers can monitor and debug issues effectively.

**FRs covered:** NFR2 (Reliability), Architecture requirements (Error boundaries, Sentry, CI/CD)

### Story 6.1: Sentry Error Monitoring Integration

As a developer,
I want error monitoring and tracking,
So that I can identify and fix issues in production quickly.

**Acceptance Criteria:**

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

**Technical Notes:**
- Install: `npm install @sentry/react`
- Configure Sentry DSN from environment variables
- Integrate with error boundaries from Story 1.5
- Set up Vercel Sentry integration

### Story 6.2: CI/CD Pipeline Setup

As a developer,
I want automated quality checks before deployment,
So that only tested, validated code is deployed to production.

**Acceptance Criteria:**

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

**Technical Notes:**
- Create GitHub Actions workflow
- Configure all quality checks
- Ensure workflow blocks deployment on failure
- Test workflow with sample commits

### Story 6.3: Comprehensive Error Handling Patterns

As a user,
I want clear error messages when something goes wrong,
So that I understand what happened and what to do next.

**Acceptance Criteria:**

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

**Technical Notes:**
- Implement error handling in all services
- Create error message constants
- Use react-hot-toast consistently
- Ensure offline fallback works
- Test all error scenarios

---

## Final Validation Summary

**Date:** 2026-01-23  
**Status:** ✅ **COMPLETE AND VALIDATED**

### Validation Results

**FR Coverage:** ✅ 100% (All MVP FRs covered)
- FR1.1-FR1.3 → Epic 3, Epic 4
- FR2.1-FR2.3 → Epic 5
- FR3.1-FR3.2 → Epic 5
- FR4.1-FR4.2 → Epic 2
- FR5.1-FR5.2 → Epic 4
- FR6.1 → Epic 3, Epic 4

**NFR Coverage:** ✅ 100% (All MVP NFRs addressed)
- NFR1 (Usability) → Epic 4, Epic 5
- NFR2 (Reliability) → Epic 6
- NFR3 (Performance) → Epic 1, Epic 5
- NFR4 (Security) → Epic 2
- NFR5 (Maintainability) → Epic 1
- NFR6 (Integration) → Epic 2, Epic 5

**Architecture Requirements:** ✅ 100% (All requirements covered)
- PWA Support → Epic 1 Story 1.2
- Testing Framework → Epic 1 Story 1.3
- Zod Validation → Epic 1 Story 1.4
- Error Boundaries → Epic 1 Story 1.5
- Code Splitting → Epic 1 Story 1.6
- Sentry Integration → Epic 6 Story 6.1
- CI/CD Pipeline → Epic 6 Story 6.2
- Error Handling → Epic 6 Story 6.3

**Story Quality:** ✅ Validated
- All 24 stories are completable by a single dev agent
- All stories have clear acceptance criteria (Given/When/Then)
- All stories reference specific FRs
- All stories include technical notes
- No forward dependencies within epics

**Dependency Validation:** ✅ Validated
- Epic independence confirmed
- Within-epic dependencies are logical and sequential
- No circular dependencies
- Foundation epic (Epic 1) has no dependencies

**Code Cleanup:** ✅ Integrated
- Code cleanup tasks in Story 1.1
- File cleanup tasks in Story 1.1
- Architecture alignment in Story 1.1

### Epic Summary

**Total Epics:** 6 MVP epics
**Total Stories:** 24 stories
**Epic Breakdown:**
- Epic 1: Foundation & Code Quality (6 stories)
- Epic 2: User Identity & Authentication (4 stories)
- Epic 3: Tournament Creation & Management (3 stories)
- Epic 4: Tournament Participation (3 stories)
- Epic 5: Match Recording & ELO System (5 stories)
- Epic 6: Error Handling & Monitoring (3 stories)

### Implementation Readiness

✅ **READY FOR DEVELOPMENT**

All requirements are decomposed into actionable stories. Each story:
- Has clear acceptance criteria
- Is independently completable
- References specific requirements
- Includes technical implementation notes
- Follows architecture patterns

The epics and stories document is complete and ready to guide development implementation.
