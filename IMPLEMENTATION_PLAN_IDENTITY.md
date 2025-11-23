# Plan d'implémentation — Gestion de l'identité & comptes joueurs

**Basé sur :** `PRD_IDENTITY_MANAGEMENT.md`  
**Durée estimée :** 6 semaines  
**Priorité :** Haute

---

## Vue d'ensemble

Cette feature transforme l'application d'un système 100% localStorage vers un système hybride localStorage + Supabase, permettant :
- Identité locale (zero-friction)
- Revendication de compte (optionnel)
- Sync multi-device

---

## Phase 1 : Foundation & Setup Supabase (Semaine 1-2)

### 1.1. Setup Supabase Project
- [ ] Créer projet Supabase
- [ ] Configurer les variables d'environnement
- [ ] Installer `@supabase/supabase-js`
- [ ] Créer service `SupabaseClient`

**Fichiers à créer :**
- `src/lib/supabase.ts`
- `.env.local` (variables Supabase)

**Code :**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

### 1.2. Migrations SQL
- [ ] Créer toutes les tables (voir PRD section 4)
- [ ] Configurer RLS (Row Level Security)
- [ ] Créer les index nécessaires
- [ ] Créer les fonctions PostgreSQL (si besoin)

**Fichiers à créer :**
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_rls_policies.sql`

**Tables à créer :**
1. `users`
2. `anonymous_users`
3. `leagues`
4. `league_players`
5. `tournaments`
6. `tournament_players`
7. `matches`
8. `elo_history`
9. `user_identity_merges` (optionnel)

---

### 1.3. Types TypeScript depuis Supabase
- [ ] Générer les types depuis Supabase
- [ ] Créer les interfaces TypeScript
- [ ] Adapter les types existants

**Commandes :**
```bash
npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
```

**Fichiers à modifier :**
- `src/types.ts` (adapter pour inclure user_id/anonymous_user_id)

---

### 1.4. Configurer Supabase Auth
- [ ] Activer Email OTP
- [ ] Configurer les redirect URLs
- [ ] Tester le flow OTP

**Configuration :**
- Auth → Providers → Email → Enable
- Auth → URL Configuration → Site URL
- Auth → URL Configuration → Redirect URLs

---

## Phase 2 : Identité locale (Semaine 2-3)

### 2.1. Service LocalUserService
- [ ] Créer service de gestion identité locale
- [ ] Génération UUID v4
- [ ] Stockage dans localStorage
- [ ] Récupération identité existante

**Fichiers à créer :**
- `src/services/LocalUserService.ts`

**Code structure :**
```typescript
class LocalUserService {
  getLocalUser(): LocalUser | null
  createLocalUser(pseudo: string): LocalUser
  updateLocalUser(user: Partial<LocalUser>): void
  clearLocalUser(): void
}
```

---

### 2.2. Device Fingerprint
- [ ] Implémenter génération fingerprint
- [ ] Stocker dans localStorage
- [ ] Utiliser pour détection device

**Option 1 : Simple (canvas + navigator)**
**Option 2 : Lib `@fingerprintjs/fingerprintjs`**

**Fichiers à créer :**
- `src/utils/deviceFingerprint.ts`

---

### 2.3. Création anonymous_user en DB
- [ ] Service pour créer anonymous_user en Supabase
- [ ] Gestion erreurs (offline, etc.)
- [ ] Retry logic

**Fichiers à créer :**
- `src/services/AnonymousUserService.ts`

---

### 2.4. UI "Reprendre mon profil"
- [ ] Modal de détection identité locale
- [ ] Bouton "Reprendre mon profil"
- [ ] Bouton "Créer un nouveau profil"
- [ ] Intégration dans flow QR code

**Fichiers à créer :**
- `src/components/IdentityModal.tsx`

**Flow :**
1. Scan QR → Détecter localUser
2. Si existe → Afficher modal "Reprendre ?"
3. Si non → Demander pseudo

---

## Phase 3 : Sync hybride (Semaine 3-4)

### 3.1. Service SyncService
- [ ] Créer service de sync bidirectionnelle
- [ ] Sync localStorage → Supabase
- [ ] Sync Supabase → localStorage
- [ ] Détection conflits
- [ ] Résolution conflits

**Fichiers à créer :**
- `src/services/SyncService.ts`

**Stratégie :**
- **Last Write Wins** pour matchs
- **Merge** pour stats
- **User confirmation** pour conflits majeurs

---

### 3.2. Gestion offline/online
- [ ] Détecter état connexion
- [ ] Queue d'actions offline
- [ ] Sync automatique au retour online
- [ ] Indicateur visuel (offline badge)

**Fichiers à créer :**
- `src/hooks/useOnlineStatus.ts`
- `src/services/OfflineQueue.ts`

---

### 3.3. Migration données existantes
- [ ] Script de migration localStorage → Supabase
- [ ] Créer anonymous_users pour joueurs existants
- [ ] Migrer leagues, tournaments, matches
- [ ] Tests de migration

**Fichiers à créer :**
- `src/services/MigrationService.ts`
- `src/scripts/migrateLocalStorage.ts`

**Stratégie :**
1. Détecter données localStorage
2. Proposer migration (modal)
3. Créer anonymous_users
4. Migrer progressivement
5. Garder localStorage comme backup

---

## Phase 4 : Revendication de compte (Semaine 4-5)

### 4.1. Flow OTP Supabase
- [ ] Modal de revendication
- [ ] Input email
- [ ] Envoi OTP
- [ ] Validation OTP
- [ ] Redirection après validation

**Fichiers à créer :**
- `src/components/ClaimAccountModal.tsx`
- `src/services/AuthService.ts`

**Flow :**
1. User clique "Sauvegarder mon profil"
2. Modal → Input email
3. `supabase.auth.signInWithOtp({ email })`
4. User clique lien email
5. Callback → Validation
6. Fusion identité

---

### 4.2. Service de fusion d'identité
- [ ] Créer user dans Supabase Auth
- [ ] Créer enregistrement dans `users`
- [ ] Mettre à jour `anonymous_users.merged_to_user_id`
- [ ] Migrer `league_players`
- [ ] Migrer `tournament_players`
- [ ] Migrer `elo_history`
- [ ] Migrer `matches` (remplacer IDs dans arrays)

**Fichiers à créer :**
- `src/services/IdentityMergeService.ts`

**Fonctions :**
```typescript
async mergeAnonymousToUser(
  anonymousUserId: string,
  userEmail: string
): Promise<void>
```

---

### 4.3. Tests de fusion
- [ ] Tests unitaires fusion
- [ ] Tests E2E flow complet
- [ ] Tests cas limites (conflits, etc.)

---

## Phase 5 : UX & Polish (Semaine 5-6)

### 5.1. Indicateurs visuels
- [ ] Badge "📱 Local" pour anonymous users
- [ ] Badge "✓ Compte" pour users
- [ ] Couleurs différentes (gris vs orange)
- [ ] Intégration dans PlayerProfile

**Fichiers à modifier :**
- `src/components/PlayerCard.tsx`
- `src/pages/PlayerProfile.tsx`

---

### 5.2. Badge "Sauvegarder mon profil"
- [ ] Badge non intrusif sur profil
- [ ] Apparition après X matchs ou X jours
- [ ] Animation subtile

**Fichiers à modifier :**
- `src/pages/PlayerProfile.tsx`

---

### 5.3. QR code scanning
- [ ] Intégrer lib QR scanner (ex: `html5-qrcode`)
- [ ] Flow scan → rejoindre Tournament/League
- [ ] Gestion erreurs (QR invalide, etc.)

**Fichiers à créer :**
- `src/components/QRScanner.tsx`
- `src/pages/JoinViaQR.tsx`

**Lib suggérée :**
```bash
npm install html5-qrcode
```

---

### 5.4. Gestion des erreurs
- [ ] Messages d'erreur clairs
- [ ] Retry automatique
- [ ] Fallback gracieux
- [ ] Logging erreurs

---

### 5.5. Tests E2E
- [ ] Test flow complet : QR → jouer → revendiquer
- [ ] Test sync multi-device
- [ ] Test offline/online
- [ ] Test migration

---

## Structure de fichiers finale

```
src/
├── lib/
│   └── supabase.ts
├── services/
│   ├── LocalUserService.ts
│   ├── AnonymousUserService.ts
│   ├── SyncService.ts
│   ├── AuthService.ts
│   ├── IdentityMergeService.ts
│   ├── MigrationService.ts
│   └── OfflineQueue.ts
├── components/
│   ├── IdentityModal.tsx
│   ├── ClaimAccountModal.tsx
│   └── QRScanner.tsx
├── hooks/
│   └── useOnlineStatus.ts
├── types/
│   ├── supabase.ts (généré)
│   └── index.ts (adapté)
└── utils/
    └── deviceFingerprint.ts
