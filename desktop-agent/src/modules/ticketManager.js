/**
 * TatuTicket Desktop Agent - Ticket Manager
 * 
 * Gerencia tickets, chat e comunicação em tempo real
 * Respeita segregação cliente/organização
 */

const axios = require('axios');
const { EventEmitter } = require('events');

class TicketManager extends EventEmitter {
  constructor() {
    super();
    
    this.baseUrl = null; // URL base do servidor (sem /api)
    this.token = null;
    this.socket = null;
    this.user = null;
    this.tickets = [];
    this.unreadCount = 0;
    this.connected = false;
  }
  
  /**
   * Retorna a URL da API (baseUrl + /api)
   */
  getApiUrl() {
    if (!this.baseUrl) return null;
    // Remove /api se já existir no final para evitar duplicação
    const cleanUrl = this.baseUrl.replace(/\/api\/?$/, '');
    return `${cleanUrl}/api`;
  }

  /**
   * Inicializar gerenciador de tickets
   */
  async initialize(config) {
    this.baseUrl = config.serverUrl;
    this.token = config.token;

    try {
      // Obter informações do usuário
      await this.fetchUserInfo();
      
      // Carregar tickets
      await this.fetchTickets();
      
      // Iniciar monitoramento de SLA
      this.startSLAMonitoring();
      
      this.emit('initialized', { user: this.user });
      return true;
    } catch (error) {
      console.error('Erro ao inicializar ticket manager:', error);
      this.emit('error', error);
      return false;
    }
  }
  
  /**
   * Monitorar SLAs próximos ao vencimento
   */
  startSLAMonitoring() {
    // Limpar timer existente se houver
    if (this.slaTimer) {
      clearInterval(this.slaTimer);
    }
    
    // Verificar SLAs a cada 5 minutos
    this.slaTimer = setInterval(() => {
      this.checkSLAWarnings();
    }, 5 * 60 * 1000);
    
    // Executar primeira verificação
    this.checkSLAWarnings();
  }
  
  /**
   * Verificar tickets com SLA próximo ao vencimento
   */
  checkSLAWarnings() {
    const now = new Date();
    const warnedTickets = new Set(this.slaWarned || []);
    
    this.tickets.forEach(ticket => {
      if (!ticket.sla || ticket.status === 'closed' || ticket.status === 'resolved') {
        return;
      }
      
      const created = new Date(ticket.createdAt);
      const responseTime = parseInt(ticket.sla.responseTime) || 0;
      const resolutionTime = parseInt(ticket.sla.resolutionTime) || 0;
      
      // Verificar tempo de resposta (se ainda não respondido)
      if (!ticket.firstResponseAt && responseTime > 0) {
        const responseDeadline = new Date(created.getTime() + responseTime * 60000);
        const remainingMinutes = Math.floor((responseDeadline - now) / 60000);
        
        // Avisar quando restar menos de 30 minutos
        if (remainingMinutes <= 30 && remainingMinutes > 0 && !warnedTickets.has(ticket.id + '-response')) {
          this.emit('notification', {
            title: '⚠️ SLA de Resposta Próximo',
            body: `Ticket "${ticket.subject}" - ${remainingMinutes} minutos restantes para resposta`,
            ticketId: ticket.id,
            urgency: 'critical'
          });
          warnedTickets.add(ticket.id + '-response');
        }
      }
      
      // Verificar tempo de resolução
      if (resolutionTime > 0) {
        const resolutionDeadline = new Date(created.getTime() + resolutionTime * 60000);
        const remainingMinutes = Math.floor((resolutionDeadline - now) / 60000);
        
        // Avisar quando restar menos de 60 minutos
        if (remainingMinutes <= 60 && remainingMinutes > 0 && !warnedTickets.has(ticket.id + '-resolution')) {
          this.emit('notification', {
            title: '⚠️ SLA de Resolução Próximo',
            body: `Ticket "${ticket.subject}" - ${remainingMinutes} minutos restantes para resolução`,
            ticketId: ticket.id,
            urgency: remainingMinutes <= 30 ? 'critical' : 'normal'
          });
          warnedTickets.add(ticket.id + '-resolution');
        }
      }
    });
    
    this.slaWarned = Array.from(warnedTickets);
  }

