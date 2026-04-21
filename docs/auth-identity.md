# Authentification & identité

Le système d'identité supporte deux niveaux : une identité **locale anonyme** (zero-friction, stockée dans `localStorage`) et un **compte authentifié** Supabase (email + OTP). L'utilisateur peut fusionner son identité locale avec un compte quand il le souhaite.

## Objectifs

- Permettre de jouer **immédiatement** via QR code sans créer de compte.
- Proposer une **revendication** optionnelle par email + OTP pour persister ses stats.
- **Fusionner** proprement les données locales dans le compte global.
- Offrir un mode dev sans friction pour tester les flows.

## Les deux types d'identité

### Identité locale (anonyme)

Créée au premier accès, stockée dans `localStorage` et en base Supabase dans la table `anonymous_users`.

- UUID v4 généré côté client.
- Pseudo choisi par l'utilisateur.
- Optionnellement un `device_fingerprint` (basé sur user agent, langue, résolution, timezone, canvas fingerprint).
- Permissions : rejoindre tournois/ligues, enregistrer des matchs, voir ses stats dans le contexte courant.
- **Aucun email, aucune inscription.**

### Compte authentifié

Créé lors de la revendication via Supabase Auth (email + OTP / magic link).

- Ligne dans `public.users` (liée à `auth.users.id`).
- `anonymous_users.merged_to_user_id` pointe vers le compte.
- Toutes les associations (`league_players`, `tournament_players`, `matches`, `elo_history`) sont migrées de `anonymous_user_id` vers `user_id`.
- L'utilisateur peut se reconnecter sur un autre device et retrouver ses stats.

## Flow de revendication (merge)

1. L'utilisateur clique "Sauvegarder mon profil" dans `UserProfile` ou depuis `AuthModal`.
2. Saisie email, envoi OTP par Supabase.
3. Clic sur le magic link → redirection `/auth/callback`.
4. `AuthCallback` valide la session et délègue à `IdentityMergeService`.
5. Le service :
   - Crée/retrouve la ligne `public.users`.
   - Migre toutes les associations de l'`anonymous_user_id` courant vers le nouveau `user_id`.
   - Met à jour les arrays `team_a_player_ids` / `team_b_player_ids` dans `matches`.
   - Marque l'`anonymous_user` comme fusionné (`merged_to_user_id`, `merged_at`).
   - Enregistre la fusion dans `user_identity_merges` (audit).

Gestion des conflits :
- Si le compte existe déjà avec des participations : pas de doublon dans `league_players`/`tournament_players`, l'existant prime.
- Si un pseudo est déjà pris dans une league : suggestion d'une variante.

## Mode développement

### Comptes de test

Deux comptes sont utilisables en dev (`import.meta.env.DEV`) pour se connecter instantanément par email + password, sans envoi d'email.

| Email | Mot de passe |
|-------|--------------|
| `admin@admin.com` | `admin123` |
| `test@test.com` | `test123` |

Ils sont déclarés dans `src/services/AuthService.ts` :

```ts
private readonly TEST_ACCOUNTS = [
  { email: 'admin@admin.com', password: 'admin123' },
  { email: 'test@test.com',   password: 'test123'  },
];

private isTestAccount(email: string): boolean {
  if (!import.meta.env.DEV) return false; // bloqué en prod
  return this.TEST_ACCOUNTS.some(acc => acc.email === email);
}
```

### Activer Password Auth dans Supabase

Pour que `signInWithPassword()` fonctionne côté Supabase :

1. Dashboard Supabase → Authentication → Providers → Email.
2. Activer **Enable Email provider** et **Enable Email Signup**.
3. Désactiver **Confirm email** (en dev uniquement).
4. Save.

### Créer les comptes de test

Dans le SQL Editor Supabase :

```sql
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@admin.com',
  crypt('admin123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}', '{}',
  false, 'authenticated', 'authenticated'
);

-- Répéter pour test@test.com / test123.
```

Alternative via UI : Authentication → Users → Add User avec **Auto Confirm** activé.

### Usage dans l'app

- **AuthModal** détecte automatiquement les emails de test et affiche "Compte test détecté - Connexion directe". Le bouton passe de "Envoyer le lien magique" à "Se connecter" et la session démarre sans email.
- **DevPanel** (bouton 🧪 flottant en bas à droite en dev) expose les boutons "Login as Admin" et "Login as Test User" pour une connexion un-clic.

### En production

`import.meta.env.DEV` vaut `false`, la détection est désactivée et le flow OTP standard est utilisé pour tous les emails.

## Configuration des Redirect URLs

Dans le dashboard Supabase → Authentication → URL Configuration → **Redirect URLs** :

```
http://localhost:5173/auth/callback
http://localhost:5173/**
https://*.vercel.app/auth/callback
https://beer-pong-elo.com/auth/callback
```

Le code utilise `${window.location.origin}/auth/callback`, l'URL doit donc figurer dans cette liste sinon la redirection est bloquée.

## Dépannage

- **"Invalid login credentials"** → les comptes de test n'existent pas dans `auth.users`, exécuter le SQL ci-dessus.
- **"Database error querying schema"** → Password Auth n'est pas activé côté Supabase (voir section dédiée).
- **Magic link ne redirige pas** → l'URL n'est pas dans la liste des Redirect URLs autorisés.
- **Login dev fonctionne en prod** → bug de build Vite, vérifier `import.meta.env.DEV`.
