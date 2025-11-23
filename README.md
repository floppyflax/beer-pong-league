# 🍺 Beer Pong League

Application de gestion de tournois et ligues de beer pong avec système ELO.

## 🚀 Déploiement sur Vercel

### Option 1 : Via Vercel Dashboard (Recommandé)

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "Add New Project"
3. Importez le repo GitHub `floppyflax/beer-pong-league`
4. Configurez les variables d'environnement :
   - `VITE_SUPABASE_URL` : URL de votre projet Supabase
   - `VITE_SUPABASE_ANON_KEY` : Clé anonyme de votre projet Supabase
5. Cliquez sur "Deploy"

### Option 2 : Via Vercel CLI

```bash
# Installer Vercel CLI (si pas déjà installé)
npm i -g vercel

# Se connecter à Vercel
vercel login

# Déployer
vercel

# Pour lier à un projet existant
vercel link

# Pour déployer en production
vercel --prod
```

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Build

```bash
npm install
npm run build
```

## 📦 Technologies

- **React** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Supabase** - Backend (Auth + Database)
- **React Router** - Routing
- **Vercel** - Hosting

## 🎯 Fonctionnalités

- ✅ Gestion de ligues et tournois
- ✅ Système ELO pour le classement
- ✅ Authentification (email + OTP)
- ✅ Profils utilisateurs (authentifié ou anonyme)
- ✅ Display View pour projection live
- ✅ Synchronisation Supabase (avec fallback localStorage)

## 📝 Notes

- L'application fonctionne en mode offline-first avec localStorage comme fallback
- Les données sont synchronisées avec Supabase quand disponible
- Migration automatique des données localStorage vers Supabase
