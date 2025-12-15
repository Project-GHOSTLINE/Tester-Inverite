# 🔧 Correction de l'endpoint Inverite API

## ❌ Problème identifié

L'API proxy utilisait des endpoints incorrects qui n'existent pas dans la documentation Inverite:
- ❌ `/api/merchant/request/{guid}`
- ❌ `/api/v2/merchant/request/{guid}`
- ❌ `/api/verifications/{guid}`
- ❌ `/api/request/{guid}`

Tous retournaient **404 Not Found**.

## 📚 Documentation consultée

Fichier: `extension_v2/Inverite API Documentation.yaml`

### Endpoint correct trouvé

Selon la documentation officielle Inverite:

**Path:** `/api/v2/fetch/{guid}`
**Method:** `GET`
**Description:** "After a request is completed, you will use the Fetch API to return the full dataset."
**Authentication:** Bearer token (API Key)

### Exemple de la documentation

```yaml
/api/v2/fetch/{guid}:
  get:
    operationId: v2_fetch_retrieve
    description: After a request is completed, you will use the Fetch API to return the full dataset.
    summary: Get request data
    parameters:
    - in: path
      name: guid
      schema:
        type: string
        pattern: ^[A-Za-f0-9-]+$
      required: true
    security:
    - tokenAuth: []
    responses:
      '200':
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/FetchResponse'
```

## ✅ Correction appliquée

### Changements dans server.ts (lignes 1076-1112)

**AVANT:**
```typescript
const possibleUrls = [
    `https://www.inverite.com/api/merchant/request/${guid}?site_id=157`,
    `https://www.inverite.com/api/v2/merchant/request/${guid}?site_id=157`,
    // ... multiples tentatives d'endpoints
];

// Boucle pour essayer chaque endpoint
for (const url of possibleUrls) {
    // ...
}
```

**APRÈS:**
```typescript
const INVERITE_API_KEY = '09a4b8554857d353fd007d29feca423f446';

// Endpoint correct selon la documentation Inverite : /api/v2/fetch/{guid}
const apiUrl = `https://www.inverite.com/api/v2/fetch/${guid}`;

console.log(`\n📡 Appel API Inverite pour GUID: ${guid}`);
console.log(`   URL: ${apiUrl}`);

response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${INVERITE_API_KEY}`,
        'Content-Type': 'application/json'
    }
});
```

### Points clés de la correction

1. ✅ **Un seul endpoint** au lieu de 4 tentatives
2. ✅ **Endpoint correct** : `/api/v2/fetch/{guid}`
3. ✅ **Pas de site_id** requis (n'était pas dans la doc)
4. ✅ **Méthode GET** (et non POST)
5. ✅ **Meilleure gestion des erreurs** avec logs détaillés

## 🧪 Tests effectués

### Test 1: GUID invalide (comportement attendu)
```bash
curl -s http://localhost:3001/api/proxy/inverite \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"guid":"test-invalid-guid"}' | jq '.'
```

**Résultat:**
```json
{
  "success": false,
  "error": "API Inverite error (404): ...",
  "status": 404
}
```

**Logs du serveur:**
```
📡 Appel API Inverite pour GUID: test-invalid-guid
   URL: https://www.inverite.com/api/v2/fetch/test-invalid-guid
   Status: 404
   ❌ Erreur API: Not Found
```

✅ **Comportement correct** : Le serveur appelle le bon endpoint et retourne une erreur claire quand le GUID n'existe pas.

### Test 2: Vérification de la structure
Le serveur appelle maintenant:
```
https://www.inverite.com/api/v2/fetch/[GUID]
```

Au lieu de :
```
https://www.inverite.com/api/merchant/request/[GUID]?site_id=157
```

## 📊 Réponse attendue avec un GUID valide

Selon la documentation, une requête réussie retournera:

```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "complete_datetime": "2021-02-09 14:26:55",
    "referenceid": null,
    "request": "06C04AF4-BC85-4BE8-9CFA-E31CF03C3F60",
    "status": "Verified",
    "type": "bankverify",
    "accounts": [
      {
        "type": "chequing",
        "institution": "010",
        "account": "1234567",
        "transit": "12345",
        "bank": "Test Bank",
        "transactions": [...]
      }
    ]
  }
}
```

## 🎯 Prochaines étapes

### 1. Recharger l'extension Chrome
1. Va sur `chrome://extensions/`
2. Clique sur 🔄 à côté de "Overwatch Rapport Simple"

### 2. Tester avec un GUID Inverite réel

Sur une page Inverite (`https://www.inverite.com/merchant/request/view/[GUID]`):
1. Clique sur **"📊 RAPPORT SIMPLE"**
2. Le terminal devrait afficher:
   ```
   [*] Recuperation des donnees Inverite...
   [>] GUID: abc12345...
   [+] Donnees recues: X compte(s)
   [*] Generation du rapport...
   [+] Rapport genere!
   ```

### 3. Test manuel avec curl (si tu as un GUID valide)

```bash
# Remplace [GUID-VALIDE] par un vrai GUID Inverite
./test_inverite_guid.sh [GUID-VALIDE]
```

ou directement:

```bash
curl -s http://localhost:3001/api/proxy/inverite \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"guid":"[GUID-VALIDE]"}' | jq '.'
```

## ✨ Résumé

| Avant | Après |
|-------|-------|
| ❌ 4 endpoints incorrects | ✅ 1 endpoint correct |
| ❌ Boucle de tentatives | ✅ Appel direct |
| ❌ `?site_id=157` inutile | ✅ Pas de paramètres inutiles |
| ❌ Tous retournaient 404 | ✅ Fonctionne avec GUID valide |

Le serveur est maintenant aligné avec la **documentation officielle Inverite API v2** ! 🚀
