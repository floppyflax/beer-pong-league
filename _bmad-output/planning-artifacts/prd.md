---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain-skipped', 'comprehensive-rewrite', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments: 
  - '_bmad-output/analysis/brainstorming-session-2026-01-23.md'
  - '_bmad-output/planning-artifacts/product-brief-beer-pong-league-2026-01-23.md'
  - '_bmad-output/planning-artifacts/research/market-applications-gestion-ligues-sportives-bars-2026-01-23.md'
  - 'docs/index.md'
  - 'docs/project-overview.md'
  - 'docs/architecture.md'
  - 'docs/data-models.md'
  - 'docs/component-inventory.md'
  - 'docs/development-guide.md'
  - 'docs/api-contracts.md'
  - 'docs/deployment-guide.md'
  - 'README.md'
  - 'specifications.md'
briefCount: 1
researchCount: 1
brainstormingCount: 1
projectDocsCount: 10
workflowType: 'prd'
classification:
  projectType: 'Multi-platform (Web App + Mobile App)'
  domain: 'Gaming / Social Competition'
  complexity: 'Low to Medium'
  projectContext: 'brownfield'
---

# Product Requirements Document - Beer Pong League

**Author:** floppyflax  
**Date:** 2026-01-23  
**Version:** 1.0  
**Status:** Comprehensive PRD - Integrating Product Brief, Market Research, and Brainstorming

---

## Executive Summary

Beer Pong League is a social-first, mobile-native platform for managing beer pong tournaments and leagues in bars and entertainment venues. Unlike traditional sports management software focused on enterprise needs, Beer Pong League creates excitement, fun, and memorable moments through gamified rankings, real-time projections, and community engagement.

**Current State:** React + TypeScript web app with league/tournament management, ELO ranking, authentication (email + OTP), anonymous users, and display view. Backend: Supabase. Offline-first with localStorage fallback.

**Vision:** Transform from a functional tournament management tool into the most engaging social platform for bar entertainment competitions, where players compete for fun, bars create memorable experiences, and communities form around shared passion for beer pong.

**Market Opportunity:** Bar entertainment and social competition segments are relatively untapped. Global sports league management software: $1.23-1.25B (2024) → $2.36-2.65B (2032). Europe: ~9% CAGR. Key markets: France, Germany, UK, Spain.

**Key Differentiators:**
1. **Social-First Design** - Prioritizes engagement, fun, and community over compliance and management
2. **Bar Entertainment Specialization** - Deep understanding of bar culture and tournament dynamics
3. **Emotional Engagement** - Solves the emotional problem (creating excitement) rather than just technical problems
4. **Mobile-Native Experience** - Built mobile-first for bar environments (73% of sports fans use mobile apps)
5. **European Market Focus** - Localized for European markets with less competition than North America
6. **Offline-First Architecture** - Works reliably in bar environments where internet can be spotty

---

## Problem Statement

### The Core Problem is Emotional, Not Technical

Organizers face a fundamental challenge: **creating excitement and engagement, not just managing logistics**. Current solutions focus on technical problems (registration, scheduling, scoring) but miss the emotional core—creating memorable moments, building community, and generating excitement that keeps players coming back.

### Specific Pain Points

1. **Fragmented Rankings**: Players can't see their progression across events. Each tournament feels isolated, with no continuity or sense of achievement over time.

2. **Lack of Engagement**: Tournament management is purely functional—no gamification, no social features, no "wow moments" that create excitement and shareability.

3. **Invisible Competition**: Players don't see the stakes before matches, can't track rivalries, and miss the competitive tension that makes tournaments exciting.

4. **Disconnected Experience**: The experience is fragmented between the physical event (bar) and digital tracking. There's no bridge that connects the live excitement with digital engagement.

5. **Bar Operator Challenges**: Bars struggle to create consistent, engaging tournament experiences that drive repeat visits and customer loyalty.

6. **Manual Management Burden**: Organizers spend more time managing scores than enjoying their events. Manual scoring creates disputes, confusion, and operational bottlenecks.

### Problem Impact

**For Players:**
- Lack of motivation to participate regularly (no visible progression)
- Missing the competitive thrill and social connection
- Inability to track performance and compare with friends
- No sense of achievement or recognition for participation

**For Organizers:**
- Difficulty maintaining player engagement between events
- Limited tools to create excitement and memorable moments
- Manual, time-consuming tournament management
- No way to build a community around their events

**For Bars:**
- Missed opportunity to create unique, engaging experiences
- Difficulty differentiating from competitors
- Limited tools to drive repeat visits and customer loyalty
- No data insights into player behavior and preferences

### Why Existing Solutions Fall Short

**Enterprise Sports Management Platforms (SportsEngine, TeamSnap, Stack Sports):**
- Too expensive for casual bar tournaments and friend groups
- Too complex with features irrelevant to beer pong (compliance, volunteer management, background checks)
- Desktop-first design doesn't match mobile usage patterns (73% of users prefer mobile apps)
- Enterprise-focused positioning misses the social, fun, engagement aspect
- Lack bar-specific features like venue integration, POS systems, or bar entertainment culture

**Generic Tournament Software:**
- No ELO system or progression tracking—missing the competitive element
- No social features—leaderboards, friend connections, achievements
- No display view for live projection in bars
- No gamification—missing the "wow moments" that create excitement
- Not mobile-optimized for the bar environment

**Manual Solutions (Spreadsheets, Paper):**
- Time-consuming and error-prone
- No real-time updates or live tracking
- No engagement features—purely functional
- No continuity between events
- No data insights or analytics

**Specialized Bar Entertainment (Scoreholio/Pongstars):**
- Limited to specific sports (cornhole, darts) with less focus on beer pong
- Less social features compared to what's possible
- North America-centric with less European market focus
- Less mobile-first experience

---

## Proposed Solution

### Beer Pong League: The Social-First Platform for Bar Entertainment Competitions

Beer Pong League transforms tournament management into an engaging social experience. Combines intelligent tournament management with gamification, real-time engagement, and community building to create memorable moments that keep players and bars coming back.

### Core Solution Elements

1. **ELO-Based Progression System**: Players see their ranking evolve across events, creating continuity and motivation. The system is simple to understand in practice (you win, you go up; you lose, you go down) without requiring technical knowledge of ELO calculations.

2. **Gamified Engagement**: Badges, achievements, streaks, and visual celebrations (confetti, animations) create "wow moments" when players progress. The leaderboard becomes a source of excitement, not just information.

3. **Real-Time Display View**: Central to the bar experience—a live projection screen showing rankings, match progress, and celebrations. This creates the collective excitement that makes tournaments memorable.

4. **Social Features**: Friend connections, rivalries, challenges, and social sharing turn individual competition into community engagement. Players can compare with friends, track rivalries, and share achievements.

5. **Mobile-First Design**: Built for mobile usage in bar environments—quick check-ins, easy score entry, instant notifications. The experience works seamlessly on phones while supporting display view for projection.

6. **Bar Venue Integration**: Features designed for bars—white-label branding, venue-specific leaderboards, multi-venue support for chains, and future POS integration.

7. **Offline-First Architecture**: Works even when internet is spotty in bars, with localStorage fallback and automatic sync when connection returns.

### The "Wow Moment"

When a player adds a match result and sees their ranking update with animations, confetti, and their position change on the live display screen—that's the moment that transforms functional tracking into exciting engagement.

---

## Market Context

### Market Size and Growth

Global sports league management software market: **$1.23-1.25B (2024)** → **$2.36-2.65B (2032)**, **7.4-10.04% CAGR**.

**Geographic Distribution:**
- **North America**: 35.8% market share (US dominates)
- **Europe**: ~9% CAGR. Key markets: France, Germany, UK, Spain
- **Asia-Pacific**: ~15% CAGR (emerging)

### Customer Behavior Insights

**Mobile-First Engagement:**
- 73% of sports fans use dedicated mobile sports apps to stay updated
- 82% of in-person event attendees use mobile apps
- 40% rely on apps for centralized information
- 35% for real-time updates when unable to watch games live

**AI-Powered Features Demand:**
- 85% of respondents see value in AI-powered capabilities
- Real-time game/match updates (35%) and personalized content (30%) are top priorities
- 56% want AI-driven commentary and insights

**Social Engagement:**
- 90% of fans consume sports content beyond watching events
- Multi-device usage has increased from 27% to 29% between 2024-2025
- Social influence plays a critical role in users' decisions to continue using sports apps

### Competitive Landscape

**Market Fragmentation:** Moderate. Dozens of vendors targeting niches by sport, budget, geography.

**Key Players:**
- **Enterprise Leaders**: SportsEngine, TeamSnap, Stack Sports (comprehensive, expensive, desktop-first)
- **Freemium Challengers**: TeamLinkt (AI-powered, free core features)
- **Specialized Platforms**: Scoreholio/Pongstars (beer pong, cornhole, darts), EZFacility (facilities)
- **Social Sports**: SportLync (170,000+ users, social networking for athletes)

**Market Differentiation Opportunities:**
1. **Bar Entertainment Specialization** - Less saturated than traditional sports management
2. **Social-First Approach** - Superior community features
3. **AI-Powered Automation** - 85% of users see value in AI features
4. **Mobile-First Experience** - 73% of sports fans use mobile apps
5. **European Market Focus** - Less competition than North America

---

## Target Users

### Primary Users

#### 1. Organisateurs d'Événements (Thomas - Persona Principal)

**Profil:**
- **Nom:** Thomas, 32 ans
- **Rôle:** Organisateur d'événements sociaux (méchouis, anniversaires, soirées)
- **Contexte:** Organise régulièrement des événements avec tournois de beer pong
- **Motivation:** Créer des moments mémorables, simplifier l'organisation, profiter de son événement plutôt que de gérer les scores

**Problème Actuel:**
- Utilise tableau d'affichage et feutre pour noter les scores manuellement
- Les scores ne sont pas clairs, des gens oublient de noter
- Doit toujours passer par lui pour noter les scores
- Ne voit pas vraiment qui est meilleur ou moins bon
- Passe plus de temps à gérer les scores qu'à profiter de son événement
- Pas de continuité entre événements - chaque tournoi est isolé

**Vision du Succès:**
- Créer un championnat en quelques clics (nom, date, configuration)
- Générer automatiquement un QR code d'invitation
- Configurer l'écran de projection pour afficher le classement en temps réel
- Les participants enregistrent leurs matchs eux-mêmes sans intervention
- Le classement se met à jour automatiquement avec animations
- Voir l'engagement des participants et la fluidité de l'organisation
- Se concentrer sur l'organisation et profiter de l'événement

**Moment "Wow":**
Quand un match se termine et que le classement s'anime automatiquement sur l'écran de projection, créant des réactions dans la foule et de l'engouement autour du tournoi.

#### 2. Joueurs Réguliers (Lucas - Casual Player qui Devient Accro)

**Profil:**
- **Nom:** Lucas, 28 ans
- **Rôle:** Ami participant aux événements, aime la compétition et les stats
- **Contexte:** Participe à des tournois de beer pong lors d'événements sociaux
- **Motivation:** Se prouver qu'on est meilleur, compétition fun entre amis, suivre sa progression

**Problème Actuel:**
- Ne voit pas sa progression entre les événements
- Pas de continuité - chaque tournoi est isolé
- Pas de stats personnelles (ELO, victoires, défaites)
- Pas de moyen de comparer avec ses amis
- Pas de reconnaissance pour ses performances

