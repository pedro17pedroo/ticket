import api from './api';

/**
 * Project Management Service
 * Provides all API methods for managing projects, phases, tasks, stakeholders, and tickets
 * Requirements: All project management requirements
 */

// ==================== PROJECTS ====================

/**
 * Get all projects with filters and pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.status - Filter by status
 * @param {string} params.methodology - Filter by methodology
 * @param {string} params.startDate - Filter by start date
 * @param {string} params.endDate - Filter by end date
 * @param {string} params.search - Search by name or code
 * @param {string} params.sortBy - Sort field
 * @param {string} params.sortOrder - Sort order (ASC/DESC)
 */
export const getProjects = async (params = {}) => {
  const response = await api.get('/projects', { params });
  return response.data;
};

/**
 * Get project by ID
 * @param {string} id - Project ID
 */
export const getProjectById = async (id) => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};

/**
 * Create a new project
 * @param {Object} data - Project data
 * @param {string} data.name - Project name
 * @param {string} data.description - Project description
 * @param {string} data.methodology - Project methodology (waterfall, agile, scrum, kanban, hybrid)
 * @param {string} data.status - Project status (planning, in_progress, on_hold, completed, cancelled)
 * @param {string} data.startDate - Start date
 * @param {string} data.endDate - End date
 */
export const createProject = async (data) => {
  const response = await api.post('/projects', data);
  return response.data;
};

/**
 * Update a project
 * @param {string} id - Project ID
 * @param {Object} data - Project data to update
 */
export const updateProject = async (id, data) => {
  const response = await api.put(`/projects/${id}`, data);
  return response.data;
};

/**
 * Delete (archive) a project
 * @param {string} id - Project ID
 */
export const deleteProject = async (id) => {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
};

/**
 * Get project dashboard data
 * @param {string} id - Project ID
 */
export const getProjectDashboard = async (id) => {
  const response = await api.get(`/projects/${id}/dashboard`);
  return response.data;
};

// ==================== PHASES ====================

/**
 * Get all phases for a project
 * @param {string} projectId - Project ID
 */
