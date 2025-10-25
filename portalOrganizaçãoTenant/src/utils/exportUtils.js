import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

/**
 * Exportar dados para CSV
 * @param {Array} data - Dados a exportar
 * @param {String} filename - Nome do arquivo
 */
export const exportToCSV = (data, filename = 'export.csv') => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exportar tickets para CSV
 * @param {Array} tickets - Lista de tickets
 * @param {String} filename - Nome do arquivo
 */
export const exportTicketsToCSV = (tickets, filename = 'tickets.csv') => {
  const data = tickets.map(ticket => ({
    'Número': ticket.ticketNumber,
    'Assunto': ticket.subject,
    'Status': ticket.status,
    'Prioridade': ticket.priority,
    'Tipo': ticket.type,
    'Solicitante': ticket.requester?.name || '',
    'Responsável': ticket.assignee?.name || '',
    'Departamento': ticket.department?.name || '',
    'Data Criação': new Date(ticket.createdAt).toLocaleDateString('pt-PT'),
    'Última Atualização': new Date(ticket.updatedAt).toLocaleDateString('pt-PT')
  }));
  
  exportToCSV(data, filename);
};

/**
 * Exportar dados para PDF
 * @param {Object} options - Opções de exportação
 * @param {String} options.title - Título do documento
 * @param {Array} options.headers - Cabeçalhos da tabela
 * @param {Array} options.data - Dados da tabela
 * @param {String} options.filename - Nome do arquivo
 */
export const exportToPDF = ({ title, headers, data, filename = 'export.pdf' }) => {
  const doc = new jsPDF();
  
  // Título
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Data e hora
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, 14, 30);
  
  // Tabela
  doc.autoTable({
    head: [headers],
    body: data,
    startY: 35,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [79, 70, 229], // primary-600
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });
  
  doc.save(filename);
};

/**
 * Exportar tickets para PDF
 * @param {Array} tickets - Lista de tickets
 * @param {String} filename - Nome do arquivo
 */
export const exportTicketsToPDF = (tickets, filename = 'tickets.pdf') => {
  const headers = ['Número', 'Assunto', 'Status', 'Prioridade', 'Solicitante', 'Data'];
  const data = tickets.map(ticket => [
    ticket.ticketNumber,
    ticket.subject.substring(0, 40) + (ticket.subject.length > 40 ? '...' : ''),
    ticket.status,
    ticket.priority,
    ticket.requester?.name || '-',
    new Date(ticket.createdAt).toLocaleDateString('pt-PT')
  ]);
  
  exportToPDF({
    title: 'Relatório de Tickets',
    headers,
    data,
    filename
  });
};

/**
 * Exportar relatório de estatísticas para PDF
 * @param {Object} stats - Estatísticas
 * @param {String} filename - Nome do arquivo
 */
export const exportStatsToPDF = (stats, filename = 'relatorio-estatisticas.pdf') => {
  const doc = new jsPDF();
  
  // Título
  doc.setFontSize(20);
  doc.text('Relatório de Estatísticas', 14, 22);
  
  // Data
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, 14, 30);
  
  let y = 45;
  
  // Resumo Geral
  doc.setFontSize(14);
  doc.text('Resumo Geral', 14, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.text(`Total de Tickets: ${stats.total || 0}`, 20, y);
  y += 7;
  doc.text(`Tickets Abertos: ${stats.open || 0}`, 20, y);
  y += 7;
  doc.text(`Tickets Fechados: ${stats.closed || 0}`, 20, y);
  y += 7;
  doc.text(`Tickets em Progresso: ${stats.inProgress || 0}`, 20, y);
  y += 15;
  
  // Por Status (se houver)
  if (stats.byStatus && stats.byStatus.length > 0) {
    doc.setFontSize(14);
    doc.text('Tickets por Status', 14, y);
    y += 10;
    
    const statusHeaders = ['Status', 'Quantidade'];
    const statusData = stats.byStatus.map(item => [
      item.status,
      item.count.toString()
    ]);
    
    doc.autoTable({
      head: [statusHeaders],
      body: statusData,
      startY: y,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229]
      }
    });
    
    y = doc.lastAutoTable.finalY + 15;
  }
  
  // Por Prioridade (se houver)
  if (stats.byPriority && stats.byPriority.length > 0 && y < 270) {
    doc.setFontSize(14);
    doc.text('Tickets por Prioridade', 14, y);
    y += 10;
    
    const priorityHeaders = ['Prioridade', 'Quantidade'];
    const priorityData = stats.byPriority.map(item => [
      item.priority,
      item.count.toString()
    ]);
    
    doc.autoTable({
      head: [priorityHeaders],
      body: priorityData,
      startY: y,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229]
      }
    });
  }
  
  doc.save(filename);
};

/**
 * Exportar relatório de horas para PDF
 * @param {Object} data - Dados do relatório
 * @param {String} filename - Nome do arquivo
 */
export const exportHoursReportToPDF = (data, filename = 'relatorio-horas.pdf') => {
  const headers = ['Cliente', 'Total Horas', 'Horas Usadas', 'Saldo', 'Status'];
  const rows = data.map(item => [
    item.clientName,
    item.totalHours.toString(),
    item.usedHours.toString(),
    item.balance.toString(),
    item.status
  ]);
  
  exportToPDF({
    title: 'Relatório de Bolsa de Horas',
    headers,
    data: rows,
    filename
  });
};

/**
 * Exportar relatório de SLA para PDF
 * @param {Object} data - Dados do relatório
 * @param {String} filename - Nome do arquivo
 */
export const exportSLAReportToPDF = (data, filename = 'relatorio-sla.pdf') => {
  const headers = ['Ticket', 'SLA', 'Tempo Decorrido', 'Status SLA', 'Prioridade'];
  const rows = data.map(item => [
    item.ticketNumber,
    item.slaName,
    item.timeElapsed,
    item.slaStatus,
    item.priority
  ]);
  
  exportToPDF({
    title: 'Relatório de SLA',
    headers,
    data: rows,
    filename
  });
};
