# PRD — Gestion de l'identité & comptes joueurs
## Web-App responsive + Supabase Backend

**Version:** 1.0  
**Date:** 2024  
**Statut:** À implémenter

---

## 1. Objectif

Permettre à n'importe quel utilisateur :
- de **rejoindre instantanément** un Tournament ou une League via QR code,
- de **jouer sans créer de compte** (identité locale),
- de **conserver une identité locale** sur le device,
- de **revendiquer son profil** à tout moment pour obtenir une identité persistante via Supabase Auth (email + OTP),
- de **synchroniser ses stats** entre appareils une fois le compte revendiqué.

**Priorité : zéro friction**, adaptée aux soirées et gros événements.

---

## 2. Concepts clés

### 2.1. Identité locale (Anonymous Local User)

**Caractéristiques :**
- Créée automatiquement au premier accès via QR ou première action
- Stockée dans `localStorage` sous forme d'un identifiant unique (UUID v4)
- Associée à un pseudo créé par l'utilisateur
- Limitée à l'appareil + navigateur
- **Aucun email requis. Aucune inscription.**

**Permissions :**
- Rejoindre Tournament/League
- Enregistrer des matchs
- Visualiser ses stats dans ce contexte uniquement
- Créer des Leagues/Tournaments (optionnel, peut être limité)

**Stockage :**
```typescript
interface LocalUser {
  anonymousUserId: string; // UUID v4
  pseudo: string;
  createdAt: string;
  deviceFingerprint?: string; // Optionnel pour détection multi-device
}
```

**Avantages :**
- Zero-friction onboarding
- Pas de barrière d'entrée
- Parfait pour événements ponctuels

---

### 2.2. Compte revendiqué (Supabase Auth)

**Caractéristiques :**
- L'utilisateur associe son identité locale à un email
- Authentification via OTP (magic link ou code SMS)
- Son identité devient **globale** et **persistante**
- Son `anonymous_user_id` est fusionné avec un `user_id` Supabase
- Ses stats sont synchronisables sur plusieurs devices

**Flow de revendication :**
1. Utilisateur clique "Sauvegarder mon profil" depuis son profil
2. Saisie email
3. Supabase envoie OTP (magic link)
4. Validation → fusion des données
5. Migration automatique des stats locales vers le compte global

**Avantages :**
- Optionnel, activé uniquement par les power users
- Historique à vie
- Multi-device sync

---

### 2.3. Pseudo & unicité

**Règles :**
- Un pseudo n'a besoin d'être unique **que dans un Tournament ou une League**
- Si le pseudo existe déjà dans le contexte :
  - Proposer "Es-tu ce joueur ?" → login/revendication
  - Sinon "Choisis une variante" (suggestion : `pseudo_2`, `pseudo_3`, etc.)

**Gestion des conflits :**
- Dans une League : pseudo unique par League
- Dans un Tournament : pseudo unique par Tournament
- Globalement : pas d'unicité requise (plusieurs "John" possibles dans différentes Leagues)

---

## 3. Parcours UX

### 3.1. Rejoindre un Tournament/League via QR

**Flow :**
1. Scan du QR → ouverture web app avec paramètres `?tournament=xxx` ou `?league=xxx`
2. L'app détecte un `local_user` dans `localStorage` ?
   - **Oui** → Modal : "Reprendre ton profil ?" (pseudo affiché) ou "Créer un nouveau profil"
   - **Non** → Demande un pseudo (input simple)
3. L'utilisateur rejoint le Tournament/League immédiatement
4. L'app crée un enregistrement `anonymous_user` en DB (si backend disponible) ou stocke localement

**Résultat :**
→ Le joueur peut jouer **instantanément**  
→ Zero-friction (casual players totalement onboardés)

**Cas d'erreur :**
- QR code invalide → Message d'erreur + redirection Home
- Tournament/League introuvable → Message d'erreur + redirection Home
- Pas de connexion → Mode offline (localStorage uniquement)

---

### 3.2. Jouer et enregistrer des matchs

