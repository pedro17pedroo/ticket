# Design Document: Project Reports

## Overview

Este documento descreve a arquitetura e design do sistema de Relatórios de Projetos. O sistema permite gerar diversos tipos de documentos em PDF e Excel, utilizando templates corporativos e dados em tempo real dos projetos.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
├─────────────────────────────────────────────────────────────────┤
│  ProjectReports.jsx    │  ReportGenerator.jsx  │  ReportHistory │
│  (Página principal)    │  (Geração de PDF)     │  (Histórico)   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      projectService.js                          │
│  - getReportData()  - generateReport()  - getReportHistory()   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend API                              │
├─────────────────────────────────────────────────────────────────┤
│  GET  /api/projects/:id/reports/data/:type                      │
│  POST /api/projects/:id/reports/generate                        │
│  GET  /api/projects/reports/history                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Report Generator Service                      │
│  - PDFKit / jsPDF (PDF generation)                              │
│  - ExcelJS (Excel generation)                                   │
│  - Report Templates                                             │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. ProjectReports Page
```jsx
// portalOrganizaçãoTenant/src/pages/ProjectReports.jsx
const ProjectReports = () => {
  // Lista de tipos de relatórios disponíveis
  // Seleção de projeto
  // Filtros e opções
  // Navegação para geração
}
```

#### 2. ReportGenerator Component
```jsx
// portalOrganizaçãoTenant/src/components/ReportGenerator.jsx
const ReportGenerator = ({ projectId, reportType, options }) => {
  // Preview do relatório
  // Opções de formato (PDF/Excel)
  // Botão de download
  // Loading state durante geração
}
```

#### 3. ReportHistory Component
```jsx
// portalOrganizaçãoTenant/src/components/ReportHistory.jsx
const ReportHistory = ({ projectId }) => {
  // Lista de relatórios gerados
  // Filtros por tipo/data
  // Download de relatórios anteriores
}
```

### Report Types Configuration

```javascript
const REPORT_TYPES = [
  {
    id: 'project_charter',
    name: 'Termo de Abertura',
    description: 'Documento formal de autorização do projeto',
    icon: 'FileText',
    formats: ['pdf'],
    color: 'blue'
  },
  {
    id: 'project_closure',
    name: 'Termo de Encerramento',
    description: 'Documento de conclusão do projeto',
    icon: 'FileCheck',
    formats: ['pdf'],
    color: 'green'
  },
  {
    id: 'status_report',
    name: 'Ponto de Situação',
    description: 'Relatório periódico do estado do projeto',
    icon: 'BarChart',
    formats: ['pdf', 'excel'],
    color: 'orange'
  },
  {
    id: 'schedule_report',
    name: 'Cronograma',
    description: 'Visão temporal de fases e tarefas',
    icon: 'Calendar',
    formats: ['pdf', 'excel'],
    color: 'purple'
  },
  {
    id: 'task_report',
    name: 'Lista de Tarefas',
    description: 'Relatório detalhado de todas as tarefas',
    icon: 'CheckSquare',
    formats: ['pdf', 'excel'],
    color: 'cyan'
  },
  {
    id: 'stakeholder_report',
    name: 'Lista de Stakeholders',
    description: 'Partes interessadas do projeto',
    icon: 'Users',
    formats: ['pdf', 'excel'],
    color: 'pink'
  },
  {
    id: 'executive_summary',
    name: 'Resumo Executivo',
    description: 'Visão geral em 1-2 páginas',
    icon: 'FileBarChart',
    formats: ['pdf'],
    color: 'indigo'
  }
]
```

### Backend API Endpoints

#### Get Report Data
```javascript
// GET /api/projects/:id/reports/data/:type
// Returns all data needed for a specific report type
{
  project: { /* project details */ },
  phases: [ /* phases with tasks */ ],
  stakeholders: [ /* stakeholders */ ],
  stats: { /* calculated statistics */ },
  organization: { /* org info for header */ }
}
```

#### Generate Report
```javascript
// POST /api/projects/:id/reports/generate
// Body: { type: 'status_report', format: 'pdf', options: {} }
// Returns: { reportId, downloadUrl, filename }
```

