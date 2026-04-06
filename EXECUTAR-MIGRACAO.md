# Como Executar a Migração de Dados

## Pré-requisitos

✅ PostgreSQL instalado e rodando
✅ Banco de desenvolvimento ativo (`tatuticket`)
✅ Backups disponíveis:
  - Produção: `/Users/pedrodivino/Dev/ticket/backend/backups/tatuticket_20260315_201256.sql`
  - Desenvolvimento: `/Users/pedrodivino/Dev/ticket/backend/backups/tatuticket_20260402_184400.sql`

## Configuração Verificada

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=tatuticket
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

## Passo a Passo

### 1. Verificar Conexão com Banco

```bash
psql -h localhost -U postgres -d tatuticket -c "SELECT COUNT(*) FROM clients;"
```

Se conectar com sucesso, você está pronto.

### 2. Executar Script de Migração

```bash
cd backend
node scripts/migrate-prod-to-dev-real.js
```

### 3. Acompanhar Progresso

O script irá:
1. ✅ Criar backup do estado atual
2. ✅ Identificar 82 tabelas comuns
3. ✅ Preservar 7 tabelas novas de desenvolvimento
4. ✅ Limpar tabelas comuns
5. ✅ Restaurar dados de produção
6. ✅ Validar integridade

### 4. Verificar Resultado

Após a execução, o script mostrará:
- Contagem de clientes
- Contagem de usuários
- Contagem de tickets
- Contagem de comentários
- Status das tabelas preservadas

## O Que Será Migrado

### Dados de Produção (82 tabelas)
- ✅ 10 clientes
- ✅ 14 client_users
- ✅ 20 organization_users
- ✅ 65 tickets
- ✅ Comentários, anexos, categorias, etc.

### Dados Preservados (7 tabelas)
- ✅ context_audit_logs
- ✅ context_sessions
- ✅ catalog_access_audit_logs
- ✅ catalog_access_control
- ✅ todo_collaborators_v2
- ✅ todos_v2
- ✅ user_permissions

## Segurança

### Backup Automático
Antes de qualquer operação, o script cria:
```
backend/backups/migration-work/dev-before-migration-TIMESTAMP.sql
```

### Rollback (Se Necessário)
```bash
# Restaurar estado anterior
psql -h localhost -U postgres -d tatuticket < backend/backups/migration-work/dev-before-migration-TIMESTAMP.sql
```

## Tempo Estimado

- Backup atual: ~30 segundos
- Limpeza de tabelas: ~10 segundos
- Restauração de produção: ~1-2 minutos
- Validação: ~5 segundos

**Total**: ~2-3 minutos

## Possíveis Avisos (Normais)

Durante a restauração, você pode ver:
- `NOTICE: relation "..." already exists` - Normal, estruturas já existem
- `ERROR: role "..." does not exist` - Ignorado, não afeta dados
- Avisos sobre constraints - Normal durante restauração

## Validação Pós-Migração

### Verificar Dados Migrados
```bash
psql -h localhost -U postgres -d tatuticket
```

```sql
-- Contar registros principais
SELECT 'clients' as tabela, COUNT(*) FROM clients
UNION ALL
SELECT 'client_users', COUNT(*) FROM client_users
UNION ALL
SELECT 'organization_users', COUNT(*) FROM organization_users
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'comments', COUNT(*) FROM comments;
```

### Verificar Tabelas Preservadas
```sql
-- Verificar que tabelas novas ainda existem
SELECT 'context_sessions' as tabela, COUNT(*) FROM context_sessions
UNION ALL
SELECT 'context_audit_logs', COUNT(*) FROM context_audit_logs
UNION ALL
SELECT 'catalog_access_audit_logs', COUNT(*) FROM catalog_access_audit_logs;
```

## Resultado Esperado

```
Clientes: 10
Usuários de Cliente: 14
Usuários de Organização: 20
Tickets: 65
Comentários: [número variável]
Sessões de Contexto: [preservado]
Logs de Auditoria: [preservado]
```

## Troubleshooting

### Erro: "psql: command not found"
```bash
# Adicionar PostgreSQL ao PATH
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
```

### Erro: "password authentication failed"
Verificar senha em `backend/.env`:
```env
POSTGRES_PASSWORD=postgres
```

### Erro: "database does not exist"
Criar banco:
```bash
createdb -h localhost -U postgres tatuticket
```

### Erro: "permission denied"
Dar permissão ao script:
```bash
chmod +x backend/scripts/migrate-prod-to-dev-real.js
```

## Próximos Passos Após Migração

1. ✅ Testar login no sistema
2. ✅ Verificar multi-contexto funcionando
3. ✅ Testar criação de tickets
4. ✅ Verificar catálogo de serviços
5. ✅ Validar permissões de usuários

## Suporte

Se encontrar problemas:
1. Verificar logs do script
2. Verificar backup foi criado
3. Restaurar backup se necessário
4. Reportar erro com detalhes
