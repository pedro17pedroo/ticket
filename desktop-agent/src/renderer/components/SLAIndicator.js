import { 
  calculateSLATimeRemaining, 
  formatTimeRemaining, 
  getSLAStatusColor, 
  getSLAStatusIcon, 
  getSLAStatusText 
} from '../utils/slaUtils.js';

/**
 * Componente para exibir indicador de SLA
 */
export class SLAIndicator {
  constructor(ticket, sla) {
    this.ticket = ticket;
    this.sla = sla;
    this.slaInfo = calculateSLATimeRemaining(ticket, sla);
  }

  /**
   * Renderiza o indicador de SLA
   * @returns {HTMLElement} Elemento DOM do indicador
   */
  render() {
    if (!this.slaInfo) {
      return this.createEmptyIndicator();
    }

    const container = document.createElement('div');
    container.className = 'sla-indicator';
    container.setAttribute('data-status', this.slaInfo.status);

    // Barra de progresso
    const progressBar = this.createProgressBar();
    
    // Informações do SLA
    const info = this.createSLAInfo();

    container.appendChild(progressBar);
    container.appendChild(info);

    return container;
  }

  /**
   * Cria a barra de progresso do SLA
   * @returns {HTMLElement} Elemento da barra de progresso
   */
  createProgressBar() {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'sla-progress-container';

    const progressBar = document.createElement('div');
    progressBar.className = 'sla-progress-bar';
    progressBar.style.backgroundColor = getSLAStatusColor(this.slaInfo.status);
    progressBar.style.width = `${this.slaInfo.percentage}%`;

    const progressTrack = document.createElement('div');
    progressTrack.className = 'sla-progress-track';
    progressTrack.appendChild(progressBar);

    progressContainer.appendChild(progressTrack);

    return progressContainer;
  }

  /**
   * Cria as informações do SLA
   * @returns {HTMLElement} Elemento com informações do SLA
   */
  createSLAInfo() {
    const infoContainer = document.createElement('div');
    infoContainer.className = 'sla-info';

    // Ícone e status
    const statusElement = document.createElement('span');
    statusElement.className = 'sla-status';
    statusElement.innerHTML = `
      <span class="sla-icon">${getSLAStatusIcon(this.slaInfo.status)}</span>
      <span class="sla-text">${getSLAStatusText(this.slaInfo.status, this.slaInfo.type)}</span>
    `;

    // Tempo restante
    const timeElement = document.createElement('span');
    timeElement.className = 'sla-time';
    timeElement.textContent = formatTimeRemaining(this.slaInfo.remainingMinutes);
    timeElement.style.color = getSLAStatusColor(this.slaInfo.status);

    infoContainer.appendChild(statusElement);
    infoContainer.appendChild(timeElement);

    return infoContainer;
  }

  /**
   * Cria um indicador vazio quando não há SLA
   * @returns {HTMLElement} Elemento vazio
   */
  createEmptyIndicator() {
    const container = document.createElement('div');
    container.className = 'sla-indicator sla-indicator-empty';
    container.innerHTML = `
      <span class="sla-no-data">
        <span class="sla-icon">⏱️</span>
        <span class="sla-text">Sem SLA definido</span>
      </span>
    `;
    return container;
  }

  /**
   * Renderiza uma versão compacta do indicador
   * @returns {HTMLElement} Elemento DOM compacto
   */
  renderCompact() {
    if (!this.slaInfo) {
      return this.createEmptyCompactIndicator();
    }

    const container = document.createElement('div');
    container.className = 'sla-indicator-compact';
    container.setAttribute('data-status', this.slaInfo.status);
    container.style.color = getSLAStatusColor(this.slaInfo.status);

    const icon = document.createElement('span');
    icon.className = 'sla-compact-icon';
    icon.textContent = getSLAStatusIcon(this.slaInfo.status);

    const time = document.createElement('span');
    time.className = 'sla-compact-time';
    time.textContent = formatTimeRemaining(this.slaInfo.remainingMinutes);

    container.appendChild(icon);
    container.appendChild(time);

    // Tooltip com informações completas
    container.title = `${getSLAStatusText(this.slaInfo.status, this.slaInfo.type)} - ${formatTimeRemaining(this.slaInfo.remainingMinutes)}`;

    return container;
  }

  /**
   * Cria um indicador compacto vazio
   * @returns {HTMLElement} Elemento vazio compacto
   */
  createEmptyCompactIndicator() {
    const container = document.createElement('div');
    container.className = 'sla-indicator-compact sla-indicator-empty';
    container.innerHTML = `<span class="sla-compact-icon">⏱️</span>`;
    container.title = 'Sem SLA definido';
    return container;
  }

  /**
   * Atualiza o indicador com novos dados
   * @param {Object} ticket - Novo objeto do ticket
   * @param {Object} sla - Novo objeto do SLA
   */
  update(ticket, sla) {
    this.ticket = ticket;
    this.sla = sla;
    this.slaInfo = calculateSLATimeRemaining(ticket, sla);
  }

  /**
   * Verifica se o SLA precisa de atenção
   * @returns {boolean} True se precisa de atenção
   */
  needsAttention() {
    return this.slaInfo && (this.slaInfo.status === 'critical' || this.slaInfo.status === 'breached');
  }

  /**
   * Obtém informações do SLA para notificações
   * @returns {Object} Informações para notificação
   */
  getNotificationInfo() {
    if (!this.slaInfo) return null;

    return {
      ticketNumber: this.ticket.ticketNumber,
      status: this.slaInfo.status,
      timeRemaining: formatTimeRemaining(this.slaInfo.remainingMinutes),
      type: this.slaInfo.type,
      needsAttention: this.needsAttention()
    };
  }
}