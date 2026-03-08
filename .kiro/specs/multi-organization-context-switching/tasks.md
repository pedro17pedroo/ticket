# Implementation Plan: Multi-Organization Context Switching

## Overview

Este plano implementa o sistema de troca de contexto multi-organização, permitindo que usuários com o mesmo email trabalhem em múltiplas organizações e empresas clientes com diferentes roles e permissões. A implementação segue uma abordagem incremental: database → backend services → middleware → API endpoints → frontend components → integration.

## Tasks

- [x] 1. Setup database schema and migrations
  - [x] 1.1 Create context_sessions table migration
    - Create migration file for context_sessions table with all fields (id, userId, userType, contextId, contextType, sessionToken, ipAddress, userAgent, isActive, lastActivityAt, expiresAt, timestamps)
    - Add indexes for sessionToken, userId, and isActive fields
    - ✅ **EXECUTADO**: Tabela criada com sucesso em 28/02/2026
    - _Requirements: 3.1, 8.1_
  
  - [x] 1.2 Create context_audit_logs table migration
    - Create migration file for context_audit_logs table with all fields (id, userId, userEmail, userType, action, fromContextId, fromContextType, toContextId, toContextType, ipAddress, userAgent, success, errorMessage, createdAt)
    - Add indexes for userId, userEmail, action, and createdAt fields
    - ✅ **EXECUTADO**: Tabela criada com sucesso em 28/02/2026
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [⏳] 1.3 Update client_users table constraints
    - Create migration to remove unique constraint from email field in client_users table
    - Add composite unique constraint on (email, client_id)
    - ⚠️ **PENDENTE**: Tabela `client_users` não existe no banco de dados
    - ⚠️ **BLOQUEIO**: Requer criação das tabelas `clients` e `client_users` primeiro
    - Ver `STATUS-MULTI-CONTEXT-IMPLEMENTATION.md` para próximos passos
    - _Requirements: 9.3, 4.3_
  
  - [x] 1.4 Create Sequelize models for new tables
    - Create backend/src/models/ContextSession.js with all fields and associations
    - Create backend/src/models/ContextAuditLog.js with all fields and associations
    - Define relationships with User, OrganizationUser, and ClientUser models
    - ✅ **COMPLETO**: Models criados e funcionais
    - _Requirements: 3.1, 7.1_

- [x] 2. Implement core backend services
  - [x] 2.1 Create ContextService class
    - Create backend/src/services/contextService.js
    - Implement getContextsForEmail(email, password) method to query both organization_users and client_users tables
    - Implement validateContextAccess(email, contextId, contextType) method
    - Implement createContextSession(userId, userType, contextId, contextType, ipAddress, userAgent) method
    - Implement invalidateContextSession(sessionId) method
    - Implement getActiveContext(sessionId) method
    - Implement logContextSwitch(userId, fromContext, toContext, ipAddress, userAgent) method
    - _Requirements: 1.1, 2.3, 3.1, 5.2, 5.3, 7.1, 9.5, 9.6_
  
  - [ ]* 2.2 Write unit tests for ContextService
    - Test getContextsForEmail with single and multiple contexts
    - Test validateContextAccess with valid and invalid contexts
    - Test session creation and invalidation
    - Test audit logging
    - _Requirements: 1.1, 2.3, 3.1, 7.1_

- [x] 3. Implement authentication controller extensions
  - [x] 3.1 Add getAvailableContexts endpoint handler
    - Extend backend/src/modules/auth/authController.js
    - Implement POST /auth/login logic to validate credentials and return contexts
    - Return { requiresContextSelection: true, contexts: [...] } for multiple contexts
    - Return { token, user, context } for single context
    - _Requirements: 1.1, 1.2, 1.4, 5.2, 5.3, 5.4, 9.5_
  
  - [x] 3.2 Add selectContext endpoint handler
    - Implement POST /auth/select-context handler
    - Validate contextId and contextType against user's available contexts
    - Create context session using ContextService
    - Generate JWT token with context information
    - Log authentication event to audit log
    - _Requirements: 1.3, 1.5, 3.1, 7.2, 8.1_
  
  - [x] 3.3 Add switchContext endpoint handler
    - Implement POST /auth/switch-context handler
    - Extract current session from token
    - Validate new context access
    - Invalidate current session
    - Create new session for selected context
    - Log context switch to audit log
    - Return new token with updated context
    - _Requirements: 2.4, 2.5, 3.4, 7.1, 8.1_
  
  - [x] 3.4 Add listUserContexts endpoint handler
    - Implement GET /auth/contexts handler
    - Extract user email from authenticated token
    - Query available contexts using ContextService
    - Return contexts with isLastUsed flag
    - _Requirements: 2.3, 6.2, 9.6_
  
  - [ ]* 3.5 Write integration tests for auth endpoints
    - Test login flow with single and multiple contexts
    - Test context selection and validation
    - Test context switching with session invalidation
    - Test error cases (invalid context, expired session)
    - _Requirements: 1.1, 1.2, 1.3, 2.3, 2.4_

- [ ] 4. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement middleware for context validation
  - [x] 5.1 Create contextMiddleware
    - Create backend/src/middleware/contextMiddleware.js
    - Implement validateContext middleware to extract and validate context from token
    - Implement injectContext middleware to add context info to req object
    - Add context validation to verify resource access matches active context
    - _Requirements: 3.2, 3.3, 8.1, 8.2, 8.3, 8.4_
  
  - [x] 5.2 Apply contextMiddleware to protected routes
    - Update route definitions to include contextMiddleware after auth middleware
    - Apply to all API routes that access organization or client resources
    - _Requirements: 8.1, 8.2, 8.5_
  
  - [ ]* 5.3 Write middleware tests
    - Test context extraction from token
    - Test resource access validation
    - Test authorization errors for mismatched contexts
    - _Requirements: 3.2, 3.3, 8.2, 8.3_

