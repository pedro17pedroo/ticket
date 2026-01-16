/**
 * Excel Generator Service
 * 
 * Generates Excel reports using ExcelJS.
 * Supports report types that allow Excel export.
 * 
 * Requirements: 5.3, 6.2, 7.3, 8.2
 */

import ExcelJS from 'exceljs';
import { STATUS_LABELS, PRIORITY_LABELS, ROLE_LABELS, TYPE_LABELS } from './constants.js';

class ExcelGenerator {
  constructor(data, options = {}) {
    this.data = data;
    this.options = options;
    this.workbook = null;
  }

  /**
   * Generate Excel report
   * @param {string} type - Report type
   * @returns {Promise<Buffer>} - Excel buffer
   */
  async generate(type) {
    this.workbook = new ExcelJS.Workbook();
    this.workbook.creator = 'TatuTicket';
    this.workbook.created = new Date();

    switch (type) {
      case 'status_report':
        this.generateStatusReport();
        break;
      case 'schedule_report':
        this.generateScheduleReport();
        break;
      case 'task_report':
        this.generateTaskReport();
        break;
      case 'stakeholder_report':
        this.generateStakeholderReport();
        break;
      default:
        throw new Error(`Excel export not supported for report type: ${type}`);
    }

    return this.workbook.xlsx.writeBuffer();
  }


