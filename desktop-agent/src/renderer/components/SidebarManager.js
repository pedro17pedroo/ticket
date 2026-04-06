/**
 * SidebarManager - Gerencia sidebars diferentes para Organization e Client
 * Baseado nos portais portalOrganizaçãoTenant e portalClientEmpresa
 */

export class SidebarManager {
  constructor() {
    this.currentUserType = null;
    this.currentRole = null;
    this.permissions = [];
  }

  /**
   * Inicializar sidebar baseado no contexto do usuário
   * @param {Object} context - Contexto do usuário (user, context, permissions)
   */
  initialize(context) {
    console.log('🎨 Inicializando sidebar para contexto:', context);
    
    this.currentUserType = context?.context?.contextType || context?.user?.userType;
    this.currentRole = context?.user?.role;
    this.permissions = context?.context?.permissions || [];
    
    console.log('📋 Tipo de usuário:', this.currentUserType);
    console.log('🔑 Role:', this.currentRole);
    console.log('🛡️ Permissões:', this.permissions);
    
    this.renderSidebar();
  }

  /**
   * Verificar se usuário tem permissão
   * @param {string} permission - Nome da permissão
   * @returns {boolean}
   */
  hasPermission(permission) {
    if (!permission) return true; // Sem permissão específica = todos podem acessar
    if (!this.permissions || this.permissions.length === 0) return false;
    
    // Verificar se tem a permissão exata
    if (this.permissions.includes(permission)) return true;
    
    // Verificar permissões wildcard (ex: tickets.* permite tickets.view, tickets.create, etc)
    const permissionParts = permission.split('.');
    const wildcardPermission = permissionParts[0] + '.*';
    if (this.permissions.includes(wildcardPermission)) return true;
    
    // Admin tem todas as permissões
    if (this.permissions.includes('*') || this.permissions.includes('admin.*')) return true;
    
    return false;
  }

  /**
   * Filtrar itens de menu por permissão
   * @param {Array} items - Array de itens de menu
   * @returns {Array} - Itens filtrados
   */
  filterByPermission(items) {
    return items.filter(item => this.hasPermission(item.permission));
  }

  /**
   * Obter menu para Portal Organização
   * @returns {Array} - Array de itens de menu
   */
  getOrganizationMenu() {
    const allItems = [
      // Main menu
      { 
        id: 'dashboard', 
        label: 'Dashboard', 
        icon: 'dashboard', 
        page: 'dashboard',
        permission: 'dashboard.view'
      },
      { 
        id: 'tickets-new', 
        label: 'Novo Ticket', 
        icon: 'file-plus', 
        page: 'tickets',
        action: 'new',
        permission: 'tickets.create'
      },
      { 
        id: 'tickets', 
        label: 'Tickets', 
        icon: 'ticket', 
        page: 'tickets',
        permission: 'tickets.view'
      },
      
      // Catálogo de Serviços
      { 
        id: 'catalog', 
        label: 'Catálogo de Serviços', 
        icon: 'shopping-cart', 
        page: 'catalog',
        permission: 'catalog.view'
      },
      
      // Base de Conhecimento
      { 
        id: 'knowledge', 
        label: 'Base de Conhecimento', 
        icon: 'book', 
        page: 'knowledge',
        permission: 'knowledge.view'
      },
      
      // Tarefas (To-Do)
      { 
        id: 'todos', 
        label: 'Minhas Tarefas', 
        icon: 'check-square', 
        page: 'todos',
        permission: null // Todos podem acessar
      },
      
      // Inventário
      { 
        id: 'inventory', 
        label: 'Inventário', 
        icon: 'hard-drive', 
        page: 'info',
        permission: 'inventory.view'
      },
      
      // Notificações
      { 
        id: 'notifications', 
        label: 'Notificações', 
        icon: 'bell', 
        page: 'notifications',
        permission: null
      },
      
      // Configurações
      { 
        id: 'settings', 
        label: 'Configurações', 
        icon: 'settings', 
        page: 'settings',
        permission: null
      },
    ];

    return this.filterByPermission(allItems);
  }

  /**
   * Obter menu para Portal Cliente
   * @returns {Array} - Array de itens de menu
   */
  getClientMenu() {
    const isClientAdmin = this.currentRole === 'client-admin';
    
    const allItems = [
      { 
        id: 'dashboard', 
        label: 'Início', 
        icon: 'home', 
        page: 'dashboard',
        permission: null
      },
      { 
        id: 'catalog', 
        label: 'Catálogo de Serviços', 
        icon: 'shopping-cart', 
        page: 'catalog',
        permission: null
      },
      { 
        id: 'my-requests', 
        label: 'Minhas Solicitações', 
        icon: 'shopping-bag', 
        page: 'tickets',
        permission: null
      },
      { 
        id: 'todos', 
        label: 'Minhas Tarefas', 
        icon: 'check-square', 
        page: 'todos',
        permission: null
      },
      { 
        id: 'knowledge', 
        label: 'Base de Conhecimento', 
        icon: 'book', 
        page: 'knowledge',
        permission: null
      },
      { 
        id: 'my-assets', 
        label: 'Meus Equipamentos', 
        icon: 'hard-drive', 
        page: 'info',
        permission: null
      },
      { 
        id: 'notifications', 
        label: 'Notificações', 
        icon: 'bell', 
        page: 'notifications',
        permission: null
      },
      { 
        id: 'settings', 
        label: 'Configurações', 
        icon: 'settings', 
        page: 'settings',
        permission: null
      },
    ];

    // Adicionar item de Organização apenas para client-admin
    if (isClientAdmin) {
      allItems.splice(allItems.length - 2, 0, {
        id: 'organization',
        label: 'Organização',
        icon: 'building',
        page: 'organization',
        permission: null
      });
    }

    return allItems;
  }

