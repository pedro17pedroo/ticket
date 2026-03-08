#!/bin/bash

# Script para testar pagamento e-Kwanza
# Uso: ./test-ekwanza.sh

echo "🧪 Iniciando teste de pagamento e-Kwanza..."
echo ""

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "Por favor, crie o arquivo .env com as configurações necessárias."
    exit 1
fi

# Verificar se node_modules existe
if [ ! -d node_modules ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Executar o teste
echo "🚀 Executando teste..."
echo ""
node test-ekwanza-payment.js

echo ""
echo "✅ Teste concluído!"
