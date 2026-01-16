# Implementation Plan: Project Management Module

## Overview

Este plano implementa o módulo de Gestão de Projetos para o Portal de Organizações, seguindo uma abordagem incremental que começa pelo backend (modelos e API) e depois avança para o frontend (páginas e componentes).

## Tasks

- [x] 1. Setup da Base de Dados
  - [x] 1.1 Criar migration SQL para todas as tabelas do módulo de projetos
    - Criar tabelas: projects, project_phases, project_tasks, project_task_dependencies, project_stakeholders, project_tickets, project_task_comments, project_task_attachments
    - Adicionar índices para performance
    - Adicionar constraints e foreign keys
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [x] 2. Modelos Sequelize do Backend
  - [x] 2.1 Criar modelo Project com validações
    - Campos: id, providerId, code, name, description, methodology, status, startDate, endDate, progress, createdBy
    - Validações para methodology e status
    - Hook para gerar código único (PRJ-XXX)
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 2.2 Criar modelo ProjectPhase com validações
    - Campos: id, projectId, name, description, startDate, endDate, orderIndex, status, progress
    - Associação com Project
    - _Requirements: 2.1_
  - [x] 2.3 Criar modelo ProjectTask com validações
    - Campos: id, projectId, phaseId, title, description, status, priority, estimatedHours, actualHours, startDate, dueDate, assignedTo, orderIndex, progress
    - Associações com Project, Phase, User
    - _Requirements: 3.1, 3.2_
  - [x] 2.4 Criar modelos auxiliares (TaskDependency, Stakeholder, TaskComment, TaskAttachment, ProjectTicket)
    - TaskDependency com validação de dependência circular
    - Stakeholder com validação de role e type
    - _Requirements: 3.3, 4.1, 5.1_
  - [x] 2.5 Configurar associações entre todos os modelos
    - Project hasMany Phases, Tasks, Stakeholders, ProjectTickets
    - Phase hasMany Tasks
    - Task hasMany Comments, Attachments, Dependencies
    - _Requirements: All_

- [x] 3. Controller e Rotas do Backend - Projetos
  - [x] 3.1 Implementar CRUD de projetos
    - GET /projects - listar com filtros e paginação
    - GET /projects/:id - detalhes do projeto
    - POST /projects - criar projeto
    - PUT /projects/:id - atualizar projeto
    - DELETE /projects/:id - arquivar projeto
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 10.1-10.7_
  - [x] 3.2 Escrever testes de propriedade para projetos
    - **Property 1: Project Code Uniqueness**
    - **Property 2: Project CRUD Operations**
    - **Property 3: Methodology Validation**
    - **Property 4: Project Filtering**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6**

- [x] 4. Controller e Rotas do Backend - Fases
  - [x] 4.1 Implementar CRUD de fases
    - GET /projects/:id/phases - listar fases
    - POST /projects/:id/phases - criar fase
    - PUT /projects/:id/phases/:phaseId - atualizar fase
    - DELETE /projects/:id/phases/:phaseId - deletar fase (com proteção)
    - PUT /projects/:id/phases/reorder - reordenar fases
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 4.2 Implementar cálculo automático de progresso de fase
    - Calcular progresso baseado em tarefas completadas
    - Auto-completar fase quando todas tarefas estão done
    - _Requirements: 2.6, 2.7_
  - [x] 4.3 Escrever testes de propriedade para fases
    - **Property 5: Phase Ordering**
    - **Property 6: Phase Deletion Protection**
    - **Property 7: Phase Progress Calculation**
    - **Property 8: Phase Auto-Completion**
    - **Validates: Requirements 2.2, 2.5, 2.6, 2.7**

- [x] 5. Controller e Rotas do Backend - Tarefas
  - [x] 5.1 Implementar CRUD de tarefas
    - GET /projects/:id/tasks - listar todas as tarefas
    - GET /projects/:id/phases/:phaseId/tasks - listar tarefas da fase
    - POST /projects/:id/phases/:phaseId/tasks - criar tarefa
    - PUT /projects/:id/tasks/:taskId - atualizar tarefa
    - DELETE /projects/:id/tasks/:taskId - deletar tarefa
    - PUT /projects/:id/tasks/:taskId/move - mover tarefa (Kanban)
    - _Requirements: 3.1, 3.4, 3.5, 3.6_
  - [x] 5.2 Implementar dependências de tarefas
    - Adicionar/remover dependências
    - Validar dependências circulares
    - _Requirements: 3.3_
  - [x] 5.3 Implementar comentários e anexos em tarefas
    - POST /projects/:id/tasks/:taskId/comments
    - POST /projects/:id/tasks/:taskId/attachments
    - _Requirements: 3.8, 3.9_
  - [x] 5.4 Implementar recálculo de progresso ao mudar status
    - Atualizar progresso da fase e projeto
    - _Requirements: 3.7_
  - [x] 5.5 Escrever testes de propriedade para tarefas
    - **Property 9: Task Status Validation**
    - **Property 10: Task Assignment Persistence**
    - **Property 11: Task Dependencies**
    - **Property 12: Progress Recalculation**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.7**

