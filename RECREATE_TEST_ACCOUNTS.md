# 🔧 Recréer les comptes de test via Dashboard Supabase

## ❌ Problème identifié

Les comptes créés manuellement via SQL ne sont **pas reconnus** par Supabase Auth. L'erreur "Database error finding user" confirme que Supabase Auth ne peut pas les trouver.

## ✅ Solution : Créer les comptes via le Dashboard

### Étape 1 : Supprimer les anciens comptes (optionnel mais recommandé)

1. Ouvrez [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet **beer-pong-league**
3. Allez dans **Authentication → Users**
4. Si vous voyez `admin@admin.com` ou `test@test.com`, cliquez sur les **trois points** à droite de chaque ligne
5. Cliquez sur **"Delete user"**

### Étape 2 : Créer admin@admin.com via le Dashboard

1. Dans **Authentication → Users**, cliquez sur **"Invite user"** ou **"Add user"**
2. Remplissez le formulaire :
   - **Email** : `admin@admin.com`
   - **Password** : `admin123`
   - **Auto Confirm User** : ✅ **Cochez cette case** (très important !)
3. Cliquez sur **"Create user"** ou **"Invite"**

### Étape 3 : Créer test@test.com via le Dashboard

1. Répétez le même processus :
   - **Email** : `test@test.com`
   - **Password** : `test123`
   - **Auto Confirm User** : ✅ **Cochez cette case**
2. Cliquez sur **"Create user"**

### Étape 4 : Vérifier que les comptes sont créés

1. Restez dans **Authentication → Users**
2. Vous devriez voir deux utilisateurs avec :
   - **Email** : `admin@admin.com` - **Status** : ✅ Confirmed
   - **Email** : `test@test.com` - **Status** : ✅ Confirmed

---

## 🧪 Tester la connexion

Une fois les comptes créés via le Dashboard :

1. Retournez sur votre app : `http://localhost:5174`
2. Rafraîchissez la page (`Cmd+Shift+R`)
3. Cliquez sur **🧪** (DevPanel)
4. Cliquez sur **"👨‍💻 Login as Admin"**
5. ✨ **La connexion devrait fonctionner instantanément !**

---

## 📝 Pourquoi ça ne fonctionnait pas avant ?

Créer des utilisateurs directement dans `auth.users` avec SQL **ne crée pas toutes les métadonnées nécessaires** que Supabase Auth attend. Le Dashboard (ou l'API `auth.admin.createUser()`) crée correctement :
- Les hashs de mot de passe au bon format
- Les métadonnées `raw_app_meta_data` et `raw_user_meta_data`
- Les index et références internes
- Les triggers et validations nécessaires

---

## ❓ Alternative : Créer via l'API (pour automatisation)

Si vous voulez scripter la création des comptes, utilisez l'API Supabase plutôt que SQL :

```typescript
// Dans un script Node.js avec @supabase/supabase-js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-service-role-key' // Attention : SERVICE_ROLE key, pas ANON key !
);

// Créer admin@admin.com
await supabase.auth.admin.createUser({
  email: 'admin@admin.com',
  password: 'admin123',
  email_confirm: true, // Auto-confirmer l'email
  user_metadata: { pseudo: '👨‍💻 Admin Dev' }
});

// Créer test@test.com
await supabase.auth.admin.createUser({
  email: 'test@test.com',
  password: 'test123',
  email_confirm: true,
  user_metadata: { pseudo: '🧪 Test User' }
});
```

---

**✨ Suivez les étapes ci-dessus pour créer les comptes correctement !**
