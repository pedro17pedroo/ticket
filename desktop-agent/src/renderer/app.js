// Configuração
const SERVER_URL = 'http://localhost:3000';

// Estado global
const state = {
  user: null,
  connected: false,
  systemInfo: null,
  tickets: [],
  lastSync: null,
  newTicketFiles: []
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
document.addEventListener('DOMContentLoaded', async () => {
  await init();
});

async function init() {
  // Verificar se já tem sessão
  const config = await window.electronAPI.getConfig();
  
  if (config.token) {
    // Já está conectado
    showApp();
    await loadUserData();
    await performAutoScan(); // Scan automático ao iniciar
    setupAutoSync(); // Configurar sync periódico
    setupTicketRealtime(); // Eventos de tickets em tempo real
  } else {
    // Mostrar tela de login
    showLogin();
  }
  
  setupEventListeners();
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
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  if (!email || !password) {
    showLoginError('Por favor, preencha email e senha');
    return;
  }
  
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Entrando...';
  hideLoginError();
  
  try {
    // 1. Fazer login no servidor
    const loginResponse = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    let loginData;
    try {
      loginData = await loginResponse.json();
    } catch (e) {
      throw new Error('Erro ao comunicar com o servidor');
    }
    
    if (!loginResponse.ok) {
      const errorMsg = loginData.message || loginData.error || 'Credenciais inválidas';
      throw new Error(errorMsg);
    }
    
    const token = loginData.token;
    const user = loginData.user;
    
    if (!token) {
      throw new Error('Token não recebido do servidor');
    }
    
    // 2. Conectar o agent
    const result = await window.electronAPI.connect({ 
      serverUrl: SERVER_URL, 
      token 
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao conectar agent');
    }
    
    // 3. Salvar dados do usuário
    state.user = user;
    state.connected = true;
    
    // 4. Mostrar app
    showApp();
    await loadUserData();
    
    // 5. Executar scan automático (silenciosamente)
    await performAutoScan();
    
    // 6. Configurar sync automático
    setupAutoSync();
    
  } catch (error) {
    console.error('Login error:', error);
    showLoginError(error.message || 'Erro ao fazer login');
    btn.disabled = false;
    btn.textContent = 'Entrar';
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

// ============================================
// NAVEGAÇÃO
// ============================================
function showLogin() {
  document.getElementById('loginScreen').classList.add('active');
  document.getElementById('mainApp').classList.remove('active');
}

function showApp() {
  document.getElementById('loginScreen').classList.remove('active');
  document.getElementById('mainApp').classList.add('active');
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
    case 'tickets':
      await loadTickets();
      break;
    case 'info':
      await loadSystemInfo();
      break;
    case 'dashboard':
      await loadDashboard();
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
    if (state.user) {
      const initials = state.user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
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

function setupAutoSync() {
  // Sync automático a cada 1 hora
  setInterval(async () => {
    await performAutoScan();
  }, 60 * 60 * 1000);
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
      document.getElementById('statSystem').textContent = `${systemInfo.os} ${systemInfo.osVersion}`;
      document.getElementById('infoHostname').textContent = systemInfo.hostname || '-';
      document.getElementById('infoOS').textContent = `${systemInfo.os} ${systemInfo.osVersion}` || '-';
      document.getElementById('infoCPU').textContent = systemInfo.processor || '-';
      document.getElementById('infoRAM').textContent = systemInfo.ram || '-';
    }
    
    // Última sincronização
    if (status.lastSync) {
      const lastSync = new Date(status.lastSync);
      document.getElementById('statLastSync').textContent = formatRelativeTime(lastSync);
    }
    
    // Status
    document.getElementById('statStatus').textContent = status.connected ? 'Ativo' : 'Inativo';
    
    // Tickets (simulado por enquanto)
    document.getElementById('statTickets').textContent = state.tickets.length || '0';
    
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
    renderTicketsList();
    document.getElementById('statTickets').textContent = state.tickets.length.toString();
  } catch (error) {
    console.error('Erro ao carregar tickets:', error);
  } finally {
    hideLoading();
  }
}

async function handleNewTicket() {
  showNewTicketForm();
}

// Renderização da lista de tickets
function renderTicketsList() {
  const container = document.getElementById('ticketsList');
  if (!state.tickets || state.tickets.length === 0) {
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

  const rows = state.tickets.map((t) => {
    const created = t.createdAt ? formatRelativeTime(new Date(t.createdAt)) : '-';
    const status = (t.status || 'open');
    const priority = (t.priority || 'normal');
    const unread = t.unreadCount || 0;
    return `
      <div class="ticket-item">
        <div class="ticket-title">${escapeHTML(t.subject || 'Sem título')}</div>
        <div class="ticket-meta">
          <span class="badge badge-status status-${status}">${status}</span>
          <span class="badge badge-priority priority-${priority}">${priority}</span>
          <span class="meta">Criado: ${created}</span>
          ${unread > 0 ? `<span class="badge badge-unread">${unread} não lida(s)</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="ticket-list">${rows}</div>`;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
// LOGOUT
// ============================================
async function handleLogout() {
  if (!confirm('Tem certeza que deseja sair?')) {
    return;
  }
  
  try {
    await window.electronAPI.disconnect();
    state.user = null;
    state.connected = false;
    showLogin();
    
    // Limpar formulário
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
}

// ============================================
// UTILS
// ============================================
function addActivity(text, type = 'info') {
  const activityList = document.getElementById('activityList');
  
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
