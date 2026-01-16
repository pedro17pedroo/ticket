# Implementation Plan: Catalog Access Control

## Overview

Este plano implementa o sistema de controlo de acesso ao catálogo de serviços, permitindo que organizações definam quais categorias e itens estão disponíveis para cada cliente e utilizador.

## Tasks

- [x] 1. Criar estrutura de base de dados
  - [x] 1.1 Criar migration para tabelas de acesso ao catálogo
    - Criar tabela `client_catalog_access`
    - Criar tabela `client_user_catalog_access`
    - Criar tabela `catalog_access_audit_logs`
    - Criar índices necessários
    - _Requirements: 6.1, 6.2_

  - [x] 1.2 Criar modelos Sequelize
    - Criar `ClientCatalogAccess` model
    - Criar `ClientUserCatalogAccess` model
    - Criar `CatalogAccessAuditLog` model
    - Configurar associações com Client, ClientUser, Organization
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 2. Implementar serviço de acesso ao catálogo
  - [x] 2.1 Criar CatalogAccessService base
    - Implementar `getClientAccess(clientId)`
    - Implementar `setClientAccess(clientId, rules, modifiedBy)`
    - Implementar `getUserAccess(clientUserId)`
    - Implementar `setUserAccess(clientUserId, rules, modifiedBy)`
    - _Requirements: 1.1, 1.2, 2.1_

  - [x] 2.2 Implementar cálculo de permissões efetivas
    - Implementar `getEffectiveAccess(clientUserId)`
    - Implementar lógica de herança (inherit, override, extend)
    - Implementar resolução de whitelist/blacklist
    - _Requirements: 2.2, 2.3, 2.4, 6.4_

  - [x] 2.3 Write property test for effective permissions calculation
    - **Property 4: Effective Permissions Calculation**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

  - [x] 2.4 Implementar filtragem do catálogo
    - Implementar `filterCatalog(clientUserId, query)`
    - Implementar `hasAccessToItem(clientUserId, itemId)`
    - Integrar com CatalogService existente
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 2.5 Write property test for catalog filtering
    - **Property 2: Filtered Access Returns Only Permitted Items**
    - **Validates: Requirements 1.4, 4.1, 4.2**

- [x] 3. Implementar sistema de cache
  - [x] 3.1 Criar CatalogAccessCache service
    - Implementar cache de permissões efetivas em Redis
    - Implementar `cacheEffectiveAccess(clientUserId, permissions)`
    - Implementar `getFromCache(clientUserId)`
    - Implementar `invalidateCache(clientUserId)` e `invalidateClientCache(clientId)`
    - _Requirements: 4.4, 4.5_

  - [x] 3.2 Write property test for cache invalidation
    - **Property 7: Cache Invalidation on Permission Change**
    - **Validates: Requirements 4.5**

- [x] 4. Implementar sistema de auditoria
  - [x] 4.1 Criar CatalogAccessAuditService
    - Implementar `logChange(entityType, entityId, action, previousState, newState, changedBy)`
    - Implementar `getAuditHistory(entityType, entityId)`
    - Integrar com setClientAccess e setUserAccess
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 4.2 Write property test for audit logging
    - **Property 8: Audit Log Completeness**
    - **Validates: Requirements 5.1, 5.2**

- [x] 5. Checkpoint - Verificar serviços backend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Criar API endpoints
  - [x] 6.1 Criar CatalogAccessController
    - Implementar `GET /api/clients/:id/catalog-access`
    - Implementar `PUT /api/clients/:id/catalog-access`
    - Implementar `GET /api/client-users/:id/catalog-access`
    - Implementar `PUT /api/client-users/:id/catalog-access`
    - Implementar `GET /api/catalog/effective-access`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 6.2 Implementar validação de permissões
    - Validar que categorias/itens referenciados existem
    - Retornar erros apropriados para referências inválidas
    - _Requirements: 7.6_

  - [x] 6.3 Write property test for permission validation
    - **Property 11: Permission Validation**
    - **Validates: Requirements 7.6**

  - [x] 6.4 Configurar rotas e middleware
    - Adicionar rotas ao router
    - Configurar autenticação e autorização
    - _Requirements: 7.1-7.5_

