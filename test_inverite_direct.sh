#!/bin/bash

# Test direct de l'API Inverite (sans passer par notre serveur)
# Usage: ./test_inverite_direct.sh [GUID]

if [ -z "$1" ]; then
    echo "❌ Usage: $0 [GUID]"
    echo ""
    echo "Exemple:"
    echo "  $0 B6C33D7F-3D6D-4B8D-9190-6A1F29E35A92"
    exit 1
fi

GUID=$1
API_KEY="09a4b8554857d353fd007d29feca423f446"

echo "=========================================="
echo "🧪 TEST DIRECT API INVERITE"
echo "=========================================="
echo ""
echo "GUID: $GUID"
echo "API Key: ${API_KEY:0:20}..."
echo ""

echo "1️⃣  Test avec /api/v2/fetch/{guid}"
echo "URL: https://www.inverite.com/api/v2/fetch/$GUID"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" "https://www.inverite.com/api/v2/fetch/$GUID" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "Code HTTP: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Succès!"
    echo ""
    echo "Données reçues:"
    echo "$BODY" | jq '.'
    echo ""

    # Sauvegarder dans un fichier
    echo "$BODY" | jq '.' > "/tmp/inverite_direct_${GUID:0:8}.json"
    echo "💾 Sauvegardé: /tmp/inverite_direct_${GUID:0:8}.json"
    echo ""

    # Vérifier la structure
    echo "📊 Structure des données:"
    echo "  - name: $(echo "$BODY" | jq -r '.name // "N/A"')"
    echo "  - status: $(echo "$BODY" | jq -r '.status // "N/A"')"
    echo "  - type: $(echo "$BODY" | jq -r '.type // "N/A"')"
    echo "  - accounts: $(echo "$BODY" | jq -r '.accounts // [] | length') compte(s)"

else
    echo "❌ Erreur HTTP $HTTP_CODE"
    echo ""
    echo "Réponse:"
    echo "$BODY"
fi

echo ""
echo "=========================================="
echo ""

# Test alternatifs avec différents endpoints
echo "2️⃣  Test d'autres endpoints possibles..."
echo ""

ENDPOINTS=(
    "https://sandbox.inverite.com/api/v2/fetch/$GUID"
    "https://www.inverite.com/api/v2/status"
    "https://www.inverite.com/api/v2/list"
)

for endpoint in "${ENDPOINTS[@]}"; do
    echo "Test: $endpoint"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json")
    echo "  → Status: $STATUS"
done

echo ""
echo "=========================================="
echo ""

# Tester avec notre serveur local
echo "3️⃣  Test via notre serveur proxy local..."
echo ""

if curl -s -f http://localhost:3001/ > /dev/null 2>&1; then
    echo "Serveur local: ✅ Actif"

    LOCAL_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/proxy/inverite \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"guid\":\"$GUID\"}")

    LOCAL_HTTP_CODE=$(echo "$LOCAL_RESPONSE" | tail -1)
    LOCAL_BODY=$(echo "$LOCAL_RESPONSE" | head -n -1)

    echo "Code HTTP: $LOCAL_HTTP_CODE"
    echo ""

    if [ "$LOCAL_HTTP_CODE" = "200" ]; then
        SUCCESS=$(echo "$LOCAL_BODY" | jq -r '.success')
        if [ "$SUCCESS" = "true" ]; then
            echo "✅ Proxy local fonctionne!"
            echo "$LOCAL_BODY" | jq '.'
        else
            echo "❌ Erreur proxy:"
            echo "$LOCAL_BODY" | jq '.'
        fi
    else
        echo "❌ Erreur HTTP $LOCAL_HTTP_CODE"
        echo "$LOCAL_BODY"
    fi
else
    echo "Serveur local: ❌ Non actif"
    echo "Démarrez-le avec: npx ts-node server.ts"
fi

echo ""
echo "=========================================="
