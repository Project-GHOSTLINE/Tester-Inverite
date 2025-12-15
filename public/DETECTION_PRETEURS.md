# 🔍 SYSTÈME DE DÉTECTION DES PRÊTEURS

## Vue d'ensemble

Le système de détection des prêteurs analyse les transactions bancaires pour identifier les activités liées aux prêteurs d'argent. La détection se fait dans le fichier `server.ts` lors de la génération du rapport.

---

## 📋 Liste des prêteurs détectés

### Prêteurs actuellement dans le système (29 noms)

```javascript
const PRETEURS_CONNUS = [
    'zum rails',          // Plateforme de paiement pour prêteurs
    'zumrail',           // Variante
    'vopay',             // Plateforme de paiement pour prêteurs
    'money mart',        // Prêteur sur salaire
    'cash money',        // Prêteur sur salaire
    'prêt rapide',       // Prêt rapide (avec accent)
    'pret rapide',       // Prêt rapide (sans accent)
    'pret olympique',    // Prêt Olympique
    'gmf',               // GMF Finance
    'avenawise',         // Avenawise
    'gestion kronos',    // Gestion Kronos
    'gestion prp',       // Gestion PRP
    'gestion k2',        // Gestion K2
    'gestion',           // Gestion (générique)
    'credit secours',    // Crédit Secours
    'alterfina',         // Alterfina
    'mdg',               // MDG Financial
    'koho',              // Koho
    'klarna',            // Klarna
    'neo capital',       // Neo Capital
    'donovan finance',   // Donovan Finance
    'credit yamaska',    // Crédit Yamaska
    'scotiabank auto loan', // Scotiabank Auto Loan
    'freedomrepair',     // Freedom Repair
    'oxbridge',          // Oxbridge
    'credit resources',  // Credit Resources
    'easyfinancial',     // EasyFinancial
    'fairstone',         // Fairstone
    'cash store',        // Cash Store
    'money direct',      // Money Direct
    'progressive',       // Progressive
    'rifco'             // Rifco
];
```

---

## 🎯 Méthode de détection

### 1. **Recherche par mots-clés**
Le système recherche les mots-clés dans le champ `details` des transactions:

```javascript
const preteurs_transactions = transactions_90_avec_compte.filter(t => {
    // Vérifier si la transaction est exclue
    if (isExcluded(t.details, exclusions)) {
        return false;
    }

    // Recherche insensible à la casse
    const details = t.details.toLowerCase();
    return PRETEURS_CONNUS.some(p => details.includes(p));
});
```