**Vision du Succès:**
- Rejoindre un championnat via QR code avec zero-friction (pas de compte requis)
- Enregistrer ses matchs facilement
- Voir son classement évoluer en temps réel sur l'écran de projection
- Constater sa progression après chaque match avec animations visuelles
- Découvrir ses stats personnelles détaillées (ELO, nombre de matchs, victoires/défaites)
- Partager son classement sur les réseaux sociaux
- Créer son propre événement (conversion casual → organisateur)
- Rejoindre d'autres ligues existantes

**Moment "Wow":**
À la fin d'un événement, voir son classement final et découvrir ses stats personnelles avec proposition de créer un compte pour conserver ses stats. Puis partager son classement sur Instagram, générant des questions de ses amis.

#### 3. Propriétaires/Gestionnaires de Bars

**Profil:**
- **Nom:** Sophie, 35 ans
- **Rôle:** Propriétaire/gestionnaire de bar ou chaîne de bars
- **Contexte:** Cherche à créer des expériences uniques pour différencier son établissement
- **Motivation:** Augmenter la fréquentation, créer de la fidélité client, générer des revenus récurrents

**Problème Actuel:**
- Difficulté à créer des expériences engageantes et mémorables
- Manque d'outils pour organiser des tournois réguliers
- Pas de moyen de suivre l'engagement des clients
- Difficulté à différencier son bar de la concurrence
- Pas de continuité entre les événements

**Vision du Succès:**
- Organiser des tournois réguliers facilement
- Créer de l'engouement avec écran de projection et animations
- Branding personnalisé (white-label) pour son établissement
- Suivre l'engagement et les statistiques des participants
- Multi-venue support pour chaînes de bars
- Intégration future avec POS systems
- Marketplace/Discovery pour référencer son bar

**Moment "Wow":**
Voir les clients engagés autour de l'écran de projection pendant un tournoi, avec animations et réactions collectives, créant une atmosphère unique dans son bar.

### Secondary Users

#### 4. Spectateurs/Amis
- Personnes présentes aux événements qui suivent les classements
- Amis qui suivent les performances sur les réseaux sociaux
- Communauté autour des tournois

#### 5. Staff de Bar
- Employés de bar qui aident à organiser les tournois
- Responsables d'événements dans les bars

---

## User Journeys

### Journey 1: Thomas, l'Organisateur Passionné

**Découverte:**
Un ami (ou via une recherche) fait découvrir l'application Beer Pong League à Thomas. Intrigué par la promesse de simplifier l'organisation, il décide de l'essayer.

**Onboarding:**
Thomas crée son championnat "Méchoui 2026" en quelques clics : nom, date, configuration minimale. L'app génère automatiquement un QR code d'invitation. Il configure son écran de projection pour afficher le classement en temps réel, et affiche le QR code pour que les participants puissent rejoindre facilement.

**Usage Core:**
Pendant le méchoui, les participants scannent le QR code et rejoignent le championnat directement depuis leur téléphone. Plus besoin de passer par Thomas pour noter les scores - chacun enregistre ses matchs lui-même. Le classement se met à jour en temps réel sur l'écran de projection géant.

**Moment de Succès:**
Le moment "wow" arrive quand un match se termine et que le classement s'anime automatiquement sur l'écran, créant des réactions dans la foule et de l'engouement autour du tournoi. Thomas voit l'engagement des participants et la fluidité de l'organisation.

**Long-terme:**
Le méchoui se déroule sans friction. Les participants enregistrent leurs scores eux-mêmes, le classement est visible en temps réel pour tout le monde, et à la fin de la soirée, tout le monde connaît le classement final sans ambiguïté. Thomas peut enfin se concentrer sur l'organisation et profiter de son événement plutôt que de gérer les scores. Il est conquis et envisage déjà d'utiliser l'app pour d'autres événements qu'il organise.

### Journey 2: Lucas, le Casual Player qui Devient Accro

**Découverte:**
Lucas, 28 ans, arrive au méchoui de Thomas. Il voit un QR code affiché sur l'écran de projection et entend parler de l'application. Il n'a jamais organisé d'événement de ce type, mais il aime la compétition et les stats. Il est curieux mais pas encore convaincu.

