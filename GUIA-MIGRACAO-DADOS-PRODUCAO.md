# Guia de Migração: Dados de Produção → Desenvolvimento

## Situação

Você tem dois backups:
- **Produção** (`tatuticket_20260315_201256.sql`): Contém dados importantes que não podem ser perdidos
- **Desenvolvimento** (`tatuticket_20260402_184400.sql`): Contém estrutura atualizada com novas tabelas

## Problema

O banco de desenvolvimento sofreu alterações na estrutura:
- Novas tabelas: `context_sessions`, `context_audit_logs`, `catalog_access_audit_logs`
- Novos ENUMs: `context_audit_action`, `context_type`, `catalog_access_type`
- Alteração em constraints: `client_users` agora permite mesmo email em múltiplos clientes
- Novos campos em tabelas existentes

## Soluções Disponíveis

### Opção 1: Script Node.js Completo (Recomendado)

Script robusto com validação, rollback e relatórios detalhados.

```bash
# Instalar dependências se necessário
cd backend
npm install

# Executar em modo dry-run (simulação)
node scripts/migrate-production-to-dev.js --dry-run

# Executar migração real
node scripts/migrate-production-to-dev.js

# Forçar sem confirmação
node scripts/migrate-production-to-dev.js --force
```

**Vantagens:**
- ✅ Validação completa de integridade
- ✅ Backup automático antes de migrar
- ✅ Modo dry-run para testar
- ✅ Relatórios detalhados
- ✅ Rollback em caso de erro

**Desvantagens:**
- ❌ Requer Node.js e dependências instaladas

### Opção 2: Script Shell Simples

Script bash que usa apenas comandos PostgreSQL nativos.

```bash
# Dar permissão de execução
chmod +x backend/scripts/migrate-simple.sh

# Executar
./backend/scripts/migrate-simple.sh
```

**Vantagens:**
- ✅ Não requer dependências Node.js
- ✅ Usa apenas comandos PostgreSQL
- ✅ Mais rápido para executar
- ✅ Fácil de entender e modificar

**Desvantagens:**
- ❌ Menos validações
- ❌ Sem modo dry-run
- ❌ Relatórios mais simples

### Opção 3: Manual via pgAdmin/psql

Para quem prefere controle total do processo.

#### Passo 1: Backup do Banco Atual

```bash
pg_dump -h localhost -U postgres -d tatuticket -F p -f backup-pre-migration.sql
```

#### Passo 2: Criar Banco Temporário

```sql
CREATE DATABASE tatuticket_temp;
```

#### Passo 3: Restaurar Backup de Produção no Temporário

```bash
psql -h localhost -U postgres -d tatuticket_temp -f backend/backups/tatuticket_20260315_201256.sql
```

#### Passo 4: Copiar Dados Seletivamente

```sql
-- Conectar ao banco de desenvolvimento
\c tatuticket

-- Desabilitar triggers temporariamente
SET session_replication_role = 'replica';

-- Copiar organizations
INSERT INTO organizations 
SELECT * FROM tatuticket_temp.organizations
ON CONFLICT (id) DO NOTHING;

-- Copiar organization_users
INSERT INTO organization_users 
SELECT * FROM tatuticket_temp.organization_users
ON CONFLICT (id) DO NOTHING;

-- Copiar clients
INSERT INTO clients 
SELECT * FROM tatuticket_temp.clients
ON CONFLICT (id) DO NOTHING;

-- Copiar client_users (remover constraint UNIQUE primeiro)
ALTER TABLE client_users DROP CONSTRAINT IF EXISTS client_users_email_key;

INSERT INTO client_users 
SELECT * FROM tatuticket_temp.client_users
ON CONFLICT (id) DO NOTHING;

-- Copiar tickets
INSERT INTO tickets 
SELECT * FROM tatuticket_temp.tickets
ON CONFLICT (id) DO NOTHING;

-- Copiar ticket_messages
INSERT INTO ticket_messages 
SELECT * FROM tatuticket_temp.ticket_messages
ON CONFLICT (id) DO NOTHING;

-- Copiar ticket_attachments
INSERT INTO ticket_attachments 
SELECT * FROM tatuticket_temp.ticket_attachments
ON CONFLICT (id) DO NOTHING;

-- Reabilitar triggers
SET session_replication_role = 'origin';

-- Atualizar sequences
SELECT setval('organizations_id_seq', (SELECT MAX(id) FROM organizations));
SELECT setval('organization_users_id_seq', (SELECT MAX(id) FROM organization_users));
SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients));
SELECT setval('client_users_id_seq', (SELECT MAX(id) FROM client_users));
SELECT setval('tickets_id_seq', (SELECT MAX(id) FROM tickets));
SELECT setval('ticket_messages_id_seq', (SELECT MAX(id) FROM ticket_messages));
```