  /**
   * Apply header style to a row
   */
  applyHeaderStyle(row) {
    row.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E40AF' }
      };
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }

  /**
   * Apply data style to a row
   */
  applyDataStyle(row, isAlternate = false) {
    row.eachCell(cell => {
      if (isAlternate) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' }
        };
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };
      cell.alignment = { vertical: 'middle' };
    });
  }

  /**
   * Format date
   */
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-PT');
  }

  /**
   * Get status label
   */
  getStatusLabel(status) {
    return STATUS_LABELS[status] || status || '';
  }

  /**
   * Get priority label
   */
  getPriorityLabel(priority) {
    return PRIORITY_LABELS[priority] || priority || '';
  }

  /**
   * Get role label
   */
  getRoleLabel(role) {
    return ROLE_LABELS[role] || role || '';
  }

  /**
   * Get type label
   */
  getTypeLabel(type) {
    return TYPE_LABELS[type] || type || '';
  }

  /**
   * Add info sheet with project details
   */
  addInfoSheet() {
    const { project, organization } = this.data;
    const sheet = this.workbook.addWorksheet('Informações');

    sheet.columns = [
      { header: 'Campo', key: 'field', width: 25 },
      { header: 'Valor', key: 'value', width: 50 }
    ];

    const infoData = [
      { field: 'Organização', value: organization?.name || '' },
      { field: 'Projeto', value: project?.name || '' },
      { field: 'Código', value: project?.code || '' },
      { field: 'Estado', value: this.getStatusLabel(project?.status) },
      { field: 'Progresso', value: `${project?.progress || 0}%` },
      { field: 'Data de Início', value: this.formatDate(project?.startDate) },
      { field: 'Data de Fim', value: this.formatDate(project?.endDate) },
      { field: 'Data do Relatório', value: this.formatDate(new Date()) }
    ];

    this.applyHeaderStyle(sheet.getRow(1));
    
    infoData.forEach((item, index) => {
      const row = sheet.addRow(item);
      this.applyDataStyle(row, index % 2 === 0);
    });

    return sheet;
  }


  /**
   * Generate Status Report Excel
   * Requirements: 5.3
   */
  generateStatusReport() {
    const { taskStats, overdueTasks, upcomingTasks, phases } = this.data;

    // Info sheet
    this.addInfoSheet();

    // Summary sheet
    const summarySheet = this.workbook.addWorksheet('Resumo');
    summarySheet.columns = [
      { header: 'Métrica', key: 'metric', width: 25 },
      { header: 'Valor', key: 'value', width: 15 }
    ];

    const summaryData = [
      { metric: 'Total de Tarefas', value: taskStats?.total || 0 },
      { metric: 'A Fazer', value: taskStats?.todo || 0 },
      { metric: 'Em Progresso', value: taskStats?.inProgress || 0 },
      { metric: 'Em Revisão', value: taskStats?.inReview || 0 },
      { metric: 'Concluídas', value: taskStats?.done || 0 },
      { metric: 'Em Atraso', value: overdueTasks?.length || 0 }
    ];

    this.applyHeaderStyle(summarySheet.getRow(1));
    summaryData.forEach((item, index) => {
      const row = summarySheet.addRow(item);
      this.applyDataStyle(row, index % 2 === 0);
    });

    // Overdue tasks sheet
    if (overdueTasks && overdueTasks.length > 0) {
      const overdueSheet = this.workbook.addWorksheet('Tarefas em Atraso');
      overdueSheet.columns = [
        { header: 'Tarefa', key: 'title', width: 40 },
        { header: 'Prazo', key: 'dueDate', width: 15 },
        { header: 'Dias Atraso', key: 'daysOverdue', width: 15 },
        { header: 'Prioridade', key: 'priority', width: 15 },
        { header: 'Responsável', key: 'assignee', width: 25 },
        { header: 'Fase', key: 'phase', width: 20 }
      ];

      this.applyHeaderStyle(overdueSheet.getRow(1));
      overdueTasks.forEach((task, index) => {
        const row = overdueSheet.addRow({
          title: task.title,
          dueDate: this.formatDate(task.dueDate),
          daysOverdue: task.daysOverdue,
          priority: this.getPriorityLabel(task.priority),
          assignee: task.assignee || '',
          phase: task.phase || ''
        });
        this.applyDataStyle(row, index % 2 === 0);
      });
    }

    // Upcoming tasks sheet
    if (upcomingTasks && upcomingTasks.length > 0) {
      const upcomingSheet = this.workbook.addWorksheet('Próximas Tarefas');
      upcomingSheet.columns = [
        { header: 'Tarefa', key: 'title', width: 40 },
        { header: 'Prazo', key: 'dueDate', width: 15 },
        { header: 'Prioridade', key: 'priority', width: 15 },
        { header: 'Responsável', key: 'assignee', width: 25 },
        { header: 'Fase', key: 'phase', width: 20 }
      ];

      this.applyHeaderStyle(upcomingSheet.getRow(1));
      upcomingTasks.forEach((task, index) => {
        const row = upcomingSheet.addRow({
          title: task.title,
          dueDate: this.formatDate(task.dueDate),
          priority: this.getPriorityLabel(task.priority),
          assignee: task.assignee || '',
          phase: task.phase || ''
        });
        this.applyDataStyle(row, index % 2 === 0);
      });
    }

    // Phases sheet
    if (phases && phases.length > 0) {
      const phasesSheet = this.workbook.addWorksheet('Fases');
      phasesSheet.columns = [
        { header: 'Fase', key: 'name', width: 30 },
        { header: 'Estado', key: 'status', width: 15 },
        { header: 'Progresso', key: 'progress', width: 15 }
      ];

      this.applyHeaderStyle(phasesSheet.getRow(1));
      phases.forEach((phase, index) => {
        const row = phasesSheet.addRow({
          name: phase.name,
          status: this.getStatusLabel(phase.status),
          progress: `${phase.progress || 0}%`
        });
        this.applyDataStyle(row, index % 2 === 0);
      });
    }
  }


  /**
   * Generate Schedule Report Excel
   * Requirements: 6.2
   */
  generateScheduleReport() {
    const { phases, ganttData, dependencies, summary } = this.data;

    // Info sheet
    this.addInfoSheet();

    // Summary sheet
    const summarySheet = this.workbook.addWorksheet('Resumo');
    summarySheet.columns = [
      { header: 'Métrica', key: 'metric', width: 25 },
      { header: 'Valor', key: 'value', width: 15 }
    ];

    const summaryData = [
      { metric: 'Total de Fases', value: summary?.totalPhases || 0 },
      { metric: 'Total de Tarefas', value: summary?.totalTasks || 0 },
      { metric: 'Dependências', value: summary?.totalDependencies || 0 }
    ];

    this.applyHeaderStyle(summarySheet.getRow(1));
    summaryData.forEach((item, index) => {
      const row = summarySheet.addRow(item);
      this.applyDataStyle(row, index % 2 === 0);
    });

    // Phases sheet
    const phasesSheet = this.workbook.addWorksheet('Fases');
    phasesSheet.columns = [
      { header: 'Fase', key: 'name', width: 30 },
      { header: 'Descrição', key: 'description', width: 40 },
      { header: 'Data Início', key: 'startDate', width: 15 },
      { header: 'Data Fim', key: 'endDate', width: 15 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Progresso', key: 'progress', width: 12 },
      { header: 'Tarefas', key: 'taskCount', width: 10 }
    ];

    this.applyHeaderStyle(phasesSheet.getRow(1));
    if (phases) {
      phases.forEach((phase, index) => {
        const row = phasesSheet.addRow({
          name: phase.name,
          description: phase.description || '',
          startDate: this.formatDate(phase.startDate),
          endDate: this.formatDate(phase.endDate),
          status: this.getStatusLabel(phase.status),
          progress: `${phase.progress || 0}%`,
          taskCount: phase.taskCount || 0
        });
        this.applyDataStyle(row, index % 2 === 0);
      });
    }

    // Tasks sheet (from ganttData)
    const tasksSheet = this.workbook.addWorksheet('Tarefas');
    tasksSheet.columns = [
      { header: 'Tarefa', key: 'name', width: 35 },
      { header: 'Fase', key: 'phase', width: 25 },
      { header: 'Data Início', key: 'startDate', width: 15 },
      { header: 'Data Fim', key: 'endDate', width: 15 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Progresso', key: 'progress', width: 12 },
      { header: 'Responsável', key: 'assignee', width: 20 }
    ];

    this.applyHeaderStyle(tasksSheet.getRow(1));
    if (ganttData) {
      const tasks = ganttData.filter(g => g.type === 'task');
      const phaseMap = {};
      ganttData.filter(g => g.type === 'phase').forEach(p => {
        phaseMap[p.id] = p.name;
      });

      tasks.forEach((task, index) => {
        const row = tasksSheet.addRow({
          name: task.name,
          phase: phaseMap[task.parentId] || '',
          startDate: this.formatDate(task.startDate),
          endDate: this.formatDate(task.endDate),
          status: this.getStatusLabel(task.status),
          progress: `${task.progress || 0}%`,
          assignee: task.assignee || ''
        });
        this.applyDataStyle(row, index % 2 === 0);
      });
    }

    // Dependencies sheet
    if (dependencies && dependencies.length > 0) {
      const depsSheet = this.workbook.addWorksheet('Dependências');
      depsSheet.columns = [
        { header: 'Tarefa', key: 'taskId', width: 40 },
        { header: 'Depende de', key: 'dependsOnTaskId', width: 40 },
        { header: 'Tipo', key: 'type', width: 20 }
      ];

      this.applyHeaderStyle(depsSheet.getRow(1));
      dependencies.forEach((dep, index) => {
        const row = depsSheet.addRow({
          taskId: dep.taskId,
          dependsOnTaskId: dep.dependsOnTaskId,
          type: dep.type || 'finish_to_start'
        });
        this.applyDataStyle(row, index % 2 === 0);
      });
    }
  }


  /**
   * Generate Task Report Excel
   * Requirements: 7.3
   */
  generateTaskReport() {
    const { tasks, stats, appliedFilters } = this.data;

    // Info sheet
    this.addInfoSheet();

    // Statistics sheet
    const statsSheet = this.workbook.addWorksheet('Estatísticas');
    statsSheet.columns = [
      { header: 'Métrica', key: 'metric', width: 25 },
      { header: 'Valor', key: 'value', width: 15 }
    ];

    const statsData = [
      { metric: 'Total de Tarefas', value: stats?.total || 0 },
      { metric: 'A Fazer', value: stats?.byStatus?.todo || 0 },
      { metric: 'Em Progresso', value: stats?.byStatus?.inProgress || 0 },
      { metric: 'Em Revisão', value: stats?.byStatus?.inReview || 0 },
      { metric: 'Concluídas', value: stats?.byStatus?.done || 0 },
      { metric: 'Prioridade Baixa', value: stats?.byPriority?.low || 0 },
      { metric: 'Prioridade Média', value: stats?.byPriority?.medium || 0 },
      { metric: 'Prioridade Alta', value: stats?.byPriority?.high || 0 },
      { metric: 'Prioridade Crítica', value: stats?.byPriority?.critical || 0 },
      { metric: 'Horas Estimadas', value: `${stats?.hours?.estimated?.toFixed(1) || 0}h` },
      { metric: 'Horas Realizadas', value: `${stats?.hours?.actual?.toFixed(1) || 0}h` }
    ];

    this.applyHeaderStyle(statsSheet.getRow(1));
    statsData.forEach((item, index) => {
      const row = statsSheet.addRow(item);
      this.applyDataStyle(row, index % 2 === 0);
    });

    // Tasks sheet
    const tasksSheet = this.workbook.addWorksheet('Tarefas');
    tasksSheet.columns = [
      { header: 'Tarefa', key: 'title', width: 35 },
      { header: 'Descrição', key: 'description', width: 40 },
      { header: 'Fase', key: 'phase', width: 20 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Prioridade', key: 'priority', width: 12 },
      { header: 'Responsável', key: 'assignee', width: 20 },
      { header: 'Data Início', key: 'startDate', width: 12 },
      { header: 'Prazo', key: 'dueDate', width: 12 },
      { header: 'Horas Est.', key: 'estimatedHours', width: 12 },
      { header: 'Horas Real.', key: 'actualHours', width: 12 },
      { header: 'Progresso', key: 'progress', width: 12 }
    ];

    this.applyHeaderStyle(tasksSheet.getRow(1));
    if (tasks) {
      tasks.forEach((task, index) => {
        const row = tasksSheet.addRow({
          title: task.title,
          description: task.description || '',
          phase: task.phase?.name || '',
          status: this.getStatusLabel(task.status),
          priority: this.getPriorityLabel(task.priority),
          assignee: task.assignee?.name || '',
          startDate: this.formatDate(task.startDate),
          dueDate: this.formatDate(task.dueDate),
          estimatedHours: task.estimatedHours || 0,
          actualHours: task.actualHours || 0,
          progress: `${task.progress || 0}%`
        });
        this.applyDataStyle(row, index % 2 === 0);
      });
    }

    // Applied filters sheet (if any)
    if (appliedFilters && Object.values(appliedFilters).some(v => v)) {
      const filtersSheet = this.workbook.addWorksheet('Filtros Aplicados');
      filtersSheet.columns = [
        { header: 'Filtro', key: 'filter', width: 20 },
        { header: 'Valor', key: 'value', width: 40 }
      ];

      this.applyHeaderStyle(filtersSheet.getRow(1));
      const filterData = [];
      if (appliedFilters.status) {
        filterData.push({ 
          filter: 'Estado', 
          value: Array.isArray(appliedFilters.status) 
            ? appliedFilters.status.map(s => this.getStatusLabel(s)).join(', ')
            : this.getStatusLabel(appliedFilters.status)
        });
      }
      if (appliedFilters.priority) {
        filterData.push({ 
          filter: 'Prioridade', 
          value: Array.isArray(appliedFilters.priority)
            ? appliedFilters.priority.map(p => this.getPriorityLabel(p)).join(', ')
            : this.getPriorityLabel(appliedFilters.priority)
        });
      }
      if (appliedFilters.phaseId) {
        filterData.push({ filter: 'Fase ID', value: appliedFilters.phaseId });
      }
      if (appliedFilters.assigneeId) {
        filterData.push({ filter: 'Responsável ID', value: appliedFilters.assigneeId });
      }

      filterData.forEach((item, index) => {
        const row = filtersSheet.addRow(item);
        this.applyDataStyle(row, index % 2 === 0);
      });
    }
  }


  /**
   * Generate Stakeholder Report Excel
   * Requirements: 8.2
   */
  generateStakeholderReport() {
    const { stakeholders, groupedStakeholders, groupBy, summary } = this.data;

    // Info sheet
    this.addInfoSheet();

    // Summary sheet
    const summarySheet = this.workbook.addWorksheet('Resumo');
    summarySheet.columns = [
      { header: 'Métrica', key: 'metric', width: 25 },
      { header: 'Valor', key: 'value', width: 15 }
    ];

    const summaryData = [
      { metric: 'Total de Stakeholders', value: summary?.total || 0 },
      { metric: 'Internos', value: summary?.byType?.internal || 0 },
      { metric: 'Externos', value: summary?.byType?.external || 0 },
      { metric: 'Patrocinadores', value: summary?.byRole?.sponsor || 0 },
      { metric: 'Gestores', value: summary?.byRole?.manager || 0 },
      { metric: 'Membros da Equipa', value: summary?.byRole?.teamMember || 0 },
      { metric: 'Observadores', value: summary?.byRole?.observer || 0 },
      { metric: 'Clientes', value: summary?.byRole?.client || 0 }
    ];

    this.applyHeaderStyle(summarySheet.getRow(1));
    summaryData.forEach((item, index) => {
      const row = summarySheet.addRow(item);
      this.applyDataStyle(row, index % 2 === 0);
    });

    // Stakeholders sheet
    const stakeholdersSheet = this.workbook.addWorksheet('Stakeholders');
    stakeholdersSheet.columns = [
      { header: 'Nome', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 35 },
      { header: 'Telefone', key: 'phone', width: 20 },
      { header: 'Papel', key: 'role', width: 20 },
      { header: 'Tipo', key: 'type', width: 15 },
      { header: 'Notas', key: 'notes', width: 40 }
    ];

    this.applyHeaderStyle(stakeholdersSheet.getRow(1));
    if (stakeholders) {
      stakeholders.forEach((sh, index) => {
        const row = stakeholdersSheet.addRow({
          name: sh.name,
          email: sh.email || '',
          phone: sh.phone || '',
          role: this.getRoleLabel(sh.role),
          type: this.getTypeLabel(sh.type),
          notes: sh.notes || ''
        });
        this.applyDataStyle(row, index % 2 === 0);
      });
    }

    // Grouped sheets (if grouping is applied)
    if (groupedStakeholders) {
      Object.entries(groupedStakeholders).forEach(([group, groupStakeholders]) => {
        const groupLabel = groupBy === 'type' ? this.getTypeLabel(group) : this.getRoleLabel(group);
        const sheetName = groupLabel.substring(0, 31); // Excel sheet name limit
        
        const groupSheet = this.workbook.addWorksheet(sheetName);
        groupSheet.columns = [
          { header: 'Nome', key: 'name', width: 30 },
          { header: 'Email', key: 'email', width: 35 },
          { header: 'Telefone', key: 'phone', width: 20 },
          { header: groupBy === 'type' ? 'Papel' : 'Tipo', key: 'other', width: 20 },
          { header: 'Notas', key: 'notes', width: 40 }
        ];

        this.applyHeaderStyle(groupSheet.getRow(1));
        groupStakeholders.forEach((sh, index) => {
          const row = groupSheet.addRow({
            name: sh.name,
            email: sh.email || '',
            phone: sh.phone || '',
            other: groupBy === 'type' ? this.getRoleLabel(sh.role) : this.getTypeLabel(sh.type),
            notes: sh.notes || ''
          });
          this.applyDataStyle(row, index % 2 === 0);
        });
      });
    }
  }
}

export default ExcelGenerator;
