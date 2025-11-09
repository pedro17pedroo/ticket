#!/bin/bash

# Script de teste - Department API
# Execute: bash test-department.sh

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjI4NzE5MzIwLWEzNzYtNDZlMS05MDk4LWZmYzg0YTU0Mjc2YSIsImVtYWlsIjoiYWRtaW5AZW1wcmVzYWRlbW8uY29tIiwicm9sZSI6ImFkbWluLW9yZyIsIm9yZ2FuaXphdGlvbklkIjoiZTBiZDhkOGUtODliYS00ZmY2LWIxNDQtOWVjZDA4ZmJmYWM2IiwiaWF0IjoxNzYyMjkwMzM2LCJleHAiOjE3NjIzNzY3MzZ9.yk380l8oEIrTzjP8thsrjG8i5d42wB6ECMa1srEUof4"

echo "🧪 TESTE 1: Criar sem directionId (deve falhar)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X POST "http://localhost:3000/api/departments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste Sem Direção"}' \
  2>/dev/null | jq .
echo ""

echo "🧪 TESTE 2: Criar com directionId (deve funcionar)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X POST "http://localhost:3000/api/departments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Teste com Direção",
    "directionId":"9f898945-dd0c-45fb-9243-63a5ad1bae9c",
    "description":"Teste"
  }' \
  2>/dev/null | jq .
echo ""

echo "✅ Testes concluídos!"
echo ""
echo "Agora teste no frontend e compare os logs!"
