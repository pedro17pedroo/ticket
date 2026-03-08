#!/bin/bash

# Script de teste da integração TPagamento
# Uso: ./test-payment-integration.sh

set -e

echo "🧪 Teste de Integração TPagamento"
echo "=================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuração
API_URL="${API_URL:-http://localhost:4003/api}"
EMAIL="${TEST_EMAIL:-admin@example.com}"
PASSWORD="${TEST_PASSWORD:-senha123}"

echo "📍 API URL: $API_URL"
echo ""

# Função para fazer login e obter token
login() {
    echo "🔐 Fazendo login..."
    RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
    
    TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}❌ Erro ao fazer login${NC}"
        echo "Resposta: $RESPONSE"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Login realizado com sucesso${NC}"
    echo ""
}

# Função para testar criação de pagamento
test_create_payment() {
    local METHOD=$1
    local METHOD_NAME=$2
    
    echo "💳 Testando criação de pagamento: $METHOD_NAME"
    
    RESPONSE=$(curl -s -X POST "$API_URL/payments/create" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"amount\": 5000,
            \"paymentMethod\": \"$METHOD\",
            \"customerName\": \"João Silva\",
            \"customerEmail\": \"joao@example.com\",
            \"customerPhone\": \"923456789\",
            \"description\": \"Teste de pagamento $METHOD_NAME\"
        }")
    
    SUCCESS=$(echo $RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)
    
    if [ "$SUCCESS" = "true" ]; then
        TRANSACTION_ID=$(echo $RESPONSE | grep -o '"transactionId":"[^"]*' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Pagamento criado: $TRANSACTION_ID${NC}"
        echo "$TRANSACTION_ID"
    else
        echo -e "${RED}❌ Erro ao criar pagamento${NC}"
        echo "Resposta: $RESPONSE"
        echo ""
    fi
}

# Função para testar verificação de status
test_check_status() {
    local TRANSACTION_ID=$1
    
    echo "🔍 Verificando status do pagamento: $TRANSACTION_ID"
    
    RESPONSE=$(curl -s -X GET "$API_URL/payments/$TRANSACTION_ID/status" \
        -H "Authorization: Bearer $TOKEN")
    
    SUCCESS=$(echo $RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)
    
    if [ "$SUCCESS" = "true" ]; then
        STATUS=$(echo $RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Status: $STATUS${NC}"
    else
        echo -e "${RED}❌ Erro ao verificar status${NC}"
        echo "Resposta: $RESPONSE"
    fi
    echo ""
}

# Função para testar histórico
test_payment_history() {
    echo "📋 Testando histórico de pagamentos..."
    
    RESPONSE=$(curl -s -X GET "$API_URL/payments/history?page=1&limit=5" \
        -H "Authorization: Bearer $TOKEN")
    
    SUCCESS=$(echo $RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)
    
    if [ "$SUCCESS" = "true" ]; then
        TOTAL=$(echo $RESPONSE | grep -o '"total":[0-9]*' | cut -d':' -f2)
        echo -e "${GREEN}✅ Histórico obtido: $TOTAL pagamentos${NC}"
    else
        echo -e "${RED}❌ Erro ao obter histórico${NC}"
        echo "Resposta: $RESPONSE"
    fi
    echo ""
}

# Função para testar subscrição
test_subscription() {
    echo "📊 Testando endpoint de subscrição..."
    
    RESPONSE=$(curl -s -X GET "$API_URL/subscription" \
        -H "Authorization: Bearer $TOKEN")
    
    SUCCESS=$(echo $RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)
    
    if [ "$SUCCESS" = "true" ]; then
        echo -e "${GREEN}✅ Subscrição obtida com sucesso${NC}"
    else
        echo -e "${YELLOW}⚠️  Subscrição não encontrada (pode ser normal se não houver subscrição)${NC}"
    fi
    echo ""
}

# Função para testar webhook
test_webhook() {
    echo "🔔 Testando webhook..."
    
    RESPONSE=$(curl -s -X POST "$API_URL/webhooks/tpagamento" \
        -H "Content-Type: application/json" \
        -d '{
            "event": "payment.completed",
            "data": {
                "id": "test_payment_123",
                "reference": "TEST-REF-123",
                "amount": 5000,
                "paidAt": "2026-03-06T10:30:00Z"
            }
        }')
    
    SUCCESS=$(echo $RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)
    
    if [ "$SUCCESS" = "true" ]; then
        echo -e "${GREEN}✅ Webhook processado${NC}"
    else
        echo -e "${YELLOW}⚠️  Webhook retornou erro (pode ser normal se transação não existir)${NC}"
    fi
    echo ""
}

# Executar testes
echo "🚀 Iniciando testes..."
echo ""

# 1. Login
login

# 2. Testar criação de pagamentos
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Teste 1: Criação de Pagamentos"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

EKWANZA_ID=$(test_create_payment "ekwanza" "E-Kwanza")
sleep 1
GPO_ID=$(test_create_payment "gpo" "Multicaixa Express")
sleep 1
REF_ID=$(test_create_payment "ref" "Referência Multicaixa")
echo ""

# 3. Testar verificação de status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Teste 2: Verificação de Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -z "$EKWANZA_ID" ]; then
    test_check_status "$EKWANZA_ID"
fi

if [ ! -z "$GPO_ID" ]; then
    test_check_status "$GPO_ID"
fi

if [ ! -z "$REF_ID" ]; then
    test_check_status "$REF_ID"
fi

# 4. Testar histórico
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Teste 3: Histórico de Pagamentos"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_payment_history

# 5. Testar subscrição
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Teste 4: Endpoint de Subscrição"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_subscription

# 6. Testar webhook
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔔 Teste 5: Webhook TPagamento"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_webhook

# Resumo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Testes Concluídos"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Resumo:"
echo "  - E-Kwanza ID: ${EKWANZA_ID:-N/A}"
echo "  - GPO ID: ${GPO_ID:-N/A}"
echo "  - REF ID: ${REF_ID:-N/A}"
echo ""
echo "💡 Próximos passos:"
echo "  1. Verificar logs do backend"
echo "  2. Testar frontend (Portal SaaS e Portal Organização)"
echo "  3. Configurar webhook no dashboard TPagamento"
echo ""
