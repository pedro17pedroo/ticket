#!/bin/bash

# Script para verificar funções duplicadas no app.js
# Uso: ./check-duplicates.sh

echo "🔍 Verificando funções duplicadas em app.js..."
echo ""

FILE="src/renderer/app.js"

if [ ! -f "$FILE" ]; then
    echo "❌ Arquivo $FILE não encontrado!"
    exit 1
fi

# Procurar por declarações de funções
echo "📋 Procurando declarações de funções..."
grep -n "^function \|^async function \|^const .* = function\|^const .* = async function" "$FILE" | \
    sed 's/function //' | \
    sed 's/async //' | \
    sed 's/const //' | \
    sed 's/ = .*//' | \
    sed 's/(.*$//' | \
    awk '{print $2}' | \
    sort | \
    uniq -d > /tmp/duplicates.txt

if [ -s /tmp/duplicates.txt ]; then
    echo ""
    echo "⚠️  FUNÇÕES DUPLICADAS ENCONTRADAS:"
    echo "=================================="
    
    while read -r func; do
        echo ""
        echo "🔴 Função: $func"
        grep -n "function $func\|const $func" "$FILE" | head -5
    done < /tmp/duplicates.txt
    
    echo ""
    echo "❌ Encontradas $(wc -l < /tmp/duplicates.txt) funções duplicadas!"
    exit 1
else
    echo ""
    echo "✅ Nenhuma função duplicada encontrada!"
    exit 0
fi