```

---

## Dépendances à installer

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@fingerprintjs/fingerprintjs": "^4.2.0",
    "html5-qrcode": "^2.3.8"
  }
}
```

---

## Variables d'environnement

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

---

## Checklist de déploiement

### Avant déploiement
- [ ] Toutes les migrations SQL appliquées
- [ ] RLS policies configurées et testées
- [ ] Types TypeScript générés
- [ ] Variables d'environnement configurées
- [ ] Tests unitaires passent
- [ ] Tests E2E passent

### Déploiement
- [ ] Déployer migrations Supabase
- [ ] Configurer redirect URLs Supabase Auth
- [ ] Déployer frontend avec nouvelles variables
- [ ] Tester flow complet en production

### Post-déploiement
- [ ] Monitorer erreurs (Sentry, etc.)
- [ ] Monitorer métriques (taux onboarding, etc.)
- [ ] Collecter feedback utilisateurs

---

## Risques & mitigations

### Risque 1 : Migration données existantes
**Mitigation :** Migration progressive, garder localStorage comme backup

### Risque 2 : Conflits de sync
**Mitigation :** Stratégie Last Write Wins + merge pour stats

### Risque 3 : Performance (trop de requêtes)
**Mitigation :** Pagination, cache local, batch requests

### Risque 4 : Sécurité (rate limiting)
**Mitigation :** RLS policies, rate limiting Supabase

---

## Métriques à suivre

- Taux d'onboarding (QR → jouer)
- Taux de revendication (anonymous → user)
- Temps moyen d'onboarding
- Taux d'erreur sync
- Nombre de conflits résolus

---

## Prochaines étapes après cette feature

1. **Notifications push** (pour users uniquement)
2. **Avatars** (upload images)
3. **Social features** (amis, défis)
4. **Export données** (GDPR compliance)