- [x] 7. Integrar filtragem no Portal Cliente
  - [x] 7.1 Modificar catalogService para filtrar por permissões
    - Integrar `filterCatalog` nas queries existentes
    - Modificar `searchCatalogItems` para aplicar filtro
    - Modificar `getCatalogItemById` para verificar acesso
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 7.2 Write property test for access denied
    - **Property 6: Access Denied for Restricted Items**
    - **Validates: Requirements 4.3**

- [x] 8. Checkpoint - Verificar integração backend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Criar componentes frontend (Portal Organização)
  - [x] 9.1 Criar CatalogAccessTab component
    - Criar tab para edição de cliente
    - Implementar seletor de modo de acesso (all/selected/none)
    - _Requirements: 1.1, 3.1_

  - [x] 9.2 Criar CatalogTreeSelector component
    - Implementar tree view com checkboxes
    - Implementar seleção cascata (categoria seleciona filhos)
    - Implementar estado indeterminado para seleção parcial
    - Implementar busca/filtro
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [x] 9.3 Write property test for cascading selection
    - **Property 5: Cascading Selection Consistency**
    - **Validates: Requirements 3.3, 3.4**

  - [x] 9.4 Criar SelectedItemsSummary component
    - Mostrar contagem de itens selecionados
    - Mostrar resumo por categoria
    - _Requirements: 3.6_

  - [x] 9.5 Criar InheritanceModeSelector component
    - Seletor para modo de herança (inherit/override/extend)
    - Mostrar permissões herdadas do cliente
    - _Requirements: 2.1, 2.4_

- [x] 10. Integrar componentes nas páginas existentes
  - [x] 10.1 Integrar CatalogAccessTab na página de edição de cliente
    - Adicionar tab "Catálogo de Serviços" ao ClientForm
    - Carregar e salvar permissões via API
    - _Requirements: 1.1, 1.2_

  - [x] 10.2 Integrar CatalogAccessTab na página de edição de utilizador cliente
    - Adicionar secção de acesso ao catálogo ao ClientUserForm
    - Implementar visualização de permissões herdadas
    - _Requirements: 2.1_

- [x] 11. Implementar serviços frontend
  - [x] 11.1 Criar catalogAccessService no frontend
    - Implementar chamadas API para gestão de permissões
    - Implementar cache local de permissões
    - _Requirements: 7.1-7.5_

- [x] 12. Checkpoint - Verificar frontend Portal Organização
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Atualizar Portal Cliente Empresa
  - [x] 13.1 Modificar ServiceCatalog para usar permissões
    - Carregar permissões efetivas no início
    - Filtrar categorias e itens baseado em permissões
    - _Requirements: 4.1_

  - [x] 13.2 Modificar busca do catálogo
    - Aplicar filtro de permissões nos resultados de busca
    - _Requirements: 4.2_

  - [x] 13.3 Implementar tratamento de acesso negado
    - Mostrar mensagem apropriada quando acesso é negado
    - Redirecionar para página de erro ou catálogo
    - _Requirements: 4.3_

- [x] 14. Testes de integração finais
  - [x] 14.1 Write property test for default access
    - **Property 1: Default Access Grants All Public Items**
    - **Validates: Requirements 1.3**

  - [x] 14.2 Write property test for access modes
    - **Property 3: Access Modes Behave Correctly**
    - **Validates: Requirements 1.5**

  - [x] 14.3 Write property test for serialization round-trip
    - **Property 10: Serialization Round-Trip**
    - **Validates: Requirements 6.6**

  - [x] 14.4 Write property test for whitelist/blacklist
    - **Property 9: Whitelist and Blacklist Modes**
    - **Validates: Requirements 6.4**

- [x] 15. Final checkpoint - Verificar sistema completo
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- A implementação segue a ordem: Database → Services → API → Frontend Org → Frontend Client
- **All 11 property tests have been implemented and are passing**
- **Implementation is complete - all requirements have been addressed**