#### Passo 5: Validar Dados

```sql
-- Contar registros
SELECT 'Organizations' as tabela, COUNT(*) FROM organizations
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

-- Verificar integridade de foreign keys
SELECT COUNT(*) as tickets_invalidos
FROM tickets t 
WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = t.organization_id);

SELECT COUNT(*) as client_users_invalidos
FROM client_users cu 
WHERE NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = cu.client_id);
```

#### Passo 6: Limpar Banco Temporário

```sql
DROP DATABASE tatuticket_temp;
```

## Tabelas Importantes

### Tabelas Existentes (Produção)
- `organizations` - Organizações
- `organization_users` - Usuários de organização
- `clients` - Empresas clientes
- `client_users` - Usuários de empresas clientes
- `tickets` - Tickets de suporte
- `ticket_messages` - Mensagens dos tickets
- `ticket_attachments` - Anexos dos tickets
- `categories` - Categorias de tickets
- `priorities` - Prioridades
- `ticket_types` - Tipos de ticket
- `slas` - SLAs configurados

### Tabelas Novas (Desenvolvimento)
- `context_sessions` - Sessões de contexto multi-organização
- `context_audit_logs` - Logs de auditoria de contexto
- `catalog_access_audit_logs` - Logs de acesso ao catálogo

## Alterações Importantes

### 1. Constraint em `client_users`

**Antes (Produção):**
```sql
UNIQUE(email) -- Email único globalmente
```

**Depois (Desenvolvimento):**
```sql
UNIQUE(email, client_id) -- Email único por cliente
```

Isso permite que o mesmo email exista em múltiplos clientes.

### 2. Novos ENUMs

```sql
-- Tipo de contexto
CREATE TYPE context_type AS ENUM ('organization', 'client');

-- Ação de auditoria de contexto
CREATE TYPE context_audit_action AS ENUM ('login', 'switch', 'logout');

-- Tipo de acesso ao catálogo
CREATE TYPE catalog_access_type AS ENUM ('view', 'request', 'approve', 'reject');
```

## Validações Pós-Migração

### 1. Verificar Contagem de Registros

```sql
SELECT 
    (SELECT COUNT(*) FROM organizations) as organizations,
    (SELECT COUNT(*) FROM organization_users) as org_users,
    (SELECT COUNT(*) FROM clients) as clients,
    (SELECT COUNT(*) FROM client_users) as client_users,
    (SELECT COUNT(*) FROM tickets) as tickets,
    (SELECT COUNT(*) FROM ticket_messages) as messages;
```

### 2. Verificar Integridade Referencial

```sql
-- Tickets sem organização válida
SELECT t.id, t.subject, t.organization_id
FROM tickets t
LEFT JOIN organizations o ON o.id = t.organization_id
WHERE o.id IS NULL;

-- Client users sem cliente válido
SELECT cu.id, cu.email, cu.client_id
FROM client_users cu
LEFT JOIN clients c ON c.id = cu.client_id
WHERE c.id IS NULL;

-- Tickets sem cliente válido
SELECT t.id, t.subject, t.client_id
FROM tickets t
LEFT JOIN clients c ON c.id = t.client_id
WHERE t.client_id IS NOT NULL AND c.id IS NULL;
```

### 3. Verificar Duplicações

```sql
-- Emails duplicados em client_users (esperado após migração)
SELECT email, COUNT(*) as count
FROM client_users
GROUP BY email
HAVING COUNT(*) > 1;

-- IDs duplicados (NÃO esperado)
SELECT id, COUNT(*) as count
FROM client_users
GROUP BY id
HAVING COUNT(*) > 1;
```

