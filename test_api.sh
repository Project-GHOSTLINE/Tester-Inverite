#!/bin/bash

# Script de test de l'API Rapport Simple Inverite
# Usage: ./test_api.sh

BASE_URL="http://localhost:3001"

echo "=========================================="
echo "🧪 TESTS DE L'API RAPPORT SIMPLE INVERITE"
echo "=========================================="
echo ""

# Test 1: Santé du serveur
echo "1️⃣  Test de santé du serveur..."
curl -s -I $BASE_URL/ | head -1
echo "✅ Serveur actif"
echo ""

# Test 2: Liste des exclusions
echo "2️⃣  Liste des exclusions actuelles..."
curl -s $BASE_URL/exclusion/list | jq '.'
echo ""

# Test 3: Ajouter une exclusion test
echo "3️⃣  Ajout d'une exclusion test..."
curl -s -X POST $BASE_URL/exclusion/add \
  -H "Content-Type: application/json" \
  -d '{"details": "ACHAT EN LIGNE 2025ABC123 TEST MERCHANT CORPORATION 20251234567890"}' | jq '.'
echo ""

# Test 4: Vérifier que l'exclusion a été ajoutée
echo "4️⃣  Vérification de l'ajout..."
curl -s $BASE_URL/exclusion/list | jq '.exclusions | map(select(. | contains("TEST MERCHANT")))'
echo ""

# Test 5: Retirer l'exclusion test
echo "5️⃣  Suppression de l'exclusion test..."
curl -s -X POST $BASE_URL/exclusion/remove \
  -H "Content-Type: application/json" \
  -d '{"details": "TEST MERCHANT CORPORATION"}' | jq '.'
echo ""

# Test 6: Proxy Inverite (avec GUID invalide - normal qu'il échoue)
echo "6️⃣  Test du proxy Inverite (GUID invalide attendu)..."
curl -s -X POST $BASE_URL/api/proxy/inverite \
  -H "Content-Type: application/json" \
  -d '{"guid": "test-guid-12345"}' | jq '.'
echo ""

# Test 7: Upload d'un fichier JSON test
echo "7️⃣  Test d'upload d'un fichier JSON..."
echo "Création d'un JSON test..."
cat > /tmp/test_inverite_api.json << 'EOF'
{
  "name": "Jean Dupont Test API",
  "referenceid": "API-TEST-001",
  "request": "test-request",
  "status": "complete",
  "type": "verification",
  "complete_datetime": "2025-12-13T10:00:00Z",
  "accounts": [
    {
      "bank": "TD Bank",
      "institution": "004",
      "type": "chequing",
      "account": "987654",
      "transit": "12345",
      "current_balance": "2500.00",
      "transactions": [
        {
          "date": "2025-11-15",
          "details": "SalaryPayroll / ACME CORP INC",
          "category": "income",
          "credit": "3000.00",
          "debit": "",
          "balance": "5500.00",
          "flags": ["is_payroll"]
        },
        {
          "date": "2025-11-20",
          "details": "ACHAT EN LIGNE 2025ABC123 CANADIAN TIRE",
          "category": "shopping",
          "credit": "",
          "debit": "250.75",
          "balance": "5249.25",
          "flags": []
        },
        {
          "date": "2025-11-22",
          "details": "Point of Sale - INTERAC RETAIL PURCHASE LOTO QUEBEC",
          "category": "gambling",
          "credit": "",
          "debit": "50.00",
          "balance": "5199.25",
          "flags": []
        }
      ],
      "statistics": {
        "mean_closing_balance_30": "3500.00",
        "mean_closing_balance_90": "3200.00",
        "days_of_history": "90"
      }
    }
  ]
}
EOF

echo "Upload et génération du rapport..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/upload \
  -F "jsonFile=@/tmp/test_inverite_api.json")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
HTML_SIZE=$(echo "$RESPONSE" | head -n -1 | wc -c)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Rapport généré avec succès!"
  echo "📄 Taille du HTML: $HTML_SIZE octets"
  echo "💾 Sauvegardé dans: /tmp/rapport_api_test.html"
  echo "$RESPONSE" | head -n -1 > /tmp/rapport_api_test.html
else
  echo "❌ Erreur HTTP: $HTTP_CODE"
fi
echo ""

# Test 8: Vérifier le contenu du rapport
echo "8️⃣  Vérification du contenu du rapport..."
if [ -f "/tmp/rapport_api_test.html" ]; then
  echo "📊 Titre: $(grep '<title>' /tmp/rapport_api_test.html | sed 's/<[^>]*>//g' | xargs)"
  echo "👤 Client: $(grep -A 1 'Nom complet' /tmp/rapport_api_test.html | grep 'card-value' | sed 's/<[^>]*>//g' | xargs)"
  echo "💼 Employeur trouvé: $(grep -o 'ACME CORP INC' /tmp/rapport_api_test.html | head -1)"
  echo "🎰 Gambling détecté: $(grep -o 'LOTO QUEBEC' /tmp/rapport_api_test.html | head -1)"
fi
echo ""

echo "=========================================="
echo "✅ TOUS LES TESTS TERMINÉS"
echo "=========================================="
