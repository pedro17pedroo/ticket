# Requirements Document

## Introduction

Este documento define os requisitos para o módulo de Gestão de Projetos no Portal de Organizações (Tenant). O módulo permitirá às organizações criar e gerir projetos completos, incluindo metodologias, fases, tarefas, stakeholders, cronogramas e visualizações Kanban e Gantt. O sistema também permite associar tickets a projetos e tarefas, possibilitando que tickets sejam resolvidos através de projetos ou tarefas específicas.

## Glossary

- **Project**: Entidade principal que representa um projeto com nome, descrição, datas, status e metodologia
- **Project_Phase**: Fase de um projeto que agrupa tarefas relacionadas (ex: Análise, Desenvolvimento, Testes)
- **Project_Task**: Tarefa específica dentro de uma fase do projeto
- **Stakeholder**: Pessoa interessada ou interveniente no projeto (pode ser interno ou externo)
- **Methodology**: Metodologia de gestão do projeto (Waterfall, Agile, Scrum, Kanban, Híbrido)
- **Gantt_Chart**: Diagrama de barras que mostra o cronograma do projeto
- **Kanban_Board**: Quadro visual para gestão de tarefas por status
- **Ticket_Association**: Ligação entre um ticket e um projeto ou tarefa

## Requirements

### Requirement 1: Gestão de Projetos

**User Story:** As a organization user, I want to create and manage projects, so that I can organize work into structured initiatives with clear objectives.

#### Acceptance Criteria

1. THE Project_Manager SHALL allow creating a new project with name, description, start date, end date, and status
2. THE Project_Manager SHALL allow selecting a methodology for the project (Waterfall, Agile, Scrum, Kanban, Hybrid)
3. WHEN a project is created THEN THE System SHALL generate a unique project code (e.g., PRJ-001)
4. THE Project_Manager SHALL allow editing project details including name, description, dates, status, and methodology
5. THE Project_Manager SHALL allow archiving projects that are completed or cancelled
6. THE Project_List SHALL display all projects with filtering by status, methodology, and date range
7. WHEN viewing a project THEN THE System SHALL display a dashboard with progress summary, phases, tasks, and stakeholders

### Requirement 2: Gestão de Fases do Projeto

**User Story:** As a project manager, I want to define project phases, so that I can organize the project into logical stages.

#### Acceptance Criteria

1. WHEN a project exists THEN THE Phase_Manager SHALL allow creating phases with name, description, start date, end date, and order
2. THE Phase_Manager SHALL allow reordering phases via drag and drop
3. THE Phase_Manager SHALL allow editing phase details
4. THE Phase_Manager SHALL allow deleting phases that have no tasks
5. IF a phase has tasks THEN THE System SHALL prevent deletion and show a warning
6. THE Phase_Manager SHALL display phase progress based on completed tasks percentage
7. WHEN all tasks in a phase are completed THEN THE System SHALL mark the phase as complete

### Requirement 3: Gestão de Tarefas do Projeto

**User Story:** As a project team member, I want to create and manage tasks within project phases, so that I can track specific work items.

#### Acceptance Criteria

1. WHEN a phase exists THEN THE Task_Manager SHALL allow creating tasks with title, description, priority, estimated hours, start date, due date, and status
2. THE Task_Manager SHALL allow assigning a responsible user to each task
3. THE Task_Manager SHALL allow setting task dependencies (predecessor tasks)
4. THE Task_Manager SHALL allow updating task status (To Do, In Progress, In Review, Done)
5. THE Task_Manager SHALL allow editing task details
6. THE Task_Manager SHALL allow deleting tasks
7. WHEN a task status changes THEN THE System SHALL recalculate phase and project progress
8. THE Task_Manager SHALL allow adding comments to tasks
9. THE Task_Manager SHALL allow attaching files to tasks

### Requirement 4: Gestão de Stakeholders

**User Story:** As a project manager, I want to manage project stakeholders, so that I can track all interested parties and their roles.

#### Acceptance Criteria

1. THE Stakeholder_Manager SHALL allow adding stakeholders to a project with name, role, email, and type (Internal/External)
2. THE Stakeholder_Manager SHALL allow selecting internal users from the organization as stakeholders
3. THE Stakeholder_Manager SHALL allow adding external stakeholders with contact information
4. THE Stakeholder_Manager SHALL allow defining stakeholder roles (Sponsor, Manager, Team Member, Observer, Client)
5. THE Stakeholder_Manager SHALL allow editing stakeholder information
6. THE Stakeholder_Manager SHALL allow removing stakeholders from a project
7. THE Stakeholder_List SHALL display all stakeholders with their roles and contact information

