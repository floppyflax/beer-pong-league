# Instructions pour push vers GitHub

## Option 1 : Utiliser GitHub CLI (le plus simple)

Si vous avez GitHub CLI installé :

```bash
gh auth login
gh repo set-default floppyflax/beer-pong-league
git push -u origin main
```

## Option 2 : Utiliser un Personal Access Token

### Étape 1 : Créer un token GitHub

1. Allez sur GitHub.com
2. Cliquez sur votre avatar (en haut à droite)
3. **Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**
4. Cliquez sur **Generate new token** > **Generate new token (classic)**
5. Donnez un nom : `beer-pong-league`
6. Sélectionnez les permissions :
   - ✅ `repo` (toutes les permissions)
7. Cliquez sur **Generate token**
8. **COPIEZ LE TOKEN** (vous ne pourrez plus le voir après)

### Étape 2 : Utiliser le token pour push

```bash
git push -u origin main
```

Quand Git vous demande :
- **Username** : `floppyflax`
- **Password** : Collez votre **Personal Access Token** (pas votre mot de passe GitHub)

## Option 3 : Configurer Git Credential Helper (pour éviter de retaper)

Après avoir fait un push réussi avec le token, configurez le credential helper :

```bash
# macOS
git config --global credential.helper osxkeychain

# Puis faites un push (il vous demandera une fois, puis sauvegardera)
git push -u origin main
```

## Vérification

Après le push, vérifiez sur GitHub :
- https://github.com/floppyflax/beer-pong-league

Vous devriez voir tous vos fichiers.

## Connecter à Vercel

Une fois le code sur GitHub :

1. Allez sur votre projet Vercel
2. **Settings** > **Git**
3. Si pas déjà connecté, cliquez sur **Connect Git Repository**
4. Sélectionnez `floppyflax/beer-pong-league`
5. Vercel va automatiquement détecter les changements et déployer

