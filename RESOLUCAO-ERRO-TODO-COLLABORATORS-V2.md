# Resolução do Erro: todo_collaborators_v2 não existe

## Problema Identificado

Erro nos logs do backend:
```
relation "todo_collaborators_v2" does not exist
```

Este erro ocorria ao acessar o endpoint `/api/organization/todos` porque a tabela `todo_collaborators_v2` não existia no banco de dados.

## Causa Raiz

A migração `backend/migrations/create-todos-v2-tables.sql` que cria as tabelas do sistema de todos V2 não havia sido executada no banco de dados.

## Solução Implementada

### 1. Migração Executada

Executei a migração que cria duas tabelas:

- `todos_v2` - Tabela principal de tarefas com suporte multi-tenant
- `todo_collaborators_v2` - Tabela de colaboradores que suporta org e client users

### 2. Estrutura das Tabelas Criadas

#### Tabela `todos_v2`:
- `id` (UUID, PK)
- `organization_id` (UUID, FK para organizations)
- `owner_id` (UUID)
- `owner_type` (VARCHAR: 'organization' ou 'client')
- `title` (VARCHAR 255)
- `description` (TEXT)
- `status` (VARCHAR: 'todo', 'in_progress', 'done')
- `priority` (VARCHAR: 'low', 'medium', 'high')
- `due_date` (TIMESTAMP)
- `order` (INTEGER)
- `color` (VARCHAR 7)
- `created_at`, `updated_at` (TIMESTAMP)

#### Tabela `todo_collaborators_v2`:
- `id` (UUID, PK)
- `todo_id` (UUID, FK para todos_v2)
- `user_id` (UUID)
- `user_type` (VARCHAR: 'organization' ou 'client')
- `client_id` (UUID, FK para clients)
- `can_edit` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)
- UNIQUE constraint em (todo_id, user_id, user_type)

### 3. Scripts Criados

- `backend/src/scripts/run-todos-v2-migration.js` - Script que executa a migração
- `backend/src/scripts/test-todos-v2-endpoint.js` - Script para testar o endpoint

## Verificação

A migração foi executada com sucesso:
```
✅ Migração executada com sucesso!
✅ todos_v2: Existe
✅ todo_collaborators_v2: Existe
```

## Próximos Passos

### IMPORTANTE: Reiniciar o Servidor Backend

Para que as mudanças tenham efeito, você precisa reiniciar o servidor backend:

```bash
# Se estiver rodando com npm/yarn
# Pare o servidor (Ctrl+C) e inicie novamente:
cd backend
npm run dev
# ou
yarn dev

# Se estiver rodando com PM2
pm2 restart backend
```

### Testar o Endpoint

Após reiniciar o servidor, você pode testar o endpoint:

```bash
cd backend
node src/scripts/test-todos-v2-endpoint.js
```

Ou acesse diretamente no frontend:
1. Faça logout e login novamente
2. Acesse o menu "Tarefas" ou "Todos"
3. O erro não deve mais aparecer

## Arquivos Modificados/Criados

- ✅ `backend/migrations/create-todos-v2-tables.sql` (já existia)
- ✅ `backend/src/modules/todos/todoModelV2.js` (já existia)
- ✅ `backend/src/modules/todos/todoControllerV2.js` (já existia)
- ✅ `backend/src/scripts/run-todos-v2-migration.js` (criado)
- ✅ `backend/src/scripts/test-todos-v2-endpoint.js` (criado)

## Status

✅ **RESOLVIDO** - Tabelas criadas com sucesso no banco de dados

⚠️ **AÇÃO NECESSÁRIA** - Reiniciar o servidor backend para aplicar as mudanças
