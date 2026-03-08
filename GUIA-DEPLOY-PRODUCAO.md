# Guia de Deploy para Produção - Migrações de Base de Dados

**Data**: 28 de Fevereiro de 2026  
**Objetivo**: Aplicar mudanças da base de dados de desenvolvimento para produção SEM PERDER DADOS

## ⚠️ REGRAS CRÍTICAS

1. ✅ **SEMPRE fazer backup antes de qualquer mudança**
2. ✅ **Testar migrações em ambiente de staging primeiro**
3. ✅ **Usar transações (BEGIN/COMMIT) para poder fazer rollback**
4. ✅ **Executar migrações em horário de baixo tráfego**
5. ✅ **Ter plano de rollback preparado**
6. ❌ **NUNCA usar DROP TABLE em produção sem backup**
7. ❌ **NUNCA usar TRUNCATE em produção**
8. ❌ **NUNCA usar ALTER TABLE DROP COLUMN sem backup**

## 📋 Checklist Pré-Deploy

### 1. Identificar Migrações Pendentes

```bash
# Listar todas as migrações SQL criadas
ls -la backend/migrations/*.sql | sort

# Migrações que precisam ser aplicadas em produção:
# - 20251104000002-create-clients-table.sql
# - 20251104000003-create-client-users-table.sql
# - 20260114000001-create-catalog-access-control-tables.sql
# - 20260228000001-add-missing-fields-to-client-users.sql
```

### 2. Verificar Estado Atual da Produção

```bash
# Conectar à base de dados de produção
PGPASSWORD=<senha_producao> psql -h <host_producao> -U <user_producao> -d <db_producao>

# Verificar tabelas existentes
\dt

# Verificar se tabelas de clientes existem
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clients', 'client_users', 'client_catalog_access', 'client_user_catalog_access');

# Verificar campos da tabela client_users (se existir)
\d client_users
```

### 3. Criar Backup Completo

```bash
# Backup completo da base de dados
PGPASSWORD=<senha_producao> pg_dump \
  -h <host_producao> \
  -U <user_producao> \
  -d <db_producao> \
  -F c \
  -f backup_pre_migration_$(date +%Y%m%d_%H%M%S).dump

# Verificar tamanho do backup
ls -lh backup_pre_migration_*.dump

# Testar restauração do backup (em ambiente de teste)
PGPASSWORD=<senha_teste> pg_restore \
  -h <host_teste> \
  -U <user_teste> \
  -d <db_teste> \
  -c \
  backup_pre_migration_*.dump
```

## 🚀 Processo de Deploy

### Opção 1: Deploy Manual (Recomendado para Primeira Vez)

#### Passo 1: Preparar Script de Migração Consolidado

