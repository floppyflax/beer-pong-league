# Beer Pong League - Component Inventory

**Date:** 2026-01-22

## Overview

React components live in `src/components/` and `src/components/layout/`. Page-level views are in `src/pages/`. No dedicated design system; shared UI is built with Tailwind and Lucide icons.

## Layout

| Component   | Path                    | Purpose                          |
|------------|-------------------------|----------------------------------|
| MenuDrawer | `components/layout/MenuDrawer` | Main navigation drawer       |

## Modals & Overlays

| Component          | Path                        | Purpose                          |
|--------------------|-----------------------------|----------------------------------|
| AuthModal          | `components/AuthModal`      | Auth (email/OTP)                 |
| IdentityModal      | `components/IdentityModal`  | Identity selection/creation      |
| CreateIdentityModal| `components/CreateIdentityModal` | Create identity              |

## Display & Feedback

| Component       | Path                        | Purpose                          |
|-----------------|-----------------------------|----------------------------------|
| EloChangeDisplay| `components/EloChangeDisplay` | ELO delta display              |
| EmptyState      | `components/EmptyState`     | Empty list / no-data state       |
| LoadingSpinner  | `components/LoadingSpinner` | Loading indicator                |
| IdentityInitializer | `components/IdentityInitializer` | Identity bootstrap / init   |

## Pages (Route-Level Views)

| Page                 | Path                | Purpose                          |
|----------------------|---------------------|----------------------------------|
| CreateLeague         | `pages/CreateLeague`| Create a league                  |
| LeagueDashboard      | `pages/LeagueDashboard` | League detail, players, ELO  |
| CreateTournament     | `pages/CreateTournament` | Create tournament            |
| TournamentDashboard  | `pages/TournamentDashboard` | Tournament detail, matches  |
| PlayerProfile        | `pages/PlayerProfile` | Player profile, stats         |
| UserProfile          | `pages/UserProfile` | Current user profile             |
| DisplayView          | `pages/DisplayView` | Live display / projection        |
| TournamentDisplayView| `pages/TournamentDisplayView` | Tournament display view   |
| TournamentInvite     | `pages/TournamentInvite` | Invite to tournament        |
| TournamentJoin       | `pages/TournamentJoin` | Join tournament                  |
| AuthCallback         | `pages/AuthCallback` | Auth redirect handling           |

## Context Providers

| Context         | Path               | Purpose                          |
|-----------------|--------------------|----------------------------------|
| AuthContext     | `context/AuthContext` | Auth state, sign-in/out       |
| IdentityContext | `context/IdentityContext` | Identity (auth + anonymous)  |
| LeagueContext   | `context/LeagueContext` | League/tournament/match data  |

## Hooks

| Hook        | Path           | Purpose                          |
|-------------|----------------|----------------------------------|
| useAuth     | `hooks/useAuth`| Access auth context              |
| useIdentity | `hooks/useIdentity` | Access identity context     |

## Patterns

- **State:** React Context + hooks; no Redux/MobX.
- **Styling:** Tailwind CSS; utility-first.
- **Icons:** Lucide React.
- **Toasts:** react-hot-toast (configured in `App.tsx`).
- **Routing:** React Router; routes and layout in `App.tsx`.

## Reusable vs Page-Specific

- **Reusable:** MenuDrawer, AuthModal, IdentityModal, CreateIdentityModal, EloChangeDisplay, EmptyState, LoadingSpinner, IdentityInitializer.
- **Page-specific:** All `pages/*` components; they may use shared components but are tied to routes.

---

_Generated using BMAD Method `document-project` workflow_
