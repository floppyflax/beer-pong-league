# Configuration des Redirect URLs Supabase

## URLs à configurer dans Supabase

Pour que le lien magique fonctionne correctement en production (Vercel) et en développement (local), vous devez configurer les Redirect URLs dans Supabase.

### Étapes de configuration

1. Allez sur votre projet Supabase : https://supabase.com/dashboard/project/zsazjkhhqtmyvjsumgcq
2. **Authentication** → **URL Configuration**
3. Dans **Redirect URLs**, ajoutez :

#### Pour le développement local :

```
http://localhost:5173/auth/callback
http://localhost:5173/**
```

#### Pour la production Vercel :

```
https://beer-pong-competition.vercel.app/auth/callback
https://beer-pong-league-floppyflaxs-projects.vercel.app/auth/callback
https://beer-pong-league-git-main-floppyflaxs-projects.vercel.app/auth/callback
```

**Note** : Pour accepter toutes les preview deployments Vercel, vous pouvez utiliser :

```
https://*.vercel.app/auth/callback
```

Cela permettra aux preview deployments (PR, branches) de fonctionner aussi.

#### Site URL (optionnel mais recommandé)

- **Development** : `http://localhost:5173`
- **Production** : `https://beer-pong-competition.vercel.app` (ou votre domaine principal)

### Comment ça fonctionne

Le code utilise automatiquement `window.location.origin` pour construire l'URL de redirection :

```typescript
emailRedirectTo: `${window.location.origin}/auth/callback`;
```

Cela signifie que :

- En local : `http://localhost:5173/auth/callback`
- Sur Vercel : `https://votre-domaine.vercel.app/auth/callback`

**Important** : L'URL doit être dans la liste des Redirect URLs autorisées dans Supabase, sinon la redirection sera bloquée.

### Vérification

Pour vérifier que c'est bien configuré :

1. Testez en local : envoyez un magic link et vérifiez qu'il redirige vers `http://localhost:5173/auth/callback`
2. Testez sur Vercel : envoyez un magic link et vérifiez qu'il redirige vers votre URL Vercel

### Troubleshooting

Si le lien magique ne redirige pas correctement :

1. Vérifiez que l'URL est bien dans la liste des Redirect URLs
2. Vérifiez que l'URL ne contient pas de trailing slash (sauf si configuré)
3. Vérifiez les logs Supabase pour voir les erreurs de redirection