### Requirement 5: Associação de Tickets a Projetos e Tarefas

**User Story:** As a support agent, I want to associate tickets with projects or tasks, so that I can track which tickets are resolved through project work.

#### Acceptance Criteria

1. THE Ticket_Association SHALL allow linking a ticket to a project
2. THE Ticket_Association SHALL allow linking a ticket to a specific task within a project
3. WHEN a ticket is linked to a project THEN THE Project_View SHALL display the associated tickets
4. WHEN a ticket is linked to a task THEN THE Task_View SHALL display the associated tickets
5. THE Ticket_Association SHALL allow unlinking a ticket from a project or task
6. WHEN viewing a ticket THEN THE System SHALL display any associated project or task information
7. THE Ticket_Association SHALL allow linking multiple tickets to the same project or task

### Requirement 6: Visualização Kanban

**User Story:** As a project team member, I want to view and manage tasks in a Kanban board, so that I can visually track work progress.

#### Acceptance Criteria

1. THE Kanban_Board SHALL display tasks organized by status columns (To Do, In Progress, In Review, Done)
2. THE Kanban_Board SHALL allow moving tasks between columns via drag and drop
3. WHEN a task is moved to a different column THEN THE System SHALL update the task status
4. THE Kanban_Board SHALL display task cards with title, assignee, priority, and due date
5. THE Kanban_Board SHALL allow filtering tasks by phase, assignee, and priority
6. THE Kanban_Board SHALL allow quick editing of task details from the card
7. THE Kanban_Board SHALL display the count of tasks in each column

### Requirement 7: Diagrama de Gantt (Cronograma)

**User Story:** As a project manager, I want to view the project timeline in a Gantt chart, so that I can visualize the schedule and dependencies.

#### Acceptance Criteria

1. THE Gantt_Chart SHALL display phases and tasks as horizontal bars on a timeline
2. THE Gantt_Chart SHALL show task dependencies as connecting lines
3. THE Gantt_Chart SHALL allow zooming in/out to view different time scales (day, week, month)
4. THE Gantt_Chart SHALL highlight overdue tasks in red
5. THE Gantt_Chart SHALL display task progress within each bar
6. THE Gantt_Chart SHALL allow clicking on a task to view/edit details
7. THE Gantt_Chart SHALL display the current date as a vertical line
8. THE Gantt_Chart SHALL allow exporting the chart as PDF or image

### Requirement 8: Dashboard do Projeto

**User Story:** As a project manager, I want to see a project dashboard, so that I can quickly understand project health and progress.

#### Acceptance Criteria

1. THE Project_Dashboard SHALL display overall project progress percentage
2. THE Project_Dashboard SHALL display task statistics (total, completed, in progress, overdue)
3. THE Project_Dashboard SHALL display a timeline of upcoming deadlines
4. THE Project_Dashboard SHALL display recent activity (task updates, comments, status changes)
5. THE Project_Dashboard SHALL display stakeholder summary
6. THE Project_Dashboard SHALL display associated tickets summary
7. THE Project_Dashboard SHALL allow quick navigation to phases, tasks, Kanban, and Gantt views

### Requirement 9: Permissões e Acesso

**User Story:** As an administrator, I want to control access to project management features, so that I can ensure proper authorization.

#### Acceptance Criteria

1. THE Permission_System SHALL define permissions for projects.view, projects.create, projects.update, projects.delete
2. THE Permission_System SHALL define permissions for project_tasks.view, project_tasks.create, project_tasks.update, project_tasks.delete
3. THE Permission_System SHALL define permissions for project_stakeholders.manage
4. WHEN a user lacks permission THEN THE System SHALL hide or disable the corresponding features
5. THE Permission_System SHALL allow project managers to manage their own projects regardless of global permissions

### Requirement 10: Listagem e Filtros de Projetos

**User Story:** As a user, I want to search and filter projects, so that I can quickly find the projects I need.

#### Acceptance Criteria

1. THE Project_List SHALL display projects in a table with columns for code, name, status, methodology, progress, start date, end date
2. THE Project_List SHALL allow searching by project name or code
3. THE Project_List SHALL allow filtering by status (Planning, In Progress, On Hold, Completed, Cancelled)
4. THE Project_List SHALL allow filtering by methodology
5. THE Project_List SHALL allow filtering by date range
6. THE Project_List SHALL allow sorting by any column
7. THE Project_List SHALL support pagination for large datasets
