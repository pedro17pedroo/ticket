/**
 * Sidebar Manager - Gerencia sidebars diferentes para Organization e Client users
 * Com controle de permissões e acesso baseado em roles
 */

// Definição de menus para ORGANIZAÇÃO (Portal Organização)
const ORGANIZATION_MENU = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    permission: 'dashboard.view',
    roles: ['org-admin', 'org-manager', 'org-technician']
  },
  {
    id: 'tickets',
    label: 'Tickets',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    badge: 'ticketsBadge',
    permission: 'tickets.view',
    roles: ['org-admin', 'org-manager', 'org-technician']
  },
  {
    id: 'catalog',
    label: 'Catálogo',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    permission: 'catalog.view',
    roles: ['org-admin', 'org-manager', 'org-technician']
  },
  {
    id: 'knowledge',
    label: 'Base de Conhecimento',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    permission: 'knowledge.view',
    roles: ['org-admin', 'org-manager', 'org-technician']
  },
  {
    id: 'info',
    label: 'Informações',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
      <path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    permission: null, // Todos podem ver
    roles: ['org-admin', 'org-manager', 'org-technician']
  },
  {
    type: 'divider'
  },
  {
    id: 'notifications',
    label: 'Notificações',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    badge: 'notificationsBadge',
    permission: null,
    roles: ['org-admin', 'org-manager', 'org-technician']
  },
  {
    type: 'divider'
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
      <path d="M12 1v6m0 6v6M23 12h-6m-6 0H1" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    permission: null,
    roles: ['org-admin', 'org-manager', 'org-technician']
  }
];

// Definição de menus para CLIENTE (Portal Cliente Empresa)
const CLIENT_MENU = [
  {
    id: 'dashboard',
    label: 'Início',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    permission: null,
    roles: ['client-admin', 'client-user']
  },
  {
    id: 'catalog',
    label: 'Catálogo de Serviços',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    permission: null,
    roles: ['client-admin', 'client-user']
  },
  {
    id: 'my-requests',
    label: 'Minhas Solicitações',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    badge: 'ticketsBadge',
    permission: null,
    roles: ['client-admin', 'client-user']
  },
  {
    id: 'todos',
    label: 'Minhas Tarefas',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    permission: null,
    roles: ['client-admin', 'client-user']
  },
  {
    id: 'knowledge',
    label: 'Base de Conhecimento',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    permission: null,
    roles: ['client-admin', 'client-user']
  },
  {
    id: 'my-assets',
    label: 'Meus Equipamentos',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
      <path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    permission: null,
    roles: ['client-admin', 'client-user']
  },
  {
    id: 'hours-bank',
    label: 'Bolsa de Horas',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
      <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    permission: null,
    roles: ['client-admin', 'client-user']
  },
  {
    type: 'divider'
  },
  {
    id: 'notifications',
    label: 'Notificações',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    badge: 'notificationsBadge',
    permission: null,
    roles: ['client-admin', 'client-user']
  },
  {
    type: 'divider'
  },
  {
    id: 'organization',
    label: 'Organização',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 21h18M3 7v14M21 7v14M9 21V7M15 21V7M3 7l9-4 9 4M9 11h.01M9 15h.01M15 11h.01M15 15h.01" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    permission: null,
    roles: ['client-admin'] // Apenas para client-admin
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
      <path d="M12 1v6m0 6v6M23 12h-6m-6 0H1" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    permission: null,
    roles: ['client-admin', 'client-user']
  }
];

/**
 * Verifica se o usuário tem permissão para acessar um item do menu
 * @param {Object} menuItem - Item do menu
 * @param {Object} user - Usuário logado
 * @param {Object} context - Contexto atual
 * @returns {boolean}
 */
function hasPermission(menuItem, user, context) {
  // Se não tem permissão definida, todos podem acessar
  if (!menuItem.permission) {
    return true;
  }
  
  // Verificar role
  if (menuItem.roles && !menuItem.roles.includes(user.role)) {
    return false;
  }
  
  // Verificar permissão no contexto (se disponível)
  if (context && context.permissions) {
    return context.permissions.includes(menuItem.permission);
  }
  
  // Por padrão, permitir se não houver sistema de permissões
  return true;
}

/**
 * Renderiza a sidebar baseada no tipo de usuário
 * @param {Object} user - Usuário logado
 * @param {Object} context - Contexto atual
 */
export function renderSidebar(user, context) {
  console.log('🎨 Renderizando sidebar para:', user.userType, user.role);
  
  const sidebarNav = document.querySelector('.sidebar-nav');
  if (!sidebarNav) {
    console.error('❌ Elemento .sidebar-nav não encontrado');
    return;
  }
  
  // Selecionar menu baseado no tipo de usuário
  const menu = user.userType === 'organization' ? ORGANIZATION_MENU : CLIENT_MENU;
  
  // Filtrar itens por permissão
  const filteredMenu = menu.filter(item => {
    if (item.type === 'divider') return true;
    return hasPermission(item, user, context);
  });
  
  // Renderizar HTML
  const html = filteredMenu.map(item => {
    if (item.type === 'divider') {
      return '<div class="nav-divider"></div>';
    }
    
    const badgeHtml = item.badge ? `<span class="badge" id="${item.badge}" style="display: none;">0</span>` : '';
    
    return `
      <a href="#" class="nav-item" data-page="${item.id}">
        ${item.icon}
        <span>${item.label}</span>
        ${badgeHtml}
      </a>
    `;
  }).join('');
  
  sidebarNav.innerHTML = html;
  
  // Adicionar event listeners aos itens do menu
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      console.log('🖱️ Clique no menu:', page);
      
      // Chamar função de navegação global
      if (typeof window.navigateTo === 'function') {
        window.navigateTo(page);
      } else if (typeof window.showPage === 'function') {
        window.showPage(page);
      } else {
        console.error('❌ Função de navegação não encontrada');
      }
    });
  });
  
  // Reativar primeira página
  const firstItem = sidebarNav.querySelector('.nav-item');
  if (firstItem) {
    firstItem.classList.add('active');
  }
  
  console.log('✅ Sidebar renderizada com', filteredMenu.length, 'itens e event listeners configurados');
}

/**
 * Atualiza a sidebar quando o contexto muda
 * @param {Object} user - Usuário logado
 * @param {Object} context - Novo contexto
 */
export function updateSidebarOnContextChange(user, context) {
  console.log('🔄 Atualizando sidebar após mudança de contexto');
  renderSidebar(user, context);
}

/**
 * Obtém o menu atual baseado no tipo de usuário
 * @param {string} userType - Tipo de usuário ('organization' ou 'client')
 * @returns {Array}
 */
export function getMenuForUserType(userType) {
  return userType === 'organization' ? ORGANIZATION_MENU : CLIENT_MENU;
}
