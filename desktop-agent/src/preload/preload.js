const { contextBridge, ipcRenderer } = require('electron');

// Expor API segura para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Configurações
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  clearConfig: () => ipcRenderer.invoke('clear-config'),
  validateToken: () => ipcRenderer.invoke('validate-token'),
  
  // Conexão
  connect: (credentials) => ipcRenderer.invoke('connect', credentials),
  disconnect: () => ipcRenderer.invoke('disconnect'),
  
  // Status
  getStatus: () => ipcRenderer.invoke('get-status'),
  
  // Sincronização
  syncNow: () => ipcRenderer.invoke('sync-now'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // Acesso Remoto
  toggleRemoteAccess: (enabled) => ipcRenderer.invoke('toggle-remote-access', enabled),
  
  // Utilitários
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  showNotification: (data) => ipcRenderer.send('show-notification', data),
  
  // ============ TICKETS ============
  
  // Buscar tickets
  fetchTickets: (filters) => ipcRenderer.invoke('tickets:fetch', filters),
  
  // Obter ticket específico
  getTicket: (ticketId) => ipcRenderer.invoke('tickets:get', ticketId),
  
  // Criar ticket
  createTicket: (ticketData) => ipcRenderer.invoke('tickets:create', ticketData),
  
  // Atualizar ticket
  updateTicket: (ticketId, updates) => ipcRenderer.invoke('tickets:update', ticketId, updates),
  
  // Atribuir ticket
  assignTicket: (ticketId, agentId) => ipcRenderer.invoke('tickets:assign', ticketId, agentId),
  
  // Mensagens
  sendMessage: (ticketId, message, attachments) => ipcRenderer.invoke('tickets:send-message', ticketId, message, attachments),
  sendTicketMessage: (ticketId, message, attachments) => ipcRenderer.invoke('tickets:send-message', ticketId, message, attachments),
  getMessages: (ticketId) => ipcRenderer.invoke('tickets:get-messages', ticketId),
  markAsRead: (ticketId) => ipcRenderer.invoke('tickets:mark-as-read', ticketId),
  
  // Status do ticket
  changeTicketStatus: (ticketId, status) => ipcRenderer.invoke('tickets:change-status', ticketId, status),
  
  // Dados auxiliares
  getAgents: () => ipcRenderer.invoke('tickets:get-agents'),
  getCategories: () => ipcRenderer.invoke('tickets:get-categories'),
  getTicketStats: () => ipcRenderer.invoke('tickets:get-stats'),
  getUserInfo: () => ipcRenderer.invoke('tickets:get-user-info'),
  
  // ============ EVENTOS ============
  
  onNotification: (callback) => {
    ipcRenderer.on('notification', (event, data) => callback(data));
  },
  
  onNavigate: (callback) => {
    ipcRenderer.on('navigate-to', (event, page) => callback(page));
  },
  
  // Eventos de tickets
  onTicketsUpdated: (callback) => {
    ipcRenderer.on('tickets-updated', (event, tickets) => callback(tickets));
  },
  
  onTicketCreated: (callback) => {
    ipcRenderer.on('ticket-created', (event, ticket) => callback(ticket));
  },
  
  onNewMessage: (callback) => {
    ipcRenderer.on('new-message', (event, data) => callback(data));
  },
  
  onTicketNotification: (callback) => {
    ipcRenderer.on('ticket-notification', (event, notification) => callback(notification));
  },
  
  onUnreadCountChanged: (callback) => {
    ipcRenderer.on('unread-count-changed', (event, count) => callback(count));
  },
  
  // Remover listeners
  removeNotificationListener: () => {
    ipcRenderer.removeAllListeners('notification');
  },
  
  removeNavigateListener: () => {
    ipcRenderer.removeAllListeners('navigate-to');
  },
  
  removeTicketsListeners: () => {
    ipcRenderer.removeAllListeners('tickets-updated');
    ipcRenderer.removeAllListeners('ticket-created');
    ipcRenderer.removeAllListeners('new-message');
    ipcRenderer.removeAllListeners('ticket-notification');
    ipcRenderer.removeAllListeners('unread-count-changed');
  }
});

console.log('✅ Preload script carregado');
