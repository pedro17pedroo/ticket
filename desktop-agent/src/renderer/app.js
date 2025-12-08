// Configuração - A URL do backend é definida no arquivo .env
// Para alterar, edite: desktop-agent/.env -> BACKEND_URL
const SERVER_URL = window.BACKEND_URL || 'http://localhost:4003/api';

// Importar componentes
import { SLAIndicator } from './components/SLAIndicator.js';
import { RemoteAccessNotifications, remoteAccessNotificationsStyles } from './components/RemoteAccessNotifications.js';

// Log de versão
console.log('🚀 TatuTicket Desktop Agent v2.0 - COM DETALHES DE TICKETS');
console.log('📅 Versão atualizada: 30/10/2025 00:30');

// Estado global
const state = {
  user: null,
  connected: false,
  systemInfo: null,
  tickets: [],
  filteredTickets: [],
  filters: {
    search: '',
    status: '',
    priority: '',
    sortBy: 'createdAt-desc'
  },
  lastSync: null,
  newTicketFiles: [],
  syncTimer: null,
  openTicketId: null // Ticket atualmente aberto no modal
};

// Utilitário seguro para HTML em preview
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================
// SISTEMA DE TEMAS
// ============================================

/**
 * Inicializar sistema de temas
 */
async function initializeThemeSystem() {
  try {
    console.log('🎨 Inicializando sistema de temas...');
    
    // Obter tema atual
    const result = await window.electronAPI.themeGet();
    if (result.success) {
      applyTheme(result.theme);
    }
    
    // Configurar listener de mudança de tema
    window.electronAPI.onThemeChanged((data) => {
      console.log('🎨 Tema alterado:', data);
      applyTheme(data.theme, data.effectiveTheme);
    });
    
    // Configurar botão de toggle
    const toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleTheme);
    }
    
    console.log('✅ Sistema de temas inicializado');
  } catch (error) {
    console.error('❌ Erro ao inicializar sistema de temas:', error);
  }
}

/**
 * Aplicar tema no HTML
 * @param {string} theme - Tema selecionado (light, dark, system)
 * @param {string} effectiveTheme - Tema efetivo (light ou dark)
 */
function applyTheme(theme, effectiveTheme = null) {
  const html = document.documentElement;
  const themeIcon = document.getElementById('themeIcon');
  
  // Se não tiver effectiveTheme, usar o theme
  const actualTheme = effectiveTheme || theme;
  
  // Aplicar data-theme no HTML
  if (actualTheme === 'dark') {
    html.setAttribute('data-theme', 'dark');
  } else {
    html.setAttribute('data-theme', 'light');
  }
  
  // Atualizar ícone do botão
  if (themeIcon) {
    const icons = {
      'light': '☀️',
      'dark': '🌙',
      'system': '💻'
    };
    themeIcon.textContent = icons[theme] || '🎨';
  }
  
  console.log(`🎨 Tema aplicado: ${theme} (efetivo: ${actualTheme})`);
}

/**
 * Alternar tema
 */
async function toggleTheme() {
  try {
    const result = await window.electronAPI.themeToggle();
    if (result.success) {
      console.log('🎨 Tema alternado para:', result.theme);
      // O evento theme-changed será disparado automaticamente
    }
  } catch (error) {
    console.error('❌ Erro ao alternar tema:', error);
  }
}

// Calcular tempo restante do SLA
function calculateSLARemaining(ticket) {
  if (!ticket.sla || !ticket.createdAt) {
    return null;
  }
  
  const sla = ticket.sla;
  const createdAt = new Date(ticket.createdAt);
  const now = new Date();
  
  // Determinar qual deadline usar baseado no status
  let deadlineMinutes;
  let slaType;
  
  if (ticket.status === 'resolved' || ticket.status === 'closed') {
    return { expired: false, message: 'Ticket finalizado', color: '#64748b' };
  }
  
  // Se ainda não foi respondido, usar tempo de resposta
  if (!ticket.firstResponseAt && sla.responseTime) {
    deadlineMinutes = parseInt(sla.responseTime) || 0;
    slaType = 'Resposta';
  } 
  // Caso contrário, usar tempo de resolução
  else if (sla.resolutionTime) {
    deadlineMinutes = parseInt(sla.resolutionTime) || 0;
    slaType = 'Resolução';
  } else {
    return null;
  }
  
  const deadlineDate = new Date(createdAt.getTime() + deadlineMinutes * 60000);
  const remainingMs = deadlineDate - now;
  const remainingMinutes = Math.floor(remainingMs / 60000);
  
  // Calcular porcentagem de tempo decorrido
  const elapsedMs = now - createdAt;
  const totalMs = deadlineMinutes * 60000;
  const percentage = Math.min(100, (elapsedMs / totalMs) * 100);
  
  // Determinar cor baseado na porcentagem
  let color, status;
  if (remainingMs <= 0) {
    color = '#f56565'; // Vermelho - expirado
    status = 'expired';
  } else if (percentage >= 80) {
    color = '#f59e0b'; // Laranja - crítico
    status = 'critical';
  } else if (percentage >= 60) {
    color = '#fbbf24'; // Amarelo - atenção
    status = 'warning';
  } else {
    color = '#48bb78'; // Verde - ok
    status = 'ok';
  }
  
  // Formatar tempo restante
  let timeString;
  if (remainingMs <= 0) {
    const overdue = Math.abs(remainingMinutes);
    if (overdue >= 1440) {
      timeString = `${Math.floor(overdue / 1440)}d atrasado`;
    } else if (overdue >= 60) {
      timeString = `${Math.floor(overdue / 60)}h atrasado`;
    } else {
      timeString = `${overdue}min atrasado`;
    }
  } else {
    if (remainingMinutes >= 1440) {
      timeString = `${Math.floor(remainingMinutes / 1440)}d restantes`;
    } else if (remainingMinutes >= 60) {
      timeString = `${Math.floor(remainingMinutes / 60)}h restantes`;
    } else {
      timeString = `${remainingMinutes}min restantes`;
    }
  }
  
  return {
    expired: remainingMs <= 0,
    remaining: remainingMinutes,
    percentage: Math.round(percentage),
    color,
    status,
    message: `${slaType}: ${timeString}`,
    slaType
  };
}

// Stubs opcionais para preview em navegador (sem Electron)
if (typeof window !== 'undefined' && !window.electronAPI) {
  window.electronAPI = {
    async getConfig() {
      return { serverUrl: 'http://localhost:4003/api', token: null };
    },
    async connect() { return { success: true, user: { id: 'preview-user', role: 'cliente', name: 'Preview User' } }; },
    async getSystemInfo() { return { os: 'macOS', version: 'Preview' }; },
    async fetchTickets() { return { success: true, tickets: [] }; },
    async getCategories() {
      return { categories: [
        { id: 'cat-geral', name: 'Geral' },
        { id: 'cat-suporte', name: 'Suporte' },
        { id: 'cat-software', name: 'Software' },
      ] };
    },
    async getPriorities() {
      return { priorities: [
        { id: 'pri-1', name: 'Baixa', color: '#10b981' },
        { id: 'pri-2', name: 'Média', color: '#f59e0b' },
        { id: 'pri-3', name: 'Alta', color: '#ef4444' },
        { id: 'pri-4', name: 'Urgente', color: '#dc2626' },
      ] };
    },
    async getTypes() {
      return { types: [
        { id: 'type-1', name: 'Incidente' },
        { id: 'type-2', name: 'Solicitação' },
        { id: 'type-3', name: 'Bug' },
      ] };
    },
    async createTicket(payload) {
      console.log('[Preview] createTicket payload', payload);
      return { success: true, ticket: { id: 'preview-ticket-1', ...payload } };
    },
    async sendMessage(ticketId, message, attachments) {
      console.log('[Preview] sendMessage', { ticketId, message, attachments });
      return { success: true };
    },
    onTicketEvent() {},
    onNewMessage() {},
    disconnect() { return { success: true }; }
  };
}

// Inicialização
document.addEventListener('DOMContentLoaded', async function init() {
  console.log('🚀 Iniciando aplicação...');
  
  setupEventListeners();
  setupTicketFilters();
  
  // Inicializar sistema de temas
  await initializeThemeSystem();
  
  // Verificar se existe sessão válida
  await checkExistingSession();
});

// Verificar sessão existente
async function checkExistingSession() {
  const config = await window.electronAPI.getConfig();
  
  if (config.token) {
    // Mostrar tela de carregamento
    showLoadingScreen('Verificando sessão...');
    
    try {
      // Verificar se o token ainda é válido
      const result = await window.electronAPI.validateToken();
      
      if (result.success) {
        // Token válido - ir para dashboard
        showApp();
        await loadUserData();
        showPage('dashboard');
      } else {
        // Token inválido - limpar e ir para login
        await handleInvalidToken();
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      await handleInvalidToken();
    }
  } else {
    // Sem token - mostrar login
    showLoginScreen();
  }
}

// Lidar com token inválido
async function handleInvalidToken() {
  console.log('⚠️ Token inválido ou expirado - limpando sessão...');
  
  // Limpar configuração
  await window.electronAPI.clearConfig();
  
  // Limpar estado local
  state.user = null;
  state.connected = false;
  state.tickets = [];
  
  // Mostrar tela de login
  showLoginScreen();
  showLoginError('Sessão expirada. Por favor, faça login novamente.');
}

// Mostrar tela de carregamento com progress bar
function showLoadingScreen(message = 'Carregando...', progress = 0) {
  // Criar ou atualizar tela de carregamento
  let loadingScreen = document.getElementById('loadingScreen');
  if (!loadingScreen) {
    loadingScreen = document.createElement('div');
    loadingScreen.id = 'loadingScreen';
    loadingScreen.className = 'screen';
    loadingScreen.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999;';
    loadingScreen.innerHTML = `
      <style>
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .loading-step {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          margin: 0.5rem 0;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          transition: all 0.3s ease;
        }
        .loading-step.active {
          background: rgba(255, 255, 255, 0.2);
          animation: pulse 1.5s ease-in-out infinite;
        }
        .loading-step.completed {
          background: rgba(76, 175, 80, 0.2);
        }
        .step-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        .step-icon.pending {
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        .step-icon.active {
          border: 2px solid white;
          animation: spin 1s linear infinite;
        }
        .step-icon.completed {
          background: #4CAF50;
          color: white;
        }
      </style>
      <div class="loading-container" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
      ">
        <div class="loading-content" style="
          text-align: center;
          color: white;
          max-width: 500px;
          width: 100%;
        ">
          <div style="margin-bottom: 2rem;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-bottom: 1rem;">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/>
              <path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke-width="2"/>
            </svg>
            <h2 style="font-size: 1.75rem; margin-bottom: 0.5rem; font-weight: 600;">TatuTicket Agent</h2>
            <p style="font-size: 0.875rem; opacity: 0.8;">Iniciando sistema...</p>
          </div>
          
          <!-- Progress Bar -->
          <div style="
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 2px;
            overflow: hidden;
            margin-bottom: 2rem;
          ">
            <div id="loadingProgressBar" style="
              height: 100%;
              background: white;
              width: 0%;
              transition: width 0.3s ease;
              border-radius: 2px;
            "></div>
          </div>
          
          <!-- Steps -->
          <div id="loadingSteps" style="text-align: left;">
            <div class="loading-step" data-step="auth">
              <div class="step-icon pending" id="stepIcon1">○</div>
              <span id="stepText1">Autenticando...</span>
            </div>
            <div class="loading-step" data-step="connect">
              <div class="step-icon pending" id="stepIcon2">○</div>
              <span id="stepText2">Conectando ao servidor...</span>
            </div>
            <div class="loading-step" data-step="sync">
              <div class="step-icon pending" id="stepIcon3">○</div>
              <span id="stepText3">Sincronizando dados...</span>
            </div>
            <div class="loading-step" data-step="dashboard">
              <div class="step-icon pending" id="stepIcon4">○</div>
              <span id="stepText4">Preparando dashboard...</span>
            </div>
          </div>
          
          <p id="loadingMessage" style="
            font-size: 0.875rem;
            opacity: 0.7;
            margin-top: 1.5rem;
          ">${message}</p>
        </div>
      </div>
    `;
    document.getElementById('app').appendChild(loadingScreen);
  } else {
    const msgEl = document.getElementById('loadingMessage');
    if (msgEl) msgEl.textContent = message;
    
    const progressBar = document.getElementById('loadingProgressBar');
    if (progressBar) progressBar.style.width = `${progress}%`;
  }
  
  // Ocultar todas as outras telas
  document.getElementById('loginScreen')?.classList.remove('active');
  document.getElementById('mainApp')?.classList.remove('active');
  
  // Mostrar tela de carregamento
  loadingScreen.style.display = 'block';
  loadingScreen.classList.add('active');
}

// Atualizar etapa de loading
function updateLoadingStep(stepNumber, status = 'active', text = null) {
  const stepIcon = document.getElementById(`stepIcon${stepNumber}`);
  const stepText = document.getElementById(`stepText${stepNumber}`);
  const stepEl = document.querySelector(`[data-step]`);
  
  if (!stepIcon || !stepText) return;
  
  // Atualizar texto se fornecido
  if (text) stepText.textContent = text;
  
  // Remover classes anteriores
  stepIcon.classList.remove('pending', 'active', 'completed');
  
  // Adicionar nova classe e ícone
  if (status === 'active') {
    stepIcon.classList.add('active');
    stepIcon.textContent = '⟳';
  } else if (status === 'completed') {
    stepIcon.classList.add('completed');
    stepIcon.textContent = '✓';
  } else {
    stepIcon.classList.add('pending');
    stepIcon.textContent = '○';
  }
  
  // Atualizar estilo do step
  const step = stepIcon.closest('.loading-step');
  if (step) {
    step.classList.remove('active', 'completed');
    if (status === 'active') step.classList.add('active');
    if (status === 'completed') step.classList.add('completed');
  }
}

// Mostrar tela de login
function showLoginScreen() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) loadingScreen.style.display = 'none';
  document.getElementById('loginScreen').classList.add('active');
}

// Event Listeners
function setupEventListeners() {
  // Login
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('forgotPasswordLink').addEventListener('click', openForgotPassword);
  
  // Navegação
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateTo(page);
    });
  });
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  
  // Ações
  document.getElementById('refreshInfoBtn')?.addEventListener('click', handleManualScan);
  document.getElementById('saveSettingsBtn')?.addEventListener('click', handleSaveSettings);
  document.getElementById('newTicketBtn')?.addEventListener('click', handleNewTicket);
}

