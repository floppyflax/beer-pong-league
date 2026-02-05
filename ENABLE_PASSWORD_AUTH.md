# 🔐 Activer l'authentification par mot de passe dans Supabase

## 🎯 Problème

L'erreur **"Database error querying schema"** apparaît lors de la connexion avec les comptes de test (`admin@admin.com`, `test@test.com`) parce que l'authentification par mot de passe n'est pas activée dans Supabase.

## ✅ Solution : Activer Password Auth dans Supabase Dashboard

### Étape 1 : Ouvrir les paramètres d'authentification

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet **beer-pong-league**
3. Dans le menu de gauche, cliquez sur **Authentication** (icône 🔑)
4. Cliquez sur **Providers** dans le sous-menu

### Étape 2 : Activer "Email" avec mot de passe

1. Dans la liste des providers, trouvez **"Email"**
2. Cliquez dessus pour ouvrir les paramètres
3. **Activez l'option "Enable Email provider"** si elle ne l'est pas déjà
4. **Activez l'option "Enable Email Signup"**
5. **IMPORTANT** : Activez l'option **"Enable Email + Password"** ou **"Confirm email"**
   - Cette option permet l'authentification avec email + mot de passe
   - Si vous voyez "Confirm email", assurez-vous qu'elle est **désactivée** pour le développement

### Étape 3 : Sauvegarder

1. Cliquez sur **"Save"** en bas de la page
2. Attendez quelques secondes que les changements soient appliqués

### Étape 4 : Tester

1. Rechargez votre application : `http://localhost:5174`
2. Cliquez sur **"CRÉER TOURNOI / LIGUE"**
3. Entrez `admin@admin.com`
4. Cliquez sur **"Se connecter"**
5. ✨ **La connexion devrait maintenant fonctionner !**

---

## 🔍 Vérification

Si vous voulez vérifier que Password Auth est bien activé, voici ce que vous devriez voir dans le dashboard :

```
Authentication > Providers > Email
  ✅ Enable Email provider: ON
  ✅ Enable Email Signup: ON
  ✅ Confirm email: OFF (pour dev)
```

---

## 🚀 Après activation

Une fois activé, les comptes de test fonctionneront en mode développement :

- **Email** : `admin@admin.com` | **Mot de passe** : `admin123`
- **Email** : `test@test.com` | **Mot de passe** : `test123`

Ces comptes permettent une **connexion instantanée** sans avoir à vérifier les emails.

---

## 💡 Alternative si vous ne voulez pas activer Password Auth

Si vous préférez ne pas activer l'authentification par mot de passe pour des raisons de sécurité en production, vous pouvez :

1. **Utiliser l'OTP normal** : Les comptes de test recevront des emails de magic link comme les autres utilisateurs
2. **Vérifier vos emails** : Supabase envoie les magic links à l'adresse configurée
3. **Utiliser un service de mail de test** : Configurez un service comme [Mailtrap](https://mailtrap.io/) pour intercepter les emails en dev

---

## ❓ Questions fréquentes

### Q : Est-ce sécurisé d'activer Password Auth ?
**R** : Oui, tant que vous utilisez des mots de passe forts. Les comptes de test (`admin123`, `test123`) sont faibles, mais c'est acceptable en développement uniquement.

### Q : Puis-je désactiver Password Auth en production ?
**R** : Oui ! Vous pouvez activer/désactiver cette option à tout moment. En production, vous pouvez forcer uniquement l'OTP si vous préférez.

### Q : Les utilisateurs réels pourront-ils utiliser des mots de passe ?
**R** : Oui, si Password Auth est activé. Mais vous pouvez contrôler cela avec votre interface : n'affichez que l'option OTP pour les utilisateurs normaux.

---

## 📝 Notes techniques

- L'authentification par mot de passe utilise bcrypt pour hasher les mots de passe
- Les comptes de test ont été créés avec `crypt('admin123', gen_salt('bf'))` dans SQL
- Le code JavaScript utilise `supabase.auth.signInWithPassword()` pour la connexion
- Cette méthode nécessite que le provider "Email + Password" soit activé côté serveur

---

**✨ Une fois activé, rechargez votre app et testez la connexion avec `admin@admin.com` !**
