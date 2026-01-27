# Migration vers les nouvelles clés API Supabase

**Date:** 2026-01-27

## Résumé

Supabase a migré vers un nouveau système de clés API. Les anciennes clés `anon` et `service_role` sont maintenant **deprecated** et remplacées par le nouveau système de **publishable keys**.

## Changements effectués

### 1. Code source

- ✅ `src/lib/supabase.ts` - Mise à jour pour utiliser `VITE_SUPABASE_PUBLIC_KEY`
- ✅ `src/vite-env.d.ts` - Types TypeScript mis à jour

### 2. Documentation

Tous les fichiers suivants ont été mis à jour:

- ✅ `ENV_VARIABLES.md`
- ✅ `README.md`
- ✅ `DEPLOYMENT.md`
- ✅ `docs/setup-guide.md`
- ✅ `docs/deployment-guide.md`
- ✅ `docs/development-guide.md`
- ✅ `docs/index.md`
- ✅ `docs/project-overview.md`
- ✅ `docs/api-contracts.md`
- ✅ `docs/source-tree-analysis.md`
- ✅ `_bmad-output/planning-artifacts/architecture.md`
- ✅ `_bmad-output/implementation-artifacts/2-1-email-otp-authentication-flow.md`

## Migration pour les développeurs

### Ancienne configuration (deprecated)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Nouvelle configuration (actuelle)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLIC_KEY=sb_publishable_xxx
```

## Obtenir votre publishable key

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. **Project Settings** → **API**
4. Section **Publishable key** (format `sb_publishable_xxx`)
5. Si vous n'avez pas encore de publishable key, cliquez sur **Create new API Keys**

## Période de transition

Supabase supporte actuellement les deux systèmes pendant la période de transition:

- ✅ Anciennes clés `anon` / `service_role` (fonctionnent encore)
- ✅ Nouvelles clés publishable `sb_publishable_xxx` (recommandé)

## Actions requises

### Pour le développement local

1. Mettez à jour votre fichier `.env.local`:

```bash
# Supprimez l'ancienne ligne
# VITE_SUPABASE_ANON_KEY=...

# Ajoutez la nouvelle ligne
VITE_SUPABASE_PUBLIC_KEY=sb_publishable_xxx
```

2. Redémarrez votre serveur de développement:

```bash
npm run dev
```

### Pour Vercel (Production)

1. Allez dans **Settings → Environment Variables**
2. Supprimez ou désactivez `VITE_SUPABASE_ANON_KEY`
3. Ajoutez `VITE_SUPABASE_PUBLIC_KEY` avec votre nouvelle clé
4. Redéployez votre application

## Avantages du nouveau système

- 🔐 **Sécurité améliorée**: Les publishable keys peuvent être révoquées/rotées indépendamment
- 📊 **Meilleure traçabilité**: Suivi des appels par clé
- 🚀 **Expérience développeur**: Workflow simplifié pour les clés

## Références

- [Documentation officielle Supabase sur les API keys](https://supabase.com/docs/guides/api/creating-routes)
- [Annonce du changement (Realtime > Presence)](https://supabase.com/docs/guides/realtime/presence)

## Support

Si vous rencontrez des problèmes:

1. Vérifiez que votre publishable key est au bon format (`sb_publishable_xxx`)
2. Assurez-vous que les variables d'environnement sont correctement chargées
3. Redémarrez votre serveur de développement après modification de `.env.local`
4. En cas de problème, contactez le support Supabase ou consultez la documentation

---

**Note**: Les anciennes clés `anon` fonctionnent encore pendant la période de transition, mais il est recommandé de migrer vers les publishable keys dès que possible.