export const getPhases = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/phases`);
  return response.data;
};

/**
 * Create a new phase
 * @param {string} projectId - Project ID
 * @param {Object} data - Phase data
 * @param {string} data.name - Phase name
 * @param {string} data.description - Phase description
 * @param {string} data.startDate - Start date
 * @param {string} data.endDate - End date
 * @param {string} data.status - Phase status (pending, in_progress, completed)
 */
export const createPhase = async (projectId, data) => {
  const response = await api.post(`/projects/${projectId}/phases`, data);
  return response.data;
};

/**
 * Update a phase
 * @param {string} projectId - Project ID
 * @param {string} phaseId - Phase ID
 * @param {Object} data - Phase data to update
 */
export const updatePhase = async (projectId, phaseId, data) => {
  const response = await api.put(`/projects/${projectId}/phases/${phaseId}`, data);
  return response.data;
};

/**
 * Delete a phase
 * @param {string} projectId - Project ID
 * @param {string} phaseId - Phase ID
 */
export const deletePhase = async (projectId, phaseId) => {
  const response = await api.delete(`/projects/${projectId}/phases/${phaseId}`);
  return response.data;
};

/**
 * Reorder phases
 * @param {string} projectId - Project ID
 * @param {string[]} phaseIds - Array of phase IDs in new order
 */
export const reorderPhases = async (projectId, phaseIds) => {
  const response = await api.put(`/projects/${projectId}/phases/reorder`, { phaseIds });
  return response.data;
};

// ==================== TASKS ====================

/**
 * Get all tasks for a project
 * @param {string} projectId - Project ID
 * @param {Object} params - Query parameters
 * @param {string} params.phaseId - Filter by phase
 * @param {string} params.status - Filter by status
 * @param {string} params.priority - Filter by priority
 * @param {string} params.assignedTo - Filter by assignee
 * @param {string} params.search - Search by title or description
 */
export const getTasks = async (projectId, params = {}) => {
  const response = await api.get(`/projects/${projectId}/tasks`, { params });
  return response.data;
};

/**
 * Get tasks for a specific phase
 * @param {string} projectId - Project ID
 * @param {string} phaseId - Phase ID
 */
export const getPhaseTasks = async (projectId, phaseId) => {
  const response = await api.get(`/projects/${projectId}/phases/${phaseId}/tasks`);
  return response.data;
};

/**
 * Get task by ID
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 */
export const getTaskById = async (projectId, taskId) => {
  const response = await api.get(`/projects/${projectId}/tasks/${taskId}`);
  return response.data;
};

/**
 * Create a new task
 * @param {string} projectId - Project ID
 * @param {string} phaseId - Phase ID
 * @param {Object} data - Task data
 * @param {string} data.title - Task title
 * @param {string} data.description - Task description
 * @param {string} data.status - Task status (todo, in_progress, in_review, done)
 * @param {string} data.priority - Task priority (low, medium, high, critical)
 * @param {number} data.estimatedHours - Estimated hours
 * @param {string} data.startDate - Start date
 * @param {string} data.dueDate - Due date
 * @param {string} data.assignedTo - Assigned user ID
 */
export const createTask = async (projectId, phaseId, data) => {
  const response = await api.post(`/projects/${projectId}/phases/${phaseId}/tasks`, data);
  return response.data;
};

/**
 * Update a task
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @param {Object} data - Task data to update
 */
export const updateTask = async (projectId, taskId, data) => {
  const response = await api.put(`/projects/${projectId}/tasks/${taskId}`, data);
  return response.data;
};

/**
 * Delete a task
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 */
export const deleteTask = async (projectId, taskId) => {
  const response = await api.delete(`/projects/${projectId}/tasks/${taskId}`);
  return response.data;
};

/**
 * Move a task (Kanban drag & drop)
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @param {Object} data - Move data
 * @param {string} data.status - New status
 * @param {string} data.phaseId - New phase ID (optional)
 * @param {number} data.orderIndex - New order index (optional)
 */
export const moveTask = async (projectId, taskId, data) => {
  const response = await api.put(`/projects/${projectId}/tasks/${taskId}/move`, data);
  return response.data;
};

// ==================== TASK DEPENDENCIES ====================

/**
 * Get task dependencies
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 */
export const getTaskDependencies = async (projectId, taskId) => {
  const response = await api.get(`/projects/${projectId}/tasks/${taskId}/dependencies`);
  return response.data;
};

/**
 * Add task dependency
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @param {Object} data - Dependency data
 * @param {string} data.dependsOnTaskId - ID of the task this task depends on
 * @param {string} data.dependencyType - Type of dependency (finish_to_start, start_to_start, finish_to_finish, start_to_finish)
 */
export const addTaskDependency = async (projectId, taskId, data) => {
  const response = await api.post(`/projects/${projectId}/tasks/${taskId}/dependencies`, data);
  return response.data;
};

/**
 * Remove task dependency
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @param {string} dependencyId - Dependency ID
 */
export const removeTaskDependency = async (projectId, taskId, dependencyId) => {
  const response = await api.delete(`/projects/${projectId}/tasks/${taskId}/dependencies/${dependencyId}`);
  return response.data;
};

// ==================== TASK COMMENTS ====================

/**
 * Get task comments
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 */
export const getTaskComments = async (projectId, taskId) => {
  const response = await api.get(`/projects/${projectId}/tasks/${taskId}/comments`);
  return response.data;
};

/**
 * Add comment to task
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @param {Object} data - Comment data
 * @param {string} data.content - Comment content
 */
export const addTaskComment = async (projectId, taskId, data) => {
  const response = await api.post(`/projects/${projectId}/tasks/${taskId}/comments`, data);
  return response.data;
};

/**
 * Delete task comment
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @param {string} commentId - Comment ID
 */
export const deleteTaskComment = async (projectId, taskId, commentId) => {
  const response = await api.delete(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`);
  return response.data;
};

// ==================== TASK ATTACHMENTS ====================