- [x] 6. Controller e Rotas do Backend - Stakeholders
  - [x] 6.1 Implementar CRUD de stakeholders
    - GET /projects/:id/stakeholders - listar stakeholders
    - POST /projects/:id/stakeholders - adicionar stakeholder
    - PUT /projects/:id/stakeholders/:shId - atualizar stakeholder
    - DELETE /projects/:id/stakeholders/:shId - remover stakeholder
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_
  - [x] 6.2 Escrever testes de propriedade para stakeholders
    - **Property 13: Stakeholder Role Validation**
    - **Validates: Requirements 4.4**

- [x] 7. Controller e Rotas do Backend - Associação de Tickets
  - [x] 7.1 Implementar associação de tickets
    - GET /projects/:id/tickets - listar tickets associados
    - POST /projects/:id/tickets - associar ticket ao projeto
    - POST /projects/:id/tasks/:taskId/tickets - associar ticket à tarefa
    - DELETE /projects/:id/tickets/:ticketId - desassociar ticket
    - _Requirements: 5.1, 5.2, 5.5_
  - [x] 7.2 Atualizar ticket controller para mostrar projeto/tarefa associados
    - Incluir informação de projeto/tarefa na resposta do ticket
    - _Requirements: 5.6_
  - [x] 7.3 Escrever testes de propriedade para associação de tickets
    - **Property 14: Ticket-Project Association**
    - **Property 15: Ticket-Task Association**
    - **Property 16: Multiple Ticket Links**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.6, 5.7**

- [ ] 8. Controller e Rotas do Backend - Dashboard e Gantt
  - [x] 8.1 Implementar endpoint de dashboard do projeto
    - GET /projects/:id/dashboard
    - Retornar progresso, estatísticas, deadlines, atividade recente
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  - [x] 8.2 Implementar endpoint de dados para Gantt
    - GET /projects/:id/gantt
    - Retornar fases, tarefas, dependências formatados para Gantt
    - _Requirements: 7.1, 7.2, 7.4, 7.5_
  - [x] 8.3 Escrever testes de propriedade para dashboard
    - **Property 21: Overdue Task Identification**
    - **Property 22: Dashboard Statistics**
    - **Validates: Requirements 7.4, 8.2**

- [ ] 9. Permissões e Middleware
  - [x] 9.1 Adicionar permissões ao sistema RBAC
    - projects.view, projects.create, projects.update, projects.delete
    - project_tasks.view, project_tasks.create, project_tasks.update, project_tasks.delete
    - project_stakeholders.manage
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 9.2 Implementar middleware de verificação de permissões
    - Verificar permissões globais
    - Permitir acesso ao criador do projeto
    - _Requirements: 9.4, 9.5_
  - [x] 9.3 Escrever testes de propriedade para permissões
    - **Property 23: Permission Enforcement**
    - **Property 24: Owner Access**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [ ] 10. Checkpoint Backend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Frontend - Service e Tipos
  - [x] 11.1 Criar projectService.js com todos os métodos de API
    - Métodos para projetos, fases, tarefas, stakeholders, tickets
    - _Requirements: All_

- [ ] 12. Frontend - Página de Lista de Projetos
  - [x] 12.1 Criar página Projects.jsx
    - Tabela com projetos
    - Filtros por status, metodologia, data
    - Pesquisa por nome/código
    - Paginação
    - Botão criar novo projeto
    - _Requirements: 1.6, 10.1-10.7_
  - [x] 12.2 Escrever testes para filtros e pesquisa
    - **Property 4: Project Filtering**
    - **Property 25: Search Functionality**
    - **Property 26: Pagination**
    - **Validates: Requirements 10.2, 10.3, 10.4, 10.5, 10.7**

