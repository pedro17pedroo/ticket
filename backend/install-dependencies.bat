@echo off
REM Script de instalação de dependências do sistema de subscrição
REM Data: 04/04/2026

echo 🚀 Instalando dependências do sistema de subscrição...
echo.

REM Verificar se está no diretório correto
if not exist "package.json" (
    echo ❌ Erro: package.json não encontrado!
    echo Execute este script no diretório backend/
    exit /b 1
)

REM Instalar node-cron
echo 📦 Instalando node-cron...
call npm install node-cron

if %errorlevel% equ 0 (
    echo ✅ node-cron instalado com sucesso!
) else (
    echo ❌ Erro ao instalar node-cron
    exit /b 1
)

echo.
echo ✅ Todas as dependências foram instaladas com sucesso!
echo.
echo 📋 Próximos passos:
echo 1. Verificar variáveis de ambiente no .env
echo 2. Configurar SMTP (opcional, para emails)
echo 3. Reiniciar o servidor: npm restart
echo.
echo 🎉 Sistema de subscrição pronto para uso!
pause
