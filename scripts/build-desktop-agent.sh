#!/bin/bash

# Script para gerar os executáveis do Desktop Agent
# e copiar para a pasta de downloads do backend

echo "🔨 Iniciando build do Desktop Agent..."

# Navegar para o diretório do desktop-agent
cd "$(dirname "$0")/../desktop-agent" || exit 1

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Criar pasta de downloads no backend se não existir
mkdir -p ../backend/downloads

# Build para a plataforma atual
echo "🏗️ Gerando build..."

# Detectar sistema operacional
OS=$(uname -s)
case "$OS" in
    Darwin)
        echo "🍎 Detectado macOS - Gerando .dmg..."
        npm run build:mac
        # Copiar arquivo gerado
        if [ -f "dist/TatuTicket Agent-1.0.0.dmg" ]; then
            cp "dist/TatuTicket Agent-1.0.0.dmg" "../backend/downloads/"
            echo "✅ macOS build copiado para backend/downloads/"
        elif [ -f "dist/TatuTicket Agent-1.0.0-arm64.dmg" ]; then
            cp "dist/TatuTicket Agent-1.0.0-arm64.dmg" "../backend/downloads/"
            echo "✅ macOS ARM build copiado para backend/downloads/"
        fi
        ;;
    Linux)
        echo "🐧 Detectado Linux - Gerando .AppImage e .deb..."
        npm run build:linux
        # Copiar arquivos gerados
        if [ -f "dist/TatuTicket Agent-1.0.0.AppImage" ]; then
            cp "dist/TatuTicket Agent-1.0.0.AppImage" "../backend/downloads/"
            echo "✅ Linux AppImage copiado para backend/downloads/"
        fi
        if [ -f "dist/tatuticket-agent_1.0.0_amd64.deb" ]; then
            cp "dist/tatuticket-agent_1.0.0_amd64.deb" "../backend/downloads/"
            echo "✅ Linux .deb copiado para backend/downloads/"
        fi
        ;;
    MINGW*|MSYS*|CYGWIN*)
        echo "🪟 Detectado Windows - Gerando .exe..."
        npm run build:win
        # Copiar arquivo gerado
        if [ -f "dist/TatuTicket Agent Setup 1.0.0.exe" ]; then
            cp "dist/TatuTicket Agent Setup 1.0.0.exe" "../backend/downloads/"
            echo "✅ Windows build copiado para backend/downloads/"
        fi
        ;;
    *)
        echo "⚠️ Sistema operacional não reconhecido: $OS"
        echo "Tentando build para todas as plataformas..."
        npm run build
        ;;
esac

echo ""
echo "📁 Arquivos na pasta de downloads:"
ls -la ../backend/downloads/

echo ""
echo "✅ Build concluído!"
echo ""
echo "Para gerar builds para outras plataformas, execute:"
echo "  npm run build:win   # Windows"
echo "  npm run build:mac   # macOS"
echo "  npm run build:linux # Linux"
