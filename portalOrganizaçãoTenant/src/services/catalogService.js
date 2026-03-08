import api from './api'

/**
 * Catalog Service - Portal Organização
 * 
 * Serviço para acesso ao catálogo de serviços com controle de acesso (ACL).
 * Usuários da organização navegam no catálogo para criar tickets.
 */

// Cache configuration
const CACHE_CONFIG = {
  TTL: 5 * 60 * 1000, // 5 minutos
  PREFIX: 'org_catalog_'
}

// In-memory cache
const cache = {
  data: new Map(),
  timestamps: new Map()
}

/**
 * Cache utilities
 */
const cacheUtils = {
  getKey(type, id = '') {
    return `${CACHE_CONFIG.PREFIX}${type}${id ? `_${id}` : ''}`
  },

  isValid(key) {
    const timestamp = cache.timestamps.get(key)
    if (!timestamp) return false
    return Date.now() - timestamp < CACHE_CONFIG.TTL
  },

  get(key) {
    if (this.isValid(key)) {
      return cache.data.get(key)
    }
    this.remove(key)
    return null
  },

  set(key, data) {
    cache.data.set(key, data)
    cache.timestamps.set(key, Date.now())
  },

  remove(key) {
    cache.data.delete(key)
    cache.timestamps.delete(key)
  },

  clear() {
    cache.data.clear()
    cache.timestamps.clear()
  }
}

const catalogService = {
  /**
   * Obter permissões efetivas do usuário
   * @param {boolean} useCache - Usar cache (padrão: true)
   * @returns {Promise<Object>} Permissões efetivas
   */
  async getEffectiveAccess(useCache = true) {
    const cacheKey = cacheUtils.getKey('effective')
    
    if (useCache) {
      const cached = cacheUtils.get(cacheKey)
      if (cached) return cached
    }

    const response = await api.get('/catalog/effective-access')
    cacheUtils.set(cacheKey, response.data)
    return response.data
  },

  /**
   * Obter categorias acessíveis (com hierarquia)
   * @param {boolean} useCache - Usar cache (padrão: true)
   * @returns {Promise<Array>} Categorias hierárquicas
   */
  async getCategories(useCache = true) {
    const cacheKey = cacheUtils.getKey('categories')
    
    if (useCache) {
      const cached = cacheUtils.get(cacheKey)
      if (cached) return cached
    }

    const response = await api.get('/catalog/organization/categories')
    cacheUtils.set(cacheKey, response.data)
    return response.data
  },

  /**
   * Obter itens acessíveis
   * @param {Object} params - Parâmetros de filtro
   * @param {string} params.categoryId - ID da categoria
   * @param {string} params.search - Termo de busca
   * @param {boolean} useCache - Usar cache (padrão: true para lista completa)
   * @returns {Promise<Array>} Itens filtrados
   */
  async getItems(params = {}, useCache = true) {
    const hasParams = Object.keys(params).length > 0
    const cacheKey = cacheUtils.getKey('items')
    
    if (useCache && !hasParams) {
      const cached = cacheUtils.get(cacheKey)
      if (cached) return cached
    }

    const response = await api.get('/catalog/organization/items', { params })
    
    if (!hasParams) {
      cacheUtils.set(cacheKey, response.data)
    }
    
    return response.data
  },

  /**
   * Obter item específico
   * @param {string} itemId - UUID do item
   * @returns {Promise<Object>} Item
   */
  async getItemById(itemId) {
    const response = await api.get(`/catalog/organization/items/${itemId}`)
    return response.data
  },

  /**
   * Criar ticket a partir de item do catálogo
   * @param {string} itemId - UUID do item
   * @param {Object} formData - Dados do formulário customizado
   * @param {Array} attachments - Ficheiros anexados
   * @returns {Promise<Object>} Ticket criado
   */
  async createTicketFromItem(itemId, formData, attachments = []) {
    // Criar FormData para suportar upload de ficheiros
    const data = new FormData()
    data.append('formData', JSON.stringify(formData))
    
    // Adicionar ficheiros
    attachments.forEach((file, index) => {
      data.append(`attachments`, file)
    })
    
    const response = await api.post(`/catalog/organization/items/${itemId}/ticket`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    // Invalidar cache após criar ticket
    this.invalidateCatalogCache()
    
    return response.data
  },

  /**
   * Buscar itens
   * @param {string} query - Termo de busca
   * @param {Object} filters - Filtros adicionais
   * @returns {Promise<Array>} Resultados da busca
   */
  async searchItems(query, filters = {}) {
    const response = await api.get('/catalog/organization/items', {
      params: {
        search: query,
        ...filters
      }
    })
    return response.data
  },

  /**
   * Verificar se usuário tem acesso a um item
   * @param {string} itemId - UUID do item
   * @returns {Promise<boolean>} Tem acesso
   */
  async hasAccessToItem(itemId) {
    try {
      const effectiveAccess = await this.getEffectiveAccess()
      
      if (effectiveAccess.data?.accessMode === 'all') {
        return true
      }
      
      if (effectiveAccess.data?.accessMode === 'none') {
        return false
      }
      
      const allowedItems = effectiveAccess.data?.allowedItems || []
      const deniedItems = effectiveAccess.data?.deniedItems || []
      
      if (deniedItems.includes(itemId)) {
        return false
      }
      
      if (allowedItems.includes(itemId)) {
        return true
      }
      
      // Verificar categoria
      try {
        const item = await this.getItemById(itemId)
        const allowedCategories = effectiveAccess.data?.allowedCategories || []
        return allowedCategories.includes(item.data?.categoryId)
      } catch {
        return false
      }
    } catch {
      return false
    }
  },

  // ============================================
  // Cache Management
  // ============================================

  /**
   * Invalidar cache de permissões
   */
  invalidateEffectiveCache() {
    cacheUtils.remove(cacheUtils.getKey('effective'))
  },

  /**
   * Invalidar cache de catálogo
   */
  invalidateCatalogCache() {
    cacheUtils.remove(cacheUtils.getKey('categories'))
    cacheUtils.remove(cacheUtils.getKey('items'))
  },

  /**
   * Limpar todo o cache
   */
  clearCache() {
    cacheUtils.clear()
  },

  /**
   * Pré-carregar dados comuns
   */
  async preloadCache() {
    try {
      await Promise.all([
        this.getEffectiveAccess(),
        this.getCategories()
      ])
    } catch (error) {
      console.warn('Falha ao pré-carregar cache do catálogo:', error)
    }
  }
}

export default catalogService

// Export cache utilities for testing
export { cacheUtils, CACHE_CONFIG }