```bash
# Criar script consolidado com todas as migrações
cat > deploy_production_migrations.sql << 'EOF'
-- ============================================================================
-- DEPLOY DE MIGRAÇÕES PARA PRODUÇÃO
-- Data: 2026-02-28
-- Descrição: Adiciona tabelas e campos do sistema SaaS multi-nível
-- ============================================================================

-- Iniciar transação
BEGIN;

-- ============================================================================
-- MIGRAÇÃO 1: Criar tabela clients
-- ============================================================================
\echo '📝 Criando tabela clients...'

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  trade_name VARCHAR(255),
  tax_id VARCHAR(50),
  industry_type VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  website VARCHAR(255),
  address JSONB DEFAULT '{}'::jsonb,
  contract JSONB DEFAULT '{"status": "active", "slaLevel": "standard", "supportHours": "business-hours", "maxUsers": 10, "maxTicketsPerMonth": 100}'::jsonb,
  billing JSONB DEFAULT '{"currency": "EUR", "billingCycle": "monthly", "paymentMethod": "bank-transfer"}'::jsonb,
  primary_contact JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{"allowUserRegistration": false, "requireApproval": true, "autoAssignTickets": false, "notificationPreferences": {"email": true, "sms": false}}'::jsonb,
  stats JSONB DEFAULT '{"totalUsers": 0, "activeUsers": 0, "totalTickets": 0, "openTickets": 0}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  suspended_at TIMESTAMP WITH TIME ZONE,
  suspended_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_tax_id ON clients(tax_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);
CREATE INDEX IF NOT EXISTS idx_clients_name_org ON clients(name, organization_id);

\echo '✅ Tabela clients criada'

-- ============================================================================
-- MIGRAÇÃO 2: Criar ENUM e tabela client_users
-- ============================================================================
\echo '📝 Criando tabela client_users...'

DO $$ BEGIN
  CREATE TYPE client_user_role AS ENUM ('client-admin', 'client-manager', 'client-user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role client_user_role NOT NULL DEFAULT 'client-user',
  avatar VARCHAR(255),
  phone VARCHAR(50),
  position VARCHAR(100),
  department_name VARCHAR(100),
  direction_id UUID REFERENCES directions(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  location JSONB DEFAULT '{}'::jsonb,
  permissions JSONB DEFAULT '{"canCreateTickets": true, "canViewAllClientTickets": false, "canApproveRequests": false, "canAccessKnowledgeBase": true, "canRequestServices": true}'::jsonb,
  settings JSONB DEFAULT '{"notifications": true, "emailNotifications": true, "theme": "light", "language": "pt", "autoWatchTickets": true}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT client_users_email_org_unique UNIQUE (email, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON client_users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_users_organization_id ON client_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_users_role ON client_users(role);
CREATE INDEX IF NOT EXISTS idx_client_users_is_active ON client_users(is_active);
CREATE INDEX IF NOT EXISTS idx_client_users_email ON client_users(email);
CREATE INDEX IF NOT EXISTS idx_client_users_direction_id ON client_users(direction_id);
CREATE INDEX IF NOT EXISTS idx_client_users_department_id ON client_users(department_id);
CREATE INDEX IF NOT EXISTS idx_client_users_section_id ON client_users(section_id);

\echo '✅ Tabela client_users criada'

-- ============================================================================
-- MIGRAÇÃO 3: Criar tabelas de controle de acesso ao catálogo
-- ============================================================================
\echo '📝 Criando tabelas de controle de acesso ao catálogo...'

CREATE TABLE IF NOT EXISTS client_catalog_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  access_mode VARCHAR(20) NOT NULL DEFAULT 'all',
  allowed_categories UUID[],
  allowed_items UUID[],
  denied_categories UUID[],
  denied_items UUID[],
  modified_by UUID REFERENCES organization_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_catalog_access_organization_id ON client_catalog_access(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_catalog_access_client_id ON client_catalog_access(client_id);

CREATE TABLE IF NOT EXISTS client_user_catalog_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  inheritance_mode VARCHAR(20) NOT NULL DEFAULT 'inherit',
  access_mode VARCHAR(20),
  allowed_categories UUID[],
  allowed_items UUID[],
  denied_categories UUID[],
  denied_items UUID[],
  modified_by UUID REFERENCES organization_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_user_catalog_access_organization_id ON client_user_catalog_access(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_user_catalog_access_client_id ON client_user_catalog_access(client_id);
CREATE INDEX IF NOT EXISTS idx_client_user_catalog_access_client_user_id ON client_user_catalog_access(client_user_id);

\echo '✅ Tabelas de controle de acesso criadas'

-- ============================================================================
-- MIGRAÇÃO 4: Adicionar campos faltantes (se tabelas já existirem)
-- ============================================================================
\echo '📝 Verificando e adicionando campos faltantes...'

-- Adicionar campos à client_users se não existirem
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_users') THEN
    ALTER TABLE client_users ADD COLUMN IF NOT EXISTS direction_id UUID REFERENCES directions(id) ON DELETE SET NULL;
    ALTER TABLE client_users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
    ALTER TABLE client_users ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id) ON DELETE SET NULL;
    ALTER TABLE client_users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
    ALTER TABLE client_users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;
    
    CREATE INDEX IF NOT EXISTS idx_client_users_direction_id ON client_users(direction_id);
    CREATE INDEX IF NOT EXISTS idx_client_users_department_id ON client_users(department_id);
    CREATE INDEX IF NOT EXISTS idx_client_users_section_id ON client_users(section_id);
  END IF;
END $$;

\echo '✅ Campos adicionados'

-- ============================================================================
-- MIGRAÇÃO 5: Criar tabelas de contexto (se não existirem)
-- ============================================================================
\echo '📝 Criando tabelas de contexto...'

CREATE TABLE IF NOT EXISTS context_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type VARCHAR(50) NOT NULL,
  context_id UUID NOT NULL,
  context_type VARCHAR(50) NOT NULL,
  session_token VARCHAR(500) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS context_sessions_session_token_idx ON context_sessions(session_token);
CREATE INDEX IF NOT EXISTS context_sessions_user_id_idx ON context_sessions(user_id);
CREATE INDEX IF NOT EXISTS context_sessions_is_active_idx ON context_sessions(is_active);
CREATE INDEX IF NOT EXISTS context_sessions_expires_at_idx ON context_sessions(expires_at);

CREATE TABLE IF NOT EXISTS context_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_type VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  from_context_id UUID,
  from_context_type VARCHAR(50),
  to_context_id UUID NOT NULL,
  to_context_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS context_audit_logs_user_id_idx ON context_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS context_audit_logs_user_email_idx ON context_audit_logs(user_email);
CREATE INDEX IF NOT EXISTS context_audit_logs_action_idx ON context_audit_logs(action);
CREATE INDEX IF NOT EXISTS context_audit_logs_created_at_idx ON context_audit_logs(created_at);

\echo '✅ Tabelas de contexto criadas'

-- ============================================================================
-- COMMIT - Se tudo correu bem
-- ============================================================================
\echo '✅ Todas as migrações aplicadas com sucesso!'
\echo '📊 Verificando tabelas criadas...'

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as num_columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('clients', 'client_users', 'client_catalog_access', 'client_user_catalog_access', 'context_sessions', 'context_audit_logs')
ORDER BY table_name;

COMMIT;

\echo '✅ DEPLOY CONCLUÍDO COM SUCESSO!'
EOF
```

