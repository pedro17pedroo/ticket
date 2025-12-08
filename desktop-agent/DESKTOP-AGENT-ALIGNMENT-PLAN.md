# 🎯 Plano de Alinhamento - Desktop Agent

**Data:** 06 de Dezembro de 2024  
**Objetivo:** Garantir alinhamento completo entre Desktop Agent e Backend

---

## 📊 Status Atual

### ✅ Funcionalidades Implementadas

1. **Inventário Automático** ✅
   - Coleta de hardware e software
   - Sincronização periódica
   - Informações de segurança

2. **Acesso Remoto** ✅
   - Execução de comandos
   - Screenshots
   - WebSocket connection
   - Notificações

3. **Sistema de Tickets** ✅ (Backend completo)
   - Buscar tickets
   - Criar tickets
   - Chat em tempo real
   - Notificações desktop
   - Segregação Cliente/Organização

4. **Interface Básica** ✅
   - Dashboard
   - Configurações
   - System tray

---

## 🔍 Análise de Alinhamento

### 1. **Endpoints do Backend vs Desktop Agent**

#### ✅ Endpoints Já Consumidos:

```javascript
// Inventário
POST /api/inventory/agent-collect  ✅
GET  /api/inventory/assets/machine/:id  ✅

// Health Check
GET  /api/health  ✅

// Tickets (via ticketManager.js)
GET  /api/tickets  ✅
POST /api/tickets  ✅
PUT  /api/tickets/:id  ✅
GET  /api/tickets/:id/comments  ✅
POST /api/tickets/:id/comments  ✅
```

#### ⚠️ Endpoints Disponíveis mas NÃO Consumidos:

```javascript
// Auth
POST /api/auth/login  ⚠️ (Usar token direto)
GET  /api/auth/profile  ⚠️ (Obter info do usuário)

// Tickets - Funcionalidades Avançadas
GET  /api/tickets/statistics  ⚠️
GET  /api/tickets/:id/history  ⚠️
POST /api/tickets/:id/transfer  ⚠️
PATCH /api/tickets/:id/internal-priority  ⚠️

// Catálogo de Serviços
GET  /api/catalog/categories  ⚠️
GET  /api/catalog/items  ⚠️
POST /api/catalog/requests  ⚠️

// Knowledge Base
GET  /api/knowledge  ⚠️
GET  /api/knowledge/:id  ⚠️

// SLAs
GET  /api/slas  ⚠️
GET  /api/slas/priority/:priority  ⚠️

// Notificações
GET  /api/notifications  ⚠️
PATCH /api/notifications/:id/read  ⚠️
```

---

## 🎯 Plano de Ação

### **Fase 1: Correções Críticas** (Prioridade Alta)

#### 1.1 Autenticação e Perfil do Usuário

**Problema:** Desktop Agent usa apenas token, sem validar usuário

**Solução:**
```javascript
// Adicionar em apiClient.js
async getUserProfile() {
  const response = await this.axios.get('/api/auth/profile');
  return response.data.user;
}

// Usar em main.js ao conectar
const user = await apiClient.getUserProfile();
store.set('user', {
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  userType: user.userType,
  organizationId: user.organizationId,
  clientId: user.clientId
});
```

**Benefícios:**
- ✅ Saber se é cliente ou organização
- ✅ Mostrar nome do usuário na interface
- ✅ Segregar funcionalidades por role
- ✅ Validar token automaticamente

---

#### 1.2 Interface de Tickets Completa

**Problema:** Backend 100% funcional, mas interface HTML incompleta

**Solução:**

