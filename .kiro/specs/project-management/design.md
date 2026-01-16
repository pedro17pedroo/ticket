# Design Document: Project Management Module

## Overview

O módulo de Gestão de Projetos é uma extensão do Portal de Organizações que permite criar e gerir projetos completos com metodologias, fases, tarefas, stakeholders e visualizações avançadas (Kanban e Gantt). O sistema integra-se com o módulo de tickets existente, permitindo associar tickets a projetos e tarefas.

### Key Features
- Criação e gestão de projetos com diferentes metodologias
- Estrutura hierárquica: Projeto → Fases → Tarefas
- Gestão de stakeholders (internos e externos)
- Associação de tickets a projetos e tarefas
- Visualização Kanban para gestão visual de tarefas
- Diagrama de Gantt para cronograma e dependências
- Dashboard com métricas e progresso

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                       │
├─────────────────────────────────────────────────────────────────┤
│  Pages:                                                          │
│  ├── Projects.jsx (Lista de projetos)                           │
│  ├── ProjectDetail.jsx (Dashboard do projeto)                   │
│  ├── ProjectKanban.jsx (Vista Kanban)                           │
│  ├── ProjectGantt.jsx (Diagrama de Gantt)                       │
│  └── ProjectForm.jsx (Criar/Editar projeto)                     │
├─────────────────────────────────────────────────────────────────┤
│  Components:                                                     │
│  ├── PhaseCard.jsx                                              │
│  ├── TaskCard.jsx                                               │
│  ├── StakeholderList.jsx                                        │
│  ├── GanttChart.jsx                                             │
│  └── ProjectStats.jsx                                           │
├─────────────────────────────────────────────────────────────────┤
│  Services:                                                       │
│  └── projectService.js (API calls)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Node.js + Express)                   │
├─────────────────────────────────────────────────────────────────┤
│  Routes:                                                         │
│  └── /api/provider/projects/*                                   │
├─────────────────────────────────────────────────────────────────┤
│  Controllers:                                                    │
│  └── projectController.js                                       │
├─────────────────────────────────────────────────────────────────┤
│  Models:                                                         │
│  ├── Project.js                                                 │
│  ├── ProjectPhase.js                                            │
│  ├── ProjectTask.js                                             │
│  ├── ProjectStakeholder.js                                      │
│  ├── ProjectTicket.js                                           │
│  ├── TaskComment.js                                             │
│  └── TaskAttachment.js                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                         │
├─────────────────────────────────────────────────────────────────┤
│  Tables:                                                         │
│  ├── projects                                                   │
│  ├── project_phases                                             │
│  ├── project_tasks                                              │
│  ├── project_stakeholders                                       │
│  ├── project_tickets                                            │
│  ├── project_task_comments                                      │
│  ├── project_task_attachments                                   │
│  └── project_task_dependencies                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Backend API Endpoints

```
Projects:
  GET    /api/provider/projects              - List all projects
  GET    /api/provider/projects/:id          - Get project details
  POST   /api/provider/projects              - Create project
  PUT    /api/provider/projects/:id          - Update project
  DELETE /api/provider/projects/:id          - Delete/Archive project
  GET    /api/provider/projects/:id/dashboard - Get project dashboard data

Phases:
  GET    /api/provider/projects/:id/phases           - List phases
  POST   /api/provider/projects/:id/phases           - Create phase
  PUT    /api/provider/projects/:id/phases/:phaseId  - Update phase
  DELETE /api/provider/projects/:id/phases/:phaseId  - Delete phase
  PUT    /api/provider/projects/:id/phases/reorder   - Reorder phases

Tasks:
  GET    /api/provider/projects/:id/tasks                    - List all tasks
  GET    /api/provider/projects/:id/phases/:phaseId/tasks    - List phase tasks
  POST   /api/provider/projects/:id/phases/:phaseId/tasks    - Create task
  PUT    /api/provider/projects/:id/tasks/:taskId            - Update task
  DELETE /api/provider/projects/:id/tasks/:taskId            - Delete task
  PUT    /api/provider/projects/:id/tasks/:taskId/move       - Move task (Kanban)
  POST   /api/provider/projects/:id/tasks/:taskId/comments   - Add comment
  POST   /api/provider/projects/:id/tasks/:taskId/attachments - Add attachment

Stakeholders:
  GET    /api/provider/projects/:id/stakeholders             - List stakeholders
  POST   /api/provider/projects/:id/stakeholders             - Add stakeholder
  PUT    /api/provider/projects/:id/stakeholders/:shId       - Update stakeholder
  DELETE /api/provider/projects/:id/stakeholders/:shId       - Remove stakeholder

Ticket Association:
  GET    /api/provider/projects/:id/tickets                  - List linked tickets
  POST   /api/provider/projects/:id/tickets                  - Link ticket
  DELETE /api/provider/projects/:id/tickets/:ticketId        - Unlink ticket
  POST   /api/provider/projects/:id/tasks/:taskId/tickets    - Link ticket to task

Gantt:
  GET    /api/provider/projects/:id/gantt                    - Get Gantt data
  POST   /api/provider/projects/:id/gantt/export             - Export Gantt
```

### Frontend Components

```jsx
// ProjectService Interface
const projectService = {
  // Projects
  getAll(params),
  getById(id),
  create(data),
  update(id, data),
  delete(id),
  getDashboard(id),
  
  // Phases
  getPhases(projectId),
  createPhase(projectId, data),
  updatePhase(projectId, phaseId, data),
  deletePhase(projectId, phaseId),
  reorderPhases(projectId, phases),
  
  // Tasks
  getTasks(projectId, params),
  createTask(projectId, phaseId, data),
  updateTask(projectId, taskId, data),
  deleteTask(projectId, taskId),
  moveTask(projectId, taskId, data),
  addComment(projectId, taskId, data),
  addAttachment(projectId, taskId, file),
  
  // Stakeholders
  getStakeholders(projectId),
  addStakeholder(projectId, data),
  updateStakeholder(projectId, stakeholderId, data),
  removeStakeholder(projectId, stakeholderId),
  
  // Tickets
  getLinkedTickets(projectId),
  linkTicket(projectId, ticketId, taskId?),
  unlinkTicket(projectId, ticketId),
  
  // Gantt
  getGanttData(projectId),
  exportGantt(projectId, format)
}
```

## Data Models

### Project

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id),
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  methodology VARCHAR(50) NOT NULL DEFAULT 'waterfall',
  status VARCHAR(50) NOT NULL DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  progress INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  archived_at TIMESTAMP,
  
  CONSTRAINT valid_methodology CHECK (methodology IN ('waterfall', 'agile', 'scrum', 'kanban', 'hybrid')),
  CONSTRAINT valid_status CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled'))
);
```

### ProjectPhase

```sql
CREATE TABLE project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  order_index INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_phase_status CHECK (status IN ('pending', 'in_progress', 'completed'))
);
```

### ProjectTask

```sql
CREATE TABLE project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES project_phases(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'todo',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  estimated_hours DECIMAL(10,2),
  actual_hours DECIMAL(10,2),
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMP,
  assigned_to UUID REFERENCES users(id),
  order_index INTEGER NOT NULL DEFAULT 0,
  progress INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_task_status CHECK (status IN ('todo', 'in_progress', 'in_review', 'done')),
  CONSTRAINT valid_task_priority CHECK (priority IN ('low', 'medium', 'high', 'critical'))
);
```

### ProjectTaskDependency

```sql
CREATE TABLE project_task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  dependency_type VARCHAR(20) NOT NULL DEFAULT 'finish_to_start',
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_dependency_type CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id),
  UNIQUE(task_id, depends_on_task_id)
);
```

### ProjectStakeholder

```sql
CREATE TABLE project_stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'team_member',
  type VARCHAR(20) NOT NULL DEFAULT 'internal',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_stakeholder_role CHECK (role IN ('sponsor', 'manager', 'team_member', 'observer', 'client')),
  CONSTRAINT valid_stakeholder_type CHECK (type IN ('internal', 'external'))
);
```

### ProjectTicket

```sql
CREATE TABLE project_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  task_id UUID REFERENCES project_tasks(id) ON DELETE SET NULL,
  linked_at TIMESTAMP DEFAULT NOW(),
  linked_by UUID REFERENCES users(id),
  
  UNIQUE(project_id, ticket_id)
);
```

### ProjectTaskComment

```sql
CREATE TABLE project_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### ProjectTaskAttachment

```sql
CREATE TABLE project_task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size INTEGER,
  path VARCHAR(500) NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Entity Relationships Diagram

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Project   │──────<│  ProjectPhase   │──────<│  ProjectTask    │
└─────────────┘       └─────────────────┘       └─────────────────┘
      │                                                │    │
      │                                                │    │
      ▼                                                │    ▼
┌─────────────────┐                                    │  ┌─────────────────┐
│ProjectStakeholder│                                   │  │TaskDependency   │
└─────────────────┘                                    │  └─────────────────┘
      │                                                │
      ▼                                                ▼
┌─────────────────┐                              ┌─────────────────┐
│ ProjectTicket   │──────────────────────────────│  TaskComment    │
└─────────────────┘                              │  TaskAttachment │
      │                                          └─────────────────┘
      ▼
┌─────────────────┐
│     Ticket      │
└─────────────────┘
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Project Code Uniqueness
*For any* two projects created in the system, their generated codes SHALL be unique and follow the pattern PRJ-XXX.
**Validates: Requirements 1.3**

### Property 2: Project CRUD Operations
*For any* valid project data, creating a project and then retrieving it SHALL return the same data that was submitted.
**Validates: Requirements 1.1, 1.4**

### Property 3: Methodology Validation
*For any* project creation or update request, the methodology field SHALL only accept values from the set {waterfall, agile, scrum, kanban, hybrid}.
**Validates: Requirements 1.2**

### Property 4: Project Filtering
*For any* filter combination (status, methodology, date range), the returned projects SHALL all match the specified filter criteria.
**Validates: Requirements 1.6, 10.3, 10.4, 10.5**

### Property 5: Phase Ordering
*For any* project with multiple phases, reordering phases SHALL result in phases being returned in the new specified order.
**Validates: Requirements 2.2**

### Property 6: Phase Deletion Protection
*For any* phase that contains tasks, attempting to delete it SHALL fail with an appropriate error.
**Validates: Requirements 2.5**

### Property 7: Phase Progress Calculation
*For any* phase, the progress percentage SHALL equal (completed tasks / total tasks) * 100.
**Validates: Requirements 2.6**

### Property 8: Phase Auto-Completion
*For any* phase where all tasks have status 'done', the phase status SHALL be automatically set to 'completed'.
**Validates: Requirements 2.7**

### Property 9: Task Status Validation
*For any* task status update, the status SHALL only accept values from the set {todo, in_progress, in_review, done}.
**Validates: Requirements 3.4**

### Property 10: Task Assignment Persistence
*For any* task with an assigned user, retrieving the task SHALL return the correct assignee information.
**Validates: Requirements 3.2**

### Property 11: Task Dependencies
*For any* task with dependencies, the dependencies SHALL be correctly stored and retrieved, and no task can depend on itself.
**Validates: Requirements 3.3**

### Property 12: Progress Recalculation
*For any* task status change, the parent phase and project progress SHALL be recalculated to reflect the new state.
**Validates: Requirements 3.7**

### Property 13: Stakeholder Role Validation
*For any* stakeholder, the role SHALL only accept values from the set {sponsor, manager, team_member, observer, client}.
**Validates: Requirements 4.4**

### Property 14: Ticket-Project Association
*For any* ticket linked to a project, querying the project's tickets SHALL include that ticket, and querying the ticket SHALL show the project association.
**Validates: Requirements 5.1, 5.3, 5.6**

### Property 15: Ticket-Task Association
*For any* ticket linked to a task, querying the task's tickets SHALL include that ticket.
**Validates: Requirements 5.2, 5.4**

### Property 16: Multiple Ticket Links
*For any* project or task, multiple different tickets can be linked, and all SHALL be retrievable.
**Validates: Requirements 5.7**

### Property 17: Kanban Task Grouping
*For any* project's Kanban view, tasks SHALL be grouped by their status into the correct columns.
**Validates: Requirements 6.1**

### Property 18: Kanban Drag and Drop
*For any* task moved via Kanban drag and drop, the task's status SHALL be updated to match the target column.
**Validates: Requirements 6.2, 6.3**

### Property 19: Kanban Filtering
*For any* Kanban filter (phase, assignee, priority), only tasks matching the filter SHALL be displayed.
**Validates: Requirements 6.5**

### Property 20: Kanban Column Counts
*For any* Kanban column, the displayed count SHALL equal the actual number of tasks in that status.
**Validates: Requirements 6.7**

### Property 21: Overdue Task Identification
*For any* task with a due date in the past and status not 'done', it SHALL be marked as overdue.
**Validates: Requirements 7.4**

### Property 22: Dashboard Statistics
*For any* project dashboard, the task statistics (total, completed, in progress, overdue) SHALL accurately reflect the actual task counts.
**Validates: Requirements 8.2**

### Property 23: Permission Enforcement
*For any* user without the required permission, API requests to protected endpoints SHALL return 403 Forbidden.
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

### Property 24: Owner Access
*For any* project, the creator (owner) SHALL have full access regardless of global permissions.
**Validates: Requirements 9.5**

### Property 25: Search Functionality
*For any* search query, returned projects SHALL have names or codes containing the search term.
**Validates: Requirements 10.2**

### Property 26: Pagination
*For any* paginated request, the returned subset SHALL be correct based on page number and page size.
**Validates: Requirements 10.7**

## Error Handling

### API Error Responses

```javascript
// Standard error response format
{
  success: false,
  error: string,
  code?: string,
  details?: object
}

// Error codes
const ERROR_CODES = {
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  PHASE_NOT_FOUND: 'PHASE_NOT_FOUND',
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  PHASE_HAS_TASKS: 'PHASE_HAS_TASKS',
  INVALID_METHODOLOGY: 'INVALID_METHODOLOGY',
  INVALID_STATUS: 'INVALID_STATUS',
  INVALID_PRIORITY: 'INVALID_PRIORITY',
  CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  TICKET_ALREADY_LINKED: 'TICKET_ALREADY_LINKED',
  STAKEHOLDER_EXISTS: 'STAKEHOLDER_EXISTS'
}
```

### Validation Rules

1. Project name: Required, max 255 characters
2. Project code: Auto-generated, unique
3. Dates: End date must be >= start date
4. Phase order: Must be unique within project
5. Task dependencies: No circular dependencies allowed
6. Stakeholder email: Valid email format if provided

## Testing Strategy

### Unit Tests
- Model validation tests
- Service function tests
- Controller logic tests
- Permission checks

### Property-Based Tests
Using a property-based testing library (e.g., fast-check for JavaScript):

1. **Project Code Uniqueness**: Generate multiple projects and verify all codes are unique
2. **Filter Correctness**: Generate random filter combinations and verify results match criteria
3. **Progress Calculation**: Generate random task completion states and verify progress percentages
4. **Permission Enforcement**: Generate random user/permission combinations and verify access control

### Integration Tests
- Full CRUD flow for projects, phases, tasks
- Ticket association flow
- Kanban drag and drop flow
- Dashboard data aggregation

### E2E Tests
- Project creation wizard
- Kanban board interactions
- Gantt chart rendering
- Export functionality
