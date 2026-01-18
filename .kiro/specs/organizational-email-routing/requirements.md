# Requirements Document

## Introduction

Este documento define os requisitos para adicionar suporte a emails em Direções e Secções da estrutura organizacional, permitindo que tickets sejam criados automaticamente quando emails são enviados para endereços associados a essas unidades organizacionais. Atualmente, apenas Departamentos possuem campo de email, mas Direções e Secções também precisam desta funcionalidade para permitir roteamento automático de tickets.

## Glossary

- **Direction**: Unidade organizacional de nível superior na hierarquia (Direção)
- **Department**: Unidade organizacional de nível intermediário, pertence a uma Direction (Departamento)
- **Section**: Unidade organizacional de nível inferior, pertence a um Department (Secção)
- **Organizational_Unit**: Termo genérico para Direction, Department ou Section
- **Email_Routing**: Processo de criar e rotear tickets automaticamente baseado no email de destino
- **Ticket**: Solicitação de serviço ou incidente no sistema
- **Portal_Organization**: Interface web para gestão da organização (Portal das Organizações)
- **Email_Inbox_Service**: Serviço backend que monitora caixas de email e processa mensagens recebidas

## Requirements

### Requirement 1: Email Field in Directions

**User Story:** Como administrador da organização, quero adicionar um endereço de email a uma Direção, para que tickets possam ser criados automaticamente quando emails forem enviados para esse endereço.

#### Acceptance Criteria

1. THE Direction_Model SHALL include an optional email field with email format validation
2. WHEN creating a Direction, THE Portal_Organization SHALL display an email input field
3. WHEN editing a Direction, THE Portal_Organization SHALL display the current email value and allow modification
4. WHEN an invalid email format is provided, THE System SHALL reject the input and display a validation error
5. WHEN an empty email is provided, THE System SHALL accept it as null (email is optional)

### Requirement 2: Email Field in Sections

**User Story:** Como administrador da organização, quero adicionar um endereço de email a uma Secção, para que tickets possam ser criados automaticamente quando emails forem enviados para esse endereço.

#### Acceptance Criteria

1. THE Section_Model SHALL include an optional email field with email format validation
2. WHEN creating a Section, THE Portal_Organization SHALL display an email input field
3. WHEN editing a Section, THE Portal_Organization SHALL display the current email value and allow modification
4. WHEN an invalid email format is provided, THE System SHALL reject the input and display a validation error
5. WHEN an empty email is provided, THE System SHALL accept it as null (email is optional)

### Requirement 3: Email Uniqueness Validation

**User Story:** Como administrador do sistema, quero garantir que cada email seja único entre todas as unidades organizacionais, para evitar conflitos no roteamento de tickets.

#### Acceptance Criteria

1. WHEN an email is assigned to an Organizational_Unit, THE System SHALL verify the email is not already used by another Direction, Department, or Section within the same organization
2. WHEN a duplicate email is detected, THE System SHALL reject the operation and return a descriptive error message
3. WHEN updating an email to the same value it already has, THE System SHALL allow the operation
4. WHEN an email is removed (set to null), THE System SHALL allow the operation without uniqueness validation

### Requirement 4: Ticket Creation from Email

**User Story:** Como usuário externo, quero enviar um email para o endereço de uma Direção, Departamento ou Secção, para que um ticket seja criado automaticamente e roteado para os usuários dessa unidade organizacional.

#### Acceptance Criteria

1. WHEN an email is received at an address associated with a Direction, THE Email_Inbox_Service SHALL create a new ticket assigned to that Direction
2. WHEN an email is received at an address associated with a Department, THE Email_Inbox_Service SHALL create a new ticket assigned to that Department
3. WHEN an email is received at an address associated with a Section, THE Email_Inbox_Service SHALL create a new ticket assigned to that Section
4. WHEN creating a ticket from email, THE System SHALL extract the sender email as the requester
5. WHEN creating a ticket from email, THE System SHALL use the email subject as the ticket title
6. WHEN creating a ticket from email, THE System SHALL use the email body as the ticket description
7. WHEN creating a ticket from email, THE System SHALL preserve email attachments as ticket attachments

