#!/bin/bash

set -e  # Parar em caso de erro

# Configurações (ajustar conforme necessário)
PROD_HOST="${PROD_DB_HOST}"
PROD_USER="${PROD_DB_USER}"
PROD_DB="${PROD_DB_NAME}"
PROD_PASSWORD="${PROD_DB_PASSWORD}"

BACKUP_DIR="./backups"
MIGRATIONS_DIR="./backend/migrations"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Iniciando deploy de migrações para produção..."
echo "📅 Data: $(date)"
echo "🗄️  Base de dados: $PROD_DB"
echo ""

# 1. Criar diretório de backups
mkdir -p $BACKUP_DIR

# 2. Fazer backup
echo "📦 Criando backup da base de dados..."
PGPASSWORD=$PROD_PASSWORD pg_dump \
  -h $PROD_HOST \
  -U $PROD_USER \
  -d $PROD_DB \
  -F c \
  -f $BACKUP_DIR/backup_${TIMESTAMP}.dump

if [ $? -eq 0 ]; then
  echo "✅ Backup criado: $BACKUP_DIR/backup_${TIMESTAMP}.dump"
  BACKUP_SIZE=$(du -h $BACKUP_DIR/backup_${TIMESTAMP}.dump | cut -f1)
  echo "📊 Tamanho do backup: $BACKUP_SIZE"
else
  echo "❌ Erro ao criar backup! Abortando deploy."
  exit 1
fi

# 3. Verificar estado atual
echo ""
echo "🔍 Verificando estado atual da base de dados..."
PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -U $PROD_USER \
  -d $PROD_DB \
  -c "SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';"

# 4. Executar migrações
echo ""
echo "📝 Executando migrações..."
PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -U $PROD_USER \
  -d $PROD_DB \
  -f deploy_production_migrations.sql

if [ $? -eq 0 ]; then
  echo "✅ Migrações aplicadas com sucesso!"
else
  echo "❌ Erro ao aplicar migrações!"
  echo "⚠️  Backup disponível em: $BACKUP_DIR/backup_${TIMESTAMP}.dump"
  echo "💡 Para restaurar: pg_restore -h $PROD_HOST -U $PROD_USER -d $PROD_DB -c $BACKUP_DIR/backup_${TIMESTAMP}.dump"
  exit 1
fi

# 5. Verificar tabelas criadas
echo ""
echo "🔍 Verificando tabelas criadas..."
PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -U $PROD_USER \
  -d $PROD_DB \
  -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('clients', 'client_users', 'client_catalog_access', 'client_user_catalog_access', 'context_sessions', 'context_audit_logs') ORDER BY table_name;"

echo ""
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "📦 Backup mantido em: $BACKUP_DIR/backup_${TIMESTAMP}.dump"
echo "💡 Recomendação: Testar aplicação em produção"
