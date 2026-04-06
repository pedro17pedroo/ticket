/**
 * Catálogo de Serviços - Desktop Agent
 * Baseado no portal cliente empresa com ícones dinâmicos e modal completo
 */

// Mapeamento de ícones (similar ao DynamicIcon do portal)
const ICON_MAP = {
  // Português
  'backup': '💾',
  'email': '📧',
  'comunicacao': '📧',
  'comunicação': '📧',
  'hardware': '💻',
  'equipamentos': '💻',
  'infraestrutura': '🏢',
  'servidores': '🖥️',
  'outros': '📦',
  'acesso': '🔐',
  'autenticacao': '🛡️',
  'autenticação': '🛡️',
  'recuperacao': '🔄',
  'recuperação': '🔄',
  'rede': '📡',
  'conectividade': '📡',
  'seguranca': '🛡️',
  'segurança': '🛡️',
  'software': '📦',
  'aplicacoes': '📱',
  'aplicações': '📱',
  'telefonia': '📞',
  'voip': '📞',
  'tecnologias': '💻',
  'informacao': '💻',
  'informação': '💻',
  'facilities': '🏢',
  'recursos': '👥',
  'humanos': '👥',
  'monitor': '🖥️',
  'building': '🏢',
  'users': '👥',
  'box': '📦',
  'printer': '🖨️',
  'wifi': '📡',
  'database': '🗄️',
  'server': '🖥️',
  'harddrive': '💾',
  'cpu': '⚙️',
  'laptop': '💻',
  'smartphone': '📱',
  'package': '📦',
  'filetext': '📄',
  'settings': '⚙️',
  'wrench': '🔧',
  'key': '🔑',
  'lock': '🔒',
  'shield': '🛡️',
  'mail': '📧',
  'messagesquare': '💬',
  'headphones': '🎧',
  'helpcircle': '❓',
  'clipboard': '📋',
  'shoppingcart': '🛒',
  'clock': '⏰',
  'checkcircle': '✅',
  'xcircle': '❌',
  'alertcircle': '⚠️',
  'eye': '👁️',
  'calendar': '📅'
};

/**
 * Obter ícone baseado no nome ou categoria
 */
function getIcon(iconName, fallback = '📦') {
  if (!iconName) return fallback;
  
  // Se já é emoji, retornar
  if (/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u.test(iconName)) {
    return iconName;
  }
  
  // Normalizar nome
  const normalized = iconName.toLowerCase().replace(/[-_\s]/g, '');
  
  // Buscar no mapa
  return ICON_MAP[normalized] || fallback;
}

/**
 * Estado do catálogo
 */
const catalogState = {
  categories: [],
  items: [],
  selectedCategory: null,
  searchTerm: '',
  currentItem: null,
  formData: {}
};

/**
 * Carregar catálogo
 */
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

/**
 * Renderizar categorias
 */
function renderCatalogCategories() {
  const container = document.getElementById('catalogCategories');
  if (!container) return;
  
  if (catalogState.categories.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">📦</div>
        <p style="color: #64748b;">Nenhuma categoria disponível</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = catalogState.categories.map(cat => {
    const icon = getIcon(cat.icon, '📦');
    const isActive = catalogState.selectedCategory === cat.id;
    
    return `
      <div 
        class="catalog-category-card ${isActive ? 'active' : ''}" 
        data-category-id="${cat.id}"
        style="
          padding: 1.5rem;
          background: ${isActive ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'};
          color: ${isActive ? 'white' : '#1e293b'};
          border: 2px solid ${isActive ? '#667eea' : '#e2e8f0'};
          border-radius: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          min-height: 180px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        "
      >
        <div style="
          font-size: 3rem; 
          margin-bottom: 1rem;
          background: ${isActive ? 'rgba(255,255,255,0.2)' : 'rgba(102,126,234,0.1)'};
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        ">${icon}</div>
        <div style="font-weight: 600; font-size: 1.125rem; margin-bottom: 0.5rem;">${escapeHTML(cat.name)}</div>
        ${cat.description ? `<div style="font-size: 0.875rem; opacity: 0.9; line-height: 1.4;">${escapeHTML(cat.description)}</div>` : ''}
      </div>
    `;
  }).join('');
  
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
          renderCatalogCategories();
          renderCatalogItems();
        }
      } catch (error) {
        console.error('Erro ao carregar itens:', error);
        showNotification('Erro ao carregar itens', 'error');
      } finally {
        hideLoading();
      }
    });
    
    // Hover effects
    card.addEventListener('mouseenter', function() {
      if (!this.classList.contains('active')) {
        this.style.transform = 'translateY(-4px)';
        this.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.2)';
      }
    });
    
    card.addEventListener('mouseleave', function() {
      if (!this.classList.contains('active')) {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
      }
    });
  });
}