  /**
   * Obter ícone SVG para um tipo de ícone
   * @param {string} iconType - Tipo do ícone
   * @returns {string} - HTML do SVG
   */
  getIconSVG(iconType) {
    const icons = {
      'dashboard': '<rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>',
      'home': '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" stroke-width="2"/><path d="M9 22V12h6v10" stroke="currentColor" stroke-width="2"/>',
      'ticket': '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="2"/>',
      'file-plus': '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="2"/><path d="M14 2v6h6M12 18v-6M9 15h6" stroke="currentColor" stroke-width="2"/>',
      'shopping-cart': '<circle cx="9" cy="21" r="1" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="21" r="1" stroke="currentColor" stroke-width="2"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" stroke="currentColor" stroke-width="2"/>',
      'shopping-bag': '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" stroke-width="2"/><path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" stroke-width="2"/>',
      'check-square': '<path d="M9 11l3 3L22 4" stroke="currentColor" stroke-width="2"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" stroke-width="2"/>',
      'book': '<path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" stroke-width="2"/>',
      'hard-drive': '<rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 21h8M12 17v4M6 7h.01M6 11h.01" stroke="currentColor" stroke-width="2"/>',
      'bell': '<path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="currentColor" stroke-width="2"/>',
      'settings': '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/><path d="M12 1v6m0 6v6M23 12h-6m-6 0H1" stroke="currentColor" stroke-width="2"/>',
      'building': '<path d="M3 21h18M3 7v14M21 7v14M9 21V7M15 21V7M3 7l9-4 9 4M9 11h.01M9 15h.01M15 11h.01M15 15h.01" stroke="currentColor" stroke-width="2"/>',
    };

    return icons[iconType] || icons['dashboard'];
  }

  /**
   * Renderizar sidebar baseado no tipo de usuário
   */
  renderSidebar() {
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (!sidebarNav) {
      console.error('❌ Elemento .sidebar-nav não encontrado');
      return;
    }

    // Obter menu apropriado
    const menuItems = this.currentUserType === 'client' 
      ? this.getClientMenu() 
      : this.getOrganizationMenu();

    console.log('📋 Renderizando', menuItems.length, 'itens de menu para', this.currentUserType);

    // Limpar sidebar atual
    sidebarNav.innerHTML = '';

    // Renderizar cada item
    menuItems.forEach((item, index) => {
      const navItem = document.createElement('a');
      navItem.href = '#';
      navItem.className = 'nav-item';
      navItem.dataset.page = item.page;
      
      // Primeiro item ativo por padrão
      if (index === 0) {
        navItem.classList.add('active');
      }

      // Adicionar ação especial se houver
      if (item.action) {
        navItem.dataset.action = item.action;
      }

      // SVG do ícone
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '20');
      svg.setAttribute('height', '20');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.innerHTML = this.getIconSVG(item.icon);

      // Label
      const span = document.createElement('span');
      span.textContent = item.label;

      // Badge para tickets (se aplicável)
      if (item.id === 'tickets' || item.id === 'my-requests') {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.id = 'ticketsBadge';
        badge.textContent = '0';
        navItem.appendChild(svg);
        navItem.appendChild(span);
        navItem.appendChild(badge);
      } else if (item.id === 'notifications') {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.id = 'notificationsBadge';
        badge.style.display = 'none';
        badge.textContent = '0';
        navItem.appendChild(svg);
        navItem.appendChild(span);
        navItem.appendChild(badge);
      } else {
        navItem.appendChild(svg);
        navItem.appendChild(span);
      }

      sidebarNav.appendChild(navItem);
    });

    // Adicionar divider antes de configurações
    const divider = document.createElement('div');
    divider.className = 'nav-divider';
    
    // Inserir divider antes do último item (configurações)
    const lastItem = sidebarNav.lastElementChild;
    if (lastItem) {
      sidebarNav.insertBefore(divider, lastItem);
    }

    console.log('✅ Sidebar renderizada com sucesso');
  }

  /**
   * Atualizar sidebar quando contexto mudar
   * @param {Object} context - Novo contexto
   */
  updateContext(context) {
    console.log('🔄 Atualizando contexto da sidebar');
    this.initialize(context);
  }
}

// Exportar instância singleton
export const sidebarManager = new SidebarManager();
