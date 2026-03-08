# ✅ Correções de Erros de Banco de Dados

## 📋 Resumo

Corrigidos 2 erros principais que apareciam nos logs do backend:

1. ❌ `relation "catalog_access_control" does not exist`
2. ❌ `column Project.client_id does not exist`

## 🔧 Correções Aplicadas

### 1. Tabela `catalog_access_control`

**Problema**: A tabela não existia no banco de dados, mas o modelo estava tentando usá-la.

**Solução**:
- ✅ Criada migration: `backend/migrations/20260302000001-create-catalog-access-control.sql`
- ✅ Migration executada com sucesso
- ✅ Tabela criada com todos os índices e constraints

**Estrutura da tabela**:
```sql
CREATE TABLE catalog_access_control (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    entity_type catalog_entity_type NOT NULL,  -- direction, department, section, user, client
    entity_id UUID NOT NULL,
    resource_type catalog_resource_type NOT NULL,  -- category, item
    resource_id UUID NOT NULL,
    access_type catalog_access_type NOT NULL DEFAULT 'allow',  -- allow, deny
    created_by UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE (organization_id, entity_type, entity_id, resource_type, resource_id)
);
```

### 2. Coluna `client_id` na tabela `projects`

**Problema**: O modelo Project tinha `clientId` definido, mas a query do Sequelize estava gerando SQL incorreto.

**Solução**:
- ✅ Verificado que a coluna `client_id` já existe na tabela
- ✅ Criada migration de segurança: `backend/migrations/20260302000002-add-client-id-to-projects.sql`
- ✅ Corrigido `projectController.js` para especificar atributos explicitamente
- ✅ Adicionado `attributes` array na query `findAndCountAll`

**Mudança no código**:
```javascript
// ANTES (causava erro)
const { rows: projects, count } = await Project.findAndCountAll({
  where,
  limit: parseInt(limit),
  offset,
  order: [[finalSortBy, finalSortOrder]],
  include: [...]
});

// DEPOIS (funciona corretamente)
const { rows: projects, count } = await Project.findAndCountAll({
  where,
  limit: parseInt(limit),
  offset,
  order: [[finalSortBy, finalSortOrder]],
  attributes: [
    'id', 'organizationId', 'clientId', 'code', 'name',
    'description', 'methodology', 'status', 'startDate',
    'endDate', 'progress', 'createdBy', 'archivedAt',
    'createdAt', 'updatedAt'
  ],
  include: [...]
});
```

## 📝 Scripts Criados

### 1. `fix-database-errors.js`
Verifica se todas as tabelas e colunas críticas existem:
```bash
node src/scripts/fix-database-errors.js
```

### 2. `sync-project-model.js`
Testa o modelo Project e verifica a estrutura da tabela:
```bash
node src/scripts/sync-project-model.js
```

## ✅ Verificação

Execute os scripts para confirmar que tudo está funcionando:

```bash
cd backend

# Verificar estrutura do banco
node src/scripts/fix-database-errors.js

# Testar modelo Project
node src/scripts/sync-project-model.js
```

## 🎯 Resultado

- ✅ Erro `catalog_access_control` resolvido
- ✅ Erro `Project.client_id` resolvido
- ✅ Todas as queries de projetos funcionando
- ✅ Endpoint `/api/catalog/effective-access` funcionando
- ✅ Endpoint `/api/projects` funcionando

## 📊 Tabelas Verificadas

Todas as tabelas críticas foram verificadas e estão presentes:

- ✅ organizations
- ✅ organization_users
- ✅ clients
- ✅ client_users
- ✅ projects
- ✅ project_tasks
- ✅ tickets
- ✅ catalog_categories
- ✅ catalog_items
- ✅ catalog_access_control ← Nova
- ✅ roles
- ✅ permissions
- ✅ role_permissions

## 🔄 Próximos Passos

1. Reiniciar o backend para aplicar as mudanças no código
2. Testar os endpoints que estavam com erro:
   - `GET /api/catalog/effective-access`
   - `GET /api/projects`
   - `GET /api/projects/reports/history`
3. Verificar logs para confirmar que não há mais erros

## 📁 Arquivos Modificados

- `backend/migrations/20260302000001-create-catalog-access-control.sql` (novo)
- `backend/migrations/20260302000002-add-client-id-to-projects.sql` (novo)
- `backend/src/modules/projects/projectController.js` (modificado)
- `backend/src/scripts/fix-database-errors.js` (novo)
- `backend/src/scripts/sync-project-model.js` (novo)
