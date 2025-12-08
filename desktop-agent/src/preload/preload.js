const { contextBridge, ipcRenderer } = require('electron');

// Expor API segura para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Configurações
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  clearConfig: () => ipcRenderer.invoke('clear-config'),
  validateToken: () => ipcRenderer.invoke('validate-token'),
  
  // Autenticação
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  
  // Conexão
  connect: (credentials) => ipcRenderer.invoke('connect', credentials),
  connectAgent: (config) => ipcRenderer.invoke('connect-agent', config),
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
  fetchTicketMessages: (ticketId) => ipcRenderer.invoke('tickets:get-messages', ticketId),
  fetchTicketAttachments: (ticketId) => ipcRenderer.invoke('tickets:get-attachments', ticketId),
  markAsRead: (ticketId) => ipcRenderer.invoke('tickets:mark-as-read', ticketId),
  
  // Status do ticket
  changeTicketStatus: (ticketId, status) => ipcRenderer.invoke('tickets:change-status', ticketId, status),
  
  // Dados auxiliares
  getAgents: () => ipcRenderer.invoke('tickets:get-agents'),
  getCategories: () => ipcRenderer.invoke('tickets:get-categories'),
  getPriorities: () => ipcRenderer.invoke('tickets:get-priorities'),
  getTypes: () => ipcRenderer.invoke('tickets:get-types'),
  getTicketStats: () => ipcRenderer.invoke('tickets:get-stats'),
  getUserInfo: () => ipcRenderer.invoke('tickets:get-user-info'),

  // Acesso remoto
  getRemoteAccessPending: () => ipcRenderer.invoke('remote-access:get-pending'),
  acceptRemoteAccess: (requestId) => ipcRenderer.invoke('remote-access:accept', requestId),
  rejectRemoteAccess: (requestId, reason) => ipcRenderer.invoke('remote-access:reject', requestId, reason),
  endRemoteAccess: (requestId) => ipcRenderer.invoke('remote-access:end', requestId),
  
  // ============ CATÁLOGO DE SERVIÇOS ============
  
  getCatalogCategories: () => ipcRenderer.invoke('catalog:get-categories'),
  getCatalogItems: (categoryId) => ipcRenderer.invoke('catalog:get-items', categoryId),
  requestCatalogItem: (itemId, data) => ipcRenderer.invoke('catalog:request-item', itemId, data),
  
  // ============ BASE DE CONHECIMENTO ============
  
  getKnowledgeArticles: (filters) => ipcRenderer.invoke('knowledge:get-articles', filters),
  getKnowledgeArticle: (id) => ipcRenderer.invoke('knowledge:get-article', id),
  incrementArticleViews: (id) => ipcRenderer.invoke('knowledge:increment-views', id),
  
  // ============ NOTIFICAÇÕES ============
  
  getNotifications: () => ipcRenderer.invoke('notifications:get'),
  markNotificationAsRead: (id) => ipcRenderer.invoke('notifications:mark-read', id),
  
  // ============ ESTATÍSTICAS ============
  
  getTicketStatistics: () => ipcRenderer.invoke('tickets:get-statistics'),
  
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

  onRemoteAccessRequest: (callback) => {
    ipcRenderer.on('remote-access-requested', (event, request) => callback(request));
  },

  onRemoteAccessEnded: (callback) => {
    ipcRenderer.on('remote-access-ended', (event, data) => callback(data));
  },
  
  onTicketNotification: (callback) => {
    ipcRenderer.on('ticket-notification', (event, notification) => callback(notification));
  },
  
  onUnreadCountChanged: (callback) => {
    ipcRenderer.on('unread-count-changed', (event, count) => callback(count));
  },
  
  onNotificationsUpdated: (callback) => {
    ipcRenderer.on('notifications-updated', (event, data) => callback(data));
  },
  
  // ==================== OFFLINE QUEUE ====================
  
  offlineQueueAdd: (action, data, metadata) => ipcRenderer.invoke('offline-queue:add', action, data, metadata),
  offlineQueueProcess: () => ipcRenderer.invoke('offline-queue:process'),
  offlineQueueGetStats: () => ipcRenderer.invoke('offline-queue:get-stats'),
  offlineQueueGetAll: () => ipcRenderer.invoke('offline-queue:get-all'),
  offlineQueueClearFailed: () => ipcRenderer.invoke('offline-queue:clear-failed'),
  offlineQueueClearAll: () => ipcRenderer.invoke('offline-queue:clear-all'),
  
  // ==================== CONNECTION STATUS ====================
  
  connectionGetStatus: () => ipcRenderer.invoke('connection:get-status'),
  connectionCheckNow: () => ipcRenderer.invoke('connection:check-now'),
  
  onConnectionStatus: (callback) => {
    ipcRenderer.on('connection-status', (event, data) => callback(data));
  },
  
  // ==================== UPLOAD DE ARQUIVOS ====================
  
  fileValidate: (filePath) => ipcRenderer.invoke('file:validate', filePath),
  fileValidateMultiple: (filePaths) => ipcRenderer.invoke('file:validate-multiple', filePaths),
  fileGetInfo: (filePath) => ipcRenderer.invoke('file:get-info', filePath),
  fileGeneratePreview: (filePath) => ipcRenderer.invoke('file:generate-preview', filePath),
  fileUpload: (ticketId, filePath) => ipcRenderer.invoke('file:upload', ticketId, filePath),
  fileUploadMultiple: (ticketId, filePaths) => ipcRenderer.invoke('file:upload-multiple', ticketId, filePaths),
  fileGetAttachments: (ticketId) => ipcRenderer.invoke('file:get-attachments', ticketId),
  fileDownloadAttachment: (ticketId, attachmentId) => ipcRenderer.invoke('file:download-attachment', ticketId, attachmentId),
  fileDeleteAttachment: (ticketId, attachmentId) => ipcRenderer.invoke('file:delete-attachment', ticketId, attachmentId),
  fileSelectFiles: () => ipcRenderer.invoke('file:select-files'),
  
  onFileUploadProgress: (callback) => {
    ipcRenderer.on('file:upload-progress', (event, data) => callback(data));
  },
  
  // ==================== INTERNATIONALIZATION (i18n) ====================
  
  i18nGetLocale: () => ipcRenderer.invoke('i18n:get-locale'),
  i18nSetLocale: (locale) => ipcRenderer.invoke('i18n:set-locale', locale),
  i18nGetAvailableLocales: () => ipcRenderer.invoke('i18n:get-available-locales'),
  i18nGetTranslations: () => ipcRenderer.invoke('i18n:get-translations'),
  i18nTranslate: (key, params) => ipcRenderer.invoke('i18n:translate', key, params),
  
  onLocaleChanged: (callback) => {
    ipcRenderer.on('i18n:locale-changed', (event, data) => callback(data));
  },
  
  // ==================== AUTO-UPDATER ====================
  
  updaterCheck: (showDialog) => ipcRenderer.invoke('updater:check', showDialog),
  updaterDownload: () => ipcRenderer.invoke('updater:download'),
  updaterInstall: () => ipcRenderer.invoke('updater:install'),
  updaterGetInfo: () => ipcRenderer.invoke('updater:get-info'),
  updaterGetSettings: () => ipcRenderer.invoke('updater:get-settings'),
  updaterSetChannel: (channel) => ipcRenderer.invoke('updater:set-channel', channel),
  updaterSetAutoDownload: (enabled) => ipcRenderer.invoke('updater:set-auto-download', enabled),
  
  onAutoUpdater: (callback) => {
    ipcRenderer.on('auto-updater', (event, data) => callback(data));
  },
  
  // ==================== THEME MANAGER ====================
  
  themeGet: () => ipcRenderer.invoke('theme:get'),
  themeSet: (theme) => ipcRenderer.invoke('theme:set', theme),
  themeToggle: () => ipcRenderer.invoke('theme:toggle'),
  themeGetInfo: () => ipcRenderer.invoke('theme:get-info'),
  
  onThemeChanged: (callback) => {
    ipcRenderer.on('theme-changed', (event, data) => callback(data));
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
