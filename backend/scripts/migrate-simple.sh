#!/bin/bash

###############################################################################
# Script de Migração Simples: Produção → Desenvolvimento
#
# Este script restaura o backup de produção em um banco temporário,
# depois copia os dados para o banco de desenvolvimento preservando
# as novas tabelas e estruturas.
#
# Uso:
#   chmod +x backend/scripts/migrate-simple.sh
#   ./backend/scripts/migrate-simple.sh
###############################################################################

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuração (ajuste conforme seu .env)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-tatuticket}"
DB_PASSWORD="${DB_PASSWORD:-}"

PROD_BACKUP="backend/backups/tatuticket_20260315_201256.sql"
TEMP_DB="tatuticket_temp_migration"

# Funções auxiliares
log_section() {
    echo ""
    echo "============================================================"
    echo -e "${BLUE}$1${NC}"
    echo "============================================================"
    echo ""
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Verificar se psql está instalado
if ! command -v psql &> /dev/null; then
    log_error "psql não encontrado. Instale o PostgreSQL client."
    exit 1
fi

# Verificar se arquivo de backup existe
if [ ! -f "$PROD_BACKUP" ]; then
    log_error "Backup de produção não encontrado: $PROD_BACKUP"
    exit 1
fi

log_section "Script de Migração: Produção → Desenvolvimento"

log_info "Configuração:"
echo "  Host: $DB_HOST"
echo "  Porta: $DB_PORT"
echo "  Usuário: $DB_USER"
echo "  Banco de Desenvolvimento: $DB_NAME"
echo "  Banco Temporário: $TEMP_DB"
echo "  Backup de Produção: $PROD_BACKUP"
echo ""

# Confirmar com usuário
read -p "Deseja continuar? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    log_warning "Migração cancelada pelo usuário"
    exit 0
fi

# Exportar senha para comandos psql
export PGPASSWORD="$DB_PASSWORD"

# 1. Criar backup do banco de desenvolvimento atual
log_section "1. Backup do Banco de Desenvolvimento Atual"

BACKUP_FILE="backend/backups/pre-migration-$(date +%Y%m%d_%H%M%S).sql"
log_info "Criando backup em: $BACKUP_FILE"

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    log_success "Backup criado com sucesso"
else
    log_error "Erro ao criar backup"
    exit 1
fi

# 2. Criar banco temporário
log_section "2. Criando Banco Temporário"

log_info "Removendo banco temporário se existir..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $TEMP_DB;" 2>/dev/null

log_info "Criando banco temporário: $TEMP_DB"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $TEMP_DB;"

if [ $? -eq 0 ]; then
    log_success "Banco temporário criado"
else
    log_error "Erro ao criar banco temporário"
    exit 1
fi

# 3. Restaurar backup de produção no banco temporário
log_section "3. Restaurando Backup de Produção"

log_info "Restaurando $PROD_BACKUP em $TEMP_DB..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" -f "$PROD_BACKUP" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    log_success "Backup de produção restaurado no banco temporário"
else
    log_error "Erro ao restaurar backup de produção"
    exit 1
fi

# 4. Copiar dados do banco temporário para desenvolvimento
log_section "4. Copiando Dados para Banco de Desenvolvimento"

log_info "Gerando script de migração..."

# Criar script SQL de migração
cat > /tmp/migrate_data.sql <<EOF
-- Desabilitar triggers temporariamente
SET session_replication_role = 'replica';

-- Limpar dados existentes (opcional - comente se quiser manter)
-- TRUNCATE TABLE tickets CASCADE;
-- TRUNCATE TABLE client_users CASCADE;
-- TRUNCATE TABLE organization_users CASCADE;

-- Copiar dados de organizations
INSERT INTO $DB_NAME.public.organizations 
SELECT * FROM $TEMP_DB.public.organizations
ON CONFLICT (id) DO NOTHING;

-- Copiar dados de organization_users
INSERT INTO $DB_NAME.public.organization_users 
SELECT * FROM $TEMP_DB.public.organization_users
ON CONFLICT (id) DO NOTHING;

-- Copiar dados de clients
INSERT INTO $DB_NAME.public.clients 
SELECT * FROM $TEMP_DB.public.clients
ON CONFLICT (id) DO NOTHING;

-- Copiar dados de client_users
-- IMPORTANTE: Remover constraint UNIQUE(email) se existir
ALTER TABLE $DB_NAME.public.client_users DROP CONSTRAINT IF EXISTS client_users_email_key;

INSERT INTO $DB_NAME.public.client_users 
SELECT * FROM $TEMP_DB.public.client_users
ON CONFLICT (id) DO NOTHING;

-- Copiar dados de categories
INSERT INTO $DB_NAME.public.categories 
SELECT * FROM $TEMP_DB.public.categories
ON CONFLICT (id) DO NOTHING;

-- Copiar dados de priorities
INSERT INTO $DB_NAME.public.priorities 
SELECT * FROM $TEMP_DB.public.priorities
ON CONFLICT (id) DO NOTHING;

-- Copiar dados de ticket_types
INSERT INTO $DB_NAME.public.ticket_types 
SELECT * FROM $TEMP_DB.public.ticket_types
ON CONFLICT (id) DO NOTHING;

-- Copiar dados de slas
INSERT INTO $DB_NAME.public.slas 
SELECT * FROM $TEMP_DB.public.slas
ON CONFLICT (id) DO NOTHING;

-- Copiar dados de tickets
INSERT INTO $DB_NAME.public.tickets 
SELECT * FROM $TEMP_DB.public.tickets
ON CONFLICT (id) DO NOTHING;

-- Copiar dados de ticket_messages
INSERT INTO $DB_NAME.public.ticket_messages 
SELECT * FROM $TEMP_DB.public.ticket_messages
ON CONFLICT (id) DO NOTHING;

-- Copiar dados de ticket_attachments
INSERT INTO $DB_NAME.public.ticket_attachments 
SELECT * FROM $TEMP_DB.public.ticket_attachments
ON CONFLICT (id) DO NOTHING;

-- Copiar dados de catalog_categories (se existir)
INSERT INTO $DB_NAME.public.catalog_categories 
SELECT * FROM $TEMP_DB.public.catalog_categories
ON CONFLICT (id) DO NOTHING;

-- Copiar dados de catalog_items (se existir)
INSERT INTO $DB_NAME.public.catalog_items 
SELECT * FROM $TEMP_DB.public.catalog_items
ON CONFLICT (id) DO NOTHING;

-- Reabilitar triggers
SET session_replication_role = 'origin';

-- Atualizar sequences
SELECT setval('organizations_id_seq', (SELECT COALESCE(MAX(id), 1) FROM organizations));
SELECT setval('organization_users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM organization_users));
SELECT setval('clients_id_seq', (SELECT COALESCE(MAX(id), 1) FROM clients));
SELECT setval('client_users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM client_users));
SELECT setval('tickets_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tickets));
SELECT setval('ticket_messages_id_seq', (SELECT COALESCE(MAX(id), 1) FROM ticket_messages));

-- Relatório
SELECT 'Organizations: ' || COUNT(*) FROM organizations;
SELECT 'Organization Users: ' || COUNT(*) FROM organization_users;
SELECT 'Clients: ' || COUNT(*) FROM clients;
SELECT 'Client Users: ' || COUNT(*) FROM client_users;
SELECT 'Tickets: ' || COUNT(*) FROM tickets;
SELECT 'Ticket Messages: ' || COUNT(*) FROM ticket_messages;
EOF

log_info "Executando migração de dados..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /tmp/migrate_data.sql

if [ $? -eq 0 ]; then
    log_success "Dados migrados com sucesso"
else
    log_error "Erro ao migrar dados"
    log_warning "Você pode restaurar o backup em: $BACKUP_FILE"
    exit 1
fi

# 5. Limpar banco temporário
log_section "5. Limpeza"

log_info "Removendo banco temporário..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $TEMP_DB;" 2>/dev/null

log_info "Removendo arquivo temporário..."
rm -f /tmp/migrate_data.sql

log_success "Limpeza concluída"

# 6. Validação
log_section "6. Validação"

log_info "Contando registros no banco de desenvolvimento..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    'Organizations' as tabela, COUNT(*) as registros FROM organizations
UNION ALL
SELECT 'Organization Users', COUNT(*) FROM organization_users
UNION ALL
SELECT 'Clients', COUNT(*) FROM clients
UNION ALL
SELECT 'Client Users', COUNT(*) FROM client_users
UNION ALL
SELECT 'Tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'Ticket Messages', COUNT(*) FROM ticket_messages;
"

# Relatório final
log_section "Migração Concluída!"

log_success "Dados de produção migrados para desenvolvimento"
log_info "Backup do banco anterior salvo em: $BACKUP_FILE"
log_warning "Lembre-se de testar a aplicação antes de usar em produção"

echo ""
echo "Próximos passos:"
echo "  1. Testar a aplicação"
echo "  2. Verificar integridade dos dados"
echo "  3. Executar migrations pendentes se houver"
echo ""

# Limpar variável de senha
unset PGPASSWORD
