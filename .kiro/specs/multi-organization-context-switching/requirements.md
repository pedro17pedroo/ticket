# Requirements Document

## Introduction

Este documento define os requisitos para implementar a funcionalidade de troca de contexto multi-organização, permitindo que usuários com o mesmo email possam trabalhar em múltiplas organizações e empresas clientes com diferentes roles e permissões, sem conflitos de autenticação.

## Glossary

- **User**: Pessoa que acessa o sistema através de email e palavra-passe
- **Organization**: Entidade tenant que agrupa usuários e recursos no sistema
- **Client_Company**: Empresa cliente que pertence a uma organização
- **Organization_Users_Table**: Tabela do banco de dados que armazena usuários de organizações, permitindo o mesmo email em múltiplas linhas (diferentes organizações, senhas e roles)
- **Client_Users_Table**: Tabela do banco de dados que armazena usuários de empresas clientes, permitindo o mesmo email em múltiplas linhas (diferentes empresas clientes e senhas)
- **Context**: Combinação de Organization ou Client_Company com as permissões específicas do User
- **Role**: Conjunto de permissões atribuídas a um User em um Context específico (ex: Admin, Agente)
- **Authentication_Service**: Sistema responsável por validar credenciais do User consultando ambas as tabelas Organization_Users_Table e Client_Users_Table
- **Context_Selector**: Interface que permite ao User escolher entre múltiplos Contexts disponíveis
- **Session**: Estado ativo do User após autenticação, associado a um Context específico
- **Portal_Organização_Tenant**: Interface para usuários de organizações
- **Portal_Client_Empresa**: Interface para clientes de empresas

## Requirements

### Requirement 1: Seleção de Contexto no Login

**User Story:** Como um usuário com acesso a múltiplas organizações, eu quero escolher qual organização acessar durante o login, para que eu possa trabalhar no contexto correto.

#### Acceptance Criteria

1. WHEN a User submits valid credentials, THE Authentication_Service SHALL query both Organization_Users_Table and Client_Users_Table to retrieve all available Contexts for that User email
2. WHEN multiple Contexts exist for a User across both tables, THE Context_Selector SHALL display all available Organizations and Client_Companies
3. WHEN a User selects a Context, THE Authentication_Service SHALL create a Session with the Role and permissions specific to that Context
4. WHEN only one Context exists for a User across both tables, THE Authentication_Service SHALL automatically select that Context and proceed to the appropriate portal
5. THE Context_Selector SHALL display the Role associated with each available Context

### Requirement 2: Troca de Contexto Durante Sessão Ativa

**User Story:** Como um usuário autenticado, eu quero trocar de uma organização para outra sem fazer logout, para que eu possa trabalhar eficientemente em múltiplos contextos.

#### Acceptance Criteria

1. WHILE a Session is active, THE Portal_Organização_Tenant SHALL provide a context switching interface
2. WHILE a Session is active, THE Portal_Client_Empresa SHALL provide a context switching interface
3. WHEN a User requests a context switch, THE Authentication_Service SHALL query both Organization_Users_Table and Client_Users_Table to retrieve all available Contexts for that User email
4. WHEN a User selects a different Context, THE Authentication_Service SHALL terminate the current Session and create a new Session with the permissions of the selected Context
5. WHEN a context switch completes, THE System SHALL redirect the User to the appropriate portal for the new Context
6. WHEN switching from Organization to Client_Company context, THE System SHALL redirect from Portal_Organização_Tenant to Portal_Client_Empresa
7. WHEN switching from Client_Company to Organization context, THE System SHALL redirect from Portal_Client_Empresa to Portal_Organização_Tenant

### Requirement 3: Segregação de Permissões por Contexto

**User Story:** Como administrador do sistema, eu quero que as permissões sejam isoladas por contexto, para que um usuário tenha apenas as permissões apropriadas para a organização ou empresa cliente em que está trabalhando.

#### Acceptance Criteria

1. WHEN a Session is created for a Context, THE Authentication_Service SHALL load only the Role and permissions associated with that specific Context
2. THE System SHALL prevent access to resources that belong to a different Context than the active Session
3. WHEN a User attempts to access a resource, THE System SHALL verify that the resource belongs to the active Context before granting access
4. WHEN a context switch occurs, THE System SHALL clear all cached permissions from the previous Context
5. THE System SHALL maintain separate RBAC policies for each Context

### Requirement 4: Suporte a Múltiplos Contextos de Cliente

**User Story:** Como um usuário que é cliente de múltiplas empresas, eu quero poder escolher qual empresa cliente acessar, para que eu possa gerenciar meus tickets e interações com cada empresa separadamente.