**Flow :**
- Les matchs créés utilisent l'identité locale (ou globale si existante)
- Les stats sont stockées dans les tables Tournament/League en utilisant l'identifiant du joueur
- Si un joueur n'existe pas encore dans la League → il est automatiquement ajouté

**Gestion offline/online :**
- **Online** : Sync immédiate avec Supabase
- **Offline** : Stockage local, sync différée au retour de connexion

---

### 3.3. Revendiquer son compte

**Accès :**
- Profil du joueur → Bouton "Sauvegarder mon profil / Créer mon compte"
- Menu Settings → Option "Créer un compte"

**Flow :**
1. Modal "Créer mon compte"
2. Saisie email
3. Validation email (format check)
4. Supabase envoie OTP (magic link)
5. Utilisateur clique le lien dans l'email
6. Retour app → Validation automatique
7. Fusion des données :
   - `anonymous_user_id` → `user_id`
   - Migration des stats locales vers le compte global
   - Mise à jour des associations League/Tournament

**UX :**
- Le joueur "casual" n'est jamais bloqué
- Le joueur "régulier" peut retrouver son historique à vie
- Suggestion non intrusive : badge "💾 Sauvegarder mon profil" sur le profil

---

### 3.4. Reconnexion plus tard

**Même device :**
- L'app propose automatiquement son identité locale
- Si compte revendiqué → Connexion auto via Supabase (si session valide)

**Nouvel appareil :**
- L'utilisateur peut récupérer ses stats en se connectant via email → OTP Supabase
- Option "Continuer sans compte" → Création nouvelle identité locale

---

## 4. Structure DB (Supabase PostgreSQL)

### 4.1. Table : `users`

**Représente l'utilisateur global** (lié à Supabase Auth).

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudo TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Règles :**
- Uniquement créé quand l'utilisateur revendique son compte
- `id` = `auth.users.id` (Supabase Auth)
- Pseudo par défaut (peut être modifié)

---

### 4.2. Table : `anonymous_users`

**Gère les identités locales (device-based).**

```sql
CREATE TABLE anonymous_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pseudo TEXT NOT NULL,
  device_fingerprint TEXT, -- Optionnel, pour détection multi-device
  created_at TIMESTAMPTZ DEFAULT NOW(),
  merged_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Si fusionné
  merged_at TIMESTAMPTZ
);

CREATE INDEX idx_anonymous_users_fingerprint ON anonymous_users(device_fingerprint);
CREATE INDEX idx_anonymous_users_merged ON anonymous_users(merged_to_user_id);
```

**Règles :**
- Créé automatiquement au premier accès
- Peut être fusionné dans `users` lors de la revendication
- `merged_to_user_id` permet de tracer la fusion

---

### 4.3. Table : `leagues`

```sql
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('event', 'season')),
  creator_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  creator_anonymous_user_id UUID REFERENCES anonymous_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (creator_user_id IS NOT NULL AND creator_anonymous_user_id IS NULL) OR
    (creator_user_id IS NULL AND creator_anonymous_user_id IS NOT NULL)
  )
);
```

**Règles :**
- Créateur peut être un `user` ou un `anonymous_user`
- Un seul des deux doit être défini (CHECK constraint)

---

### 4.4. Table : `league_players`

**Associations entre League et joueurs.**

```sql
CREATE TABLE league_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  anonymous_user_id UUID REFERENCES anonymous_users(id) ON DELETE CASCADE,
  pseudo_in_league TEXT NOT NULL, -- Pseudo utilisé dans cette League (peut différer)
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (user_id IS NOT NULL AND anonymous_user_id IS NULL) OR
    (user_id IS NULL AND anonymous_user_id IS NOT NULL)
  ),
  UNIQUE(league_id, user_id) WHERE user_id IS NOT NULL,
  UNIQUE(league_id, anonymous_user_id) WHERE anonymous_user_id IS NOT NULL
);

CREATE INDEX idx_league_players_league ON league_players(league_id);
CREATE INDEX idx_league_players_user ON league_players(user_id);
CREATE INDEX idx_league_players_anonymous ON league_players(anonymous_user_id);
```