- [ ] 13. Frontend - Formulário de Projeto
  - [x] 13.1 Criar componente ProjectForm.jsx
    - Formulário para criar/editar projeto
    - Campos: nome, descrição, metodologia, datas, status
    - Validação de formulário
    - _Requirements: 1.1, 1.2, 1.4_

- [ ] 14. Frontend - Dashboard do Projeto
  - [x] 14.1 Criar página ProjectDetail.jsx
    - Cards de estatísticas (progresso, tarefas, etc.)
    - Lista de fases com progresso
    - Atividade recente
    - Stakeholders resumo
    - Tickets associados resumo
    - Navegação para Kanban e Gantt
    - _Requirements: 1.7, 8.1-8.7_
  - [x] 14.2 Criar componentes auxiliares (PhaseCard, ProjectStats)
    - PhaseCard com progresso e tarefas
    - ProjectStats com métricas
    - _Requirements: 8.1, 8.2_

- [ ] 15. Frontend - Gestão de Fases
  - [x] 15.1 Criar componente PhaseManager.jsx
    - Lista de fases com drag & drop para reordenar
    - Modal para criar/editar fase
    - Botão deletar (com confirmação)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 16. Frontend - Gestão de Tarefas
  - [x] 16.1 Criar componente TaskList.jsx
    - Lista de tarefas por fase
    - Modal para criar/editar tarefa
    - Atribuição de responsável
    - Gestão de dependências
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [x] 16.2 Criar componente TaskDetail.jsx
    - Detalhes da tarefa
    - Comentários
    - Anexos
    - _Requirements: 3.8, 3.9_

- [ ] 17. Frontend - Kanban Board
  - [x] 17.1 Criar página ProjectKanban.jsx
    - Colunas por status (To Do, In Progress, In Review, Done)
    - Cards de tarefas com drag & drop
    - Filtros por fase, responsável, prioridade
    - Contagem de tarefas por coluna
    - _Requirements: 6.1-6.7_
  - [x] 17.2 Escrever testes para Kanban
    - **Property 17: Kanban Task Grouping**
    - **Property 18: Kanban Drag and Drop**
    - **Property 19: Kanban Filtering**
    - **Property 20: Kanban Column Counts**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5, 6.7**

- [ ] 18. Frontend - Diagrama de Gantt
  - [x] 18.1 Criar página ProjectGantt.jsx
    - Integrar biblioteca de Gantt (gantt-task-react ou similar)
    - Mostrar fases e tarefas como barras
    - Mostrar dependências como linhas
    - Zoom (dia, semana, mês)
    - Linha do dia atual
    - Destacar tarefas atrasadas
    - _Requirements: 7.1-7.7_
  - [x] 18.2 Implementar exportação do Gantt
    - Exportar como PDF ou imagem
    - _Requirements: 7.8_

- [ ] 19. Frontend - Gestão de Stakeholders
  - [x] 19.1 Criar componente StakeholderManager.jsx
    - Lista de stakeholders
    - Modal para adicionar/editar
    - Seleção de utilizadores internos
    - Formulário para externos
    - _Requirements: 4.1-4.7_

- [ ] 20. Frontend - Associação de Tickets
  - [x] 20.1 Criar componente TicketAssociation.jsx
    - Lista de tickets associados
    - Modal para associar ticket
    - Opção de associar a tarefa específica
    - _Requirements: 5.1-5.7_
  - [x] 20.2 Atualizar TicketDetail.jsx para mostrar projeto/tarefa
    - Mostrar informação de projeto/tarefa associados
    - Link para o projeto
    - _Requirements: 5.6_

- [x] 21. Frontend - Navegação e Rotas
  - [x] 21.1 Adicionar rotas ao App.jsx
    - /projects - lista de projetos
    - /projects/new - criar projeto
    - /projects/:id - dashboard do projeto
    - /projects/:id/edit - editar projeto
    - /projects/:id/kanban - vista Kanban
    - /projects/:id/gantt - diagrama de Gantt
    - _Requirements: All_
  - [x] 21.2 Adicionar menu "Projetos" à Sidebar
    - Ícone e link para /projects
    - Submenu com Dashboard, Kanban, Gantt
    - _Requirements: All_

- [x] 22. Checkpoint Final
  - Ensure all tests pass, ask the user if questions arise.
  - Verificar todas as funcionalidades
  - Testar fluxos completos

## Notes

- All tasks including tests are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- A biblioteca recomendada para o Gantt é `gantt-task-react` ou `frappe-gantt`
- Para drag & drop no Kanban, usar `react-beautiful-dnd` (já instalado no projeto)