// Adicionar mensagem ao chat em tempo real
function appendMessageToChat(message) {
  const messagesContainer = document.getElementById('messagesContainer');
  if (!messagesContainer) {
    console.warn('⚠️ Container de mensagens não encontrado');
    return;
  }
  
  // Verificar se a mensagem é interna (não mostrar para clientes)
  if (message.isInternal) {
    console.log('🔒 Mensagem interna, não exibir');
    return;
  }
  
  const userName = message.user?.name || message.author || message.userName || 'Usuário';
  const userInitials = userName.substring(0, 2).toUpperCase();
  const hasAttachments = message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0;
  
  const messageHTML = `
    <div style="background: white; padding: 1rem; border-radius: 0.5rem; margin-bottom: 0.75rem; border-left: 3px solid ${message.isInternal ? '#fbbf24' : '#667eea'};">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="width: 2rem; height: 2rem; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.75rem;">
            ${userInitials}
          </div>
          <div>
            <div style="font-weight: 600; font-size: 0.875rem; color: #1e293b;">${escapeHTML(userName)}</div>
            <div style="font-size: 0.75rem; color: #64748b;">${new Date(message.createdAt).toLocaleString('pt-BR')}</div>
          </div>
        </div>
      </div>
      <div style="font-size: 0.875rem; color: #334155; line-height: 1.5;">
        ${escapeHTML(message.content || message.body || '')}
      </div>
      ${hasAttachments ? `
        <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e2e8f0;">
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            ${message.attachments.map(att => `
              <a href="${att.path || att.url || '#'}" target="_blank" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #f8fafc; border-radius: 0.375rem; border: 1px solid #e2e8f0; text-decoration: none; color: #1e293b; font-size: 0.75rem;">
                <svg style="width: 1rem; height: 1rem; color: #667eea;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                ${escapeHTML(att.originalName || att.filename || 'Anexo')}
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
  
  // Scroll para a última mensagem
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  console.log('✅ Mensagem adicionada ao chat');
}

// Eventos em tempo real de tickets
function setupTicketRealtime() {
  try {
    window.electronAPI.onTicketsUpdated((tickets) => {
      state.tickets = tickets || [];
      renderTicketsList();
      document.getElementById('statTickets').textContent = state.tickets.length.toString();
      updateDashboard();
    });

    window.electronAPI.onTicketCreated((ticket) => {
      addActivity(`Ticket criado: ${ticket.subject || ticket.id}`, 'success');
      // Recarregar lista para garantir consistência
      loadTickets();
    });

    window.electronAPI.onUnreadCountChanged((count) => {
      const badge = document.getElementById('ticketsBadge');
      if (!badge) return;
      badge.textContent = String(count || 0);
      badge.style.display = (count && count > 0) ? 'inline-block' : 'none';
    });

    window.electronAPI.onTicketNotification((notif) => {
      showNotification(notif.body || 'Atualização de ticket', 'info');
    });

    // Listener para novas mensagens em tempo real
    window.electronAPI.onNewMessage((data) => {
      console.log('🔔 Nova mensagem recebida:', data);
      
      const { ticketId, message } = data;
      
      // Se o ticket está aberto, atualizar o chat em tempo real
      if (state.openTicketId === ticketId) {
        console.log('✅ Atualizando chat do ticket aberto');
        appendMessageToChat(message);
      } else {
        console.log('ℹ️ Mensagem de outro ticket, não atualizar chat');
      }
      
      // Atualizar lista de tickets (pode ter mudado lastMessage)
      loadTickets();
    });
  } catch (error) {
    console.error('Erro ao configurar eventos de tickets:', error);
  }
}

// ============================================
// LOGIN
// ============================================
async function handleLogin(e) {
  e.preventDefault();
  
  console.log('🔐 Iniciando processo de login...');
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  // Obter URL do backend da configuração (sem /api no final)
  const appConfig = await window.electronAPI.getConfig();
  // Remove /api do final se existir para evitar duplicação
  let serverUrl = appConfig.backendUrl || 'http://localhost:4003';
  serverUrl = serverUrl.replace(/\/api\/?$/, '');
  
  if (!email || !password) {
    showLoginError('Por favor, preencha todos os campos');
    return;
  }
  
  // Mostrar tela de carregamento
  showLoadingScreen('Iniciando...', 0);
  
  try {
    // ETAPA 1: Autenticação (0-25%)
    updateLoadingStep(1, 'active', 'Autenticando usuário...');
    showLoadingScreen('Verificando credenciais...', 10);
    
    console.log('🌐 Fazendo login no servidor...');
    
    const { success: loginSuccess, token, user, error: loginError } = await window.electronAPI.login({
      serverUrl,
      username: email,
      password
    });
    
    if (!loginSuccess) {
      console.log('❌ Falha no login:', loginError);
      throw new Error(loginError || 'Erro ao fazer login');
    }
    
    console.log('✅ Login bem-sucedido! Token:', token ? 'recebido' : 'não recebido');
    console.log('👤 Dados do usuário:', user);
    
    updateLoadingStep(1, 'completed', '✓ Autenticado com sucesso');
    showLoadingScreen('Autenticado!', 25);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // ETAPA 2: Conectar Agent (25-50%)
    updateLoadingStep(2, 'active', 'Conectando ao servidor...');
    showLoadingScreen('Estabelecendo conexão...', 30);
    
    console.log('🔧 Conectando o agent...');
    
    const result = await window.electronAPI.connectAgent({ serverUrl, token });
    
    if (!result.success) {
      console.log('❌ Falha na conexão do agent:', result.error);
      throw new Error(result.error || 'Erro ao conectar agent');
    }
    
    // 3. Salvar dados do usuário
    state.user = user;
    state.connected = true;
    
    // 4. Configurar eventos em tempo real
    setupTicketRealtime();
    
    updateLoadingStep(2, 'completed', '✓ Conectado ao servidor');
    showLoadingScreen('Conectado!', 50);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // ETAPA 3: Sincronização (50-75%)
    updateLoadingStep(3, 'active', 'Sincronizando dados...');
    showLoadingScreen('Carregando informações...', 55);
    
    console.log('⏰ Configurando sync automático...');
    
    // 5. Configurar sync automático
    setupAutoSync();
    
    showLoadingScreen('Carregando usuário...', 60);
    
    // 6. Carregar dados iniciais
    await loadUserData();
    
    showLoadingScreen('Carregando tickets...', 70);
    
    updateLoadingStep(3, 'completed', '✓ Dados sincronizados');
    showLoadingScreen('Sincronizado!', 75);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // ETAPA 4: Dashboard (75-100%)
    updateLoadingStep(4, 'active', 'Preparando interface...');
    showLoadingScreen('Montando dashboard...', 85);
    
    console.log('✅ Login concluído com sucesso!');
    
    showLoadingScreen('Quase pronto...', 95);
    await new Promise(resolve => setTimeout(resolve, 400));
    
    updateLoadingStep(4, 'completed', '✓ Dashboard pronto');
    showLoadingScreen('Pronto!', 100);
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // 7. Mostrar dashboard
    showApp();
    showPage('dashboard');
    
  } catch (error) {
    console.error('❌ Erro no login:', error);
    console.error('❌ Stack trace:', error.stack);
    
    // Voltar para tela de login
    showLoginScreen();
    showLoginError(error.message || 'Erro ao fazer login');
  }
}

function showLoginError(message) {
  const errorDiv = document.getElementById('loginError');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

function hideLoginError() {
  const errorDiv = document.getElementById('loginError');
  errorDiv.style.display = 'none';
}

function openForgotPassword(e) {
  e.preventDefault();
  window.electronAPI.openExternal(`${SERVER_URL}/forgot-password`);
}

// Função de logout
async function handleLogout() {
  console.log('👋 Fazendo logout...');
  
  // Confirmar logout
  const confirmLogout = confirm('Tem certeza que deseja sair?');
  if (!confirmLogout) return;
  
  try {
    // Mostrar tela de carregamento
    showLoadingScreen('Desconectando...');
    
    // Desconectar do servidor se necessário
    await window.electronAPI.disconnect();
    
    // Limpar configuração
    await window.electronAPI.clearConfig();
    
    // Limpar estado local
    state.user = null;
    state.connected = false;
    state.tickets = [];
    state.systemInfo = null;
    state.filteredTickets = [];
    state.filters = {
      search: '',
      status: '',
      priority: '',
      sortBy: 'createdAt-desc'
    };
    
    // Limpar timers
    if (state.syncTimer) {
      clearInterval(state.syncTimer);
      state.syncTimer = null;
    }
    
    console.log('✅ Logout concluído');
    
    // Voltar para tela de login
    showLoginScreen();
    
    // Limpar mensagem de erro anterior se houver
    hideLoginError();
    
    // Mostrar mensagem de sucesso
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
      const successMsg = document.createElement('div');
      successMsg.className = 'alert alert-success';
      successMsg.textContent = 'Logout realizado com sucesso!';
      successMsg.style.cssText = 'background: #d4edda; color: #155724; padding: 0.75rem; border-radius: 0.375rem; margin-bottom: 1rem;';
      
      const loginBox = loginScreen.querySelector('.login-box');
      if (loginBox) {
        const existingAlert = loginBox.querySelector('.alert-success');
        if (existingAlert) existingAlert.remove();
        loginBox.insertBefore(successMsg, loginBox.firstChild);
        
        // Remover mensagem após 3 segundos
        setTimeout(() => successMsg.remove(), 3000);
      }
    }
    
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    showNotification('Erro ao fazer logout', 'error');
  }
}

// ============================================
// NAVEGAÇÃO
// ============================================
function showLogin() {
  document.getElementById('loginScreen').classList.add('active');
  document.getElementById('mainApp').classList.remove('active');
}

function showApp() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) loadingScreen.style.display = 'none';
  document.getElementById('loginScreen').classList.remove('active');
  document.getElementById('mainApp').classList.add('active');
}

function showPage(pageName) {
  // Remover active de todas as páginas
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Adicionar active na página selecionada
  const pageId = `${pageName}Page`;
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
  }
  
  // Atualizar menu de navegação
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const navItem = document.querySelector(`[data-page="${pageName}"]`);
  if (navItem) {
    navItem.classList.add('active');
  }
  
  // Atualizar título da página
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) {
    const titles = {
      dashboard: 'Dashboard',
      tickets: 'Tickets',
      newTicket: 'Novo Ticket',
      settings: 'Configurações'
    };
    pageTitle.textContent = titles[pageName] || 'TatuTicket Agent';
  }
  
  // Carregar dados específicos da página
  loadPageData(pageName);
}

function navigateTo(pageName) {
  // Atualizar navegação ativa
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
  
  // Atualizar páginas
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(`${pageName}Page`).classList.add('active');
  
  // Atualizar título
  const titles = {
    dashboard: 'Dashboard',
    tickets: 'Tickets',
    info: 'Informações do Sistema',
    chat: 'Chat',
    settings: 'Configurações'
  };
  document.getElementById('pageTitle').textContent = titles[pageName];
  
  // Carregar dados específicos da página
  loadPageData(pageName);
}

async function loadPageData(pageName) {
  switch (pageName) {
    case 'dashboard':
      updateDashboard();
      break;
    case 'tickets':
      await loadTickets();
      updateDashboard();
      break;
    case 'catalog':
      await loadCatalog();
      break;
    case 'knowledge':
      await loadKnowledge();
      break;
    case 'notifications':
      await loadNotifications();
      break;
    case 'info':
      await loadSystemInfo();
      break;
  }
}

// ============================================
// DADOS DO USUÁRIO
// ============================================
async function loadUserData() {
  try {
    const config = await window.electronAPI.getConfig();
    const status = await window.electronAPI.getStatus();
    
    // Atualizar informações do usuário
    if (state.user && state.user.name && state.user.name.trim()) {
      const nameParts = state.user.name.trim().split(' ').filter(part => part.length > 0);
      const initials = nameParts.map(n => n[0]).join('').toUpperCase().substring(0, 2);
      document.getElementById('userAvatar').textContent = initials;
      document.getElementById('userName').textContent = state.user.name;
      document.getElementById('userRole').textContent = getRoleLabel(state.user.role);
    }
    
    // Atualizar status de conexão
    updateConnectionStatus(status.connected);
    
    // Carregar dashboard
    await loadDashboard();
    
    // Inicializar notificações de acesso remoto
    initRemoteAccessNotifications(config.token);
    
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
  }
}

function getRoleLabel(role) {
  const labels = {
    'cliente': 'Cliente',
    'cliente-org': 'Cliente',
    'agente': 'Agente',
    'admin-org': 'Administrador',
    'super-admin': 'Super Admin'
  };
  return labels[role] || 'Usuário';
}

function updateConnectionStatus(connected) {
  const statusText = document.getElementById('connectionStatus');
  const statusDot = document.querySelector('.status-dot');
  
  if (!statusText || !statusDot) return; // Elementos não existem
  
  if (connected) {
    statusText.textContent = 'Conectado';
    statusDot.classList.add('status-success');
  } else {
    statusText.textContent = 'Desconectado';
    statusDot.classList.remove('status-success');
  }
}

// ============================================
// SCAN AUTOMÁTICO
// ============================================
async function performAutoScan() {
  console.log('🔄 Executando scan automático (silencioso)...');
  
  try {
    // Executar sync silenciosamente
    const result = await window.electronAPI.syncNow();
    
    if (result.success) {
      console.log('✅ Scan automático concluído');
      state.lastSync = new Date();
      
      // Atualizar UI silenciosamente
      updateDashboardStats();
      
      // Adicionar à activity list
      addActivity('Sistema sincronizado automaticamente', 'success');
    } else {
      console.warn('⚠️ Scan automático falhou:', result.error);
    }
  } catch (error) {
    console.error('❌ Erro no scan automático:', error);
  }
}

async function handleManualScan() {
  const btn = document.getElementById('refreshInfoBtn');
  btn.disabled = true;
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0115.5-8.5l4 4M22 12.5a10 10 0 01-15.5 8.5l-4-4" stroke="currentColor" stroke-width="2"/></svg>Atualizando...';
  
  showLoading('Coletando informações do sistema...');
  
  try {
    const result = await window.electronAPI.syncNow();
    
    if (result.success) {
      state.lastSync = new Date();
      await loadSystemInfo();
      addActivity('Informações atualizadas manualmente', 'success');
      showNotification('Informações atualizadas com sucesso!', 'success');
    } else {
      showNotification('Erro ao atualizar informações', 'error');
    }
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    showNotification('Erro ao atualizar informações', 'error');
  } finally {
    hideLoading();
    btn.disabled = false;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0115.5-8.5l4 4M22 12.5a10 10 0 01-15.5 8.5l-4-4" stroke="currentColor" stroke-width="2"/></svg>Atualizar Informações';
  }
}

function updateLastSync() {
  const lastSyncEl = document.getElementById('statLastSync');
  if (!lastSyncEl) return;
  
  if (state.lastSync) {
    const now = new Date();
    const diff = now - state.lastSync;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) {
      lastSyncEl.textContent = 'Agora mesmo';
    } else if (minutes < 60) {
      lastSyncEl.textContent = `Há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(minutes / 60);
      lastSyncEl.textContent = `Há ${hours} hora${hours > 1 ? 's' : ''}`;
    }
  } else {
    lastSyncEl.textContent = 'Nunca';
  }
}