**a) Atualizar index.html:**
```html
<!-- Adicionar aba de tickets -->
<div class="tabs">
  <button class="tab active" data-tab="dashboard">Dashboard</button>
  <button class="tab" data-tab="tickets">
    🎫 Tickets
    <span class="badge" id="tickets-badge" style="display: none;">0</span>
  </button>
  <button class="tab" data-tab="catalog">📦 Catálogo</button>
  <button class="tab" data-tab="knowledge">📚 Base de Conhecimento</button>
  <button class="tab" data-tab="settings">⚙️ Configurações</button>
</div>

<!-- Página de Tickets -->
<div id="tickets-page" class="tab-content" style="display: none;">
  <div class="tickets-container">
    <!-- Filtros -->
    <div class="tickets-filters">
      <input type="text" id="ticket-search" placeholder="🔍 Buscar tickets...">
      <select id="ticket-status-filter">
        <option value="">Todos os Status</option>
        <option value="open">Aberto</option>
        <option value="in_progress">Em Progresso</option>
        <option value="resolved">Resolvido</option>
      </select>
      <select id="ticket-priority-filter">
        <option value="">Todas as Prioridades</option>
        <option value="high">Alta</option>
        <option value="normal">Média</option>
        <option value="low">Baixa</option>
      </select>
      <button id="btn-new-ticket" class="btn btn-primary">+ Novo Ticket</button>
    </div>

    <!-- Lista de Tickets -->
    <div class="tickets-list" id="tickets-list">
      <!-- Renderizado dinamicamente -->
    </div>
  </div>
</div>
```

**b) Criar app-tickets.js:**
```javascript
// Gerenciamento completo de tickets
class TicketManager {
  constructor() {
    this.tickets = [];
    this.selectedTicket = null;
    this.filters = {
      search: '',
      status: '',
      priority: ''
    };
  }

  async loadTickets() {
    const { success, tickets } = await window.electronAPI.fetchTickets(this.filters);
    if (success) {
      this.tickets = tickets;
      this.renderTicketsList();
      this.updateBadge();
    }
  }

  renderTicketsList() {
    // Renderizar lista com filtros aplicados
  }

  showTicketDetails(ticketId) {
    // Modal com detalhes completos
  }

  async createTicket(data) {
    // Formulário de novo ticket
  }

  async sendMessage(ticketId, message) {
    // Enviar mensagem no chat
  }
}
```

**c) Estilos CSS:**
```css
/* Tickets */
.tickets-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.tickets-filters {
  display: flex;
  gap: 10px;
  align-items: center;
}

.tickets-list {
  display: grid;
  gap: 15px;
}

.ticket-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.ticket-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.ticket-title {
  font-weight: 600;
  font-size: 16px;
  color: #1f2937;
}

.ticket-badges {
  display: flex;
  gap: 8px;
}

.ticket-meta {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #6b7280;
}

.ticket-unread {
  background: #ef4444;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
```

---

#### 1.3 Catálogo de Serviços

**Problema:** Clientes não conseguem solicitar serviços pelo agent

**Solução:**

**a) Nova aba "Catálogo":**
```html
<div id="catalog-page" class="tab-content" style="display: none;">
  <div class="catalog-container">
    <h2>📦 Catálogo de Serviços</h2>
    
    <!-- Categorias -->
    <div class="catalog-categories" id="catalog-categories">
      <!-- Renderizado dinamicamente -->
    </div>

    <!-- Itens -->
    <div class="catalog-items" id="catalog-items">
      <!-- Renderizado dinamicamente -->
    </div>
  </div>
</div>
```

**b) Adicionar em apiClient.js:**
```javascript
async getCatalogCategories() {
  const response = await this.axios.get('/api/catalog/categories');
  return response.data;
}

async getCatalogItems(categoryId = null) {
  const params = categoryId ? { categoryId } : {};
  const response = await this.axios.get('/api/catalog/items', { params });
  return response.data;
}

async requestCatalogItem(itemId, data) {
  const response = await this.axios.post('/api/catalog/requests', {
    catalogItemId: itemId,
    ...data
  });
  return response.data;
}
```

**c) Lógica de Catálogo:**
```javascript
class CatalogManager {
  async loadCatalog() {
    const categories = await window.electronAPI.getCatalogCategories();
    this.renderCategories(categories);
  }

  async selectCategory(categoryId) {
    const items = await window.electronAPI.getCatalogItems(categoryId);
    this.renderItems(items);
  }

  async requestItem(itemId) {
    // Modal com formulário de solicitação
    const data = await this.showRequestForm(itemId);
    const result = await window.electronAPI.requestCatalogItem(itemId, data);
    
    if (result.success) {
      this.showNotification('Solicitação enviada com sucesso!');
      // Redirecionar para tickets
      this.navigateToTickets();
    }
  }
}
```

