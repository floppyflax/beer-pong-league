# 🧪 Dev Test Accounts Setup Guide

Guide pour configurer les comptes de test Supabase qui permettent de se logger sans recevoir de Magic Link email.

## 📋 Vue d'Ensemble

**Pourquoi des test accounts?**
- Tester les flows d'authentification sans friction email
- Pas besoin de recevoir et cliquer sur des Magic Links
- Teste les **vrais flows Supabase** (pas de bypass hacky)
- Comptes persistants dans la DB comme de vrais utilisateurs

**Comment ça marche?**
- En **production**: Users utilisent Email + OTP (Magic Link)
- En **dev mode**: Test accounts utilisent Email + Password (pas d'email)
- AuthService détecte automatiquement les test accounts

---

## 🔧 Setup Step-by-Step

### Étape 1: Accéder à Supabase Dashboard

1. Va sur https://supabase.com
2. Login avec ton compte
3. Sélectionne ton projet: **beer-pong-league**

---

### Étape 2: Créer les Test Accounts

#### **Option A: Via SQL Editor (Recommandé)**

1. Dans le dashboard Supabase, va dans **SQL Editor**
2. Click "New Query"
3. Copie-colle ce SQL:

```sql
-- Créer le test account Admin
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@admin.com',
  crypt('admin123', gen_salt('bf')), -- Password: admin123
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated'
);

-- Créer le test account Test User
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'test@test.com',
  crypt('test123', gen_salt('bf')), -- Password: test123
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated'
);
```

4. Click "Run" (ou `Cmd+Enter`)
5. Vérifie que les queries ont réussi (pas d'erreur)

---

#### **Option B: Via Supabase Auth UI (Alternative)**

1. Va dans **Authentication** → **Users**
2. Click "Add User"
3. Entre les infos:
   - **Email**: `admin@admin.com`
   - **Password**: `admin123`
   - **Auto Confirm**: ✅ (important!)
4. Click "Create User"
5. Répète pour `test@test.com` / `test123`

---

### Étape 3: Vérifier les Comptes

1. Va dans **Authentication** → **Users**
2. Tu devrais voir:
   ```
   admin@admin.com  ✅ Confirmed
   test@test.com    ✅ Confirmed
   ```
3. Si "Email Confirmed" est vide → Click sur le user → "Confirm Email"

---

### Étape 4: (Optionnel) Créer les Profils Users

Si ta DB a une table `public.users` qui stocke les profils:

```sql
-- Récupère les IDs des test users
SELECT id, email FROM auth.users WHERE email IN ('admin@admin.com', 'test@test.com');

-- Créer les profils (remplace {admin_id} et {test_id} par les vrais IDs)
INSERT INTO public.users (id, pseudo, email, created_at) VALUES
  ('{admin_id}', 'Admin Dev', 'admin@admin.com', now()),
  ('{test_id}', 'Test User', 'test@test.com', now());
```

---

## 🚀 Utilisation

### Dans l'App (Dev Mode)

1. Lance l'app en dev: `npm run dev`
2. Click sur le bouton flottant 🧪 (bas droite)
3. Tu verras deux boutons:
   - **👨‍💻 Login as Admin** → `admin@admin.com`
   - **🧪 Login as Test User** → `test@test.com`
4. Click sur un des boutons
5. **Pas d'email requis!** → Login immédiat
6. Redirect vers Home, authentifié

### Via AuthModal (Dev Mode)

Tu peux aussi utiliser l'AuthModal normale:

1. Ouvre AuthModal
2. Entre `admin@admin.com`
3. Click "Envoyer le lien"
4. **En dev mode**: Pas d'email envoyé, login direct!
5. Authentifié instantanément

---

## 🔐 Sécurité

**Important:**
- ⚠️ Ces comptes fonctionnent **SEULEMENT en mode dev** (`import.meta.env.DEV`)
- ✅ En production, ils utilisent le flow OTP normal (email requis)
- ✅ Passwords hardcodés sont OK car dev-only

**Code de détection (AuthService):**
```typescript
private isTestAccount(email: string): boolean {
  if (!import.meta.env.DEV) return false; // ← Bloqué en prod
  return this.TEST_ACCOUNTS.some(acc => acc.email === email);
}
```

---

## 📝 Comptes Configurés

| Email             | Password  | Description                    |
|-------------------|-----------|--------------------------------|
| admin@admin.com   | admin123  | Compte admin pour tests        |
| test@test.com     | test123   | Compte utilisateur test        |

**Ajouter d'autres comptes:**

1. Édite `src/services/AuthService.ts`
2. Modifie `TEST_ACCOUNTS`:
   ```typescript
   private readonly TEST_ACCOUNTS = [
     { email: 'admin@admin.com', password: 'admin123' },
     { email: 'test@test.com', password: 'test123' },
     { email: 'nouveau@test.com', password: 'password' }, // ← Ajoute ici
   ];
   ```
3. Crée le compte dans Supabase (SQL ou UI)

---

## 🧪 Test Flows

### Flow 1: Login Dev via DevPanel

```
1. Open app
2. Click 🧪 button
3. Click "Login as Admin"
4. → Authenticated instantly (no email)
5. Reload page
6. → Still authenticated (session persists)
```

### Flow 2: Login Dev via AuthModal

```
1. Open AuthModal
2. Enter "admin@admin.com"
3. Click "Envoyer le lien"
4. → Dev mode detected
5. → Password auth used (no OTP)
6. → Authenticated instantly
```

### Flow 3: Production Behavior

```
1. Deploy to Vercel (production)
2. Try "admin@admin.com"
3. → import.meta.env.DEV = false
4. → Falls back to OTP flow
5. → Email sent as normal
```

---

## ❓ Troubleshooting

### "User already exists"
- Les comptes existent déjà
- Vérifie dans Authentication → Users
- Utilise directement sans recréer

### "Invalid login credentials"
- Le compte n'existe pas dans Supabase
- Suis "Setup Step-by-Step" ci-dessus
- Vérifie que email est confirmé

### "Login works but no profile"
- Le compte auth existe mais pas le profil public.users
- Execute le SQL de l'Étape 4

### "En production, password login fonctionne"
- BUG: Le check `import.meta.env.DEV` ne marche pas
- Vérifie la config Vite
- Ajoute un check supplémentaire avec `window.location.hostname`

---

## 📚 Références

**Fichiers modifiés:**
- `src/services/AuthService.ts` - Détection + password auth
- `src/components/DevPanel.tsx` - Quick login buttons

**Supabase Docs:**
- [Auth API](https://supabase.com/docs/guides/auth)
- [Password Auth](https://supabase.com/docs/guides/auth/passwords)
- [Auth Admin](https://supabase.com/docs/guides/auth/managing-user-data)

---

## ✅ Checklist

Après setup, vérifie:

- [ ] Test accounts créés dans Supabase Auth
- [ ] Emails confirmés (✅ dans Users list)
- [ ] Profils créés dans `public.users` (si applicable)
- [ ] DevPanel affiche les boutons login
- [ ] Login fonctionne sans email en dev
- [ ] Session persiste après reload
- [ ] En production, OTP flow est utilisé

---

**🎉 Setup terminé!** Tu peux maintenant tester tous les flows d'authentification sans friction email!