/**
 * Renderizar itens do catálogo
 */
function renderCatalogItems() {
  const container = document.getElementById('catalogItems');
  if (!container) return;
  
  let items = catalogState.items;
  
  // Filtrar por busca
  if (catalogState.searchTerm) {
    const search = catalogState.searchTerm.toLowerCase();
    items = items.filter(item => 
      item.name.toLowerCase().includes(search) ||
      (item.description && item.description.toLowerCase().includes(search)) ||
      (item.shortDescription && item.shortDescription.toLowerCase().includes(search))
    );
  }
  
  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">🔍</div>
        <h3 style="font-size: 1.25rem; font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">Nenhum item encontrado</h3>
        <p style="color: #64748b;">
          ${catalogState.searchTerm ? 'Tente ajustar sua pesquisa' : 'Selecione uma categoria para ver os serviços disponíveis'}
        </p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = items.map(item => {
    const icon = getIcon(item.icon || item.category?.icon, '📦');
    
    return `
      <div 
        class="catalog-item-card"
        data-item-id="${item.id}"
        style="
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        "
      >
        <div style="display: flex; align-items: start; gap: 1rem; margin-bottom: 1rem;">
          <div style="
            font-size: 2.5rem;
            background: rgba(102,126,234,0.1);
            width: 60px;
            height: 60px;
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          ">${icon}</div>
          <div style="flex: 1; min-width: 0;">
            <h3 style="font-size: 1.125rem; font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">${escapeHTML(item.name)}</h3>
            ${item.shortDescription || item.description ? `
              <p style="font-size: 0.875rem; color: #64748b; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                ${escapeHTML(item.shortDescription || item.description)}
              </p>
            ` : ''}
          </div>
        </div>
        
        <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid #f1f5f9;">
          ${item.estimatedDeliveryTime ? `
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem;">
              <span>⏰</span>
              <span>${item.estimatedDeliveryTime}h estimadas</span>
            </div>
          ` : ''}
          
          ${item.estimatedCost ? `
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem;">
              <span>💰</span>
              <span>${item.estimatedCost} ${item.costCurrency || 'EUR'}</span>
            </div>
          ` : ''}
          
          ${item.requiresApproval ? `
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #f59e0b; margin-bottom: 0.5rem;">
              <span>✅</span>
              <span>Requer aprovação</span>
            </div>
          ` : ''}
          
          <button 
            class="btn btn-primary" 
            style="margin-top: 1rem; width: 100%; padding: 0.75rem; font-weight: 600;"
            onclick="requestCatalogItem('${item.id}')"
          >
            Solicitar Serviço
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  // Hover effects
  container.querySelectorAll('.catalog-item-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-4px)';
      this.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
      this.style.borderColor = '#667eea';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = 'none';
      this.style.borderColor = '#e2e8f0';
    });
  });
}

/**
 * Solicitar item do catálogo
 */
async function requestCatalogItem(itemId) {
  const item = catalogState.items.find(i => i.id === itemId);
  if (!item) return;
  
  catalogState.currentItem = item;
  catalogState.formData = {};
  
  // Criar modal de solicitação
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;';
  
  const icon = getIcon(item.icon || item.category?.icon, '📦');
  
  modal.innerHTML = `
    <div class="modal-content" style="
      background: white;
      border-radius: 1rem;
      max-width: 700px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    ">
      <div class="modal-header" style="
        padding: 1.5rem;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: start;
        gap: 1rem;
      ">
        <div style="
          font-size: 2.5rem;
          background: rgba(102,126,234,0.1);
          width: 60px;
          height: 60px;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        ">${icon}</div>
        <div style="flex: 1;">
          <h2 style="font-size: 1.5rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">
            ${escapeHTML(item.name)}
          </h2>
          ${item.fullDescription || item.description ? `
            <p style="font-size: 0.875rem; color: #64748b; line-height: 1.5;">
              ${escapeHTML(item.fullDescription || item.description)}
            </p>
          ` : ''}
        </div>
        <button 
          class="modal-close" 
          onclick="this.closest('.modal-overlay').remove()"
          style="
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #64748b;
            cursor: pointer;
            padding: 0.25rem;
            line-height: 1;
          "
        >&times;</button>
      </div>
      
      <div class="modal-body" style="padding: 1.5rem;">
        <form id="catalogRequestForm" onsubmit="submitCatalogRequest(event, '${itemId}'); return false;">
          ${item.customFields && item.customFields.length > 0 ? 
            item.customFields.map(field => renderFormField(field)).join('') :
            `
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label style="display: block; font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">
                  Justificativa / Detalhes
                  <span style="color: #ef4444;">*</span>
                </label>
                <textarea 
                  id="catalogRequestJustification" 
                  name="justification"
                  rows="4" 
                  required
                  placeholder="Explique por que você precisa deste serviço e forneça detalhes relevantes..."
                  style="
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.5rem;
                    font-family: inherit;
                    font-size: 0.875rem;
                    resize: vertical;
                    transition: border-color 0.2s;
                  "
                  onfocus="this.style.borderColor='#667eea'; this.style.outline='none';"
                  onblur="this.style.borderColor='#e2e8f0';"
                ></textarea>
              </div>
            `
          }
          
          ${item.requiresApproval ? `
            <div style="
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 1rem;
              border-radius: 0.5rem;
              margin-bottom: 1.5rem;
            ">
              <div style="display: flex; align-items: start; gap: 0.75rem;">
                <span style="font-size: 1.25rem;">⚠️</span>
                <div>
                  <strong style="color: #92400e; display: block; margin-bottom: 0.25rem;">Requer Aprovação</strong>
                  <p style="color: #78350f; font-size: 0.875rem; margin: 0;">
                    Esta solicitação será enviada para aprovação do seu gestor antes de ser processada.
                  </p>
                </div>
              </div>
            </div>
          ` : ''}
          
          ${item.estimatedDeliveryTime || item.estimatedCost ? `
            <div style="
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 0.5rem;
              padding: 1rem;
              margin-bottom: 1.5rem;
            ">
              <h4 style="font-size: 0.875rem; font-weight: 600; color: #1e293b; margin-bottom: 0.75rem;">
                Informações do Serviço
              </h4>
              ${item.estimatedDeliveryTime ? `
                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem;">
                  <span>⏰</span>
                  <span>Tempo estimado: ${item.estimatedDeliveryTime}h</span>
                </div>
              ` : ''}
              ${item.estimatedCost ? `
                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #64748b;">
                  <span>💰</span>
                  <span>Custo estimado: ${item.estimatedCost} ${item.costCurrency || 'EUR'}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          <div style="display: flex; gap: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
            <button 
              type="button"
              class="btn btn-secondary" 
              onclick="this.closest('.modal-overlay').remove()"
              style="flex: 1; padding: 0.75rem; font-weight: 600;"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              class="btn btn-primary" 
              style="flex: 1; padding: 0.75rem; font-weight: 600;"
            >
              ${item.requiresApproval ? 'Enviar para Aprovação' : 'Solicitar Serviço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Focus no primeiro campo
  setTimeout(() => {
    const firstInput = modal.querySelector('input, textarea, select');
    if (firstInput) firstInput.focus();
  }, 100);
}

/**
 * Renderizar campo de formulário
 */
function renderFormField(field) {
  const commonStyles = `
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-family: inherit;
    font-size: 0.875rem;
    transition: border-color 0.2s;
  `;
  
  const focusEvents = `
    onfocus="this.style.borderColor='#667eea'; this.style.outline='none';"
    onblur="this.style.borderColor='#e2e8f0';"
  `;
  
  let fieldHTML = '';
  
  switch (field.type) {
    case 'text':
      fieldHTML = `
        <input
          type="text"
          id="field_${field.name}"
          name="${field.name}"
          ${field.required ? 'required' : ''}
          placeholder="${field.placeholder || ''}"
          style="${commonStyles}"
          ${focusEvents}
        />
      `;
      break;
      
    case 'textarea':
      fieldHTML = `
        <textarea
          id="field_${field.name}"
          name="${field.name}"
          ${field.required ? 'required' : ''}
          placeholder="${field.placeholder || ''}"
          rows="${field.rows || 4}"
          style="${commonStyles} resize: vertical;"
          ${focusEvents}
        ></textarea>
      `;
      break;
      
    case 'number':
      fieldHTML = `
        <input
          type="number"
          id="field_${field.name}"
          name="${field.name}"
          ${field.required ? 'required' : ''}
          ${field.min !== undefined ? `min="${field.min}"` : ''}
          ${field.max !== undefined ? `max="${field.max}"` : ''}
          placeholder="${field.placeholder || ''}"
          style="${commonStyles}"
          ${focusEvents}
        />
      `;
      break;
      
    case 'select':
      fieldHTML = `
        <select
          id="field_${field.name}"
          name="${field.name}"
          ${field.required ? 'required' : ''}
          style="${commonStyles}"
          ${focusEvents}
        >
          <option value="">Selecione...</option>
          ${field.options ? field.options.map(opt => `
            <option value="${opt.value}">${opt.label}</option>
          `).join('') : ''}
        </select>
      `;
      break;
      
    case 'checkbox':
      fieldHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <input
            type="checkbox"
            id="field_${field.name}"
            name="${field.name}"
            style="width: 1.25rem; height: 1.25rem; cursor: pointer;"
          />
          <label for="field_${field.name}" style="cursor: pointer; font-size: 0.875rem;">
            ${field.label}
          </label>
        </div>
      `;
      break;
      
    case 'date':
      fieldHTML = `
        <input
          type="date"
          id="field_${field.name}"
          name="${field.name}"
          ${field.required ? 'required' : ''}
          style="${commonStyles}"
          ${focusEvents}
        />
      `;
      break;
      
    default:
      return '';
  }
  
  return `
    <div class="form-group" style="margin-bottom: 1.5rem;">
      ${field.type !== 'checkbox' ? `
        <label style="display: block; font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">
          ${field.label}
          ${field.required ? '<span style="color: #ef4444;">*</span>' : ''}
        </label>
      ` : ''}
      ${field.description ? `
        <p style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.5rem;">${field.description}</p>
      ` : ''}
      ${fieldHTML}
    </div>
  `;
}

/**
 * Submeter solicitação de catálogo
 */
async function submitCatalogRequest(event, itemId) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  const data = {};
  
  // Converter FormData para objeto
  for (let [key, value] of formData.entries()) {
    data[key] = value;
  }
  
  try {
    showLoading('Enviando solicitação...');
    
    const result = await window.electronAPI.requestCatalogItem(itemId, data);
    
    if (result.success) {
      const item = catalogState.currentItem;
      if (item && item.requiresApproval) {
        showNotification('Solicitação enviada para aprovação!', 'success');
      } else {
        showNotification('Ticket criado com sucesso!', 'success');
      }
      
      // Fechar modal
      document.querySelector('.modal-overlay')?.remove();
      
      // Redirecionar para minhas solicitações após 1.5s
      setTimeout(() => {
        if (window.showPage) {
          window.showPage('my-requests');
        }
      }, 1500);
    } else {
      throw new Error(result.error || 'Erro ao criar solicitação');
    }
    
  } catch (error) {
    console.error('Erro ao submeter solicitação:', error);
    showNotification(error.message || 'Erro ao enviar solicitação', 'error');
  } finally {
    hideLoading();
  }
}

/**
 * Configurar busca no catálogo
 */
function setupCatalogSearch() {
  const searchInput = document.getElementById('catalogSearchInput');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', (e) => {
    catalogState.searchTerm = e.target.value;
    renderCatalogItems();
  });
}

// Expor funções globalmente
window.loadCatalog = loadCatalog;
window.requestCatalogItem = requestCatalogItem;
window.submitCatalogRequest = submitCatalogRequest;
window.setupCatalogSearch = setupCatalogSearch;
