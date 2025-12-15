# 📊 Installation de l'extension Rapport Simple

## ✅ Extension mise à jour avec génération automatique de rapport!

---

## 🚀 Installation dans Chrome

### **Étape 1: Ouvrir les extensions Chrome**
```
chrome://extensions
```

### **Étape 2: Activer le mode développeur**
- Cliquez sur le bouton **"Mode développeur"** (en haut à droite)

### **Étape 3: Charger l'extension**
- Cliquez sur **"Charger l'extension non empaquetée"**
- Sélectionnez le dossier: `/Users/xunit/Desktop/tester/rapport_simple/extension`

### **Étape 4: Vérifier l'installation**
✅ Vous devriez voir: **"Overwatch v7 - PRODUCTION"**

---

## 📖 Utilisation

### **IMPORTANT: Le serveur doit tourner!**

Avant d'utiliser l'extension, assurez-vous que le serveur est démarré:

```bash
cd /Users/xunit/Desktop/tester/rapport_simple
npm start
```

Le serveur doit tourner sur **http://localhost:3001**

---

## 🎯 Générer un rapport automatiquement

### **Étape 1: Aller sur une page Inverite**
Exemple: `https://www.inverite.com/merchant/request/view/789EE68C-EE40-43A4-89CF-4CBF707D4AE3`

### **Étape 2: Deux boutons apparaissent**

**🟢 Bouton VERT (en haut):**
```
📊 RAPPORT SIMPLE
```
→ **CLÉ: Génère le rapport simplifié automatiquement!**

**🔵 Bouton BLEU (en dessous):**
```
[*] OVERWATCH
```
→ Ancienne fonction (envoie au dashboard FricTrak)

### **Étape 3: Cliquer sur "📊 RAPPORT SIMPLE"**

L'extension va:
1. ✅ Extraire le GUID de l'URL
2. ✅ Appeler l'API Inverite avec la clé API
3. ✅ Récupérer le JSON complet
4. ✅ Envoyer le JSON au serveur localhost:3001
5. ✅ Générer le rapport
6. ✅ **Ouvrir le rapport dans un nouvel onglet automatiquement!**

### **Étape 4: Le rapport s'ouvre!**

Un nouvel onglet s'ouvre avec le **rapport simplifié** complet:
- Identité du client
- Comptes bancaires (tous les comptes)
- Revenus (4 dernières paies avec compte)
- Dépenses (TOP 5 avec compte)
- Gambling
- NSF
- Prêteurs (avec boutons d'exclusion)

---

## 🎰 Logs en temps réel

Un terminal vert apparaît en bas à droite avec les logs:

```
[*] Mode INVERITE active
[>] GUID: 789EE68C...
[+] Bouton RAPPORT SIMPLE injecté
[*] Récupération JSON depuis Inverite API...
[+] JSON reçu (416351 bytes)
[*] Génération du rapport...
[+] Rapport généré!
[+] Rapport ouvert dans nouvel onglet
```

---

## ⚙️ Configuration

### **Clé API Inverite:**
Déjà configurée dans `extension/config.js`:
```javascript
INVERITE_API_KEY: '09a4b8554857d353fd007d29feca423f446'
```

### **Serveur rapport:**
```javascript
RAPPORT_SERVER: 'http://localhost:3001'
```

---

## 🔧 Troubleshooting

### **Problème: "Erreur generation rapport"**
→ Vérifiez que le serveur tourne sur localhost:3001

### **Problème: "Erreur API Inverite: 401"**
→ La clé API est invalide ou expirée

### **Problème: Le bouton n'apparaît pas**
→ Vérifiez que vous êtes bien sur une page `inverite.com/merchant/request/view/GUID`

---

## 📦 Fichier ZIP

Un fichier `extension.zip` (11 KB) est disponible pour faciliter le partage.

---

## 🎉 Avantages

✅ **1 clic** = Rapport complet généré
✅ **Pas besoin de télécharger** le JSON manuellement
✅ **Pas besoin d'aller sur localhost:3001** pour upload
✅ **Automatique** - L'extension fait tout!
✅ **Exclusions appliquées** - Les fausses détections sont déjà filtrées

---

## 🔄 Mise à jour de l'extension

Si vous avez déjà installé l'ancienne version:

1. Allez sur `chrome://extensions`
2. Trouvez **"Overwatch v7 - PRODUCTION"**
3. Cliquez sur l'icône **🔄 Recharger**

Ou supprimez et réinstallez en suivant les étapes ci-dessus.
