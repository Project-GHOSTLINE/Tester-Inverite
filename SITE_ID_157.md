# 🔧 Ajout du site_id=157 pour l'API Inverite

## ✅ Modification appliquée

L'API Inverite nécessite le paramètre `site_id=157` (solutionargentrapide) pour fonctionner correctement.

### Changement dans server.ts

**AVANT:**
```typescript
const possibleUrls = [
    `https://www.inverite.com/api/merchant/request/${guid}`,
    `https://www.inverite.com/api/v2/merchant/request/${guid}`,
    `https://www.inverite.com/api/verifications/${guid}`,
    `https://www.inverite.com/api/request/${guid}`
];
```

**APRÈS:**
```typescript
const INVERITE_API_KEY = '09a4b8554857d353fd007d29feca423f446';
const SITE_ID = '157'; // solutionargentrapide

const possibleUrls = [
    `https://www.inverite.com/api/merchant/request/${guid}?site_id=${SITE_ID}`,
    `https://www.inverite.com/api/v2/merchant/request/${guid}?site_id=${SITE_ID}`,
    `https://www.inverite.com/api/verifications/${guid}?site_id=${SITE_ID}`,
    `https://www.inverite.com/api/request/${guid}?site_id=${SITE_ID}`
];
```

## 🧪 Test curl

### Test de vérification des URLs
```bash
curl -s http://localhost:3001/api/proxy/inverite \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"guid":"test-guid-123"}' | jq '.'
```

**Résultat:**
```json
{
  "success": false,
  "error": "Aucun endpoint Inverite valide trouvé",
  "tried": [
    "https://www.inverite.com/api/merchant/request/test-guid-123?site_id=157",
    "https://www.inverite.com/api/v2/merchant/request/test-guid-123?site_id=157",
    "https://www.inverite.com/api/verifications/test-guid-123?site_id=157",
    "https://www.inverite.com/api/request/test-guid-123?site_id=157"
  ]
}
```

✅ **Toutes les URLs contiennent maintenant `?site_id=157`**

### Logs du serveur
```
📡 Test des endpoints Inverite pour GUID: test-guid-123
   Essai: https://www.inverite.com/api/merchant/request/test-guid-123?site_id=157
   Status: 404
   Essai: https://www.inverite.com/api/v2/merchant/request/test-guid-123?site_id=157
   Status: 404
   Essai: https://www.inverite.com/api/verifications/test-guid-123?site_id=157
   Status: 404
   Essai: https://www.inverite.com/api/request/test-guid-123?site_id=157
   Status: 404
   ❌ Aucun endpoint valide trouvé
```

## 🔄 État du serveur

- ✅ Serveur actif sur `http://localhost:3001`
- ✅ `site_id=157` ajouté à tous les appels API
- ✅ Logs détaillés activés pour le debugging

## 🎯 Prochaine étape: Tester avec un GUID valide

### Option 1: Depuis l'extension
1. Va sur une page Inverite réelle
2. Clique sur **"📊 RAPPORT SIMPLE"**
3. Le terminal devrait afficher:
   ```
   [*] Recuperation des donnees Inverite...
   [>] GUID: abc12345...
   [+] Donnees recues: X compte(s)
   [*] Generation du rapport...
   ```

### Option 2: Test direct avec curl
Si tu as un GUID Inverite valide:

```bash
curl -s http://localhost:3001/api/proxy/inverite \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"guid":"[TON-GUID-VALIDE]"}' | jq '.'
```

**Réponse attendue si le GUID est valide:**
```json
{
  "success": true,
  "data": {
    "name": "Nom du client",
    "referenceid": "...",
    "accounts": [...]
  }
}
```

## 📝 Notes

- Le `site_id=157` correspond au site "solutionargentrapide"
- Ce paramètre est maintenant automatiquement ajouté à chaque requête
- Aucune modification n'est nécessaire côté extension
- L'API Key utilisée: `09a4b8554857d353fd007d29feca423f446`

## ⚠️ Important

Si tu obtiens toujours des erreurs 404 avec un GUID valide, vérifie:
1. Que l'API Key est correcte
2. Que le GUID existe vraiment dans Inverite
3. Que le site_id 157 est bien le bon pour ce GUID

Tu peux vérifier dans les logs du serveur (`/tmp/server_157.log`) les URLs exactes qui sont testées.
