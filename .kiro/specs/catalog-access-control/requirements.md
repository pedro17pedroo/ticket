# Requirements Document

## Introduction

Este documento define os requisitos para o sistema de controlo de acesso ao catálogo de serviços. A funcionalidade permite que organizações tenant (através do Portal da Organização) definam quais categorias, subcategorias e itens do catálogo estão disponíveis para cada empresa cliente e, opcionalmente, para utilizadores específicos dessas empresas. Os clientes acedem ao catálogo filtrado através do Portal Cliente Empresa.

### Contexto de Portais

- **Portal SaaS (Backoffice)**: Gestão do provider TatuTicket - não relevante para esta funcionalidade
- **Portal da Organização**: Onde as organizações tenant gerem os seus clientes, catálogo e permissões
- **Portal Cliente Empresa**: Onde os clientes das organizações acedem aos serviços permitidos

### Fluxo de Gestão

1. Organização cria/edita cliente no Portal da Organização
2. Organização define quais categorias/itens do catálogo o cliente pode aceder
3. Organização pode definir permissões específicas por utilizador do cliente
4. Cliente acede ao Portal Cliente Empresa e vê apenas os itens permitidos

## Glossary

- **Organization**: Organização tenant que utiliza o sistema TatuTicket (gere clientes no Portal da Organização)
- **Client**: Empresa cliente da organização tenant (acede ao Portal Cliente Empresa)
- **Client_User**: Utilizador pertencente a uma empresa cliente
- **Organization_User**: Utilizador da organização que gere clientes e permissões
- **Catalog_Category**: Categoria de serviços no catálogo da organização
- **Catalog_Item**: Item/serviço específico dentro de uma categoria
- **Access_Rule**: Regra que define permissões de acesso ao catálogo
- **Inheritance_Mode**: Modo de herança de permissões (inherit, override, deny)
- **Portal_Organizacao**: Interface onde organizações gerem clientes e permissões
- **Portal_Cliente**: Interface onde clientes acedem aos serviços permitidos

## Requirements

### Requirement 1: Acesso ao Catálogo por Cliente (Portal da Organização)

**User Story:** As an organization admin using the Organization Portal, I want to define which catalog categories and items each client company can access, so that I can offer different service packages to different clients.

#### Acceptance Criteria

1. WHEN an organization admin creates or edits a client in the Organization Portal, THE System SHALL display a "Catálogo de Serviços" tab to configure catalog access permissions
2. WHEN configuring client catalog access, THE System SHALL allow selection of specific categories, subcategories, and items from the organization's catalog
3. WHEN no specific access rules are defined for a client, THE System SHALL grant access to all public catalog items by default
4. WHEN a client has specific access rules, THE Client_Portal SHALL only show permitted categories and items
5. THE System SHALL support three access modes: "all" (full access to public items), "selected" (specific items only), "none" (no catalog access)

### Requirement 2: Acesso ao Catálogo por Utilizador Cliente (Portal da Organização)

**User Story:** As an organization admin using the Organization Portal, I want to define catalog access for specific client users, so that I can restrict or expand access beyond the client company defaults.

#### Acceptance Criteria

1. WHEN an organization admin creates or edits a client user in the Organization Portal, THE System SHALL display a section to configure individual catalog access
2. WHEN a client user has no specific access rules, THE System SHALL inherit permissions from the parent client company
3. WHEN a client user has specific access rules, THE System SHALL use those rules instead of client defaults
4. THE System SHALL support inheritance modes: "inherit" (use client rules), "override" (use user-specific rules), "extend" (add to client rules)
5. WHEN displaying the catalog to a client user in the Client Portal, THE System SHALL apply the effective permissions based on inheritance mode

### Requirement 3: Gestão de Permissões na Interface (Portal da Organização)

**User Story:** As an organization admin, I want an intuitive interface in the Organization Portal to manage catalog permissions, so that I can quickly configure access for clients and users.

#### Acceptance Criteria

1. WHEN viewing client details, THE System SHALL show a "Catalog Access" tab with current permissions
2. THE System SHALL display a tree view of categories and items with checkboxes for selection
3. WHEN a category is selected, THE System SHALL automatically include all its subcategories and items
4. WHEN a category is partially selected, THE System SHALL show an indeterminate state checkbox
5. THE System SHALL provide a search/filter function to find specific categories or items
6. THE System SHALL show a summary of selected items count

### Requirement 4: Filtragem do Catálogo no Portal Cliente Empresa

**User Story:** As a client user accessing the Client Portal, I want to see only the catalog items my company has access to, so that I can request services within my permissions.

#### Acceptance Criteria

1. WHEN a client user accesses the service catalog in the Client Portal, THE System SHALL filter categories based on effective permissions
2. WHEN a client user searches the catalog in the Client Portal, THE System SHALL only return results from permitted items
3. WHEN a client user tries to access a restricted item directly via URL, THE System SHALL return an access denied error with appropriate message
4. THE System SHALL cache effective permissions for performance optimization
5. WHEN permissions change in the Organization Portal, THE System SHALL invalidate the cache for affected client users

### Requirement 5: Auditoria de Permissões

**User Story:** As an organization admin, I want to track changes to catalog permissions, so that I can audit access control modifications.

#### Acceptance Criteria

1. WHEN catalog permissions are modified, THE System SHALL log the change with timestamp, user, and details
2. THE System SHALL store the previous and new permission states
3. WHEN viewing permission history, THE System SHALL display changes in chronological order
4. THE System SHALL retain permission audit logs for at least 12 months

### Requirement 6: Persistência de Permissões

**User Story:** As a system, I need to store catalog access permissions efficiently, so that permission checks are fast and reliable.

#### Acceptance Criteria

1. THE System SHALL store client catalog permissions in a dedicated table
2. THE System SHALL store client user catalog permissions in a separate table
3. WHEN storing permissions, THE System SHALL use JSON arrays for efficient bulk storage
4. THE System SHALL support both whitelist (allowed items) and blacklist (denied items) modes
5. WHEN serializing permissions to storage, THE System SHALL use a compact format
6. WHEN deserializing permissions from storage, THE System SHALL reconstruct the full permission set

### Requirement 7: API de Permissões

**User Story:** As a developer, I want clear API endpoints for managing catalog permissions, so that I can integrate permission management into the system.

#### Acceptance Criteria

1. THE System SHALL provide GET /api/clients/:id/catalog-access to retrieve client permissions
2. THE System SHALL provide PUT /api/clients/:id/catalog-access to update client permissions
3. THE System SHALL provide GET /api/client-users/:id/catalog-access to retrieve user permissions
4. THE System SHALL provide PUT /api/client-users/:id/catalog-access to update user permissions
5. THE System SHALL provide GET /api/catalog/effective-access to get current user's effective permissions
6. WHEN updating permissions, THE System SHALL validate that referenced categories and items exist