---

#### 1.4 Base de Conhecimento

**Problema:** Clientes não têm acesso a artigos de ajuda

**Solução:**

**a) Nova aba "Base de Conhecimento":**
```html
<div id="knowledge-page" class="tab-content" style="display: none;">
  <div class="knowledge-container">
    <h2>📚 Base de Conhecimento</h2>
    
    <!-- Busca -->
    <div class="knowledge-search">
      <input type="text" id="knowledge-search" placeholder="🔍 Buscar artigos...">
    </div>

    <!-- Categorias -->
    <div class="knowledge-categories" id="knowledge-categories">
      <!-- Renderizado dinamicamente -->
    </div>

    <!-- Artigos -->
    <div class="knowledge-articles" id="knowledge-articles">
      <!-- Renderizado dinamicamente -->
    </div>
  </div>
</div>
```

**b) Adicionar em apiClient.js:**
```javascript
async getKnowledgeArticles(filters = {}) {
  const response = await this.axios.get('/api/knowledge', { params: filters });
  return response.data;
}

async getKnowledgeArticle(id) {
  const response = await this.axios.get(`/api/knowledge/${id}`);
  return response.data;
}
```

**c) Lógica de Knowledge Base:**
```javascript
class KnowledgeManager {
  async loadArticles(search = '', category = null) {
    const filters = { search, category, published: true };
    const articles = await window.electronAPI.getKnowledgeArticles(filters);
    this.renderArticles(articles);
  }

  async showArticle(articleId) {
    const article = await window.electronAPI.getKnowledgeArticle(articleId);
    this.renderArticleModal(article);
    
    // Incrementar visualizações
    await window.electronAPI.incrementArticleViews(articleId);
  }
}
```

---

### **Fase 2: Melhorias de UX** (Prioridade Média)

#### 2.1 Notificações Integradas

**Adicionar em main.js:**
```javascript
// Buscar notificações periodicamente
setInterval(async () => {
  if (apiClient.connected) {
    const notifications = await apiClient.getNotifications();
    
    notifications.forEach(notif => {
      if (!notif.read) {
        // Mostrar notificação desktop
        new Notification(notif.title, {
          body: notif.message,
          icon: path.join(__dirname, '../assets/icons/icon.png')
        });
        
        // Marcar como lida
        apiClient.markNotificationAsRead(notif.id);
      }
    });
  }
}, 60000); // A cada 1 minuto
```

---

#### 2.2 Indicadores de SLA

**Problema:** Tickets não mostram tempo restante de SLA

**Solução:**

**a) Adicionar em ticket item:**
```html
<div class="ticket-sla">
  <div class="sla-indicator" data-status="warning">
    ⏱️ 2h 30m restantes
  </div>
</div>
```

**b) Calcular SLA:**
```javascript
function calculateSLAStatus(ticket) {
  if (!ticket.sla) return null;
  
  const now = new Date();
  const deadline = new Date(ticket.slaDeadline);
  const remaining = deadline - now;
  
  if (remaining < 0) {
    return { status: 'expired', text: 'SLA Expirado', color: 'red' };
  } else if (remaining < 3600000) { // < 1 hora
    return { status: 'critical', text: formatTime(remaining), color: 'red' };
  } else if (remaining < 7200000) { // < 2 horas
    return { status: 'warning', text: formatTime(remaining), color: 'orange' };
  } else {
    return { status: 'ok', text: formatTime(remaining), color: 'green' };
  }
}
```

---

#### 2.3 Estatísticas Detalhadas

**Adicionar no Dashboard:**
```html
<div class="stats-detailed">
  <div class="stat-card">
    <h3>Tickets por Status</h3>
    <div class="stat-chart" id="tickets-by-status"></div>
  </div>
  
  <div class="stat-card">
    <h3>Tickets por Prioridade</h3>
    <div class="stat-chart" id="tickets-by-priority"></div>
  </div>
  
  <div class="stat-card">
    <h3>Tempo Médio de Resolução</h3>
    <div class="stat-value">2.5 dias</div>
  </div>
</div>
```

---