/**
 * Get task attachments
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 */
export const getTaskAttachments = async (projectId, taskId) => {
  const response = await api.get(`/projects/${projectId}/tasks/${taskId}/attachments`);
  return response.data;
};

/**
 * Upload attachment to task
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @param {File} file - File to upload
 */
export const addTaskAttachment = async (projectId, taskId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(
    `/projects/${projectId}/tasks/${taskId}/attachments`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return response.data;
};

/**
 * Download task attachment
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @param {string} attachmentId - Attachment ID
 */
export const downloadTaskAttachment = async (projectId, taskId, attachmentId) => {
  const response = await api.get(
    `/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}/download`,
    { responseType: 'blob' }
  );
  return response.data;
};

/**
 * Delete task attachment
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @param {string} attachmentId - Attachment ID
 */
export const deleteTaskAttachment = async (projectId, taskId, attachmentId) => {
  const response = await api.delete(`/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}`);
  return response.data;
};

// ==================== STAKEHOLDERS ====================

/**
 * Get all stakeholders for a project
 * @param {string} projectId - Project ID
 */
export const getStakeholders = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/stakeholders`);
  return response.data;
};

/**
 * Add stakeholder to project
 * @param {string} projectId - Project ID
 * @param {Object} data - Stakeholder data
 * @param {string} data.userId - User ID (for internal stakeholders)
 * @param {string} data.name - Stakeholder name
 * @param {string} data.email - Stakeholder email
 * @param {string} data.phone - Stakeholder phone
 * @param {string} data.role - Stakeholder role (sponsor, manager, team_member, observer, client)
 * @param {string} data.type - Stakeholder type (internal, external)
 * @param {string} data.notes - Notes
 */
export const addStakeholder = async (projectId, data) => {
  const response = await api.post(`/projects/${projectId}/stakeholders`, data);
  return response.data;
};

/**
 * Update stakeholder
 * @param {string} projectId - Project ID
 * @param {string} stakeholderId - Stakeholder ID
 * @param {Object} data - Stakeholder data to update
 */
export const updateStakeholder = async (projectId, stakeholderId, data) => {
  const response = await api.put(`/projects/${projectId}/stakeholders/${stakeholderId}`, data);
  return response.data;
};

/**
 * Remove stakeholder from project
 * @param {string} projectId - Project ID
 * @param {string} stakeholderId - Stakeholder ID
 */
export const removeStakeholder = async (projectId, stakeholderId) => {
  const response = await api.delete(`/projects/${projectId}/stakeholders/${stakeholderId}`);
  return response.data;
};

// ==================== TICKET ASSOCIATION ====================

/**
 * Get all tickets linked to a project
 * @param {string} projectId - Project ID
 */
export const getLinkedTickets = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/tickets`);
  return response.data;
};

/**
 * Link ticket to project
 * @param {string} projectId - Project ID
 * @param {string} ticketId - Ticket ID
 * @param {string} taskId - Task ID (optional, to link to specific task)
 */
export const linkTicket = async (projectId, ticketId, taskId = null) => {
  const data = { ticketId };
  if (taskId) {
    data.taskId = taskId;
  }
  const response = await api.post(`/projects/${projectId}/tickets`, data);
  return response.data;
};

/**
 * Unlink ticket from project
 * @param {string} projectId - Project ID
 * @param {string} ticketId - Ticket ID
 */
export const unlinkTicket = async (projectId, ticketId) => {
  const response = await api.delete(`/projects/${projectId}/tickets/${ticketId}`);
  return response.data;
};

/**
 * Get tickets linked to a specific task
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 */
export const getTaskTickets = async (projectId, taskId) => {
  const response = await api.get(`/projects/${projectId}/tasks/${taskId}/tickets`);
  return response.data;
};

/**
 * Link ticket to a specific task
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @param {string} ticketId - Ticket ID
 */
export const linkTicketToTask = async (projectId, taskId, ticketId) => {
  const response = await api.post(`/projects/${projectId}/tasks/${taskId}/tickets`, { ticketId });
  return response.data;
};

