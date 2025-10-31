// Configuração
const SERVER_URL = 'http://localhost:3000';

// Importar componentes
import { SLAIndicator } from './components/SLAIndicator.js';

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
  syncTimer: null
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
      return { serverUrl: 'http://localhost:3000', token: null };
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
  document.getElementById('signupLink').addEventListener('click', openSignup);
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
  const serverUrl = 'http://localhost:3000'; // URL do servidor fixo
  
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

function openSignup(e) {
  e.preventDefault();
  window.electronAPI.openExternal(`${SERVER_URL}/register`);
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
function updateDashboard() {
  const stats = calculateStatistics();
  
  // Atualizar cards de estatísticas
  const statTotal = document.getElementById('statTotal');
  if (statTotal) statTotal.textContent = stats.total;
  
  const statOpen = document.getElementById('statOpen');
  if (statOpen) statOpen.textContent = stats.open;
  
  const statHighPriority = document.getElementById('statHighPriority');
  if (statHighPriority) statHighPriority.textContent = stats.highPriority;
  
  const statResolved = document.getElementById('statResolved');
  if (statResolved) statResolved.textContent = stats.resolved;
  
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
    renderTicketsList();
    document.getElementById('statTickets').textContent = state.tickets.length.toString();
    updateDashboard();
  } catch (error) {
    console.error('Erro ao carregar tickets:', error);
  } finally {
    hideLoading();
  }
}

async function handleNewTicket() {
  showNewTicketForm();
}