function setupAutoSync() {
  // Limpar timer existente se houver
  if (state.syncTimer) {
    clearInterval(state.syncTimer);
  }
  
  // Sync automático a cada 1 hora
  state.syncTimer = setInterval(async () => {
    await performAutoScan();
    await loadTickets();
    state.lastSync = new Date();
    updateLastSync();
  }, 60 * 60 * 1000);
  
  // Sync inicial
  state.lastSync = new Date();
  performAutoScan();
  updateLastSync();
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboard() {
  try {
    const systemInfo = await window.electronAPI.getSystemInfo();
    const status = await window.electronAPI.getStatus();
    
    // Atualizar stats
    if (systemInfo) {
      const statSystem = document.getElementById('statSystem');
      if (statSystem) statSystem.textContent = `${systemInfo.os} ${systemInfo.osVersion}`;
      
      const infoHostname = document.getElementById('infoHostname');
      if (infoHostname) infoHostname.textContent = systemInfo.hostname || '-';
      
      const infoOS = document.getElementById('infoOS');
      if (infoOS) infoOS.textContent = `${systemInfo.os} ${systemInfo.osVersion}` || '-';
      
      const infoCPU = document.getElementById('infoCPU');
      if (infoCPU) infoCPU.textContent = systemInfo.processor || '-';
      
      const infoRAM = document.getElementById('infoRAM');
      if (infoRAM) infoRAM.textContent = systemInfo.ram || '-';
    }
    
    // Última sincronização
    if (status.lastSync) {
      const lastSync = new Date(status.lastSync);
      const statLastSync = document.getElementById('statLastSync');
      if (statLastSync) statLastSync.textContent = formatRelativeTime(lastSync);
    }
    
    // Status
    const statStatus = document.getElementById('statStatus');
    if (statStatus) statStatus.textContent = status.connected ? 'Ativo' : 'Inativo';
    
    // Carregar tickets para atualizar estatísticas
    const { success, tickets } = await window.electronAPI.fetchTickets({});
    if (success && tickets) {
      state.tickets = tickets;
      document.getElementById('statTickets').textContent = tickets.length.toString();
      
      // Atualizar badge no menu
      const badge = document.querySelector('[data-page="tickets"] .badge');
      if (badge && tickets.length > 0) {
        badge.textContent = tickets.length.toString();
        badge.style.display = 'flex';
      }
    } else {
      document.getElementById('statTickets').textContent = '0';
    }
    
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
  }
}

function updateDashboardStats() {
  // Atualizar stats após sync
  loadDashboard();
}

// ============================================
// INFORMAÇÕES DO SISTEMA
// ============================================
async function loadSystemInfo() {
  try {
    const systemInfo = await window.electronAPI.getSystemInfo();
    
    if (!systemInfo) {
      document.getElementById('hardwareInfo').innerHTML = '<p>Nenhuma informação disponível</p>';
      document.getElementById('systemInfo').innerHTML = '<p>Nenhuma informação disponível</p>';
      return;
    }
    
    state.systemInfo = systemInfo;
    
    // Hardware Detalhado
    const hardwareHTML = `
      <div class="info-section">
        <h4 class="section-subtitle">Processador</h4>
        <div class="info-list">
          <div class="info-item">
            <span class="info-label">Modelo</span>
            <span class="info-value">${systemInfo.processor || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Núcleos</span>
            <span class="info-value">${systemInfo.processorCores || '-'} cores (${systemInfo.processorPhysicalCores || '-'} físicos)</span>
          </div>
          <div class="info-item">
            <span class="info-label">Velocidade</span>
            <span class="info-value">${systemInfo.processorSpeed ? systemInfo.processorSpeed + ' GHz' : '-'}</span>
          </div>
        </div>
      </div>
      
      <div class="info-section">
        <h4 class="section-subtitle">Memória</h4>
        <div class="info-list">
          <div class="info-item">
            <span class="info-label">RAM Total</span>
            <span class="info-value">${systemInfo.ram || '-'}</span>
          </div>
        </div>
      </div>
      
      <div class="info-section">
        <h4 class="section-subtitle">Armazenamento</h4>
        <div class="info-list">
          <div class="info-item">
            <span class="info-label">Total</span>
            <span class="info-value">${systemInfo.storage || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Tipo</span>
            <span class="info-value">${systemInfo.storageType || '-'}</span>
          </div>
          ${systemInfo.disks && systemInfo.disks.length > 0 ? `
            ${systemInfo.disks.map((disk, i) => `
              <div class="info-item">
                <span class="info-label">Disco ${i + 1}</span>
                <span class="info-value">${disk.vendor || ''} ${disk.name || ''} (${disk.size}GB - ${disk.type})</span>
              </div>
            `).join('')}
          ` : ''}
        </div>
      </div>
      
      <div class="info-section">
        <h4 class="section-subtitle">Gráficos</h4>
        <div class="info-list">
          <div class="info-item">
            <span class="info-label">Placa Gráfica</span>
            <span class="info-value">${systemInfo.graphicsCard || '-'}</span>
          </div>
          ${systemInfo.graphics && systemInfo.graphics.length > 0 ? systemInfo.graphics.map(gpu => `
            <div class="info-item">
              <span class="info-label">${gpu.vendor}</span>
              <span class="info-value">${gpu.model} ${gpu.vram ? '(' + gpu.vram + 'MB)' : ''}</span>
            </div>
          `).join('') : ''}
        </div>
      </div>
      
      ${systemInfo.battery ? `
        <div class="info-section">
          <h4 class="section-subtitle">Bateria</h4>
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">Estado</span>
              <span class="info-value">${systemInfo.battery.isCharging ? 'Carregando' : 'Descarregando'} (${systemInfo.battery.percent}%)</span>
            </div>
            <div class="info-item">
              <span class="info-label">Fabricante</span>
              <span class="info-value">${systemInfo.battery.manufacturer || '-'}</span>
            </div>
          </div>
        </div>
      ` : ''}
    `;
    
    // Sistema Operacional e Rede
    const systemHTML = `
      <div class="info-section">
        <h4 class="section-subtitle">Sistema Operacional</h4>
        <div class="info-list">
          <div class="info-item">
            <span class="info-label">SO</span>
            <span class="info-value">${systemInfo.os || '-'} ${systemInfo.osVersion || ''}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Build</span>
            <span class="info-value">${systemInfo.osBuild || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Arquitetura</span>
            <span class="info-value">${systemInfo.osArchitecture || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Kernel</span>
            <span class="info-value">${systemInfo.osKernel || '-'}</span>
          </div>
        </div>
      </div>
      
      <div class="info-section">
        <h4 class="section-subtitle">Identificação</h4>
        <div class="info-list">
          <div class="info-item">
            <span class="info-label">Hostname</span>
            <span class="info-value">${systemInfo.hostname || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Fabricante</span>
            <span class="info-value">${systemInfo.manufacturer || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Modelo</span>
            <span class="info-value">${systemInfo.model || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Número de Série</span>
            <span class="info-value">${systemInfo.serialNumber || '-'}</span>
          </div>
        </div>
      </div>
      
      <div class="info-section">
        <h4 class="section-subtitle">Rede</h4>
        <div class="info-list">
          <div class="info-item">
            <span class="info-label">Endereço IP</span>
            <span class="info-value">${systemInfo.ipAddress || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">MAC Address</span>
            <span class="info-value">${systemInfo.macAddress || '-'}</span>
          </div>
          ${systemInfo.domain ? `
            <div class="info-item">
              <span class="info-label">Domínio</span>
              <span class="info-value">${systemInfo.domain}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    document.getElementById('hardwareInfo').innerHTML = hardwareHTML;
    document.getElementById('systemInfo').innerHTML = systemHTML;
    
    // Adicionar seções de Software e Segurança se existirem
    renderSoftwareInfo(systemInfo);
    renderSecurityInfo(systemInfo);
    
  } catch (error) {
    console.error('Erro ao carregar informações:', error);
  }
}

function renderSoftwareInfo(systemInfo) {
  const softwareContainer = document.getElementById('softwareInfo');
  if (!softwareContainer) return;
  
  if (!systemInfo.software || systemInfo.software.length === 0) {
    softwareContainer.innerHTML = '<p class="text-muted">Nenhum software detectado</p>';
    return;
  }
  
  const softwareHTML = `
    <div class="info-section">
      <h4 class="section-subtitle">Software Instalado (${systemInfo.software.length} itens)</h4>
      <div class="software-list">
        ${systemInfo.software.map(sw => `
          <div class="software-item">
            <div class="software-name">${escapeHTML(sw.name)}</div>
            <div class="software-details">
              <span class="software-version">${escapeHTML(sw.version || 'N/A')}</span>
              ${sw.publisher ? `<span class="software-publisher">${escapeHTML(sw.publisher)}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  softwareContainer.innerHTML = softwareHTML;
}

function renderSecurityInfo(systemInfo) {
  const securityContainer = document.getElementById('securityInfo');
  if (!securityContainer) return;
  
  if (!systemInfo.security) {
    securityContainer.innerHTML = '<p class="text-muted">Informações de segurança não disponíveis</p>';
    return;
  }
  
  const sec = systemInfo.security;
  const securityLevelColors = {
    'high': 'success',
    'medium': 'warning',
    'low': 'danger',
    'critical': 'danger',
    'unknown': 'secondary'
  };
  const levelColor = securityLevelColors[sec.securityLevel] || 'secondary';
  const levelText = {
    'high': 'Alto',
    'medium': 'Médio',
    'low': 'Baixo',
    'critical': 'Crítico',
    'unknown': 'Desconhecido'
  };
  
  const securityHTML = `
    <div class="info-section">
      <h4 class="section-subtitle">Nível de Segurança</h4>
      <div class="security-level security-level-${levelColor}">
        <span class="security-level-badge">${levelText[sec.securityLevel] || 'Desconhecido'}</span>
      </div>
    </div>
    
    <div class="info-section">
      <h4 class="section-subtitle">Proteção Antivírus</h4>
      <div class="info-list">
        <div class="info-item">
          <span class="info-label">Antivírus</span>
          <span class="info-value ${sec.hasAntivirus ? 'text-success' : 'text-danger'}">
            ${sec.hasAntivirus ? '✓ Ativo' : '✗ Inativo'}
          </span>
        </div>
        ${sec.antivirusName ? `
          <div class="info-item">
            <span class="info-label">Nome</span>
            <span class="info-value">${sec.antivirusName}</span>
          </div>
        ` : ''}
        ${sec.antivirusVersion ? `
          <div class="info-item">
            <span class="info-label">Versão</span>
            <span class="info-value">${sec.antivirusVersion}</span>
          </div>
        ` : ''}
        ${sec.antivirusUpdated ? `
          <div class="info-item">
            <span class="info-label">Última Atualização</span>
            <span class="info-value">${new Date(sec.antivirusUpdated).toLocaleDateString('pt-PT')}</span>
          </div>
        ` : ''}
      </div>
    </div>
    
    <div class="info-section">
      <h4 class="section-subtitle">Firewall e Criptografia</h4>
      <div class="info-list">
        <div class="info-item">
          <span class="info-label">Firewall</span>
          <span class="info-value ${sec.hasFirewall ? 'text-success' : 'text-danger'}">
            ${sec.hasFirewall ? '✓ Ativo' : '✗ Inativo'}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">Criptografia de Disco</span>
          <span class="info-value ${sec.isEncrypted ? 'text-success' : 'text-warning'}">
            ${sec.isEncrypted ? '✓ Ativo (' + sec.encryptionMethod + ')' : '✗ Inativo'}
          </span>
        </div>
        ${sec.tpmEnabled !== undefined ? `
          <div class="info-item">
            <span class="info-label">TPM</span>
            <span class="info-value ${sec.tpmEnabled ? 'text-success' : 'text-warning'}">
              ${sec.tpmEnabled ? '✓ Habilitado' : '✗ Desabilitado'}
            </span>
          </div>
        ` : ''}
        ${sec.secureBootEnabled !== undefined ? `
          <div class="info-item">
            <span class="info-label">Secure Boot</span>
            <span class="info-value ${sec.secureBootEnabled ? 'text-success' : 'text-warning'}">
              ${sec.secureBootEnabled ? '✓ Habilitado' : '✗ Desabilitado'}
            </span>
          </div>
        ` : ''}
        ${sec.pendingUpdates !== undefined ? `
          <div class="info-item">
            <span class="info-label">Atualizações Pendentes</span>
            <span class="info-value ${sec.pendingUpdates === 0 ? 'text-success' : 'text-warning'}">
              ${sec.pendingUpdates === 0 ? '✓ Sistema atualizado' : sec.pendingUpdates + ' atualização(ões) pendente(s)'}
            </span>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  
  securityContainer.innerHTML = securityHTML;
}

// ============================================
// DASHBOARD E GRÁFICOS
// ============================================

// Variáveis globais para gráficos
let statusChart = null;
let priorityChart = null;
let trendChart = null;

// Atualizar dashboard com gráficos e estatísticas
async function updateDashboard() {
  const stats = calculateStatistics();
  
  // Atualizar cards de estatísticas básicas
  const statTotal = document.getElementById('statTotal');
  if (statTotal) statTotal.textContent = stats.total;
  
  const statOpen = document.getElementById('statOpen');
  if (statOpen) statOpen.textContent = stats.open;
  
  const statHighPriority = document.getElementById('statHighPriority');
  if (statHighPriority) statHighPriority.textContent = stats.highPriority;
  
  const statResolved = document.getElementById('statResolved');
  if (statResolved) statResolved.textContent = stats.resolved;
  
  // Buscar estatísticas detalhadas do backend
  try {
    const result = await window.electronAPI.getTicketStatistics();
    if (result.success && result.statistics) {
      updateAdvancedStatistics(result.statistics);
    }
  } catch (error) {
    console.warn('Erro ao carregar estatísticas detalhadas:', error);
  }
  
  // Atualizar indicadores de SLA
  const slaNormal = document.getElementById('slaNormal');
  if (slaNormal) slaNormal.textContent = stats.slaNormal;
  
  const slaWarning = document.getElementById('slaWarning');
  if (slaWarning) slaWarning.textContent = stats.slaWarning;
  
  const slaExpired = document.getElementById('slaExpired');
  if (slaExpired) slaExpired.textContent = stats.slaExpired;
  
  // Atualizar taxa de resolução
  const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
  const resolutionRateBar = document.getElementById('resolutionRate');
  if (resolutionRateBar) resolutionRateBar.style.width = `${resolutionRate}%`;
  
  const resolutionRateText = document.getElementById('resolutionRateText');
  if (resolutionRateText) resolutionRateText.textContent = `${resolutionRate}%`;
  
  // Criar gráficos apenas se Chart.js estiver disponível
  if (typeof Chart === 'undefined') return;
  
  // Criar/Atualizar gráfico de status
  const statusCtx = document.getElementById('statusChart');
  if (statusCtx) {
    if (statusChart) statusChart.destroy();
    
    statusChart = new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: ['Aberto', 'Em Progresso', 'Pendente', 'Resolvido', 'Fechado'],
        datasets: [{
          data: [stats.open, stats.inProgress, stats.pending, stats.resolved, stats.closed],
          backgroundColor: ['#667eea', '#3b82f6', '#f59e0b', '#10b981', '#6b7280'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 15, font: { size: 12 } }
          }
        }
      }
    });
  }
  
  // Criar/Atualizar gráfico de prioridades
  const priorityCtx = document.getElementById('priorityChart');
  if (priorityCtx) {
    if (priorityChart) priorityChart.destroy();
    
    priorityChart = new Chart(priorityCtx, {
      type: 'bar',
      data: {
        labels: ['Crítica', 'Alta', 'Média', 'Baixa'],
        datasets: [{
          label: 'Tickets',
          data: [stats.critical, stats.high, stats.normal, stats.low],
          backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#6b7280']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
  
  // Criar/Atualizar gráfico de tendência
  const trendCtx = document.getElementById('trendChart');
  if (trendCtx) {
    if (trendChart) trendChart.destroy();
    
    const trendData = calculateTrendData();
    
    trendChart = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: trendData.labels,
        datasets: [{
          label: 'Novos',
          data: trendData.created,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4
        }, {
          label: 'Resolvidos',
          data: trendData.resolved,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 15, font: { size: 12 } }
          }
        }
      }
    });
  }
}

// Calcular estatísticas dos tickets
function calculateStatistics() {
  const tickets = state.tickets;
  const stats = {
    total: tickets.length,
    open: 0,
    inProgress: 0,
    pending: 0,
    resolved: 0,
    closed: 0,
    critical: 0,
    high: 0,
    normal: 0,
    low: 0,
    highPriority: 0,
    slaNormal: 0,
    slaWarning: 0,
    slaExpired: 0
  };
  
  tickets.forEach(ticket => {
    // Status
    switch(ticket.status) {
      case 'open':
      case 'novo':
        stats.open++;
        break;
      case 'in_progress':
        stats.inProgress++;
        break;
      case 'pending':
        stats.pending++;
        break;
      case 'resolved':
        stats.resolved++;
        break;
      case 'closed':
        stats.closed++;
        break;
    }
    
    // Prioridade
    switch(ticket.priority) {
      case 'critical':
        stats.critical++;
        stats.highPriority++;
        break;
      case 'high':
      case 'alta':
        stats.high++;
        stats.highPriority++;
        break;
      case 'normal':
      case 'media':
        stats.normal++;
        break;
      case 'low':
      case 'baixa':
        stats.low++;
        break;
    }
    
    // SLA
    const slaInfo = calculateSLARemaining(ticket);
    if (slaInfo) {
      if (slaInfo.expired) {
        stats.slaExpired++;
      } else if (slaInfo.status === 'warning' || slaInfo.status === 'critical') {
        stats.slaWarning++;
      } else {
        stats.slaNormal++;
      }
    }
  });
  
  return stats;
}

// Calcular dados de tendência dos últimos 7 dias
function calculateTrendData() {
  const labels = [];
  const created = [];
  const resolved = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    labels.push(date.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric' }));
    
    // Contar tickets criados nesse dia
    const createdCount = state.tickets.filter(t => {
      const createdAt = new Date(t.createdAt);
      return createdAt >= date && createdAt < nextDate;
    }).length;
    created.push(createdCount);
    
    // Contar tickets resolvidos nesse dia
    const resolvedCount = state.tickets.filter(t => {
      if (!t.resolvedAt) return false;
      const resolvedAt = new Date(t.resolvedAt);
      return resolvedAt >= date && resolvedAt < nextDate;
    }).length;
    resolved.push(resolvedCount);
  }
  
  return { labels, created, resolved };
}

// Atualizar estatísticas avançadas do backend
function updateAdvancedStatistics(statistics) {
  console.log('📊 Atualizando estatísticas avançadas:', statistics);
  
  // Tempo médio de resposta
  if (statistics.averageResponseTime !== undefined) {
    const avgResponseEl = document.getElementById('avgResponseTime');
    if (avgResponseEl) {
      avgResponseEl.textContent = formatDuration(statistics.averageResponseTime);
    }
  }
  
  // Tempo médio de resolução
  if (statistics.averageResolutionTime !== undefined) {
    const avgResolutionEl = document.getElementById('avgResolutionTime');
    if (avgResolutionEl) {
      avgResolutionEl.textContent = formatDuration(statistics.averageResolutionTime);
    }
  }
  
  // Taxa de resolução no prazo (SLA)
  if (statistics.slaComplianceRate !== undefined) {
    const slaRateEl = document.getElementById('slaComplianceRate');
    if (slaRateEl) {
      const rate = Math.round(statistics.slaComplianceRate);
      slaRateEl.textContent = `${rate}%`;
      
      // Atualizar cor baseado na taxa
      const color = rate >= 90 ? '#10b981' : rate >= 70 ? '#f59e0b' : '#ef4444';
      slaRateEl.style.color = color;
    }
  }
  
  // Tickets por categoria (se disponível)
  if (statistics.byCategory && typeof Chart !== 'undefined') {
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
      const categories = Object.keys(statistics.byCategory);
      const counts = Object.values(statistics.byCategory);
      
      if (window.categoryChart) window.categoryChart.destroy();
      
      window.categoryChart = new Chart(categoryCtx, {
        type: 'pie',
        data: {
          labels: categories,
          datasets: [{
            data: counts,
            backgroundColor: [
              '#667eea', '#3b82f6', '#10b981', '#f59e0b', 
              '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { padding: 10, font: { size: 11 } }
            }
          }
        }
      });
    }
  }
  
  // Tickets por agente (se disponível)
  if (statistics.byAgent && typeof Chart !== 'undefined') {
    const agentCtx = document.getElementById('agentChart');
    if (agentCtx) {
      const agents = Object.keys(statistics.byAgent).slice(0, 10); // Top 10
      const counts = Object.values(statistics.byAgent).slice(0, 10);
      
      if (window.agentChart) window.agentChart.destroy();
      
      window.agentChart = new Chart(agentCtx, {
        type: 'horizontalBar',
        data: {
          labels: agents,
          datasets: [{
            label: 'Tickets',
            data: counts,
            backgroundColor: '#667eea'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              beginAtZero: true,
              ticks: { stepSize: 1 }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }
  
  // Tendência de 30 dias (se disponível)
  if (statistics.trend30Days && typeof Chart !== 'undefined') {
    const trendCtx = document.getElementById('trend30DaysChart');
    if (trendCtx) {
      const labels = statistics.trend30Days.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
      });
      const created = statistics.trend30Days.map(d => d.created || 0);
      const resolved = statistics.trend30Days.map(d => d.resolved || 0);
      
      if (window.trend30DaysChart) window.trend30DaysChart.destroy();
      
      window.trend30DaysChart = new Chart(trendCtx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Criados',
            data: created,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4
          }, {
            label: 'Resolvidos',
            data: resolved,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 }
            }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { padding: 15, font: { size: 12 } }
            }
          }
        }
      });
    }
  }
}

// Formatar duração em formato legível
function formatDuration(minutes) {
  if (!minutes || minutes === 0) return '-';
  
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  } else {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
}

// ============================================
// TICKETS
// ============================================
async function loadTickets() {
  try {
    showLoading('Carregando seus tickets...');
    const { success, tickets, error } = await window.electronAPI.fetchTickets({});
    if (!success) {
      console.error('Erro ao buscar tickets:', error);
      document.getElementById('ticketsList').innerHTML = `
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="2"/>
          </svg>
          <p>Falha ao carregar tickets</p>
        </div>
      `;
      hideLoading();
      return;
    }

    state.tickets = tickets || [];
    console.log('📋 Tickets carregados:', state.tickets.length);
    console.log('🔍 Primeiro ticket com SLA:', state.tickets.find(t => t.sla));
    
    // Carregar tipos e categorias para os filtros
    await loadFilterOptions();
    
    renderTicketsList();
    document.getElementById('statTickets').textContent = state.tickets.length.toString();
    updateDashboard();
  } catch (error) {
    console.error('Erro ao carregar tickets:', error);
  } finally {
    hideLoading();
  }
}

async function loadFilterOptions() {
  try {
    // Carregar tipos
    const typesResult = await window.electronAPI.getTypes();
    if (typesResult.success) {
      const types = typesResult.types?.types || typesResult.types || [];
      const typeSelect = document.getElementById('filterType');
      if (typeSelect && Array.isArray(types)) {
        typeSelect.innerHTML = '<option value="">Todos os Tipos</option>';
        types.forEach(type => {
          const option = document.createElement('option');
          option.value = type.id;
          option.textContent = type.name;
          typeSelect.appendChild(option);
        });
      }
    }
    
    // Carregar categorias
    const categoriesResult = await window.electronAPI.getCategories();
    if (categoriesResult.success) {
      const categories = categoriesResult.categories?.categories || categoriesResult.categories || [];
      const categorySelect = document.getElementById('filterCategory');
      if (categorySelect && Array.isArray(categories)) {
        categorySelect.innerHTML = '<option value="">Todas as Categorias</option>';
        categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category.id;
          option.textContent = category.name;
          categorySelect.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.warn('Erro ao carregar opções de filtro:', error);
  }
}

async function handleNewTicket() {
  showNewTicketForm();
}

// Configurar filtros de tickets
function setupTicketFilters() {
  // Busca em tempo real com debounce
  const searchInput = document.getElementById('ticketSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.filters.search = e.target.value;
      // Aplicar filtro com debounce de 300ms
      clearTimeout(state.searchTimeout);
      state.searchTimeout = setTimeout(() => {
        applyFilters();
      }, 300);
    });
  }
  
  // Toggle filtros avançados
  const toggleAdvancedBtn = document.getElementById('toggleAdvancedFiltersBtn');
  const advancedFilters = document.getElementById('advancedFilters');
  if (toggleAdvancedBtn && advancedFilters) {
    toggleAdvancedBtn.addEventListener('click', () => {
      const isVisible = advancedFilters.style.display !== 'none';
      advancedFilters.style.display = isVisible ? 'none' : 'block';
      toggleAdvancedBtn.innerHTML = isVisible 
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="margin-right: 0.25rem;"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" stroke="currentColor" stroke-width="2"/></svg>Mais Filtros'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="margin-right: 0.25rem;"><path d="M18 12H6" stroke="currentColor" stroke-width="2"/></svg>Menos Filtros';
    });
  }
  
  // Filtro de status
  const statusFilter = document.getElementById('filterStatus');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      state.filters.status = e.target.value;
      applyFilters();
    });
  }
  
  // Filtro de prioridade
  const priorityFilter = document.getElementById('filterPriority');
  if (priorityFilter) {
    priorityFilter.addEventListener('change', (e) => {
      state.filters.priority = e.target.value;
      applyFilters();
    });
  }
  
  // Botão aplicar filtros
  const applyBtn = document.getElementById('applyFiltersBtn');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      applyFilters();
    });
  }
  
  // Dropdown de ordenação
  const sortDropdown = document.getElementById('sortBy');
  if (sortDropdown) {
    sortDropdown.addEventListener('change', (e) => {
      state.filters.sortBy = e.target.value;
      applyFilters();
    });
  }
  
  // Botão limpar filtros
  const clearBtn = document.getElementById('clearFiltersBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      // Limpar todos os filtros
      state.filters = { search: '', status: '', priority: '', sortBy: 'createdAt-desc' };
      state.filteredTickets = [];
      
      // Limpar inputs
      if (searchInput) searchInput.value = '';
      if (statusFilter) statusFilter.value = '';
      if (priorityFilter) priorityFilter.value = '';
      if (sortDropdown) sortDropdown.value = 'createdAt-desc';
      
      // Ocultar contador
      const filterResults = document.getElementById('filterResults');
      if (filterResults) filterResults.style.display = 'none';
      
      // Re-renderizar
      renderTicketsList();
    });
  }
}

// Marcar ticket como lido
async function markTicketAsRead(ticketId) {
  try {
    const result = await window.electronAPI.markAsRead(ticketId);
    
    if (result.success) {
      // Atualizar contador local
      const ticketIndex = state.tickets.findIndex(t => t.id === ticketId);
      if (ticketIndex !== -1) {
        state.tickets[ticketIndex].unreadCount = 0;
      }
      
      // Atualizar badge se houver
      const badge = document.getElementById('ticketsBadge');
      if (badge) {
        const totalUnread = state.tickets.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
        if (totalUnread > 0) {
          badge.textContent = totalUnread.toString();
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }
      
      console.log('✅ Ticket marcado como lido');
    }
  } catch (error) {
    console.error('Erro ao marcar ticket como lido:', error);
  }
}

// Ordenar tickets
function sortTickets(tickets, sortBy) {
  const priorityOrder = { critical: 4, high: 3, normal: 2, media: 2, low: 1, none: 0 };
  const statusOrder = { novo: 0, open: 1, in_progress: 2, pending: 3, resolved: 4, closed: 5 };
  
  return [...tickets].sort((a, b) => {
    switch(sortBy) {
      case 'createdAt-desc':
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      
      case 'createdAt-asc':
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      
      case 'priority-desc':
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      
      case 'priority-asc':
        return (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
      
      case 'status-asc':
        return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
      
      case 'sla-urgent':
        // Ordenar por tempo restante de SLA (urgentes primeiro)
        const slaA = calculateSLARemaining(a);
        const slaB = calculateSLARemaining(b);
        
        if (!slaA && !slaB) return 0;
        if (!slaA) return 1;
        if (!slaB) return -1;
        
        // Expirados primeiro
        if (slaA.expired && !slaB.expired) return -1;
        if (!slaA.expired && slaB.expired) return 1;
        
        // Menor tempo restante primeiro
        return slaA.remaining - slaB.remaining;
      
      case 'unread':
        // Não lidas primeiro
        const unreadA = a.unreadCount || 0;
        const unreadB = b.unreadCount || 0;
        if (unreadB !== unreadA) {
          return unreadB - unreadA;
        }
        // Se igual, ordenar por data
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      
      default:
        return 0;
    }
  });
}

// Aplicar filtros aos tickets
function applyFilters() {
  const { search, status, priority, sortBy } = state.filters;
  
  // Obter filtros avançados
  const dateFilter = document.getElementById('filterDate')?.value || '';
  const slaFilter = document.getElementById('filterSLA')?.value || '';
  const typeFilter = document.getElementById('filterType')?.value || '';
  const categoryFilter = document.getElementById('filterCategory')?.value || '';
  
  let filtered = [...state.tickets];
  
  // Filtro de busca
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(t => 
      (t.subject && t.subject.toLowerCase().includes(searchLower)) ||
      (t.description && t.description.toLowerCase().includes(searchLower)) ||
      (t.clientName && t.clientName.toLowerCase().includes(searchLower)) ||
      (t.id && t.id.toLowerCase().includes(searchLower))
    );
  }
  
  // Filtro de status
  if (status) {
    filtered = filtered.filter(t => t.status === status);
  }
  
  // Filtro de prioridade
  if (priority) {
    filtered = filtered.filter(t => t.priority === priority);
  }
  
  // Filtro de data
  if (dateFilter) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    filtered = filtered.filter(t => {
      const createdAt = new Date(t.createdAt);
      
      switch(dateFilter) {
        case 'today':
          return createdAt >= today;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return createdAt >= yesterday && createdAt < today;
        case 'this-week':
          const weekStart = new Date(today);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          return createdAt >= weekStart;
        case 'last-week':
          const lastWeekStart = new Date(today);
          lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 7);
          const lastWeekEnd = new Date(lastWeekStart);
          lastWeekEnd.setDate(lastWeekEnd.getDate() + 7);
          return createdAt >= lastWeekStart && createdAt < lastWeekEnd;
        case 'this-month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          return createdAt >= monthStart;
        case 'last-month':
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
          return createdAt >= lastMonthStart && createdAt < lastMonthEnd;
        default:
          return true;
      }
    });
  }
  
  // Filtro de SLA
  if (slaFilter) {
    filtered = filtered.filter(t => {
      const slaInfo = calculateSLARemaining(t);
      if (!slaInfo) return false;
      
      switch(slaFilter) {
        case 'expired':
          return slaInfo.expired;
        case 'critical':
          return !slaInfo.expired && slaInfo.status === 'critical';
        case 'warning':
          return !slaInfo.expired && slaInfo.status === 'warning';
        case 'ok':
          return !slaInfo.expired && slaInfo.status === 'ok';
        default:
          return true;
      }
    });
  }
  
  // Filtro de tipo
  if (typeFilter) {
    filtered = filtered.filter(t => t.typeId === typeFilter || t.type === typeFilter);
  }
  
  // Filtro de categoria
  if (categoryFilter) {
    filtered = filtered.filter(t => t.categoryId === categoryFilter || t.category === categoryFilter);
  }
  
  // Aplicar ordenação
  filtered = sortTickets(filtered, sortBy);
  
  state.filteredTickets = filtered;
  
  // Atualizar contador
  const filterResults = document.getElementById('filterResults');
  if (filterResults) {
    const hasFilters = search || status || priority || dateFilter || slaFilter || typeFilter || categoryFilter;
    if (hasFilters) {
      filterResults.style.display = 'block';
      document.getElementById('filteredCount').textContent = filtered.length;
      document.getElementById('totalCount').textContent = state.tickets.length;
    } else {
      filterResults.style.display = 'none';
    }
  }
  
  renderTicketsList();
}

// Renderização da lista de tickets
function renderTicketsList() {
  console.log('🎨 renderTicketsList chamada - Versão atualizada com cliques');
  
  const container = document.getElementById('ticketsList');
  
  if (!container) {
    console.warn('⚠️ Container ticketsList não encontrado no DOM');
    return;
  }
  
  // Verificar se há filtros ativos (excluindo sortBy que não é realmente um filtro)
  const hasActiveFilters = state.filters.search || 
                          (state.filters.status && state.filters.status !== 'all' && state.filters.status !== '') ||
                          (state.filters.priority && state.filters.priority !== 'all' && state.filters.priority !== '');
  
  // Se há filtros ativos, usar filteredTickets, senão usar todos os tickets
  const ticketsToRender = hasActiveFilters ? state.filteredTickets : state.tickets;
  
  console.log('📊 Filtros ativos:', hasActiveFilters);
  console.log('📊 state.tickets:', state.tickets.length);
  console.log('📊 state.filteredTickets:', state.filteredTickets.length);
  console.log('📊 Tickets a renderizar:', ticketsToRender.length);
    
  if (!ticketsToRender || ticketsToRender.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="2"/>
        </svg>
        <p>Nenhum ticket encontrado</p>
      </div>
    `;
    return;
  }

  const rows = ticketsToRender.map((t) => {
    const created = t.createdAt ? formatRelativeTime(new Date(t.createdAt)) : '-';
    const status = (t.status || 'open');
    const priority = (t.priority || 'normal');
    const unread = t.unreadCount || 0;
    
    // Tradução dos status
    const statusLabels = {
      'novo': 'Novo',
      'open': 'Aberto',
      'in_progress': 'Em Progresso',
      'pending': 'Pendente',
      'resolved': 'Resolvido',
      'closed': 'Fechado'
    };
    
    // Tradução das prioridades
    const priorityLabels = {
      'none': 'Sem prioridade',
      'low': 'Baixa',
      'normal': 'Média',
      'media': 'Média',
      'alta': 'Alta',
      'high': 'Alta',
      'critical': 'Crítica'
    };
    
    // Criar indicador de SLA compacto
    let slaIndicatorHTML = '';
    const slaInfo = calculateSLARemaining(t);
    if (slaInfo) {
      const icon = slaInfo.expired ? '⚠️' : 
                   slaInfo.status === 'critical' ? '🔴' :
                   slaInfo.status === 'warning' ? '🟡' : '🟢';
      
      slaIndicatorHTML = `
        <span class="sla-indicator" style="
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: ${slaInfo.color}15;
          border: 1px solid ${slaInfo.color};
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: ${slaInfo.color};
        ">
          <span>${icon}</span>
          <span>${escapeHTML(slaInfo.message)}</span>
        </span>
      `;
    }
    
    return `
      <div class="ticket-item" data-ticket-id="${t.id}" style="cursor: pointer;">
        <div class="ticket-header">
          <div class="ticket-title">${escapeHTML(t.subject || 'Sem título')}</div>
          ${slaIndicatorHTML}
        </div>
        <div class="ticket-meta">
          <span class="badge badge-status status-${status}">${statusLabels[status] || status}</span>
          <span class="badge badge-priority priority-${priority}">${priorityLabels[priority] || priority}</span>
          <span class="meta">Criado: ${created}</span>
          ${unread > 0 ? `<span class="badge badge-unread">${unread} não lida(s)</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="ticket-list">${rows}</div>`;
  
  // Adicionar event listeners para cada ticket
  const ticketItems = container.querySelectorAll('.ticket-item');
  console.log(`📋 Adicionando listeners a ${ticketItems.length} tickets`);
  
  ticketItems.forEach((item, index) => {
    const ticketId = item.dataset.ticketId;
    console.log(`  - Ticket ${index}: ID = ${ticketId}`);
    
    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`🖱️ Clique no ticket ID: ${ticketId}`);
      showTicketDetails(ticketId);
    });
  });
}

// Fechar modal de ticket e limpar estado
function closeTicketModal(modal) {
  state.openTicketId = null;
  console.log('🔒 Ticket fechado, state.openTicketId limpo');
  if (modal && modal.remove) {
    modal.remove();
  }
}

// Mostrar detalhes de um ticket
async function showTicketDetails(ticketId) {
  console.log('🔍 showTicketDetails chamado com ID:', ticketId);
  console.log('📊 Total de tickets em state:', state.tickets.length);
  console.log('📝 IDs dos tickets:', state.tickets.map(t => ({ id: t.id, subject: t.subject })));
  
  const ticket = state.tickets.find(t => t.id == ticketId); // Usar == para comparar string com number
  
  if (!ticket) {
    console.error('❌ Ticket não encontrado! ID procurado:', ticketId);
    showNotification('Ticket não encontrado', 'error');
    return;
  }
  
  // Definir ticket aberto para atualizações em tempo real
  state.openTicketId = ticketId;
  console.log('📌 Ticket aberto definido:', state.openTicketId);
  
  console.log('✅ Ticket encontrado:', ticket.subject);
  console.log('📋 Dados completos do ticket:', ticket);
  
  // Marcar mensagens como lidas
  if (ticket.unreadCount && ticket.unreadCount > 0) {
    markTicketAsRead(ticketId);
  }
  
  try {
    console.log('🎨 Buscando mensagens do ticket...');
    
    // Buscar mensagens do ticket
    const messagesResult = await window.electronAPI.fetchTicketMessages(ticketId);
    
    if (messagesResult.success) {
      const allMessages = Array.isArray(messagesResult.messages) ? messagesResult.messages : [];
      
      // Filtrar mensagens internas - clientes não devem ver
      ticket.messages = allMessages.filter(msg => !msg.isInternal);
      
      console.log('✅ Mensagens carregadas:', ticket.messages.length, '(total:', allMessages.length, ')');
    } else {
      console.warn('⚠️ Não foi possível carregar mensagens:', messagesResult.error);
      ticket.messages = [];
    }
    
    // Buscar anexos do ticket
    const attachmentsResult = await window.electronAPI.fetchTicketAttachments(ticketId);
    
    if (attachmentsResult.success) {
      ticket.attachments = Array.isArray(attachmentsResult.attachments) ? attachmentsResult.attachments : [];
      console.log('✅ Anexos carregados:', ticket.attachments.length);
    } else {
      console.warn('⚠️ Não foi possível carregar anexos:', attachmentsResult.error);
      ticket.attachments = [];
    }
    
    console.log('🎨 Criando modal de detalhes...');
    
    // Tradução dos status
    const statusLabels = {
    'novo': 'Novo',
    'open': 'Aberto',
    'in_progress': 'Em Progresso',
    'pending': 'Pendente',
    'resolved': 'Resolvido',
    'closed': 'Fechado'
  };
  
  // Tradução das prioridades
  const priorityLabels = {
    'none': 'Sem prioridade',
    'low': 'Baixa',
    'normal': 'Média',
    'media': 'Média',
    'alta': 'Alta',
    'high': 'Alta',
    'critical': 'Crítica'
  };
  
  const created = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('pt-PT') : '-';
  const updated = ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString('pt-PT') : '-';
  const status = statusLabels[ticket.status] || ticket.status || 'Aberto';
  const priority = priorityLabels[ticket.priority] || ticket.priority || 'Média';
  
  // Extrair informações adicionais
  const ticketNumber = ticket.ticketNumber || ticket.number || `#${ticket.id.substring(0, 8)}`;
  const requester = ticket.requester || ticket.client || ticket.user || {};
  const assignedTo = ticket.assignedTo || ticket.agent || {};
  const sla = ticket.sla || {};
  const category = ticket.category || {};
  const requesterDept = requester.department || {};
  const assignedDept = assignedTo.department || {};
  
  // Criar modal de detalhes
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
      <div class="modal-header" style="position: sticky; top: 0; background: white; z-index: 10; border-bottom: 1px solid #e2e8f0;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div>
              <h2 style="margin: 0; font-size: 1.5rem; color: #1e293b;">Ticket ${ticketNumber}</h2>
              <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem; color: #64748b;">ID: ${ticket.id}</p>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-left: auto; margin-right: 1rem;">
              ${ticket.status !== 'closed' && ticket.status !== 'resolved' ? `
                <button id="resolveTicketBtn" class="btn btn-success" style="padding: 0.5rem 1rem; font-size: 0.875rem; background: #48bb78; border-color: #48bb78;">
                  <svg style="width: 1rem; height: 1rem; margin-right: 0.25rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Resolver
                </button>
              ` : `
                <button id="reopenTicketBtn" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                  <svg style="width: 1rem; height: 1rem; margin-right: 0.25rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reabrir
                </button>
              `}
            </div>
          </div>
        </div>
        <button class="modal-close" id="closeTicketModal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">&times;</button>
      </div>
      <div class="modal-body" style="padding: 1.5rem;">
        <!-- Título -->
        <h3 style="font-size: 1.25rem; margin-bottom: 1.5rem; color: #1e293b; font-weight: 600;">${escapeHTML(ticket.subject || 'Sem título')}</h3>
        
        <!-- Grid de Informações Principais -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; padding: 1rem; background: #f8fafc; border-radius: 0.5rem;">
          <div>
            <span style="font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 0.25rem; text-transform: uppercase; font-weight: 600;">Status</span>
            <span class="badge badge-status status-${ticket.status}" style="font-size: 0.875rem;">${status}</span>
          </div>
          <div>
            <span style="font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 0.25rem; text-transform: uppercase; font-weight: 600;">Prioridade</span>
            <span class="badge badge-priority priority-${ticket.priority}" style="font-size: 0.875rem;">${priority}</span>
          </div>
          <div>
            <span style="font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 0.25rem; text-transform: uppercase; font-weight: 600;">Tipo</span>
            <span style="font-size: 0.875rem; color: #1e293b;">${escapeHTML(ticket.type || 'Suporte')}</span>
          </div>
          <div>
            <span style="font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 0.25rem; text-transform: uppercase; font-weight: 600;">Categoria</span>
            <span style="font-size: 0.875rem; color: #1e293b;">${escapeHTML(typeof category === 'object' ? category.name : category || 'Geral')}</span>
          </div>
          <div>
            <span style="font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 0.25rem; text-transform: uppercase; font-weight: 600;">Criado em</span>
            <span style="font-size: 0.875rem; color: #1e293b;">${created}</span>
          </div>
          <div>
            <span style="font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 0.25rem; text-transform: uppercase; font-weight: 600;">Atualizado</span>
            <span style="font-size: 0.875rem; color: #1e293b;">${updated}</span>
          </div>
        </div>
        
        <!-- Solicitante e Responsável -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
          <!-- Solicitante -->
          <div style="padding: 1rem; background: white; border: 1px solid #e2e8f0; border-radius: 0.5rem;">
            <h4 style="font-size: 0.875rem; font-weight: 600; color: #1e293b; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
              <svg style="width: 1rem; height: 1rem; color: #667eea;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Solicitante
            </h4>
            <div style="font-size: 0.875rem; color: #1e293b; margin-bottom: 0.5rem; font-weight: 500;">
              ${escapeHTML(requester.name || ticket.clientName || 'Não especificado')}
            </div>
            ${requester.email || ticket.clientEmail ? `
              <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.5rem;">
                📧 ${escapeHTML(requester.email || ticket.clientEmail)}
              </div>
            ` : ''}
            ${requesterDept.name || ticket.requesterDepartment ? `
              <div style="font-size: 0.75rem; color: #64748b;">
                🏢 ${escapeHTML(requesterDept.name || ticket.requesterDepartment)}
              </div>
            ` : ''}
            ${requesterDept.direction || ticket.requesterDirection ? `
              <div style="font-size: 0.75rem; color: #64748b;">
                📍 Direção: ${escapeHTML(requesterDept.direction || ticket.requesterDirection)}
              </div>
            ` : ''}
            ${requesterDept.section || ticket.requesterSection ? `
              <div style="font-size: 0.75rem; color: #64748b;">
                📂 Secção: ${escapeHTML(requesterDept.section || ticket.requesterSection)}
              </div>
            ` : ''}
          </div>
          
          <!-- Responsável -->
          <div style="padding: 1rem; background: white; border: 1px solid #e2e8f0; border-radius: 0.5rem;">
            <h4 style="font-size: 0.875rem; font-weight: 600; color: #1e293b; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
              <svg style="width: 1rem; height: 1rem; color: #48bb78;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Responsável
            </h4>
            ${assignedTo.name || ticket.agentName ? `
              <div style="font-size: 0.875rem; color: #1e293b; margin-bottom: 0.5rem; font-weight: 500;">
                ${escapeHTML(assignedTo.name || ticket.agentName)}
              </div>
              ${assignedTo.email || ticket.agentEmail ? `
                <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.5rem;">
                  📧 ${escapeHTML(assignedTo.email || ticket.agentEmail)}
                </div>
              ` : ''}
              ${assignedDept.name || ticket.agentDepartment ? `
                <div style="font-size: 0.75rem; color: #64748b;">
                  🏢 ${escapeHTML(assignedDept.name || ticket.agentDepartment)}
                </div>
              ` : ''}
            ` : `
              <div style="font-size: 0.875rem; color: #94a3b8; font-style: italic;">
                Não atribuído
              </div>
            `}
          </div>
        </div>
        
        <!-- SLA -->
        ${(() => {
          const slaInfo = calculateSLARemaining(ticket);
          if (slaInfo) {
            const bgColor = slaInfo.expired ? '#fee2e2' : 
                           slaInfo.status === 'critical' ? '#fed7aa' :
                           slaInfo.status === 'warning' ? '#fef3c7' : '#d1fae5';
            const borderColor = slaInfo.color;
            const textColor = slaInfo.expired ? '#991b1b' :
                             slaInfo.status === 'critical' ? '#9a3412' :
                             slaInfo.status === 'warning' ? '#92400e' : '#065f46';
            
            return `
              <div style="padding: 1rem; background: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 0.5rem; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                  <h4 style="font-size: 0.875rem; font-weight: 600; color: ${textColor}; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                    <svg style="width: 1rem; height: 1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    SLA: ${escapeHTML(typeof sla === 'object' ? sla.name : sla || ticket.slaName || 'Padrão')}
                  </h4>
                  <span style="
                    padding: 0.25rem 0.75rem;
                    background: ${slaInfo.color};
                    color: white;
                    border-radius: 1rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                  ">
                    ${slaInfo.message}
                  </span>
                </div>
                
                <!-- Barra de progresso -->
                <div style="background: rgba(255,255,255,0.5); border-radius: 1rem; height: 8px; overflow: hidden; margin-bottom: 0.5rem;">
                  <div style="
                    background: ${slaInfo.color};
                    height: 100%;
                    width: ${slaInfo.percentage}%;
                    transition: width 0.3s ease;
                  "></div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.75rem; color: ${textColor};">
                  ${sla.responseTime || ticket.slaResponseTime ? `
                    <div>⏱️ Resposta: ${escapeHTML(sla.responseTime || ticket.slaResponseTime)}</div>
                  ` : ''}
                  ${sla.resolutionTime || ticket.slaResolutionTime ? `
                    <div>✅ Resolução: ${escapeHTML(sla.resolutionTime || ticket.slaResolutionTime)}</div>
                  ` : ''}
                </div>
              </div>
            `;
          } else if (sla.name || ticket.slaName || ticket.sla) {
            return `
              <div style="padding: 1rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; margin-bottom: 2rem;">
                <h4 style="font-size: 0.875rem; font-weight: 600; color: #64748b; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                  <svg style="width: 1rem; height: 1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  SLA: ${escapeHTML(typeof sla === 'object' ? sla.name : sla || ticket.slaName || ticket.sla)}
                </h4>
                ${sla.responseTime || ticket.slaResponseTime ? `
                  <div style="font-size: 0.75rem; color: #64748b;">
                    ⏱️ Tempo de Resposta: ${escapeHTML(sla.responseTime || ticket.slaResponseTime)}
                  </div>
                ` : ''}
                ${sla.resolutionTime || ticket.slaResolutionTime ? `
                  <div style="font-size: 0.75rem; color: #64748b;">
                    ✅ Tempo de Resolução: ${escapeHTML(sla.resolutionTime || ticket.slaResolutionTime)}
                  </div>
                ` : ''}
              </div>
            `;
          }
          return '';
        })()}
        
        <!-- Descrição -->
        <div style="margin-bottom: 2rem;">
          <h4 style="font-size: 1rem; margin-bottom: 0.75rem; color: #1e293b;">Descrição</h4>
          <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0;">
            ${ticket.description || ticket.descriptionHtml || '<p style="color: #64748b;">Sem descrição</p>'}
          </div>
        </div>
        
        <!-- Anexos do Ticket -->
        ${ticket.attachments && ticket.attachments.length > 0 ? `
        <div style="margin-bottom: 2rem;">
          <h4 style="font-size: 1rem; margin-bottom: 0.75rem; color: #1e293b; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
            <svg style="width: 1.25rem; height: 1.25rem; color: #667eea;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            Anexos (${ticket.attachments.length})
          </h4>
          <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 0.5rem;">
            ${ticket.attachments.map(att => `
              <a 
                href="${att.path || att.url || '#'}" 
                target="_blank"
                download="${att.originalName || att.filename || 'anexo'}"
                style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: white; border-radius: 0.375rem; border: 1px solid #e2e8f0; text-decoration: none; color: #1e293b; transition: all 0.2s;"
                onmouseover="this.style.background='#f1f5f9'; this.style.borderColor='#667eea';"
                onmouseout="this.style.background='white'; this.style.borderColor='#e2e8f0';">
                <svg style="width: 1.5rem; height: 1.5rem; color: #667eea; flex-shrink: 0;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-weight: 500; font-size: 0.875rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${escapeHTML(att.originalName || att.filename || 'Anexo')}
                  </div>
                  <div style="font-size: 0.75rem; color: #64748b;">
                    ${formatFileSize(att.size || 0)}
                  </div>
                </div>
                <svg style="width: 1.25rem; height: 1.25rem; color: #64748b; flex-shrink: 0;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        <!-- Histórico de Conversa -->
        <div style="margin-bottom: 2rem;">
          <h4 style="font-size: 1rem; margin-bottom: 0.75rem; color: #1e293b; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
            <svg style="width: 1.25rem; height: 1.25rem; color: #667eea;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Histórico de Conversa ${ticket.messages && ticket.messages.length > 0 ? `(${ticket.messages.length})` : ''}
          </h4>
          
          <!-- Mensagens -->
          <div id="messagesContainer" style="max-height: 400px; overflow-y: auto; margin-bottom: 1rem; padding: 1rem; background: #f8fafc; border-radius: 0.5rem; border: 1px solid #e2e8f0;">
            ${ticket.messages && ticket.messages.length > 0 ? ticket.messages.map(msg => {
              const userName = msg.user?.name || msg.author || msg.userName || 'Usuário';
              const userInitials = userName.substring(0, 2).toUpperCase();
              const hasAttachments = msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0;
              
              return `
              <div style="background: white; padding: 1rem; border-radius: 0.5rem; margin-bottom: 0.75rem; border-left: 3px solid ${msg.isInternal ? '#fbbf24' : '#667eea'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: ${msg.isInternal ? '#fef3c7' : '#e0e7ff'}; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.75rem; color: ${msg.isInternal ? '#92400e' : '#4c51bf'};">
                      ${userInitials}
                    </div>
                    <div>
                      <div style="font-weight: 600; font-size: 0.875rem; color: #1e293b;">${escapeHTML(userName)}</div>
                      <div style="font-size: 0.7rem; color: #64748b;">${msg.createdAt ? new Date(msg.createdAt).toLocaleString('pt-PT') : ''}</div>
                    </div>
                  </div>
                  ${msg.isInternal ? '<span style="font-size: 0.7rem; background: #fef3c7; color: #92400e; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-weight: 600;">📌 INTERNA</span>' : ''}
                </div>
                <div style="font-size: 0.875rem; color: #334155; line-height: 1.5;">
                  ${msg.message || msg.content || msg.text || ''}
                </div>
                ${hasAttachments ? `
                  <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e2e8f0;">
                    <div style="font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 0.5rem;">📎 Anexos (${msg.attachments.length})</div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                      ${msg.attachments.map(att => `
                        <a href="${att.url || att.path || '#'}" 
                           target="_blank" 
                           download="${att.filename || att.name || 'anexo'}"
                           style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.375rem; text-decoration: none; color: #334155; transition: all 0.2s;"
                           onmouseover="this.style.background='#e0e7ff'; this.style.borderColor='#667eea';"
                           onmouseout="this.style.background='#f8fafc'; this.style.borderColor='#e2e8f0';">
                          <svg style="width: 1.25rem; height: 1.25rem; color: #667eea; flex-shrink: 0;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 0.875rem; font-weight: 500; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(att.filename || att.name || 'Anexo')}</div>
                            ${att.size ? `<div style="font-size: 0.7rem; color: #64748b;">${(att.size / 1024).toFixed(1)} KB</div>` : ''}
                          </div>
                          <svg style="width: 1rem; height: 1rem; color: #667eea; flex-shrink: 0;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>
              `;
            }).join('') : '<div style="text-align: center; padding: 2rem; color: #94a3b8; font-style: italic;">Nenhuma mensagem ainda</div>'}
          </div>
          
          <!-- Campo de Resposta -->
          <div style="background: white; border: 2px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem;">
            <label style="font-size: 0.875rem; font-weight: 600; color: #1e293b; display: block; margin-bottom: 0.5rem;">Adicionar Resposta</label>
            <textarea 
              id="replyMessage" 
              placeholder="Digite sua mensagem aqui..."
              style="width: 100%; min-height: 100px; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.375rem; font-size: 0.875rem; resize: vertical; font-family: inherit;"
            ></textarea>
            
            <!-- Área de preview de anexos -->
            <div id="attachmentsPreview" style="display: none; margin-top: 0.5rem; padding: 0.5rem; background: #f8fafc; border-radius: 0.375rem;">
              <div style="font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 0.5rem;">Anexos:</div>
              <div id="attachmentsList" style="display: flex; flex-wrap: wrap; gap: 0.5rem;"></div>
            </div>
            
            <!-- Input file oculto -->
            <input type="file" id="fileInput" multiple style="display: none;" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
              <div style="display: flex; gap: 0.5rem;">
                <button id="attachFileBtn" class="btn btn-secondary" style="font-size: 0.875rem; padding: 0.5rem 1rem;">
                  <svg style="width: 1rem; height: 1rem; margin-right: 0.25rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Anexar
                </button>
              </div>
              <button id="sendReplyBtn" class="btn btn-primary" style="font-size: 0.875rem; padding: 0.5rem 1.5rem;">
                <svg style="width: 1rem; height: 1rem; margin-right: 0.25rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Enviar
              </button>
            </div>
          </div>
        </div>
        
        <!-- Anexos -->
        ${ticket.attachments && ticket.attachments.length > 0 ? `
          <div style="margin-bottom: 1.5rem;">
            <h4 style="font-size: 1rem; margin-bottom: 0.75rem; color: #1e293b;">Anexos (${ticket.attachments.length})</h4>
            <div style="display: grid; gap: 0.5rem;">
              ${ticket.attachments.map(att => `
                <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: #f8fafc; border-radius: 0.5rem; border: 1px solid #e2e8f0;">
                  <svg style="width: 1.25rem; height: 1.25rem; color: #64748b;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span style="font-size: 0.875rem; color: #1e293b; flex: 1;">${escapeHTML(att.filename || att.name)}</span>
                  ${att.size ? `<span style="font-size: 0.75rem; color: #64748b;">${formatFileSize(att.size)}</span>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
      <div class="modal-footer" style="position: sticky; bottom: 0; background: white; border-top: 1px solid #e2e8f0; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 0.875rem; color: #64748b;">
          Ticket ${ticketNumber} • ${status}
        </div>
        <button id="closeTicketModalBtn" class="btn btn-primary">Fechar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  document.getElementById('closeTicketModal').addEventListener('click', () => {
    closeTicketModal(modal);
  });
  
  document.getElementById('closeTicketModalBtn').addEventListener('click', () => {
    closeTicketModal(modal);
  });
  
  // Enviar resposta
  document.getElementById('sendReplyBtn').addEventListener('click', async () => {
    const messageInput = document.getElementById('replyMessage');
    const message = messageInput.value.trim();
    const sendBtn = document.getElementById('sendReplyBtn');
    
    if (!message) {
      showNotification('Por favor, digite uma mensagem', 'warning');
      return;
    }
    
    try {
      // Desabilitar botão e mostrar loading
      sendBtn.disabled = true;
      sendBtn.innerHTML = `
        <svg style="width: 1rem; height: 1rem; margin-right: 0.25rem; animation: spin 1s linear infinite;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Enviando...
      `;
      
      console.log('📤 Enviando mensagem para ticket:', ticketId);
      console.log('📎 Anexos:', selectedFiles.length);
      
      // Converter arquivos para ArrayBuffer
      const attachments = [];
      for (const file of selectedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        attachments.push({
          name: file.name,
          type: file.type,
          size: file.size,
          data: Array.from(new Uint8Array(arrayBuffer))
        });
      }
      
      // Enviar mensagem via API (com anexos se houver)
      const result = await window.electronAPI.sendTicketMessage(ticketId, message, attachments);
      
      if (result.success) {
        // Limpar campo e anexos após envio
        messageInput.value = '';
        selectedFiles = [];
        document.getElementById('attachmentsPreview').style.display = 'none';
        
        // Adicionar mensagem enviada ao chat imediatamente (feedback instantâneo)
        const sentMessage = {
          content: message,
          user: {
            name: state.user?.name || 'Você'
          },
          createdAt: new Date().toISOString(),
          isInternal: false,
          attachments: result.comment?.attachments || []
        };
        
        appendMessageToChat(sentMessage);
        
        showNotification('Mensagem enviada com sucesso', 'success');
        
        // Atualizar ticket no state
        const ticketIndex = state.tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex !== -1) {
          // Inicializar messages se não existir
          if (!Array.isArray(state.tickets[ticketIndex].messages)) {
            state.tickets[ticketIndex].messages = [];
          }
          
          // Adicionar mensagem retornada pelo servidor
          const newMessage = result.comment || result.message || result;
          if (newMessage && newMessage.id) {
            state.tickets[ticketIndex].messages.push(newMessage);
          }
        }
      } else {
        showNotification(result.error || 'Erro ao enviar mensagem', 'error');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      showNotification('Erro ao enviar mensagem', 'error');
    } finally {
      // Restaurar botão
      sendBtn.disabled = false;
      sendBtn.innerHTML = `
        <svg style="width: 1rem; height: 1rem; margin-right: 0.25rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        Enviar
      `;
    }
  });
  
  // Anexar arquivo
  let selectedFiles = [];
  
  document.getElementById('attachFileBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });
  
  document.getElementById('fileInput').addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Adicionar arquivos à lista
    selectedFiles = [...selectedFiles, ...files];
    
    // Limitar a 10 arquivos
    if (selectedFiles.length > 10) {
      selectedFiles = selectedFiles.slice(0, 10);
      showNotification('Máximo de 10 arquivos permitidos', 'warning');
    }
    
    // Limitar tamanho total a 25MB
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 25 * 1024 * 1024) {
      showNotification('Tamanho total dos anexos não pode exceder 25MB', 'warning');
      selectedFiles = [];
      e.target.value = '';
      document.getElementById('attachmentsPreview').style.display = 'none';
      return;
    }
    
    // Mostrar preview
    const previewContainer = document.getElementById('attachmentsPreview');
    const listContainer = document.getElementById('attachmentsList');
    
    if (selectedFiles.length > 0) {
      previewContainer.style.display = 'block';
      
      listContainer.innerHTML = selectedFiles.map((file, index) => {
        const isImage = file.type.startsWith('image/');
        const icon = isImage ? '🖼️' : 
                     file.type.includes('pdf') ? '📄' :
                     file.type.includes('zip') || file.type.includes('rar') ? '📦' :
                     file.name.includes('.doc') ? '📝' :
                     file.name.includes('.xls') ? '📊' : '📎';
        
        return `
          <div style="display: flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.5rem; background: white; border: 1px solid #e2e8f0; border-radius: 0.25rem; font-size: 0.75rem;">
            <span>${icon}</span>
            <span style="color: #1e293b; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHTML(file.name)}">
              ${escapeHTML(file.name)}
            </span>
            <span style="color: #64748b;">(${formatFileSize(file.size)})</span>
            <button onclick="removeAttachment(${index})" style="background: none; border: none; color: #f56565; cursor: pointer; padding: 0 0.25rem;">✕</button>
          </div>
        `;
      }).join('');
    } else {
      previewContainer.style.display = 'none';
    }
    
    // Limpar input para permitir re-seleção
    e.target.value = '';
  });
  
  // Função global para remover anexo
  window.removeAttachment = (index) => {
    selectedFiles.splice(index, 1);
    
    if (selectedFiles.length === 0) {
      document.getElementById('attachmentsPreview').style.display = 'none';
    } else {
      // Re-renderizar preview
      document.getElementById('fileInput').dispatchEvent(new Event('change'));
    }
  };
  
  // Botões de ação do ticket
  if (document.getElementById('resolveTicketBtn')) {
    document.getElementById('resolveTicketBtn').addEventListener('click', async () => {
      if (confirm('Tem certeza que deseja marcar este ticket como resolvido?')) {
        try {
          const result = await window.electronAPI.changeTicketStatus(ticketId, 'resolved');
          if (result.success) {
            showNotification('Ticket marcado como resolvido', 'success');
            closeTicketModal(modal);
            // Atualizar lista
            await loadTickets();
          } else {
            showNotification(result.error || 'Erro ao resolver ticket', 'error');
          }
        } catch (error) {
          console.error('Erro ao resolver ticket:', error);
          showNotification('Erro ao resolver ticket', 'error');
        }
      }
    });
  }
  
  if (document.getElementById('reopenTicketBtn')) {
    document.getElementById('reopenTicketBtn').addEventListener('click', async () => {
      if (confirm('Tem certeza que deseja reabrir este ticket?')) {
        try {
          const result = await window.electronAPI.changeTicketStatus(ticketId, 'open');
          if (result.success) {
            showNotification('Ticket reaberto com sucesso', 'success');
            closeTicketModal(modal);
            // Atualizar lista
            await loadTickets();
          } else {
            showNotification(result.error || 'Erro ao reabrir ticket', 'error');
          }
        } catch (error) {
          console.error('Erro ao reabrir ticket:', error);
          showNotification('Erro ao reabrir ticket', 'error');
        }
      }
    });
  }
  
  // Fechar ao clicar fora
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeTicketModal(modal);
    }
  });
  
  console.log('✅ Modal criado e adicionado ao DOM');
  
  } catch (error) {
    console.error('❌ Erro ao criar modal:', error);
    console.error('Stack trace:', error.stack);
    showNotification('Erro ao exibir detalhes do ticket', 'error');
  }
}

// Formatar tamanho de arquivo
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const sizeIndex = Math.min(i, sizes.length - 1); // Garantir que não exceda o array
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[sizeIndex];
}

function showNewTicketForm() {
  const page = document.getElementById('ticketsPage');
  let formCard = document.getElementById('newTicketForm');
  if (!formCard) {
    formCard = document.createElement('div');
    formCard.className = 'card';
    formCard.id = 'newTicketForm';
    formCard.innerHTML = `
      <div class="card-header"><h3>Novo Ticket</h3></div>
      <div class="card-body">
        <div class="form-group">
          <label>Assunto <span style="color:#c53030">*</span></label>
          <input type="text" id="ticketSubject" placeholder="Ex: Problema com acesso ao sistema" />
        </div>

        <div class="form-group">
          <label>Descrição Detalhada <span style="color:#c53030">*</span></label>
          <div class="editor-toolbar" id="editorToolbar">
            <select id="editorStyle">
              <option value="p" selected>Normal</option>
              <option value="h1">Título 1</option>
              <option value="h2">Título 2</option>
              <option value="h3">Título 3</option>
            </select>
            <button type="button" class="toolbar-btn" data-cmd="bold"><b>B</b></button>
            <button type="button" class="toolbar-btn" data-cmd="italic"><i>I</i></button>
            <button type="button" class="toolbar-btn" data-cmd="underline"><u>U</u></button>
            <span class="toolbar-sep"></span>
            <button type="button" class="toolbar-btn" data-cmd="insertUnorderedList">• Lista</button>
            <button type="button" class="toolbar-btn" data-cmd="insertOrderedList">1. Lista</button>
            <span class="toolbar-sep"></span>
            <button type="button" class="toolbar-btn" id="insertLinkBtn">Link</button>
          </div>
          <div id="ticketDescriptionHtml" class="rich-editor is-empty" contenteditable="true" data-placeholder="Descreva detalhadamente o problema ou solicitação..."></div>
          <div class="helper-text">
            Você pode usar formatação para organizar melhor:<br/>
            • Negrito para destacar pontos importantes<br/>
            • Listas para passos ou itens<br/>
            • Cores para alertas<br/>
            • Links para referências
          </div>
        </div>

        <div class="field-grid">
          <div class="form-group">
            <label>Prioridade</label>
            <select id="ticketPrioritySelect">
              <option value="">Carregando...</option>
            </select>
            <small class="select-help-text">Selecione a urgência do seu problema</small>
          </div>
          <div class="form-group">
            <label>Tipo</label>
            <select id="ticketTypeSelect">
              <option value="">Carregando...</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Categoria</label>
          <select id="ticketCategorySelect">
            <option value="">Selecione uma categoria (opcional)</option>
          </select>
        </div>

        <div class="form-group">
          <label>Anexos</label>
          <div id="attachmentsDropzone" class="attachments-dropzone">
            <div class="upload-icon" aria-hidden="true">⬆️</div>
            <div class="upload-text">Arraste arquivos aqui ou <a href="#" id="attachmentsPickerLink">clique para selecionar</a></div>
            <div class="upload-hint">Máximo 5 arquivos • Até 20MB cada</div>
            <input type="file" id="ticketFileInput" multiple style="display:none" />
          </div>
          <div id="attachmentsList" class="attachments-list"></div>
        </div>

        <div class="info-box">
          <strong>Dicas para um atendimento mais rápido:</strong>
          <ul>
            <li>Inclua passos para reproduzir o problema</li>
            <li>Informe mensagens de erro ou screenshots</li>
            <li>Indique impacto e urgência</li>
          </ul>
        </div>

        <div class="actions">
          <button class="btn btn-secondary" id="cancelNewTicket">Cancelar</button>
          <button class="btn btn-primary" id="submitNewTicket">Criar Ticket</button>
        </div>
      </div>
    `;
    page.insertBefore(formCard, page.querySelector('.card'));

    document.getElementById('cancelNewTicket').addEventListener('click', () => {
      formCard.remove();
    });
    document.getElementById('submitNewTicket').addEventListener('click', submitNewTicket);

    initNewTicketForm(formCard);
  }
}

async function submitNewTicket() {
  const subject = document.getElementById('ticketSubject').value.trim();
  const descEl = document.getElementById('ticketDescriptionHtml');
  const description = (descEl?.innerHTML || '').trim();
  const priorityId = document.getElementById('ticketPrioritySelect').value;
  const typeId = document.getElementById('ticketTypeSelect').value;
  const categoryId = document.getElementById('ticketCategorySelect').value || null;

  if (!subject || !description) {
    showNotification('Informe assunto e descrição', 'error');
    return;
  }

  try {
    showLoading('Criando ticket...');
    const { success, ticket, error } = await window.electronAPI.createTicket({
      subject,
      description,
      priorityId: priorityId || null,
      typeId: typeId || null,
      categoryId
    });
    if (!success) {
      showNotification(error || 'Erro ao criar ticket', 'error');
      hideLoading();
      return;
    }

    // Enviar anexos imediatamente como primeira mensagem
    if (state.newTicketFiles && state.newTicketFiles.length > 0) {
      try {
        await window.electronAPI.sendMessage(ticket.id, 'Arquivos anexados ao ticket', state.newTicketFiles);
      } catch (e) {
        console.warn('Falha ao enviar anexos:', e);
      }
    }

    addActivity(`Ticket criado: ${subject}`, 'success');
    document.getElementById('newTicketForm')?.remove();
    state.newTicketFiles = [];
    // Lista será atualizada via evento; mas garantimos recarregar
    await loadTickets();
    showNotification('Ticket criado com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao criar ticket:', error);
    showNotification('Erro ao criar ticket', 'error');
  } finally {
    hideLoading();
  }
}

// Inicialização e handlers do formulário rico + anexos + categorias
function initNewTicketForm(formCard) {
  const editor = document.getElementById('ticketDescriptionHtml');
  const toolbar = document.getElementById('editorToolbar');
  const styleSelect = document.getElementById('editorStyle');
  const linkBtn = document.getElementById('insertLinkBtn');
  const dropzone = document.getElementById('attachmentsDropzone');
  const fileInput = document.getElementById('ticketFileInput');
  const pickerLink = document.getElementById('attachmentsPickerLink');
  const attachmentsList = document.getElementById('attachmentsList');

  // Placeholder para contenteditable
  const updateEmptyState = () => {
    const isEmpty = (editor.textContent || '').trim().length === 0;
    editor.classList.toggle('is-empty', isEmpty);
  };
  editor.addEventListener('input', updateEmptyState);
  updateEmptyState();

  // Toolbar básica usando execCommand
  toolbar.querySelectorAll('.toolbar-btn').forEach(btn => {
    const cmd = btn.dataset.cmd;
    btn.addEventListener('click', () => {
      editor.focus();
      document.execCommand(cmd, false, null);
    });
  });

  styleSelect.addEventListener('change', () => {
    editor.focus();
    const val = styleSelect.value;
    if (val === 'p') document.execCommand('formatBlock', false, 'p');
    if (val === 'h1') document.execCommand('formatBlock', false, 'h1');
    if (val === 'h2') document.execCommand('formatBlock', false, 'h2');
    if (val === 'h3') document.execCommand('formatBlock', false, 'h3');
  });

  linkBtn.addEventListener('click', () => {
    const url = prompt('Informe a URL do link:');
    if (url) {
      editor.focus();
      document.execCommand('createLink', false, url);
    }
  });

  // Anexos: drag & drop e seleção
  const addFiles = (files) => {
    const maxFiles = 5;
    const maxSize = 20 * 1024 * 1024; // 20MB
    const currentCount = state.newTicketFiles.length;

    Array.from(files).forEach(file => {
      if (state.newTicketFiles.length >= maxFiles) return;
      if (file.size > maxSize) return;
      state.newTicketFiles.push(file);
    });

    // Render chips
    attachmentsList.innerHTML = state.newTicketFiles.map((f, idx) => `
      <span class="file-chip" data-idx="${idx}">${escapeHTML(f.name)}</span>
    `).join('');
  };

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const dt = e.dataTransfer;
    if (dt?.files?.length) addFiles(dt.files);
  });

  pickerLink.addEventListener('click', (e) => {
    e.preventDefault();
    fileInput.click();
  });
  fileInput.addEventListener('change', (e) => {
    const files = e.target.files || [];
    if (files.length) addFiles(files);
    fileInput.value = '';
  });

  // Carregar prioridades, tipos e categorias dinâmicas
  (async () => {
    try {
      // Carregar prioridades
      const prioritiesResult = await window.electronAPI.getPriorities();
      console.log('📥 Prioridades recebidas:', prioritiesResult);
      // A resposta pode vir aninhada: {success: true, priorities: {priorities: [...]}}
      const priorities = prioritiesResult?.priorities?.priorities || prioritiesResult?.priorities || [];
      const prioritySelect = document.getElementById('ticketPrioritySelect');
      prioritySelect.innerHTML = '<option value="">Selecione a prioridade (opcional)</option>';
      if (Array.isArray(priorities) && priorities.length > 0) {
        priorities.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = p.name;
          if (p.color) opt.style.color = p.color;
          prioritySelect.appendChild(opt);
        });
        console.log(`✅ ${priorities.length} prioridades carregadas`);
      } else {
        console.warn('⚠️ Nenhuma prioridade disponível');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar prioridades:', err);
      const prioritySelect = document.getElementById('ticketPrioritySelect');
      prioritySelect.innerHTML = '<option value="">Nenhuma prioridade disponível</option>';
    }

    try {
      // Carregar tipos
      const typesResult = await window.electronAPI.getTypes();
      console.log('📥 Tipos recebidos:', typesResult);
      // A resposta pode vir aninhada: {success: true, types: {types: [...]}}
      const types = typesResult?.types?.types || typesResult?.types || [];
      const typeSelect = document.getElementById('ticketTypeSelect');
      typeSelect.innerHTML = '<option value="">Selecione o tipo</option>';
      if (Array.isArray(types) && types.length > 0) {
        types.forEach(t => {
          const opt = document.createElement('option');
          opt.value = t.id;
          opt.textContent = t.name;
          typeSelect.appendChild(opt);
        });
        console.log(`✅ ${types.length} tipos carregados`);
      } else {
        console.warn('⚠️ Nenhum tipo disponível');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar tipos:', err);
      const typeSelect = document.getElementById('ticketTypeSelect');
      typeSelect.innerHTML = '<option value="">Nenhum tipo disponível</option>';
    }

    try {
      // Carregar categorias
      const categoriesResult = await window.electronAPI.getCategories();
      console.log('📥 Categorias recebidas:', categoriesResult);
      // A resposta pode vir aninhada: {success: true, categories: {categories: [...]}}
      const categories = categoriesResult?.categories?.categories || categoriesResult?.categories || [];
      const categorySelect = document.getElementById('ticketCategorySelect');
      if (Array.isArray(categories) && categories.length > 0) {
        categories.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.name;
          categorySelect.appendChild(opt);
        });
        console.log(`✅ ${categories.length} categorias carregadas`);
      } else {
        console.warn('⚠️ Nenhuma categoria disponível');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar categorias:', err);
    }
  })();
}


// ============================================
// CATÁLOGO DE SERVIÇOS
// ============================================

let catalogState = {
  categories: [],
  items: [],
  selectedCategory: null,
  searchTerm: ''
};

async function loadCatalog() {
  try {
    showLoading('Carregando catálogo...');
    
    // Carregar categorias
    const categoriesResult = await window.electronAPI.getCatalogCategories();
    if (categoriesResult.success) {
      catalogState.categories = categoriesResult.categories || [];
      renderCatalogCategories();
    }
    
    // Carregar todos os itens inicialmente
    const itemsResult = await window.electronAPI.getCatalogItems(null);
    if (itemsResult.success) {
      catalogState.items = itemsResult.items || [];
      renderCatalogItems();
    }
    
  } catch (error) {
    console.error('Erro ao carregar catálogo:', error);
    showNotification('Erro ao carregar catálogo', 'error');
  } finally {
    hideLoading();
  }
}

function renderCatalogCategories() {
  const container = document.getElementById('catalogCategories');
  if (!container) return;
  
  if (catalogState.categories.length === 0) {
    container.innerHTML = '<p style="color: #64748b; text-align: center; grid-column: 1/-1;">Nenhuma categoria disponível</p>';
    return;
  }
  
  container.innerHTML = catalogState.categories.map(cat => `
    <div 
      class="catalog-category-card ${catalogState.selectedCategory === cat.id ? 'active' : ''}" 
      data-category-id="${cat.id}"
      style="
        padding: 1rem;
        background: ${catalogState.selectedCategory === cat.id ? '#667eea' : 'white'};
        color: ${catalogState.selectedCategory === cat.id ? 'white' : '#1e293b'};
        border: 2px solid ${catalogState.selectedCategory === cat.id ? '#667eea' : '#e2e8f0'};
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      "
      onmouseover="if (!this.classList.contains('active')) { this.style.borderColor='#667eea'; this.style.transform='translateY(-2px)'; }"
      onmouseout="if (!this.classList.contains('active')) { this.style.borderColor='#e2e8f0'; this.style.transform='translateY(0)'; }"
    >
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">${cat.icon || '📦'}</div>
      <div style="font-weight: 600; font-size: 0.875rem;">${escapeHTML(cat.name)}</div>
      ${cat.description ? `<div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.25rem;">${escapeHTML(cat.description)}</div>` : ''}
    </div>
  `).join('');
  
  // Adicionar event listeners
  container.querySelectorAll('.catalog-category-card').forEach(card => {
    card.addEventListener('click', async () => {
      const categoryId = card.dataset.categoryId;
      catalogState.selectedCategory = categoryId;
      
      // Recarregar itens da categoria
      try {
        showLoading('Carregando itens...');
        const result = await window.electronAPI.getCatalogItems(categoryId);
        if (result.success) {
          catalogState.items = result.items || [];
          renderCatalogCategories(); // Re-render para atualizar active
          renderCatalogItems();
        }
      } catch (error) {
        console.error('Erro ao carregar itens:', error);
        showNotification('Erro ao carregar itens', 'error');
      } finally {
        hideLoading();
      }
    });
  });
}

function renderCatalogItems() {
  const container = document.getElementById('catalogItems');
  if (!container) return;
  
  let items = catalogState.items;
  
  // Filtrar por busca
  if (catalogState.searchTerm) {
    const search = catalogState.searchTerm.toLowerCase();
    items = items.filter(item => 
      item.name.toLowerCase().includes(search) ||
      (item.description && item.description.toLowerCase().includes(search))
    );
  }
  
  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" stroke-width="2"/>
        </svg>
        <p>Nenhum item encontrado</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = items.map(item => `
    <div 
      class="catalog-item-card"
      data-item-id="${item.id}"
      style="
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        padding: 1.5rem;
        cursor: pointer;
        transition: all 0.2s;
      "
      onmouseover="this.style.borderColor='#667eea'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.15)';"
      onmouseout="this.style.borderColor='#e2e8f0'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"
    >
      <div style="display: flex; align-items: start; gap: 1rem; margin-bottom: 1rem;">
        <div style="font-size: 2.5rem;">${item.icon || '📦'}</div>
        <div style="flex: 1;">
          <h3 style="font-size: 1rem; font-weight: 600; color: #1e293b; margin-bottom: 0.25rem;">${escapeHTML(item.name)}</h3>
          ${item.description ? `<p style="font-size: 0.875rem; color: #64748b; line-height: 1.4;">${escapeHTML(item.description)}</p>` : ''}
        </div>
      </div>
      
      ${item.estimatedTime ? `
        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #64748b; margin-bottom: 0.5rem;">
          <svg style="width: 1rem; height: 1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Tempo estimado: ${escapeHTML(item.estimatedTime)}</span>
        </div>
      ` : ''}
      
      ${item.requiresApproval ? `
        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #f59e0b; margin-bottom: 0.5rem;">
          <svg style="width: 1rem; height: 1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Requer aprovação</span>
        </div>
      ` : ''}
      
      <button 
        class="btn btn-primary btn-block" 
        style="margin-top: 1rem; width: 100%;"
        onclick="requestCatalogItem('${item.id}')"
      >
        Solicitar
      </button>
    </div>
  `).join('');
}

async function requestCatalogItem(itemId) {
  const item = catalogState.items.find(i => i.id === itemId);
  if (!item) return;
  
  // Criar modal de solicitação
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h2>Solicitar: ${escapeHTML(item.name)}</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Justificativa</label>
          <textarea 
            id="catalogRequestJustification" 
            rows="4" 
            placeholder="Explique por que você precisa deste serviço..."
            style="width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-family: inherit; resize: vertical;"
          ></textarea>
        </div>
        
        ${item.requiresApproval ? `
          <div class="info-box" style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1rem; border-radius: 0.375rem; margin-top: 1rem;">
            <strong>⚠️ Atenção:</strong> Esta solicitação requer aprovação do seu gestor.
          </div>
        ` : ''}
        
        <div class="actions" style="margin-top: 1.5rem;">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
          <button class="btn btn-primary" onclick="submitCatalogRequest('${itemId}')">Enviar Solicitação</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

async function submitCatalogRequest(itemId) {
  const justification = document.getElementById('catalogRequestJustification').value.trim();
  
  if (!justification) {
    showNotification('Por favor, informe uma justificativa', 'error');
    return;
  }
  
  try {
    showLoading('Enviando solicitação...');
    
    const result = await window.electronAPI.requestCatalogItem(itemId, {
      justification
    });
    
    if (result.success) {
      showNotification('Solicitação enviada com sucesso!', 'success');
      document.querySelector('.modal-overlay')?.remove();
      
      // Navegar para tickets
      navigateTo('tickets');
      await loadTickets();
    } else {
      showNotification(result.error || 'Erro ao enviar solicitação', 'error');
    }
    
  } catch (error) {
    console.error('Erro ao solicitar item:', error);
    showNotification('Erro ao enviar solicitação', 'error');
  } finally {
    hideLoading();
  }
}

// Configurar busca no catálogo
document.getElementById('catalogSearchInput')?.addEventListener('input', (e) => {
  catalogState.searchTerm = e.target.value;
  renderCatalogItems();
});

// ============================================
// BASE DE CONHECIMENTO
// ============================================

let knowledgeState = {
  articles: [],
  categories: [],
  searchTerm: '',
  selectedCategory: null
};

async function loadKnowledge() {
  try {
    showLoading('Carregando base de conhecimento...');
    
    const result = await window.electronAPI.getKnowledgeArticles({
      published: true
    });
    
    if (result.success) {
      knowledgeState.articles = result.articles || [];
      
      // Extrair categorias únicas
      const categoriesSet = new Set();
      knowledgeState.articles.forEach(article => {
        if (article.category) {
          categoriesSet.add(article.category);
        }
      });
      knowledgeState.categories = Array.from(categoriesSet);
      
      renderKnowledgeCategories();
      renderKnowledgeArticles();
    }
    
  } catch (error) {
    console.error('Erro ao carregar base de conhecimento:', error);
    showNotification('Erro ao carregar base de conhecimento', 'error');
  } finally {
    hideLoading();
  }
}

function renderKnowledgeCategories() {
  const container = document.getElementById('knowledgeCategories');
  if (!container) return;
  
  if (knowledgeState.categories.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = `
    <button 
      class="btn ${!knowledgeState.selectedCategory ? 'btn-primary' : 'btn-secondary'}" 
      style="padding: 0.5rem 1rem; font-size: 0.875rem;"
      onclick="filterKnowledgeByCategory(null)"
    >
      Todos
    </button>
    ${knowledgeState.categories.map(cat => `
      <button 
        class="btn ${knowledgeState.selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}" 
        style="padding: 0.5rem 1rem; font-size: 0.875rem;"
        onclick="filterKnowledgeByCategory('${escapeHTML(cat)}')"
      >
        ${escapeHTML(cat)}
      </button>
    `).join('')}
  `;
}

function filterKnowledgeByCategory(category) {
  knowledgeState.selectedCategory = category;
  renderKnowledgeCategories();
  renderKnowledgeArticles();
}

function renderKnowledgeArticles() {
  const container = document.getElementById('knowledgeArticles');
  if (!container) return;
  
  let articles = knowledgeState.articles;
  
  // Filtrar por categoria
  if (knowledgeState.selectedCategory) {
    articles = articles.filter(a => a.category === knowledgeState.selectedCategory);
  }
  
  // Filtrar por busca
  if (knowledgeState.searchTerm) {
    const search = knowledgeState.searchTerm.toLowerCase();
    articles = articles.filter(a => 
      a.title.toLowerCase().includes(search) ||
      (a.content && a.content.toLowerCase().includes(search)) ||
      (a.tags && a.tags.some(tag => tag.toLowerCase().includes(search)))
    );
  }
  
  if (articles.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" stroke-width="2"/>
        </svg>
        <p>Nenhum artigo encontrado</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = articles.map(article => `
    <div 
      class="knowledge-article-card"
      data-article-id="${article.id}"
      style="
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        padding: 1.5rem;
        cursor: pointer;
        transition: all 0.2s;
      "
      onclick="showKnowledgeArticle('${article.id}')"
      onmouseover="this.style.borderColor='#667eea'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.15)';"
      onmouseout="this.style.borderColor='#e2e8f0'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"
    >
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
        <h3 style="font-size: 1.125rem; font-weight: 600; color: #1e293b; flex: 1;">${escapeHTML(article.title)}</h3>
        ${article.category ? `
          <span style="
            padding: 0.25rem 0.75rem;
            background: #e0e7ff;
            color: #4c51bf;
            border-radius: 1rem;
            font-size: 0.75rem;
            font-weight: 500;
            white-space: nowrap;
            margin-left: 1rem;
          ">
            ${escapeHTML(article.category)}
          </span>
        ` : ''}
      </div>
      
      ${article.summary || article.excerpt ? `
        <p style="font-size: 0.875rem; color: #64748b; line-height: 1.5; margin-bottom: 1rem;">
          ${escapeHTML(article.summary || article.excerpt)}
        </p>
      ` : ''}
      
      <div style="display: flex; align-items: center; gap: 1rem; font-size: 0.75rem; color: #94a3b8;">
        ${article.views ? `
          <span style="display: flex; align-items: center; gap: 0.25rem;">
            <svg style="width: 1rem; height: 1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            ${article.views} visualizações
          </span>
        ` : ''}
        
        ${article.helpful !== undefined ? `
          <span style="display: flex; align-items: center; gap: 0.25rem;">
            <svg style="width: 1rem; height: 1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            ${article.helpful}% útil
          </span>
        ` : ''}
        
        ${article.updatedAt ? `
          <span>Atualizado ${formatRelativeTime(new Date(article.updatedAt))}</span>
        ` : ''}
      </div>
      
      ${article.tags && article.tags.length > 0 ? `
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem;">
          ${article.tags.map(tag => `
            <span style="
              padding: 0.25rem 0.5rem;
              background: #f1f5f9;
              color: #475569;
              border-radius: 0.25rem;
              font-size: 0.75rem;
            ">
              #${escapeHTML(tag)}
            </span>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');
}

async function showKnowledgeArticle(articleId) {
  try {
    showLoading('Carregando artigo...');
    
    const result = await window.electronAPI.getKnowledgeArticle(articleId);
    
    if (!result.success) {
      showNotification('Erro ao carregar artigo', 'error');
      return;
    }
    
    const article = result.article;
    
    // Incrementar visualizações
    window.electronAPI.incrementArticleViews(articleId).catch(err => {
      console.warn('Erro ao incrementar visualizações:', err);
    });
    
    // Criar modal com o artigo
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header" style="position: sticky; top: 0; background: white; z-index: 10; border-bottom: 1px solid #e2e8f0;">
          <div style="flex: 1;">
            <h2 style="margin: 0; font-size: 1.5rem; color: #1e293b;">${escapeHTML(article.title)}</h2>
            ${article.category ? `
              <span style="
                display: inline-block;
                margin-top: 0.5rem;
                padding: 0.25rem 0.75rem;
                background: #e0e7ff;
                color: #4c51bf;
                border-radius: 1rem;
                font-size: 0.75rem;
                font-weight: 500;
              ">
                ${escapeHTML(article.category)}
              </span>
            ` : ''}
          </div>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
        </div>
        <div class="modal-body" style="padding: 2rem;">
          <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0;">
            ${article.views ? `👁️ ${article.views} visualizações` : ''}
            ${article.updatedAt ? ` • Atualizado ${formatRelativeTime(new Date(article.updatedAt))}` : ''}
          </div>
          
          <div style="line-height: 1.7; color: #334155;">
            ${article.content || article.body || '<p>Conteúdo não disponível</p>'}
          </div>
          
          ${article.tags && article.tags.length > 0 ? `
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
              <div style="font-size: 0.875rem; font-weight: 600; color: #64748b; margin-bottom: 0.75rem;">Tags:</div>
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${article.tags.map(tag => `
                  <span style="
                    padding: 0.375rem 0.75rem;
                    background: #f1f5f9;
                    color: #475569;
                    border-radius: 0.375rem;
                    font-size: 0.875rem;
                  ">
                    #${escapeHTML(tag)}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <div style="margin-top: 2rem; padding: 1rem; background: #f8fafc; border-radius: 0.5rem; text-align: center;">
            <p style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.75rem;">Este artigo foi útil?</p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
              <button class="btn btn-secondary" style="padding: 0.5rem 1.5rem;">
                👍 Sim
              </button>
              <button class="btn btn-secondary" style="padding: 0.5rem 1.5rem;">
                👎 Não
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
  } catch (error) {
    console.error('Erro ao mostrar artigo:', error);
    showNotification('Erro ao carregar artigo', 'error');
  } finally {
    hideLoading();
  }
}

// Configurar busca na base de conhecimento
document.getElementById('knowledgeSearchBtn')?.addEventListener('click', () => {
  const searchInput = document.getElementById('knowledgeSearchInput');
  knowledgeState.searchTerm = searchInput?.value || '';
  renderKnowledgeArticles();
});

document.getElementById('knowledgeSearchInput')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    knowledgeState.searchTerm = e.target.value;
    renderKnowledgeArticles();
  }
});

// Expor funções globalmente para uso nos botões HTML
window.requestCatalogItem = requestCatalogItem;
window.submitCatalogRequest = submitCatalogRequest;
window.filterKnowledgeByCategory = filterKnowledgeByCategory;
window.showKnowledgeArticle = showKnowledgeArticle;

// ============================================
// NOTIFICAÇÕES
// ============================================

let notificationsState = {
  notifications: [],
  filter: 'all' // all, unread, read
};

async function loadNotifications() {
  try {
    showLoading('Carregando notificações...');
    
    const result = await window.electronAPI.getNotifications();
    
    if (result.success) {
      notificationsState.notifications = result.notifications || [];
      renderNotifications();
      updateNotificationsBadge();
    }
    
  } catch (error) {
    console.error('Erro ao carregar notificações:', error);
    showNotification('Erro ao carregar notificações', 'error');
  } finally {
    hideLoading();
  }
}

function renderNotifications() {
  const container = document.getElementById('notificationsList');
  if (!container) return;
  
  let notifications = notificationsState.notifications;
  
  // Aplicar filtro
  if (notificationsState.filter === 'unread') {
    notifications = notifications.filter(n => !n.read);
  } else if (notificationsState.filter === 'read') {
    notifications = notifications.filter(n => n.read);
  }
  
  // Ordenar por data (mais recentes primeiro)
  notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  if (notifications.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="currentColor" stroke-width="2"/>
        </svg>
        <p>Nenhuma notificação ${notificationsState.filter === 'unread' ? 'não lida' : notificationsState.filter === 'read' ? 'lida' : ''}</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = notifications.map(notif => {
    const isUnread = !notif.read;
    const priorityColors = {
      high: '#ef4444',
      urgent: '#dc2626',
      normal: '#667eea',
      low: '#64748b'
    };
    const priorityColor = priorityColors[notif.priority] || priorityColors.normal;
    
    return `
      <div 
        class="notification-item ${isUnread ? 'unread' : ''}"
        data-notification-id="${notif.id}"
        style="
          background: ${isUnread ? '#f0f9ff' : 'white'};
          border: 1px solid ${isUnread ? '#bae6fd' : '#e2e8f0'};
          border-left: 4px solid ${priorityColor};
          border-radius: 0.5rem;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        "
        onclick="handleNotificationClick('${notif.id}')"
        onmouseover="this.style.borderColor='${priorityColor}'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.15)';"
        onmouseout="this.style.borderColor='${isUnread ? '#bae6fd' : '#e2e8f0'}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"
      >
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            ${isUnread ? '<div style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%;"></div>' : ''}
            <h3 style="font-size: 1rem; font-weight: 600; color: #1e293b; margin: 0;">
              ${escapeHTML(notif.title || 'Notificação')}
            </h3>
          </div>
          <span style="font-size: 0.75rem; color: #64748b; white-space: nowrap;">
            ${formatRelativeTime(new Date(notif.createdAt))}
          </span>
        </div>
        
        <p style="font-size: 0.875rem; color: #475569; line-height: 1.5; margin: 0;">
          ${escapeHTML(notif.message || notif.body || '')}
        </p>
        
        ${notif.ticketId ? `
          <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e2e8f0;">
            <span style="font-size: 0.75rem; color: #667eea; font-weight: 500;">
              🎫 Ticket #${notif.ticketId}
            </span>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

async function handleNotificationClick(notificationId) {
  const notification = notificationsState.notifications.find(n => n.id === notificationId);
  if (!notification) return;
  
  // Marcar como lida
  if (!notification.read) {
    try {
      await window.electronAPI.markNotificationAsRead(notificationId);
      notification.read = true;
      renderNotifications();
      updateNotificationsBadge();
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }
  
  // Navegar se houver link
  if (notification.ticketId) {
    navigateTo('tickets');
    // Aguardar um pouco para garantir que a página carregou
    setTimeout(() => {
      showTicketDetails(notification.ticketId);
    }, 300);
  } else if (notification.link) {
    navigateTo(notification.link);
  }
}

async function markAllNotificationsAsRead() {
  const unreadNotifications = notificationsState.notifications.filter(n => !n.read);
  
  if (unreadNotifications.length === 0) {
    showNotification('Não há notificações não lidas', 'info');
    return;
  }
  
  try {
    showLoading('Marcando todas como lidas...');
    
    // Marcar todas como lidas
    await Promise.all(
      unreadNotifications.map(n => window.electronAPI.markNotificationAsRead(n.id))
    );
    
    // Atualizar estado local
    notificationsState.notifications.forEach(n => {
      n.read = true;
    });
    
    renderNotifications();
    updateNotificationsBadge();
    showNotification('Todas as notificações foram marcadas como lidas', 'success');
    
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    showNotification('Erro ao marcar notificações como lidas', 'error');
  } finally {
    hideLoading();
  }
}

function updateNotificationsBadge() {
  const badge = document.getElementById('notificationsBadge');
  if (!badge) return;
  
  const unreadCount = notificationsState.notifications.filter(n => !n.read).length;
  
  if (unreadCount > 0) {
    badge.textContent = unreadCount.toString();
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// Configurar filtros de notificações
document.getElementById('filterAllNotifications')?.addEventListener('click', () => {
  notificationsState.filter = 'all';
  document.getElementById('filterAllNotifications').className = 'btn btn-primary';
  document.getElementById('filterUnreadNotifications').className = 'btn btn-secondary';
  document.getElementById('filterReadNotifications').className = 'btn btn-secondary';
  renderNotifications();
});

document.getElementById('filterUnreadNotifications')?.addEventListener('click', () => {
  notificationsState.filter = 'unread';
  document.getElementById('filterAllNotifications').className = 'btn btn-secondary';
  document.getElementById('filterUnreadNotifications').className = 'btn btn-primary';
  document.getElementById('filterReadNotifications').className = 'btn btn-secondary';
  renderNotifications();
});

document.getElementById('filterReadNotifications')?.addEventListener('click', () => {
  notificationsState.filter = 'read';
  document.getElementById('filterAllNotifications').className = 'btn btn-secondary';
  document.getElementById('filterUnreadNotifications').className = 'btn btn-secondary';
  document.getElementById('filterReadNotifications').className = 'btn btn-primary';
  renderNotifications();
});

document.getElementById('markAllReadBtn')?.addEventListener('click', markAllNotificationsAsRead);

// Listener para atualizações de notificações do main process
if (window.electronAPI && window.electronAPI.onNotificationsUpdated) {
  window.electronAPI.onNotificationsUpdated((data) => {
    console.log('🔔 Notificações atualizadas:', data);
    
    // Atualizar estado local
    if (data.notifications) {
      notificationsState.notifications = data.notifications;
    }
    
    // Atualizar badge
    updateNotificationsBadge();
    
    // Se estamos na página de notificações, re-renderizar
    const notificationsPage = document.getElementById('notificationsPage');
    if (notificationsPage && notificationsPage.classList.contains('active')) {
      renderNotifications();
    }
  });
}

// Expor funções globalmente
window.handleNotificationClick = handleNotificationClick;

// ============================================
// ACESSO REMOTO
// ============================================

let remoteAccessNotifications = null;

function initRemoteAccessNotifications(token) {
  // Criar container para notificações se não existir
  let container = document.getElementById('remote-access-notifications');
  if (!container) {
    container = document.createElement('div');
    container.id = 'remote-access-notifications';
    document.body.appendChild(container);
  }

  // Adicionar estilos CSS se não existirem
  if (!document.getElementById('remote-access-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'remote-access-styles';
    styleEl.textContent = remoteAccessNotificationsStyles;
    document.head.appendChild(styleEl);
  }

  // Inicializar componente
  remoteAccessNotifications = new RemoteAccessNotifications(container, SERVER_URL, token);
  remoteAccessNotifications.initialize();

  // Configurar WebSocket listeners se disponível
  if (window.electronAPI && window.electronAPI.onRemoteAccessRequest) {
    window.electronAPI.onRemoteAccessRequest((request) => {
      console.log('🔔 Nova solicitação de acesso remoto:', request);
      remoteAccessNotifications.addRequest(request);
    });
  }

  // Configurar listener para acesso encerrado
  if (window.electronAPI && window.electronAPI.onRemoteAccessEnded) {
    window.electronAPI.onRemoteAccessEnded((data) => {
      console.log('🔴 Acesso remoto encerrado:', data);
      remoteAccessNotifications.removeRequest(data.id);
    });
  }

  console.log('✅ Notificações de acesso remoto inicializadas');
}

// Expor globalmente para uso nos botões HTML
window.remoteAccessNotifications = remoteAccessNotifications;

// ============================================
// CONFIGURAÇÕES
// ============================================
async function handleSaveSettings() {
  const btn = document.getElementById('saveSettingsBtn');
  btn.disabled = true;
  btn.textContent = 'Salvando...';
  
  try {
    const config = {
      autoLaunch: document.getElementById('autoLaunchSetting').checked,
      minimizeOnStart: document.getElementById('minimizeOnStartSetting').checked,
      autoSync: document.getElementById('autoSyncSetting').checked
    };
    
    await window.electronAPI.saveConfig(config);
    showNotification('Configurações salvas com sucesso!', 'success');
    
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    showNotification('Erro ao salvar configurações', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar Alterações';
  }
}

// ============================================
// UTILS
// ============================================
function addActivity(text, type = 'info') {
  const activityList = document.getElementById('activityList');
  if (!activityList) return; // Elemento não existe ainda
  
  const icons = {
    success: '✓',
    error: '✗',
    info: 'ℹ'
  };
  
  const iconClasses = {
    success: 'activity-icon-success',
    error: 'activity-icon-error',
    info: 'activity-icon-info'
  };
  
  const item = document.createElement('div');
  item.className = 'activity-item';
  item.innerHTML = `
    <div class="activity-icon ${iconClasses[type]}">${icons[type]}</div>
    <div class="activity-content">
      <div class="activity-title">${text}</div>
      <div class="activity-time">Agora</div>
    </div>
  `;
  
  activityList.insertBefore(item, activityList.firstChild);
  
  // Limitar a 10 itens
  while (activityList.children.length > 10) {
    activityList.removeChild(activityList.lastChild);
  }
}

function showLoading(text = 'Carregando...') {
  const overlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  loadingText.textContent = text;
  overlay.style.display = 'flex';
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  overlay.style.display = 'none';
}

function showNotification(message, type = 'info') {
  // Usar notificação do Electron
  window.electronAPI.showNotification({ type, message });
}

function formatRelativeTime(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // diferença em segundos
  
  if (diff < 60) return 'Agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h atrás`;
  return `${Math.floor(diff / 86400)} dias atrás`;
}

// Carregar configurações ao abrir página de settings
document.querySelector('[data-page="settings"]')?.addEventListener('click', async () => {
  try {
    const config = await window.electronAPI.getConfig();
    document.getElementById('autoLaunchSetting').checked = config.autoLaunch || false;
    document.getElementById('minimizeOnStartSetting').checked = config.minimizeOnStart || false;
    document.getElementById('autoSyncSetting').checked = config.autoSync !== false; // default true
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
  }
});

// ==================== CONNECTION STATUS & OFFLINE QUEUE ====================

// Estado de conexão
let connectionState = {
  isOnline: true,
  lastCheck: null,
  consecutiveFailures: 0
};

// Estado da fila offline
let offlineQueueState = {
  items: [],
  stats: {
    total: 0,
    pending: 0,
    failed: 0
  }
};

/**
 * Inicializar sistema de conexão e fila offline
 */
async function initializeConnectionSystem() {
  // Verificar status inicial
  await checkConnectionStatus();
  
  // Atualizar indicador de fila
  await updateOfflineQueueIndicator();
  
  // Listener para mudanças de status de conexão
  window.electronAPI.onConnectionStatus((data) => {
    connectionState.isOnline = data.online;
    updateConnectionStatusUI();
    
    if (data.online) {
      // Conexão restaurada - atualizar fila
      setTimeout(() => updateOfflineQueueIndicator(), 1000);
    }
  });
  
  // Atualizar fila periodicamente (a cada 30 segundos)
  setInterval(() => {
    updateOfflineQueueIndicator();
  }, 30000);
  
  // Click no indicador de fila
  const queueIndicator = document.getElementById('offlineQueueIndicator');
  if (queueIndicator) {
    queueIndicator.addEventListener('click', () => {
      showOfflineQueueModal();
    });
  }
}

/**
 * Verificar e atualizar status de conexão
 */
async function checkConnectionStatus() {
  try {
    const result = await window.electronAPI.connectionGetStatus();
    if (result.success) {
      connectionState.isOnline = result.isOnline;
      connectionState.lastCheck = result.stats.lastCheckTime;
      updateConnectionStatusUI();
    }
  } catch (error) {
    console.error('Erro ao verificar status de conexão:', error);
  }
}

/**
 * Atualizar UI do status de conexão
 */
function updateConnectionStatusUI() {
  const statusElement = document.getElementById('connectionStatus');
  if (!statusElement) return;
  
  if (connectionState.isOnline) {
    statusElement.className = 'connection-status online';
    statusElement.innerHTML = `
      <span class="status-dot"></span>
      <span class="status-text">Online</span>
    `;
    statusElement.title = 'Conexão ativa';
    
    // Remover banner offline se existir
    removeOfflineBanner();
  } else {
    statusElement.className = 'connection-status offline';
    statusElement.innerHTML = `
      <span class="status-dot"></span>
      <span class="status-text">Offline</span>
    `;
    statusElement.title = 'Sem conexão - Modo offline ativo';
    
    // Mostrar banner offline
    showOfflineBanner();
  }
}

/**
 * Atualizar indicador de fila offline
 */
async function updateOfflineQueueIndicator() {
  try {
    const result = await window.electronAPI.offlineQueueGetStats();
    if (result.success) {
      offlineQueueState.stats = result.stats;
      
      const indicator = document.getElementById('offlineQueueIndicator');
      const countElement = document.getElementById('queueCount');
      
      if (indicator && countElement) {
        if (result.stats.pending > 0 || result.stats.failed > 0) {
          indicator.style.display = 'flex';
          countElement.textContent = result.stats.pending + result.stats.failed;
        } else {
          indicator.style.display = 'none';
        }
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar indicador de fila:', error);
  }
}

/**
 * Mostrar banner de modo offline
 */
function showOfflineBanner() {
  // Verificar se já existe
  if (document.getElementById('offlineBanner')) return;
  
  const banner = document.createElement('div');
  banner.id = 'offlineBanner';
  banner.className = 'offline-banner';
  banner.innerHTML = `
    <div class="offline-banner-icon">⚠️</div>
    <div class="offline-banner-content">
      <div class="offline-banner-title">Modo Offline</div>
      <div class="offline-banner-text">Você está trabalhando offline. Suas ações serão sincronizadas quando a conexão for restaurada.</div>
    </div>
    <div class="offline-banner-actions">
      <button class="btn btn-sm btn-secondary" onclick="checkConnectionNow()">Verificar Conexão</button>
      <button class="btn btn-sm btn-secondary" onclick="showOfflineQueueModal()">Ver Fila</button>
    </div>
  `;
  
  // Inserir no topo do conteúdo principal
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.insertBefore(banner, mainContent.firstChild);
  }
}

/**
 * Remover banner de modo offline
 */
function removeOfflineBanner() {
  const banner = document.getElementById('offlineBanner');
  if (banner) {
    banner.remove();
  }
}

/**
 * Verificar conexão agora (manual)
 */
async function checkConnectionNow() {
  try {
    showLoading('Verificando conexão...');
    const result = await window.electronAPI.connectionCheckNow();
    hideLoading();
    
    if (result.success) {
      if (result.isOnline) {
        showNotification('success', 'Conexão restaurada!');
      } else {
        showNotification('warning', 'Ainda sem conexão. Tente novamente em alguns instantes.');
      }
    }
  } catch (error) {
    hideLoading();
    showNotification('error', 'Erro ao verificar conexão: ' + error.message);
  }
}

/**
 * Mostrar modal da fila offline
 */
async function showOfflineQueueModal() {
  try {
    // Buscar itens da fila
    const result = await window.electronAPI.offlineQueueGetAll();
    if (!result.success) {
      showNotification('error', 'Erro ao carregar fila: ' + result.error);
      return;
    }
    
    offlineQueueState.items = result.items || [];
    
    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'offlineQueueModal';
    modal.className = 'offline-queue-modal';
    modal.innerHTML = `
      <div class="offline-queue-content">
        <div class="offline-queue-header">
          <h2>📤 Fila de Sincronização</h2>
          <button class="btn-close" onclick="closeOfflineQueueModal()">✕</button>
        </div>
        
        <div class="offline-queue-stats">
          <div class="queue-stat">
            <div class="queue-stat-value">${offlineQueueState.stats.total}</div>
            <div class="queue-stat-label">Total</div>
          </div>
          <div class="queue-stat">
            <div class="queue-stat-value">${offlineQueueState.stats.pending}</div>
            <div class="queue-stat-label">Pendentes</div>
          </div>
          <div class="queue-stat">
            <div class="queue-stat-value">${offlineQueueState.stats.failed}</div>
            <div class="queue-stat-label">Falhados</div>
          </div>
        </div>
        
        <div class="queue-actions">
          <button class="btn btn-primary" onclick="processOfflineQueue()">
            🔄 Sincronizar Agora
          </button>
          <button class="btn btn-secondary" onclick="clearFailedQueueItems()">
            🗑️ Limpar Falhados
          </button>
          <button class="btn btn-danger" onclick="clearAllQueueItems()">
            ⚠️ Limpar Tudo
          </button>
        </div>
        
        <div class="queue-items-list" id="queueItemsList">
          ${renderQueueItems()}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Click fora do modal fecha
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeOfflineQueueModal();
      }
    });
  } catch (error) {
    showNotification('error', 'Erro ao abrir modal: ' + error.message);
  }
}

/**
 * Renderizar itens da fila
 */
function renderQueueItems() {
  if (offlineQueueState.items.length === 0) {
    return `
      <div class="queue-empty">
        <div class="queue-empty-icon">✅</div>
        <div class="queue-empty-text">Fila vazia</div>
        <div class="queue-empty-subtext">Todas as ações foram sincronizadas</div>
      </div>
    `;
  }
  
  return offlineQueueState.items.map(item => {
    const actionNames = {
      'create_ticket': 'Criar Ticket',
      'send_message': 'Enviar Mensagem',
      'update_ticket': 'Atualizar Ticket',
      'request_catalog_item': 'Solicitar Item',
      'mark_notification_read': 'Marcar Notificação',
      'increment_article_views': 'Visualizar Artigo'
    };
    
    const actionName = actionNames[item.action] || item.action;
    const date = new Date(item.timestamp);
    const formattedDate = date.toLocaleString('pt-BR');
    
    return `
      <div class="queue-item">
        <div class="queue-item-header">
          <div class="queue-item-action">${actionName}</div>
          <div class="queue-item-status ${item.status}">${item.status === 'pending' ? 'Pendente' : 'Falhado'}</div>
        </div>
        <div class="queue-item-meta">
          <span>📅 ${formattedDate}</span>
          <span>🔄 ${item.retries} tentativa(s)</span>
          ${item.error ? `<span>❌ ${item.error}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Fechar modal da fila
 */
function closeOfflineQueueModal() {
  const modal = document.getElementById('offlineQueueModal');
  if (modal) {
    modal.remove();
  }
}

/**
 * Processar fila offline manualmente
 */
async function processOfflineQueue() {
  try {
    showLoading('Sincronizando...');
    const result = await window.electronAPI.offlineQueueProcess();
    hideLoading();
    
    if (result.success) {
      if (result.processed > 0) {
        showNotification('success', `${result.processed} ação(ões) sincronizada(s) com sucesso!`);
      } else if (result.remaining > 0) {
        showNotification('warning', `${result.failed} ação(ões) falharam. ${result.remaining} ainda pendente(s).`);
      } else {
        showNotification('info', 'Nenhuma ação para sincronizar.');
      }
      
      // Atualizar modal
      closeOfflineQueueModal();
      await updateOfflineQueueIndicator();
      
      // Reabrir modal se ainda houver itens
      if (result.remaining > 0 || result.failed > 0) {
        setTimeout(() => showOfflineQueueModal(), 500);
      }
    } else {
      showNotification('error', 'Erro ao sincronizar: ' + result.error);
    }
  } catch (error) {
    hideLoading();
    showNotification('error', 'Erro ao sincronizar: ' + error.message);
  }
}

/**
 * Limpar itens falhados da fila
 */
async function clearFailedQueueItems() {
  if (!confirm('Deseja realmente remover todos os itens falhados da fila?')) {
    return;
  }
  
  try {
    showLoading('Limpando...');
    const result = await window.electronAPI.offlineQueueClearFailed();
    hideLoading();
    
    if (result.success) {
      showNotification('success', `${result.count} item(ns) removido(s).`);
      closeOfflineQueueModal();
      await updateOfflineQueueIndicator();
    } else {
      showNotification('error', 'Erro ao limpar: ' + result.error);
    }
  } catch (error) {
    hideLoading();
    showNotification('error', 'Erro ao limpar: ' + error.message);
  }
}

/**
 * Limpar toda a fila
 */
async function clearAllQueueItems() {
  if (!confirm('⚠️ ATENÇÃO: Isso removerá TODAS as ações pendentes da fila. Esta ação não pode ser desfeita. Deseja continuar?')) {
    return;
  }
  
  try {
    showLoading('Limpando...');
    const result = await window.electronAPI.offlineQueueClearAll();
    hideLoading();
    
    if (result.success) {
      showNotification('success', `${result.count} item(ns) removido(s).`);
      closeOfflineQueueModal();
      await updateOfflineQueueIndicator();
    } else {
      showNotification('error', 'Erro ao limpar: ' + result.error);
    }
  } catch (error) {
    hideLoading();
    showNotification('error', 'Erro ao limpar: ' + error.message);
  }
}

/**
 * Adicionar ação à fila offline (helper)
 */
async function addToOfflineQueue(action, data, metadata = {}) {
  try {
    const result = await window.electronAPI.offlineQueueAdd(action, data, metadata);
    if (result.success) {
      console.log(`[OfflineQueue] Ação adicionada: ${action}`, result.itemId);
      await updateOfflineQueueIndicator();
      return result.itemId;
    } else {
      console.error('[OfflineQueue] Erro ao adicionar ação:', result.error);
      return null;
    }
  } catch (error) {
    console.error('[OfflineQueue] Erro ao adicionar ação:', error);
    return null;
  }
}

/**
 * Wrapper para ações que suportam modo offline
 */
async function executeWithOfflineSupport(action, apiCall, data, metadata = {}) {
  // Verificar se está online
  const statusResult = await window.electronAPI.connectionGetStatus();
  const isOnline = statusResult.success && statusResult.isOnline;
  
  if (isOnline) {
    // Tentar executar normalmente
    try {
      return await apiCall();
    } catch (error) {
      // Se falhar, adicionar à fila
      console.warn('[OfflineSupport] Falha na execução, adicionando à fila:', error);
      await addToOfflineQueue(action, data, metadata);
      throw error;
    }
  } else {
    // Offline - adicionar à fila diretamente
    console.log('[OfflineSupport] Modo offline, adicionando à fila');
    await addToOfflineQueue(action, data, metadata);
    showNotification('info', 'Ação adicionada à fila. Será sincronizada quando a conexão for restaurada.');
    return { success: true, queued: true };
  }
}

// Inicializar sistema de conexão quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  initializeConnectionSystem();
});

// ==================== FILE UPLOAD SYSTEM ====================

// Estado de upload de arquivos
let fileUploadState = {
  selectedFiles: [],
  uploadingFiles: [],
  uploadProgress: {},
  currentTicketId: null
};

/**
 * Inicializar sistema de upload de arquivos
 */
function initializeFileUploadSystem() {
  // Listener para progresso de upload
  window.electronAPI.onFileUploadProgress((data) => {
    updateFileUploadProgress(data);
  });
  
  // Prevenir comportamento padrão de drag & drop no documento
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
}

/**
 * Configurar área de drag & drop
 * @param {HTMLElement} element - Elemento da área de upload
 * @param {function} onFilesSelected - Callback quando arquivos são selecionados
 */
function setupFileDropZone(element, onFilesSelected) {
  if (!element) return;
  
  // Drag over
  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.add('drag-over');
  });
  
  // Drag leave
  element.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.remove('drag-over');
  });
  
  // Drop
  element.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const filePaths = files.map(f => f.path);
      await handleFilesSelected(filePaths, onFilesSelected);
    }
  });
  
  // Click para selecionar
  element.addEventListener('click', async () => {
    const result = await window.electronAPI.fileSelectFiles();
    if (result.success && !result.canceled) {
      await handleFilesSelected(result.filePaths, onFilesSelected);
    }
  });
}

/**
 * Manipular arquivos selecionados
 * @param {array} filePaths - Caminhos dos arquivos
 * @param {function} callback - Callback com arquivos validados
 */
async function handleFilesSelected(filePaths, callback) {
  try {
    showLoading('Validando arquivos...');
    
    // Validar arquivos
    const result = await window.electronAPI.fileValidateMultiple(filePaths);
    hideLoading();
    
    if (!result.success) {
      showNotification('error', 'Erro ao validar arquivos: ' + result.error);
      return;
    }
    
    const { valid, invalid } = result.results;
    
    // Mostrar erros de validação
    if (invalid.length > 0) {
      const errors = invalid.map(f => `${f.name}: ${f.error}`).join('\n');
      showNotification('warning', `${invalid.length} arquivo(s) inválido(s):\n${errors}`);
    }
    
    // Processar arquivos válidos
    if (valid.length > 0) {
      // Gerar previews para imagens
      for (const file of valid) {
        if (file.extension.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          const previewResult = await window.electronAPI.fileGeneratePreview(file.path);
          if (previewResult.success && previewResult.preview) {
            file.preview = previewResult.preview;
          }
        }
      }
      
      if (callback) {
        callback(valid);
      }
    }
  } catch (error) {
    hideLoading();
    showNotification('error', 'Erro ao processar arquivos: ' + error.message);
  }
}

/**
 * Renderizar lista de arquivos selecionados
 * @param {array} files - Lista de arquivos
 * @param {HTMLElement} container - Container para renderizar
 * @param {object} options - Opções de renderização
 */
function renderFileList(files, container, options = {}) {
  if (!container) return;
  
  const {
    showRemove = true,
    showUpload = false,
    onRemove = null,
    onUpload = null
  } = options;
  
  if (files.length === 0) {
    container.innerHTML = '<div class="file-list-empty">Nenhum arquivo selecionado</div>';
    return;
  }
  
  container.innerHTML = files.map((file, index) => {
    const icon = getFileIcon(file.extension);
    const hasPreview = file.preview || file.isImage;
    
    return `
      <div class="file-item" data-index="${index}">
        <div class="file-item-preview">
          ${hasPreview && file.preview ? 
            `<img src="${file.preview}" alt="${file.name}">` :
            `<div class="file-item-preview-icon">${icon}</div>`
          }
        </div>
        <div class="file-item-info">
          <div class="file-item-name" title="${file.name}">${file.name}</div>
          <div class="file-item-meta">
            <span>${formatFileSize(file.size)}</span>
            <span>${file.extension.toUpperCase()}</span>
          </div>
          ${file.uploadProgress !== undefined ? `
            <div class="file-upload-progress">
              <div class="file-upload-progress-bar">
                <div class="file-upload-progress-fill" style="width: ${file.uploadProgress}%"></div>
              </div>
              <div class="file-upload-progress-text">${file.uploadProgress}%</div>
            </div>
          ` : ''}
        </div>
        <div class="file-item-actions">
          ${showUpload ? `
            <button class="file-item-action" onclick="uploadSingleFile(${index})">
              📤 Upload
            </button>
          ` : ''}
          ${showRemove ? `
            <button class="file-item-action danger" onclick="removeFileFromList(${index})">
              🗑️ Remover
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Obter ícone para tipo de arquivo
 * @param {string} ext - Extensão do arquivo
 * @returns {string} Emoji do ícone
 */
function getFileIcon(ext) {
  const icons = {
    '.jpg': '🖼️', '.jpeg': '🖼️', '.png': '🖼️', '.gif': '🖼️', '.webp': '🖼️', '.svg': '🖼️',
    '.pdf': '📄',
    '.doc': '📝', '.docx': '📝',
    '.xls': '📊', '.xlsx': '📊',
    '.ppt': '📊', '.pptx': '📊',
    '.txt': '📄', '.csv': '📊',
    '.html': '🌐', '.css': '🎨', '.js': '⚙️', '.json': '⚙️', '.xml': '⚙️',
    '.zip': '📦', '.rar': '📦', '.7z': '📦', '.tar': '📦', '.gz': '📦'
  };
  return icons[ext.toLowerCase()] || '📎';
}

/**
 * Remover arquivo da lista
 * @param {number} index - Índice do arquivo
 */
function removeFileFromList(index) {
  fileUploadState.selectedFiles.splice(index, 1);
  
  // Re-renderizar lista
  const container = document.getElementById('fileList');
  if (container) {
    renderFileList(fileUploadState.selectedFiles, container, {
      showRemove: true,
      showUpload: false
    });
  }
}

/**
 * Upload de arquivo individual
 * @param {number} index - Índice do arquivo
 */
async function uploadSingleFile(index) {
  const file = fileUploadState.selectedFiles[index];
  if (!file || !fileUploadState.currentTicketId) return;
  
  try {
    showLoading('Fazendo upload...');
    
    const result = await window.electronAPI.fileUpload(
      fileUploadState.currentTicketId,
      file.path
    );
    
    hideLoading();
    
    if (result.success) {
      showNotification('success', 'Arquivo enviado com sucesso!');
      // Remover da lista
      removeFileFromList(index);
    } else {
      showNotification('error', 'Erro ao enviar arquivo: ' + result.error);
    }
  } catch (error) {
    hideLoading();
    showNotification('error', 'Erro ao enviar arquivo: ' + error.message);
  }
}

/**
 * Upload de múltiplos arquivos
 * @param {string} ticketId - ID do ticket
 * @param {array} files - Lista de arquivos
 */
async function uploadMultipleFiles(ticketId, files) {
  if (!files || files.length === 0) return;
  
  try {
    showLoading(`Enviando ${files.length} arquivo(s)...`);
    
    const filePaths = files.map(f => f.path);
    const result = await window.electronAPI.fileUploadMultiple(ticketId, filePaths);
    
    hideLoading();
    
    if (result.success) {
      showNotification('success', `${result.uploaded} arquivo(s) enviado(s) com sucesso!`);
      
      if (result.failed > 0) {
        const errors = result.results.failed.map(f => f.fileName).join(', ');
        showNotification('warning', `${result.failed} arquivo(s) falharam: ${errors}`);
      }
      
      // Limpar lista
      fileUploadState.selectedFiles = [];
      
      return result;
    } else {
      showNotification('error', 'Erro ao enviar arquivos');
      return null;
    }
  } catch (error) {
    hideLoading();
    showNotification('error', 'Erro ao enviar arquivos: ' + error.message);
    return null;
  }
}

/**
 * Atualizar progresso de upload
 * @param {object} data - Dados de progresso
 */
function updateFileUploadProgress(data) {
  const { ticketId, filePath, progress } = data;
  
  // Atualizar estado
  if (filePath) {
    fileUploadState.uploadProgress[filePath] = progress.percent;
  }
  
  // Atualizar UI se necessário
  const progressElement = document.querySelector(`[data-file-path="${filePath}"] .file-upload-progress-fill`);
  if (progressElement) {
    progressElement.style.width = `${progress.percent}%`;
  }
  
  const progressText = document.querySelector(`[data-file-path="${filePath}"] .file-upload-progress-text`);
  if (progressText) {
    progressText.textContent = `${progress.percent}%`;
  }
}

/**
 * Mostrar modal de anexos do ticket
 * @param {string} ticketId - ID do ticket
 */
async function showTicketAttachmentsModal(ticketId) {
  try {
    showLoading('Carregando anexos...');
    
    const result = await window.electronAPI.fileGetAttachments(ticketId);
    hideLoading();
    
    if (!result.success) {
      showNotification('error', 'Erro ao carregar anexos: ' + result.error);
      return;
    }
    
    const attachments = result.attachments || [];
    
    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'attachmentModal';
    modal.className = 'attachment-modal';
    modal.innerHTML = `
      <div class="attachment-modal-content">
        <div class="attachment-modal-header">
          <h2>📎 Anexos do Ticket</h2>
          <button class="btn-close" onclick="closeAttachmentModal()">✕</button>
        </div>
        
        ${attachments.length === 0 ? `
          <div class="attachment-empty">
            <div class="attachment-empty-icon">📎</div>
            <div class="attachment-empty-text">Nenhum anexo</div>
          </div>
        ` : `
          <div class="attachment-grid">
            ${attachments.map(att => renderAttachmentCard(att, ticketId)).join('')}
          </div>
        `}
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Click fora fecha
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeAttachmentModal();
      }
    });
  } catch (error) {
    hideLoading();
    showNotification('error', 'Erro ao carregar anexos: ' + error.message);
  }
}

/**
 * Renderizar card de anexo
 * @param {object} attachment - Dados do anexo
 * @param {string} ticketId - ID do ticket
 * @returns {string} HTML do card
 */
function renderAttachmentCard(attachment, ticketId) {
  const icon = getFileIcon(attachment.extension || '');
  const isImage = attachment.mimeType && attachment.mimeType.startsWith('image/');
  
  return `
    <div class="attachment-card" onclick="downloadAttachment('${ticketId}', '${attachment.id}')">
      <div class="attachment-card-preview">
        ${isImage ? 
          `<img src="${attachment.url}" alt="${attachment.fileName}">` :
          `<div class="attachment-card-preview-icon">${icon}</div>`
        }
      </div>
      <div class="attachment-card-info">
        <div class="attachment-card-name" title="${attachment.fileName}">${attachment.fileName}</div>
        <div class="attachment-card-size">${formatFileSize(attachment.fileSize)}</div>
      </div>
    </div>
  `;
}

/**
 * Fechar modal de anexos
 */
function closeAttachmentModal() {
  const modal = document.getElementById('attachmentModal');
  if (modal) {
    modal.remove();
  }
}

/**
 * Baixar anexo
 * @param {string} ticketId - ID do ticket
 * @param {string} attachmentId - ID do anexo
 */
async function downloadAttachment(ticketId, attachmentId) {
  try {
    showLoading('Baixando anexo...');
    
    const result = await window.electronAPI.fileDownloadAttachment(ticketId, attachmentId);
    hideLoading();
    
    if (result.success) {
      showNotification('success', 'Anexo baixado com sucesso!');
      // Aqui você pode salvar o arquivo ou abrir
    } else {
      showNotification('error', 'Erro ao baixar anexo: ' + result.error);
    }
  } catch (error) {
    hideLoading();
    showNotification('error', 'Erro ao baixar anexo: ' + error.message);
  }
}

/**
 * Remover anexo
 * @param {string} ticketId - ID do ticket
 * @param {string} attachmentId - ID do anexo
 */
async function deleteAttachment(ticketId, attachmentId) {
  if (!confirm('Deseja realmente remover este anexo?')) {
    return;
  }
  
  try {
    showLoading('Removendo anexo...');
    
    const result = await window.electronAPI.fileDeleteAttachment(ticketId, attachmentId);
    hideLoading();
    
    if (result.success) {
      showNotification('success', 'Anexo removido com sucesso!');
      // Recarregar modal
      closeAttachmentModal();
      setTimeout(() => showTicketAttachmentsModal(ticketId), 300);
    } else {
      showNotification('error', 'Erro ao remover anexo: ' + result.error);
    }
  } catch (error) {
    hideLoading();
    showNotification('error', 'Erro ao remover anexo: ' + error.message);
  }
}

/**
 * Adicionar área de upload ao formulário de ticket
 * @param {HTMLElement} form - Formulário
 */
function addFileUploadToTicketForm(form) {
  if (!form) return;
  
  const uploadArea = document.createElement('div');
  uploadArea.className = 'form-group';
  uploadArea.innerHTML = `
    <label>Anexos</label>
    <div id="ticketFileUploadArea" class="file-upload-area">
      <div class="file-upload-icon">📎</div>
      <div class="file-upload-text">Arraste arquivos aqui ou clique para selecionar</div>
      <div class="file-upload-hint">Máximo 10MB por arquivo</div>
    </div>
    <div id="ticketFileList" class="file-list"></div>
  `;
  
  form.appendChild(uploadArea);
  
  // Configurar drag & drop
  const dropZone = uploadArea.querySelector('#ticketFileUploadArea');
  const fileList = uploadArea.querySelector('#ticketFileList');
  
  setupFileDropZone(dropZone, (files) => {
    fileUploadState.selectedFiles = [...fileUploadState.selectedFiles, ...files];
    renderFileList(fileUploadState.selectedFiles, fileList, {
      showRemove: true,
      showUpload: false
    });
  });
}

// Inicializar sistema de upload quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  initializeFileUploadSystem();
});
