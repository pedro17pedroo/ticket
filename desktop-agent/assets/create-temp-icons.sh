#!/bin/bash

# Script para criar ícones temporários para desenvolvimento
# TatuTicket Desktop Agent

echo "🎨 Criando ícones temporários para desenvolvimento..."

# Verificar se ImageMagick está instalado
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick não encontrado"
    echo "📥 Baixando ícone placeholder..."
    
    # Baixar ícone placeholder (32x32)
    curl -s "https://via.placeholder.com/32/4F46E5/FFFFFF?text=TT" -o tray/icon.png
    
    # Baixar ícone placeholder (512x512)
    curl -s "https://via.placeholder.com/512/4F46E5/FFFFFF?text=TT" -o icons/icon.png
    
    echo "✅ Ícones placeholder criados!"
    echo ""
    echo "⚠️  ATENÇÃO: Estes são ícones temporários"
    echo "📝 Substitua por ícones reais do TatuTicket em produção"
    
else
    echo "✅ ImageMagick encontrado, criando ícones..."
    
    # Criar ícone do tray (32x32) - Azul com "TT"
    convert -size 32x32 xc:"#4F46E5" \
        -fill white \
        -pointsize 14 \
        -font Arial-Bold \
        -gravity center \
        -annotate +0+0 "TT" \
        tray/icon.png
    
    # Criar ícone da aplicação (512x512)
    convert -size 512x512 xc:"#4F46E5" \
        -fill white \
        -pointsize 200 \
        -font Arial-Bold \
        -gravity center \
        -annotate +0+0 "TT" \
        icons/icon.png
    
    echo "✅ Ícones criados com ImageMagick!"
fi

echo ""
echo "📁 Ícones criados:"
ls -lh tray/icon.png icons/icon.png

echo ""
echo "🚀 Agora você pode executar: npm run dev"