**Onboarding:**
Lucas scanne le QR code avec son téléphone. Il rejoint le championnat via la web app (ou télécharge l'app mobile si disponible). Il entre simplement son nom "Lucas" et peut immédiatement commencer à jouer - aucune friction, pas besoin de créer un compte.

**Usage Core:**
Pendant le méchoui, Lucas enregistre ses matchs facilement, voit son classement évoluer en temps réel sur l'écran, et constate sa progression après chaque match avec des animations visuelles.

**Moment de Succès:**
À la fin du méchoui, Lucas termine 3ème. Il voit son classement final et découvre ses stats personnelles (ELO, nombre de matchs, victoires/défaites). L'application lui propose de créer un compte pour conserver ses stats et accéder à plus de fonctionnalités. Intrigué par ce qu'il a vécu, il crée un compte.

**Long-terme:**
Lucas découvre alors ses stats personnelles détaillées et leur évolution, la possibilité de partager son classement sur les réseaux sociaux, la possibilité de créer son propre événement, et la possibilité de rejoindre d'autres ligues existantes. Il partage son classement sur Instagram avec une capture d'écran, ce qui génère des questions de ses amis. Quelques jours plus tard, il décide d'organiser un tournoi de beer pong pour son anniversaire. Il crée son championnat, invite ses amis via le QR code, et utilise l'app pour gérer l'événement. Il devient un utilisateur régulier, créant des championnats mensuels et suivant sa progression ELO au fil du temps. L'application l'a converti d'un casual player en organisateur passionné.

### Journey 3: Sophie, la Propriétaire de Bar

**Découverte:**
Sophie cherche des moyens de différencier son bar et créer des expériences engageantes. Elle découvre Beer Pong League via une recherche ou une recommandation d'un autre propriétaire de bar.

**Onboarding:**
Sophie s'abonne au service pour bars (abonnement mensuel). Elle configure le branding personnalisé pour son bar, crée son premier tournoi régulier, et configure l'écran de projection dans son établissement.

**Usage Core:**
Sophie organise des tournois hebdomadaires de beer pong. Les clients scannent le QR code, rejoignent le tournoi, et enregistrent leurs matchs. L'écran de projection crée de l'engouement dans le bar. Sophie suit les statistiques d'engagement via son dashboard.

**Moment de Succès:**
Voir les clients engagés autour de l'écran de projection pendant un tournoi, avec animations et réactions collectives, créant une atmosphère unique dans son bar. Les clients reviennent régulièrement pour participer aux tournois.

**Long-terme:**
Sophie constate une augmentation de la fréquentation les soirs de tournois, une meilleure fidélité client, et une différenciation claire de ses concurrents. Elle utilise les analytics pour optimiser ses événements et envisage d'étendre à d'autres jeux de bar (cornhole, fléchettes).

---

## Success Criteria

### User Success Metrics

#### Adoption Initiale

**Taux de Création de Championnat:**
- **Métrique:** 50% des utilisateurs créent un championnat dans les 7 jours après inscription
- **Mesure:** Nombre d'utilisateurs ayant créé au moins un championnat / Nombre total d'utilisateurs inscrits dans les 7 jours
- **Pourquoi:** Indicateur clé que les utilisateurs comprennent la valeur et passent à l'action rapidement
- **Cible MVP:** 30% (objectif initial, ajusté à 50% après optimisations)

**Taux de Rejoindre un Championnat:**
- **Métrique:** 70% des utilisateurs qui scannent un QR code rejoignent effectivement le championnat
- **Mesure:** Nombre d'utilisateurs ayant rejoint un championnat après scan QR / Nombre total de scans QR
- **Pourquoi:** Mesure la friction dans le processus d'onboarding et l'attractivité immédiate
- **Cible MVP:** 60% (objectif initial, ajusté à 70% après optimisations UX)

#### Engagement

**Fréquence de Matchs:**
- **Métrique:** 2 matchs par mois minimum par utilisateur actif
- **Mesure:** Nombre moyen de matchs enregistrés par utilisateur actif sur 30 jours
- **Pourquoi:** Indicateur que les utilisateurs trouvent de la valeur dans le suivi de leurs performances
- **Cible MVP:** 1.5 matchs/mois (objectif initial, ajusté à 2 après améliorations)

**Fréquence de Création d'Événements:**
- **Métrique:** 1 nouveau championnat par mois pour utilisateurs actifs (organisateurs)
- **Mesure:** Nombre moyen de championnats créés par organisateur actif sur 30 jours
- **Pourquoi:** Indicateur que les organisateurs réutilisent la plateforme régulièrement
- **Cible MVP:** 0.8 championnat/mois (objectif initial, ajusté à 1 après optimisations)

**Temps d'Engagement par Session:**
- **Métrique:** 5-10 minutes par session en moyenne
- **Mesure:** Temps moyen passé dans l'application par session active
- **Pourquoi:** Indicateur que l'expérience est fluide et engageante sans être chronophage
- **Cible MVP:** 3-5 minutes (objectif initial, ajusté après optimisations UX)

#### Rétention

**Rétention à 30 Jours:**
- **Métrique:** 10% des utilisateurs reviennent dans les 30 jours
- **Mesure:** Nombre d'utilisateurs actifs à J+30 / Nombre total d'utilisateurs à J+0
- **Pourquoi:** Indicateur de valeur à long terme et de création d'habitude
- **Cible MVP:** 7% (objectif initial, ajusté à 10% après améliorations engagement)

**Rétention à 90 Jours:**
- **Métrique:** 5% des utilisateurs reviennent dans les 90 jours
- **Mesure:** Nombre d'utilisateurs actifs à J+90 / Nombre total d'utilisateurs à J+0
- **Pourquoi:** Indicateur de valeur durable et de conversion en utilisateurs réguliers
- **Cible MVP:** 3% (objectif initial, ajusté à 5% après améliorations)

**Taux de Conversion Invité → Compte:**
- **Métrique:** 20% des joueurs invités créent un compte après leur premier événement
- **Mesure:** Nombre d'invités créant un compte / Nombre total d'invités ayant participé à un événement
- **Pourquoi:** Indicateur que l'expérience initiale est suffisamment engageante pour justifier la création de compte
- **Cible MVP:** 15% (objectif initial, ajusté à 20% après optimisations onboarding)

#### Expérience Utilisateur

**Simplicité d'Utilisation:**
- **Métrique:** 90% des utilisateurs complètent leur premier match enregistré sans aide
- **Mesure:** Nombre d'utilisateurs enregistrant un match sans assistance / Nombre total d'utilisateurs tentant d'enregistrer un match
- **Pourquoi:** Validation que l'interface est "alcoolisé-friendly" et intuitive
- **Cible MVP:** 85% (objectif initial, ajusté à 90% après optimisations UX)

**Moment "Wow" - Progression Visible:**
- **Métrique:** 80% des utilisateurs consultent leur classement après avoir enregistré un match
- **Mesure:** Nombre d'utilisateurs visualisant le classement après enregistrement match / Nombre total d'enregistrements de matchs
- **Pourquoi:** Indicateur que la progression visible crée de l'engagement immédiat
- **Cible MVP:** 70% (objectif initial, ajusté à 80% après améliorations animations)

**Expérience Collective (Post-MVP):**
- **Métrique:** 60% des événements utilisent l'écran de projection
- **Mesure:** Nombre d'événements avec écran de projection activé / Nombre total d'événements
- **Pourquoi:** Validation que l'écran de projection est un élément central de l'expérience
- **Cible V2:** 50% (objectif initial, ajusté à 60% après optimisations)

### Business Objectives

#### Revenus Utilisateurs (One-Time Payment)

**Objectif 3 Mois:**
- **Métrique:** 50 utilisateurs payants (10€ one-time) dans les 3 premiers mois
- **Revenus:** 500€ sur 3 mois
- **Taux de Conversion:** 5% des utilisateurs actifs convertissent en payant
- **Pourquoi:** Validation initiale du modèle économique et génération de revenus précoces
- **Cible MVP:** 30 utilisateurs payants (objectif conservateur, ajusté à 50 après optimisations)

**Objectif 12 Mois:**
- **Métrique:** 1 000 utilisateurs payants sur 12 mois
- **Revenus:** 10 000€ sur 12 mois
- **Taux de Conversion:** 10% des utilisateurs actifs convertissent en payant
- **Pourquoi:** Objectif de viabilité pour un side project bootstrap
- **Cible Année 1:** 800 utilisateurs payants (objectif initial, ajusté à 1 000 après optimisations)

**Croissance Mensuelle:**
- **Métrique:** 15% de croissance mensuelle des utilisateurs payants
- **Mesure:** (Utilisateurs payants mois N - Utilisateurs payants mois N-1) / Utilisateurs payants mois N-1
- **Pourquoi:** Indicateur de croissance organique et de viralité
- **Cible:** 10% croissance mensuelle (objectif initial, ajusté à 15% après optimisations)

#### Revenus Bars (Abonnement Mensuel)

**Objectif Première Année:**
- **Métrique:** 3-4 bars abonnés la première année
- **Revenus:** 300-400€/mois (à 100€/mois par bar)
- **Taux de Conversion:** 20% des bars contactés s'abonnent
- **Pourquoi:** Validation du modèle B2B et création de revenus récurrents
- **Cible Année 1:** 2-3 bars (objectif conservateur, ajusté à 3-4 après optimisations)

**Objectif Année 2:**
- **Métrique:** 10-15 bars abonnés
- **Revenus:** 1 000-1 500€/mois
- **Taux de Conversion:** 25% des bars contactés s'abonnent
- **Pourquoi:** Scaling du modèle B2B et diversification des revenus
- **Cible Année 2:** 8-12 bars (objectif initial, ajusté à 10-15 après optimisations)

**Rétention Bars:**
- **Métrique:** 80% de rétention annuelle des bars abonnés
- **Mesure:** Nombre de bars renouvelant leur abonnement après 12 mois / Nombre total de bars abonnés
- **Pourquoi:** Indicateur de valeur perçue et de satisfaction des bars
- **Cible:** 75% (objectif initial, ajusté à 80% après améliorations)

#### Revenus Totaux

**Objectif Viabilité (6-12 Mois):**
- **Métrique:** 500-1 000€ de revenus mensuels
- **Composition:** 
  - 300-500€/mois (utilisateurs payants one-time)
  - 200-500€/mois (bars abonnés)
- **Pourquoi:** Objectif de viabilité pour un side project bootstrap, permettant de couvrir les coûts et générer un revenu complémentaire
- **Cible 6 Mois:** 300-500€/mois (objectif initial)
- **Cible 12 Mois:** 500-1 000€/mois (objectif ajusté)

**Objectif Croissance (Année 2):**
- **Métrique:** 2 000-3 000€ de revenus mensuels
- **Composition:**
  - 1 000-1 500€/mois (utilisateurs payants one-time)
  - 1 000-1 500€/mois (bars abonnés)
- **Pourquoi:** Scaling du modèle économique et création d'un revenu significatif
- **Cible Année 2:** 1 500-2 500€/mois (objectif initial, ajusté à 2 000-3 000€ après optimisations)

#### Growth

**Growth Organique:**
- **Métrique:** 70% de croissance via partage social et partenariats bars
- **Mesure:** Nombre d'utilisateurs acquis via partage social + partenariats / Nombre total d'utilisateurs acquis
- **Pourquoi:** Validation du modèle de croissance organique et viralité
- **Cible:** 60% (objectif initial, ajusté à 70% après optimisations partage social)

**Partenariats Bars:**
- **Métrique:** 20 bars partenaires (recommandant l'app) dans les 12 premiers mois
- **Mesure:** Nombre de bars affichant QR codes et recommandant l'app
- **Pourquoi:** Levier de croissance organique et validation du modèle de distribution
- **Cible:** 15 bars (objectif initial, ajusté à 20 après optimisations)

**Taux de Partage Social:**
- **Métrique:** 15% des utilisateurs partagent leur classement/achievements sur les réseaux sociaux
- **Mesure:** Nombre d'utilisateurs partageant / Nombre total d'utilisateurs actifs
- **Pourquoi:** Indicateur de viralité et de croissance organique
- **Cible:** 10% (objectif initial, ajusté à 15% après optimisations partage)

### Technical Success Metrics

#### Performance

**Temps de Chargement:**
- **Métrique:** < 2 secondes pour chargement initial de l'application
- **Mesure:** Temps moyen de chargement de la page principale
- **Pourquoi:** Expérience utilisateur fluide, surtout en contexte bar avec connexion potentiellement instable
- **Cible MVP:** < 3 secondes (objectif initial, optimisé à < 2 secondes)

**Réactivité Actions Utilisateur:**
- **Métrique:** < 500ms pour enregistrer un match et voir la mise à jour du classement
- **Mesure:** Temps entre soumission du formulaire de match et mise à jour visible du classement
- **Pourquoi:** Feedback immédiat essentiel pour l'expérience "wow moment"
- **Cible MVP:** < 1 seconde (objectif initial, optimisé à < 500ms)

**Temps Réel (Post-MVP):**
- **Métrique:** < 200ms de latence pour mise à jour écran de projection
- **Mesure:** Temps entre enregistrement d'un match et mise à jour sur écran de projection
- **Pourquoi:** Expérience collective fluide et engageante
- **Cible V2:** < 500ms (objectif initial, optimisé à < 200ms)

#### Disponibilité

**Uptime:**
- **Métrique:** 99%+ d'uptime
- **Mesure:** Temps de disponibilité du service / Temps total
- **Pourquoi:** Fiabilité essentielle pour des événements en temps réel
- **Cible:** 98% (objectif initial, optimisé à 99%+)

**Tolérance aux Pannes:**
- **Métrique:** 100% de fonctionnalité offline (localStorage fallback)
- **Mesure:** Pourcentage de fonctionnalités disponibles sans connexion internet
- **Pourquoi:** Essentiel pour contexte bar avec connexion potentiellement instable
- **Cible:** 100% (objectif MVP)

#### Fonctionnalités Techniques

**Synchronisation Offline/Online:**
- **Métrique:** 100% de synchronisation réussie après reconnexion
- **Mesure:** Nombre de synchronisations réussies / Nombre total de tentatives de synchronisation
- **Pourquoi:** Expérience fluide même avec connexion instable
- **Cible:** 95% (objectif initial, optimisé à 100%)

**Temps Réel Écran de Projection (Post-MVP):**
- **Métrique:** 99% de fiabilité des mises à jour temps réel
- **Mesure:** Nombre de mises à jour reçues / Nombre total de mises à jour envoyées
- **Pourquoi:** Expérience collective fiable et engageante
- **Cible V2:** 95% (objectif initial, optimisé à 99%)

---

## Product Scope

### MVP - Minimum Viable Product

#### Core Features

**1. Gestion de Championnats**

**Création de Championnat:**
- Création simple et rapide (nom, date, configuration minimale)
- Génération automatique de QR code d'invitation
- Interface "alcoolisé-friendly" : gros boutons, flow minimal, simplicité extrême
- Support pour formats de match : 1v1, 2v2, 3v3
- Configuration anti-triche optionnelle (confirmation mutuelle des résultats)

**Gestion des Participants:**
- Rejoindre un championnat via QR code avec zero-friction
- Mode invité : jouer sans créer de compte (juste nom)
- Système d'identité dual : utilisateurs authentifiés + utilisateurs anonymes
- Promotion invité → compte pour conserver les stats

**2. Système de Matchs et Scoring**

**Enregistrement de Matchs:**
- Enregistrement simple et intuitif des résultats
- Support formats : 1v1, 2v2, 3v3
- Interface optimisée pour utilisation rapide (gros boutons, flow minimal)
- Validation des résultats (option anti-triche avec confirmation mutuelle)

**Calcul ELO:**
- Système ELO automatique pour classement
- Mise à jour immédiate du classement après chaque match
- Visualisation claire de la progression (montée/descente dans le classement)
- Compréhension simple en pratique (gagner = monter, perdre = descendre)

**3. Classements et Statistiques**

**Classement en Temps Réel:**
- Classement mis à jour automatiquement après chaque match
- Visualisation claire et lisible du classement
- Top 3 mis en avant (design spécial)
- Affichage des changements de position (progression visible)

**Statistiques Personnelles:**
- ELO actuel
- Nombre de matchs joués
- Victoires / Défaites
- Streak (série de victoires/défaites)
- Stats accessibles après création de compte (pour invités)

**4. Authentification et Identité**

**Authentification Optionnelle:**
- Email + OTP pour création de compte
- Mode invité pour jouer sans compte
- Promotion invité → compte pour conserver les stats
- Merge automatique des données invité vers compte

**Gestion d'Identité:**
- Profils utilisateurs (authentifiés)
- Profils anonymes (device-bound)
- Synchronisation Supabase avec fallback localStorage
- Migration automatique localStorage → Supabase

**5. Interface Utilisateur**

**Design "Alcoolisé-Friendly":**
- Gros boutons, flow minimal
- Interface utilisable même en soirée
- Lisibilité optimisée (contrastes, tailles de police)
- Navigation intuitive et simple

**Responsive Web:**
- Version web responsive uniquement (pas d'app native au MVP)
- Optimisé pour mobile (utilisation principale sur téléphone)
- Fonctionne sur tous les navigateurs modernes
- Offline-first avec localStorage fallback

**6. Partage et Découverte**

**QR Code d'Invitation:**
- Génération automatique de QR code pour chaque championnat
- Scan QR code pour rejoindre rapidement
- Partage facile du QR code (affichage, impression)

**Découverte Basique:**
- Rejoindre un championnat via QR code
- Pas de marketplace ou discovery avancé au MVP

### Out of Scope for MVP

#### Fonctionnalités Exclues (Post-MVP)

**Écran de Projection:**
- **Statut:** Exclu du MVP, priorité post-MVP immédiate
- **Raison:** Complexité technique (temps réel, animations) et besoin de valider le core d'abord
- **Timeline:** V1.5 (avec app mobile - priorité rapide)

**Application Mobile Native:**
- **Statut:** Exclu du MVP, priorité post-MVP rapide
- **Raison:** MVP web responsive permet de valider le concept rapidement
- **Timeline:** V1.5 - V2 (priorité rapide après validation MVP web)
- **Note:** L'utilisateur souhaite accéder rapidement à l'application mobile après le MVP

**Ligues:**
- **Statut:** Exclu du MVP, priorité post-MVP
- **Raison:** Focus sur championnats uniquement pour simplifier le MVP
- **Timeline:** V2 (après validation championnats)

**Monétisation:**
- **Statut:** Exclu du MVP
- **Raison:** Gratuit pour tous au début pour réduire barrières d'entrée et maximiser adoption
- **Timeline:** V1.5 - V2 (après validation et adoption)

**Gamification Avancée:**
- **Statut:** Exclu du MVP
- **Raison:** Focus sur fonctionnalités core d'abord
- **Fonctionnalités exclues:**
  - Badges et achievements
  - Animations confettis
  - Streak fire
  - Défis hebdomadaires
- **Timeline:** V2+ (après validation core)

**Fonctionnalités Sociales Avancées:**
- **Statut:** Exclu du MVP
- **Raison:** Focus sur gestion de tournois d'abord
- **Fonctionnalités exclues:**
  - Partage social intégré (Instagram, Facebook)
  - Rivalités automatiques
  - Comparaison avec amis
  - Feed social
- **Timeline:** V2+ (après validation core)

**Analytics et Reporting:**
- **Statut:** Exclu du MVP
- **Raison:** Pas essentiel pour résoudre le problème core
- **Fonctionnalités exclues:**
  - Dashboard analytics pour organisateurs
  - Rapports d'engagement
  - Statistiques avancées
- **Timeline:** V2+ (après validation)

**Multi-Sport:**
- **Statut:** Exclu du MVP
- **Raison:** Focus beer pong uniquement
- **Timeline:** V3+ (expansion future)

**Intégrations:**
- **Statut:** Exclu du MVP
- **Raison:** Pas essentiel pour MVP
- **Fonctionnalités exclues:**
  - Intégration POS systems
  - Intégration réseaux sociaux
  - API publique
- **Timeline:** V3+ (expansion future)

### MVP Success Criteria

#### Critères de Validation MVP

**Adoption Initiale:**
- 30% des utilisateurs créent un championnat dans les 7 jours après inscription
- 60% des utilisateurs qui scannent un QR code rejoignent effectivement le championnat
- **Décision:** Si ces métriques sont atteintes, MVP valide l'adoption

**Engagement:**
- 1.5 matchs par mois minimum par utilisateur actif
- 0.8 nouveau championnat par mois pour organisateurs actifs
- **Décision:** Si ces métriques sont atteintes, MVP valide l'engagement

**Rétention:**
- 7% des utilisateurs reviennent dans les 30 jours
- 15% des joueurs invités créent un compte après leur premier événement
- **Décision:** Si ces métriques sont atteintes, MVP valide la rétention

**Expérience Utilisateur:**
- 85% des utilisateurs complètent leur premier match enregistré sans aide
- 70% des utilisateurs consultent leur classement après avoir enregistré un match
- **Décision:** Si ces métriques sont atteintes, MVP valide l'UX

**Technique:**
- < 3 secondes pour chargement initial
- < 1 seconde pour enregistrer un match et voir la mise à jour
- 95% de synchronisation réussie après reconnexion
- **Décision:** Si ces métriques sont atteintes, MVP valide la faisabilité technique

#### Go/No-Go Decision Points

**Go pour V1.5 (App Mobile + Monétisation):**
- Si 3+ critères de validation sont atteints
- Si feedback utilisateurs est positif sur le core
- Si problèmes techniques majeurs sont résolus

**Go pour V2 (Ligues + Gamification):**
- Si 4+ critères de validation sont atteints
- Si adoption et engagement sont en croissance
- Si modèle économique est validé (V1.5)
- Si écran de projection (V1.5) est validé et utilisé

**No-Go / Pivot:**
- Si < 2 critères de validation sont atteints après 3 mois
- Si feedback utilisateurs identifie des problèmes fondamentaux
- Si problèmes techniques bloquants persistent

---

## Future Vision

### Roadmap Post-MVP

**V1.5 - App Mobile + Écran Projection + Monétisation (Priorité Rapide):**
- **Timeline:** 2-3 mois après MVP
- **Fonctionnalités:**
  - Application mobile native iOS + Android
  - Écran de projection temps réel avec animations
  - Monétisation one-time 10€ (ligue + 5 championnats)
  - Packs supplémentaires pour plus d'événements
  - Notifications push
- **Objectif:** Valider modèle économique, améliorer expérience mobile, et créer l'expérience collective avec écran de projection

**V2 - Engagement et Expansion:**
- **Timeline:** 4-6 mois après MVP
- **Fonctionnalités:**
  - Ligues (après championnats)
  - Gamification basique (confettis, badges, streaks)
  - Partage social intégré (Instagram, Facebook)
- **Objectif:** Créer les "moments wow" et augmenter l'engagement avec gamification

**V2.5 - Fonctionnalités Sociales:**
- **Timeline:** 6-9 mois après MVP
- **Fonctionnalités:**
  - Rivalités automatiques
  - Comparaison avec amis
  - Feed social
  - Défis communautaires
- **Objectif:** Construire la communauté et la viralité

**V3 - Expansion Produit:**
- **Timeline:** 9-12 mois après MVP
- **Fonctionnalités:**
  - Multi-jeux de bar (cornhole, fléchettes, baby-foot)
  - Marketplace d'événements
  - Analytics dashboard pour organisateurs
  - Intégrations (POS, réseaux sociaux)
- **Objectif:** Expansion du marché et diversification

**V3+ - Expansion Business:**
- **Timeline:** 12+ mois après MVP
- **Fonctionnalités:**
  - SaaS pour bars (abonnement mensuel)
  - API publique
  - White-label pour chaînes de bars
  - Expansion géographique (France → International)
- **Objectif:** Scaling business et création de revenus récurrents

### Vision Long Terme (2-3 Ans)

**Plateforme Complète de Bar Entertainment:**
- Leader en France pour gestion de tournois de bar
- Support multi-jeux (beer pong, cornhole, fléchettes, baby-foot, etc.)
- Marketplace connectant bars et joueurs
- Communauté active avec événements réguliers

**Écosystème Social:**
- Plateforme sociale pour compétitions entre amis
- Streaming et contenu (Twitch, sites MDR)
- Partenariats avec marques de bière
- Programme d'affiliation pour organisateurs

**Expansion Géographique:**
- Présence en Europe (Allemagne, UK, Espagne)
- Expansion vers Amérique du Nord
- Adaptation locale (langues, cultures, réglementations)

**Modèle Business Mature:**
- Revenus récurrents via SaaS bars
- Revenus one-time via utilisateurs payants
- Revenus complémentaires (sponsoring, partenariats)
- Viabilité économique complète

---

## Functional Requirements

### FR1: Championnat Management

**FR1.1: Création de Championnat**
- **Priorité:** P0 (MVP)
- **Description:** Un utilisateur peut créer un championnat en spécifiant nom, date, et configuration minimale
- **Acceptance Criteria:**
  - Formulaire simple avec 3-5 champs maximum
  - Génération automatique d'un QR code d'invitation
  - Support formats 1v1, 2v2, 3v3
  - Interface "alcoolisé-friendly" (gros boutons, flow minimal)
- **User Story:** En tant qu'organisateur, je veux créer un championnat rapidement pour que je puisse commencer à inviter des participants sans friction

**FR1.2: Rejoindre un Championnat**
- **Priorité:** P0 (MVP)
- **Description:** Un utilisateur peut rejoindre un championnat via QR code sans créer de compte
- **Acceptance Criteria:**
  - Scan QR code fonctionne sur mobile
  - Saisie rapide du nom (pas de compte requis)
  - Rejoindre en < 30 secondes
  - Mode invité fonctionnel
- **User Story:** En tant que joueur, je veux rejoindre un championnat rapidement via QR code pour que je puisse commencer à jouer immédiatement

**FR1.3: Gestion des Participants**
- **Priorité:** P0 (MVP)
- **Description:** L'organisateur peut voir la liste des participants et leurs stats
- **Acceptance Criteria:**
  - Liste des participants visible
  - Stats de base affichées (ELO, matchs joués)
  - Interface claire et lisible
- **User Story:** En tant qu'organisateur, je veux voir qui participe à mon championnat pour que je puisse suivre l'engagement

### FR2: Match Management

**FR2.1: Enregistrement de Match**
- **Priorité:** P0 (MVP)
- **Description:** Un utilisateur peut enregistrer un match avec score et participants
- **Acceptance Criteria:**
  - Formulaire simple (sélection joueurs, score)
  - Support formats 1v1, 2v2, 3v3
  - Interface optimisée mobile (gros boutons)
  - Enregistrement en < 1 minute
- **User Story:** En tant que joueur, je veux enregistrer un match rapidement pour que le classement se mette à jour immédiatement

**FR2.2: Calcul ELO Automatique**
- **Priorité:** P0 (MVP)
- **Description:** Le système calcule automatiquement les changements ELO après chaque match
- **Acceptance Criteria:**
  - Calcul ELO automatique et immédiat
  - Mise à jour du classement en temps réel
  - Visualisation claire de la progression
- **User Story:** En tant que joueur, je veux voir mon ELO évoluer après chaque match pour que je puisse suivre ma progression

**FR2.3: Anti-Triche Optionnel**
- **Priorité:** P1 (MVP)
- **Description:** Option de confirmation mutuelle des résultats pour éviter la triche
- **Acceptance Criteria:**
  - Configuration optionnelle par championnat
  - Demande de confirmation au perdant
  - Match en statut "pending" jusqu'à confirmation
- **User Story:** En tant qu'organisateur, je veux activer l'anti-triche pour que les résultats soient fiables

### FR3: Classements et Stats

**FR3.1: Classement en Temps Réel**
- **Priorité:** P0 (MVP)
- **Description:** Le classement se met à jour automatiquement après chaque match
- **Acceptance Criteria:**
  - Mise à jour automatique et immédiate
  - Top 3 mis en avant visuellement
  - Affichage des changements de position
  - Interface claire et lisible
- **User Story:** En tant que joueur, je veux voir le classement se mettre à jour en temps réel pour que je puisse suivre ma progression

**FR3.2: Statistiques Personnelles**
- **Priorité:** P0 (MVP)
- **Description:** Un utilisateur peut voir ses stats personnelles (ELO, matchs, victoires/défaites)
- **Acceptance Criteria:**
  - Stats accessibles après création de compte
  - ELO actuel affiché
  - Nombre de matchs, victoires, défaites
  - Streak (série de victoires/défaites)
- **User Story:** En tant que joueur, je veux voir mes stats personnelles pour que je puisse suivre ma progression sur le long terme

### FR4: Authentification et Identité

**FR4.1: Authentification Optionnelle**
- **Priorité:** P0 (MVP)
- **Description:** Un utilisateur peut créer un compte avec email + OTP, ou jouer en mode invité
- **Acceptance Criteria:**
  - Email + OTP fonctionnel
  - Mode invité sans compte
  - Promotion invité → compte pour conserver stats
  - Merge automatique des données
- **User Story:** En tant que joueur, je veux pouvoir jouer sans compte pour que je puisse commencer immédiatement, puis créer un compte plus tard pour conserver mes stats

**FR4.2: Gestion d'Identité Dual**
- **Priorité:** P0 (MVP)
- **Description:** Le système supporte utilisateurs authentifiés et anonymes avec merge
- **Acceptance Criteria:**
  - Profils utilisateurs (authentifiés)
  - Profils anonymes (device-bound)
  - Synchronisation Supabase + localStorage
  - Migration automatique localStorage → Supabase
- **User Story:** En tant que système, je dois gérer les identités dual pour que les utilisateurs puissent jouer avec ou sans compte

### FR5: Interface Utilisateur

**FR5.1: Design "Alcoolisé-Friendly"**
- **Priorité:** P0 (MVP)
- **Description:** L'interface est utilisable même en soirée avec gros boutons et flow minimal
- **Acceptance Criteria:**
  - Gros boutons (minimum 44x44px)
  - Flow minimal (2-3 clics max pour actions principales)
  - Lisibilité optimisée (contrastes forts, tailles de police grandes)
  - Navigation intuitive
- **User Story:** En tant que joueur en soirée, je veux une interface simple et claire pour que je puisse l'utiliser facilement même après quelques bières

**FR5.2: Responsive Web**
- **Priorité:** P0 (MVP)
- **Description:** L'application fonctionne sur tous les appareils avec design responsive
- **Acceptance Criteria:**
  - Optimisé pour mobile (utilisation principale)
  - Fonctionne sur desktop et tablette
  - Compatible tous navigateurs modernes
  - Offline-first avec localStorage fallback
- **User Story:** En tant qu'utilisateur, je veux accéder à l'application sur n'importe quel appareil pour que je puisse l'utiliser partout

### FR6: Partage et Découverte

**FR6.1: QR Code d'Invitation**
- **Priorité:** P0 (MVP)
- **Description:** Chaque championnat génère automatiquement un QR code d'invitation
- **Acceptance Criteria:**
  - Génération automatique du QR code
  - Scan QR code fonctionnel sur mobile
  - Partage facile (affichage, impression)
  - Rejoindre championnat via QR code
- **User Story:** En tant qu'organisateur, je veux un QR code d'invitation pour que les participants puissent rejoindre facilement mon championnat

**FR6.2: Découverte de Championnats (Post-MVP)**
- **Priorité:** P2 (V2+)
- **Description:** Un utilisateur peut découvrir et rejoindre des championnats publics
- **Acceptance Criteria:**
  - Liste de championnats publics disponibles
  - Recherche et filtrage de championnats
  - Rejoindre un championnat public sans invitation
- **User Story:** En tant que joueur, je veux découvrir des championnats publics pour que je puisse participer à plus d'événements

### FR7: Écran de Projection (Post-MVP)

**FR7.1: Affichage Temps Réel**
- **Priorité:** P1 (V1.5)
- **Description:** L'organisateur peut afficher le classement en temps réel sur un écran de projection
- **Acceptance Criteria:**
  - Mode écran de projection activable pour chaque championnat
  - Mise à jour automatique en temps réel (< 200ms latence)
  - Interface optimisée pour lisibilité de loin
  - URL dédiée pour écran de projection
- **User Story:** En tant qu'organisateur, je veux afficher le classement sur un écran de projection pour que tous les participants voient les résultats en temps réel

**FR7.2: Animations et Effets Visuels**
- **Priorité:** P2 (V2)
- **Description:** L'écran de projection affiche des animations lors des mises à jour de classement
- **Acceptance Criteria:**
  - Animations lors des changements de position
  - Confettis lors des progressions importantes
  - Mise en avant du Top 3 avec design spécial
  - Effets visuels pour moments importants
- **User Story:** En tant que participant, je veux voir des animations sur l'écran de projection pour que l'expérience soit plus engageante et mémorable

### FR8: Partage Social (Post-MVP)

**FR8.1: Partage de Classement**
- **Priorité:** P1 (V2)
- **Description:** Un utilisateur peut partager son classement ou ses achievements sur les réseaux sociaux
- **Acceptance Criteria:**
  - Partage vers Instagram, Facebook, Twitter
  - Image générée automatiquement avec classement/stats
  - Lien de retour vers l'application
  - Métadonnées optimisées pour partage
- **User Story:** En tant que joueur, je veux partager mon classement sur les réseaux sociaux pour que mes amis voient mes performances

**FR8.2: Partage d'Achievements**
- **Priorité:** P2 (V2)
- **Description:** Un utilisateur peut partager ses achievements et badges sur les réseaux sociaux
- **Acceptance Criteria:**
  - Partage d'achievements individuels
  - Images de badges partageables
  - Métadonnées pour réseaux sociaux
- **User Story:** En tant que joueur, je veux partager mes achievements pour célébrer mes accomplissements

### FR9: Notifications (Post-MVP)

**FR9.1: Notifications Push Mobile**
- **Priorité:** P1 (V1.5)
- **Description:** Un utilisateur peut recevoir des notifications push sur mobile pour événements importants
- **Acceptance Criteria:**
  - Notifications pour nouveau match enregistré dans son championnat
  - Notifications pour changement de classement
  - Notifications pour nouveaux championnats créés par amis
  - Notifications pour rappels d'événements
  - Gestion des préférences de notifications
- **User Story:** En tant que joueur, je veux recevoir des notifications push pour que je sois informé des événements importants même quand je n'utilise pas l'app

**FR9.2: Notifications In-App**
- **Priorité:** P1 (V1.5)
- **Description:** Un utilisateur peut recevoir des notifications in-app pour événements importants
- **Acceptance Criteria:**
  - Notifications affichées dans l'application
  - Centre de notifications accessible
  - Marquage des notifications lues/non lues
- **User Story:** En tant qu'utilisateur, je veux voir les notifications dans l'app pour que je ne rate pas d'informations importantes

### FR10: Gamification (Post-MVP)

**FR10.1: Badges et Achievements**
- **Priorité:** P2 (V2)
- **Description:** Un utilisateur peut gagner des badges et achievements en accomplissant des milestones
- **Acceptance Criteria:**
  - Système de badges (première victoire, 10 matchs, ELO 1500, etc.)
  - Affichage des badges dans le profil
  - Notification lors de l'obtention d'un badge
  - Historique des achievements
- **User Story:** En tant que joueur, je veux gagner des badges pour que je sois reconnu pour mes accomplissements

**FR10.2: Streaks et Séries**
- **Priorité:** P2 (V2)
- **Description:** Un utilisateur peut voir ses streaks (séries de victoires/défaites) et suivre ses records
- **Acceptance Criteria:**
  - Affichage des streaks actuels
  - Historique des meilleures séries
  - Records personnels (meilleur ELO, plus longue série, etc.)
  - Visualisation des streaks (fire animations, etc.)
- **User Story:** En tant que joueur, je veux voir mes streaks pour que je puisse suivre mes performances et me motiver

**FR10.3: Défis et Challenges**
- **Priorité:** P3 (V2.5+)
- **Description:** Un utilisateur peut participer à des défis hebdomadaires ou communautaires
- **Acceptance Criteria:**
  - Défis hebdomadaires proposés
  - Défis communautaires globaux/locaux
  - Suivi de progression des défis
  - Récompenses pour complétion
- **User Story:** En tant que joueur, je veux participer à des défis pour que je sois motivé à jouer régulièrement

### FR11: Fonctionnalités Sociales Avancées (Post-MVP)

**FR11.1: Rivalités Automatiques**
- **Priorité:** P3 (V2.5)
- **Description:** Le système détecte automatiquement les rivalités entre joueurs basées sur leurs matchs
- **Acceptance Criteria:**
  - Détection automatique des rivalités (matchs fréquents, scores serrés)
  - Affichage des rivalités dans le profil
  - Statistiques de rivalité (tête-à-tête)
- **User Story:** En tant que joueur, je veux voir mes rivalités automatiques pour que je puisse suivre mes compétitions avec des adversaires récurrents

**FR11.2: Comparaison avec Amis**
- **Priorité:** P3 (V2.5)
- **Description:** Un utilisateur peut comparer ses stats avec celles de ses amis
- **Acceptance Criteria:**
  - Liste d'amis/connections
  - Comparaison de stats (ELO, matchs, victoires)
  - Classement parmi les amis
- **User Story:** En tant que joueur, je veux comparer mes stats avec mes amis pour que je puisse voir comment je me situe dans mon groupe

**FR11.3: Feed Social**
- **Priorité:** P3 (V2.5)
- **Description:** Un utilisateur peut voir un feed social avec les activités de ses amis et de la communauté
- **Acceptance Criteria:**
  - Feed d'activités (matchs joués, achievements, classements)
  - Filtrage par amis/communauté
  - Interactions (likes, comments - futur)
- **User Story:** En tant qu'utilisateur, je veux voir un feed social pour que je reste engagé avec la communauté

### FR12: Ligues (Post-MVP)

**FR12.1: Création de Ligue**
- **Priorité:** P2 (V2)
- **Description:** Un utilisateur peut créer une ligue (série de championnats récurrents)
- **Acceptance Criteria:**
  - Création de ligue avec nom, description
  - Configuration de la ligue (durée, fréquence)
  - Gestion des participants à la ligue
  - ELO global de ligue
- **User Story:** En tant qu'organisateur, je veux créer une ligue pour que je puisse organiser des événements récurrents avec continuité

**FR12.2: Gestion de Ligue**
- **Priorité:** P2 (V2)
- **Description:** Un organisateur peut gérer une ligue (ajouter championnats, gérer participants)
- **Acceptance Criteria:**
  - Ajouter des championnats à une ligue
  - Gérer les participants de la ligue
  - Voir le classement global de la ligue
  - Statistiques de la ligue
- **User Story:** En tant qu'organisateur, je veux gérer ma ligue pour que je puisse organiser plusieurs événements avec un classement global

**FR12.3: Rejoindre une Ligue**
- **Priorité:** P2 (V2)
- **Description:** Un utilisateur peut rejoindre une ligue existante
- **Acceptance Criteria:**
  - Découverte de ligues publiques
  - Rejoindre via invitation ou QR code
  - Participation automatique aux championnats de la ligue
- **User Story:** En tant que joueur, je veux rejoindre une ligue pour que je puisse participer à une série d'événements avec progression continue

### FR13: Application Mobile (Post-MVP)

**FR13.1: Application Mobile Native**
- **Priorité:** P1 (V1.5)
- **Description:** Un utilisateur peut utiliser l'application sur mobile native (iOS + Android)
- **Acceptance Criteria:**
  - Application native iOS disponible
  - Application native Android disponible
  - Fonctionnalités core disponibles sur mobile
  - Synchronisation avec version web
- **User Story:** En tant qu'utilisateur, je veux utiliser l'application sur mobile native pour que j'aie une expérience optimisée sur mon téléphone

**FR13.2: Scan QR Code Mobile**
- **Priorité:** P1 (V1.5)
- **Description:** Un utilisateur peut scanner un QR code directement depuis l'application mobile
- **Acceptance Criteria:**
  - Accès caméra depuis l'app mobile
  - Scan QR code fonctionnel
  - Rejoindre championnat automatiquement après scan
  - Permissions caméra gérées
- **User Story:** En tant que joueur, je veux scanner un QR code depuis l'app mobile pour que je puisse rejoindre un championnat rapidement

**FR13.3: Géolocalisation (Post-MVP)**
- **Priorité:** P2 (V2+)
- **Description:** Un utilisateur peut utiliser la géolocalisation pour découvrir des événements proches
- **Acceptance Criteria:**
  - Découverte d'événements à proximité
  - Filtrage géographique
  - Permissions géolocalisation gérées
- **User Story:** En tant que joueur, je veux voir les événements proches de moi pour que je puisse participer à des tournois locaux

### FR14: Monétisation (Post-MVP)

**FR14.1: Paiement One-Time**
- **Priorité:** P1 (V1.5)
- **Description:** Un utilisateur peut effectuer un paiement one-time pour débloquer la création de ligue et des championnats supplémentaires
- **Acceptance Criteria:**
  - Paiement one-time 10€ (ligue + 5 championnats)
  - Intégration système de paiement (Stripe, etc.)
  - Gestion des limites gratuites vs payantes
  - Confirmation de paiement et déblocage de features
- **User Story:** En tant qu'utilisateur, je veux payer 10€ pour débloquer la création de ligue et plus de championnats pour que je puisse organiser plus d'événements

**FR14.2: Packs Supplémentaires**
- **Priorité:** P1 (V1.5)
- **Description:** Un utilisateur peut acheter des packs supplémentaires pour créer plus d'événements
- **Acceptance Criteria:**
  - Packs d'événements supplémentaires disponibles
  - Achat in-app (iOS + Android)
  - Gestion des packs achetés
  - Synchronisation web ↔ mobile
- **User Story:** En tant qu'utilisateur, je veux acheter des packs supplémentaires pour que je puisse créer plus de championnats

**FR14.3: Abonnement Bars (Post-MVP)**
- **Priorité:** P3 (V3+)
- **Description:** Un bar peut s'abonner pour accéder à des features premium (branding, analytics, etc.)
- **Acceptance Criteria:**
  - Abonnement mensuel pour bars
  - Features premium (branding personnalisé, analytics, etc.)
  - Gestion des abonnements
  - Dashboard bar dédié
- **User Story:** En tant que propriétaire de bar, je veux m'abonner pour accéder à des features premium pour que je puisse différencier mon établissement

### FR15: Analytics et Reporting (Post-MVP)

**FR15.1: Dashboard Organisateur**
- **Priorité:** P3 (V3+)
- **Description:** Un organisateur peut voir des analytics et statistiques sur ses événements
- **Acceptance Criteria:**
  - Dashboard avec statistiques d'engagement
  - Nombre de participants, matchs joués
  - Taux de participation
  - Statistiques temporelles
- **User Story:** En tant qu'organisateur, je veux voir des analytics sur mes événements pour que je puisse comprendre l'engagement et optimiser

**FR15.2: Rapports d'Engagement**
- **Priorité:** P3 (V3+)
- **Description:** Un organisateur peut générer des rapports d'engagement pour ses événements
- **Acceptance Criteria:**
  - Génération de rapports d'engagement
  - Export de données
  - Statistiques comparatives
- **User Story:** En tant qu'organisateur, je veux générer des rapports d'engagement pour que je puisse analyser la performance de mes événements

### FR16: Multi-Platform Synchronisation

**FR16.1: Synchronisation Web ↔ Mobile**
- **Priorité:** P1 (V1.5)
- **Description:** Les données sont synchronisées automatiquement entre version web et mobile
- **Acceptance Criteria:**
  - Synchronisation automatique via Supabase
  - Même source de vérité (Supabase)
  - Pas de conflits de données
  - Synchronisation en temps réel
- **User Story:** En tant qu'utilisateur, je veux que mes données soient synchronisées entre web et mobile pour que je puisse utiliser l'app sur n'importe quel appareil

**FR16.2: Offline Support Web**
- **Priorité:** P0 (MVP)
- **Description:** L'application web fonctionne offline avec synchronisation automatique à la reconnexion
- **Acceptance Criteria:**
  - Fonctionnalité complète offline (localStorage)
  - Synchronisation automatique à la reconnexion
  - Pas de perte de données
  - Gestion des conflits
- **User Story:** En tant qu'utilisateur, je veux que l'app fonctionne offline pour que je puisse l'utiliser même avec une connexion instable

---

## Technical Requirements

### TR1: Architecture

**TR1.1: Stack Technologique**
- **Frontend:** React 18 + TypeScript 5 + Vite 5
- **Styling:** Tailwind CSS
- **Backend:** Supabase (Auth, Postgres, Realtime)
- **Routing:** React Router 6
- **Hosting:** Vercel (SPA deployment)
- **State Management:** React Context (Auth, Identity, League)

**TR1.2: Offline-First Architecture**
- **Description:** L'application fonctionne offline avec localStorage fallback
- **Requirements:**
  - Synchronisation localStorage ↔ Supabase
  - Migration automatique localStorage → Supabase
  - Fonctionnalité complète offline
  - Sync automatique à la reconnexion

### TR2: Performance

**TR2.1: Temps de Chargement**
- **Target:** < 2 secondes pour chargement initial
- **Measurement:** Temps moyen de chargement de la page principale
- **Optimization:** Code splitting, lazy loading, asset optimization

**TR2.2: Réactivité Actions**
- **Target:** < 500ms pour enregistrer un match et voir la mise à jour
- **Measurement:** Temps entre soumission formulaire et mise à jour visible
- **Optimization:** Optimistic updates, caching, efficient state management

### TR3: Disponibilité

**TR3.1: Uptime**
- **Target:** 99%+ d'uptime
- **Measurement:** Temps de disponibilité / Temps total
- **Requirements:** Monitoring, alerting, failover mechanisms

**TR3.2: Tolérance aux Pannes**
- **Target:** 100% de fonctionnalité offline
- **Requirements:** localStorage fallback, sync automatique, graceful degradation

### TR4: Sécurité

**TR4.1: Authentification**
- **Requirements:**
  - Supabase Auth (email + OTP)
  - Row Level Security (RLS) sur toutes les tables
  - Protection CSRF
  - Validation côté client et serveur

**TR4.2: Protection des Données**
- **Requirements:**
  - Chiffrement des données sensibles
  - Conformité GDPR (Europe)
  - Gestion des consentements
  - Suppression des données utilisateur

### TR5: Scalabilité

**TR5.1: Base de Données**
- **Requirements:**
  - Supabase Postgres avec RLS
  - Indexes optimisés pour requêtes fréquentes
  - Migrations versionnées
  - Backup automatique

**TR5.2: Temps Réel (Post-MVP)**
- **Requirements:**
  - Supabase Realtime pour écran de projection
- **Target:** < 200ms latence, 99% fiabilité
- **Timeline:** V1.5

---

## Non-Functional Requirements

### NFR1: Usability

**NFR1.1: Simplicité d'Utilisation**
- **Target:** 90% des utilisateurs complètent leur premier match enregistré sans aide
- **Requirements:**
  - Interface intuitive
  - Flow minimal (2-3 clics max)
  - Feedback visuel clair
  - Messages d'erreur compréhensibles

**NFR1.2: Accessibilité**
- **Requirements:**
  - Contraste suffisant (WCAG AA minimum)
  - Tailles de police lisibles
  - Navigation au clavier
  - Support lecteurs d'écran (basique)

### NFR2: Reliability

**NFR2.1: Disponibilité**
- **Target:** 99%+ uptime
- **Requirements:**
  - Monitoring continu
  - Alerting automatique
  - Plan de récupération
  - Tests de charge

**NFR2.2: Robustesse**
- **Requirements:**
  - Gestion d'erreurs complète
  - Fallback mechanisms
  - Validation des données
  - Logging et debugging

### NFR3: Performance

**NFR3.1: Temps de Réponse**
- **Target:** < 2s chargement, < 500ms actions
- **Requirements:**
  - Optimisation des assets
  - Code splitting
  - Lazy loading
  - Caching stratégique

**NFR3.2: Scalabilité**
- **Target:** Support 10x croissance utilisateurs avec < 10% dégradation performance
- **Requirements:**
  - Architecture scalable (Supabase auto-scaling)
  - Optimisation base de données (indexes, query optimization)
  - CDN pour assets statiques (Vercel Edge Network)
  - Load balancing (futur, si nécessaire)
  - Caching stratégique (données fréquemment consultées)
  - Support pics de trafic (événements simultanés)

**NFR3.3: Temps Réel (Post-MVP)**
- **Target:** < 200ms latence pour mise à jour écran de projection, 99% fiabilité
- **Requirements:**
  - Supabase Realtime pour synchronisation temps réel
  - Optimisation des mises à jour (batch si nécessaire)
  - Gestion des reconnexions automatiques
  - Fallback si temps réel indisponible

### NFR4: Security

**NFR4.1: Authentification et Autorisation**
- **Requirements:**
  - Authentification sécurisée
  - Row Level Security (RLS)
  - Protection CSRF
  - Validation des permissions

**NFR4.2: Protection des Données**
- **Requirements:**
  - Chiffrement des données sensibles (at rest et in transit)
  - Conformité GDPR (Europe)
  - Gestion des consentements utilisateurs
  - Audit trail pour actions importantes
  - Suppression des données utilisateur sur demande
  - Protection des données de paiement (PCI-DSS compliance pour in-app purchases)

**NFR4.3: Sécurité Paiements (Post-MVP)**
- **Requirements:**
  - Validation serveur des transactions (receipt validation)
  - Chiffrement des données de paiement
  - Conformité App Store et Play Store pour in-app purchases
  - Protection contre la fraude
  - Gestion sécurisée des remboursements

### NFR5: Maintainability

**NFR5.1: Code Quality**
- **Requirements:**
  - TypeScript strict mode
  - ESLint configuration
  - Code reviews
  - Documentation technique

**NFR5.2: Tests**
- **Requirements:**
  - Tests unitaires (futur)
  - Tests d'intégration (futur)
  - Tests E2E (futur)
  - Coverage minimum (futur)

### NFR6: Integration

**NFR6.1: Synchronisation Multi-Platform**
- **Target:** 100% de synchronisation réussie entre web et mobile
- **Requirements:**
  - Source de vérité unique (Supabase)
  - Synchronisation automatique en temps réel
  - Gestion des conflits de données
  - Pas de perte de données lors de la synchronisation
  - Support offline web avec sync automatique

**NFR6.2: Intégrations Externes (Post-MVP)**
- **Requirements:**
  - Intégration systèmes de paiement (Stripe, Apple IAP, Google Play Billing)
  - Intégration réseaux sociaux pour partage (Instagram, Facebook, Twitter)
  - Intégration POS systems (futur, V3+)
  - API publique (futur, V3+)
  - Fiabilité des intégrations (retry logic, error handling)

### NFR7: Mobile-Specific Requirements (Post-MVP)

**NFR7.1: Performance Mobile**
- **Target:** < 2s lancement app, < 500ms actions
- **Requirements:**
  - Bundle size optimization
  - Image optimization et caching
  - Lazy loading des écrans
  - Native performance (React Native optimizations)
  - Battery efficiency

**NFR7.2: Store Compliance**
- **Requirements:**
  - Conformité App Store Guidelines (Apple)
  - Conformité Google Play Policies (Android)
  - Privacy policies et data handling disclosure
  - Content ratings appropriés (12+ pour alcool-related content)
  - In-App Purchase compliance (Apple IAP, Google Play Billing)
  - Review process preparation

**NFR7.3: Device Features**
- **Requirements:**
  - Gestion des permissions (caméra, géolocalisation, notifications)
  - Support des différentes tailles d'écran
  - Support des orientations (portrait/landscape)
  - Vibration feedback (optionnel)
  - Géolocalisation précise (futur, V2+)

### NFR8: SEO and Web Vitrine (Web App)

**NFR8.1: SEO Performance**
- **Target:** Pages publiques indexables et optimisées pour recherche
- **Requirements:**
  - Server-Side Rendering (SSR) pour pages publiques
  - Métadonnées optimisées (title, description, Open Graph)
  - Structured Data (Schema.org)
  - Core Web Vitals optimisés (LCP, FID, CLS)
  - Sitemap XML
  - Robots.txt approprié

**NFR8.2: Partage Social**
- **Requirements:**
  - Open Graph tags pour partage Facebook/LinkedIn
  - Twitter Cards pour partage Twitter
  - Images optimisées pour partage social
  - URLs propres et partageables

---

## Implementation Notes

### Current State

**Existing Functionality:**
- React + TypeScript web app
- League/tournament management
- ELO ranking system
- Authentication (email + OTP)
- Anonymous users support
- Display view for live projection
- Supabase backend integration
- Offline-first with localStorage fallback
- Deployed on Vercel

**Technical Stack:**
- Frontend: React 18, TypeScript 5, Vite 5, Tailwind CSS
- Backend: Supabase (Auth, Postgres, Realtime)
- State: React Context (Auth, Identity, League)
- Routing: React Router 6
- Hosting: Vercel

### Migration Path

**From Current to MVP:**
1. Simplify UI - "alcoolisé-friendly" design
2. Championnats only - Remove leagues complexity
3. Remove payment - Free for all initially
4. Remove display view - Post-MVP priority
5. Optimize performance - < 2s load, < 500ms actions
6. Improve offline - 100% offline functionality

**From MVP to V1.5:**
1. Add mobile apps - Native iOS + Android
2. Add display view - Real-time projection screen
3. Add monetization - One-time 10€ payment
4. Add push notifications - Engagement and retention

**From V1.5 to V2:**
1. Add leagues - After championnats validation
2. Add gamification - Badges, achievements, animations
3. Add social sharing - Instagram, Facebook integration

---

## Innovation & Novel Patterns

### Detected Innovation Areas

Beer Pong League introduit deux innovations principales qui remettent en question les conventions du marché :

#### Innovation 1: ELO Professionnalisé pour Événements Amateurs

**Ce qui est nouveau :**
- Application d'un système ELO professionnel (utilisé dans les esports et sports compétitifs) à des événements très amateurs et casual (beer pong entre amis)
- Simplicité d'utilisation malgré la complexité algorithmique sous-jacente
- Continuité et progression visible entre événements isolés

**Hypothèse remise en question :**
- **Convention du marché :** Les systèmes ELO sont réservés aux compétitions sérieuses et professionnelles
- **Hypothèse challengée :** Les événements amateurs n'ont pas besoin de classement sophistiqué
- **Notre approche :** Démocratiser le système ELO pour rendre les événements casual plus engageants et créer de la continuité entre événements

**Différenciation concurrentielle :**
- Les solutions existantes (Scoreholio/Pongstars) peuvent avoir des systèmes de classement, mais pas avec cette simplicité d'usage et cette gamification pour des événements aussi casual
- Les solutions enterprise (SportsEngine, TeamSnap) ont des systèmes sophistiqués mais sont trop complexes et coûteuses pour des événements amateurs
- **Notre avantage :** Combinaison unique de sophistication algorithmique (ELO) + simplicité d'usage + gamification pour événements casual

**Valeur créée :**
- Progression visible et continue entre événements (contrairement aux tournois isolés)
- Motivation accrue grâce au classement professionnel dans un contexte fun
- Partage social des classements ELO sur réseaux sociaux (nouveauté pour événements amateurs)
- Création d'engagement long terme au-delà d'un événement unique

#### Innovation 2: Écran de Projection Central à l'Expérience

**Ce qui est nouveau :**
- Écran de projection temps réel comme élément central de l'expérience (pas juste un affichage passif)
- Création d'engagement collectif et de "moments wow" via animations et mises à jour en temps réel
- Accessibilité de cette fonctionnalité pour des organisateurs amateurs (traditionnellement réservée aux événements professionnels)

**Hypothèse remise en question :**
- **Convention du marché :** L'écran de projection est juste un affichage informatif passif
- **Hypothèse challengée :** L'engagement se fait uniquement sur mobile, pas sur écran collectif
- **Notre approche :** L'écran de projection devient le "cœur battant" qui crée l'expérience collective et les moments mémorables

**Différenciation concurrentielle :**
- Les solutions professionnelles ont des écrans de projection, mais sont réservées aux événements professionnels avec budgets importants
- Les solutions casual n'ont généralement pas d'écran de projection ou l'ont comme fonctionnalité secondaire
- **Notre avantage :** Écran de projection accessible aux amateurs avec animations et engagement collectif au centre de l'expérience

**Valeur créée :**
- Expérience collective mémorable (toute la foule voit les classements et animations)
- Création de "moments wow" quand le classement s'anime après un match
- Engagement collectif au-delà de l'expérience individuelle mobile
- Différenciation claire pour les bars et organisateurs d'événements

### Market Context & Competitive Landscape

**Contexte marché :**
- Le marché des applications de gestion de ligues sportives est dominé par des solutions enterprise (SportsEngine, TeamSnap) ou des solutions casual sans sophistication
- Le segment bar entertainment (beer pong, cornhole) est relativement sous-servi
- Les solutions existantes (Scoreholio/Pongstars) se concentrent sur l'automatisation mais manquent de gamification et d'engagement social

**Positionnement innovant :**
- **Premier à combiner :** ELO professionnel + Simplicité casual + Gamification + Écran de projection accessible
- **Premier à cibler :** Événements amateurs avec outils professionnels mais interface simple
- **Premier à créer :** Expérience collective via écran de projection pour événements casual

**Risque concurrentiel :**
- Les solutions enterprise pourraient simplifier leur interface pour cibler le marché casual
- Les solutions casual pourraient ajouter des systèmes ELO plus sophistiqués
- **Mitigation :** Avance technologique, focus sur l'expérience utilisateur, et spécialisation bar entertainment

### Validation Approach

#### Validation Innovation 1: ELO Professionnalisé

**Métriques de validation :**
- **Adoption :** 50% des utilisateurs créent un championnat dans les 7 jours (indicateur que la simplicité fonctionne)
- **Engagement :** 2 matchs par mois minimum par utilisateur actif (indicateur que l'ELO crée de la motivation)
- **Rétention :** 10% des utilisateurs reviennent dans les 30 jours (indicateur de valeur à long terme)
- **Conversion :** 20% des joueurs invités créent un compte (indicateur que la progression ELO est engageante)
- **Partage social :** 15% des utilisateurs partagent leur classement (indicateur que l'ELO est partageable)

**Tests utilisateurs :**
- Compréhension du système ELO : Les utilisateurs comprennent-ils que "gagner = monter, perdre = descendre" sans connaître les détails techniques ?
- Motivation : Les utilisateurs sont-ils plus motivés à jouer avec un système ELO vs sans classement ?
- Continuité : Les utilisateurs créent-ils de nouveaux championnats pour suivre leur progression ELO ?

**Critères de succès :**
- Si 70%+ des utilisateurs comprennent intuitivement le système ELO (sans explication technique)
- Si l'engagement est supérieur de 30%+ vs solutions sans ELO
- Si le partage social des classements ELO génère de la croissance organique

#### Validation Innovation 2: Écran de Projection

**Métriques de validation :**
- **Adoption :** 60% des événements utilisent l'écran de projection (V2, après MVP)
- **Satisfaction organisateur :** 80%+ des organisateurs utilisant l'écran de projection sont satisfaits
- **Engagement collectif :** 70%+ des participants regardent l'écran de projection pendant l'événement
- **Moment "wow" :** 80% des utilisateurs consultent le classement après avoir enregistré un match (indicateur d'engagement avec l'écran)

**Tests utilisateurs :**
- Impact sur l'expérience : L'écran de projection améliore-t-il l'expérience globale de l'événement ?
- Engagement collectif : Les participants interagissent-ils plus entre eux grâce à l'écran ?
- Différenciation : Les organisateurs perçoivent-ils l'écran comme un avantage compétitif ?

**Critères de succès :**
- Si 60%+ des événements utilisent l'écran de projection (adoption)
- Si la satisfaction organisateur est supérieure de 40%+ avec écran vs sans écran
- Si les événements avec écran ont 30%+ plus d'engagement (matchs joués, participants actifs)

### Risk Mitigation

#### Risques Innovation 1: ELO Professionnalisé

**Risque 1: Complexité perçue**
- **Risque :** Les utilisateurs trouvent le système ELO trop complexe pour des événements casual
- **Mitigation :** Interface simple avec explications intuitives ("gagner = monter"), pas de détails techniques visibles
- **Fallback :** Mode "simple ranking" sans ELO si adoption faible

**Risque 2: Manque d'adoption**
- **Risque :** Les utilisateurs ne voient pas la valeur du système ELO pour événements amateurs
- **Mitigation :** Focus sur la progression visible et le partage social, pas sur la complexité algorithmique
- **Fallback :** Système de classement simple (points) si ELO ne fonctionne pas

**Risque 3: Concurrence**
- **Risque :** Les solutions existantes ajoutent des systèmes ELO similaires
- **Mitigation :** Avance technologique, focus sur l'expérience utilisateur, spécialisation bar entertainment
- **Fallback :** Innovation continue, gamification avancée, features sociales uniques

#### Risques Innovation 2: Écran de Projection

**Risque 1: Adoption faible**
- **Risque :** Les organisateurs n'utilisent pas l'écran de projection (complexité technique, coût)
- **Mitigation :** Simplicité d'utilisation, pas de matériel supplémentaire requis (juste un écran/TV), setup en 2 clics
- **Fallback :** L'application fonctionne parfaitement sans écran de projection (MVP sans écran)

**Risque 2: Valeur perçue faible**
- **Risque :** Les organisateurs ne voient pas la valeur ajoutée de l'écran de projection
- **Mitigation :** Démonstrations, témoignages, métriques d'engagement (participation, satisfaction)
- **Fallback :** Focus sur fonctionnalités core (gestion tournois) si écran n'est pas adopté

**Risque 3: Problèmes techniques**
- **Risque :** Latence, bugs, problèmes de synchronisation temps réel
- **Mitigation :** Tests approfondis, architecture robuste (Supabase Realtime), fallback offline
- **Fallback :** Mode "refresh manuel" si temps réel ne fonctionne pas

**Risque 4: Concurrence**
- **Risque :** Les solutions existantes ajoutent des écrans de projection similaires
- **Mitigation :** Innovation continue (animations, gamification sur écran), spécialisation bar entertainment
- **Fallback :** Focus sur autres différentiateurs (ELO, simplicité, social)

#### Stratégie Globale de Mitigation

**Approche progressive :**
- MVP sans écran de projection pour valider le core (gestion tournois, ELO)
- V1.5 avec écran de projection pour valider l'innovation
- Itération basée sur feedback utilisateurs

**Validation continue :**
- Métriques d'adoption et d'engagement pour chaque innovation
- Tests utilisateurs réguliers
- A/B testing si nécessaire

**Flexibilité :**
- Architecture modulaire permettant d'ajuster ou retirer des features
- Fallbacks pour chaque innovation
- Focus sur valeur utilisateur plutôt que sur technologie pour elle-même

---

## Multi-Platform (Web App + Mobile App) Specific Requirements

### Project-Type Overview

Beer Pong League est une application multi-plateforme combinant une application web responsive (MVP) et une application mobile native (post-MVP). Cette approche permet de toucher à la fois les utilisateurs web (accès universel, pas d'installation) et mobile (expérience native optimisée, notifications push, fonctionnalités device).

**Architecture Multi-Platform:**
- **Web App (MVP):** React SPA avec SSR pour pages publiques (SEO)
- **Mobile App (V1.5+):** React Native cross-platform (iOS + Android)
- **Backend Unifié:** Supabase comme source de vérité unique pour web et mobile
- **Code Partagé:** Monorepo avec packages partagés pour logique métier, types, et utils

### Technical Architecture Considerations

#### Web Application Architecture

**SPA avec SSR pour SEO:**
- **Approche:** Single Page Application (SPA) pour l'application interactive + Server-Side Rendering (SSR) pour les pages publiques (landing, à propos, etc.)
- **Raison:** 
  - SEO nécessaire pour la partie "web vitrine" (découverte organique, partage social)
  - Performance et expérience utilisateur fluide pour l'application interactive
  - Meilleur des deux mondes : SEO pour pages publiques, SPA pour app
- **Solution Technique:** 
  - Option 1: Next.js (SSR natif + SPA)
  - Option 2: Vite + SSR plugin (garder stack actuelle)
  - **Recommandation:** Évaluer migration vers Next.js pour SSR natif, ou ajouter SSR à Vite si on garde la stack actuelle

**Support Navigateurs:**
- **Cible:** Navigateurs modernes uniquement (dernières versions)
- **Navigateurs Supportés:**
  - Chrome/Edge (dernières 2 versions)
  - Firefox (dernières 2 versions)
  - Safari (dernières 2 versions)
  - Mobile browsers (iOS Safari, Chrome Mobile)
- **Non Supportés:** IE11, navigateurs très anciens
- **Polyfills:** Utiliser uniquement si nécessaire pour fonctionnalités critiques

**SEO Strategy:**
- **Pages Publiques avec SSR:**
  - Landing page (découverte organique)
  - Page "À propos"
  - Page "Comment ça marche"
  - Blog/articles (futur)
- **Métadonnées:** Open Graph, Twitter Cards pour partage social
- **Structured Data:** Schema.org pour événements, organisations
- **Performance SEO:** Core Web Vitals optimisés (LCP, FID, CLS)

**Temps Réel (Post-MVP):**
- **Approche:** Supabase Realtime (WebSockets natifs)
- **Raison:**
  - Déjà dans la stack (pas de nouvelle dépendance)
  - Simple à développer et maintenir
  - Fiable et scalable
  - Support natif pour écran de projection
- **Alternative:** WebSockets custom si besoin de plus de contrôle (non recommandé pour MVP)
- **Latence Cible:** < 200ms pour mise à jour écran de projection

**Accessibilité:**
- **MVP:** Pas d'accessibilité avancée (focus sur core features)
- **Post-MVP:** WCAG AA minimum pour accessibilité de base
- **Timeline:** V2+ (après validation MVP)

#### Mobile Application Architecture

**Cross-Platform Approach:**
- **Technologie:** React Native
- **Raison:**
  - Partage de code avec React web (même stack TypeScript)
  - Développement unique pour iOS + Android
  - Écosystème mature et communauté active
  - Performance native (vs solutions hybrides)
- **Alternative Considérée:** Flutter (rejeté - stack différente, moins de partage de code)

**Platform Requirements:**
- **iOS:** iOS 13+ (support des dernières versions)
- **Android:** Android 8.0+ (API level 26+)
- **Store Compliance:**
  - App Store Guidelines (Apple)
  - Google Play Policies (Android)
  - In-App Purchases compliance (Apple IAP, Google Play Billing)
  - Privacy policies et data handling
  - Content ratings (12+ pour alcool-related content)

**Offline Functionality:**
- **Approche:** Pas de fonctionnement offline pour l'app mobile (contrairement au web)
- **Raison:** 
  - Contexte d'utilisation principalement en bar avec connexion internet
  - Complexité réduite (pas de sync offline/online)
  - Focus sur expérience en ligne optimale
- **Exception:** Cache local pour données fréquemment consultées (classements, stats)

**Push Notifications:**
- **Besoin:** Oui, essentiel pour engagement et rétention
- **Use Cases:**
  - Nouveau match enregistré dans votre championnat
  - Votre classement a changé
  - Nouveau championnat créé par un ami
  - Rappels d'événements
- **Implementation:**
  - Firebase Cloud Messaging (FCM) pour Android
  - Apple Push Notification Service (APNs) pour iOS
  - Intégration avec Supabase pour déclenchement

**Device Features:**
- **Caméra (QR Code):**
  - **Priorité:** P0 (essentiel pour rejoindre championnats)
  - **Library:** react-native-camera ou expo-camera
  - **Permissions:** Camera permission (iOS + Android)
- **Vibrations:**
  - **Priorité:** P2 (nice-to-have, pas essentiel)
  - **Use Cases:** Feedback lors d'enregistrement de match, notifications
  - **Implementation:** react-native-haptic-feedback
- **Géolocalisation:**
  - **Priorité:** P1 (probablement nécessaire)
  - **Use Cases:** 
    - Découverte de bars/événements proches (futur)
    - Filtrage géographique
  - **Permissions:** Location permission (iOS + Android)
  - **Timeline:** V2+ (après MVP)

**In-App Purchases:**
- **Besoin:** Oui, pour monétisation (one-time 10€, packs supplémentaires)
- **Platforms:**
  - Apple In-App Purchase (IAP) pour iOS
  - Google Play Billing pour Android
- **Products:**
  - One-time payment: 10€ (ligue + 5 championnats)
  - Packs supplémentaires: événements additionnels
- **Compliance:**
  - Respect des guidelines App Store et Play Store
  - Gestion des remboursements
  - Receipt validation côté serveur

### Synchronisation Web ↔ Mobile

**Architecture de Synchronisation:**
- **Source de Vérité Unique:** Supabase (PostgreSQL + Realtime)
- **Approche:** Synchronisation automatique via Supabase
  - Web app et mobile app utilisent le même backend Supabase
  - Pas de logique de synchronisation custom nécessaire
  - Supabase gère automatiquement la synchronisation entre clients
- **Avantages:**
  - Simplicité (pas de sync logic custom)
  - Cohérence garantie (même source de vérité)
  - Temps réel natif (Supabase Realtime)
  - Offline support web (localStorage) + online sync automatique

**Stratégie de Partage de Code:**
- **Approche:** Monorepo avec packages partagés
- **Structure Recommandée:**
  ```
  beer-pong-league/
  ├── packages/
  │   ├── shared/          # Logique métier partagée
  │   │   ├── types/        # Types TypeScript
  │   │   ├── utils/       # Utilitaires (ELO, etc.)
  │   │   ├── services/    # Services métier
  │   │   └── constants/   # Constantes
  │   ├── web/             # Application web (React)
  │   └── mobile/          # Application mobile (React Native)
  └── supabase/            # Backend (migrations, etc.)
  ```
- **Code Partagé:**
  - Logique métier (calcul ELO, gestion tournois)
  - Types TypeScript (interfaces, types Supabase)
  - Utilitaires (formatters, validators)
  - Constants (config, messages)
- **Code Spécifique:**
  - UI components (web: React, mobile: React Native)
  - Navigation (web: React Router, mobile: React Navigation)
  - Device features (mobile uniquement: caméra, push, etc.)

**Outils Recommandés:**
- **Monorepo:** Turborepo ou Nx (gestion des packages, build, tests)
- **Package Manager:** npm workspaces ou pnpm workspaces
- **Type Sharing:** TypeScript project references

### Implementation Considerations

#### Web App Implementation

**Stack Technique Actuelle:**
- React 18 + TypeScript 5 + Vite 5
- Tailwind CSS
- Supabase (Auth, Postgres, Realtime)
- React Router 6

**Migration SSR (si nécessaire):**
- **Option 1:** Migrer vers Next.js (SSR natif, meilleur SEO)
  - Avantages: SSR natif, optimisations SEO, écosystème mature
  - Inconvénients: Migration nécessaire, courbe d'apprentissage
- **Option 2:** Ajouter SSR à Vite (garder stack actuelle)
  - Avantages: Pas de migration majeure, garder Vite
  - Inconvénients: Configuration SSR custom, moins d'optimisations SEO

**Recommandation:** Évaluer migration Next.js pour meilleur SEO, ou ajouter SSR à Vite si on garde la stack actuelle.

#### Mobile App Implementation

**Stack Technique:**
- React Native (cross-platform)
- TypeScript (même que web)
- Supabase JS client (même que web)
- React Navigation (navigation mobile)
- Expo (optionnel, pour développement rapide)

**Développement:**
- **Phase 1 (MVP):** Web app uniquement
- **Phase 2 (V1.5):** Ajouter React Native app
- **Stratégie:** Réutiliser maximum de code via packages partagés

**Store Deployment:**
- **App Store (iOS):**
  - Apple Developer Account ($99/an)
  - App Store Connect pour gestion
  - Review process (7-14 jours typiquement)
  - In-App Purchase setup
- **Google Play (Android):**
  - Google Play Developer Account ($25 one-time)
  - Google Play Console pour gestion
  - Review process (1-3 jours typiquement)
  - Google Play Billing setup

#### Performance Considerations

**Web App:**
- **Target:** < 2s chargement initial, < 500ms actions
- **Optimizations:**
  - Code splitting par route
  - Lazy loading des composants
  - Asset optimization (images, fonts)
  - CDN pour assets statiques

**Mobile App:**
- **Target:** < 2s lancement, < 500ms actions
- **Optimizations:**
  - Bundle size optimization
  - Image optimization et caching
  - Lazy loading des écrans
  - Native performance (React Native optimizations)

#### Security Considerations

**Multi-Platform Security:**
- **Authentication:** Supabase Auth (même système web + mobile)
- **API Security:** Row Level Security (RLS) sur Supabase
- **Data Encryption:** HTTPS/TLS pour toutes les communications
- **Store Compliance:** 
  - Privacy policies (GDPR, CCPA)
  - Data handling disclosure
  - User consent management

**In-App Purchase Security:**
- **Receipt Validation:** Server-side validation (Supabase Edge Functions)
- **Fraud Prevention:** Validation des transactions côté serveur
- **Compliance:** Respect des guidelines App Store et Play Store

---

## Appendices

### A. Glossary

- **Championnat:** Tournament/event (single occurrence)
- **Ligue:** League (recurring, multiple events)
- **ELO:** Rating system for competitive ranking
- **Mode Invité:** Guest mode (play without account)
- **Écran de Projection:** Display view for live projection in bars
- **Alcoolisé-Friendly:** Design optimized for use in social/bar settings (large buttons, minimal flow)

### B. References

**Product Brief:**
- `_bmad-output/planning-artifacts/product-brief-beer-pong-league-2026-01-23.md`

**Market Research:**
- `_bmad-output/planning-artifacts/research/market-applications-gestion-ligues-sportives-bars-2026-01-23.md`

**Brainstorming:**
- `_bmad-output/analysis/brainstorming-session-2026-01-23.md`

**Technical Documentation:**
- `docs/architecture.md`
- `docs/data-models.md`
- `docs/api-contracts.md`
- `docs/component-inventory.md`

### C. Change Log

**Version 1.0 (2026-01-23):**
- Initial comprehensive PRD integrating Product Brief, Market Research, and Brainstorming
- Complete user personas and journeys
- Detailed success criteria and metrics
- MVP scope definition
- Functional and technical requirements
- Roadmap and future vision

---

**Document Status:** Complete and ready for implementation planning
