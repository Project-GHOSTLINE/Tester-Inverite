#!/bin/bash

# Script de test pour l'API Inverite avec site_id=157
# Usage: ./test_inverite_guid.sh [GUID]

if [ -z "$1" ]; then
    echo "Usage: $0 [GUID]"
    echo ""
    echo "Exemple:"
    echo "  $0 abc123-def456-789"
    echo ""
    exit 1
fi

GUID=$1

echo "=========================================="
echo "🧪 TEST API INVERITE avec site_id=157"
echo "=========================================="
echo ""
echo "GUID: $GUID"
echo ""

echo "1️⃣  Vérification du serveur..."
if ! curl -s -f http://localhost:3001/ > /dev/null; then
    echo "❌ Serveur non accessible sur localhost:3001"
    echo "Démarrez le serveur avec: npx ts-node server.ts"
    exit 1
fi
echo "✅ Serveur actif"
echo ""

echo "2️⃣  Appel à l'API proxy Inverite..."
echo "URL: http://localhost:3001/api/proxy/inverite"
echo "Body: {\"guid\":\"$GUID\"}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/proxy/inverite \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"guid\":\"$GUID\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "Code HTTP: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Réponse reçue (HTTP 200)"
    echo ""

    # Vérifier si success est true
    SUCCESS=$(echo "$BODY" | jq -r '.success')

    if [ "$SUCCESS" = "true" ]; then
        echo "🎉 SUCCÈS! Données Inverite récupérées"
        echo ""

        # Afficher les infos principales
        NAME=$(echo "$BODY" | jq -r '.data.name')
        REF_ID=$(echo "$BODY" | jq -r '.data.referenceid')
        ACCOUNTS_COUNT=$(echo "$BODY" | jq -r '.data.accounts | length')

        echo "📊 Informations du client:"
        echo "  Nom: $NAME"
        echo "  Référence: $REF_ID"
        echo "  Nombre de comptes: $ACCOUNTS_COUNT"
        echo ""

        # Calculer le total de transactions
        TOTAL_TRANSACTIONS=$(echo "$BODY" | jq '[.data.accounts[].transactions | length] | add')
        echo "  Total transactions: $TOTAL_TRANSACTIONS"
        echo ""

        echo "💾 Données complètes sauvegardées dans: /tmp/inverite_${GUID:0:8}.json"
        echo "$BODY" | jq '.' > "/tmp/inverite_${GUID:0:8}.json"

    else
        echo "❌ Échec de la récupération"
        ERROR=$(echo "$BODY" | jq -r '.error')
        echo "Erreur: $ERROR"
        echo ""

        # Afficher les URLs essayées
        echo "URLs essayées:"
        echo "$BODY" | jq -r '.tried[]' | while read url; do
            echo "  - $url"
        done
    fi

else
    echo "❌ Erreur HTTP $HTTP_CODE"
    echo ""
    echo "Réponse:"
    echo "$BODY" | jq '.'
fi

echo ""
echo "=========================================="

# Afficher les derniers logs du serveur
if [ -f "/tmp/server_157.log" ]; then
    echo ""
    echo "📋 Derniers logs du serveur:"
    echo ""
    tail -15 /tmp/server_157.log | grep -A 10 "Test des endpoints"
fi