// ==================== REPORTS ====================

/**
 * Get report data for a specific report type
 * @param {string} projectId - Project ID
 * @param {string} type - Report type (project_charter, project_closure, status_report, schedule_report, task_report, stakeholder_report, executive_summary)
 * @param {Object} options - Report options
 * @param {Object} options.period - Period filter for status reports
 * @param {Object} options.filters - Filters for task/schedule/stakeholder reports
 */
export const getReportData = async (projectId, type, options = {}) => {
  const params = {};
  if (options.period) {
    params.period = JSON.stringify(options.period);
  }
  if (options.filters) {
    params.filters = JSON.stringify(options.filters);
  }
  const response = await api.get(`/projects/${projectId}/reports/data/${type}`, { params });
  return response.data;
};

/**
 * Generate a project report (PDF or Excel)
 * @param {string} projectId - Project ID
 * @param {Object} data - Report generation data
 * @param {string} data.type - Report type
 * @param {string} data.format - Output format ('pdf' or 'excel')
 * @param {Object} data.options - Report-specific options
 */
export const generateProjectReport = async (projectId, data) => {
  const response = await api.post(`/projects/${projectId}/reports/generate`, data);
  return response.data;
};

/**
 * Download a generated report
 * @param {string} projectId - Project ID
 * @param {string} reportId - Report ID
 * @returns {Promise<Blob>} - Report file blob
 */
