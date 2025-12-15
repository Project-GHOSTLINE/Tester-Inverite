# Déploiement Vercel - Configuration

## ✅ Déploiement effectué

Votre application a été déployée avec succès sur Vercel :

- **URL Production:** https://rapportsimple-cfvkbcpb5-project-ghostline.vercel.app
- **GitHub Repository:** https://github.com/Project-GHOSTLINE/Tester-Inverite
- **Vercel Dashboard:** https://vercel.com/project-ghostline/rapport_simple

## ⚠️ Protection d'authentification active

L'application est actuellement protégée par l'authentification Vercel (Deployment Protection). Cela empêche l'accès public aux endpoints de l'API.

### Désactiver la protection (requis pour l'extension Chrome)

Pour permettre à votre extension Chrome d'accéder à l'API, suivez ces étapes :

1. **Aller sur le dashboard Vercel**
   - Ouvrez : https://vercel.com/project-ghostline/rapport_simple

2. **Accéder aux paramètres**
   - Cliquez sur l'onglet **Settings**

3. **Désactiver Deployment Protection**
   - Dans le menu latéral, cliquez sur **Deployment Protection**
   - Sélectionnez **"Only Preview Deployments"** ou **"Off"**
   - Cliquez sur **Save**

4. **Redéployer l'application**
   - Allez dans l'onglet **Deployments**
   - Cliquez sur les trois points (...) à côté du dernier déploiement
   - Sélectionnez **Redeploy**
   - Cochez **Use existing Build Cache**
   - Cliquez sur **Redeploy**

## 🧪 Tester l'API

Une fois la protection désactivée, testez les endpoints :

```bash
# Test du endpoint health
curl https://rapportsimple-cfvkbcpb5-project-ghostline.vercel.app/health

# Test du endpoint racine
curl https://rapportsimple-cfvkbcpb5-project-ghostline.vercel.app/
```

## 🔄 Mises à jour automatiques

Chaque push sur la branche `main` déclenchera automatiquement un nouveau déploiement sur Vercel.

## 📦 Extensions Chrome mises à jour

Les deux versions de l'extension (`extension/` et `extension_v2/`) ont été mises à jour pour pointer vers l'URL Vercel :

```javascript
RAPPORT_SERVER: 'https://rapportsimple-cfvkbcpb5-project-ghostline.vercel.app'
```

## 🔧 Configuration Vercel

Le projet utilise :
- **Build Command:** `npm run vercel-build`
- **Output Directory:** `/vercel/output`
- **Node.js Version:** Défini par Vercel (dernière LTS)

## 📝 Notes importantes

- Les variables d'environnement peuvent être configurées dans Settings > Environment Variables
- Pour un domaine personnalisé, allez dans Settings > Domains
- Les logs sont disponibles dans l'onglet Deployments > cliquez sur un déploiement > View Function Logs
