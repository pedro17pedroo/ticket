/**
 * Report Generator Constants
 * 
 * Defines report types, formats, and configuration.
 */

export const REPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel'
};

export const REPORT_TYPES = {
  project_charter: {
    id: 'project_charter',
    name: 'Termo de Abertura',
    description: 'Documento formal de autorização do projeto',
    formats: ['pdf'],
    color: '#3B82F6' // blue
  },
  project_closure: {
    id: 'project_closure',
    name: 'Termo de Encerramento',
    description: 'Documento de conclusão do projeto',
    formats: ['pdf'],
    color: '#10B981' // green
  },
  status_report: {
    id: 'status_report',
    name: 'Ponto de Situação',
    description: 'Relatório periódico do estado do projeto',
    formats: ['pdf', 'excel'],
    color: '#F59E0B' // orange
  },
  schedule_report: {
    id: 'schedule_report',
    name: 'Cronograma',
    description: 'Visão temporal de fases e tarefas',
    formats: ['pdf', 'excel'],
    color: '#8B5CF6' // purple
  },
  task_report: {
    id: 'task_report',
    name: 'Lista de Tarefas',
    description: 'Relatório detalhado de todas as tarefas',
    formats: ['pdf', 'excel'],
    color: '#06B6D4' // cyan
  },
  stakeholder_report: {
    id: 'stakeholder_report',
    name: 'Lista de Stakeholders',
    description: 'Partes interessadas do projeto',
    formats: ['pdf', 'excel'],
    color: '#EC4899' // pink
  },
  executive_summary: {
    id: 'executive_summary',
    name: 'Resumo Executivo',
    description: 'Visão geral em 1-2 páginas',
    formats: ['pdf'],
    color: '#6366F1' // indigo
  }
};

// PDF styling constants
export const PDF_STYLES = {
  colors: {
    primary: '#1E40AF',
    secondary: '#6B7280',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    text: '#1F2937',
    textLight: '#6B7280',
    border: '#E5E7EB',
    background: '#F9FAFB',
    headerBg: '#1E40AF',
    headerText: '#FFFFFF'
  },
  fonts: {
    title: 20,
    subtitle: 14,
    heading: 12,
    body: 10,
    small: 8
  },
  margins: {
    page: 50,
    section: 20,
    paragraph: 10
  }
};

// Status translations
export const STATUS_LABELS = {
  // Project status
  planning: 'Planeamento',
  in_progress: 'Em Progresso',
  on_hold: 'Em Espera',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  // Task status
  todo: 'A Fazer',
  in_review: 'Em Revisão',
  done: 'Concluído'
};

// Priority translations
export const PRIORITY_LABELS = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica'
};

// Role translations
export const ROLE_LABELS = {
  sponsor: 'Patrocinador',
  manager: 'Gestor',
  team_member: 'Membro da Equipa',
  observer: 'Observador',
  client: 'Cliente'
};

// Type translations
export const TYPE_LABELS = {
  internal: 'Interno',
  external: 'Externo'
};

export default {
  REPORT_FORMATS,
  REPORT_TYPES,
  PDF_STYLES,
  STATUS_LABELS,
  PRIORITY_LABELS,
  ROLE_LABELS,
  TYPE_LABELS
};
