# Beer Pong League - UX/UI Design & Responsive Architecture

**Version:** 1.0  
**Date:** 2026-02-03  
**Status:** Draft  
**Author:** Sally (UX Designer) + Mary (Analyst) + John (PM)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Design Principles](#design-principles)
3. [Navigation Architecture](#navigation-architecture)
4. [Responsive Strategy](#responsive-strategy)
5. [Page Specifications](#page-specifications)
6. [Component Library](#component-library)
7. [Permissions & Business Rules](#permissions--business-rules)
8. [Stats Premium Feature](#stats-premium-feature)
9. [Implementation Priorities](#implementation-priorities)

---

## Executive Summary

### Vision
Beer Pong League app refonte complète vers une architecture **mobile-first responsive** avec navigation cohérente, hiérarchie claire, et features premium bien définies.

### Key Changes from Current Implementation
- **Navigation**: Bottom Tab Menu (mobile) → Left Sidebar (desktop)
- **Structure**: Tab-based navigation pour Tournois/Leagues avec contextual actions
- **Premium**: Onglet Stats premium-only avec value prop claire
- **Permissions**: Système clair Admin vs Joueur avec options configurables
- **Display Mode**: Mode diffusion plein écran pour admins

### Success Metrics
- Réduction du nombre de clics pour actions principales (3 clics max)
- Amélioration de la lisibilité (scan rapide < 10 secondes)
- Augmentation des conversions premium (Stats feature)
- Réduction des erreurs de navigation (retour intuitif)

---

## Design Principles

### 1. Mobile-First Approach
- Design optimisé pour écrans 375px-428px (iPhone SE à iPhone Pro Max)
- Touch targets minimum 44x44px
- Bottom menus accessibles au pouce
- Progressive enhancement pour desktop

### 2. Hierarchy & Clarity
- **3 niveaux de navigation**:
  - Niveau 1: Bottom Tab Menu (pages principales)
  - Niveau 2: Bottom Menu Spécifique (actions contextuelles listes)
  - Niveau 3: Contextual Bar (actions contextuelles détails)
- Bouton retour **toujours en haut à gauche** (standard mobile)

### 3. Consistency
- Patterns réutilisables (EmptyState, Cards, Modals)
- Terminologie cohérente (Classement, Matchs, Stats, Paramètres)
- Actions similaires = même emplacement

### 4. Progressive Disclosure
- Afficher le minimum nécessaire par défaut
- "Voir plus" pour détails
- Modales full-screen pour actions complexes

### 5. Feedback & Guidance
- Insights automatiques ("🔥 En feu cette semaine!")
- Empty states explicatifs (pas juste "Aucun résultat")
- Loading states & errors clairs

---

## Navigation Architecture

### Overview

```
NON CONNECTÉ
    └─ Landing Page (4 boutons)
        ├─ Rejoindre (code input)
        ├─ Nouveau Tournoi → Login required
        ├─ Nouvelle League → Login required
        └─ Se connecter → Auth flow

CONNECTÉ
    └─ Bottom Tab Menu (5 tabs)
        ├─ 🏠 Home (Dashboard)
        ├─ 🎯 Rejoindre (Scanner QR / Code)
        ├─ 🏆 Tournois (Liste + Créer)
        ├─ 🏅 Leagues (Liste + Créer)
        └─ 👤 Profil (Infos + Settings)

PAGES DÉTAIL
    ├─ Tournament/:id
    │   ├─ Classement
    │   ├─ Matchs
    │   ├─ Stats (premium)
    │   └─ Paramètres (admin only)
    │
    └─ League/:id
        ├─ Classement
        ├─ Matchs
        ├─ Tournois
        ├─ Stats (premium)
        └─ Paramètres (admin only)
```

### Bottom Menus Hierarchy

| Page | Bottom Menu Type | Actions | Visible On |
|------|-----------------|---------|------------|
| `/` Home | Principal | Navigation 5 tabs | Mobile + Desktop (sidebar) |
| `/join` | Spécifique | Scanner QR / Saisir Code | Mobile only |
| `/tournaments` | Spécifique | Créer | Mobile only |
| `/leagues` | Spécifique | Créer | Mobile only |
| `/profile` | Principal | Navigation 5 tabs | Mobile + Desktop (sidebar) |
| `/tournament/:id` | Contextual Bar | Nouveau Match / Inviter | Mobile + Desktop (header) |
| `/league/:id` | Contextual Bar | Nouveau Match / Inviter | Mobile + Desktop (header) |

---

## Responsive Strategy

### Breakpoints

```css
/* Mobile First */
$mobile: 375px;          /* iPhone SE */
$mobile-large: 428px;    /* iPhone 14 Pro Max */
$tablet: 768px;          /* iPad Mini */
$desktop: 1024px;        /* Desktop */
$desktop-large: 1440px;  /* Large Desktop */
```

### Transformation Rules

#### Mobile (< 768px)
- **Navigation**: Bottom Tab Menu (fixed bottom)
- **Layout**: Single column, vertical stack
- **Actions**: Bottom Bar contextuelle
- **Header**: Minimal (logo + user)
- **Cards**: Full width

#### Desktop (> 1024px)
- **Navigation**: Left Sidebar (fixed left, ~240px width)
- **Layout**: 2 columns (main content + info sidebar)
- **Actions**: Header actions (top-right)
- **Header**: Logo + actions + user
- **Cards**: Grid 2 colonnes

#### Key Components Behavior

| Component | Mobile | Desktop |
|-----------|--------|---------|
| Bottom Tab Menu | Fixed bottom, 5 icons | Left sidebar, text labels |
| Bottom Menu Spécifique | Fixed bottom, 1-2 buttons | Top header, buttons |
| Contextual Bar | Fixed bottom, 2 buttons | Top header, inline buttons |
| Page Header | Minimal (title + icons) | Full (title + actions + info) |
| Content Layout | 1 column | 2 columns (60% / 40%) |
| Modal | Full screen | Centered overlay (max-width 600px) |

---

## Page Specifications

### 1. Landing Page (Non Connecté)

**Route:** `/`  
**Access:** Public  

#### Mobile Layout
```
┌─────────────────────────────┐
│     🍺 BEER PONG LEAGUE     │
│                             │
│   ┌─────────────────────┐   │
│   │  🏆 REJOINDRE       │   │ → /join
│   │   UN TOURNOI        │   │
│   └─────────────────────┘   │
│                             │
│   ┌─────────────────────┐   │
│   │  ➕ NOUVEAU         │   │ → /auth
│   │     TOURNOI         │   │
│   └─────────────────────┘   │
│                             │
│   ┌─────────────────────┐   │
│   │  🏅 NOUVELLE        │   │ → /auth
│   │     LEAGUE          │   │
│   └─────────────────────┘   │
│                             │
│   ┌─────────────────────┐   │
│   │  👤 SE CONNECTER    │   │ → /auth
│   └─────────────────────┘   │
└─────────────────────────────┘
```

#### Interactions
- **Rejoindre**: Navigate to `/join` (public access)
- **Nouveau Tournoi**: Redirect to `/auth` then `/create-tournament`
- **Nouvelle League**: Redirect to `/auth` then `/create-league`
- **Se connecter**: Open auth modal (Email OTP)

#### States
- **Default**: 4 buttons visible
- **Loading**: Button shows spinner during navigation
- **Error**: Toast notification if auth fails

---

### 2. Home Page (Connecté)

**Route:** `/`  
**Access:** Authenticated users only  
**Bottom Menu:** Principal (5 tabs)

#### Mobile Layout
```
┌─────────────────────────────────────┐
│     🍺 BEER PONG LEAGUE             │
│                                     │
│  👋 Salut floppyflax !              │
│                                     │
│  📍 REPRENDRE OÙ TU T'ES ARRÊTÉ    │
│  ┌─────────────────────────────┐   │
│  │ 🏆 MÉCHOUI AMAR            │   │ → /tournament/:id
│  │ En cours • 3 matchs         │   │
│  │ #2 (1520 ELO)               │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🏅 LEAGUE SUMMER 2026      │   │ → /league/:id
│  │ Active • 12 joueurs         │   │
│  │ #5 au classement            │   │
│  └─────────────────────────────┘   │
│                                     │
│  📊 TES STATS CETTE SEMAINE        │
│  • 8 matchs • +45 ELO • 6V-2D      │
│                                     │
├─────────────────────────────────────┤
│  [🏠] [🎯] [🏆] [🏅] [👤]          │
└─────────────────────────────────────┘
```

#### Desktop Layout
```
┌──────────┬──────────────────────────────────────────────┐
│          │  🍺 BPL                  [👤 floppyflax] [🚪] │
│  SIDEBAR ├──────────────────────────────────────────────┤
│          │                                              │
│ 🏠 Home  │  👋 Salut floppyflax !                       │
│   ═══    │                                              │
│          │  📍 REPRENDRE OÙ TU T'ES ARRÊTÉ              │
│ 🎯 Rejoin│  ┌──────────────────┬──────────────────┐     │
│          │  │ 🏆 MÉCHOUI AMAR │ 🏅 LEAGUE SUMMER │     │
│ 🏆 Tourn.│  │ En cours • #2   │ Active • #5      │     │
│          │  │ [VOIR →]        │ [VOIR →]         │     │
│ 🏅 League│  └──────────────────┴──────────────────┘     │
│          │                                              │
│ 👤 Profil│  📊 TES STATS CETTE SEMAINE                  │
│          │  • 8 matchs • +45 ELO • 6V-2D                │
└──────────┴──────────────────────────────────────────────┘
```

#### Content Rules
- **Dernier tournoi actif**: Afficher seulement si status = "active" ou "en cours"
- **Dernière league active**: Afficher seulement si user est membre
- **Stats semaine**: Calculer depuis derniers 7 jours
- **Empty state**: Si aucun tournoi/league → CTA "Créer ton premier tournoi"

#### Data Requirements
```typescript
interface HomePageData {
  user: {
    pseudo: string;
    email: string;
  };
  lastActiveTournament?: {
    id: string;
    name: string;
    status: 'active' | 'finished';
    matchCount: number;
    userRank: number;
    userElo: number;
  };
  lastActiveLeague?: {
    id: string;
    name: string;
    playerCount: number;
    userRank: number;
  };
  weeklyStats: {
    matchesPlayed: number;
    eloChange: number;
    wins: number;
    losses: number;
  };
}
```

---

### 3. Page Rejoindre

**Route:** `/join`  
**Access:** Authenticated users  
**Bottom Menu:** Spécifique (2 actions)

#### Mobile Layout
```
┌─────────────────────────────────┐
│  ←  🎯 Rejoindre un tournoi     │
├─────────────────────────────────┤
│                                 │
│                                 │
│        🏆                       │
│                                 │
│   Rejoins un tournoi existant   │
│                                 │
│   Scanne le QR code affiché     │
│   par l'organisateur ou         │
│   saisis directement le code    │
│   du tournoi.                   │
│                                 │
│                                 │
│                                 │
├─────────────────────────────────┤
│  [📷 SCANNER QR] [🔢 CODE]     │
└─────────────────────────────────┘
```

#### Interactions

**Action 1: Scanner QR**
- Click → Ouvre caméra full-screen
- Scan QR → Parse URL `/tournament/:id/join`
- Navigate to tournament join flow

**Action 2: Saisir Code**
- Click → Ouvre modal/page avec input
```
┌─────────────────────────────────┐
│   ← 🔢 Saisir le code           │
├─────────────────────────────────┤
│                                 │
│   Code du tournoi               │
│   ┌─────────────────────────┐   │
│   │ [_____________]         │   │
│   │   Ex: HAGYKH            │   │
│   └─────────────────────────┘   │
│                                 │
│   [REJOINDRE LE TOURNOI]        │
│                                 │
└─────────────────────────────────┘
```
- Submit → Validate code → Navigate to `/tournament/:id`

#### States
- **Camera permission denied**: Show error + fallback to code input
- **Invalid code**: Toast "Code invalide ou tournoi introuvable"
- **Already joined**: Toast "Tu as déjà rejoint ce tournoi" + navigate

---

### 4. Page Tournois

**Route:** `/tournaments`  
**Access:** Authenticated users  
**Bottom Menu:** Spécifique (1 action)

#### Mobile Layout
```
┌─────────────────────────────────┐
│  ←  🏆 Mes Tournois             │
│                                 │
│  📍 EN COURS (2)                │
│  ┌───────────────────────────┐  │
│  │ 🏆 MÉCHOUI AMAR          │  │ → /tournament/:id
│  │ 3 matchs • 12 joueurs     │  │
│  │ Code: HAGYKH              │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🏆 APÉRO ROOFTOP         │  │
│  │ 0 matchs • 4 joueurs      │  │
│  │ Code: XPQLM               │  │
│  └───────────────────────────┘  │
│                                 │
│  📚 ARCHIVÉS (4)                │
│  [Voir plus...]                 │
│                                 │
├─────────────────────────────────┤
│          [➕ CRÉER]             │
└─────────────────────────────────┘
```

#### Desktop Layout
```
┌──────────┬──────────────────────────────────────────────┐
│          │  ←  🏆 Mes Tournois        [➕ CRÉER]        │
│  SIDEBAR ├──────────────────────────────────────────────┤
│          │                                              │
│ 🏠 Home  │  📍 EN COURS (2)                             │
│          │  ┌────────────────────┬────────────────────┐ │
│ 🎯 Rejoin│  │ 🏆 MÉCHOUI AMAR   │ 🏆 APÉRO ROOFTOP  │ │
│          │  │ 3 matchs          │ 0 matchs          │ │
│ 🏆 Tourn.│  │ 12 joueurs        │ 4 joueurs         │ │
│   ═══    │  │ Code: HAGYKH      │ Code: XPQLM       │ │
│          │  │ [VOIR →]          │ [VOIR →]          │ │
│ 🏅 League│  └────────────────────┴────────────────────┘ │
│          │                                              │
│ 👤 Profil│  📚 ARCHIVÉS (4)                             │
│          │  ┌────────────────────┬────────────────────┐ │
│          │  │ 🏆 PRINTEMPS 2025 │ 🏆 HIVER 2024     │ │
│          │  │ Terminé ✓         │ Terminé ✓         │ │
│          │  └────────────────────┴────────────────────┘ │
└──────────┴──────────────────────────────────────────────┘
```

#### Content Rules
- **Tri**: En cours d'abord (par date création DESC), puis archivés
- **Filter**: Option future "Mes tournois" vs "Tous les tournois de mes leagues"
- **Archivés collapsed**: Afficher "Voir plus" si > 2 archivés

#### Premium Limit
```
┌─────────────────────────────────┐
│  ←  🏆 Mes Tournois             │
│                                 │
│  ⚠️ Limite atteinte              │
│  Plan Gratuit: 2/2 tournois     │
│                                 │
│  [⬆️ PASSER AU PREMIUM]         │
├─────────────────────────────────┤
│  📍 EN COURS (2)                │
│  ...                            │
├─────────────────────────────────┤
│     [➕ CRÉER 🔒 Premium]       │
└─────────────────────────────────┘
```

---

### 5. Page Profil

**Route:** `/profile`  
**Access:** Authenticated users  
**Bottom Menu:** Principal (5 tabs)

#### Mobile Layout
```
┌─────────────────────────────────┐
│  ←  👤 Mon Profil               │
├─────────────────────────────────┤
│                                 │
│  [INFOS] [MES STATS] [PARAMÈTRES]│
│    ════                         │
├─────────────────────────────────┤
│                                 │
│  CONTENU SELON ONGLET ACTIF     │
│                                 │
├─────────────────────────────────┤
│  [🏠] [🎯] [🏆] [🏅] [👤]      │
└─────────────────────────────────┘
```

#### Onglet INFOS
```
┌─────────────────────────────────┐
│  INFOS                          │
├─────────────────────────────────┤
│  📧 floppyflax@email.com        │
│  🎮 Pseudo: FloppyFlax          │
│                                 │
│  📊 STATS GLOBALES              │
│  • 125 matchs joués             │
│  • 1520 ELO moyen               │
│  • 68% victoires                │
│                                 │
│  💎 ABONNEMENT                  │
│  Plan: Premium                  │
│  Actif depuis: 01/01/2026       │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━     │
│                                 │
│  🏆 MES TOURNOIS                │
│  • 8 actifs                     │
│  • 12 terminés                  │
│                                 │
│  🏅 MES LEAGUES                 │
│  • 2 actives                    │
│  • 1 terminée                   │
└─────────────────────────────────┘
```

#### Onglet MES STATS (Premium Only)

**If user.isPremium = true:**
```
┌─────────────────────────────────┐
│  MES STATS 📊                   │
├─────────────────────────────────┤
│                                 │
│  💡 INSIGHT DU MOIS             │
│  🔥 +120 ELO ce mois !          │
│  Tu as joué 45 matchs           │
│                                 │
├─────────────────────────────────┤
│  📈 MON ÉVOLUTION ELO           │
│  [Graphe: Tous mes matchs]      │
│  Toutes leagues confondues      │
│                                 │
│  ┌──────┬──────┬──────┬──────┐ │
│  │ 1520 │ 68%  │ 125  │  8   │ │
│  │ ELO  │ Win  │Matchs│Leagues││
│  └──────┴──────┴──────┴──────┘ │
│                                 │
├─────────────────────────────────┤
│  🎯 MES PERFORMANCES            │
│                                 │
│  Meilleure league:              │
│  • Summer 2026 (75% win rate)   │
│                                 │
│  Meilleur tournoi:              │
│  • Méchoui Amar (+120 ELO)      │
│                                 │
│  Adversaires fréquents:         │
│  • vs Bob: 15 matchs (60% win)  │
│  • vs Alice: 12 matchs (50% win)│
│                                 │
│  [Voir détails →]               │
│                                 │
├─────────────────────────────────┤
│  🏆 MES ACHIEVEMENTS            │
│  [Badges personnels]            │
└─────────────────────────────────┘
```

**If user.isPremium = false:**
```
┌─────────────────────────────────┐
│  MES STATS 🔒                   │
├─────────────────────────────────┤
│                                 │
│       🔒 Fonctionnalité Premium │
│                                 │
│  Débloquez vos statistiques     │
│  personnelles pour suivre votre │
│  progression à travers tous vos │
│  tournois et leagues.           │
│                                 │
│  ✓ Évolution ELO globale        │
│  ✓ Performances par league      │
│  ✓ Adversaires favoris          │
│  ✓ Achievements personnels      │
│                                 │
│  [⬆️ PASSER AU PREMIUM]         │
│                                 │
└─────────────────────────────────┘
```

#### Onglet PARAMÈTRES
```
┌─────────────────────────────────┐
│  PARAMÈTRES ⚙️                  │
├─────────────────────────────────┤
│                                 │
│  🔔 NOTIFICATIONS               │
│  [x] Nouveaux matchs            │
│  [ ] Invitations tournoi        │
│  [ ] Changements classement     │
│                                 │
│  🌐 LANGUE                      │
│  [Français ▼]                   │
│                                 │
│  🎨 THÈME                       │
│  ( ) Clair                      │
│  (•) Sombre                     │
│  ( ) Auto                       │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━     │
│                                 │
│  💎 ABONNEMENT                  │
│  Plan: Premium                  │
│  [GÉRER L'ABONNEMENT]           │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━     │
│                                 │
│  🚪 COMPTE                      │
│  [SE DÉCONNECTER]               │
│  [SUPPRIMER MON COMPTE]         │
│                                 │
└─────────────────────────────────┘
```

#### Data Requirements
```typescript
interface ProfilePageData {
  user: {
    id: string;
    email: string;
    pseudo: string;
    isPremium: boolean;
    premiumSince?: string;
  };
  globalStats: {
    totalMatches: number;
    averageElo: number;
    globalWinRate: number;
  };
  tournamentsCount: {
    active: number;
    finished: number;
  };
  leaguesCount: {
    active: number;
    finished: number;
  };
}

interface PersonalStatsData {
  eloHistory: Array<{
    date: string;
    elo: number;
    leagueId?: string;
    tournamentId?: string;
  }>;
  performanceByLeague: Array<{
    leagueId: string;
    leagueName: string;
    winRate: number;
    matchCount: number;
  }>;
  performanceByTournament: Array<{
    tournamentId: string;
    tournamentName: string;
    eloGain: number;
    matchCount: number;
  }>;
  frequentOpponents: Array<{
    playerId: string;
    playerName: string;
    matchCount: number;
    winRate: number;
  }>;
  achievements: Array<Badge>;
}
```

---

### 6. Page Détail Tournoi

**Route:** `/tournament/:id`  
**Access:** Participants only  
**Bottom Menu:** Contextual Bar

#### Mobile Layout - Admin

```
┌─────────────────────────────────────┐
│  ← 🏆 MÉCHOUI AMAR         [📺][⚙️]│
│     Code: HAGYKH • EN COURS         │
│                                     │
│  📊 Format: Libre | 👥 12 joueurs  │
├─────────────────────────────────────┤
│                                     │
│  [CLASSEMENT] [MATCHS] [STATS] [⚙️] │
│     ═════════                       │
├─────────────────────────────────────┤
│                                     │
│  CONTENU SELON ONGLET ACTIF         │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  [⚡ NOUVEAU MATCH] [👤+ INVITER]  │
└─────────────────────────────────────┘
```

#### Mobile Layout - Joueur (avec invitation)

```
┌─────────────────────────────────────┐
│  ← 🏆 MÉCHOUI AMAR                  │
│     Code: HAGYKH • EN COURS         │
│                                     │
│  📊 Format: Libre | 👥 12 joueurs  │
├─────────────────────────────────────┤
│                                     │
│  [CLASSEMENT] [MATCHS] [STATS]      │
│     ═════════                       │
├─────────────────────────────────────┤
│                                     │
│  CONTENU                            │
│                                     │
├─────────────────────────────────────┤
│  [⚡ NOUVEAU MATCH] [👤+ INVITER]  │
└─────────────────────────────────────┘
```

#### Mobile Layout - Joueur (sans invitation)

```
├─────────────────────────────────────┤
│      [⚡ NOUVEAU MATCH]             │
└─────────────────────────────────────┘
```

#### Desktop Layout - Admin

```
┌──────────┬──────────────────────────────────────────────────────────────┐
│          │  ←  🏆 MÉCHOUI  [⚡MATCH][👤INVITER][📺DIFFUSION][⚙️]       │
│  SIDEBAR │      Code: HAGYKH • EN COURS                                │
│          ├──────────────────────────────────────────────────────────────┤
│ 🏠 Home  │                                                              │
│          │  [CLASSEMENT] [MATCHS] [STATS] [⚙️ PARAMÈTRES]              │
│ 🎯 Rejoin│     ═════════                                                │
│          ├──────────────────────────────────────────────────────────────┤
│ 🏆 Tourn.│                                                              │
│          │  ┌─────────────────────┬────────────────────────────────┐   │
│ 🏅 League│  │  CLASSEMENT         │  INFOS RAPIDES                 │   │
│          │  │                     │  📊 Format: Libre              │   │
│ 👤 Profil│  │  1. Alice (1520)   │  👥 12 joueurs                 │   │
│          │  │  2. Bob (1480)     │  🏆 3 matchs joués             │   │
│          │  │  3. Carol (1450)   │  📅 Créé le 03/02/2026         │   │
│          │  │  ...               │                                │   │
│          │  │                     │  [QR CODE]                     │   │
│          │  │                     │  Code: HAGYKH                  │   │
│          │  │                     │                                │   │
│          │  └─────────────────────┴────────────────────────────────┘   │
└──────────┴──────────────────────────────────────────────────────────────┘
```

#### Sub-tabs Content

##### ONGLET: CLASSEMENT

**Mobile:**
```
┌─────────────────────────────────┐
│  CLASSEMENT                     │
├─────────────────────────────────┤
│                                 │
│  1. 🥇 Alice          1520 ELO  │
│     5V - 2D • 71% win           │
│                                 │
│  2. 🥈 Bob            1480 ELO  │
│     3V - 4D • 43% win           │
│                                 │
│  3. 🥉 Carol          1450 ELO  │
│     4V - 3D • 57% win           │
│                                 │
│  ...                            │
│                                 │
└─────────────────────────────────┘
```

**Empty State:**
```
┌─────────────────────────────────┐
│  👥 Aucun joueur                │
│                                 │
│  Invite tes amis pour           │
│  commencer à jouer!             │
│                                 │
│  [Utilise le bouton 👤+ ci-     │
│   dessous pour inviter]         │
└─────────────────────────────────┘
```

##### ONGLET: MATCHS

**Mobile:**
```
┌─────────────────────────────────┐
│  MATCHS                         │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │ Alice & Bob vs          │   │
│  │ Carol & Dave            │   │
│  │ 🏆 10-8 • Il y a 2h     │   │
│  │ +15, -8, +12, -12       │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Eve & Frank vs          │   │
│  │ Alice & Bob             │   │
│  │ 10-6 • Il y a 5h        │   │
│  │ +10, -10, +8, -8        │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

**Empty State:**
```
┌─────────────────────────────────┐
│  🏆 Aucun match                 │
│                                 │
│  Enregistre ton premier match   │
│  pour voir l'évolution du       │
│  classement.                    │
│                                 │
│  [Utilise le bouton ⚡ ci-      │
│   dessous]                      │
└─────────────────────────────────┘
```

##### ONGLET: STATS (Premium - détaillé plus loin)

##### ONGLET: PARAMÈTRES (Admin only)

**Mobile:**
```
┌─────────────────────────────────┐
│  ⚙️ PARAMÈTRES                  │
├─────────────────────────────────┤
│                                 │
│  📱 INVITER DES PARTICIPANTS    │
│  ┌───────────────┐              │
│  │               │              │
│  │   [QR CODE]   │              │
│  │               │              │
│  └───────────────┘              │
│  Code: HAGYKH                   │
│  "Scannez ce QR code ou         │
│   saisissez le code"            │
│                                 │
│  [📺 AFFICHER EN PLEIN ÉCRAN]  │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━     │
│                                 │
│  ℹ️ INFORMATIONS                │
│  Nom: [Méchoui Amar____]        │
│  Date: [2026-02-03_____]        │
│  Format: [Libre ▼]              │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━     │
│                                 │
│  🔗 ASSOCIATION À UNE LEAGUE    │
│  "Associe ce tournoi à une      │
│   league pour suivre le         │
│   classement global ET ajouter  │
│   rapidement les joueurs."      │
│                                 │
│  [Dropdown: Sélectionner ▼]     │
│  [ASSOCIER]                     │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━     │
│                                 │
│  🛡️ OPTIONS                     │
│  [x] Joueurs peuvent inviter    │
│  [x] Mode anti-triche           │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━     │
│                                 │
│  🔴 ACTIONS                     │
│  [CLÔTURER LE TOURNOI]          │
│  [SUPPRIMER]                    │
│                                 │
└─────────────────────────────────┘
```

---

### 6. Page Détail League

**Route:** `/league/:id`  
**Access:** Members only  
**Bottom Menu:** Contextual Bar

#### Structure similaire à Tournoi avec différences :

**Onglets Admin :** Classement | Matchs | Tournois | Stats | Paramètres (5)  
**Onglets Joueur :** Classement | Matchs | Tournois | Stats (4)

##### ONGLET: MATCHS (spécificité League)

**Chronologique avec labels:**
```
┌─────────────────────────────────┐
│  MATCHS                         │
├─────────────────────────────────┤
│  📜 HISTORIQUE (23)             │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Alice & Bob vs          │   │
│  │ Carol & Dave            │   │
│  │ 10-8 • Il y a 2h        │   │
│  │ 🏆 MÉCHOUI AMAR         │   │ ← Label tournoi
│  │ +15, -8, +12, -12       │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Eve & Frank vs          │   │
│  │ Alice & Bob             │   │
│  │ 10-6 • Il y a 5h        │   │
│  │ 📍 Match de league      │   │ ← Match direct
│  │ +12, -12, +10, -10      │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

##### ONGLET: TOURNOIS (spécificité League)

```
┌─────────────────────────────────┐
│  TOURNOIS                       │
├─────────────────────────────────┤
│                                 │
│  📍 EN COURS (2)                │
│  ┌─────────────────────────┐   │
│  │ 🏆 MÉCHOUI AMAR        │   │ → /tournament/:id
│  │ 3 matchs • 12 joueurs   │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🏆 APÉRO ROOFTOP       │   │
│  │ 0 matchs • 4 joueurs    │   │
│  └─────────────────────────┘   │
│                                 │
│  📚 TERMINÉS (5)                │
│  [Voir plus...]                 │
│                                 │
│  [➕ CRÉER UN TOURNOI]          │ ← Si admin ou option activée
│                                 │
└─────────────────────────────────┘
```

---

## Stats Premium Feature

### Overview - 3 Types de Stats

**1. Stats Tournoi** (`/tournament/:id` onglet Stats)
- **Visible si**: `tournament.creator.isPremium === true`
- **Scope**: Ce tournoi uniquement
- **Data**: Matchs du tournoi, classement tournoi, évolution ELO dans le tournoi

**2. Stats League** (`/league/:id` onglet Stats)
- **Visible si**: `league.creator.isPremium === true`
- **Scope**: Cette league uniquement
- **Data**: Tous matchs league (directs + tournois), classement global league

**3. Stats Personnelles** (`/profile` onglet "Mes Stats")
- **Visible si**: `currentUser.isPremium === true`
- **Scope**: Tous mes matchs cross-leagues/tournois
- **Data**: Agrégation globale de ma performance personnelle

### Business Logic Matrix

| Mon statut | Tournoi créé par | Stats Tournoi ? | Stats League ? | Mes Stats Perso ? |
|------------|-----------------|----------------|----------------|-------------------|
| Gratuit | User gratuit | ❌ | ❌ | ❌ |
| Gratuit | User premium | ✅ | ✅ | ❌ |
| Premium | User gratuit | ❌ | ❌ | ✅ |
| Premium | User premium | ✅ | ✅ | ✅ |

### Paywall (Non-Premium)

```
┌─────────────────────────────────┐
│  STATS 🔒                       │
├─────────────────────────────────┤
│                                 │
│       🔒 Fonctionnalité Premium │
│                                 │
│  Débloquez des statistiques     │
│  détaillées pour suivre votre   │
│  progression et analyser vos    │
│  performances.                  │
│                                 │
│  ✓ Évolution ELO dans le temps  │
│  ✓ Graphiques de performance    │
│  ✓ Comparaison avec les autres  │
│  ✓ Statistiques avancées        │
│  ✓ Badges & achievements        │
│                                 │
│  [⬆️ PASSER AU PREMIUM]         │
│                                 │
└─────────────────────────────────┘
```

### Stats Content (Premium) - Mobile

```
┌─────────────────────────────────┐
│  STATS 📊                       │
├─────────────────────────────────┤
│                                 │
│  💡 INSIGHT DE LA SEMAINE       │
│  🔥 En feu ! +45 ELO            │
│  Tu es #2 du tournoi            │
│                                 │
├─────────────────────────────────┤
│  📈 TA PROGRESSION              │
│                                 │
│  [Graphe ligne ELO]             │
│  Évolution 30 derniers jours    │
│                                 │
│  ┌──────┬──────┬──────┬──────┐ │
│  │ 1520 │ 68%  │  8   │  5   │ │
│  │ ELO  │ Win  │Matchs│Streak│ │
│  └──────┴──────┴──────┴──────┘ │
│                                 │
├─────────────────────────────────┤
│  🎯 PERFORMANCE DÉTAILLÉE       │
│  [Voir plus →]                  │
│                                 │
│  • Win rate par adversaire      │
│  • Meilleur équipier            │
│  • Heures de jeu préférées      │
│                                 │
├─────────────────────────────────┤
│  🏆 ACHIEVEMENTS (3/12)         │
│  [Voir tous les badges →]       │
│                                 │
│  🎯 Première victoire ✅        │
│  🔥 5 victoires d'affilée (3/5) │
│  💯 100 matchs joués (65/100)   │
│                                 │
└─────────────────────────────────┘
```

### Stats Content (Premium) - Desktop

```
┌──────────┬──────────────────────────────────────────────────────────────┐
│          │  STATS 📊                                                    │
│  SIDEBAR ├──────────────────────────────────────────────────────────────┤
│          │                                                              │
│ 🏠 Home  │  💡 INSIGHT DE LA SEMAINE                                    │
│          │  🔥 En feu ! +45 ELO cette semaine • Top 15% de la league    │
│ 🎯 Rejoin├──────────────────────────────────────────────────────────────┤
│          │                                                              │
│ 🏆 Tourn.│  ┌────────────────────────────┬─────────────────────────┐   │
│          │  │  📈 ÉVOLUTION ELO          │  📊 KPI                 │   │
│ 🏅 League│  │                            │                         │   │
│          │  │  [Grand graphe ligne]      │  ┌────┬────┬────┬────┐ │   │
│ 👤 Profil│  │                            │  │1520│ 68%│ 125│  5 │ │   │
│          │  │                            │  │ELO │Win │Mtch│Str │ │   │
│          │  │                            │  └────┴────┴────┴────┘ │   │
│          │  └────────────────────────────┴─────────────────────────┘   │
│          │                                                              │
│          │  ┌────────────────────────────┬─────────────────────────┐   │
│          │  │  🎯 PERFORMANCE            │  🏆 ACHIEVEMENTS        │   │
│          │  │                            │                         │   │
│          │  │  Win rate par adversaire:  │  🎯 Première victoire ✅│   │
│          │  │  • vs Bob: 80%             │  🔥 5 victoires (3/5)   │   │
│          │  │  • vs Carol: 60%           │  💯 100 matchs (65/100) │   │
│          │  │                            │                         │   │
│          │  │  Meilleur équipier:        │  [Voir tous →]          │   │
│          │  │  • Bob (75% win rate)      │                         │   │
│          │  └────────────────────────────┴─────────────────────────┘   │
└──────────┴──────────────────────────────────────────────────────────────┘
```

### Stats Metrics Breakdown

#### Section 1: Insight Automatique
**Algorithme:**
- Si ELO +30+ cette semaine → "🔥 En feu !"
- Si streak >= 3 → "🚀 Sur une série de X victoires"
- Si percentile top 20% → "⭐ Top X% de la league"
- Sinon → "📊 Tu as joué X matchs cette semaine"

#### Section 2: Progression (ELO Chart)
**Data:**
- X-axis: Dates (30 derniers jours pour league, durée tournoi)
- Y-axis: ELO
- Points: Chaque match enregistré
- Line: Interpolation linéaire
**Library:** Recharts ou Chart.js

#### Section 3: KPI Cards
- **ELO actuel**: Nombre (couleur selon tendance: vert si +, rouge si -)
- **Win Rate**: Pourcentage (gauge visuelle)
- **Matchs**: Nombre total
- **Streak**: Nombre (positif = vert, négatif = rouge)

#### Section 4: Performance Détaillée (Deep dive)
**Métriques:**
1. **Win rate par adversaire** (top 5)
   - Tableau: Nom | Matchs | Victoires | Win Rate %
2. **Meilleur équipier** (si équipes)
   - "Avec [Nom], tu as X% de win rate (Y matchs)"
3. **Heures de jeu** (heatmap)
   - Grid: Jours (colonnes) x Heures (lignes)
   - Couleur: Intensité = nombre de matchs

#### Section 5: Achievements
**Badge Types:**
- 🎯 Milestones: Première victoire, 10 matchs, 50 matchs, 100 matchs
- 🔥 Streaks: 3 wins, 5 wins, 10 wins d'affilée
- 🏆 Victoires: 10 wins, 50 wins, 100 wins
- 📈 Progression: +100 ELO, +250 ELO, +500 ELO
- ⭐ Spécial: Perfect game (10-0), Comeback (+5 points de retard)

**Display:**
- Badges débloqués: Full color + nom
- Badges locked: Grayscale + progression bar (ex: "65/100")

---

## Mode Diffusion (Admin)

### Access
**Button:** `[📺 DIFFUSION]` ou `[📺]` (icône)  
**Visible pour:** Admin tournoi/league uniquement  
**Location:** 
- Mobile: Top-right header (icône)
- Desktop: Top-right header (bouton texte)

### Route
`/tournament/:id/display` ou `/league/:id/display`

### Layout (Full-screen)

```
┌────────────────────────────────────────┐
│                  [X]                   │ ← Close button top-right
│                                        │
│         🏆 MÉCHOUI AMAR                │
│         Code: HAGYKH                   │
│                                        │
│    CLASSEMENT EN TEMPS RÉEL            │
│                                        │
│    1. 🥇 Alice      1520 ELO           │
│    2. 🥈 Bob        1480 ELO           │
│    3. 🥉 Carol      1450 ELO           │
│    4. Dave          1420 ELO           │
│    5. Eve           1400 ELO           │
│                                        │
│    DERNIER MATCH                       │
│    Alice & Bob vs Carol & Dave         │
│    🏆 10-8 • Il y a 5 min              │
│    +15, -8, +12, -12 ELO               │
│                                        │
│         ┌───────────────┐              │
│         │               │              │
│         │   [QR CODE]   │              │
│         │               │              │
│         └───────────────┘              │
│       Rejoins avec le code:            │
│            HAGYKH                      │
│                                        │
└────────────────────────────────────────┘
```

### Features
- **Auto-refresh**: Poll API toutes les 10 secondes pour mise à jour temps réel
- **Full-screen**: Utiliser Fullscreen API du navigateur
- **Optimisé TV**: Font sizes plus grandes (24px+), contrastes élevés
- **Pas d'interactions**: Read-only, pas de navigation

### Tech Stack
- React component séparé
- Polling avec `setInterval` ou WebSocket si implémenté
- CSS: Remove all interactive elements, optimize for large screens

---

## Component Library

### 1. Bottom Tab Menu (Principal)

**Specs:**
- Height: 64px
- Icons: 24x24px
- Active state: Orange (#f59e0b) + underline
- Inactive state: Gray (#94a3b8)
- Labels: 10px font, uppercase, bold

```typescript
interface BottomTabMenuProps {
  activeTab: 'home' | 'join' | 'tournaments' | 'leagues' | 'profile';
  onTabChange: (tab: string) => void;
}
```

### 2. Bottom Menu Spécifique

**Specs:**
- Height: 64px
- Buttons: Full width ou split 50/50
- Colors: Primary orange (#f59e0b)
- Shadow: lg (0 10px 15px -3px rgba(0, 0, 0, 0.1))

```typescript
interface BottomMenuSpecificProps {
  actions: Array<{
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    premium?: boolean;
  }>;
}
```

### 3. Contextual Action Bar

**Specs:**
- Height: 64px
- Buttons: Split selon nombre (2 = 50/50, 1 = 100%)
- Colors: Primary pour main action, secondary pour autres

```typescript
interface ContextualBarProps {
  primaryAction: {
    label: string;
    icon: ReactNode;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    icon: ReactNode;
    onClick: () => void;
    visible: boolean; // Basé sur permissions
  };
}
```

### 4. Card (Tournament/League)

```typescript
interface CardProps {
  title: string;
  subtitle: string;
  code?: string;
  status: 'active' | 'finished' | 'cancelled';
  stats: Array<{ icon: string; value: string }>;
  onClick: () => void;
}
```

### 5. Empty State

```typescript
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode; // Removed from most places
}
```

### 6. Stats Card

```typescript
interface StatsCardProps {
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
}
```

### 7. Achievement Badge

```typescript
interface BadgeProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: {
    current: number;
    total: number;
  };
}
```

---

## Permissions & Business Rules

### User Roles
- **Admin**: Créateur du tournoi/league
- **Joueur (avec invitation)**: Permission "can_invite" = true
- **Joueur (sans invitation)**: Permission "can_invite" = false

### Permissions Matrix

| Feature | Admin | Joueur (invite ON) | Joueur (invite OFF) |
|---------|-------|-------------------|---------------------|
| Voir Classement | ✅ | ✅ | ✅ |
| Voir Matchs | ✅ | ✅ | ✅ |
| Voir Tournois (league) | ✅ | ✅ | ✅ |
| Voir Stats (si premium) | ✅ | ✅ | ✅ |
| Voir Paramètres | ✅ | ❌ | ❌ |
| Enregistrer Match | ✅ | ✅ | ✅ |
| Inviter Joueurs | ✅ | ✅ | ❌ |
| Mode Diffusion | ✅ | ❌ | ❌ |
| Modifier Paramètres | ✅ | ❌ | ❌ |
| Supprimer Tournoi/League | ✅ | ❌ | ❌ |

### Premium Rules

**Plan Gratuit:**
- 2 tournois actifs max
- 1 league active max
- Pas d'accès aux stats

**Plan Premium:**
- Tournois illimités
- Leagues illimitées
- Accès stats complet

### Business Logic

**Invitation Permission:**
- Default: OFF (seul admin peut inviter)
- Admin peut activer dans Paramètres: `[x] Joueurs peuvent inviter`

**Stats Access:**
- Vérifie: `tournament.isPremium || league.isPremium`
- Si false → Afficher paywall

**Création Tournoi dans League:**
- Default: Admin only
- Future: Option pour tous les membres (à définir)

---

## Implementation Priorities

### 🎯 PRIORITY: Navigation First

### Phase 1: Navigation & Structure (Sprint 1-2) - PRIORITY
**Epic: Responsive Navigation Refactor**
- Story 1: Setup responsive infrastructure (breakpoints, layout wrapper)
- Story 2: Bottom Tab Menu Principal (mobile) + Left Sidebar (desktop)
- Story 3: Bottom Menu Spécifique (Join, Tournaments, Leagues)
- Story 4: Contextual Bar (Tournament/League detail pages)
- Story 5: Bouton retour standardisé (top-left)

**Acceptance Criteria:**
- Navigation cohérente mobile/desktop
- Tous les menus accessibles et fonctionnels
- Retour intuitif sur toutes les pages
- Breakpoints responsive appliqués

**Technical Setup:**
- New components: `BottomTabMenu`, `BottomMenuSpecific`, `ContextualBar`, `ResponsiveLayout`
- Update `App.tsx` with responsive wrapper
- Tailwind breakpoints configuration

### Phase 2: Pages Principales (Sprint 3-4)
**Epic: Core Pages Implementation**
- Story 6: Home Page connectée (dashboard personnalisé)
- Story 7: Page Rejoindre (Scanner QR + Code input)
- Story 8: Page Tournois (liste + créer)
- Story 9: Page Leagues (liste + créer)
- Story 10: Page Profil (3 onglets: Infos, Mes Stats, Paramètres)

### Phase 3: Pages Détail (Sprint 5-6)
**Epic: Tournament & League Detail**
- Story 11: Tournament Dashboard refactor (4 onglets avec nouveau layout)
- Story 12: League Dashboard refactor (5 onglets)
- Story 13: Onglet Classement (responsive)
- Story 14: Onglet Matchs (chronologique avec labels tournoi)
- Story 15: Onglet Tournois (league only)
- Story 16: Onglet Paramètres (admin only, responsive)

### Phase 4: Premium Features (Sprint 7-8)
**Epic: Stats & Premium**
- Story 17: Stats infrastructure (data models, API endpoints, cache strategy)
- Story 18: Stats Tournoi (paywall + content)
- Story 19: Stats League (paywall + content)
- Story 20: Stats Personnelles (paywall + content dans Profil)
- Story 21: Charts library integration (lightweight choice)
- Story 22: Achievements & Badges système
- Story 23: Premium upgrade flow & limits enforcement

### Phase 5: Admin Features (Sprint 9)
**Epic: Admin Tools**
- Story 24: Mode Diffusion (full-screen display avec auto-refresh)
- Story 25: Options Paramètres (invitation toggle, anti-cheat)
- Story 26: Permissions granulaires (admin vs joueur)

### Phase 6: Polish & Optimization (Sprint 10)
**Epic: UX Refinements**
- Story 27: Empty states polish (all pages)
- Story 28: Loading states & skeletons
- Story 29: Error handling & toasts
- Story 30: Responsive testing & fixes (all breakpoints)
- Story 31: Performance optimization (bundle size, caching)
- Story 32: Accessibility audit (a11y)

---

## Design Assets & Resources

### Colors (Tailwind)
- **Primary Orange**: `#f59e0b` (`amber-500`)
- **Background**: `#0f172a` (`slate-900`)
- **Surface**: `#1e293b` (`slate-800`)
- **Border**: `#334155` (`slate-700`)
- **Text Primary**: `#ffffff` (white)
- **Text Secondary**: `#94a3b8` (`slate-400`)
- **Success**: `#10b981` (`green-500`)
- **Error**: `#ef4444` (`red-500`)

### Typography
- **Headings**: Bold, uppercase, tracking-wide
- **Body**: Regular, 14px (mobile), 16px (desktop)
- **Small**: 12px, slate-400
- **Code/Numbers**: Mono, bold

### Icons (Lucide React)
- Home: `Home`
- Rejoindre: `Target`
- Tournois: `Trophy`
- Leagues: `Award`
- Profil: `User`
- Match: `Zap`
- Inviter: `UserPlus`
- Settings: `Settings`
- Display: `Monitor`
- QR: `QrCode`
- Code: `Hash`

### Spacing
- Padding page: `16px` (mobile), `24px` (desktop)
- Gap between sections: `16px`
- Gap between items: `8px`

---

## Appendix

### A. Glossary
- **Bottom Tab Menu**: Navigation principale 5 tabs
- **Bottom Menu Spécifique**: Actions contextuelles pages listes
- **Contextual Bar**: Actions contextuelles pages détails
- **Premium**: Plan payant avec features avancées
- **Admin**: Créateur du tournoi/league
- **Joueur**: Participant non-créateur
- **Mode Diffusion**: Vue plein écran pour écrans externes

### B. References
- Miro Board: [Link to wireframes]
- Figma Prototype: [Link to prototype]
- Technical Architecture: `architecture-decision-records.md`
- API Specs: `api-specifications.md`

### C. Change Log
- **2026-02-03**: Version initiale (Sally + Mary + John)

---

**End of Document**