**Règles :**
- Chaque entrée peut être liée soit à un `user_id` global, soit à un `anonymous_user_id` local
- `pseudo_in_league` permet d'avoir des pseudos différents par League
- Unicité : un joueur (user ou anonymous) ne peut être qu'une fois dans une League

---

### 4.5. Table : `tournaments`

```sql
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  creator_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  creator_anonymous_user_id UUID REFERENCES anonymous_users(id) ON DELETE SET NULL,
  is_finished BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (creator_user_id IS NOT NULL AND creator_anonymous_user_id IS NULL) OR
    (creator_user_id IS NULL AND creator_anonymous_user_id IS NOT NULL)
  )
);
```

---

### 4.6. Table : `tournament_players`

**Association joueur ↔ tournament.**

```sql
CREATE TABLE tournament_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  anonymous_user_id UUID REFERENCES anonymous_users(id) ON DELETE CASCADE,
  pseudo_in_tournament TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (user_id IS NOT NULL AND anonymous_user_id IS NULL) OR
    (user_id IS NULL AND anonymous_user_id IS NOT NULL)
  ),
  UNIQUE(tournament_id, user_id) WHERE user_id IS NOT NULL,
  UNIQUE(tournament_id, anonymous_user_id) WHERE anonymous_user_id IS NOT NULL
);
```

---

### 4.7. Table : `matches`

```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('1v1', '2v2', '3v3')),
  team_a_player_ids UUID[] NOT NULL, -- Array d'IDs (user_id ou anonymous_user_id)
  team_b_player_ids UUID[] NOT NULL,
  score_a INTEGER NOT NULL,
  score_b INTEGER NOT NULL,
  is_ranked BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by_anonymous_user_id UUID REFERENCES anonymous_users(id) ON DELETE SET NULL,
  CHECK (
    (created_by_user_id IS NOT NULL AND created_by_anonymous_user_id IS NULL) OR
    (created_by_user_id IS NULL AND created_by_anonymous_user_id IS NOT NULL)
  )
);

CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_league ON matches(league_id);
CREATE INDEX idx_matches_created_at ON matches(created_at);
```

**Règles :**
- `team_a_player_ids` et `team_b_player_ids` contiennent des UUIDs qui peuvent être soit des `user_id`, soit des `anonymous_user_id`
- Le système doit déterminer le type lors de la lecture (via JOIN ou lookup)

---

### 4.8. Table : `elo_history`

**Historique des variations ELO.**

```sql
CREATE TABLE elo_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  anonymous_user_id UUID REFERENCES anonymous_users(id) ON DELETE CASCADE,
  elo_before INTEGER NOT NULL,
  elo_after INTEGER NOT NULL,
  elo_change INTEGER NOT NULL, -- Calculé : elo_after - elo_before
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (user_id IS NOT NULL AND anonymous_user_id IS NULL) OR
    (user_id IS NULL AND anonymous_user_id IS NOT NULL)
  )
);

CREATE INDEX idx_elo_history_match ON elo_history(match_id);
CREATE INDEX idx_elo_history_user ON elo_history(user_id);
CREATE INDEX idx_elo_history_anonymous ON elo_history(anonymous_user_id);
CREATE INDEX idx_elo_history_tournament ON elo_history(tournament_id);
CREATE INDEX idx_elo_history_league ON elo_history(league_id);
```

---

### 4.9. Table : `user_identity_merges` (Optionnel, pour audit)

**Traçabilité des fusions anonymous → user.**

```sql
CREATE TABLE user_identity_merges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_user_id UUID NOT NULL REFERENCES anonymous_users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  merged_at TIMESTAMPTZ DEFAULT NOW(),
  stats_migrated BOOLEAN DEFAULT FALSE
);
```

---

## 5. Règles métier

### 5.1. Identité

1. **Un joueur peut être local, global, ou un mélange (local → global).**
2. **Un joueur peut apparaître dans une League en tant que local**, puis devenir global → lier les deux.
3. **Les stats d'un joueur sont toujours calculées via un identifiant unique**, qu'il soit local ou global.
4. **Les Tournaments n'exigent pas de compte**, ce qui est crucial pour les soirées.
5. **Les stats globales ne sont consolidées que via un compte Supabase Auth.**

