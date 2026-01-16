# Design Document: Category Unification

## Overview

Este documento descreve a arquitetura e implementação para unificar o sistema de categorias, eliminando as tabelas `categories` e `knowledge_categories` e usando apenas `catalog_categories` como fonte única.

## Architecture

### Estado Atual

```
┌─────────────────┐     ┌─────────────────────┐     ┌───────────────────────┐
│   categories    │     │  catalog_categories │     │  knowledge_categories │
│   (20 registos) │     │    (25 registos)    │     │     (0 registos)      │
└────────┬────────┘     └──────────┬──────────┘     └───────────────────────┘
         │                         │
         ▼                         ▼
┌─────────────────┐     ┌─────────────────────┐
│     tickets     │     │    catalog_items    │
│ (category_id)   │     │   (category_id)     │
│ (catalog_cat_id)│     └─────────────────────┘
└─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────────┐
│knowledge_articles│    │  ticket_templates   │
│ (category_id)   │     │   (category_id)     │
└─────────────────┘     └─────────────────────┘
```

### Estado Final

```
                    ┌─────────────────────┐
                    │  catalog_categories │
                    │  (fonte única)      │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────────┐  ┌─────────────────┐
│     tickets     │  │  knowledge_articles │  │ ticket_templates│
│(catalog_cat_id) │  │ (catalog_cat_id)    │  │(catalog_cat_id) │
└─────────────────┘  └─────────────────────┘  └─────────────────┘
```

## Components and Interfaces

### 1. Script de Migração SQL

```sql
-- 1. Criar mapeamento de categorias antigas para novas
-- 2. Migrar categorias que não existem
-- 3. Atualizar foreign keys
-- 4. Remover tabelas legadas
```

### 2. Modelos Sequelize Afetados

| Modelo | Alteração |
|--------|-----------|
| `Ticket` | Remover `categoryId`, manter `catalogCategoryId` |
| `KnowledgeArticle` | Mudar `categoryId` → `catalogCategoryId` |
| `TicketTemplate` | Mudar `categoryId` → `catalogCategoryId` |
| `ResponseTemplate` | Mudar `categoryId` → `catalogCategoryId` |
| `Category` | REMOVER modelo |
| `KnowledgeCategory` | REMOVER modelo |

### 3. Controllers Afetados

| Controller | Alteração |
|------------|-----------|
| `ticketController.js` | Usar `catalogCategoryId` |
| `knowledgeController.js` | Usar `catalogCategoryId`, carregar de `CatalogCategory` |
| `templateController.js` | Usar `catalogCategoryId` |
| `categoryController.js` | REMOVER ou redirecionar para catalog |

### 4. Endpoints API

| Endpoint Atual | Ação |
|----------------|------|
| `GET /api/categories` | Redirecionar para `/api/catalog/categories` |
| `POST /api/categories` | REMOVER |
| `PUT /api/categories/:id` | REMOVER |
| `DELETE /api/categories/:id` | REMOVER |

### 5. Frontend - Serviços

| Serviço | Alteração |
|---------|-----------|
| `categoryService.js` | Usar endpoints do catálogo |
| Formulários de ticket | Carregar de `/api/catalog/categories` |
| Formulários de artigo | Carregar de `/api/catalog/categories` |

## Data Models

### CatalogCategory (mantido)

```javascript
{
  id: UUID,
  organizationId: UUID,
  name: STRING,
  description: TEXT,
  icon: STRING,
  color: STRING,
  parentCategoryId: UUID,  // Hierarquia
  level: INTEGER,
  imageUrl: STRING,
  defaultDirectionId: UUID,
  defaultDepartmentId: UUID,
  defaultSectionId: UUID,
  order: INTEGER,
  isActive: BOOLEAN
}
```

### Ticket (atualizado)

```javascript
{
  // ... outros campos
  catalogCategoryId: UUID,  // Único campo de categoria
  // categoryId: REMOVIDO
}
```

### KnowledgeArticle (atualizado)

```javascript
{
  // ... outros campos
  catalogCategoryId: UUID,  // Renomeado de categoryId
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: Integridade de Dados na Migração

*For any* categoria existente em `categories`, após a migração, deve existir uma categoria correspondente em `catalog_categories` com o mesmo nome.

**Validates: Requirements 1.1, 1.2**

### Property 2: Preservação de Referências

*For any* ticket, artigo ou template que tinha `category_id` preenchido, após a migração deve ter `catalog_category_id` apontando para uma categoria válida.

**Validates: Requirements 2.1, 3.1, 4.1**

### Property 3: Unicidade de Fonte

*For any* operação de leitura ou escrita de categorias, deve usar apenas a tabela `catalog_categories`.

**Validates: Requirements 5.1, 5.2, 6.1, 6.2, 6.3**

## Error Handling

| Cenário | Tratamento |
|---------|------------|
| Categoria não encontrada no mapeamento | Criar nova categoria em `catalog_categories` |
| Foreign key violation | Executar migração de dados antes de alterar schema |
| Rollback necessário | Manter backup das tabelas antes de remover |

## Testing Strategy

### Testes de Migração

1. Verificar que todas as categorias foram migradas
2. Verificar que todas as referências foram atualizadas
3. Verificar que não há orphan records

### Testes de Integração

1. Criar ticket com categoria do catálogo
2. Criar artigo com categoria do catálogo
3. Criar template com categoria do catálogo
4. Listar categorias retorna dados de `catalog_categories`

### Testes de Regressão

1. Formulários de ticket funcionam corretamente
2. Formulários de artigo funcionam corretamente
3. Filtros por categoria funcionam