### Requirement 5: Email Routing Logic

**User Story:** Como desenvolvedor do sistema, quero que o serviço de email identifique corretamente qual unidade organizacional deve receber o ticket, para garantir roteamento preciso.

#### Acceptance Criteria

1. WHEN processing an incoming email, THE Email_Inbox_Service SHALL query all Directions, Departments, and Sections to find a matching email address
2. WHEN multiple organizational units have the same email (should not happen due to uniqueness validation), THE System SHALL log an error and assign to the first match found
3. WHEN no organizational unit matches the destination email, THE System SHALL create an unassigned ticket or route to a default queue
4. WHEN a match is found, THE System SHALL set the appropriate directionId, departmentId, or sectionId on the created ticket

### Requirement 6: Database Migration

**User Story:** Como administrador do sistema, quero que a estrutura do banco de dados seja atualizada automaticamente, para suportar emails em Direções e Secções sem perda de dados.

#### Acceptance Criteria

1. THE Migration_Script SHALL add an email column to the directions table
2. THE Migration_Script SHALL add an email column to the sections table
3. THE Migration_Script SHALL add email validation constraints to both tables
4. THE Migration_Script SHALL create indexes on email columns for performance
5. WHEN the migration runs on existing data, THE System SHALL preserve all existing records without data loss

### Requirement 7: API Endpoints Update

**User Story:** Como desenvolvedor frontend, quero que as APIs de Direções e Secções aceitem e retornem o campo email, para que eu possa exibir e editar esses valores na interface.

#### Acceptance Criteria

1. WHEN listing Directions via API, THE System SHALL include the email field in the response
2. WHEN creating a Direction via API, THE System SHALL accept an optional email parameter
3. WHEN updating a Direction via API, THE System SHALL accept an optional email parameter
4. WHEN listing Sections via API, THE System SHALL include the email field in the response
5. WHEN creating a Section via API, THE System SHALL accept an optional email parameter
6. WHEN updating a Section via API, THE System SHALL accept an optional email parameter

### Requirement 8: Frontend Form Updates

**User Story:** Como usuário do Portal das Organizações, quero ver campos de email nos formulários de criação e edição de Direções e Secções, para que eu possa configurar o roteamento de tickets por email.

#### Acceptance Criteria

1. WHEN opening the create Direction form, THE Portal_Organization SHALL display an email input field with placeholder text
2. WHEN opening the edit Direction form, THE Portal_Organization SHALL display the current email value
3. WHEN opening the create Section form, THE Portal_Organization SHALL display an email input field with placeholder text
4. WHEN opening the edit Section form, THE Portal_Organization SHALL display the current email value
5. WHEN submitting forms with invalid email, THE Portal_Organization SHALL display inline validation errors
6. WHEN submitting forms with duplicate email, THE Portal_Organization SHALL display the error message returned by the API

### Requirement 9: Email Display in Lists

**User Story:** Como usuário do Portal das Organizações, quero ver os emails associados a Direções e Secções nas listagens, para identificar rapidamente quais unidades têm roteamento de email configurado.

#### Acceptance Criteria

1. WHEN viewing the Directions list, THE Portal_Organization SHALL display the email column
2. WHEN viewing the Sections list, THE Portal_Organization SHALL display the email column
3. WHEN an Organizational_Unit has no email configured, THE System SHALL display a placeholder (e.g., "—" or "Não configurado")
4. WHEN an Organizational_Unit has an email configured, THE System SHALL display the full email address

### Requirement 10: Backward Compatibility

**User Story:** Como administrador do sistema, quero que a funcionalidade existente de emails em Departamentos continue funcionando, para garantir que não haja regressões.

#### Acceptance Criteria

1. WHEN the new email fields are added, THE System SHALL maintain all existing Department email functionality
2. WHEN tickets are created from emails sent to Department addresses, THE System SHALL continue routing correctly
3. WHEN querying for organizational units by email, THE System SHALL search across Directions, Departments, and Sections
4. WHEN existing Department emails are present, THE System SHALL validate uniqueness against the new Direction and Section emails
