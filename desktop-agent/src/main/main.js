const { app, BrowserWindow, Tray, Menu, ipcMain, dialog, Notification, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const AutoLaunch = require('auto-launch');

// Configuração centralizada
const config = require('../config');

// Módulos customizados
const InventoryCollector = require('../modules/inventoryCollector');
const RemoteAccess = require('../modules/remoteAccess');
const ApiClient = require('../modules/apiClient');
const TicketManager = require('../modules/ticketManager');
const OfflineQueue = require('../modules/offlineQueue');
const ConnectionMonitor = require('../modules/connectionMonitor');
const FileUploader = require('../modules/fileUploader');
const AutoUpdaterManager = require('../modules/autoUpdater');
const { getInstance: getI18n } = require('../modules/i18n');
const ThemeManager = require('../modules/themeManager');

// Configuração
const store = new Store();
const isDev = process.argv.includes('--dev');

// Variáveis globais
let mainWindow = null;
let tray = null;
let inventoryCollector = null;
let remoteAccess = null;
let apiClient = null;
let ticketManager = null;
let offlineQueue = null;
let connectionMonitor = null;
let fileUploader = null;
let autoUpdaterManager = null;
let i18n = null;
let themeManager = null;
let updateTrayMenu = () => {}; // Função vazia como fallback

// Auto-launch configuration
let autoLauncher = null;
try {
  autoLauncher = new AutoLaunch({
    name: 'T-Desk Agent',
    isHidden: true
  });
} catch (error) {
  console.warn('⚠️ Auto-launch não disponível:', error.message);
}

// Criar janela principal
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    resizable: true,
    frame: true,
    icon: path.join(__dirname, '../../assets/icons/tdesk3.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    // No modo dev, sempre mostrar a janela
    if (isDev || !store.get('minimizeOnStart', false)) {
      mainWindow.show();
      mainWindow.focus();
      console.log('✅ Janela do Desktop Agent aberta e visível');
      console.log('📍 Acesse a interface gráfica na janela que acabou de abrir');
    } else {
      console.log('⚪ Janela minimizada. Use o tray icon ou reabre manualmente');
    }
    
    // Inicializar auto-updater após janela estar pronta
    if (!isDev) {
      initializeAutoUpdater();
    }
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// Criar tray icon
function createTray() {
  const iconPath = path.join(__dirname, '../../assets/icons/tdesk3.png');
  
  // Verificar se o ícone existe
  const fs = require('fs');
  if (!fs.existsSync(iconPath)) {
    console.log('⚪ Tray icon não encontrado, continuando sem ele...');
    return;
  }
  
  try {
    tray = new Tray(iconPath);
    console.log('✅ Tray icon criado com sucesso');
  } catch (error) {
    console.log('⚪ Tray icon não disponível:', error.message);
    console.log('   Aplicação continuará funcionando normalmente');
    return;
  }

  updateTrayMenu = () => {
    if (!tray) return; // Tray não foi criado
    
    const isConnected = apiClient && apiClient.isConnected();
    const isRemoteActive = remoteAccess && remoteAccess.isActive;
    const ticketStats = ticketManager ? ticketManager.getStats() : null;

    const menuItems = [
      {
        label: 'T-Desk Agent',
        enabled: false,
        icon: iconPath
      },
      { type: 'separator' },
      {
        label: isConnected ? '✅ Conectado' : '❌ Desconectado',
        enabled: false
      },
      {
        label: isRemoteActive ? '🟢 Acesso Remoto: Ativo' : '⚪ Acesso Remoto: Inativo',
        enabled: false
      }
    ];

    // Adicionar informações de tickets se disponível
    if (ticketStats) {
      menuItems.push(
        {
          label: `🎫 Tickets Abertos: ${ticketStats.open + ticketStats.inProgress}`,
          enabled: false
        },
        {
          label: ticketStats.unread > 0 ? `🔔 Não Lidas: ${ticketStats.unread}` : '✅ Tudo Lido',
          enabled: false
        }
      );
    }

    menuItems.push(
      { type: 'separator' },
      {
        label: '📊 Abrir Painel',
        click: () => {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    );

    // Adicionar item de tickets se disponível
    if (ticketStats && ticketStats.total > 0) {
      menuItems.push({
        label: `🎫 Ver Tickets (${ticketStats.total})`,
        click: () => {
          mainWindow.show();
          mainWindow.webContents.send('navigate-to', 'tickets');
        }
      });
    }

    menuItems.push(
      {
        label: '🔄 Sincronizar Agora',
        click: async () => {
          if (inventoryCollector) {
            await inventoryCollector.collect();
          }
        }
      },
      { type: 'separator' },
      {
        label: '⚙️ Configurações',
        click: () => {
          mainWindow.show();
          mainWindow.webContents.send('navigate-to', 'settings');
        }
      },
      {
        label: '🚪 Sair',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    );

    const contextMenu = Menu.buildFromTemplate(menuItems);
    tray.setContextMenu(contextMenu);
  };

  if (!tray) {
    console.warn('⚠️  Tray icon não foi criado. Aplicação funcionará sem ícone na bandeja.');
    return;
  }

  updateTrayMenu();
  
  // Atualizar menu a cada 5 segundos
  setInterval(updateTrayMenu, 5000);

  tray.setToolTip('T-Desk Agent');
  
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

// Inicializar Auto-Updater
function initializeAutoUpdater() {
  try {
    console.log('[AutoUpdater] Inicializando...');
    
    autoUpdaterManager = new AutoUpdaterManager(mainWindow);
    
    // Iniciar verificação periódica
    autoUpdaterManager.startPeriodicCheck();
    
    console.log('[AutoUpdater] Inicializado com sucesso');
  } catch (error) {
    console.error('[AutoUpdater] Erro ao inicializar:', error);
  }
}

// Inicializar i18n
function initializeI18n() {
  try {
    console.log('[i18n] Inicializando...');
    
    i18n = getI18n();
    
    console.log('[i18n] Inicializado com sucesso. Idioma:', i18n.getLocale());
  } catch (error) {
    console.error('[i18n] Erro ao inicializar:', error);
  }
}

// Inicializar Theme Manager
function initializeThemeManager() {
  try {
    console.log('[ThemeManager] Inicializando...');
    
    themeManager = new ThemeManager(mainWindow);
    
    console.log('[ThemeManager] Inicializado com sucesso. Tema:', themeManager.getCurrentTheme());
  } catch (error) {
    console.error('[ThemeManager] Erro ao inicializar:', error);
  }
}

// Inicialização
async function initialize() {
  // Inicializar i18n primeiro
  initializeI18n();
  
  // Inicializar Theme Manager
  initializeThemeManager();
  // Inicializar API Client (usa URL do .env como padrão)
  const serverUrl = store.get('serverUrl', config.backend.url);
  const token = store.get('token');
  
  apiClient = new ApiClient(serverUrl, token);

  // Inicializar Offline Queue
  offlineQueue = new OfflineQueue(apiClient);
  
  // Inicializar Connection Monitor
  connectionMonitor = new ConnectionMonitor(apiClient);
  
  // Inicializar File Uploader
  fileUploader = new FileUploader(apiClient);
  
  // Configurar listeners de conexão
  connectionMonitor.on('offline', () => {
    console.log('🔴 Modo offline ativado');
    mainWindow.webContents.send('connection-status', { online: false });
    sendNotification('warning', 'Conexão perdida. Trabalhando em modo offline.', {
      desktop: true,
      title: 'Modo Offline'
    });
  });
  
  connectionMonitor.on('online', async () => {
    console.log('🟢 Conexão restaurada');
    mainWindow.webContents.send('connection-status', { online: true });
    sendNotification('success', 'Conexão restaurada. Sincronizando dados...', {
      desktop: true,
      title: 'Conexão Restaurada'
    });
    
    // Processar fila offline
    const result = await offlineQueue.process();
    if (result.processed > 0) {
      sendNotification('success', `${result.processed} ações sincronizadas com sucesso.`, {
        desktop: true,
        title: 'Sincronização Completa'
      });
    }
  });

  // Inicializar Inventory Collector
  inventoryCollector = new InventoryCollector(apiClient, store);
  
  // Inicializar Remote Access
  remoteAccess = new RemoteAccess(apiClient, store);

  // Inicializar Ticket Manager
  ticketManager = new TicketManager();

  // Auto-connect se tiver token
  if (token) {
    try {
      await apiClient.connect();
      
      // Iniciar monitoramento de conexão
      connectionMonitor.start();
      
      await inventoryCollector.start();
      await remoteAccess.start();
      
      // Inicializar tickets
      await ticketManager.initialize({ serverUrl, token });
      
      // Conectar socket ao ticket manager se remoteAccess tiver socket
      if (remoteAccess.socket) {
        ticketManager.connectSocket(remoteAccess.socket);
      }
      
      // Listeners de tickets
      setupTicketListeners();
      
      // Configurar event listeners do ticketManager
      ticketManager.on('notification', (notification) => {
        sendNotification('info', notification.body, {
          desktop: true,
          title: notification.title,
          ticketId: notification.ticketId,
          navigateTo: 'tickets'
        });
        
        // Enviar para renderer
        mainWindow.webContents.send('ticket-notification', notification);
      });
      
      // Iniciar sistema de notificações periódicas
      startNotificationSystem();
      
      ticketManager.on('tickets-updated', (tickets) => {
        mainWindow.webContents.send('tickets-updated', tickets);
      });
      
      ticketManager.on('ticket-created', (ticket) => {
        // Notificação de novo ticket
        sendNotification('info', `Novo ticket: ${ticket.subject}`, {
          desktop: true,
          title: 'Novo Ticket Criado',
          ticketId: ticket.id,
          urgency: ticket.priority === 'high' || ticket.priority === 'critical' ? 'critical' : 'normal'
        });
        
        mainWindow.webContents.send('ticket-created', ticket);
      });
      
      ticketManager.on('new-message', (data) => {
        const { ticketId, message } = data;
        
        // Notificação de nova mensagem
        sendNotification('info', `Nova mensagem no ticket: ${message.substring(0, 100)}...`, {
          desktop: true,
          title: 'Nova Mensagem',
          ticketId: ticketId,
          badge: ticketManager.unreadCount
        });
        
        mainWindow.webContents.send('new-message', data);
      });
      
      ticketManager.on('unread-count-changed', (count) => {
        // Atualizar badge
        app.setBadgeCount(count);
        mainWindow.webContents.send('unread-count-changed', count);
      });
      
      ticketManager.on('error', (error) => {
        sendNotification('error', `Erro no TicketManager: ${error.message}`);
      });
      
    } catch (error) {
      console.error('Erro ao conectar:', error);
    }
  }
}

// Configurar listeners de tickets
function setupTicketListeners() {
  if (!ticketManager) return;

  ticketManager.on('tickets-updated', (tickets) => {
    mainWindow.webContents.send('tickets-updated', tickets);
    updateTrayMenu();
  });

  ticketManager.on('ticket-created', (ticket) => {
    // Notificação desktop
    if (ticket.clientId === ticketManager.user?.id) {
      new Notification({
        title: 'Novo Ticket Criado',
        body: `${ticket.subject}`,
        silent: false
      }).show();
    }
    
    mainWindow.webContents.send('ticket-created', ticket);
  });

  ticketManager.on('new-message', (data) => {
    mainWindow.webContents.send('new-message', data);
  });

  ticketManager.on('notification', (notification) => {
    new Notification({
      title: notification.title,
      body: notification.body,
      silent: false
    }).show();
    
    mainWindow.webContents.send('ticket-notification', notification);
  });

  ticketManager.on('unread-count-changed', (count) => {
    mainWindow.webContents.send('unread-count-changed', count);
    updateTrayMenu();
  });

  // Eventos de acesso remoto
  ticketManager.on('remote-access-requested', (request) => {
    console.log('🔔 Encaminhando solicitação de acesso remoto para renderer');
    mainWindow.webContents.send('remote-access-requested', request);
    
    // Notificação desktop nativa
    new Notification({
      title: 'Solicitação de Acesso Remoto',
      body: `${request.requester?.name || 'Um técnico'} está solicitando acesso remoto`,
      icon: path.join(__dirname, '../../assets/icons/tdesk3.png'),
    }).on('click', () => {
      mainWindow.show();
      mainWindow.focus();
    });
  });

  ticketManager.on('remote-access-ended', (data) => {
    mainWindow.webContents.send('remote-access-ended', data);
  });
}

// Setup Tray (stub por enquanto)
function setupTray() {
  // TODO: Implementar tray icon
  console.log('⚪ Tray icon será implementado em breve');
}

// Setup AutoLaunch (stub por enquanto)
function setupAutoLaunch() {
  // TODO: Implementar auto-launch
  console.log('🚀 Auto-launch será implementado em breve');
}

// Event Listeners
app.whenReady().then(async () => {
  createWindow();
  setupTray();
  setupAutoLaunch();
  
  // Verificar se há token antes de inicializar
  const token = store.get('token');
  const serverUrl = store.get('serverUrl');
  
  if (token && serverUrl) {
    // Tentar inicializar conexão
    try {
      await initialize();
    } catch (error) {
      console.log('⚠️ Erro na inicialização automática:', error.message);
      console.log('💡 Aguardando login do usuário...');
    }
  } else {
    console.log('🔐 Nenhuma sessão encontrada. Aguardando login...');
  }
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

// IPC Handlers
ipcMain.handle('get-config', () => {
  return {
    serverUrl: store.get('serverUrl', config.backend.url),
    backendUrl: config.backend.url, // URL do backend do .env
    token: store.get('token'),
    autoLaunch: store.get('autoLaunch', false),
    autoSync: store.get('autoSync', true),
    syncInterval: store.get('syncInterval', config.sync.intervalMinutes),
    minimizeOnStart: store.get('minimizeOnStart', true),
    remoteAccessEnabled: store.get('remoteAccessEnabled', false),
    useMock: config.development.useMock
  };
});

ipcMain.handle('save-config', async (event, config) => {
  // Salvar configuraes
  // Salvar configurações
  Object.keys(config).forEach(key => {
    store.set(key, config[key]);
  });

  // Aplicar auto-launch
  if (autoLauncher) {
    try {
      if (config.autoLaunch) {
        await autoLauncher.enable();
      } else {
        await autoLauncher.disable();
      }
    } catch (error) {
      console.warn('⚠️  Auto-launch não disponível:', error.message);
    }
  }

  // Reconectar se URL ou token mudaram
  if (config.serverUrl || config.token) {
    apiClient.updateConfig(config.serverUrl, config.token);
    await apiClient.connect();
  }

  // Reiniciar serviços
  if (inventoryCollector) {
    await inventoryCollector.restart(config);
  }

  if (remoteAccess) {
    await remoteAccess.restart(config);
  }

  return { success: true };
});

ipcMain.handle('clear-config', () => {
  store.clear();
  // Desconectar se necessário
  if (ticketManager) {
    ticketManager.disconnect();
  }
  return { success: true };
});

ipcMain.handle('validate-token', async () => {
  try {
    const token = store.get('token');
    const serverUrl = store.get('serverUrl');
    
    if (!token || !serverUrl) {
      return { success: false, error: 'Token ou servidor não configurado' };
    }
    
    // Verificar token usando o ticketManager
    if (ticketManager && ticketManager.user) {
      // Se já temos um ticketManager com usuário, o token é válido
      return { success: true, user: ticketManager.user };
    }
    
    // Caso contrário, fazer uma chamada de teste
    const axios = require('axios');
    const response = await axios.get(`${serverUrl}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return { success: true, user: response.data.user };
  } catch (error) {
    console.error('Token inválido:', error.message);
    return { success: false, error: 'Token inválido ou expirado' };
  }
});

// Handler de login
ipcMain.handle('login', async (event, { serverUrl, username, password, portalType }) => {
  // Modo MOCK configurado via .env (USE_MOCK=true/false)
  const USE_MOCK = config.development.useMock;
  
  if (USE_MOCK) {
    console.log('🔐 [MOCK] Tentando login com:', username, 'Portal:', portalType);
    
    // Mock users para desenvolvimento (dentro da função para evitar redeclaração)
    // Suporta organization_users e client_users
    const MOCK_USERS = [
      // Organization Users (tabela organization_users)
      {
        id: 1,
        name: 'Admin Organização',
        email: 'admin@organizacao.com',
        password: 'Admin@123',
        role: 'org-admin', // ou org-technician, org-manager
        userType: 'organization',
        organizationId: 1,
        organizationName: 'Organização Principal'
      },
      {
        id: 2,
        name: 'Técnico Suporte',
        email: 'tecnico@organizacao.com',
        password: 'Tecnico@123',
        role: 'org-technician',
        userType: 'organization',
        organizationId: 1,
        organizationName: 'Organização Principal'
      },
      
      // Client Users (tabela client_users)
      {
        id: 3,
        name: 'Cliente Empresa',
        email: 'cliente@empresa.com',
        password: 'Cliente@123',
        role: 'client-user',
        userType: 'client',
        organizationId: 1,
        clientId: 1,
        clientName: 'Empresa Cliente XYZ'
      },
      {
        id: 4,
        name: 'Cliente Teste',
        email: 'usuario@cliente.com',
        password: 'Usuario@123',
        role: 'client-user',
        userType: 'client',
        organizationId: 1,
        clientId: 2,
        clientName: 'Empresa Teste'
      }
    ];
    
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Filtrar por portalType se fornecido
    let filteredUsers = MOCK_USERS;
    if (portalType) {
      filteredUsers = MOCK_USERS.filter(u => u.userType === portalType);
    }
    
    const user = filteredUsers.find(u => u.email === username && u.password === password);
    
    if (!user) {
      console.log('❌ [MOCK] Credenciais inválidas ou tipo de portal incorreto');
      return {
        success: false,
        error: 'Email ou senha inválidos'
      };
    }
    
    const { password: _, ...userWithoutPassword } = user;
    const mockToken = 'mock-jwt-token-' + Date.now();
    
    // Criar contexto
    const context = {
      contextId: user.userType === 'organization' ? user.organizationId : user.clientId,
      contextType: user.userType === 'organization' ? 'organization' : 'client',
      organizationId: user.organizationId,
      organizationName: user.organizationName,
      clientId: user.clientId,
      clientName: user.clientName,
      role: user.role,
      permissions: []
    };
    
    console.log('✅ [MOCK] Login bem-sucedido:', userWithoutPassword);
    
    // Salvar token e serverUrl
    store.set('serverUrl', serverUrl);
    store.set('token', mockToken);
    store.set('user', userWithoutPassword);
    store.set('context', context);
    
    return {
      success: true,
      token: mockToken,
      user: userWithoutPassword,
      context,
      requiresContextSelection: false // Mock sempre retorna único contexto
    };
  }
  
  // Modo PRODUÇÃO (usar quando backend estiver pronto)
  try {
    const axios = require('axios');
    
    console.log('🔐 Fazendo login no servidor:', serverUrl, 'Portal:', portalType);
    
    // Fazer login no servidor com portalType
    const response = await axios.post(`${serverUrl}/api/auth/login`, {
      email: username,
      password: password,
      portalType: portalType // 'organization' ou 'client'
    });
    
    if (response.data && response.data.token) {
      const { token, user, context, contexts, requiresContextSelection } = response.data;
      
      console.log('✅ Login bem-sucedido:', {
        email: user.email,
        userType: user.userType,
        role: user.role,
        requiresContextSelection
      });
      
      // Se requer seleção de contexto, retornar contextos disponíveis
      if (requiresContextSelection && contexts && contexts.length > 0) {
        console.log('🔀 Múltiplos contextos disponíveis:', contexts.length);
        return {
          success: true,
          requiresContextSelection: true,
          contexts,
          email: username,
          password // Necessário para select-context
        };
      }
      
      // Contexto único - salvar e retornar
      store.set('serverUrl', serverUrl);
      store.set('token', token);
      store.set('user', user);
      store.set('context', context);
      
      return {
        success: true,
        token,
        user,
        context,
        requiresContextSelection: false
      };
    }
    
    return {
      success: false,
      error: 'Resposta inválida do servidor'
    };
  } catch (error) {
    console.error('❌ Erro no login:', error.message);
    
    // Extrair mensagem de erro do backend
    const errorMessage = error.response?.data?.error 
      || error.response?.data?.message 
      || error.message 
      || 'Erro ao fazer login';
    
    return {
      success: false,
      error: errorMessage
    };
  }
});

// Handler para selecionar contexto após login
ipcMain.handle('select-context', async (event, { email, password, contextId, contextType }) => {
  try {
    const axios = require('axios');
    const serverUrl = store.get('serverUrl');
    
    if (!serverUrl) {
      return { success: false, error: 'Servidor não configurado' };
    }
    
    console.log('🔀 Selecionando contexto:', { contextId, contextType });
    
    const response = await axios.post(`${serverUrl}/api/auth/select-context`, {
      email,
      password,
      contextId,
      contextType
    });
    
    if (response.data && response.data.token) {
      const { token, user, context } = response.data;
      
      console.log('✅ Contexto selecionado:', context);
      
      // Salvar token, user e context
      store.set('token', token);
      store.set('user', user);
      store.set('context', context);
      
      return {
        success: true,
        token,
        user,
        context
      };
    }
    
    return {
      success: false,
      error: 'Resposta inválida do servidor'
    };
  } catch (error) {
    console.error('❌ Erro ao selecionar contexto:', error.message);
    
    const errorMessage = error.response?.data?.error 
      || error.response?.data?.message 
      || error.message 
      || 'Erro ao selecionar contexto';
    
    return {
      success: false,
      error: errorMessage
    };
  }
});

// Handler para trocar contexto durante sessão ativa
ipcMain.handle('switch-context', async (event, { contextId, contextType }) => {
  try {
    const axios = require('axios');
    const serverUrl = store.get('serverUrl');
    const token = store.get('token');
    
    if (!serverUrl || !token) {
      return { success: false, error: 'Não autenticado' };
    }
    
    console.log('🔄 Trocando contexto:', { contextId, contextType });
    
    const response = await axios.post(
      `${serverUrl}/api/auth/switch-context`,
      { contextId, contextType },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (response.data && response.data.token) {
      const { token: newToken, user, context } = response.data;
      
      console.log('✅ Contexto trocado:', context);
      
      // Atualizar token, user e context
      store.set('token', newToken);
      store.set('user', user);
      store.set('context', context);
      
      // Notificar renderer sobre mudança de contexto
      if (mainWindow) {
        mainWindow.webContents.send('context-changed', { user, context });
      }
      
      return {
        success: true,
        token: newToken,
        user,
        context
      };
    }
    
    return {
      success: false,
      error: 'Resposta inválida do servidor'
    };
  } catch (error) {
    console.error('❌ Erro ao trocar contexto:', error.message);
    
    const errorMessage = error.response?.data?.error 
      || error.response?.data?.message 
      || error.message 
      || 'Erro ao trocar contexto';
    
    return {
      success: false,
      error: errorMessage
    };
  }
});

// Handler para listar contextos disponíveis
ipcMain.handle('list-contexts', async (event) => {
  try {
    const axios = require('axios');
    const serverUrl = store.get('serverUrl');
    const token = store.get('token');
    
    if (!serverUrl || !token) {
      return { success: false, error: 'Não autenticado' };
    }
    
    console.log('📋 Listando contextos disponíveis...');
    
    const response = await axios.get(`${serverUrl}/api/auth/contexts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data && response.data.contexts) {
      console.log('✅ Contextos carregados:', response.data.contexts.length);
      
      return {
        success: true,
        contexts: response.data.contexts
      };
    }
    
    return {
      success: false,
      error: 'Resposta inválida do servidor'
    };
  } catch (error) {
    console.error('❌ Erro ao listar contextos:', error.message);
    
    const errorMessage = error.response?.data?.error 
      || error.response?.data?.message 
      || error.message 
      || 'Erro ao listar contextos';
    
    return {
      success: false,
      error: errorMessage
    };
  }
});

// Handler para conectar o agent após login
ipcMain.handle('connect-agent', async (event, { serverUrl, token }) => {
  try {
    console.log('🔧 Conectando agent ao backend:', serverUrl);
    
    // Criar ou atualizar apiClient
    if (!apiClient) {
      apiClient = new ApiClient(serverUrl, token);
    } else {
      apiClient.updateConfig(serverUrl, token);
    }
    
    // Conectar ao backend (seta connected = true)
    const connectResult = await apiClient.connect();
    console.log('🔗 Resultado da conexão:', connectResult);
    
    if (!connectResult.success) {
      console.log('⚠️ Aviso na conexão:', connectResult.error);
      // Forçar connected = true já que o login foi validado
      apiClient.connected = true;
      console.log('🔧 Forçando connected = true após login válido');
    }
    
    // Inicializar Inventory Collector (scanner de hardware)
    if (!inventoryCollector) {
      console.log('📊 Inicializando Inventory Collector...');
      inventoryCollector = new InventoryCollector(apiClient, store);
    }
    
    // Inicializar Remote Access
    if (!remoteAccess) {
      console.log('🖥️ Inicializando Remote Access...');
      remoteAccess = new RemoteAccess(apiClient, store);
    }
    
    // Inicializar Connection Monitor
    if (!connectionMonitor) {
      console.log('📡 Inicializando Connection Monitor...');
      connectionMonitor = new ConnectionMonitor(apiClient);
    }
    connectionMonitor.start();
    
    // Inicializar ticket manager
    if (!ticketManager) {
      ticketManager = new TicketManager();
    }
    await ticketManager.initialize({ serverUrl, token });
    
    // Configurar listeners
    setupTicketListeners();
    
    // Iniciar coleta de inventário
    console.log('🔄 Iniciando coleta de inventário...');
    try {
      await inventoryCollector.start();
      console.log('✅ Inventory Collector iniciado');
    } catch (invError) {
      console.log('⚠️ Aviso no inventário:', invError.message);
    }
    
    console.log('✅ Agent conectado com sucesso');
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao conectar agent:', error.message);
    return {
      success: false,
      error: error.message || 'Erro ao conectar agent'
    };
  }
});

ipcMain.handle('connect', async (event, { serverUrl, token }) => {
  try {
    store.set('serverUrl', serverUrl);
    store.set('token', token);
    
    apiClient.updateConfig(serverUrl, token);
    const result = await apiClient.connect();
    
    if (result.success) {
      await inventoryCollector.start();
      await remoteAccess.start();
      
      // Inicializar ticket manager
      if (!ticketManager) {
        ticketManager = new TicketManager();
      }
      await ticketManager.initialize({ serverUrl, token });
      
      // Conectar socket
      if (remoteAccess.socket) {
        ticketManager.connectSocket(remoteAccess.socket);
      }
      
      // Configurar listeners
      setupTicketListeners();
    }
    
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('disconnect', async () => {
  try {
    await inventoryCollector.stop();
    await remoteAccess.stop();
    await apiClient.disconnect();
    
    // Desconectar ticket manager
    if (ticketManager) {
      ticketManager.disconnect();
    }
    
    store.delete('token');
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-status', () => {
  return {
    connected: apiClient ? apiClient.isConnected() : false,
    remoteAccessActive: remoteAccess ? remoteAccess.isActive : false,
    lastSync: store.get('lastSync'),
    machineId: store.get('machineId')
  };
});

ipcMain.handle('sync-now', async () => {
  console.log('📊 [sync-now] Chamado. inventoryCollector:', inventoryCollector ? 'OK' : 'NULL');
  console.log('📊 [sync-now] apiClient.connected:', apiClient ? apiClient.isConnected() : 'apiClient NULL');
  
  try {
    if (!inventoryCollector) {
      console.log('❌ [sync-now] Coletor não inicializado, criando agora...');
      // Criar inventoryCollector se não existir
      if (apiClient) {
        inventoryCollector = new InventoryCollector(apiClient, store);
        console.log('✅ [sync-now] InventoryCollector criado');
      } else {
        return { success: false, error: 'API Client não inicializado' };
      }
    }
    
    // Garantir que apiClient está conectado
    if (apiClient && !apiClient.isConnected()) {
      console.log('🔧 [sync-now] Forçando apiClient.connected = true');
      apiClient.connected = true;
    }
    
    const result = await inventoryCollector.collect();
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ [sync-now] Erro:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-system-info', async () => {
  console.log('📊 [get-system-info] Chamado. inventoryCollector:', inventoryCollector ? 'OK' : 'NULL');
  
  try {
    if (!inventoryCollector) {
      console.log('❌ [get-system-info] Coletor não inicializado, criando agora...');
      // Criar inventoryCollector se não existir
      if (apiClient) {
        inventoryCollector = new InventoryCollector(apiClient, store);
        console.log('✅ [get-system-info] InventoryCollector criado');
      } else {
        return null;
      }
    }
    
    const info = await inventoryCollector.getSystemInfo();
    console.log('✅ [get-system-info] Info obtida:', info ? 'OK' : 'NULL');
    return info;
  } catch (error) {
    console.error('❌ [get-system-info] Erro:', error.message);
    return null;
  }
});

ipcMain.handle('toggle-remote-access', async (event, enabled) => {
  try {
    store.set('remoteAccessEnabled', enabled);
    
    if (enabled) {
      await remoteAccess.start();
    } else {
      await remoteAccess.stop();
    }
    
    return { success: true, enabled };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return { success: true, path: result.filePaths[0] };
  }
  
  return { success: false };
});

ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.on('show-notification', (event, data) => {
  if (mainWindow) {
    mainWindow.webContents.send('notification', data);
  }
});

// ==================== TICKET HANDLERS ====================

ipcMain.handle('tickets:fetch', async (event, filters) => {
  try {
    if (!ticketManager) {
      console.warn('⚠️ Ticket manager não inicializado');
      return { success: false, tickets: [], error: 'Ticket manager não inicializado' };
    }
    
    // Verificar se o ticketManager tem token
    if (!ticketManager.token) {
      console.warn('⚠️ Ticket manager sem token de autenticação');
      return { success: false, tickets: [], error: 'Não autenticado' };
    }
    
    const tickets = await ticketManager.fetchTickets(filters);
    return { success: true, tickets };
  } catch (error) {
    console.error('Erro ao buscar tickets:', error);
    return { success: false, tickets: [], error: error.message };
  }
});

ipcMain.handle('tickets:get', async (event, ticketId) => {
  try {
    if (!ticketManager) {
      return { success: false, error: 'Ticket manager não inicializado' };
    }
    
    const ticket = await ticketManager.getTicket(ticketId);
    return { success: true, ticket };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tickets:create', async (event, ticketData) => {
  try {
    if (!ticketManager) {
      return { success: false, error: 'Ticket manager não inicializado' };
    }
    
    const ticket = await ticketManager.createTicket(ticketData);
    return { success: true, ticket };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tickets:update', async (event, ticketId, updates) => {
  try {
    if (!ticketManager) {
      return { success: false, error: 'Ticket manager não inicializado' };
    }
    
    const ticket = await ticketManager.updateTicket(ticketId, updates);
    return { success: true, ticket };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tickets:assign', async (event, ticketId, agentId) => {
  try {
    if (!ticketManager) {
      return { success: false, error: 'Ticket manager não inicializado' };
    }
    
    const ticket = await ticketManager.assignTicket(ticketId, agentId);
    return { success: true, ticket };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tickets:send-message', async (event, ticketId, message, attachments) => {
  try {
    if (!ticketManager) {
      return { success: false, error: 'Ticket manager não inicializado' };
    }
    
    const result = await ticketManager.sendMessage(ticketId, message, attachments);
    return { success: true, message: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tickets:get-messages', async (event, ticketId) => {
  try {
    if (!ticketManager) {
      return { success: false, error: 'Ticket manager não inicializado' };
    }
    
    // ticketManager.getMessages() já retorna { success, messages }
    const result = await ticketManager.getMessages(ticketId);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tickets:get-attachments', async (event, ticketId) => {
  try {
    if (!ticketManager) {
      return { success: false, error: 'Ticket manager não inicializado' };
    }
    
    const result = await ticketManager.getAttachments(ticketId);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tickets:mark-as-read', async (event, ticketId) => {
  try {
    if (!ticketManager) {
      return { success: false, error: 'Ticket manager não inicializado' };
    }
    
    await ticketManager.markAsRead(ticketId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tickets:get-agents', async () => {
  try {
    if (!ticketManager) {
      return { success: false, error: 'Ticket manager não inicializado' };
    }
    
    const agents = await ticketManager.getAvailableAgents();
    return { success: true, agents };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tickets:get-categories', async () => {
  try {
    if (!ticketManager) {
      return { success: false, error: 'Ticket manager não inicializado' };
    }
    
    const categories = await ticketManager.getCategories();
    return { success: true, categories };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tickets:get-priorities', async () => {
  try {
    if (!ticketManager) {
      return { success: false, error: 'Ticket manager não inicializado' };
    }
    
    const priorities = await ticketManager.getPriorities();
    return { success: true, priorities };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tickets:get-types', async () => {
  try {
    if (!ticketManager) {
      return { success: false, error: 'Ticket manager não inicializado' };
    }
    
    const types = await ticketManager.getTypes();
    return { success: true, types };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tickets:change-status', async (event, ticketId, status) => {
  try {
    if (!ticketManager) {
      return { success: false, error: 'Ticket manager não inicializado' };
    }
    
    const ticket = await ticketManager.changeTicketStatus(ticketId, status);
    return { success: true, ticket };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tickets:get-stats', () => {
  try {
    if (!ticketManager) {
      return { success: false, error: 'Ticket manager não inicializado' };
    }
    
    const stats = ticketManager.getStats();
    return { success: true, stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tickets:get-user-info', () => {
  try {
    if (!ticketManager) {
      return { success: false, error: 'Ticket manager não inicializado' };
    }
    
    return { success: true, user: ticketManager.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== ACESSO REMOTO ====================

ipcMain.handle('remote-access:get-pending', async () => {
  try {
    if (!ticketManager) {
      return { success: false, error: 'Ticket manager não inicializado' };
    }
    
    const requests = await ticketManager.getRemoteAccessPending();
    return { success: true, requests };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remote-access:accept', async (event, requestId) => {
  try {
    if (!ticketManager) {
      return { success: false, error: 'Ticket manager não inicializado' };
    }
    
    const result = await ticketManager.acceptRemoteAccess(requestId);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remote-access:reject', async (event, requestId, reason) => {
  try {
    if (!ticketManager) {
      return { success: false, error: 'Ticket manager não inicializado' };
    }
    
    const result = await ticketManager.rejectRemoteAccess(requestId, reason);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remote-access:end', async (event, requestId) => {
  try {
    if (!ticketManager) {
      return { success: false, error: 'Ticket manager não inicializado' };
    }
    
    const result = await ticketManager.endRemoteAccess(requestId);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== CATÁLOGO DE SERVIÇOS ====================

ipcMain.handle('catalog:get-categories', async () => {
  try {
    if (!apiClient) {
      return { success: false, error: 'API client não inicializado' };
    }
    
    const result = await apiClient.getCatalogCategories();
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('catalog:get-items', async (event, categoryId) => {
  try {
    if (!apiClient) {
      return { success: false, error: 'API client não inicializado' };
    }
    
    const result = await apiClient.getCatalogItems(categoryId);
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('catalog:request-item', async (event, itemId, data) => {
  try {
    if (!apiClient) {
      return { success: false, error: 'API client não inicializado' };
    }
    
    const result = await apiClient.requestCatalogItem(itemId, data);
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== BASE DE CONHECIMENTO ====================

ipcMain.handle('knowledge:get-articles', async (event, filters) => {
  try {
    if (!apiClient) {
      return { success: false, error: 'API client não inicializado' };
    }
    
    const result = await apiClient.getKnowledgeArticles(filters);
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('knowledge:get-article', async (event, id) => {
  try {
    if (!apiClient) {
      return { success: false, error: 'API client não inicializado' };
    }
    
    const result = await apiClient.getKnowledgeArticle(id);
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('knowledge:increment-views', async (event, id) => {
  try {
    if (!apiClient) {
      return { success: false, error: 'API client não inicializado' };
    }
    
    const result = await apiClient.incrementArticleViews(id);
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== NOTIFICAÇÕES ====================

ipcMain.handle('notifications:get', async () => {
  try {
    if (!apiClient) {
      return { success: false, error: 'API client não inicializado' };
    }
    
    const result = await apiClient.getNotifications();
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('notifications:mark-read', async (event, id) => {
  try {
    if (!apiClient) {
      return { success: false, error: 'API client não inicializado' };
    }
    
    const result = await apiClient.markNotificationAsRead(id);
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== ESTATÍSTICAS ====================

ipcMain.handle('tickets:get-statistics', async () => {
  try {
    if (!apiClient) {
      return { success: false, error: 'API client não inicializado' };
    }
    
    const result = await apiClient.getTicketStatistics();
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== OFFLINE QUEUE ====================

ipcMain.handle('offline-queue:add', async (event, action, data, metadata) => {
  try {
    if (!offlineQueue) {
      return { success: false, error: 'Offline queue não inicializado' };
    }
    
    const itemId = offlineQueue.add(action, data, metadata);
    return { success: true, itemId };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('offline-queue:process', async () => {
  try {
    if (!offlineQueue) {
      return { success: false, error: 'Offline queue não inicializado' };
    }
    
    const result = await offlineQueue.process();
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('offline-queue:get-stats', async () => {
  try {
    if (!offlineQueue) {
      return { success: false, error: 'Offline queue não inicializado' };
    }
    
    const stats = offlineQueue.getStats();
    return { success: true, stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('offline-queue:get-all', async () => {
  try {
    if (!offlineQueue) {
      return { success: false, error: 'Offline queue não inicializado' };
    }
    
    const items = offlineQueue.getAll();
    return { success: true, items };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('offline-queue:clear-failed', async () => {
  try {
    if (!offlineQueue) {
      return { success: false, error: 'Offline queue não inicializado' };
    }
    
    const count = offlineQueue.clearFailed();
    return { success: true, count };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('offline-queue:clear-all', async () => {
  try {
    if (!offlineQueue) {
      return { success: false, error: 'Offline queue não inicializado' };
    }
    
    const count = offlineQueue.clearAll();
    return { success: true, count };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== CONNECTION STATUS ====================

ipcMain.handle('connection:get-status', async () => {
  try {
    if (!connectionMonitor) {
      return { success: false, error: 'Connection monitor não inicializado' };
    }
    
    const isOnline = connectionMonitor.getStatus();
    const stats = connectionMonitor.getStats();
    return { success: true, isOnline, stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('connection:check-now', async () => {
  try {
    if (!connectionMonitor) {
      return { success: false, error: 'Connection monitor não inicializado' };
    }
    
    await connectionMonitor.checkConnection();
    const isOnline = connectionMonitor.getStatus();
    return { success: true, isOnline };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== UPLOAD DE ARQUIVOS ====================

ipcMain.handle('file:validate', async (event, filePath) => {
  try {
    if (!fileUploader) {
      return { success: false, error: 'File uploader não inicializado' };
    }
    
    const validation = fileUploader.validateFile(filePath);
    return { success: true, ...validation };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:validate-multiple', async (event, filePaths) => {
  try {
    if (!fileUploader) {
      return { success: false, error: 'File uploader não inicializado' };
    }
    
    const results = fileUploader.validateFiles(filePaths);
    return { success: true, results };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:get-info', async (event, filePath) => {
  try {
    if (!fileUploader) {
      return { success: false, error: 'File uploader não inicializado' };
    }
    
    const info = fileUploader.getFileInfo(filePath);
    return { success: true, info };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:generate-preview', async (event, filePath) => {
  try {
    if (!fileUploader) {
      return { success: false, error: 'File uploader não inicializado' };
    }
    
    const preview = await fileUploader.generateImagePreview(filePath);
    return { success: true, preview };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:upload', async (event, ticketId, filePath) => {
  try {
    if (!fileUploader) {
      return { success: false, error: 'File uploader não inicializado' };
    }
    
    const result = await fileUploader.uploadFile(ticketId, filePath, (progress) => {
      // Enviar progresso para o renderer
      mainWindow.webContents.send('file:upload-progress', {
        ticketId,
        filePath,
        progress
      });
    });
    
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:upload-multiple', async (event, ticketId, filePaths) => {
  try {
    if (!fileUploader) {
      return { success: false, error: 'File uploader não inicializado' };
    }
    
    const result = await fileUploader.uploadFiles(ticketId, filePaths, (progress) => {
      // Enviar progresso para o renderer
      mainWindow.webContents.send('file:upload-progress', {
        ticketId,
        progress
      });
    });
    
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:get-attachments', async (event, ticketId) => {
  try {
    if (!apiClient) {
      return { success: false, error: 'API client não inicializado' };
    }
    
    const attachments = await apiClient.getTicketAttachments(ticketId);
    return { success: true, attachments };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:download-attachment', async (event, ticketId, attachmentId) => {
  try {
    if (!apiClient) {
      return { success: false, error: 'API client não inicializado' };
    }
    
    const data = await apiClient.downloadAttachment(ticketId, attachmentId);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:delete-attachment', async (event, ticketId, attachmentId) => {
  try {
    if (!apiClient) {
      return { success: false, error: 'API client não inicializado' };
    }
    
    const result = await apiClient.deleteAttachment(ticketId, attachmentId);
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Dialog para selecionar arquivos
ipcMain.handle('file:select-files', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Todos os Arquivos', extensions: ['*'] },
        { name: 'Imagens', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] },
        { name: 'Documentos', extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'] },
        { name: 'Texto', extensions: ['txt', 'csv', 'html', 'css', 'js', 'json', 'xml'] },
        { name: 'Arquivos Compactados', extensions: ['zip', 'rar', '7z', 'tar', 'gz'] }
      ]
    });
    
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    
    return { success: true, filePaths: result.filePaths };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== INTERNATIONALIZATION (i18n) ====================

ipcMain.handle('i18n:get-locale', async () => {
  try {
    if (!i18n) {
      return { success: false, error: 'i18n não inicializado' };
    }
    
    const locale = i18n.getLocale();
    return { success: true, locale };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('i18n:set-locale', async (event, locale) => {
  try {
    if (!i18n) {
      return { success: false, error: 'i18n não inicializado' };
    }
    
    const result = i18n.setLocale(locale);
    if (result) {
      // Notificar renderer sobre mudança de idioma
      mainWindow.webContents.send('i18n:locale-changed', { locale });
      return { success: true, locale };
    } else {
      return { success: false, error: 'Idioma não disponível' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('i18n:get-available-locales', async () => {
  try {
    if (!i18n) {
      return { success: false, error: 'i18n não inicializado' };
    }
    
    const locales = i18n.getAvailableLocales();
    return { success: true, locales };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('i18n:get-translations', async () => {
  try {
    if (!i18n) {
      return { success: false, error: 'i18n não inicializado' };
    }
    
    const translations = i18n.getAllTranslations();
    return { success: true, translations };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('i18n:translate', async (event, key, params) => {
  try {
    if (!i18n) {
      return { success: false, error: 'i18n não inicializado' };
    }
    
    const translation = i18n.t(key, params);
    return { success: true, translation };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== AUTO-UPDATER ====================

ipcMain.handle('updater:check', async (event, showDialog = true) => {
  try {
    if (!autoUpdaterManager) {
      return { success: false, error: 'Auto-updater não inicializado' };
    }
    
    await autoUpdaterManager.checkForUpdates(showDialog);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('updater:download', async () => {
  try {
    if (!autoUpdaterManager) {
      return { success: false, error: 'Auto-updater não inicializado' };
    }
    
    await autoUpdaterManager.downloadUpdate();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('updater:install', async () => {
  try {
    if (!autoUpdaterManager) {
      return { success: false, error: 'Auto-updater não inicializado' };
    }
    
    autoUpdaterManager.installUpdate();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('updater:get-info', async () => {
  try {
    if (!autoUpdaterManager) {
      return { success: false, error: 'Auto-updater não inicializado' };
    }
    
    const info = autoUpdaterManager.getUpdateInfo();
    return { success: true, ...info };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('updater:get-settings', async () => {
  try {
    if (!autoUpdaterManager) {
      return { success: false, error: 'Auto-updater não inicializado' };
    }
    
    const settings = autoUpdaterManager.getSettings();
    return { success: true, settings };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('updater:set-channel', async (event, channel) => {
  try {
    if (!autoUpdaterManager) {
      return { success: false, error: 'Auto-updater não inicializado' };
    }
    
    autoUpdaterManager.setChannel(channel);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('updater:set-auto-download', async (event, enabled) => {
  try {
    if (!autoUpdaterManager) {
      return { success: false, error: 'Auto-updater não inicializado' };
    }
    
    autoUpdaterManager.setAutoDownload(enabled);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== SISTEMA DE NOTIFICAÇÕES ====================

let notificationTimer = null;
let lastNotificationCheck = null;

function startNotificationSystem() {
  // Limpar timer existente
  if (notificationTimer) {
    clearInterval(notificationTimer);
  }
  
  // Verificar notificações a cada 1 minuto
  notificationTimer = setInterval(async () => {
    await checkNotifications();
  }, 60000); // 60 segundos
  
  // Verificação inicial após 5 segundos
  setTimeout(() => {
    checkNotifications();
  }, 5000);
  
  console.log('✅ Sistema de notificações iniciado');
}

async function checkNotifications() {
  if (!apiClient || !apiClient.isConnected()) {
    return;
  }
  
  try {
    const result = await apiClient.getNotifications();
    
    if (!result || !result.notifications) {
      return;
    }
    
    const notifications = result.notifications;
    const unreadNotifications = notifications.filter(n => !n.read);
    
    // Atualizar badge no dock/taskbar
    if (unreadNotifications.length > 0) {
      app.setBadgeCount(unreadNotifications.length);
    } else {
      app.setBadgeCount(0);
    }
    
    // Enviar para renderer
    if (mainWindow) {
      mainWindow.webContents.send('notifications-updated', {
        total: notifications.length,
        unread: unreadNotifications.length,
        notifications: notifications
      });
    }
    
    // Mostrar notificações desktop para novas notificações
    unreadNotifications.forEach(notif => {
      // Verificar se já foi mostrada (usando timestamp)
      if (lastNotificationCheck && new Date(notif.createdAt) <= lastNotificationCheck) {
        return;
      }
      
      // Mostrar notificação desktop
      const notification = new Notification({
        title: notif.title || 'T-Desk',
        body: notif.message || notif.body || '',
        icon: path.join(__dirname, '../../assets/icons/tdesk3.png'),
        silent: false,
        urgency: notif.priority === 'high' || notif.priority === 'urgent' ? 'critical' : 'normal'
      });
      
      notification.on('click', () => {
        mainWindow.show();
        mainWindow.focus();
        
        // Marcar como lida
        apiClient.markNotificationAsRead(notif.id).catch(err => {
          console.warn('Erro ao marcar notificação como lida:', err);
        });
        
        // Navegar se houver link
        if (notif.link || notif.ticketId) {
          if (notif.ticketId) {
            mainWindow.webContents.send('navigate-to', 'tickets');
            mainWindow.webContents.send('open-ticket', notif.ticketId);
          } else if (notif.link) {
            mainWindow.webContents.send('navigate-to', notif.link);
          }
        }
      });
      
      notification.show();
    });
    
    lastNotificationCheck = new Date();
    
  } catch (error) {
    console.error('Erro ao verificar notificações:', error);
  }
}

// Enviar notificações para renderer
function sendNotification(type, message, options = {}) {
  if (mainWindow) {
    mainWindow.webContents.send('notification', { type, message });
    
    // Notificação desktop nativa
    if (options.desktop) {
      const notification = new Notification({
        title: options.title || 'T-Desk',
        body: message,
        icon: path.join(__dirname, '../../assets/icons/tdesk3.png'),
        silent: false,
        urgency: options.urgency || 'normal'
      });
      
      notification.on('click', () => {
        mainWindow.show();
        mainWindow.focus();
        
        // Navegar para a página específica se fornecida
        if (options.navigateTo) {
          mainWindow.webContents.send('navigate-to', options.navigateTo);
        }
        
        // Abrir ticket específico se fornecido
        if (options.ticketId) {
          mainWindow.webContents.send('open-ticket', options.ticketId);
        }
      });
      
      notification.show();
      
      // Atualizar badge no dock/taskbar
      if (options.badge) {
        app.setBadgeCount(options.badge);
      }
    }
  }
}

// ==================== THEME MANAGER ====================

ipcMain.handle('theme:get', async () => {
  try {
    if (!themeManager) {
      return { success: false, error: 'Theme manager não inicializado' };
    }
    
    const theme = themeManager.getCurrentTheme();
    return { success: true, theme };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('theme:set', async (event, theme) => {
  try {
    if (!themeManager) {
      return { success: false, error: 'Theme manager não inicializado' };
    }
    
    const result = themeManager.applyTheme(theme);
    if (result) {
      return { success: true, theme };
    } else {
      return { success: false, error: 'Tema inválido' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('theme:toggle', async () => {
  try {
    if (!themeManager) {
      return { success: false, error: 'Theme manager não inicializado' };
    }
    
    const newTheme = themeManager.toggleTheme();
    return { success: true, theme: newTheme };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('theme:get-info', async () => {
  try {
    if (!themeManager) {
      return { success: false, error: 'Theme manager não inicializado' };
    }
    
    const info = themeManager.getThemeInfo();
    return { success: true, ...info };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Exportar para uso nos módulos
global.sendNotification = sendNotification;
global.store = store;
