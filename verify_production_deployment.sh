#!/bin/bash

# Script para verificar se o deploy foi bem-sucedido
# Uso: ./verify_production_deployment.sh

set -e

PROD_HOST="${PROD_DB_HOST}"
PROD_USER="${PROD_DB_USER}"
PROD_DB="${PROD_DB_NAME}"
PROD_PASSWORD="${PROD_DB_PASSWORD}"

echo "🔍 Verificando deployment em produção..."
echo ""

# 1. Verificar tabelas essenciais
echo "📋 Verificando tabelas essenciais..."
PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -U $PROD_USER \
  -d $PROD_DB \
  -t -c "
    SELECT 
      CASE 
        WHEN COUNT(*) = 6 THEN '✅ Todas as 6 tabelas criadas'
        ELSE '❌ Faltam ' || (6 - COUNT(*)) || ' tabelas'
      END as status
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('clients', 'client_users', 'client_catalog_access', 'client_user_catalog_access', 'context_sessions', 'context_audit_logs');
  "

# 2. Listar tabelas criadas
echo ""
echo "📊 Tabelas criadas:"
PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -U $PROD_USER \
  -d $PROD_DB \
  -c "
    SELECT 
      table_name,
      (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as num_columns
    FROM information_schema.tables t
    WHERE table_schema = 'public' 
    AND table_name IN ('clients', 'client_users', 'client_catalog_access', 'client_user_catalog_access', 'context_sessions', 'context_audit_logs')
    ORDER BY table_name;
  "

# 3. Verificar ENUM client_user_role
echo ""
echo "🔧 Verificando ENUM client_user_role..."
PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -U $PROD_USER \
  -d $PROD_DB \
  -c "
    SELECT enumlabel as role 
    FROM pg_enum 
    WHERE enumtypid = 'client_user_role'::regtype 
    ORDER BY enumsortorder;
  "

# 4. Verificar constraints
echo ""
echo "🔗 Verificando constraints importantes..."
PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -U $PROD_USER \
  -d $PROD_DB \
  -c "
    SELECT 
      tc.table_name,
      tc.constraint_name,
      tc.constraint_type
    FROM information_schema.table_constraints tc
    WHERE tc.table_name IN ('clients', 'client_users', 'client_catalog_access', 'client_user_catalog_access')
    AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
    ORDER BY tc.table_name, tc.constraint_type;
  "

# 5. Verificar índices
echo ""
echo "📇 Verificando índices criados..."
PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -U $PROD_USER \
  -d $PROD_DB \
  -c "
    SELECT 
      tablename,
      COUNT(*) as num_indexes
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename IN ('clients', 'client_users', 'client_catalog_access', 'client_user_catalog_access', 'context_sessions', 'context_audit_logs')
    GROUP BY tablename
    ORDER BY tablename;
  "

# 6. Verificar dados existentes (não devem ter sido perdidos)
echo ""
echo "📊 Verificando dados existentes..."
PGPASSWORD=$PROD_PASSWORD psql \
  -h $PROD_HOST \
  -U $PROD_USER \
  -d $PROD_DB \
  -c "
    SELECT 
      'organizations' as table_name, COUNT(*) as count FROM organizations
    UNION ALL
    SELECT 'organization_users', COUNT(*) FROM organization_users
    UNION ALL
    SELECT 'users', COUNT(*) FROM users
    ORDER BY table_name;
  "

echo ""
echo "✅ Verificação concluída!"
echo ""
echo "💡 Próximos passos:"
echo "   1. Testar login no sistema"
echo "   2. Verificar logs da aplicação"
echo "   3. Testar criação de clientes e usuários"
echo "   4. Testar multi-contexto"
