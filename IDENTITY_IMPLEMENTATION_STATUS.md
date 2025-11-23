# Statut d'implémentation - Gestion de l'identité

## ✅ Phase 1 : Foundation & Setup Supabase - TERMINÉE

- [x] Setup Supabase project
- [x] Migrations SQL appliquées (9 tables)
- [x] RLS policies configurées
- [x] Types TypeScript générés
- [x] Client Supabase configuré (`src/lib/supabase.ts`)

## ✅ Phase 2 : Identité locale - EN COURS

### Services créés

- [x] **LocalUserService** (`src/services/LocalUserService.ts`)
  - Gestion identité locale dans localStorage
  - Création, mise à jour, suppression
  - UUID v4 pour anonymousUserId

- [x] **AnonymousUserService** (`src/services/AnonymousUserService.ts`)
  - Sync avec Supabase
  - Création anonymous_user en DB
  - Recherche par device fingerprint
  - Gestion offline (non-blocking)

- [x] **Device Fingerprint** (`src/utils/deviceFingerprint.ts`)
  - Génération fingerprint simple
  - Stockage dans localStorage
  - Détection device multi-session

### Composants UI créés

- [x] **IdentityModal** (`src/components/IdentityModal.tsx`)
  - Modal "Reprendre mon profil"
  - Affiche pseudo existant
  - Options : Reprendre / Nouveau profil

- [x] **CreateIdentityModal** (`src/components/CreateIdentityModal.tsx`)
  - Modal création identité
  - Input pseudo
  - Création locale + sync Supabase

- [x] **IdentityInitializer** (`src/components/IdentityInitializer.tsx`)
  - Composant wrapper
  - Vérifie identité au chargement
  - Affiche modals si nécessaire

### Hooks & Context

- [x] **useIdentity** (`src/hooks/useIdentity.ts`)
  - Hook pour gérer identité
  - État : localUser, isLoading, isAnonymous
  - Actions : createIdentity, updateIdentity, clearIdentity

- [x] **IdentityContext** (`src/context/IdentityContext.tsx`)
  - Context React pour identité
  - Provider intégré dans App

### Intégration

- [x] IdentityProvider ajouté dans App.tsx
- [x] IdentityInitializer intégré dans le routing
- [x] Flow complet : vérification → modal → création

## 🔄 À faire (Phase 2 - suite)

- [ ] Intégrer identité dans LeagueContext
  - Associer creator_anonymous_user_id lors création League/Tournament
  - Utiliser anonymousUserId pour les joueurs créés

- [ ] Sync bidirectionnelle localStorage ↔ Supabase
  - Service SyncService
  - Queue offline
  - Résolution conflits

- [ ] Tests
  - Test création identité
  - Test reprise identité
  - Test sync Supabase

## 📝 Notes

### Architecture actuelle

```
App
├── IdentityProvider (Context)
│   └── useIdentity (Hook)
│       ├── LocalUserService (localStorage)
│       └── AnonymousUserService (Supabase)
└── IdentityInitializer
    ├── IdentityModal (Reprendre)
    └── CreateIdentityModal (Créer)
```

### Flow utilisateur

1. **Premier accès** :
   - IdentityInitializer détecte absence identité
   - Affiche IdentityModal (vide) ou CreateIdentityModal
   - Utilisateur crée pseudo
   - Identité sauvegardée localement + sync Supabase (non-blocking)

2. **Retour utilisateur** :
   - IdentityInitializer détecte identité existante
   - Affiche IdentityModal avec pseudo
   - Utilisateur peut reprendre ou créer nouveau

3. **Sync Supabase** :
   - Tentative automatique au chargement
   - Non-blocking (app fonctionne même si échec)
   - Retry silencieux en arrière-plan

### Prochaines étapes

1. **Intégrer dans LeagueContext** :
   - Modifier `createLeague` pour utiliser `anonymousUserId`
   - Modifier `createTournament` pour utiliser `anonymousUserId`
   - Modifier `addPlayer` pour utiliser `anonymousUserId`

2. **Créer SyncService** :
   - Sync localStorage → Supabase
   - Gestion queue offline
   - Résolution conflits

3. **Tester flow complet** :
   - Créer identité
   - Créer League avec identité
   - Vérifier sync Supabase

## 🎯 Objectif atteint

L'infrastructure de base pour l'identité locale est en place. Les utilisateurs peuvent :
- Créer une identité locale (zero-friction)
- Reprendre leur identité existante
- Avoir leur identité syncée avec Supabase (non-blocking)

La prochaine étape est d'intégrer cette identité dans les créations de League/Tournament pour associer les données à l'utilisateur.