## Rollback em Caso de Problema

Se algo der errado durante a migração:

```bash
# Restaurar backup anterior
psql -h localhost -U postgres -d postgres -c "DROP DATABASE tatuticket;"
psql -h localhost -U postgres -d postgres -c "CREATE DATABASE tatuticket;"
psql -h localhost -U postgres -d tatuticket -f backup-pre-migration.sql
```

## Checklist Pós-Migração

- [ ] Backup do banco atual criado
- [ ] Migração executada sem erros
- [ ] Contagem de registros validada
- [ ] Integridade referencial verificada
- [ ] Aplicação testada (login, tickets, etc.)
- [ ] Migrations pendentes executadas
- [ ] Logs de erro verificados
- [ ] Performance testada
- [ ] Backup final criado

## Troubleshooting

### Erro: "duplicate key value violates unique constraint"

**Causa:** Dados já existem no banco de desenvolvimento.

**Solução:** Use `ON CONFLICT (id) DO NOTHING` nos INSERTs ou limpe as tabelas antes.

### Erro: "foreign key constraint violation"

**Causa:** Ordem incorreta de inserção de dados.

**Solução:** Siga a ordem correta:
1. organizations
2. organization_users
3. clients
4. client_users
5. categories, priorities, ticket_types, slas
6. tickets
7. ticket_messages, ticket_attachments

### Erro: "column does not exist"

**Causa:** Estrutura de tabela diferente entre produção e desenvolvimento.

**Solução:** Execute migrations pendentes antes da migração:

```bash
cd backend
npx sequelize-cli db:migrate
```

### Sequences Desatualizados

**Sintoma:** Erro ao criar novos registros após migração.

**Solução:**

```sql
-- Atualizar todas as sequences
SELECT 'SELECT SETVAL(' ||
       quote_literal(quote_ident(sequence_namespace.nspname) || '.' || quote_ident(class_sequence.relname)) ||
       ', COALESCE(MAX(' ||quote_ident(pg_attribute.attname)|| '), 1) ) FROM ' ||
       quote_ident(table_namespace.nspname)|| '.'||quote_ident(class_table.relname)|| ';'
FROM pg_depend 
INNER JOIN pg_class AS class_sequence ON class_sequence.oid = pg_depend.objid 
INNER JOIN pg_class AS class_table ON class_table.oid = pg_depend.refobjid
INNER JOIN pg_attribute ON pg_attribute.attrelid = class_table.oid AND pg_attribute.attnum = pg_depend.refobjsubid
INNER JOIN pg_namespace as table_namespace ON table_namespace.oid = class_table.relnamespace
INNER JOIN pg_namespace AS sequence_namespace ON sequence_namespace.oid = class_sequence.relnamespace
WHERE class_sequence.relkind = 'S';
```

## Recomendações

1. **Sempre faça backup antes de migrar**
2. **Teste em ambiente de desenvolvimento primeiro**
3. **Execute em horário de baixo tráfego**
4. **Monitore logs durante e após migração**
5. **Valide dados críticos manualmente**
6. **Mantenha backup de produção seguro**
7. **Documente qualquer problema encontrado**

## Suporte

Se encontrar problemas durante a migração:

1. Verifique os logs do PostgreSQL
2. Execute as queries de validação
3. Consulte a documentação do Sequelize
4. Restaure o backup se necessário

## Próximos Passos Após Migração

1. Executar migrations pendentes:
   ```bash
   cd backend
   npx sequelize-cli db:migrate
   ```

2. Testar sistema multi-contexto:
   - Login com usuário de organização
   - Login com usuário de cliente
   - Troca de contexto
   - Criação de tickets

3. Verificar permissões:
   - Usuários têm acesso correto
   - Contextos carregam permissões certas

4. Monitorar performance:
   - Queries lentas
   - Uso de memória
   - Conexões ao banco

5. Criar backup final:
   ```bash
   pg_dump -h localhost -U postgres -d tatuticket -F c -f backup-pos-migracao.dump
   ```
