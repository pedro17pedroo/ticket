#!/bin/bash

# Script de teste dos endpoints de relatórios
# Uso: ./test-reports.sh

BASE_URL="http://localhost:4003/api"

echo "🧪 Testando Sistema de Relatórios de Horas"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para fazer login e obter token
get_token() {
    echo -e "${YELLOW}📝 Fazendo login...${NC}"
    
    # Tentar com diferentes usuários
    USERS=(
        '{"email": "eldade113@gmail.com", "password": "123456"}'
        '{"email": "tenant-admin@empresademo.com", "password": "admin123"}'
        '{"email": "kikuambi1@gmail.com", "password": "123456"}'
    )
    
    for user_data in "${USERS[@]}"; do
        TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
            -H "Content-Type: application/json" \
            -d "$user_data" | jq -r '.token // empty')
        
        if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
            echo -e "${GREEN}✅ Login bem-sucedido!${NC}"
            echo "Token: ${TOKEN:0:50}..."
            return 0
        fi
    done
    
    echo -e "${RED}❌ Falha no login com todos os usuários${NC}"
    echo "Por favor, crie um usuário ou atualize as credenciais"
    exit 1
}

# Função para testar endpoint
test_endpoint() {
    local name=$1
    local endpoint=$2
    local description=$3
    
    echo ""
    echo -e "${YELLOW}🔍 Testando: $name${NC}"
    echo "Descrição: $description"
    echo "Endpoint: GET $endpoint"
    
    response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Status: $http_code OK${NC}"
        echo "$body" | jq -r '.summary // .data[0] // "Sem dados"' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ Status: $http_code${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
}

# Obter token
get_token

echo ""
echo "=========================================="
echo "🚀 Iniciando testes dos endpoints"
echo "=========================================="

# Teste 1: Relatório de horas por ticket
test_endpoint \
    "Horas por Ticket" \
    "/reports/hours-by-ticket" \
    "Mostra horas consumidas por ticket e pessoas envolvidas"

# Teste 2: Relatório de horas por usuário
test_endpoint \
    "Horas por Usuário" \
    "/reports/hours-by-user" \
    "Total de horas trabalhadas por cada usuário"

# Teste 3: Relatório mensal
test_endpoint \
    "Relatório Mensal" \
    "/reports/hours-by-user?year=2026" \
    "Horas agrupadas por mês para cada usuário"

# Teste 4: Relatório por cliente
test_endpoint \
    "Horas por Cliente" \
    "/reports/hours-by-client" \
    "Horas consumidas por cada cliente"

# Teste 5: Relatório diário
test_endpoint \
    "Relatório Diário" \
    "/reports/hours-by-day?startDate=2026-03-01&endDate=2026-03-09" \
    "Horas agrupadas por dia"

# Teste 6: Resumo por cliente
test_endpoint \
    "Resumo por Cliente" \
    "/reports/client-summary" \
    "Informações consolidadas de cada cliente"

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Testes concluídos!${NC}"
echo "=========================================="