### 5.2. Fusion d'identité

**Lors de la revendication :**
1. Créer un `user` dans Supabase Auth (via OTP)
2. Créer un enregistrement dans `users` avec le pseudo
3. Mettre à jour `anonymous_users.merged_to_user_id`
4. Migrer toutes les associations :
   - `league_players` : `anonymous_user_id` → `user_id`
   - `tournament_players` : `anonymous_user_id` → `user_id`
   - `elo_history` : `anonymous_user_id` → `user_id`
   - `matches` : Remplacer les `anonymous_user_id` dans les arrays par `user_id`
5. Consolider les stats (ELO, wins, losses, etc.)

**Gestion des conflits :**
- Si le pseudo existe déjà dans une League → proposer de fusionner ou garder séparé
- Si plusieurs `anonymous_user_id` pointent vers le même device → proposer de fusionner

### 5.3. Pseudo

- Unicité : **par League/Tournament uniquement**
- Suggestion de variantes si conflit : `pseudo_2`, `pseudo_3`, etc.
- Possibilité de changer le pseudo dans une League/Tournament (historique conservé)

---

## 6. Choix techniques

### 6.1. Architecture hybride (localStorage + Supabase)

**Stratégie :**
- **Mode offline-first** : Toutes les actions fonctionnent en localStorage
- **Sync différée** : Quand Supabase est disponible, sync automatique
- **Fallback gracieux** : Si Supabase down, l'app continue de fonctionner

**Implémentation :**
```typescript
// Service de sync
class SyncService {
  async syncLocalToSupabase() {
    // 1. Récupérer les données locales
    // 2. Vérifier les conflits
    // 3. Pousser vers Supabase
    // 4. Marquer comme synced
  }
  
  async syncSupabaseToLocal() {
    // 1. Récupérer les données Supabase
    // 2. Fusionner avec local (résolution de conflits)
    // 3. Mettre à jour localStorage
  }
}
```

### 6.2. Device Fingerprint

**Objectif :** Détecter si le même device revient (même sans compte)

**Implémentation :**
```typescript
// Génération d'un fingerprint simple
function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Device fingerprint', 2, 2);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');
  
  // Hash simple (ou utiliser une lib comme fingerprintjs)
  return btoa(fingerprint).substring(0, 32);
}
```

**Alternative :** Utiliser une lib comme `@fingerprintjs/fingerprintjs`

### 6.3. Gestion des conflits de sync

**Stratégie :**
- **Last Write Wins** pour les matchs (timestamp)
- **Merge** pour les stats (somme des wins/losses, moyenne pondérée pour ELO)
- **User confirmation** pour les conflits majeurs (pseudo, etc.)

### 6.4. Migration depuis localStorage actuel

**Stratégie progressive :**
1. **Phase 1** : Ajouter Supabase en parallèle, garder localStorage
2. **Phase 2** : Sync bidirectionnelle
3. **Phase 3** : Migration progressive des données existantes
4. **Phase 4** : Supabase comme source de vérité, localStorage comme cache

**Migration des données existantes :**
```typescript
// Script de migration
async function migrateLocalStorageToSupabase() {
  const localLeagues = JSON.parse(localStorage.getItem('bpl_leagues') || '[]');
  
  for (const league of localLeagues) {
    // Créer anonymous_user pour chaque joueur
    // Créer league en Supabase
    // Créer league_players
    // Créer matches
  }
}
```

---

## 7. UX Guidelines

### 7.1. Principes

- **Jamais obliger la création de compte**
- **Toujours proposer "Reprendre mon profil"** si device reconnu
- **QR Code = entrée prioritaire** → doit ouvrir directement la page Tournament/League
- **Les joueurs locaux doivent être gérés visuellement aussi clairement que les joueurs globaux**

### 7.2. Indicateurs visuels

**Joueur local (anonymous) :**
- Badge discret : "📱 Local" ou icône device
- Couleur différente (gris vs orange pour global)

