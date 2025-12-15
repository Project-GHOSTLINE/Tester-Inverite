# 🧪 INSTRUCTIONS TEST v9.1.3 - ACCORDÉONS PRÊTEURS

**IMPORTANT**: Tu regardes un ANCIEN rapport! Il faut RÉGÉNÉRER un nouveau!

---

## ❌ PROBLÈME ACTUEL

Tu vois:
```
Prêteur
46
7540.14$
→ Liste de transactions qui ne sont PAS des prêteurs (Mondou, Tim Hortons, etc.)
```

**Cause**: Tu regardes un rapport généré avec l'ANCIENNE version du code!

---

## ✅ SOLUTION - ÉTAPES PRÉCISES

### 1️⃣ SUPPRIMER L'ANCIENNE EXTENSION

```
1. Aller sur: chrome://extensions/
2. Trouver "Inverite Rapport Simple" (v9.0 ou v9.1.2)
3. Cliquer "Supprimer"
```

---

### 2️⃣ INSTALLER LA NOUVELLE EXTENSION v9.1.3

**Fichier**: `extension_v9.1.3.zip` (4.5 KB)

**Méthode A - Charger dossier (RECOMMANDÉ):**
```
1. chrome://extensions/
2. Activer "Mode développeur" (en haut à droite)
3. Cliquer "Charger l'extension non empaquetée"
4. Sélectionner le dossier: /Users/xunit/Desktop/tester/rapport_simple/extension
5. L'extension apparaît avec version "9.1.3"
```

**Méthode B - Charger ZIP:**
```
1. Extraire extension_v9.1.3.zip
2. Suivre Méthode A avec le dossier extrait
```

---

### 3️⃣ VÉRIFIER LA CONFIGURATION

Dans l'extension installée, vérifier:
```
Nom: Inverite Rapport Simple
Version: 9.1.3
Description: Extension Inverite - 7 preteurs en accordeons (553 noms)
```

**URL serveur dans config.js:**
```javascript
RAPPORT_SERVER: 'https://rapportsimple-7tlenov1z-project-ghostline.vercel.app'
```

---

### 4️⃣ RÉGÉNÉRER UN NOUVEAU RAPPORT

**IMPORTANT**: Ne PAS ouvrir un ancien rapport! Générer un NOUVEAU!

```
1. Aller sur: https://www.inverite.com/view/669043AB-6AB6-4D5A-9B2C-16FD5ADDEA5E

2. Rafraîchir la page (F5)

3. Cliquer sur le bouton "📊 RAPPORT SIMPLE"

4. Un NOUVEAU rapport s'ouvre (nouvelle URL)

5. Scroller jusqu'à "SECTION 7: PRÊTEURS ACTIFS"
```

---

### 5️⃣ RÉSULTAT ATTENDU

**Tu DOIS voir 7 accordéons séparés:**

```
🏦 DÉTAILS PAR PRÊTEUR (7 prêteurs distincts):

┌────────────────────────────────────────────────────────┐
│ ▼ 🏢 MDG Finance (22 transactions)                    │
│    💸 22 paiements: -1,798$ | 💰 3 reçus: +3,450$     │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ ▼ 🏢 Alterfina (32 transactions)                      │
│    💸 30 paiements: -4,300$ | 💰 2 reçus: +1,850$     │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ ▼ 🏢 Scotiabank Auto Loan (12 transactions)           │
│    💸 12 paiements: -3,410$                            │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ ▼ 🏢 Neo Capital (11 transactions)                    │
│    💸 11 paiements: -2,305$                            │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ ▼ 🏢 Gestion (5 transactions)                         │
│    💸 4 paiements: -1,091$ | 💰 1 reçu: +500$         │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ ▼ 🏢 Simplecr (3 transactions)                        │
│    💸 3 paiements: -606$                               │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ ▼ 🏢 Term loan payment (12 transactions)              │
│    💸 12 paiements: -2,752$                            │
└────────────────────────────────────────────────────────┘
```

**Clique sur chaque accordéon pour voir les transactions détaillées!**

---

## ⚠️ SI ÇA NE MARCHE PAS

### Vérification 1: Quelle URL?

Regarder l'URL du nouveau rapport généré. Elle DOIT contenir:
```
rapportsimple-7tlenov1z
```

Si elle contient autre chose (ex: `rapportsimple-4d1oxkutk`), c'est que l'extension n'a pas été mise à jour!

### Vérification 2: Terminal de l'extension

Dans le rapport, ouvrir la console (F12) et chercher:
```
[PRETEURS] Détection avec 553 noms de prêteurs
[PRETEURS] 7 prêteurs distincts détectés
```

Si tu ne vois PAS ces messages, le nouveau code n'est pas chargé!

### Vérification 3: Source du problème

Les transactions dans ta liste incluent:
- ❌ Mondou (animalerie - PAS un prêteur!)
- ❌ INTERAC e-Transfer (transfert - PAS un prêteur!)
- ❌ Tim Hortons (resto - PAS un prêteur!)

Ces transactions NE DEVRAIENT PAS apparaître dans la section Prêteur!

**Cela signifie**: Tu regardes l'ANCIEN code ou l'ANCIEN rapport!

---

## 🎯 CHECKLIST

- [ ] Extension v9.0 supprimée
- [ ] Extension v9.1.3 installée
- [ ] Version affichée: "9.1.3"
- [ ] Inverite.com rafraîchi (F5)
- [ ] NOUVEAU rapport généré (pas l'ancien!)
- [ ] URL contient: `rapportsimple-7tlenov1z`
- [ ] Section "🏦 DÉTAILS PAR PRÊTEUR" visible
- [ ] 7 accordéons affichés

---

## 📞 DEBUG

Si ça ne marche toujours pas:

**Console logs à vérifier (F12):**
```
[INVERITE] Extension Inverite v9.1.3 initialisee
[INVERITE] GUID detecte: 669043AB...
[INVERITE] Donnees recues: 3 compte(s)
[INVERITE] Rapport genere!
```

**URL du serveur:**
```
CONFIG.RAPPORT_SERVER = https://rapportsimple-7tlenov1z-project-ghostline.vercel.app
```

**Dans les logs du serveur (visible dans Vercel):**
```
[PRETEURS] Détection avec 553 noms de prêteurs
[PRETEURS] 7 prêteurs distincts détectés
```

---

## ⚡ SI TU VEUX TESTER MAINTENANT

### Test rapide:

```bash
# 1. Vérifier la version de l'extension installée
# Dans Chrome: chrome://extensions/
# Version DOIT être: 9.1.3

# 2. Aller sur Inverite et générer NOUVEAU rapport
# 3. Regarder l'URL du rapport généré
# 4. Elle DOIT contenir: rapportsimple-7tlenov1z

# 5. Scroller jusqu'à SECTION 7
# 6. Tu DOIS voir 7 accordéons, PAS une carte "Prêteur 46"
```

---

**CONCLUSION**: Le code est PRÊT et DÉPLOYÉ. Il faut juste installer la nouvelle extension et RÉGÉNÉRER le rapport! 🚀
