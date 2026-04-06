#!/bin/bash

# Script de instalação de dependências do sistema de subscrição
# Data: 04/04/2026

echo "🚀 Instalando dependências do sistema de subscrição..."
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado!"
    echo "Execute este script no diretório backend/"
    exit 1
fi

# Instalar node-cron
echo "📦 Instalando node-cron..."
npm install node-cron

# Verificar instalação
if [ $? -eq 0 ]; then
    echo "✅ node-cron instalado com sucesso!"
else
    echo "❌ Erro ao instalar node-cron"
    exit 1
fi

echo ""
echo "✅ Todas as dependências foram instaladas com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Verificar variáveis de ambiente no .env"
echo "2. Configurar SMTP (opcional, para emails)"
echo "3. Reiniciar o servidor: npm restart"
echo ""
echo "🎉 Sistema de subscrição pronto para uso!"