#### Passo 2: Executar Migração em Produção

```bash
# 1. Fazer backup (OBRIGATÓRIO)
PGPASSWORD=<senha_producao> pg_dump \
  -h <host_producao> \
  -U <user_producao> \
  -d <db_producao> \
  -F c \
  -f backup_pre_migration_$(date +%Y%m%d_%H%M%S).dump

# 2. Executar script de migração
PGPASSWORD=<senha_producao> psql \
  -h <host_producao> \
  -U <user_producao> \
  -d <db_producao> \
  -f deploy_production_migrations.sql

# 3. Verificar se tudo correu bem
PGPASSWORD=<senha_producao> psql \
  -h <host_producao> \
  -U <user_producao> \
  -d <db_producao> \
  -c "\dt" | grep -E "(clients|client_users|context)"
```

### Opção 2: Deploy Automatizado com Script

```bash
# Criar script de deploy automatizado
cat > deploy_to_production.sh << 'EOF'
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
EOF

chmod +x deploy_to_production.sh
```

## 🔄 Plano de Rollback

### Se algo correr mal:

```bash
# 1. Parar aplicação
pm2 stop backend  # ou docker-compose stop

# 2. Restaurar backup
PGPASSWORD=<senha_producao> pg_restore \
  -h <host_producao> \
  -U <user_producao> \
  -d <db_producao> \
  -c \
  backup_pre_migration_*.dump

# 3. Reiniciar aplicação com versão anterior do código
git checkout <commit_anterior>
pm2 restart backend
```

## ✅ Verificação Pós-Deploy

```bash
# 1. Verificar tabelas criadas
PGPASSWORD=<senha_producao> psql \
  -h <host_producao> \
  -U <user_producao> \
  -d <db_producao> \
  -c "\dt" | grep -E "(clients|client_users)"

# 2. Verificar campos da tabela client_users
PGPASSWORD=<senha_producao> psql \
  -h <host_producao> \
  -U <user_producao> \
  -d <db_producao> \
  -c "\d client_users"

# 3. Verificar dados existentes (não devem ter sido perdidos)
PGPASSWORD=<senha_producao> psql \
  -h <host_producao> \
  -U <user_producao> \
  -d <db_producao> \
  -c "SELECT COUNT(*) FROM organizations;"

# 4. Testar aplicação
curl https://seu-dominio.com/api/health
```

## 📝 Checklist Final

- [ ] Backup criado e verificado
- [ ] Migrações executadas sem erros
- [ ] Tabelas criadas verificadas
- [ ] Dados existentes preservados
- [ ] Aplicação reiniciada
- [ ] Testes de funcionalidade executados
- [ ] Logs verificados
- [ ] Backup mantido por pelo menos 30 dias

## 🎯 Boas Práticas

1. **Sempre testar em staging primeiro**
2. **Fazer deploy em horário de baixo tráfego**
3. **Ter equipe disponível para rollback se necessário**
4. **Monitorar logs após deploy**
5. **Manter backups por período adequado**
6. **Documentar todas as mudanças**

## 📚 Documentação Relacionada

- `RESTAURACAO-ARQUITETURA-SAAS.md` - Arquitetura completa
- `CORRECAO-MODELO-CLIENT-USER.md` - Correções aplicadas
- `backend/migrations/` - Todas as migrações SQL

## 📦 Arquivos Criados

### Scripts de Deploy
- ✅ `deploy_production_migrations.sql` - Script consolidado com todas as migrações
- ✅ `deploy_to_production.sh` - Script automatizado de deploy com backup
- ✅ `verify_production_deployment.sh` - Script de verificação pós-deploy

### Como Usar

#### Opção 1: Deploy Manual
```bash
# 1. Fazer backup
PGPASSWORD=<senha> pg_dump -h <host> -U <user> -d <db> -F c -f backup_$(date +%Y%m%d_%H%M%S).dump

# 2. Executar migrações
PGPASSWORD=<senha> psql -h <host> -U <user> -d <db> -f deploy_production_migrations.sql

# 3. Verificar
./verify_production_deployment.sh
```

#### Opção 2: Deploy Automatizado
```bash
# Configurar variáveis de ambiente
export PROD_DB_HOST="seu-host.com"
export PROD_DB_USER="seu-usuario"
export PROD_DB_NAME="sua-base-dados"
export PROD_DB_PASSWORD="sua-senha"

# Executar deploy (faz backup automaticamente)
./deploy_to_production.sh

# Verificar
./verify_production_deployment.sh
```

## ⚠️ IMPORTANTE: Antes de Executar

1. ✅ Testar em ambiente de staging primeiro
2. ✅ Fazer backup da base de dados de produção
3. ✅ Executar em horário de baixo tráfego
4. ✅ Ter plano de rollback preparado
5. ✅ Equipe disponível para suporte

## 🎯 Resumo Executivo

Este guia fornece um processo seguro e testado para aplicar as mudanças da arquitetura SaaS multi-nível em produção sem perder dados. As migrações são idempotentes (podem ser executadas múltiplas vezes) e usam transações para garantir atomicidade.