export const downloadReport = async (projectId, reportId) => {
  const response = await api.get(`/projects/${projectId}/reports/${reportId}/download`, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Get report generation history
 * @param {Object} params - Query parameters
 * @param {string} params.projectId - Filter by project ID
 * @param {string} params.type - Filter by report type
 * @param {string} params.startDate - Filter by start date
 * @param {string} params.endDate - Filter by end date
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 */
export const getReportHistory = async (params = {}) => {
  const response = await api.get('/projects/reports/history', { params });
  return response.data;
};

// ==================== GANTT ====================

/**
 * Get Gantt chart data
 * @param {string} projectId - Project ID
 */
export const getGanttData = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/gantt`);
  return response.data;
};

/**
 * Export Gantt chart as PDF or image
 * This is a client-side export function that captures the Gantt chart
 * @param {HTMLElement} element - The DOM element containing the Gantt chart
 * @param {string} format - Export format ('pdf' or 'png')
 * @param {string} projectName - Project name for the filename
 * @param {string} projectCode - Project code for the filename
 * @returns {Promise<void>}
 */
export const exportGantt = async (element, format, projectName, projectCode) => {
  // Dynamic imports to reduce initial bundle size
  const html2canvas = (await import('html2canvas')).default;
  
  const filename = `${projectCode || 'gantt'}-${projectName?.replace(/\s+/g, '-') || 'chart'}`;
  
  // Capture the element as canvas
  const canvas = await html2canvas(element, {
    scale: 2, // Higher resolution
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });
  
  if (format === 'png') {
    // Export as PNG image
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } else if (format === 'pdf') {
    // Export as PDF
    const { jsPDF } = await import('jspdf');
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Calculate PDF dimensions (A4 landscape by default)
    const pdfWidth = 297; // A4 landscape width in mm
    const pdfHeight = 210; // A4 landscape height in mm
    
    // Calculate scaling to fit the image
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;
    
    // Center the image on the page
    const x = (pdfWidth - scaledWidth) / 2;
    const y = (pdfHeight - scaledHeight) / 2;
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add title
    pdf.setFontSize(16);
    pdf.text(`Diagrama de Gantt - ${projectName || 'Projeto'}`, 14, 15);
    pdf.setFontSize(10);
    pdf.text(`Código: ${projectCode || 'N/A'} | Exportado em: ${new Date().toLocaleDateString('pt-PT')}`, 14, 22);
    
    // Add the chart image (with offset for title)
    pdf.addImage(imgData, 'PNG', x, 30, scaledWidth, scaledHeight - 30);
    
    pdf.save(`${filename}.pdf`);
  }
  
  return { success: true, format, filename };
};

// ==================== CONSTANTS ====================

/**
 * Valid project methodologies
 */
export const PROJECT_METHODOLOGIES = [
  { value: 'waterfall', label: 'Waterfall' },
  { value: 'agile', label: 'Agile' },
  { value: 'scrum', label: 'Scrum' },
  { value: 'kanban', label: 'Kanban' },
  { value: 'hybrid', label: 'Híbrido' }
];

/**
 * Valid project statuses
 */
export const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planeamento', color: 'gray' },
  { value: 'in_progress', label: 'Em Progresso', color: 'blue' },
  { value: 'on_hold', label: 'Em Espera', color: 'yellow' },
  { value: 'completed', label: 'Concluído', color: 'green' },
  { value: 'cancelled', label: 'Cancelado', color: 'red' }
];

/**
 * Valid phase statuses
 */
export const PHASE_STATUSES = [
  { value: 'pending', label: 'Pendente', color: 'gray' },
  { value: 'in_progress', label: 'Em Progresso', color: 'blue' },
  { value: 'completed', label: 'Concluída', color: 'green' }
];

/**
 * Valid task statuses
 */
export const TASK_STATUSES = [
  { value: 'todo', label: 'A Fazer', color: 'gray' },
  { value: 'in_progress', label: 'Em Progresso', color: 'blue' },
  { value: 'in_review', label: 'Em Revisão', color: 'yellow' },
  { value: 'done', label: 'Concluída', color: 'green' }
];

/**
 * Valid task priorities
 */
export const TASK_PRIORITIES = [
  { value: 'low', label: 'Baixa', color: 'gray' },
  { value: 'medium', label: 'Média', color: 'blue' },
  { value: 'high', label: 'Alta', color: 'orange' },
  { value: 'critical', label: 'Crítica', color: 'red' }
];

/**
 * Valid stakeholder roles
 */
export const STAKEHOLDER_ROLES = [
  { value: 'sponsor', label: 'Patrocinador' },
  { value: 'manager', label: 'Gestor' },
  { value: 'team_member', label: 'Membro da Equipa' },
  { value: 'observer', label: 'Observador' },
  { value: 'client', label: 'Cliente' }
];

/**
 * Valid stakeholder types
 */
export const STAKEHOLDER_TYPES = [
  { value: 'internal', label: 'Interno' },
  { value: 'external', label: 'Externo' }
];

/**
 * Valid dependency types
 */
export const DEPENDENCY_TYPES = [
  { value: 'finish_to_start', label: 'Fim para Início' },
  { value: 'start_to_start', label: 'Início para Início' },
  { value: 'finish_to_finish', label: 'Fim para Fim' },
  { value: 'start_to_finish', label: 'Início para Fim' }
];

// ==================== DEFAULT EXPORT ====================

export default {
  // Projects
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectDashboard,
  // Phases
  getPhases,
  createPhase,
  updatePhase,
  deletePhase,
  reorderPhases,
  // Tasks
  getTasks,
  getPhaseTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  // Task Dependencies
  getTaskDependencies,
  addTaskDependency,
  removeTaskDependency,
  // Task Comments
  getTaskComments,
  addTaskComment,
  deleteTaskComment,
  // Task Attachments
  getTaskAttachments,
  addTaskAttachment,
  downloadTaskAttachment,
  deleteTaskAttachment,
  // Stakeholders
  getStakeholders,
  addStakeholder,
  updateStakeholder,
  removeStakeholder,
  // Ticket Association
  getLinkedTickets,
  linkTicket,
  unlinkTicket,
  getTaskTickets,
  linkTicketToTask,
  // Reports
  getReportData,
  generateProjectReport,
  downloadReport,
  getReportHistory,
  // Gantt
  getGanttData,
  exportGantt,
  // Constants
  PROJECT_METHODOLOGIES,
  PROJECT_STATUSES,
  PHASE_STATUSES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  STAKEHOLDER_ROLES,
  STAKEHOLDER_TYPES,
  DEPENDENCY_TYPES
};
