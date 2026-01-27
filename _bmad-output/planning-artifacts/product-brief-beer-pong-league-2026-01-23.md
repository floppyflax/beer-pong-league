---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: 
  - _bmad-output/analysis/brainstorming-session-2026-01-23.md
  - _bmad-output/planning-artifacts/research/market-applications-gestion-ligues-sportives-bars-2026-01-23.md
date: 2026-01-23
author: floppyflax
---

# Product Brief: beer-pong-league

## Executive Summary

Beer Pong League is a social-first, mobile-native platform for managing beer pong tournaments and leagues in bars and entertainment venues. Unlike traditional sports management software focused on enterprise needs, Beer Pong League creates excitement, fun, and memorable moments through gamified rankings, real-time projections, and community engagement.

The platform addresses a critical gap in the bar entertainment market: while the global sports league management software market is valued at $1.23-1.25 billion (growing to $2.36-2.65 billion by 2032), the bar entertainment segment remains underserved. Current solutions are either too enterprise-focused (expensive, complex) or too generic (lacking bar-specific features).

**Current State**: The application exists as a React + TypeScript web app with core functionality: league/tournament management, ELO ranking system, authentication (email + OTP), anonymous users, and display view for live projection. It uses Supabase for backend services and supports offline-first operation with localStorage fallback.

**Vision**: Transform from a functional tournament management tool into the most engaging social platform for bar entertainment competitions, where players compete for fun, bars create memorable experiences, and communities form around shared passion for beer pong.

**Market Opportunity**: The bar entertainment and social friend group competition segments represent relatively untapped markets with strong growth potential, especially in Europe (9% CAGR) where France, Germany, UK, and Spain offer key expansion opportunities.

---

## Core Vision

### Problem Statement

**The Core Problem is Emotional, Not Technical**

Organizers of beer pong tournaments in bars face a fundamental challenge: creating excitement and engagement, not just managing logistics. Current solutions focus on technical problems (registration, scheduling, scoring) but miss the emotional core—the need to create memorable moments, build community, and generate excitement that keeps players coming back.

**Specific Pain Points:**

1. **Fragmented Rankings**: Players can't see their progression across events. Each tournament feels isolated, with no continuity or sense of achievement over time.

2. **Lack of Engagement**: Tournament management is purely functional—no gamification, no social features, no "wow moments" that create excitement and shareability.

3. **Invisible Competition**: Players don't see the stakes before matches, can't track rivalries, and miss the competitive tension that makes tournaments exciting.

4. **Disconnected Experience**: The experience is fragmented between the physical event (bar) and digital tracking. There's no bridge that connects the live excitement with digital engagement.

5. **Bar Operator Challenges**: Bars struggle to create consistent, engaging tournament experiences that drive repeat visits and customer loyalty.

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

**Market Impact:**
The bar entertainment segment is underserved compared to traditional sports management. While enterprise solutions exist for professional leagues, there's a gap for casual, social, fun-focused tournament management that creates excitement rather than just managing logistics.

### Why Existing Solutions Fall Short

**Enterprise Sports Management Platforms (SportsEngine, TeamSnap, Stack Sports):**
- **Too expensive** for casual bar tournaments and friend groups
- **Too complex** with features irrelevant to beer pong (compliance, volunteer management, background checks)
- **Desktop-first** design doesn't match mobile usage patterns (73% of users prefer mobile apps)
- **Enterprise-focused** positioning misses the social, fun, engagement aspect
- **Lack bar-specific features** like venue integration, POS systems, or bar entertainment culture

**Generic Tournament Software:**
- **No ELO system** or progression tracking—missing the competitive element
- **No social features**—leaderboards, friend connections, achievements
- **No display view** for live projection in bars
- **No gamification**—missing the "wow moments" that create excitement
- **Not mobile-optimized** for the bar environment

**Manual Solutions (Spreadsheets, Paper):**
- **Time-consuming** and error-prone
- **No real-time updates** or live tracking
- **No engagement features**—purely functional
- **No continuity** between events
- **No data insights** or analytics

**Specialized Bar Entertainment (Scoreholio/Pongstars):**
- **Limited to specific sports** (cornhole, darts) with less focus on beer pong
- **Less social features** compared to what's possible
- **North America-centric** with less European market focus
- **Less mobile-first** experience