#### Acceptance Criteria

1. WHEN a User has client access to multiple Client_Companies, THE Context_Selector SHALL display all available Client_Company Contexts from Client_Users_Table
2. WHEN a User selects a Client_Company Context, THE Authentication_Service SHALL create a Session with client-level permissions for that specific Client_Company
3. THE System SHALL allow the same email to exist in multiple rows in Client_Users_Table with different Client_Companies and passwords without conflict
4. WHEN viewing available Contexts, THE Context_Selector SHALL clearly distinguish between Organization Contexts (from Organization_Users_Table) and Client_Company Contexts (from Client_Users_Table)

### Requirement 5: Gestão de Credenciais por Contexto

**User Story:** Como um usuário com acesso a múltiplas organizações, eu quero usar palavras-passe diferentes para cada organização, para que eu possa manter segurança independente em cada contexto.

#### Acceptance Criteria

1. THE System SHALL store credentials separately in Organization_Users_Table and Client_Users_Table, allowing different passwords for each Context associated with a User email
2. WHEN a User submits credentials during login, THE Authentication_Service SHALL validate the password against all matching rows in both Organization_Users_Table and Client_Users_Table for that email
3. WHEN credentials match multiple Contexts across both tables, THE Context_Selector SHALL display only the Contexts with matching credentials
4. WHEN credentials match only one Context in either table, THE Authentication_Service SHALL automatically select that Context
5. THE System SHALL allow a User to set different passwords for different Organizations in Organization_Users_Table and different Client_Companies in Client_Users_Table using the same email

### Requirement 6: Persistência de Contexto Ativo

**User Story:** Como um usuário, eu quero que o sistema lembre do último contexto que eu usei, para que eu possa retornar rapidamente ao meu trabalho.

#### Acceptance Criteria

1. WHEN a User successfully authenticates and selects a Context, THE System SHALL store the selected Context as the preferred Context for that User
2. WHEN a User logs in and has multiple available Contexts, THE Context_Selector SHALL highlight the last used Context
3. WHEN a Session expires, THE System SHALL remember the last active Context for the next login
4. THE System SHALL allow a User to clear their preferred Context preference

### Requirement 7: Auditoria de Troca de Contexto

**User Story:** Como administrador de segurança, eu quero registrar todas as trocas de contexto, para que eu possa auditar o acesso e detectar atividades suspeitas.

#### Acceptance Criteria

1. WHEN a User switches Context, THE System SHALL log the event with timestamp, User email, source Context, and destination Context
2. WHEN a User authenticates and selects a Context, THE System SHALL log the authentication event with the selected Context
3. THE System SHALL provide an audit trail of all context switches for each User
4. THE System SHALL retain context switch logs for a minimum of 90 days

### Requirement 8: Validação de Contexto em APIs

**User Story:** Como desenvolvedor backend, eu quero que todas as APIs validem o contexto ativo, para que não haja vazamento de dados entre contextos.

#### Acceptance Criteria

1. WHEN an API request is received, THE System SHALL extract the active Context from the Session token
2. WHEN processing an API request, THE System SHALL verify that all accessed resources belong to the active Context
3. IF a resource does not belong to the active Context, THEN THE System SHALL return an authorization error
4. THE System SHALL include the active Context identifier in all API request logs
5. WHEN a Session token is invalid or expired, THE System SHALL return an authentication error and require re-login

### Requirement 9: Estrutura de Banco de Dados Multi-Tabela

**User Story:** Como desenvolvedor backend, eu quero que o sistema suporte corretamente a estrutura de múltiplas tabelas de usuários, para que o mesmo email possa existir em diferentes contextos sem conflitos.

#### Acceptance Criteria

1. THE System SHALL maintain separate Organization_Users_Table and Client_Users_Table for storing user credentials and context information
2. THE System SHALL allow the same email to exist in multiple rows in Organization_Users_Table with different organization_id, password, and role values
3. THE System SHALL allow the same email to exist in multiple rows in Client_Users_Table with different client_company_id and password values
4. THE System SHALL allow the same email to exist simultaneously in both Organization_Users_Table and Client_Users_Table
5. WHEN authenticating a User, THE Authentication_Service SHALL query both tables and match credentials against all rows with the provided email
6. WHEN retrieving available Contexts for a User, THE Authentication_Service SHALL perform a UNION query across both Organization_Users_Table and Client_Users_Table filtering by email
7. THE System SHALL maintain referential integrity where Organization_Users_Table references organization_id and Client_Users_Table references client_company_id

