# Guide de Déploiement Izy-scoly sur Hébergeur Classique (cPanel)

## Prérequis
- Un compte hébergeur avec accès cPanel (OVH, Safaricloud, Untodo, TPCloud, etc.)
- Accès FTP ou au Gestionnaire de Fichiers cPanel
- Un projet Supabase configuré (optionnel si vous gardez le backend actuel)

## Étape 1: Générer le Build de Production

Dans Lovable, le build est généré automatiquement. Pour l'exporter:

1. Connectez votre repo GitHub dans Lovable → Settings → GitHub
2. Clonez le repo sur votre machine
3. Exécutez:
   ```bash
   npm install
   npm run build
   ```
4. Le dossier `dist/` contient tous les fichiers prêts à déployer

## Étape 2: Téléverser sur cPanel

### Via le Gestionnaire de Fichiers:
1. Connectez-vous à cPanel
2. Ouvrez "Gestionnaire de Fichiers"
3. Naviguez vers `public_html/` (ou le sous-dossier de votre domaine)
4. Téléversez TOUT le contenu du dossier `dist/`
5. Vérifiez que `.htaccess` est présent (fichiers cachés activés)

### Via FTP (FileZilla):
1. Connectez-vous à votre serveur FTP
2. Naviguez vers le répertoire racine web
3. Uploadez le contenu de `dist/`

## Étape 3: Vérifier la Configuration

### Fichier .htaccess
Le fichier `.htaccess` fourni gère:
- ✅ Réécriture SPA (toutes les routes → index.html)
- ✅ Redirection HTTP → HTTPS
- ✅ Compression GZIP
- ✅ Headers de sécurité
- ✅ Cache des assets

Si les routes ne fonctionnent pas, vérifiez que `mod_rewrite` est activé.

### Variables d'Environnement
Les variables Supabase sont intégrées au build. Pour changer de backend:
1. Modifiez `public/env-config.js` AVANT le build
2. Ou reconfigurez `.env` et régénérez le build

## Étape 4: Configurer le Domaine

1. Pointez votre domaine vers l'hébergeur (DNS A record)
2. Attendez la propagation DNS (jusqu'à 48h)
3. Activez SSL/HTTPS dans cPanel → "Let's Encrypt" ou "SSL/TLS"

## Migration vers Backend Externe (Optionnel)

Si vous souhaitez utiliser votre propre projet Supabase:

### 1. Créer un Projet Supabase
- Allez sur https://supabase.com
- Créez un nouveau projet
- Notez l'URL et la clé Anon

### 2. Exécuter les Migrations
Dans le SQL Editor de Supabase, exécutez les fichiers du dossier `supabase/migrations/` dans l'ordre chronologique.

### 3. Configurer les Secrets Edge Functions
Dans Supabase Dashboard → Edge Functions → Settings, ajoutez:
- `RESEND_API_KEY` (pour les emails)
- `KKIAPAY_PUBLIC_KEY`, `KKIAPAY_PRIVATE_KEY`, `KKIAPAY_SECRET` (paiements)
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (notifications push)
- `BOOTSTRAP_ADMIN_TOKEN` (configuration initiale)

### 4. Déployer les Edge Functions
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase functions deploy
```

### 5. Mettre à Jour le Frontend
Modifiez les variables dans `.env`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

Puis régénérez le build.

## Dépannage

### Les routes retournent 404
- Vérifiez que `.htaccess` est présent
- Activez `mod_rewrite` dans Apache

### L'authentification ne fonctionne pas
- Vérifiez les clés Supabase
- Ajoutez votre domaine dans Supabase → Auth → URL Configuration

### Les images ne s'affichent pas
- Vérifiez les permissions des fichiers (644)
- Vérifiez les permissions des dossiers (755)

## Support
Pour toute question, contactez l'équipe technique Izy-scoly.

---
© 2025 Izy-scoly - Tous droits réservés