- [ ] 6. Implement token structure updates
  - [x] 6.1 Update JWT token generation
    - Modify token generation in authController to include contextId, contextType, sessionId
    - Include organizationId, clientId, role, and permissions in token payload
    - Set appropriate expiration time
    - _Requirements: 3.1, 6.1, 8.1_
  
  - [x] 6.2 Update JWT token validation
    - Modify auth middleware to extract and validate context fields from token
    - Verify session is still active in context_sessions table
    - Check session expiration and lastActivityAt
    - _Requirements: 8.1, 8.5_

- [x] 7. Implement frontend ContextSelector component
  - [x] 7.1 Create ContextSelector for Portal Organização
    - Create portalOrganizaçãoTenant/src/components/ContextSelector.jsx
    - Accept contexts array, onSelect callback, and loading props
    - Display contexts grouped by type (Organization / Client)
    - Show organization/client name and user role for each context
    - Highlight last used context
    - Handle context selection and call onSelect callback
    - _Requirements: 1.2, 1.5, 4.4, 6.2_
  
  - [x] 7.2 Create ContextSelector for Portal Client
    - Create portalClientEmpresa/src/components/ContextSelector.jsx
    - Implement same functionality as Portal Organização version
    - Adapt styling to match Portal Client design system
    - _Requirements: 1.2, 1.5, 4.4, 6.2_

- [x] 8. Implement frontend ContextSwitcher widget
  - [x] 8.1 Create ContextSwitcher for Portal Organização
    - Create portalOrganizaçãoTenant/src/components/ContextSwitcher.jsx
    - Display current context in header/navbar
    - Implement dropdown with available contexts
    - Add visual indicator for active context
    - Handle context switch action and API call
    - Show loading state during switch
    - Handle errors and display user feedback
    - _Requirements: 2.1, 2.3, 2.4, 2.5_
  
  - [x] 8.2 Create ContextSwitcher for Portal Client
    - Create portalClientEmpresa/src/components/ContextSwitcher.jsx
    - Implement same functionality as Portal Organização version
    - Adapt styling to match Portal Client design system
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 9. Modify login pages for context selection
  - [x] 9.1 Update Portal Organização login page
    - Modify portalOrganizaçãoTenant/src/pages/Login.jsx
    - Update login API call to handle requiresContextSelection response
    - Show ContextSelector when multiple contexts are available
    - Proceed directly to portal when single context exists
    - Call /auth/select-context when user selects context
    - Store token and redirect to appropriate portal
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4_
  
  - [x] 9.2 Update Portal Client login page
    - Modify portalClientEmpresa/src/pages/Login.jsx
    - Implement same context selection logic as Portal Organização
    - Handle redirect to Portal Organização when organization context is selected
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4_

- [x] 10. Integrate ContextSwitcher into portal layouts
  - [x] 10.1 Add ContextSwitcher to Portal Organização header
    - Import and add ContextSwitcher component to main layout/header
    - Position in navbar near user profile section
    - Fetch available contexts on component mount
    - Handle context switch and token update
    - Implement redirect logic for cross-portal switches
    - _Requirements: 2.1, 2.5, 2.6_
  
  - [x] 10.2 Add ContextSwitcher to Portal Client header
    - Import and add ContextSwitcher component to main layout/header
    - Position in navbar near user profile section
    - Fetch available contexts on component mount
    - Handle context switch and token update
    - Implement redirect logic for cross-portal switches
    - _Requirements: 2.2, 2.5, 2.7_

- [ ] 11. Implement context persistence
  - [x] 11.1 Add last used context tracking
    - Update ContextService to store lastAccessedAt when context is selected
    - Update context_sessions table on each API request with lastActivityAt
    - Query last used context in getContextsForEmail and set isLastUsed flag
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 11.2 Add preferred context storage
    - Create user preference storage for preferred context
    - Update preference when user successfully authenticates
    - Use preference to pre-select context in ContextSelector
    - _Requirements: 6.1, 6.2, 6.4_

- [ ] 12. Implement audit endpoints
  - [ ] 12.1 Create context history endpoint
    - Implement GET /contexts/history in backend
    - Query context_audit_logs filtered by userId
    - Support pagination with limit and offset
    - Return formatted audit log entries
    - _Requirements: 7.3_
  
  - [ ] 12.2 Create audit query endpoint
    - Implement GET /contexts/audit in backend
    - Support filtering by date range, action type
    - Support pagination
    - Restrict access to admin users only
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 13. Checkpoint - Integration testing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Final integration and error handling
  - [ ] 14.1 Add comprehensive error handling
    - Add try-catch blocks to all context-related endpoints
    - Return appropriate HTTP status codes (401, 403, 404, 500)
    - Log errors with context information
    - Provide user-friendly error messages
    - _Requirements: 8.3, 8.5_
  
  - [ ] 14.2 Update API documentation
    - Document all new endpoints in API documentation
    - Include request/response examples
    - Document error responses
    - Add authentication requirements
    - _Requirements: 1.1, 2.3, 2.4, 8.1_
  
  - [ ] 14.3 Add session expiration handling
    - Implement automatic session cleanup for expired sessions
    - Add frontend logic to detect expired tokens
    - Redirect to login when session expires
    - Show appropriate message to user
    - _Requirements: 6.3, 8.5_

- [ ] 15. Final checkpoint - Complete system validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Implementation uses Node.js/Express backend with Sequelize ORM
- Frontend uses React with existing component patterns
- Database migrations should be reversible
- All context operations are logged for audit purposes
- Session tokens include full context information for validation
- Cross-portal redirects maintain authentication state
