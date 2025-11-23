# Guide de déploiement Vercel

## Étape 1 : Push vers GitHub

Si vous n'avez pas encore push le code vers GitHub, vous devez configurer l'authentification :

```bash
# Option A : Utiliser SSH (recommandé)
git remote set-url origin git@github.com:floppyflax/beer-pong-league.git
git push -u origin main

# Option B : Utiliser HTTPS avec token
# 1. Créer un Personal Access Token sur GitHub (Settings > Developer settings > Personal access tokens)
# 2. Utiliser le token comme mot de passe lors du push
git push -u origin main
```

## Étape 2 : Connecter à Vercel

### Via Dashboard Vercel (Recommandé)

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous
2. Cliquez sur **"Add New Project"**
3. Sélectionnez **"Import Git Repository"**
4. Choisissez **"floppyflax/beer-pong-league"**
5. Configurez le projet :
   - **Framework Preset** : Vite
   - **Root Directory** : `./`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
   - **Install Command** : `npm install`

### Variables d'environnement

Ajoutez ces variables dans les settings du projet Vercel :

- `VITE_SUPABASE_URL` : URL de votre projet Supabase
- `VITE_SUPABASE_ANON_KEY` : Clé anonyme de votre projet Supabase

### Déploiement automatique

Une fois connecté, Vercel déploiera automatiquement :
- ✅ À chaque push sur `main` → Production
- ✅ À chaque PR → Preview deployment

## Étape 3 : Vérifier le déploiement

1. Vercel vous donnera une URL (ex: `beer-pong-league.vercel.app`)
2. Testez l'application
3. Vérifiez que les variables d'environnement sont bien configurées

## Commandes utiles

```bash
# Voir les logs de déploiement
vercel logs

# Voir les déploiements
vercel list

# Ouvrir le dashboard
vercel dashboard
```

