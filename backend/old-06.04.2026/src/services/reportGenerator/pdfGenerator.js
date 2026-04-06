/**
 * PDF Generator Service
 * 
 * Generates PDF reports using PDFKit.
 * Supports all report types with corporate templates.
 * 
 * Requirements: 3.2, 3.3, 3.4, 4.2, 5.3, 6.2, 7.3, 8.2, 9.3
 */

import PDFDocument from 'pdfkit';
import { PDF_STYLES, STATUS_LABELS, PRIORITY_LABELS, ROLE_LABELS, TYPE_LABELS } from './constants.js';

class PDFGenerator {
  constructor(data, options = {}) {
    this.data = data;
    this.options = options;
    this.doc = null;
    this.currentY = 0;
  }

  /**
   * Generate PDF report
   * @param {string} type - Report type
   * @returns {Promise<Buffer>} - PDF buffer
   */
  async generate(type) {
    return new Promise((resolve, reject) => {
      try {
        const chunks = [];
        this.doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          bufferPages: true
        });

        this.doc.on('data', chunk => chunks.push(chunk));
        this.doc.on('end', () => resolve(Buffer.concat(chunks)));
        this.doc.on('error', reject);

        // Generate content based on type
        this.addHeader();
        this.generateContent(type);
        this.addFooter();

        this.doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }


  /**
   * Generate content based on report type
   */
  generateContent(type) {
    switch (type) {
      case 'project_charter':
        this.generateProjectCharter();
        break;
      case 'project_closure':
        this.generateProjectClosure();
        break;
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
      case 'executive_summary':
        this.generateExecutiveSummary();
        break;
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  }

  /**
   * Add header with organization info
   */
  addHeader() {
    const { organization, project } = this.data;
    
    // Organization name
    this.doc
      .fontSize(PDF_STYLES.fonts.title)
      .fillColor(PDF_STYLES.colors.primary)
      .text(organization?.name || 'Organização', 50, 30);

    // Project name
    this.doc
      .fontSize(PDF_STYLES.fonts.small)
      .fillColor(PDF_STYLES.colors.textLight)
      .text(`Projeto: ${project?.name || 'N/A'}`, 50, 55);

    // Line separator
    this.doc
      .strokeColor(PDF_STYLES.colors.border)
      .lineWidth(1)
      .moveTo(50, 75)
      .lineTo(545, 75)
      .stroke();

    this.currentY = 90;
  }


  /**
   * Add footer with page numbers
   */
  addFooter() {
    const pages = this.doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      this.doc.switchToPage(i);
      
      // Footer line
      this.doc
        .strokeColor(PDF_STYLES.colors.border)
        .lineWidth(0.5)
        .moveTo(50, 780)
        .lineTo(545, 780)
        .stroke();

      // Page number
      this.doc
        .fontSize(PDF_STYLES.fonts.small)
        .fillColor(PDF_STYLES.colors.textLight)
        .text(
          `Página ${i + 1} de ${pages.count}`,
          50, 790,
          { align: 'center', width: 495 }
        );

      // Generation date
      this.doc
        .text(
          `Gerado em: ${this.formatDate(new Date())}`,
          50, 790,
          { align: 'right', width: 495 }
        );
    }
  }

  /**
   * Add section title
   */
  addSectionTitle(title) {
    this.checkPageBreak(40);
    
    this.doc
      .fontSize(PDF_STYLES.fonts.subtitle)
      .fillColor(PDF_STYLES.colors.primary)
      .text(title, 50, this.currentY);
    
    this.currentY += 25;
  }

  /**
   * Add subsection title
   */
  addSubsectionTitle(title) {
    this.checkPageBreak(30);
    
    this.doc
      .fontSize(PDF_STYLES.fonts.heading)
      .fillColor(PDF_STYLES.colors.text)
      .text(title, 50, this.currentY);
    
    this.currentY += 20;
  }


  /**
   * Add paragraph text
   */
  addParagraph(text, indent = 0) {
    this.checkPageBreak(20);
    
    this.doc
      .fontSize(PDF_STYLES.fonts.body)
      .fillColor(PDF_STYLES.colors.text)
      .text(text || 'N/A', 50 + indent, this.currentY, { width: 495 - indent });
    
    this.currentY = this.doc.y + 10;
  }

  /**
   * Add key-value pair
   */
  addKeyValue(key, value, indent = 0) {
    this.checkPageBreak(20);
    
    this.doc
      .fontSize(PDF_STYLES.fonts.body)
      .fillColor(PDF_STYLES.colors.textLight)
      .text(`${key}: `, 50 + indent, this.currentY, { continued: true })
      .fillColor(PDF_STYLES.colors.text)
      .text(value || 'N/A');
    
    this.currentY = this.doc.y + 5;
  }

  /**
   * Add simple table
   */
  addTable(headers, rows, columnWidths = null) {
    this.checkPageBreak(60);
    
    const tableWidth = 495;
    const defaultColWidth = tableWidth / headers.length;
    const colWidths = columnWidths || headers.map(() => defaultColWidth);
    const rowHeight = 25;
    const startX = 50;
    let startY = this.currentY;

    // Header row
    this.doc
      .fillColor(PDF_STYLES.colors.headerBg)
      .rect(startX, startY, tableWidth, rowHeight)
      .fill();

    let x = startX;
    headers.forEach((header, i) => {
      this.doc
        .fontSize(PDF_STYLES.fonts.small)
        .fillColor(PDF_STYLES.colors.headerText)
        .text(header, x + 5, startY + 8, { width: colWidths[i] - 10 });
      x += colWidths[i];
    });

    startY += rowHeight;

    // Data rows
    rows.forEach((row, rowIndex) => {
      this.checkPageBreak(rowHeight);
      
      // Alternate row background
      if (rowIndex % 2 === 0) {
        this.doc
          .fillColor(PDF_STYLES.colors.background)
          .rect(startX, startY, tableWidth, rowHeight)
          .fill();
      }

      x = startX;
      row.forEach((cell, i) => {
        this.doc
          .fontSize(PDF_STYLES.fonts.small)
          .fillColor(PDF_STYLES.colors.text)
          .text(String(cell || ''), x + 5, startY + 8, { width: colWidths[i] - 10 });
        x += colWidths[i];
      });

      startY += rowHeight;
    });

    // Table border
    this.doc
      .strokeColor(PDF_STYLES.colors.border)
      .lineWidth(0.5)
      .rect(startX, this.currentY, tableWidth, startY - this.currentY)
      .stroke();

    this.currentY = startY + 15;
  }


  /**
   * Check if page break is needed
   */
  checkPageBreak(requiredSpace) {
    if (this.currentY + requiredSpace > 760) {
      this.doc.addPage();
      this.currentY = 50;
    }
  }

  /**
   * Format date
   */
  formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('pt-PT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  /**
   * Get status label
   */
  getStatusLabel(status) {
    return STATUS_LABELS[status] || status || 'N/A';
  }

  /**
   * Get priority label
   */
  getPriorityLabel(priority) {
    return PRIORITY_LABELS[priority] || priority || 'N/A';
  }

  /**
   * Get role label
   */
  getRoleLabel(role) {
    return ROLE_LABELS[role] || role || 'N/A';
  }

  /**
   * Get type label
   */
  getTypeLabel(type) {
    return TYPE_LABELS[type] || type || 'N/A';
  }

  // ==================== REPORT GENERATORS ====================

  /**
   * Generate Project Charter (Termo de Abertura)
   * Requirements: 3.1, 3.2
   */
  generateProjectCharter() {
    const { project, stakeholders, phases, stakeholderSummary } = this.data;

    // Title
    this.doc
      .fontSize(PDF_STYLES.fonts.title)
      .fillColor(PDF_STYLES.colors.primary)
      .text('TERMO DE ABERTURA DO PROJETO', 50, this.currentY, { align: 'center', width: 495 });
    this.currentY += 40;

    // Project Information
    this.addSectionTitle('1. Informações do Projeto');
    this.addKeyValue('Código', project?.code);
    this.addKeyValue('Nome', project?.name);
    this.addKeyValue('Metodologia', project?.methodology);
    this.addKeyValue('Data de Início', this.formatDate(project?.startDate));
    this.addKeyValue('Data de Fim Prevista', this.formatDate(project?.endDate));
    this.addKeyValue('Estado', this.getStatusLabel(project?.status));
    this.addKeyValue('Responsável', project?.creator?.name);
    this.currentY += 10;

    // Description and Objectives
    this.addSectionTitle('2. Descrição e Objetivos');
    this.addParagraph(project?.description || 'Sem descrição definida.');
    this.currentY += 10;

    // Stakeholders
    this.addSectionTitle('3. Partes Interessadas');
    if (stakeholders && stakeholders.length > 0) {
      const headers = ['Nome', 'Papel', 'Tipo', 'Email'];
      const rows = stakeholders.map(s => [
        s.name,
        this.getRoleLabel(s.role),
        this.getTypeLabel(s.type),
        s.email || 'N/A'
      ]);
      this.addTable(headers, rows, [150, 100, 80, 165]);
    } else {
      this.addParagraph('Nenhum stakeholder registado.');
    }
    this.currentY += 10;

    // Phases
    this.addSectionTitle('4. Fases do Projeto');
    if (phases && phases.length > 0) {
      const headers = ['Fase', 'Início', 'Fim', 'Estado'];
      const rows = phases.map(p => [
        p.name,
        this.formatDate(p.startDate),
        this.formatDate(p.endDate),
        this.getStatusLabel(p.status)
      ]);
      this.addTable(headers, rows, [200, 100, 100, 95]);
    } else {
      this.addParagraph('Nenhuma fase definida.');
    }
  }


  /**
   * Generate Project Closure (Termo de Encerramento)
   * Requirements: 4.1, 4.2, 4.3
   */
  generateProjectClosure() {
    const { project, isCompleted, warning, taskStats, completionRate, hours, phases, deliverables, closureDate } = this.data;

    // Title
    this.doc
      .fontSize(PDF_STYLES.fonts.title)
      .fillColor(PDF_STYLES.colors.primary)
      .text('TERMO DE ENCERRAMENTO DO PROJETO', 50, this.currentY, { align: 'center', width: 495 });
    this.currentY += 40;

    // Warning if not completed
    if (warning) {
      this.doc
        .fontSize(PDF_STYLES.fonts.body)
        .fillColor(PDF_STYLES.colors.warning)
        .text(`⚠ ${warning}`, 50, this.currentY, { width: 495 });
      this.currentY += 25;
    }

    // Project Information
    this.addSectionTitle('1. Informações do Projeto');
    this.addKeyValue('Código', project?.code);
    this.addKeyValue('Nome', project?.name);
    this.addKeyValue('Estado Final', this.getStatusLabel(project?.status));
    this.addKeyValue('Data de Encerramento', this.formatDate(closureDate) || 'Não encerrado');
    this.currentY += 10;

    // Execution Summary
    this.addSectionTitle('2. Resumo de Execução');
    this.addKeyValue('Total de Tarefas', taskStats?.total?.toString());
    this.addKeyValue('Tarefas Concluídas', taskStats?.completed?.toString());
    this.addKeyValue('Taxa de Conclusão', `${completionRate}%`);
    this.addKeyValue('Horas Estimadas', `${hours?.estimated?.toFixed(1) || 0}h`);
    this.addKeyValue('Horas Realizadas', `${hours?.actual?.toFixed(1) || 0}h`);
    this.addKeyValue('Variação', `${hours?.variance >= 0 ? '+' : ''}${hours?.variance?.toFixed(1) || 0}h`);
    this.currentY += 10;

    // Phases Summary
    this.addSectionTitle('3. Fases do Projeto');
    if (phases && phases.length > 0) {
      const headers = ['Fase', 'Estado', 'Progresso'];
      const rows = phases.map(p => [
        p.name,
        this.getStatusLabel(p.status),
        `${p.progress || 0}%`
      ]);
      this.addTable(headers, rows, [250, 145, 100]);
    }
    this.currentY += 10;

    // Deliverables
    this.addSectionTitle('4. Entregas Realizadas');
    if (deliverables && deliverables.length > 0) {
      const headers = ['Entrega', 'Responsável', 'Data de Conclusão'];
      const rows = deliverables.slice(0, 20).map(d => [
        d.title,
        d.assignee || 'N/A',
        this.formatDate(d.completedAt)
      ]);
      this.addTable(headers, rows, [250, 120, 125]);
      
      if (deliverables.length > 20) {
        this.addParagraph(`... e mais ${deliverables.length - 20} entregas.`);
      }
    } else {
      this.addParagraph('Nenhuma entrega registada.');
    }
  }


  /**
   * Generate Status Report (Ponto de Situação)
   * Requirements: 5.1, 5.2, 5.4
   */
  generateStatusReport() {
    const { project, period, currentStatus, progress, taskStats, overdueTasks, upcomingTasks, phases, hasOverdueTasks } = this.data;

    // Title
    this.doc
      .fontSize(PDF_STYLES.fonts.title)
      .fillColor(PDF_STYLES.colors.primary)
      .text('PONTO DE SITUAÇÃO', 50, this.currentY, { align: 'center', width: 495 });
    this.currentY += 40;

    // Period
    this.addSectionTitle('Período do Relatório');
    if (period?.start && period?.end) {
      this.addParagraph(`De ${this.formatDate(period.start)} a ${this.formatDate(period.end)}`);
    } else {
      this.addParagraph(`Data do relatório: ${this.formatDate(period?.reportDate || new Date())}`);
    }
    this.currentY += 10;

    // Current Status
    this.addSectionTitle('1. Estado Atual');
    this.addKeyValue('Estado do Projeto', this.getStatusLabel(currentStatus));
    this.addKeyValue('Progresso Geral', `${progress || 0}%`);
    this.currentY += 10;

    // Task Summary
    this.addSectionTitle('2. Resumo de Tarefas');
    this.addKeyValue('Total', taskStats?.total?.toString());
    this.addKeyValue('A Fazer', taskStats?.todo?.toString());
    this.addKeyValue('Em Progresso', taskStats?.inProgress?.toString());
    this.addKeyValue('Em Revisão', taskStats?.inReview?.toString());
    this.addKeyValue('Concluídas', taskStats?.done?.toString());
    this.currentY += 10;

    // Overdue Tasks (highlighted)
    if (hasOverdueTasks && overdueTasks?.length > 0) {
      this.addSectionTitle('3. ⚠ Tarefas em Atraso');
      const headers = ['Tarefa', 'Prazo', 'Dias Atraso', 'Responsável'];
      const rows = overdueTasks.slice(0, 10).map(t => [
        t.title?.substring(0, 30) + (t.title?.length > 30 ? '...' : ''),
        this.formatDate(t.dueDate),
        t.daysOverdue?.toString(),
        t.assignee || 'N/A'
      ]);
      this.addTable(headers, rows, [180, 90, 80, 145]);
      
      if (overdueTasks.length > 10) {
        this.addParagraph(`... e mais ${overdueTasks.length - 10} tarefas em atraso.`);
      }
    } else {
      this.addSectionTitle('3. Tarefas em Atraso');
      this.addParagraph('Nenhuma tarefa em atraso. ✓');
    }
    this.currentY += 10;

    // Upcoming Tasks
    this.addSectionTitle('4. Próximas Atividades (7 dias)');
    if (upcomingTasks && upcomingTasks.length > 0) {
      const headers = ['Tarefa', 'Prazo', 'Prioridade', 'Responsável'];
      const rows = upcomingTasks.slice(0, 10).map(t => [
        t.title?.substring(0, 30) + (t.title?.length > 30 ? '...' : ''),
        this.formatDate(t.dueDate),
        this.getPriorityLabel(t.priority),
        t.assignee || 'N/A'
      ]);
      this.addTable(headers, rows, [180, 90, 80, 145]);
    } else {
      this.addParagraph('Nenhuma tarefa prevista para os próximos 7 dias.');
    }
  }


  /**
   * Generate Schedule Report (Cronograma)
   * Requirements: 6.1
   */
  generateScheduleReport() {
    const { project, phases, ganttData, dependencies, summary } = this.data;

    // Title
    this.doc
      .fontSize(PDF_STYLES.fonts.title)
      .fillColor(PDF_STYLES.colors.primary)
      .text('CRONOGRAMA DO PROJETO', 50, this.currentY, { align: 'center', width: 495 });
    this.currentY += 40;

    // Summary
    this.addSectionTitle('Resumo');
    this.addKeyValue('Total de Fases', summary?.totalPhases?.toString());
    this.addKeyValue('Total de Tarefas', summary?.totalTasks?.toString());
    this.addKeyValue('Dependências', summary?.totalDependencies?.toString());
    this.currentY += 10;

    // Phases and Tasks
    this.addSectionTitle('Fases e Tarefas');
    
    if (phases && phases.length > 0) {
      phases.forEach((phase, index) => {
        this.checkPageBreak(80);
        
        // Phase header
        this.addSubsectionTitle(`${index + 1}. ${phase.name}`);
        this.addKeyValue('Período', `${this.formatDate(phase.startDate)} - ${this.formatDate(phase.endDate)}`, 10);
        this.addKeyValue('Estado', this.getStatusLabel(phase.status), 10);
        this.addKeyValue('Progresso', `${phase.progress || 0}%`, 10);
        this.addKeyValue('Tarefas', phase.taskCount?.toString(), 10);
        this.currentY += 5;

        // Phase tasks from ganttData
        const phaseTasks = ganttData?.filter(g => g.type === 'task' && g.parentId === phase.id) || [];
        if (phaseTasks.length > 0) {
          const headers = ['Tarefa', 'Início', 'Fim', 'Estado', 'Progresso'];
          const rows = phaseTasks.slice(0, 15).map(t => [
            t.name?.substring(0, 25) + (t.name?.length > 25 ? '...' : ''),
            this.formatDate(t.startDate),
            this.formatDate(t.endDate),
            this.getStatusLabel(t.status),
            `${t.progress || 0}%`
          ]);
          this.addTable(headers, rows, [150, 80, 80, 100, 85]);
          
          if (phaseTasks.length > 15) {
            this.addParagraph(`... e mais ${phaseTasks.length - 15} tarefas nesta fase.`);
          }
        }
        this.currentY += 10;
      });
    } else {
      this.addParagraph('Nenhuma fase definida no projeto.');
    }

    // Dependencies
    if (dependencies && dependencies.length > 0) {
      this.addSectionTitle('Dependências');
      this.addParagraph(`O projeto possui ${dependencies.length} dependência(s) entre tarefas.`);
    }
  }


  /**
   * Generate Task Report (Lista de Tarefas)
   * Requirements: 7.1, 7.4
   */
  generateTaskReport() {
    const { project, tasks, groupedTasks, groupBy, stats, appliedFilters } = this.data;

    // Title
    this.doc
      .fontSize(PDF_STYLES.fonts.title)
      .fillColor(PDF_STYLES.colors.primary)
      .text('LISTA DE TAREFAS', 50, this.currentY, { align: 'center', width: 495 });
    this.currentY += 40;

    // Applied Filters
    if (appliedFilters && Object.values(appliedFilters).some(v => v)) {
      this.addSectionTitle('Filtros Aplicados');
      if (appliedFilters.status) this.addKeyValue('Estado', Array.isArray(appliedFilters.status) ? appliedFilters.status.map(s => this.getStatusLabel(s)).join(', ') : this.getStatusLabel(appliedFilters.status));
      if (appliedFilters.priority) this.addKeyValue('Prioridade', Array.isArray(appliedFilters.priority) ? appliedFilters.priority.map(p => this.getPriorityLabel(p)).join(', ') : this.getPriorityLabel(appliedFilters.priority));
      this.currentY += 10;
    }

    // Statistics
    this.addSectionTitle('Estatísticas');
    this.addKeyValue('Total de Tarefas', stats?.total?.toString());
    this.addKeyValue('A Fazer', stats?.byStatus?.todo?.toString());
    this.addKeyValue('Em Progresso', stats?.byStatus?.inProgress?.toString());
    this.addKeyValue('Em Revisão', stats?.byStatus?.inReview?.toString());
    this.addKeyValue('Concluídas', stats?.byStatus?.done?.toString());
    this.addKeyValue('Horas Estimadas', `${stats?.hours?.estimated?.toFixed(1) || 0}h`);
    this.addKeyValue('Horas Realizadas', `${stats?.hours?.actual?.toFixed(1) || 0}h`);
    this.currentY += 10;

    // Tasks
    this.addSectionTitle('Tarefas');
    
    if (groupedTasks && groupBy) {
      // Grouped view
      Object.entries(groupedTasks).forEach(([group, groupTasks]) => {
        this.checkPageBreak(60);
        this.addSubsectionTitle(group);
        
        const headers = ['Tarefa', 'Estado', 'Prioridade', 'Responsável', 'Prazo'];
        const rows = groupTasks.slice(0, 20).map(t => [
          t.title?.substring(0, 25) + (t.title?.length > 25 ? '...' : ''),
          this.getStatusLabel(t.status),
          this.getPriorityLabel(t.priority),
          t.assignee?.name || 'N/A',
          this.formatDate(t.dueDate)
        ]);
        this.addTable(headers, rows, [140, 85, 75, 100, 95]);
        
        if (groupTasks.length > 20) {
          this.addParagraph(`... e mais ${groupTasks.length - 20} tarefas neste grupo.`);
        }
        this.currentY += 5;
      });
    } else if (tasks && tasks.length > 0) {
      // Flat view
      const headers = ['Tarefa', 'Fase', 'Estado', 'Prioridade', 'Prazo'];
      const rows = tasks.slice(0, 50).map(t => [
        t.title?.substring(0, 20) + (t.title?.length > 20 ? '...' : ''),
        t.phase?.name?.substring(0, 15) || 'N/A',
        this.getStatusLabel(t.status),
        this.getPriorityLabel(t.priority),
        this.formatDate(t.dueDate)
      ]);
      this.addTable(headers, rows, [130, 100, 85, 75, 105]);
      
      if (tasks.length > 50) {
        this.addParagraph(`... e mais ${tasks.length - 50} tarefas.`);
      }
    } else {
      this.addParagraph('Nenhuma tarefa encontrada com os filtros aplicados.');
    }
  }


  /**
   * Generate Stakeholder Report (Lista de Stakeholders)
   * Requirements: 8.1, 8.3
   */
  generateStakeholderReport() {
    const { project, stakeholders, groupedStakeholders, groupBy, summary } = this.data;

    // Title
    this.doc
      .fontSize(PDF_STYLES.fonts.title)
      .fillColor(PDF_STYLES.colors.primary)
      .text('LISTA DE STAKEHOLDERS', 50, this.currentY, { align: 'center', width: 495 });
    this.currentY += 40;

    // Summary
    this.addSectionTitle('Resumo');
    this.addKeyValue('Total de Stakeholders', summary?.total?.toString());
    this.addKeyValue('Internos', summary?.byType?.internal?.toString());
    this.addKeyValue('Externos', summary?.byType?.external?.toString());
    this.currentY += 10;

    // Stakeholders by group
    this.addSectionTitle('Stakeholders');
    
    if (groupedStakeholders) {
      Object.entries(groupedStakeholders).forEach(([group, groupStakeholders]) => {
        this.checkPageBreak(60);
        
        const groupLabel = groupBy === 'type' ? this.getTypeLabel(group) : this.getRoleLabel(group);
        this.addSubsectionTitle(groupLabel);
        
        const headers = ['Nome', 'Email', 'Telefone', groupBy === 'type' ? 'Papel' : 'Tipo'];
        const rows = groupStakeholders.map(s => [
          s.name,
          s.email || 'N/A',
          s.phone || 'N/A',
          groupBy === 'type' ? this.getRoleLabel(s.role) : this.getTypeLabel(s.type)
        ]);
        this.addTable(headers, rows, [140, 150, 100, 105]);
        this.currentY += 5;
      });
    } else if (stakeholders && stakeholders.length > 0) {
      const headers = ['Nome', 'Papel', 'Tipo', 'Email'];
      const rows = stakeholders.map(s => [
        s.name,
        this.getRoleLabel(s.role),
        this.getTypeLabel(s.type),
        s.email || 'N/A'
      ]);
      this.addTable(headers, rows, [140, 100, 80, 175]);
    } else {
      this.addParagraph('Nenhum stakeholder registado no projeto.');
    }
  }

  /**
   * Generate Executive Summary (Resumo Executivo)
   * Requirements: 9.1, 9.2, 9.4
   */
  generateExecutiveSummary() {
    const { project, kpis, scheduleStatus, upcomingMilestones, charts, summary } = this.data;

    // Title
    this.doc
      .fontSize(PDF_STYLES.fonts.title)
      .fillColor(PDF_STYLES.colors.primary)
      .text('RESUMO EXECUTIVO', 50, this.currentY, { align: 'center', width: 495 });
    this.currentY += 40;

    // Project Overview
    this.addSectionTitle('Visão Geral');
    this.addKeyValue('Projeto', project?.name);
    this.addKeyValue('Metodologia', project?.methodology);
    this.addKeyValue('Estado', this.getStatusLabel(summary?.status));
    this.addKeyValue('Período', `${this.formatDate(summary?.startDate)} - ${this.formatDate(summary?.endDate)}`);
    if (summary?.daysRemaining !== null) {
      this.addKeyValue('Dias Restantes', summary?.daysRemaining?.toString());
    }
    this.currentY += 10;

    // KPIs
    this.addSectionTitle('Indicadores Chave (KPIs)');
    
    // Progress box
    this.doc
      .fontSize(PDF_STYLES.fonts.title)
      .fillColor(PDF_STYLES.colors.primary)
      .text(`${kpis?.progress || 0}%`, 50, this.currentY, { width: 100, align: 'center' });
    this.doc
      .fontSize(PDF_STYLES.fonts.small)
      .fillColor(PDF_STYLES.colors.textLight)
      .text('Progresso', 50, this.currentY + 25, { width: 100, align: 'center' });

    // Tasks completed
    this.doc
      .fontSize(PDF_STYLES.fonts.title)
      .fillColor(PDF_STYLES.colors.success)
      .text(`${kpis?.tasksCompleted || 0}/${kpis?.totalTasks || 0}`, 160, this.currentY, { width: 100, align: 'center' });
    this.doc
      .fontSize(PDF_STYLES.fonts.small)
      .fillColor(PDF_STYLES.colors.textLight)
      .text('Tarefas Concluídas', 160, this.currentY + 25, { width: 100, align: 'center' });

    // Overdue tasks
    const overdueColor = kpis?.overdueTasks > 0 ? PDF_STYLES.colors.danger : PDF_STYLES.colors.success;
    this.doc
      .fontSize(PDF_STYLES.fonts.title)
      .fillColor(overdueColor)
      .text(`${kpis?.overdueTasks || 0}`, 270, this.currentY, { width: 100, align: 'center' });
    this.doc
      .fontSize(PDF_STYLES.fonts.small)
      .fillColor(PDF_STYLES.colors.textLight)
      .text('Em Atraso', 270, this.currentY + 25, { width: 100, align: 'center' });

    // Stakeholders
    this.doc
      .fontSize(PDF_STYLES.fonts.title)
      .fillColor(PDF_STYLES.colors.primary)
      .text(`${kpis?.stakeholders || 0}`, 380, this.currentY, { width: 100, align: 'center' });
    this.doc
      .fontSize(PDF_STYLES.fonts.small)
      .fillColor(PDF_STYLES.colors.textLight)
      .text('Stakeholders', 380, this.currentY + 25, { width: 100, align: 'center' });

    this.currentY += 60;

    // Schedule Status
    const statusColors = {
      on_track: PDF_STYLES.colors.success,
      delayed: PDF_STYLES.colors.warning,
      at_risk: PDF_STYLES.colors.danger
    };
    const statusLabels = {
      on_track: 'No Prazo',
      delayed: 'Atrasado',
      at_risk: 'Em Risco'
    };
    
    this.addKeyValue('Estado do Cronograma', statusLabels[scheduleStatus] || scheduleStatus);
    this.currentY += 10;

    // Hours
    this.addSectionTitle('Horas');
    this.addKeyValue('Estimadas', `${kpis?.estimatedHours?.toFixed(1) || 0}h`);
    this.addKeyValue('Realizadas', `${kpis?.actualHours?.toFixed(1) || 0}h`);
    this.addKeyValue('Variação', `${kpis?.hoursVariance >= 0 ? '+' : ''}${kpis?.hoursVariance?.toFixed(1) || 0}h`);
    this.currentY += 10;

    // Upcoming Milestones
    this.addSectionTitle('Próximos Marcos');
    if (upcomingMilestones && upcomingMilestones.length > 0) {
      const headers = ['Marco', 'Data Prevista', 'Progresso'];
      const rows = upcomingMilestones.map(m => [
        m.name,
        this.formatDate(m.endDate),
        `${m.progress || 0}%`
      ]);
      this.addTable(headers, rows, [250, 145, 100]);
    } else {
      this.addParagraph('Nenhum marco próximo identificado.');
    }
  }
}

export default PDFGenerator;
