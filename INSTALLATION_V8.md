# 📦 Installation de l'extension Overwatch Rapport Simple v8.0.0

## ✅ Problème résolu
Le problème de "clé privée déjà associée" a été résolu en créant une nouvelle version propre de l'extension.

## 🚀 Instructions d'installation

### Étape 1: Supprimer l'ancienne extension (si présente)

1. Ouvre Chrome et va sur `chrome://extensions/`
2. Trouve l'ancienne extension "Overwatch v7" ou similaire
3. Clique sur **"Supprimer"** pour la désinstaller complètement

### Étape 2: Charger la nouvelle extension

1. Assure-toi que le **Mode développeur** est activé (en haut à droite)
2. Clique sur **"Charger l'extension non empaquetée"**
3. Sélectionne le dossier:
   ```
   /Users/xunit/Desktop/tester/rapport_simple/extension_v2/
   ```
4. L'extension "Overwatch Rapport Simple v8.0.0" sera chargée

### Étape 3: Vérifier l'installation

✅ Tu devrais voir:
- **Nom**: Overwatch Rapport Simple
- **Version**: 8.0.0
- **Description**: Extension Inverite/Margill/Flinks - Generation de rapports simples
- **Statut**: Activée

## 🎯 Changements dans cette version

### Nettoyage complet:
- ❌ Suppression de toutes les fonctionnalités Pedro
- ❌ Suppression du fichier .pem problématique
- ❌ Suppression des fichiers inutiles (.env.local, .vercel, etc.)
- ✅ Terminal simplifié et optimisé
- ✅ Permissions mises à jour (ajout de localhost:3001)

### Fonctionnalités disponibles:

1. **Mode Margill**: Extraction complète des données Margill + Inverite
2. **Mode Inverite**: Génération de rapport simple depuis la page Inverite
3. **Mode Flinks**: Capture des données Flinks

## 🔧 Configuration

L'extension est configurée pour se connecter à:
- **Serveur de rapport**: `http://localhost:3001`
- **API Inverite**: Via le proxy du serveur

Assure-toi que le serveur est démarré:
```bash
cd /Users/xunit/Desktop/tester/rapport_simple
npx ts-node server.ts
```

## 📝 Sites supportés

L'extension s'active automatiquement sur:
- ✅ `https://dashboard.flinks.com/*`
- ✅ `*.inverite.com/*`
- ✅ `*.margill.com/*`

## 🐛 Dépannage

### Si l'extension ne se charge pas:
1. Vérifie que tu as bien sélectionné le dossier `extension_v2/`
2. Vérifie les logs dans la console Chrome (`chrome://extensions/` > Détails > Erreurs)
3. Redémarre Chrome complètement

### Si l'erreur de clé privée persiste:
1. Supprime complètement toutes les anciennes versions
2. Redémarre Chrome
3. Réessaye de charger `extension_v2/`

## 📦 Fichiers disponibles

- **Dossier**: `extension_v2/` (à charger dans Chrome)
- **Archive ZIP**: `overwatch_rapport_simple_v8.zip` (pour backup)
- **Script de test**: `test_api.sh` (pour tester l'API)

## ✨ Prêt à utiliser!

Une fois installée, visite n'importe quelle page Inverite, Margill ou Flinks et tu verras apparaître le terminal Overwatch et les boutons d'action!
