# Requirements Document

## Introduction

Unificação do sistema de categorias para usar apenas `catalog_categories` como fonte única, eliminando duplicação e inconsistências entre `categories`, `catalog_categories` e `knowledge_categories`.

## Glossary

- **Catalog_Category**: Tabela unificada de categorias do sistema (anteriormente `catalog_categories`)
- **Category**: Tabela legada a ser removida (anteriormente `categories`)
- **Knowledge_Category**: Tabela não utilizada a ser removida
- **Ticket**: Entidade que será associada apenas a `catalog_categories`
- **Knowledge_Article**: Artigo da base de conhecimento
- **Ticket_Template**: Template de ticket
- **Response_Template**: Template de resposta

## Requirements

### Requirement 1: Migração de Dados de Categorias

**User Story:** Como administrador do sistema, quero que todas as categorias existentes sejam migradas para a tabela unificada, para não perder dados.

#### Acceptance Criteria

1. WHEN a migração é executada, THE System SHALL copiar categorias de `categories` para `catalog_categories` que não existam
2. WHEN uma categoria já existe em `catalog_categories` com o mesmo nome, THE System SHALL manter a existente e mapear referências
3. THE System SHALL criar um mapeamento entre IDs antigos e novos para atualização de referências

### Requirement 2: Atualização de Tickets

**User Story:** Como sistema, quero que tickets usem apenas `catalog_category_id`, para haver consistência.

#### Acceptance Criteria

1. WHEN um ticket tem `category_id` preenchido, THE System SHALL migrar o valor para `catalog_category_id` usando o mapeamento
2. WHEN a migração está completa, THE System SHALL remover a coluna `category_id` da tabela `tickets`
3. THE Ticket_Controller SHALL usar apenas `catalogCategoryId` em todas as operações

### Requirement 3: Atualização de Knowledge Articles

**User Story:** Como sistema, quero que artigos da base de conhecimento usem categorias do catálogo.

#### Acceptance Criteria

1. WHEN um artigo tem `category_id` preenchido, THE System SHALL migrar para `catalog_category_id`
2. THE Knowledge_Controller SHALL usar `catalogCategoryId` em todas as operações
3. THE System SHALL atualizar a foreign key para referenciar `catalog_categories`

### Requirement 4: Atualização de Templates

**User Story:** Como sistema, quero que templates usem categorias do catálogo.

#### Acceptance Criteria

1. WHEN um template tem `category_id` preenchido, THE System SHALL migrar para `catalog_category_id`
2. THE Template_Controller SHALL usar `catalogCategoryId` em todas as operações
3. THE Response_Template_Controller SHALL usar `catalogCategoryId` em todas as operações

### Requirement 5: Remoção de Tabelas Legadas

**User Story:** Como administrador, quero que tabelas não utilizadas sejam removidas para manter o banco limpo.

#### Acceptance Criteria

1. WHEN todas as migrações estão completas, THE System SHALL remover a tabela `categories`
2. THE System SHALL remover a tabela `knowledge_categories`
3. THE System SHALL remover todos os modelos Sequelize associados às tabelas removidas

### Requirement 6: Atualização de Frontend

**User Story:** Como utilizador, quero que todos os formulários usem as categorias do catálogo.

#### Acceptance Criteria

1. WHEN um formulário de ticket é exibido, THE System SHALL carregar categorias de `/api/catalog/categories`
2. WHEN um formulário de artigo é exibido, THE System SHALL carregar categorias de `/api/catalog/categories`
3. WHEN um formulário de template é exibido, THE System SHALL carregar categorias de `/api/catalog/categories`
4. THE System SHALL remover endpoints e serviços relacionados a `/api/categories`

### Requirement 7: Renomeação para Clareza

**User Story:** Como desenvolvedor, quero que a nomenclatura seja clara e consistente.

#### Acceptance Criteria

1. THE System SHALL manter o nome `catalog_categories` na base de dados
2. THE System SHALL usar `CatalogCategory` como nome do modelo Sequelize
3. THE System SHALL usar `catalogCategoryId` como nome do campo em todas as entidades
