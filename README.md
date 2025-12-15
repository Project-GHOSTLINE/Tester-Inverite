# 📊 Rapport Simple Inverite

Module simple pour générer des rapports d'analyse à partir de fichiers JSON Inverite.

## 🚀 Installation

```bash
cd rapport_simple
npm install
```

## ▶️ Démarrage

```bash
npm start
```

Le serveur démarre sur **http://localhost:3001**

## 📖 Utilisation

1. Ouvrez votre navigateur à l'adresse `http://localhost:3001`
2. Cliquez sur la zone d'upload ou glissez-déposez votre fichier JSON Inverite
3. Cliquez sur "Soumettre et générer le rapport"
4. Le rapport s'affiche dans une nouvelle fenêtre

## 📋 Sections du rapport

Le rapport généré contient 7 sections principales:

1. **Identité du client** - Nom, ID, statut, date de vérification
2. **Comptes bancaires** - Détails de tous les comptes (multi-comptes supporté)
3. **Revenus de l'employeur** - Paies, employeur, montants
4. **Dépenses** - Essentielles et non-essentielles
5. **Gambling** - Détection des transactions de jeux
6. **NSF** - Fonds insuffisants
7. **Prêteurs actifs** - Détection des prêteurs à haut coût

## ✨ Fonctionnalités

- ✅ Interface simple et épurée (fond blanc)
- ✅ Upload par clic ou drag & drop
- ✅ Analyse de TOUS les comptes bancaires du client
- ✅ Rapport avec séparateurs de sections
- ✅ Alertes visuelles (rouge/vert) pour les métriques critiques
- ✅ Support multi-comptes
- ✅ Période d'analyse: 30 et 90 jours

## 🛠️ Technologies

- TypeScript
- Express.js
- Multer (upload de fichiers)
- HTML/CSS pur (pas de framework)
