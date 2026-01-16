# Implementation Plan: Category Unification

## Overview

Implementação da unificação de categorias para usar apenas `catalog_categories` como fonte única.

## Tasks

- [x] 1. Criar e executar script de migração SQL
  - Criar mapeamento de IDs entre `categories` e `catalog_categories`
  - Migrar categorias que não existem em `catalog_categories`
  - Atualizar `tickets.category_id` → `catalog_category_id`
  - Atualizar `knowledge_articles.category_id` → `catalog_category_id`
  - Atualizar `ticket_templates.category_id` → `catalog_category_id`
  - Remover colunas `category_id` das tabelas
  - Remover tabelas `categories` e `knowledge_categories`
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 4.1, 5.1, 5.2_

- [x] 2. Atualizar modelos Sequelize do Backend
  - [x] 2.1 Atualizar modelo Ticket - remover categoryId
    - Remover campo `categoryId` do modelo
    - Manter apenas `catalogCategoryId`
    - _Requirements: 2.2, 2.3_
  - [x] 2.2 Atualizar modelo KnowledgeArticle
    - Mudar `categoryId` para `catalogCategoryId`
    - Atualizar referência para `CatalogCategory`
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 2.3 Atualizar modelo TicketTemplate
    - Mudar `categoryId` para `catalogCategoryId`
    - _Requirements: 4.1, 4.2_
  - [x] 2.4 Remover modelos Category e KnowledgeCategory
    - Remover arquivos de modelo
    - Remover exports do index.js
    - _Requirements: 5.3_

- [x] 3. Atualizar associações em models/index.js
  - Remover associações com Category
  - Adicionar associações com CatalogCategory para KnowledgeArticle e Templates
  - _Requirements: 3.3, 4.2, 4.3_

- [-] 4. Atualizar Controllers do Backend
  - [x] 4.1 Atualizar ticketController.js
    - Usar `catalogCategoryId` em vez de `categoryId`
    - Incluir `CatalogCategory` nos includes
    - _Requirements: 2.3_
  - [x] 4.2 Atualizar knowledgeController.js
    - Usar `catalogCategoryId` em vez de `categoryId`
    - Carregar categorias de `CatalogCategory`
    - _Requirements: 3.2_
  - [x] 4.3 Atualizar templateController.js
    - Usar `catalogCategoryId` em vez de `categoryId`
    - _Requirements: 4.2_
  - [x] 4.4 Remover ou redirecionar categoryController.js
    - Rotas `/api/categories` redirecionadas para catalogController
    - _Requirements: 5.3, 6.4_

- [x] 5. Atualizar Rotas do Backend
  - Rotas de `/api/categories` redirecionadas para catalogController
  - `/api/catalog/categories` já funcional
  - _Requirements: 6.4_

- [x] 6. Atualizar Frontend - Portal Organização
  - [x] 6.1 Atualizar serviço de categorias
    - Usar endpoints `/api/catalog/categories`
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 6.2 Atualizar formulários de ticket
    - Carregar categorias do catálogo
    - Usar `catalogCategoryId`
    - _Requirements: 6.1_
  - [x] 6.3 Atualizar formulários de artigos
    - Carregar categorias do catálogo
    - _Requirements: 6.2_
  - [x] 6.4 Atualizar formulários de templates
    - Carregar categorias do catálogo
    - _Requirements: 6.3_

- [x] 7. Atualizar Frontend - Portal Cliente
  - Atualizar formulários de ticket para usar categorias do catálogo
  - [x] Atualizar KnowledgeBase.jsx para usar DynamicIcon
  - [x] Atualizar ServiceCatalogEnhanced.jsx para usar DynamicIcon
  - _Requirements: 6.1_

- [x] 7.1 Corrigir renderização de ícones de categorias
  - [x] Criar componente DynamicIcon em portalOrganizaçãoTenant
  - [x] Criar componente DynamicIcon em portalClientEmpresa
  - [x] Atualizar CatalogCategories.jsx para usar DynamicIcon
  - [x] Atualizar KnowledgeBase.jsx para usar DynamicIcon
  - [x] Atualizar ServiceCatalogEnhanced.jsx para usar DynamicIcon
  - [x] Atualizar CatalogAnalytics.jsx para usar DynamicIcon

- [ ] 8. Checkpoint - Testar funcionalidades
  - Testar criação de ticket com categoria
  - Testar criação de artigo com categoria
  - Testar listagem de categorias
  - Verificar que não há erros de FK
  - _Requirements: 1.1, 2.1, 3.1_

## Notes

- Executar backup da base de dados antes da migração
- A migração SQL deve ser executada primeiro, antes das alterações de código
- Testar em ambiente de desenvolvimento antes de produção
- **IMPORTANTE**: O backend agora aceita tanto `categoryId` quanto `catalogCategoryId` para compatibilidade com código legado
- As rotas `/api/categories` foram redirecionadas para usar `catalogController`
- O `categoryController.js` e `categoryModel.js` podem ser removidos após validação completa