  /**
   * Obter informações do usuário autenticado
   */
  async fetchUserInfo() {
    try {
      // Verificar se há token
      if (!this.token) {
        throw new Error('Token de autenticação não encontrado');
      }
      
      // Verificar se há baseUrl
      if (!this.baseUrl) {
        throw new Error('URL do servidor não configurada');
      }
      
      const response = await axios.get(`${this.getApiUrl()}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      // A API retorna { user: {...} }, não diretamente o user
      this.user = response.data.user || response.data;
      
      console.log('✅ Informações do usuário carregadas:', { 
        id: this.user.id,
        name: this.user.name, 
        email: this.user.email,
        role: this.user.role 
      });
      return this.user;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error.message);
      throw error;
    }
  }

  /**
   * Buscar tickets conforme permissão do usuário
   */
  async fetchTickets(filters = {}) {
    try {
      // Verificar se o usuário está carregado
      if (!this.user) {
        console.warn('⚠️ Usuário não carregado. Tentando carregar...');
        try {
          await this.fetchUserInfo();
        } catch (error) {
          console.error('Erro ao carregar informações do usuário:', error);
          return { success: false, tickets: [], error: 'Usuário não autenticado' };
        }
      }
      
      const params = new URLSearchParams();
      
      // Filtros baseados no papel do usuário
      if (this.user.role === 'cliente') {
        // Cliente vê apenas seus próprios tickets
        params.append('clientId', this.user.id);
      } else if (this.user.role === 'agente') {
        // Agente vê tickets atribuídos ou não atribuídos da organização
        params.append('organizationId', this.user.organizationId);
        if (filters.assignedToMe) {
          params.append('assignedTo', this.user.id);
        }
      } else if (this.user.role === 'admin-org') {
        // Admin vê todos os tickets da organização
        params.append('organizationId', this.user.organizationId);
      }

      // Filtros adicionais
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${this.getApiUrl()}/tickets?${params}`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      this.tickets = response.data.tickets || response.data;
      this.emit('tickets-updated', this.tickets);
      
      // Calcular mensagens não lidas
      this.updateUnreadCount();
      
      return this.tickets;
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Obter detalhes de um ticket específico
   */
  async getTicket(ticketId) {
    try {
      const response = await axios.get(`${this.getApiUrl()}/tickets/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      const ticket = response.data;
      
      // Atualizar no cache local
      const index = this.tickets.findIndex(t => t.id === ticketId);
      if (index !== -1) {
        this.tickets[index] = ticket;
      } else {
        this.tickets.unshift(ticket);
      }

      this.emit('ticket-updated', ticket);
      return ticket;
    } catch (error) {
      console.error('Erro ao buscar ticket:', error);
      throw error;
    }
  }

  /**
   * Criar novo ticket
   */
  async createTicket(ticketData) {
    try {
      const payload = {
        ...ticketData,
        organizationId: this.user.organizationId
      };

      // Se for cliente, definir clientId automaticamente
      if (this.user.role === 'cliente') {
        payload.clientId = this.user.id;
      }

      const response = await axios.post(`${this.getApiUrl()}/tickets`, payload, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      const newTicket = response.data;
      this.tickets.unshift(newTicket);
      
      this.emit('ticket-created', newTicket);
      this.emit('tickets-updated', this.tickets);
      
      return newTicket;
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Atualizar ticket
   */
  async updateTicket(ticketId, updates) {
    try {
      const response = await axios.put(
        `${this.getApiUrl()}/tickets/${ticketId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        }
      );

      const updatedTicket = response.data;
      
      // Atualizar no cache local
      const index = this.tickets.findIndex(t => t.id === ticketId);
      if (index !== -1) {
        this.tickets[index] = updatedTicket;
      }

      this.emit('ticket-updated', updatedTicket);
      this.emit('tickets-updated', this.tickets);
      
      return updatedTicket;
    } catch (error) {
      console.error('Erro ao atualizar ticket:', error);
      throw error;
    }
  }

  /**
   * Atribuir ticket a um agente
   */
  async assignTicket(ticketId, agentId) {
    try {
      const response = await axios.post(
        `${this.getApiUrl()}/tickets/${ticketId}/assign`,
        { assignedTo: agentId },
        {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        }
      );

      const updatedTicket = response.data;
      
      // Atualizar no cache
      const index = this.tickets.findIndex(t => t.id === ticketId);
      if (index !== -1) {
        this.tickets[index] = updatedTicket;
      }

      this.emit('ticket-assigned', updatedTicket);
      this.emit('tickets-updated', this.tickets);
      
      return updatedTicket;
    } catch (error) {
      console.error('Erro ao atribuir ticket:', error);
      throw error;
    }
  }

  /**
   * Enviar mensagem no chat do ticket
   */
  async sendMessage(ticketId, message, attachments = []) {
    try {
      // 1. Enviar comentário como JSON
      const response = await axios.post(
        `${this.getApiUrl()}/tickets/${ticketId}/comments`,
        {
          content: message,
          isInternal: false,
          isPrivate: false
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const newComment = response.data.comment || response.data;
      
      // 2. Se houver anexos, enviar separadamente
      if (attachments && attachments.length > 0) {
        try {
          const FormData = require('form-data');
          const formData = new FormData();
          
          attachments.forEach(att => {
            if (att.data && att.name) {
              const buffer = Buffer.from(att.data);
              formData.append('files', buffer, {
                filename: att.name,
                contentType: att.type || 'application/octet-stream'
              });
            }
          });

          await axios.post(
            `${this.getApiUrl()}/tickets/${ticketId}/upload`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${this.token}`,
                ...formData.getHeaders()
              }
            }
          );
          
          console.log('✅ Anexos enviados com sucesso');
        } catch (uploadError) {
          console.error('⚠️ Erro ao enviar anexos:', uploadError.message);
          // Não falhar se apenas anexos falharem
        }
      }

      this.emit('message-sent', { ticketId, message: newComment });
      return newComment;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  /**
   * Buscar mensagens de um ticket
   */
  async getMessages(ticketId) {
    try {
      // Buscar o ticket completo que inclui os comentários
      const response = await axios.get(
        `${this.getApiUrl()}/tickets/${ticketId}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        }
      );

      // Retornar em formato compatível com o renderer
      const ticket = response.data.ticket || response.data;
      const messages = ticket.comments || ticket.messages || [];
      
      console.log(`✅ Carregadas ${messages.length} mensagens do ticket ${ticketId}`);
      
      return { success: true, messages };
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error.message);
      return { success: false, error: error.message, messages: [] };
    }
  }

  /**
   * Buscar anexos de um ticket
   */
  async getAttachments(ticketId) {
    try {
      const response = await axios.get(
        `${this.getApiUrl()}/tickets/${ticketId}/attachments`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        }
      );

      const attachments = response.data.attachments || [];
      console.log(`✅ Carregados ${attachments.length} anexos do ticket ${ticketId}`);
      
      return { success: true, attachments };
    } catch (error) {
      console.error('Erro ao buscar anexos:', error.message);
      return { success: false, error: error.message, attachments: [] };
    }
  }

  /**
   * Marcar mensagens como lidas
   */
  async markAsRead(ticketId) {
    try {
      await axios.post(
        `${this.getApiUrl()}/tickets/${ticketId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        }
      );

      // Atualizar contador local
      this.updateUnreadCount();
      
      this.emit('messages-read', ticketId);
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  }

  /**
   * Conectar ao WebSocket para atualizações em tempo real
   */
  connectSocket(socket) {
    this.socket = socket;
    this.connected = true;

    // Escutar eventos de tickets
    socket.on('ticket:created', (ticket) => {
      // Verificar se pertence ao usuário/organização
      if (this.shouldReceiveTicket(ticket)) {
        this.tickets.unshift(ticket);
        this.emit('ticket-created', ticket);
        this.emit('tickets-updated', this.tickets);
        this.updateUnreadCount();
      }
    });

    socket.on('ticket:updated', (ticket) => {
      if (this.shouldReceiveTicket(ticket)) {
        const index = this.tickets.findIndex(t => t.id === ticket.id);
        if (index !== -1) {
          this.tickets[index] = ticket;
          this.emit('ticket-updated', ticket);
          this.emit('tickets-updated', this.tickets);
        }
      }
    });

    socket.on('ticket:new-message', (data) => {
      const { ticketId, message } = data;
      
      // Verificar se é um ticket do usuário
      const ticket = this.tickets.find(t => t.id === ticketId);
      if (ticket) {
        this.emit('new-message', { ticketId, message });
        this.updateUnreadCount();
        
        // Notificação desktop
        this.emit('notification', {
          title: `Novo Ticket: ${ticket.subject}`,
          body: message.message.substring(0, 100),
          ticketId
        });
      }
    });

    socket.on('ticket:assigned', (data) => {
      const { ticketId, assignedTo } = data;
      
      // Se foi atribuído ao usuário atual
      if (assignedTo === this.user.id) {
        this.fetchTicket(ticketId).then(ticket => {
          this.emit('notification', {
            title: 'Ticket Atribuído',
            body: `Você recebeu o ticket: ${ticket.subject}`,
            ticketId
          });
        });
      }
    });

    // Eventos de acesso remoto
    socket.on('remote-access:requested', (request) => {
      console.log('🔔 Solicitação de acesso remoto recebida:', request);
      this.emit('remote-access-requested', request);
    });

    socket.on('remote-access:accepted', (data) => {
      console.log('✅ Acesso remoto aceito:', data);
      this.emit('remote-access-accepted', data);
    });

    socket.on('remote-access:rejected', (data) => {
      console.log('❌ Acesso remoto rejeitado:', data);
      this.emit('remote-access-rejected', data);
    });

    socket.on('remote-access:ended', (data) => {
      console.log('🔴 Acesso remoto encerrado:', data);
      this.emit('remote-access-ended', data);
    });

    this.emit('socket-connected');
  }

  /**
   * Verificar se o usuário deve receber notificação deste ticket
   */
  shouldReceiveTicket(ticket) {
    if (this.user.role === 'cliente') {
      // Cliente vê apenas seus tickets
      return ticket.clientId === this.user.id;
    } else if (this.user.role === 'agente') {
      // Agente vê tickets da organização
      return ticket.organizationId === this.user.organizationId;
    } else if (this.user.role === 'admin-org') {
      // Admin vê todos da organização
      return ticket.organizationId === this.user.organizationId;
    }
    
    return false;
  }

  /**
   * Alterar status do ticket
   */
  async changeTicketStatus(ticketId, status) {
    try {
      const response = await axios.put(
        `${this.getApiUrl()}/tickets/${ticketId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        }
      );

      const updatedTicket = response.data;
      
      // Atualizar no cache
      const index = this.tickets.findIndex(t => t.id === ticketId);
      if (index !== -1) {
        this.tickets[index] = updatedTicket;
      }

      this.emit('ticket-status-changed', updatedTicket);
      this.emit('tickets-updated', this.tickets);
      
      return updatedTicket;
    } catch (error) {
      console.error('Erro ao alterar status do ticket:', error);
      throw error;
    }
  }

  /**
   * Atualizar contador de mensagens não lidas
   */
  updateUnreadCount() {
    // Implementação simplificada - pode ser melhorada com dados do servidor
    const unread = this.tickets.filter(t => t.hasUnreadMessages).length;
    
    if (unread !== this.unreadCount) {
      this.unreadCount = unread;
      this.emit('unread-count-changed', unread);
    }
  }

  /**
   * Buscar agentes disponíveis (para atribuição)
   */
  async getAvailableAgents() {
    try {
      const response = await axios.get(
        `${this.getApiUrl()}/users?role=agente&organizationId=${this.user.organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar agentes:', error);
      return [];
    }
  }

  /**
   * Buscar categorias de tickets
   */
  async getCategories() {
    try {
      const response = await axios.get(
        `${this.getApiUrl()}/categories`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return { success: false, categories: [] };
    }
  }

  /**
   * Buscar prioridades de tickets
   */
  async getPriorities() {
    try {
      const response = await axios.get(
        `${this.getApiUrl()}/priorities`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar prioridades:', error);
      return { success: false, priorities: [] };
    }
  }

  /**
   * Buscar tipos de tickets
   */
  async getTypes() {
    try {
      const response = await axios.get(
        `${this.getApiUrl()}/types`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar tipos:', error);
      return { success: false, types: [] };
    }
  }

  /**
   * Estatísticas rápidas
   */
  getStats() {
    const stats = {
      total: this.tickets.length,
      open: this.tickets.filter(t => t.status === 'open').length,
      inProgress: this.tickets.filter(t => t.status === 'in_progress').length,
      pending: this.tickets.filter(t => t.status === 'pending').length,
      resolved: this.tickets.filter(t => t.status === 'resolved').length,
      closed: this.tickets.filter(t => t.status === 'closed').length,
      unread: this.unreadCount,
      highPriority: this.tickets.filter(t => t.priority === 'high' || t.priority === 'urgent').length
    };

    return stats;
  }

  /**
   * Buscar solicitações de acesso remoto pendentes
   */
  async getRemoteAccessPending() {
    try {
      // Verificar se está inicializado
      if (!this.baseUrl || !this.token) {
        console.log('TicketManager não inicializado ainda');
        return [];
      }

      const response = await axios.get(
        `${this.getApiUrl()}/remote-access/pending`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        }
      );

      return response.data.requests || [];
    } catch (error) {
      console.error('Erro ao buscar solicitações de acesso remoto:', error);
      return [];
    }
  }

  /**
   * Aceitar solicitação de acesso remoto
   */
  async acceptRemoteAccess(requestId) {
    try {
      const response = await axios.post(
        `${this.getApiUrl()}/remote-access/${requestId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao aceitar acesso remoto:', error);
      throw error;
    }
  }

  /**
   * Rejeitar solicitação de acesso remoto
   */
  async rejectRemoteAccess(requestId, reason) {
    try {
      const response = await axios.post(
        `${this.getApiUrl()}/remote-access/${requestId}/reject`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao rejeitar acesso remoto:', error);
      throw error;
    }
  }

  /**
   * Encerrar sessão de acesso remoto
   */
  async endRemoteAccess(requestId) {
    try {
      const response = await axios.post(
        `${this.getApiUrl()}/remote-access/${requestId}/end`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao encerrar acesso remoto:', error);
      throw error;
    }
  }

  /**
   * Desconectar
   */
  disconnect() {
    if (this.socket) {
      this.socket.off('ticket:created');
      this.socket.off('ticket:updated');
      this.socket.off('ticket:new-message');
      this.socket.off('ticket:assigned');
      this.socket.off('remote-access:requested');
      this.socket.off('remote-access:ended');
    }
    
    this.connected = false;
    this.tickets = [];
    this.unreadCount = 0;
    
    this.emit('disconnected');
  }
}

module.exports = TicketManager;