**Joueur global (compte) :**
- Badge : "✓ Compte" ou icône check
- Couleur principale (orange)

**Suggestion de compte :**
- Badge non intrusif : "💾 Sauvegarder mon profil" sur le profil
- Apparition après X matchs ou après X jours

### 7.3. Flow de revendication

**Modal simple :**
1. Titre : "Sauvegarder ton profil"
2. Description : "Crée un compte pour retrouver tes stats sur tous tes appareils"
3. Input email
4. Bouton "Envoyer le lien magique"
5. Message : "Vérifie ta boîte mail !"
6. Redirection automatique au clic du lien

---

## 8. Sécurité & Performance

### 8.1. Sécurité

- **Rate limiting** : Limiter création d'anonymous users (ex: 10/jour/device)
- **Validation email** : Format check + vérification domaine (optionnel)
- **OTP expiration** : 15 minutes
- **Session Supabase** : Refresh automatique
- **RLS (Row Level Security)** : Activer sur toutes les tables Supabase

### 8.2. Performance

- **Lazy loading** : Charger les stats à la demande
- **Pagination** : Pour les listes de matchs (50 par page)
- **Cache local** : Mettre en cache les classements
- **Optimistic updates** : Mettre à jour l'UI avant confirmation serveur

---

## 9. Plan d'implémentation

### Phase 1 : Foundation (Semaine 1-2)
- [ ] Setup Supabase project
- [ ] Créer les migrations SQL (toutes les tables)
- [ ] Configurer Supabase Auth (OTP)
- [ ] Créer les types TypeScript depuis Supabase
- [ ] Setup RLS policies

### Phase 2 : Identité locale (Semaine 2-3)
- [ ] Service `LocalUserService` (gestion localStorage)
- [ ] Génération UUID anonyme
- [ ] Device fingerprint
- [ ] UI "Reprendre mon profil"
- [ ] Création anonymous_user en DB

### Phase 3 : Sync hybride (Semaine 3-4)
- [ ] Service `SyncService` (localStorage ↔ Supabase)
- [ ] Gestion offline/online
- [ ] Résolution de conflits
- [ ] Migration données existantes

### Phase 4 : Revendication (Semaine 4-5)
- [ ] Flow OTP Supabase
- [ ] Modal de revendication
- [ ] Service de fusion d'identité
- [ ] Migration des stats
- [ ] Tests de fusion

### Phase 5 : UX & Polish (Semaine 5-6)
- [ ] Indicateurs visuels (local vs global)
- [ ] Badge "Sauvegarder mon profil"
- [ ] QR code scanning
- [ ] Gestion des erreurs
- [ ] Tests E2E

---

## 10. Bénéfices

### Pour l'utilisateur
- Simple, immédiat, fun
- Identité fluide, adaptée à l'ambiance soirée
- Possibilité de conserver son historique avec un compte s'il le souhaite

### Pour le produit
- Aucun blocage onboarding dans un event
- Conversion "casual → membre" possible plus tard
- Compatible avec Supabase Auth (OTP → très simple)
- Structure extensible sans dette fonctionnelle
- Scalabilité (Supabase gère l'infra)

---

## 11. Métriques de succès

- **Taux d'onboarding** : % d'utilisateurs qui rejoignent un Tournament/League
- **Taux de revendication** : % d'anonymous users qui créent un compte
- **Temps moyen d'onboarding** : < 30 secondes
- **Taux d'erreur** : < 1% sur les fusions d'identité

---

## 12. Questions ouvertes / À décider

1. **Limite d'anonymous users** : Faut-il limiter la création ? (suggestion : 10/jour/device)
2. **Avatar** : Quand l'ajouter ? (V2 ou dès le début ?)
3. **Notifications** : Push notifications pour les joueurs avec compte uniquement ?
4. **Export données** : Permettre export des stats avant revendication ?
5. **Suppression compte** : Permettre suppression + anonymisation des données ?

---

## 13. Références techniques

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Device Fingerprinting](https://fingerprintjs.com/)
- [UUID v4](https://www.uuidgenerator.net/)