#### Get Report History
```javascript
// GET /api/projects/reports/history
// Query: { projectId?, type?, startDate?, endDate?, page, limit }
// Returns: { reports: [], total, page }
```

## Data Models

### Report History Model
```javascript
// project_reports table
{
  id: UUID,
  organization_id: UUID,
  project_id: UUID,
  type: ENUM('project_charter', 'project_closure', 'status_report', ...),
  format: ENUM('pdf', 'excel'),
  filename: STRING,
  file_path: STRING,
  file_size: INTEGER,
  options: JSONB, // Report generation options
  generated_by: UUID, // Reference to organization_users
  generated_at: TIMESTAMP,
  expires_at: TIMESTAMP, // For cleanup
  created_at: TIMESTAMP
}
```

### Report Options Schema
```javascript
// Options for different report types
{
  status_report: {
    period: { start: Date, end: Date },
    includeOverdueTasks: boolean,
    includeCharts: boolean
  },
  task_report: {
    filterByStatus: string[],
    filterByPriority: string[],
    filterByPhase: string[],
    filterByAssignee: string[],
    groupBy: 'phase' | 'status' | 'priority' | 'assignee'
  },
  schedule_report: {
    filterByPhase: string[],
    includeGantt: boolean,
    includeDependencies: boolean
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system - essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Report Data Completeness

*For any* project and report type, when report data is requested, the response SHALL contain all required fields for that report type as specified in the requirements.

**Validates: Requirements 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1**

### Property 2: Multi-Format Export Support

*For any* report type that supports multiple formats (PDF, Excel), generating the report in each supported format SHALL produce a valid file of the correct type.

**Validates: Requirements 5.3, 6.2, 7.3, 8.2**

### Property 3: Filter Application Correctness

*For any* set of filter criteria applied to a report, all items in the generated report SHALL match the specified filter criteria.

**Validates: Requirements 2.4, 6.3, 7.2**

### Property 4: Report History Persistence

*For any* report that is generated, a corresponding entry SHALL be created in the report history with correct metadata (type, project, date, user).

**Validates: Requirements 10.1, 10.2**

### Property 5: Permission-Based Access

*For any* user without project view permissions, the reports submenu and reports page SHALL NOT be accessible.

**Validates: Requirements 1.3**

### Property 6: Task Statistics Accuracy

*For any* task report, the totals and statistics included SHALL accurately reflect the sum/count of the tasks in the report.

**Validates: Requirements 7.4**

### Property 7: Stakeholder Grouping Consistency

*For any* stakeholder report with grouping enabled, all stakeholders within a group SHALL share the same grouping attribute value.

**Validates: Requirements 8.3**

### Property 8: Incomplete Project Warning

*For any* project that is not in "completed" status, requesting a closure report SHALL trigger a warning but still allow generation.

**Validates: Requirements 4.3**

## Error Handling

### Frontend Errors
- Network errors during report generation: Show retry option
- Invalid project selection: Disable generate button
- Empty report data: Show informative message
- Download failures: Provide alternative download link

### Backend Errors
- Missing project data: Return 404 with clear message
- PDF generation failure: Log error, return 500 with user-friendly message
- Database errors: Rollback transaction, return 500
- File storage errors: Retry with exponential backoff

### Validation Errors
- Invalid report type: Return 400 with valid options
- Invalid date range: Return 400 with correction suggestion
- Missing required filters: Return 400 with required fields

## Testing Strategy

### Unit Tests
- Report data aggregation functions
- Filter application logic
- Statistics calculation
- Date range validation
- Permission checks

### Property-Based Tests
- Report data completeness (Property 1)
- Filter correctness (Property 3)
- Statistics accuracy (Property 6)
- Grouping consistency (Property 7)

### Integration Tests
- Full report generation flow
- File download functionality
- History persistence
- Permission enforcement

### Testing Configuration
- Property tests: minimum 100 iterations
- Use fast-check for JavaScript property testing
- Mock PDF generation for faster tests
- Use test database for integration tests