### **Fase 3: Funcionalidades Avançadas** (Prioridade Baixa)

#### 3.1 Modo Offline

**Implementar queue de sincronização:**
```javascript
class OfflineQueue {
  constructor() {
    this.queue = store.get('offline-queue', []);
  }

  add(action, data) {
    this.queue.push({
      id: Date.now(),
      action,
      data,
      timestamp: new Date()
    });
    store.set('offline-queue', this.queue);
  }

  async process() {
    while (this.queue.length > 0) {
      const item = this.queue[0];
      
      try {
        await this.executeAction(item);
        this.queue.shift();
        store.set('offline-queue', this.queue);
      } catch (error) {
        console.error('Failed to process queue item:', error);
        break;
      }
    }
  }
}
```

---

#### 3.2 Transferência de Arquivos

**Para anexos em tickets:**
```javascript
async uploadAttachment(ticketId, file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await this.axios.post(
    `/api/tickets/${ticketId}/attachments`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
  
  return response.data;
}
```

---

#### 3.3 Auto-Update

**Implementar verificação de atualizações:**
```javascript
import { autoUpdater } from 'electron-updater';

autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Atualização Disponível',
    message: 'Uma nova versão está disponível. Deseja baixar agora?',
    buttons: ['Sim', 'Depois']
  }).then(result => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});
```

---

## 📋 Checklist de Implementação

### Fase 1 - Crítico
- [ ] Implementar getUserProfile() em apiClient
- [ ] Salvar informações do usuário no store
- [ ] Criar interface completa de tickets (HTML)
- [ ] Implementar TicketManager class (JS)
- [ ] Adicionar estilos de tickets (CSS)
- [ ] Criar aba de Catálogo
- [ ] Implementar CatalogManager
- [ ] Criar aba de Base de Conhecimento
- [ ] Implementar KnowledgeManager
- [ ] Testar com usuário Cliente
- [ ] Testar com usuário Organização

### Fase 2 - Melhorias
- [ ] Sistema de notificações integrado
- [ ] Indicadores de SLA em tickets
- [ ] Estatísticas detalhadas no dashboard
- [ ] Filtros avançados de tickets
- [ ] Pesquisa em tempo real

### Fase 3 - Avançado
- [ ] Modo offline com queue
- [ ] Upload de anexos
- [ ] Auto-update
- [ ] Multi-idioma
- [ ] Temas (claro/escuro)

---

## 🎯 Prioridades Imediatas

### 1. **Autenticação Completa** (1-2 horas)
- Implementar getUserProfile
- Salvar dados do usuário
- Mostrar nome na interface

### 2. **Interface de Tickets** (3-4 horas)
- HTML completo
- JavaScript funcional
- CSS estilizado
- Testes

### 3. **Catálogo de Serviços** (2-3 horas)
- Interface básica
- Solicitação de itens
- Integração com tickets

### 4. **Base de Conhecimento** (2-3 horas)
- Listagem de artigos
- Busca
- Visualização

**Total Estimado:** 8-12 horas de desenvolvimento

---

## 📊 Métricas de Sucesso

### Funcionalidade
- ✅ 100% dos endpoints do backend consumidos
- ✅ Todas as funcionalidades acessíveis via interface
- ✅ Segregação Cliente/Organização funcionando
- ✅ Notificações em tempo real

### Performance
- ✅ Tempo de carregamento < 2s
- ✅ Sincronização < 5s
- ✅ Uso de memória < 200MB
- ✅ Uso de CPU < 5% (idle)

### UX
- ✅ Interface intuitiva
- ✅ Feedback visual em todas as ações
- ✅ Mensagens de erro claras
- ✅ Navegação fluida

---

## 🚀 Próximos Passos

1. **Revisar este documento** com a equipe
2. **Priorizar funcionalidades** conforme necessidade
3. **Implementar Fase 1** (crítico)
4. **Testar extensivamente**
5. **Deploy para usuários piloto**
6. **Coletar feedback**
7. **Implementar Fases 2 e 3**

---

**Desenvolvido por:** Kiro AI Assistant  
**Data:** 06 de Dezembro de 2024  
**Status:** 📋 Plano Completo - Pronto para Implementação
