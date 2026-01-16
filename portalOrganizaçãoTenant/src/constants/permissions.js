/**
 * Constantes de permissões do sistema
 * 
 * Formato: recurso.ação
 * 
 * Ações comuns:
 * - view: visualizar
 * - create: criar
 * - update: atualizar
 * - delete: eliminar
 * - approve: aprovar
 * - assign: atribuir
 */

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',

  // Tickets
  TICKETS_VIEW: 'tickets.view',
  TICKETS_CREATE: 'tickets.create',
  TICKETS_UPDATE: 'tickets.update',
  TICKETS_DELETE: 'tickets.delete',
  TICKETS_ASSIGN: 'tickets.assign',
  TICKETS_CLOSE: 'tickets.close',

  // Clientes
  CLIENTS_VIEW: 'clients.view',
  CLIENTS_CREATE: 'clients.create',
  CLIENTS_UPDATE: 'clients.update',
  CLIENTS_DELETE: 'clients.delete',

  // Utilizadores
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  // Estrutura Organizacional
  DIRECTIONS_VIEW: 'directions.view',
  DIRECTIONS_CREATE: 'directions.create',
  DIRECTIONS_UPDATE: 'directions.update',
  DIRECTIONS_DELETE: 'directions.delete',

  DEPARTMENTS_VIEW: 'departments.view',
  DEPARTMENTS_CREATE: 'departments.create',
  DEPARTMENTS_UPDATE: 'departments.update',
  DEPARTMENTS_DELETE: 'departments.delete',

  SECTIONS_VIEW: 'sections.view',
  SECTIONS_CREATE: 'sections.create',
  SECTIONS_UPDATE: 'sections.update',
  SECTIONS_DELETE: 'sections.delete',

  // Catálogo de Serviços
  CATALOG_VIEW: 'catalog.view',
  CATALOG_CREATE: 'catalog.create',
  CATALOG_UPDATE: 'catalog.update',
  CATALOG_DELETE: 'catalog.delete',
  CATALOG_APPROVE: 'catalog.approve',

  // Inventário
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_UPDATE: 'inventory.update',
  INVENTORY_DELETE: 'inventory.delete',

  // Licenças
  LICENSES_VIEW: 'licenses.view',
  LICENSES_CREATE: 'licenses.create',
  LICENSES_UPDATE: 'licenses.update',
  LICENSES_DELETE: 'licenses.delete',

  // Base de Conhecimento
  KNOWLEDGE_VIEW: 'knowledge.view',
  KNOWLEDGE_CREATE: 'knowledge.create',
  KNOWLEDGE_UPDATE: 'knowledge.update',
  KNOWLEDGE_DELETE: 'knowledge.delete',

  // Bolsa de Horas
  HOURS_BANK_VIEW: 'hours_bank.view',
  HOURS_BANK_CREATE: 'hours_bank.create',
  HOURS_BANK_UPDATE: 'hours_bank.update',
  HOURS_BANK_DELETE: 'hours_bank.delete',

  // Relatórios
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',

  // Tags
  TAGS_VIEW: 'tags.view',
  TAGS_CREATE: 'tags.create',
  TAGS_UPDATE: 'tags.update',
  TAGS_DELETE: 'tags.delete',

  // Templates
  TEMPLATES_VIEW: 'templates.view',
  TEMPLATES_CREATE: 'templates.create',
  TEMPLATES_UPDATE: 'templates.update',
  TEMPLATES_DELETE: 'templates.delete',

  // Desktop Agent
  DESKTOP_AGENT_VIEW: 'desktop_agent.view',
  DESKTOP_AGENT_MANAGE: 'desktop_agent.manage',

  // Sistema (Configurações)
  SLAS_VIEW: 'slas.view',
  SLAS_CREATE: 'slas.create',
  SLAS_UPDATE: 'slas.update',
  SLAS_DELETE: 'slas.delete',

  PRIORITIES_VIEW: 'priorities.view',
  PRIORITIES_CREATE: 'priorities.create',
  PRIORITIES_UPDATE: 'priorities.update',
  PRIORITIES_DELETE: 'priorities.delete',

  TYPES_VIEW: 'types.view',
  TYPES_CREATE: 'types.create',
  TYPES_UPDATE: 'types.update',
  TYPES_DELETE: 'types.delete',

  CATEGORIES_VIEW: 'categories.view',
  CATEGORIES_CREATE: 'categories.create',
  CATEGORIES_UPDATE: 'categories.update',
  CATEGORIES_DELETE: 'categories.delete',

  // RBAC (Roles e Permissões)
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',

  // Projetos
  PROJECTS_VIEW: 'projects.view',
  PROJECTS_CREATE: 'projects.create',
  PROJECTS_UPDATE: 'projects.update',
  PROJECTS_DELETE: 'projects.delete',

  // Tarefas de Projetos
  PROJECT_TASKS_VIEW: 'project_tasks.view',
  PROJECT_TASKS_CREATE: 'project_tasks.create',
  PROJECT_TASKS_UPDATE: 'project_tasks.update',
  PROJECT_TASKS_DELETE: 'project_tasks.delete',

  // Stakeholders de Projetos
  PROJECT_STAKEHOLDERS_MANAGE: 'project_stakeholders.manage',
}