// Configurar filtros de tickets
function setupTicketFilters() {
  // Busca em tempo real
  const searchInput = document.getElementById('ticketSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.filters.search = e.target.value;
      // Aplicar filtro com debounce
      clearTimeout(state.searchTimeout);
      state.searchTimeout = setTimeout(() => {
        applyFilters();
      }, 300);
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
  
  // Aplicar ordenação
  filtered = sortTickets(filtered, sortBy);
  
  state.filteredTickets = filtered;
  
  // Atualizar contador
  const filterResults = document.getElementById('filterResults');
  if (filterResults) {
    const hasFilters = search || status || priority;
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
  console.log('📊 Tickets a renderizar:', state.filteredTickets.length || state.tickets.length);
  
  const container = document.getElementById('ticketsList');
  
  if (!container) {
    console.warn('⚠️ Container ticketsList não encontrado no DOM');
    return;
  }
  
  const ticketsToRender = state.filteredTickets.length > 0 || Object.values(state.filters).some(f => f) 
    ? state.filteredTickets 
    : state.tickets;
    
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
  
  console.log('✅ Ticket encontrado:', ticket.subject);
  console.log('📋 Dados completos do ticket:', ticket);
  
  // Marcar mensagens como lidas
  if (ticket.unreadCount && ticket.unreadCount > 0) {
    markTicketAsRead(ticketId);
  }
  
  try {
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
                <button id="assignTicketBtn" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                  <svg style="width: 1rem; height: 1rem; margin-right: 0.25rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Atribuir
                </button>
                <button id="resolveTicketBtn" class="btn btn-success" style="padding: 0.5rem 1rem; font-size: 0.875rem; background: #48bb78; border-color: #48bb78;">
                  <svg style="width: 1rem; height: 1rem; margin-right: 0.25rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Resolver
                </button>
                <button id="closeTicketBtn" class="btn btn-danger" style="padding: 0.5rem 1rem; font-size: 0.875rem; background: #f56565; border-color: #f56565;">
                  <svg style="width: 1rem; height: 1rem; margin-right: 0.25rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Fechar
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
            ${ticket.messages && ticket.messages.length > 0 ? ticket.messages.map(msg => `
              <div style="background: white; padding: 1rem; border-radius: 0.5rem; margin-bottom: 0.75rem; border-left: 3px solid ${msg.isInternal ? '#fbbf24' : '#667eea'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: ${msg.isInternal ? '#fef3c7' : '#e0e7ff'}; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.75rem; color: ${msg.isInternal ? '#92400e' : '#4c51bf'};">
                      ${(msg.author || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style="font-weight: 600; font-size: 0.875rem; color: #1e293b;">${escapeHTML(msg.author || msg.userName || 'Usuário')}</div>
                      <div style="font-size: 0.7rem; color: #64748b;">${msg.createdAt ? new Date(msg.createdAt).toLocaleString('pt-PT') : ''}</div>
                    </div>
                  </div>
                  ${msg.isInternal ? '<span style="font-size: 0.7rem; background: #fef3c7; color: #92400e; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-weight: 600;">📌 INTERNA</span>' : ''}
                </div>
                <div style="font-size: 0.875rem; color: #334155; line-height: 1.5;">
                  ${msg.message || msg.content || msg.text || ''}
                </div>
              </div>
            `).join('') : '<div style="text-align: center; padding: 2rem; color: #94a3b8; font-style: italic;">Nenhuma mensagem ainda</div>'}
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
    modal.remove();
  });
  
  document.getElementById('closeTicketModalBtn').addEventListener('click', () => {
    modal.remove();
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
      
      // Enviar mensagem via API (com anexos se houver)
      const result = await window.electronAPI.sendTicketMessage(ticketId, message, selectedFiles);
      
      if (result.success) {
        // Limpar campo e anexos após envio
        messageInput.value = '';
        const attachmentNames = selectedFiles.map(f => f.name);
        selectedFiles = [];
        document.getElementById('attachmentsPreview').style.display = 'none';
        
        // Adicionar mensagem ao container
        const messagesContainer = document.getElementById('messagesContainer');
        const attachmentsHtml = attachmentNames.length > 0 ? `
          <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #e2e8f0;">
            <div style="font-size: 0.7rem; color: #64748b; margin-bottom: 0.25rem;">Anexos:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
              ${attachmentNames.map(name => `
                <span style="font-size: 0.7rem; padding: 0.125rem 0.375rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.25rem;">
                  📎 ${escapeHTML(name)}
                </span>
              `).join('')}
            </div>
          </div>
        ` : '';
        
        const newMessageHtml = `
          <div style="background: white; padding: 1rem; border-radius: 0.5rem; margin-bottom: 0.75rem; border-left: 3px solid #667eea;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: #e0e7ff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.75rem; color: #4c51bf;">
                  ${(state.user?.name || 'U').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style="font-weight: 600; font-size: 0.875rem; color: #1e293b;">${escapeHTML(state.user?.name || 'Você')}</div>
                  <div style="font-size: 0.7rem; color: #64748b;">Agora mesmo</div>
                </div>
              </div>
            </div>
            <div style="font-size: 0.875rem; color: #334155; line-height: 1.5;">
              ${escapeHTML(message)}
            </div>
            ${attachmentsHtml}
          </div>
        `;
        
        // Remover mensagem "Nenhuma mensagem ainda" se existir
        if (messagesContainer.innerHTML.includes('Nenhuma mensagem ainda')) {
          messagesContainer.innerHTML = newMessageHtml;
        } else {
          messagesContainer.insertAdjacentHTML('beforeend', newMessageHtml);
        }
        
        // Scroll para a última mensagem
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        showNotification('Mensagem enviada com sucesso', 'success');
        
        // Atualizar ticket no state
        const ticketIndex = state.tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex !== -1 && ticketIndex < state.tickets.length && result.message) {
          if (!state.tickets[ticketIndex].messages) {
            state.tickets[ticketIndex].messages = [];
          }
          state.tickets[ticketIndex].messages.push(result.message);
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
            modal.remove();
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
  
  if (document.getElementById('closeTicketBtn')) {
    document.getElementById('closeTicketBtn').addEventListener('click', async () => {
      if (confirm('Tem certeza que deseja fechar este ticket?')) {
        try {
          const result = await window.electronAPI.changeTicketStatus(ticketId, 'closed');
          if (result.success) {
            showNotification('Ticket fechado com sucesso', 'success');
            modal.remove();
            // Atualizar lista
            await loadTickets();
          } else {
            showNotification(result.error || 'Erro ao fechar ticket', 'error');
          }
        } catch (error) {
          console.error('Erro ao fechar ticket:', error);
          showNotification('Erro ao fechar ticket', 'error');
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
            modal.remove();
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
  
  if (document.getElementById('assignTicketBtn')) {
    document.getElementById('assignTicketBtn').addEventListener('click', async () => {
      // Buscar lista de agentes
      try {
        const result = await window.electronAPI.getAgents();
        if (result.success && result.agents && result.agents.length > 0) {
          // Criar modal de atribuição
          showAssignAgentModal(ticketId, result.agents, ticket);
        } else {
          showNotification('Nenhum agente disponível', 'warning');
        }
      } catch (error) {
        console.error('Erro ao buscar agentes:', error);
        showNotification('Erro ao buscar agentes', 'error');
      }
    });
  }
  
  // Fechar ao clicar fora
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
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

// Modal de atribuição de agente
function showAssignAgentModal(ticketId, agents, ticket) {
  const assignModal = document.createElement('div');
  assignModal.className = 'modal-overlay';
  assignModal.style.zIndex = '10001'; // Acima do modal de detalhes
  
  assignModal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h3 style="margin: 0; font-size: 1.25rem;">Atribuir Ticket</h3>
        <button class="modal-close" id="closeAssignModal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">&times;</button>
      </div>
      <div class="modal-body" style="padding: 1.5rem;">
        <div style="margin-bottom: 1rem; padding: 1rem; background: #f8fafc; border-radius: 0.5rem; border: 1px solid #e2e8f0;">
          <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Ticket</div>
          <div style="font-weight: 600; color: #1e293b;">${escapeHTML(ticket.subject || 'Sem título')}</div>
          <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.25rem;">ID: ${ticket.id}</div>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #1e293b;">
            Selecione um agente:
          </label>
          <select id="agentSelect" style="width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.875rem; background: white;">
            <option value="">-- Selecione um agente --</option>
            ${agents.map(agent => `
              <option value="${agent.id}">
                ${escapeHTML(agent.name)}${agent.email ? ` (${agent.email})` : ''}${agent.department ? ` - ${agent.department.name || agent.department}` : ''}
              </option>
            `).join('')}
          </select>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #1e293b;">
            Nota (opcional):
          </label>
          <textarea 
            id="assignNote" 
            placeholder="Adicione uma nota sobre a atribuição..."
            style="width: 100%; min-height: 80px; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.875rem; resize: vertical; font-family: inherit;"
          ></textarea>
        </div>
        
        <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
          <button id="cancelAssignBtn" class="btn btn-secondary">
            Cancelar
          </button>
          <button id="confirmAssignBtn" class="btn btn-primary">
            <svg style="width: 1rem; height: 1rem; margin-right: 0.25rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Atribuir
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(assignModal);
  
  // Event listeners
  document.getElementById('closeAssignModal').addEventListener('click', () => {
    assignModal.remove();
  });
  
  document.getElementById('cancelAssignBtn').addEventListener('click', () => {
    assignModal.remove();
  });
  
  document.getElementById('confirmAssignBtn').addEventListener('click', async () => {
    const agentId = document.getElementById('agentSelect').value;
    const note = document.getElementById('assignNote').value.trim();
    
    if (!agentId) {
      showNotification('Por favor, selecione um agente', 'warning');
      return;
    }
    
    try {
      const confirmBtn = document.getElementById('confirmAssignBtn');
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `
        <svg style="width: 1rem; height: 1rem; margin-right: 0.25rem; animation: spin 1s linear infinite;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Atribuindo...
      `;
      
      const result = await window.electronAPI.assignTicket(ticketId, agentId);
      
      if (result.success) {
        showNotification('Ticket atribuído com sucesso', 'success');
        assignModal.remove();
        
        // Fechar modal de detalhes e recarregar lista
        const detailsModal = document.querySelector('.modal-overlay');
        if (detailsModal) detailsModal.remove();
        
        await loadTickets();
      } else {
        showNotification(result.error || 'Erro ao atribuir ticket', 'error');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `
          <svg style="width: 1rem; height: 1rem; margin-right: 0.25rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Atribuir
        `;
      }
    } catch (error) {
      console.error('Erro ao atribuir ticket:', error);
      showNotification('Erro ao atribuir ticket', 'error');
    }
  });
  
  // Fechar ao clicar fora
  assignModal.addEventListener('click', (e) => {
    if (e.target === assignModal) {
      assignModal.remove();
    }
  });
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
              <option value="none" selected>Sem prioridade</option>
              <option value="low">Baixa</option>
              <option value="normal">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
            <small class="select-help-text">Selecione a urgência do seu problema</small>
          </div>
          <div class="form-group">
            <label>Tipo</label>
            <select id="ticketTypeSelect">
              <option value="suporte" selected>Suporte</option>
              <option value="incidente">Incidente</option>
              <option value="solicitacao">Solicitação</option>
              <option value="bug">Bug</option>
              <option value="aprimoramento">Aprimoramento</option>
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
  const priority = document.getElementById('ticketPrioritySelect').value;
  const type = document.getElementById('ticketTypeSelect').value;
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
      priority: priority === 'none' ? undefined : priority,
      type,
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

  // Carregar categorias dinâmicas
  (async () => {
    try {
      const result = await window.electronAPI.getCategories();
      const categories = result?.categories || result || [];
      const select = document.getElementById('ticketCategorySelect');
      categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        select.appendChild(opt);
      });
    } catch (err) {
      console.warn('Não foi possível carregar categorias:', err);
    }
  })();
}


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
