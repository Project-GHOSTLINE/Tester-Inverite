# ⚠️ FORCER LE RECHARGEMENT DE L'EXTENSION CHROME

Chrome garde l'ancienne extension en cache même après "rafraîchir"!

---

## 🔧 SOLUTION GARANTIE (2 MINUTES)

### ÉTAPE 1: SUPPRIMER COMPLÈTEMENT
```
1. Aller: chrome://extensions/

2. Trouver TOUTES les extensions "Inverite" ou "Rapport"

3. Pour CHAQUE extension trouvée:
   → Cliquer "Supprimer" (pas désactiver!)
   → Confirmer la suppression

4. FERMER complètement Chrome
   → Cmd+Q (Mac) ou Alt+F4 (Windows)
   → Attendre 5 secondes
```

---

### ÉTAPE 2: ROUVRIR CHROME ET INSTALLER

```
1. Ouvrir Chrome

2. Aller: chrome://extensions/

3. Activer "Mode développeur" (toggle en haut à droite)

4. Cliquer "Charger l'extension non empaquetée"

5. Naviguer vers:
   /Users/xunit/Desktop/tester/rapport_simple/extension

6. Sélectionner ce DOSSIER (pas un fichier!)

7. Cliquer "Sélectionner"
```

---

### ÉTAPE 3: VÉRIFIER L'INSTALLATION

Dans chrome://extensions/, tu DOIS voir:

```
┌─────────────────────────────────────────────────────┐
│ Inverite Rapport Simple                             │
│ Version: 9.1.3                                      │
│ Extension Inverite - 7 preteurs en accordeons       │
│                                                     │
│ ID: [un ID généré par Chrome]                      │
│ État: Activée                                       │
└─────────────────────────────────────────────────────┘
```

**Si la version N'EST PAS 9.1.3, recommencer!**

---

### ÉTAPE 4: VIDER LE CACHE DU SITE

```
1. Aller sur: inverite.com

2. Ouvrir DevTools: F12

3. Clic droit sur le bouton "Rafraîchir" (à côté de l'URL)

4. Choisir: "Vider le cache et actualiser de force"

5. Fermer DevTools
```

---

### ÉTAPE 5: GÉNÉRER UN NOUVEAU RAPPORT

**NE PAS ouvrir un ancien rapport!**

```
1. Sur inverite.com, aller sur:
   https://www.inverite.com/view/669043AB-6AB6-4D5A-9B2C-16FD5ADDEA5E

2. Tu dois voir le bouton vert: "📊 RAPPORT SIMPLE"

3. Cliquer dessus

4. Un NOUVEL onglet s'ouvre avec une NOUVELLE URL

5. L'URL DOIT contenir: rapportsimple-3srta0csx
   (ou rapportsimple-rb16qzhec si Vercel a redéployé)
```

---

### ÉTAPE 6: VÉRIFIER LE RÉSULTAT

Dans le NOUVEAU rapport:

**Mode Regroup activé (bouton en haut):**

Tu dois voir **7 cartes séparées** (pas 1 carte "Prêteur 46"):

```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ MDG     │ │Alterfina│ │Scotiabank│ │Neo Cap  │
│ Finance │ │         │ │ Auto    │ │         │
│ 22      │ │ 32      │ │ 12      │ │ 11      │
└─────────┘ └─────────┘ └─────────┘ └─────────┘

┌─────────┐ ┌─────────┐ ┌─────────┐
│ Gestion │ │Term Loan│ │Simplecr │
│ 5       │ │ 12      │ │ 3       │
└─────────┘ └─────────┘ └─────────┘
```

**En scrollant vers le bas:**

Tu dois voir:
```
🏦 DÉTAILS PAR PRÊTEUR (7 prêteurs distincts)

▼ 🏢 MDG Finance (22 transactions)
  💸 22 paiements: -1,798$ | 💰 3 reçus: +3,450$
  [Cliquer pour dérouler]

▼ 🏢 Alterfina (32 transactions)
  💸 30 paiements: -4,300$ | 💰 2 reçus: +1,850$
  [Cliquer pour dérouler]

... (5 autres accordéons)
```

---

## ⚠️ SI ÇA NE MARCHE TOUJOURS PAS

### Debug niveau 1: Vérifier l'URL
```
L'URL du nouveau rapport DOIT commencer par:
https://rapportsimple-3srta0csx-project-ghostline.vercel.app/rapport/...

Si elle commence par:
https://rapportsimple-4d1oxkutk-project-ghostline.vercel.app/rapport/...
= Tu utilises l'ancienne extension!
```

### Debug niveau 2: Console du rapport
```
1. Sur le nouveau rapport, ouvrir: F12

2. Aller dans l'onglet "Console"

3. Chercher:
   [PRETEURS] Détection avec 645 noms de prêteurs
   [PRETEURS] 7 prêteurs distincts détectés

4. Si tu vois ça = Le code fonctionne!
   Si tu ne vois pas ça = Ancien code encore actif
```

### Debug niveau 3: Forcer le rechargement
```
1. Dans Chrome, fermer TOUS les onglets inverite.com

2. Aller: chrome://extensions/

3. Sur l'extension "Inverite Rapport Simple":
   → Cliquer l'icône "⟳" (Recharger l'extension)

4. Attendre 5 secondes

5. Retourner sur inverite.com et régénérer
```

---

## 📋 CHECKLIST FINALE

- [ ] Extension v9.0/9.1.2 supprimée
- [ ] Chrome fermé complètement (Cmd+Q)
- [ ] Chrome rouvert
- [ ] Extension rechargée depuis le dossier /extension
- [ ] Version affichée: 9.1.3
- [ ] Cache inverite.com vidé
- [ ] NOUVEAU rapport généré (pas l'ancien ouvert!)
- [ ] URL contient: rapportsimple-3srta0csx
- [ ] 7 cartes de prêteurs visibles (pas 1 carte "Prêteur 46")
- [ ] Accordéons "🏦 DÉTAILS PAR PRÊTEUR" visibles

---

## 🚨 IMPORTANT

**NE PAS:**
- ❌ Ouvrir l'ancien rapport (URL avec 4d1oxkutk ou autre ancien ID)
- ❌ Juste "rafraîchir" l'extension (pas assez!)
- ❌ Garder plusieurs versions de l'extension installées

**FAIRE:**
- ✅ Supprimer complètement l'ancienne
- ✅ Fermer Chrome
- ✅ Réinstaller depuis le dossier
- ✅ Vérifier version 9.1.3
- ✅ Générer NOUVEAU rapport
- ✅ Vérifier URL (doit être nouvelle)

---

**Si tu fais exactement ça, ça VA marcher. Promis.** 🎯