/**
 * Grupos de permissões por recurso
 */
export const PERMISSION_GROUPS = {
  dashboard: ['dashboard.view'],
  tickets: ['tickets.view', 'tickets.create', 'tickets.update', 'tickets.delete', 'tickets.assign', 'tickets.close'],
  clients: ['clients.view', 'clients.create', 'clients.update', 'clients.delete'],
  users: ['users.view', 'users.create', 'users.update', 'users.delete'],
  directions: ['directions.view', 'directions.create', 'directions.update', 'directions.delete'],
  departments: ['departments.view', 'departments.create', 'departments.update', 'departments.delete'],
  sections: ['sections.view', 'sections.create', 'sections.update', 'sections.delete'],
  catalog: ['catalog.view', 'catalog.create', 'catalog.update', 'catalog.delete', 'catalog.approve'],
  inventory: ['inventory.view', 'inventory.create', 'inventory.update', 'inventory.delete'],
  licenses: ['licenses.view', 'licenses.create', 'licenses.update', 'licenses.delete'],
  knowledge: ['knowledge.view', 'knowledge.create', 'knowledge.update', 'knowledge.delete'],
  hours_bank: ['hours_bank.view', 'hours_bank.create', 'hours_bank.update', 'hours_bank.delete'],
  reports: ['reports.view', 'reports.export'],
  tags: ['tags.view', 'tags.create', 'tags.update', 'tags.delete'],
  templates: ['templates.view', 'templates.create', 'templates.update', 'templates.delete'],
  desktop_agent: ['desktop_agent.view', 'desktop_agent.manage'],
  slas: ['slas.view', 'slas.create', 'slas.update', 'slas.delete'],
  priorities: ['priorities.view', 'priorities.create', 'priorities.update', 'priorities.delete'],
  types: ['types.view', 'types.create', 'types.update', 'types.delete'],
  categories: ['categories.view', 'categories.create', 'categories.update', 'categories.delete'],
  roles: ['roles.view', 'roles.create', 'roles.update', 'roles.delete'],
  projects: ['projects.view', 'projects.create', 'projects.update', 'projects.delete'],
  project_tasks: ['project_tasks.view', 'project_tasks.create', 'project_tasks.update', 'project_tasks.delete'],
  project_stakeholders: ['project_stakeholders.manage'],
}

/**
 * Todas as permissões disponíveis (para admin)
 */
export const ALL_PERMISSIONS = Object.values(PERMISSIONS)

export default PERMISSIONS