### Proposed Solution

**Beer Pong League: The Social-First Platform for Bar Entertainment Competitions**

Beer Pong League transforms tournament management from a functional tool into an engaging social experience. The platform combines intelligent tournament management with gamification, real-time engagement, and community building to create memorable moments that keep players and bars coming back.

**Core Solution Elements:**

1. **ELO-Based Progression System**: Players see their ranking evolve across events, creating continuity and motivation. The system is simple to understand in practice (you win, you go up; you lose, you go down) without requiring technical knowledge of ELO calculations.

2. **Gamified Engagement**: Badges, achievements, streaks, and visual celebrations (confetti, animations) create "wow moments" when players progress. The leaderboard becomes a source of excitement, not just information.

3. **Real-Time Display View**: Central to the bar experience—a live projection screen showing rankings, match progress, and celebrations. This creates the collective excitement that makes tournaments memorable.

4. **Social Features**: Friend connections, rivalries, challenges, and social sharing turn individual competition into community engagement. Players can compare with friends, track rivalries, and share achievements.

5. **Mobile-First Design**: Built for mobile usage in bar environments—quick check-ins, easy score entry, instant notifications. The experience works seamlessly on phones while supporting display view for projection.

6. **Bar Venue Integration**: Features designed for bars—white-label branding, venue-specific leaderboards, multi-venue support for chains, and future POS integration.

7. **Offline-First Architecture**: Works even when internet is spotty in bars, with localStorage fallback and automatic sync when connection returns.

**The "Wow Moment":**
When a player adds a match result and sees their ranking update with animations, confetti, and their position change on the live display screen—that's the moment that transforms functional tracking into exciting engagement.

### Key Differentiators

**1. Social-First Design**
Unlike enterprise platforms focused on compliance and management, Beer Pong League prioritizes engagement, fun, and community. Every feature is designed to create excitement and connection, not just manage logistics.

**2. Bar Entertainment Specialization**
Deep understanding of bar culture and tournament dynamics. Features like display view, venue branding, and bar-specific workflows are built-in, not afterthoughts.

**3. Emotional Engagement Over Functional Management**
The platform solves the emotional problem (creating excitement) rather than just the technical problem (managing tournaments). Gamification, animations, and social features are core, not optional.

**4. Mobile-Native Experience**
Built mobile-first for the bar environment where players use phones. The experience is optimized for quick interactions, notifications, and seamless mobile usage.

**5. European Market Focus**
Localized for European markets (starting with France) with understanding of European bar culture, payment systems, and user expectations. Less competition than North America-focused solutions.

**6. Offline-First Architecture**
Works reliably in bar environments where internet can be spotty. localStorage fallback ensures the experience never breaks, with automatic sync when connection returns.

**7. Progressive Enhancement Model**
Starts simple (web app) with clear path to native apps, advanced features, and enterprise capabilities. Grows with user needs rather than overwhelming from day one.

**8. Dual Identity System**
Supports both authenticated users and anonymous players, with seamless merge. This removes friction for casual participants while enabling progression for engaged players.

**Why Now:**
- Mobile-first engagement is now standard (73% of sports fans use mobile apps)
- Bar entertainment market is growing with increasing focus on experiences
- Social features and gamification are expected, not novel
- European market offers growth opportunity with less saturation
- Technology stack (React, Supabase) enables rapid iteration and scaling

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

**Valeur Obtenue:**
- Gain de temps (plus besoin de gérer les scores manuellement)
- Création d'engouement (animations, écran de projection)
- Expérience fluide pour tous
- Possibilité de réutiliser pour d'autres événements

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

**Valeur Obtenue:**
- Progression visible et continue (ELO, classements)
- Reconnaissance sociale (partage, achievements)
- Conversion d'un casual player en organisateur passionné
- Engagement long terme (création de championnats mensuels, suivi de progression ELO)

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

**Valeur Obtenue:**
- Expérience unique différenciante
- Augmentation de la fréquentation
- Fidélité client accrue
- Outils d'organisation et d'analyse
- Branding personnalisé pour son établissement

### Secondary Users

#### 4. Spectateurs/Amis

