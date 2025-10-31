const { app, BrowserWindow, Tray, Menu, ipcMain, dialog, Notification, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const AutoLaunch = require('auto-launch');

// Módulos customizados
const InventoryCollector = require('../modules/inventoryCollector');
const RemoteAccess = require('../modules/remoteAccess');
const ApiClient = require('../modules/apiClient');
const TicketManager = require('../modules/ticketManager');

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
let updateTrayMenu = () => {}; // Função vazia como fallback

// Auto-launch configuration
let autoLauncher = null;
try {
  autoLauncher = new AutoLaunch({
    name: 'TatuTicket Agent',
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
    icon: path.join(__dirname, '../../assets/icons/icon.png'),
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
  const iconPath = path.join(__dirname, '../../assets/tray/icon.png');
  
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
        label: 'TatuTicket Agent',
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

  tray.setToolTip('TatuTicket Agent');
  
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

// Inicialização
async function initialize() {
  // Inicializar API Client
  const serverUrl = store.get('serverUrl', 'http://localhost:3000');
  const token = store.get('token');
  
  apiClient = new ApiClient(serverUrl, token);

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
}

// Event Listeners
app.whenReady().then(async () => {
  createWindow();
  createTray();
  await initialize();

  // Verificar auto-launch
  const autoLaunchEnabled = store.get('autoLaunch', false);
  if (autoLauncher) {
    try {
      if (autoLaunchEnabled) {
        await autoLauncher.enable();
      } else {
        await autoLauncher.disable();
      }
    } catch (error) {
      console.warn('⚠️  Auto-launch não disponível:', error.message);
    }
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
    serverUrl: store.get('serverUrl', 'http://localhost:3000'),
    token: store.get('token'),
    autoLaunch: store.get('autoLaunch', false),
    autoSync: store.get('autoSync', true),
    syncInterval: store.get('syncInterval', 60),
    minimizeOnStart: store.get('minimizeOnStart', true),
    remoteAccessEnabled: store.get('remoteAccessEnabled', false)
  };
});

ipcMain.handle('save-config', async (event, config) => {
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
  try {
    if (!inventoryCollector) {
      return { success: false, error: 'Coletor não inicializado' };
    }
    
    const result = await inventoryCollector.collect();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-system-info', async () => {
  try {
    if (!inventoryCollector) {
      return null;
    }
    
    const info = await inventoryCollector.getSystemInfo();
    return info;
  } catch (error) {
    console.error('Erro ao obter informações do sistema:', error);
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
    
    const messages = await ticketManager.getMessages(ticketId);
    return { success: true, messages };
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

// Enviar notificações para renderer
function sendNotification(type, message, options = {}) {
  if (mainWindow) {
    mainWindow.webContents.send('notification', { type, message });
    
    // Notificação desktop nativa
    if (options.desktop) {
      const notification = new Notification({
        title: options.title || 'TatuTicket',
        body: message,
        icon: path.join(__dirname, '../assets/icon.png'),
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

// Exportar para uso nos módulos
global.sendNotification = sendNotification;
global.store = store;