**Caractéristiques:**
- ✅ Recherche **insensible à la casse** (majuscules/minuscules)
- ✅ Recherche par **inclusion partielle** (le mot-clé peut être n'importe où dans la description)
- ✅ Respect des **exclusions** configurées
- ⏱️ Analyse des **90 derniers jours** uniquement

---

### 2. **Séparation paiements vs prêts reçus**

#### **A) Paiements aux prêteurs** (débits)
Toutes les transactions **débitées** correspondant à un prêteur:

```javascript
const preteurs_paiements = preteurs_transactions
    .filter(t => t.debit && t.debit !== '')
    .map(t => ({
        date: t.date,
        montant: parseFloat(t.debit || '0'),
        details: t.details,
        type: 'Paiement',
        compte_numero: t.compteInfo.numero,
        // ... autres infos
    }));
```

**Exemples détectés:**
- ❌ `VOPAY 500.00$` (paiement à un prêteur)
- ❌ `EASYFINANCIAL 250.00$` (remboursement)
- ❌ `MONEY MART 150.00$` (paiement)

---

#### **B) Prêts reçus** (crédits - RESTREINT)
⚠️ **Seulement 3 plateformes** sont considérées comme prêts reçus:

```javascript
const PRETEURS_RECUS_CIBLES = ['vopay', 'zum rails', 'zumrail'];

const preteurs_recus = preteurs_transactions
    .filter(t => {
        if (!t.credit || t.credit === '') return false;
        const details = t.details.toLowerCase();
        return PRETEURS_RECUS_CIBLES.some(p => details.includes(p));
    });
```

**Exemples détectés:**
- 💰 `VOPAY 1000.00$` (prêt reçu via VoPay)
- 💰 `ZUM RAILS 500.00$` (prêt reçu via Zum Rails)

**Non détectés comme prêts reçus:**
- ⚪ `EASYFINANCIAL 1000.00$` (crédit) → Ne sera pas compté comme prêt reçu
- ⚪ `FAIRSTONE 500.00$` (crédit) → Ne sera pas compté comme prêt reçu

---

## 🚫 Système d'exclusions

### Fonctionnement
Les utilisateurs peuvent exclure certaines transactions de la détection via le fichier `exclusions.json`:

```javascript
function isExcluded(details: string, exclusions: string[]): boolean {
    const detailsLower = details.toLowerCase();
    return exclusions.some(excl => detailsLower.includes(excl.toLowerCase()));
}
```

### Exemple d'exclusions
```json
{
  "exclusions": [
    "koho interest",
    "gestion my business",
    "vopay salary"
  ]
}
```

---

## 📊 Statistiques générées

Le système calcule et affiche:

1. **Nombre total de transactions** avec des prêteurs
2. **Total des paiements** aux prêteurs (90 jours)
3. **Total des prêts reçus** (via VoPay/ZumRails uniquement)
4. **Liste détaillée** de toutes les transactions:
   - Date
   - Montant
   - Description complète
   - Compte associé
   - Type (Paiement / Prêt reçu)

---

## 🎨 Affichage dans le rapport

### Carte de résumé
```
🚨 Prêteurs actifs: 15
💸 Paiements: 3,500.00$ (12 transactions)
💰 Prêts reçus: 2,000.00$ (3 transactions)
```

### Sections détaillées
- **Section rouge** (💸): Liste des paiements aux prêteurs
- **Section orange** (💰): Liste des prêts reçus

---

## ⚠️ Prêteurs manquants

### Prêteurs dans le CSV mais PAS dans le code (exemples)

D'après le fichier `preteurs_opc_422_permis.csv`, il y a **267 compagnies** avec **548 noms**, mais seulement **29 mots-clés** sont détectés actuellement.

**Exemples de prêteurs NON détectés:**
- ❌ ICEBERG FINANCE INC. (IF XPRESS)
- ❌ AFFIRM CANADA
- ❌ FLEXITI FINANCIAL
- ❌ LENDCARE CAPITAL
- ❌ SPRING FINANCIAL
- ❌ UPLIFT CANADA
- ❌ BEAUTIFI LENDING
- ❌ PAYBRIGHT (maintenant Affirm)
- ❌ CAN FINANCE (toutes variantes)
- ❌ NOVILO FINANCE
- ❌ SCOOBY
- ❌ Et 200+ autres...

---

## 📈 Recommandations d'amélioration

### 1. **Élargir la liste de détection**
Intégrer tous les 548 noms du fichier CSV pour une détection complète:

```javascript
const PRETEURS_CONNUS = [
    // Actuels (29)
    'zum rails', 'vopay', 'money mart', ...

    // À ajouter depuis le CSV (519+)
    'iceberg', 'if xpress', 'affirm', 'flexiti',
    'paybright', 'lendcare', 'spring financial',
    'uplift', 'beautifi', 'can finance', ...
];
```

### 2. **Ajouter la détection par catégorie**
Certaines banques catégorisent déjà les transactions:
```javascript
if (transaction.category === 'loans') {
    // Transaction déjà identifiée comme prêt
}
```

### 3. **Détection intelligente**
- Patterns comme `PRET`, `LOAN`, `CREDIT`, `FINANCE`
- Mais avec des règles pour éviter les faux positifs (ex: "CREDIT CARD")

### 4. **Base de données dynamique**
Charger la liste depuis le CSV au lieu de la coder en dur:
```javascript
const PRETEURS_CONNUS = loadPreteursFromCSV('preteurs_opc_422_permis.csv');
```

---

## 🔧 Fichiers concernés

1. **`server.ts`** (lignes 380-440) - Logique de détection principale
2. **`exclusions.json`** - Liste des exclusions configurées
3. **`preteurs_opc_422_permis.csv`** - Base de données OPC (267 compagnies, 548 noms)
4. **`liste_preteurs_tous_noms.txt`** - Liste formatée de tous les prêteurs

---

## 📝 Notes importantes

1. **Période analysée**: 90 jours seulement
2. **Recherche insensible à la casse**: "VOPAY" = "vopay" = "VoPay"
3. **Inclusion partielle**: "VoPay Corporation" sera détecté par "vopay"
4. **Prêts reçus restrictifs**: Seuls VoPay et ZumRails comptent comme prêts reçus
5. **Exclusions prioritaires**: Les exclusions sont vérifiées en premier

---

**Version du système**: 9.0.0
**Date**: 15 décembre 2025
**Taux de couverture**: ~5% (29 sur 548 noms possibles)
