#!/bin/bash

echo "🧹 Limpando cache do Vite..."
rm -rf node_modules/.vite

echo "🧹 Limpando dist..."
rm -rf dist

echo "✅ Cache limpo! Agora execute: npm run dev"