**Profil:**
- Personnes présentes aux événements qui suivent les classements
- Amis qui suivent les performances sur les réseaux sociaux
- Communauté autour des tournois

**Valeur Obtenue:**
- Suivre les classements en temps réel
- Engagement social autour des événements
- Partage et discussion sur les performances

#### 5. Staff de Bar

**Profil:**
- Employés de bar qui aident à organiser les tournois
- Responsables d'événements dans les bars

**Valeur Obtenue:**
- Outils simplifiés pour gérer les tournois
- Moins de friction dans l'organisation
- Meilleure expérience pour les clients

### User Journey

#### Journey 1: Thomas, l'Organisateur Passionné

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

#### Journey 2: Lucas, le Casual Player qui Devient Accro

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

#### Journey 3: Sophie, la Propriétaire de Bar

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

## Success Metrics

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

### Key Performance Indicators (KPIs)

#### KPIs Utilisateurs

1. **Taux de Création de Championnat (7 jours):** 50%
2. **Taux de Rejoindre Championnat (après QR scan):** 70%
3. **Fréquence de Matchs (par utilisateur actif/mois):** 2 matchs
4. **Fréquence de Création d'Événements (par organisateur/mois):** 1 championnat
5. **Rétention à 30 jours:** 10%
6. **Rétention à 90 jours:** 5%
7. **Taux de Conversion Invité → Compte:** 20%
8. **Taux de Partage Social:** 15%

#### KPIs Business

1. **Utilisateurs Payants (3 mois):** 50 utilisateurs
2. **Utilisateurs Payants (12 mois):** 1 000 utilisateurs
3. **Bars Abonnés (Année 1):** 3-4 bars
4. **Revenus Mensuels (6-12 mois):** 500-1 000€
5. **Revenus Mensuels (Année 2):** 2 000-3 000€
6. **Taux de Conversion Utilisateurs Actifs → Payants:** 10%
7. **Taux de Conversion Bars Contactés → Abonnés:** 20-25%
8. **Rétention Bars (Annuelle):** 80%
9. **Growth Organique:** 70% de croissance via partage social + partenariats

#### KPIs Techniques

1. **Temps de Chargement Initial:** < 2 secondes
2. **Réactivité Actions Utilisateur:** < 500ms
3. **Uptime:** 99%+
4. **Synchronisation Offline/Online:** 100% de réussite
5. **Temps Réel Écran Projection (Post-MVP):** < 200ms latence, 99% fiabilité

### Measurable Outcomes

**Indicateurs Clés de Performance (KPI) - Résumé:**

**Adoption:**
- Taux de création de championnat: 50% dans les 7 jours
- Taux de rejoindre championnat: 70% après QR scan

**Engagement:**
- Fréquence de matchs: 2 matchs/mois/utilisateur actif
- Fréquence de création: 1 nouveau championnat/mois pour organisateurs actifs
- Temps d'engagement: 5-10 minutes par session

**Rétention:**
- Rétention à 30 jours: 10%
- Rétention à 90 jours: 5%
- Conversion invité → compte: 20%

**Business:**
- Utilisateurs payants: 50 en 3 mois, 1 000 en 12 mois
- Bars abonnés: 3-4 la première année, 10-15 en année 2
- Revenus mensuels: 500-1 000€ (6-12 mois), 2 000-3 000€ (année 2)
- Taux de conversion: 10% utilisateurs actifs → payants, 20-25% bars contactés → abonnés

**Growth:**
- Growth organique: 70% via partage social + partenariats
- Partenariats bars: 20 bars dans les 12 premiers mois
- Taux de partage social: 15% des utilisateurs actifs

**Technique:**
- Performance: < 2s chargement, < 500ms actions
- Disponibilité: 99%+ uptime
- Fiabilité: 100% synchronisation, 99% temps réel (post-MVP)

## MVP Scope

### Core Features

#### 1. Gestion de Championnats

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

#### 2. Système de Matchs et Scoring

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

#### 3. Classements et Statistiques

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

#### 4. Authentification et Identité

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

#### 5. Interface Utilisateur

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

#### 6. Partage et Découverte

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

### Future Vision

#### Roadmap Post-MVP

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

#### Vision Long Terme (2-3 Ans)

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

<!-- Content will be appended sequentially through collaborative workflow steps -->
