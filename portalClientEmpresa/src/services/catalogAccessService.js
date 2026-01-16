/**
 * Catalog Access Service - Client Portal
 * 
 * Provides methods for accessing catalog with permission filtering.
 * Includes local caching for improved performance.
 * 
 * Feature: catalog-access-control
 * Requirements: 7.5, 4.1, 4.2, 4.3
 */

import api from './api'

// Cache configuration
const CACHE_CONFIG = {
  // Cache TTL in milliseconds (5 minutes)
  TTL: 5 * 60 * 1000,
  // Cache keys prefix
  PREFIX: 'catalog_access_'
}

// In-memory cache store
const cache = {
  data: new Map(),
  timestamps: new Map()
}

/**
 * Cache utility functions
 */
const cacheUtils = {
  /**
   * Generate cache key
   * @param {string} type - Cache type
   * @param {string} id - Entity ID (optional)
   * @returns {string} Cache key
   */
  getKey(type, id = '') {
    return `${CACHE_CONFIG.PREFIX}${type}${id ? `_${id}` : ''}`
  },

  /**
   * Check if cache entry is valid (not expired)
   * @param {string} key - Cache key
   * @returns {boolean} Is valid
   */
  isValid(key) {
    const timestamp = cache.timestamps.get(key)
    if (!timestamp) return false
    return Date.now() - timestamp < CACHE_CONFIG.TTL
  },

  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null if expired/missing
   */
  get(key) {
    if (this.isValid(key)) {
      return cache.data.get(key)
    }
    this.remove(key)
    return null
  },

  /**
   * Set cache data
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  set(key, data) {
    cache.data.set(key, data)
    cache.timestamps.set(key, Date.now())
  },

  /**
   * Remove cache entry
   * @param {string} key - Cache key
   */
  remove(key) {
    cache.data.delete(key)
    cache.timestamps.delete(key)
  },

  /**
   * Clear all cache entries
   */
  clear() {
    cache.data.clear()
    cache.timestamps.clear()
  }
}

const catalogAccessService = {
  /**
   * Get current user's effective catalog permissions
   * @param {boolean} useCache - Whether to use cache (default: true)
   * @returns {Promise<Object>} Effective permissions
   * Requirements: 7.5
   */
  async getEffectiveAccess(useCache = true) {
    const cacheKey = cacheUtils.getKey('effective')
    
    if (useCache) {
      const cached = cacheUtils.get(cacheKey)
      if (cached) {
        return cached
      }
    }

    const response = await api.get('/catalog/effective-access')
    cacheUtils.set(cacheKey, response.data)
    return response.data
  },

  /**
   * Get filtered catalog categories based on user permissions
   * @param {boolean} useCache - Whether to use cache (default: true)
   * @returns {Promise<Array>} Filtered categories list
   * Requirements: 4.1
   */
  async getCategories(useCache = true) {
    const cacheKey = cacheUtils.getKey('categories')
    
    if (useCache) {
      const cached = cacheUtils.get(cacheKey)
      if (cached) {
        return cached
      }
    }

    const response = await api.get('/catalog/categories')
    cacheUtils.set(cacheKey, response.data)
    return response.data
  },

  /**
   * Get filtered catalog items based on user permissions
   * @param {Object} params - Query parameters (categoryId, search, etc.)
   * @param {boolean} useCache - Whether to use cache (default: true for no params)
   * @returns {Promise<Array>} Filtered items list
   * Requirements: 4.1, 4.2
   */
  async getItems(params = {}, useCache = true) {
    // Only cache if no params (full list)
    const hasParams = Object.keys(params).length > 0
    const cacheKey = cacheUtils.getKey('items')
    
    if (useCache && !hasParams) {
      const cached = cacheUtils.get(cacheKey)
      if (cached) {
        return cached
      }
    }

    const response = await api.get('/catalog/items', { params })
    
    if (!hasParams) {
      cacheUtils.set(cacheKey, response.data)
    }
    
    return response.data
  },

  /**
   * Get a specific catalog item by ID
   * @param {string} itemId - Item UUID
   * @returns {Promise<Object>} Catalog item
   * Requirements: 4.3
   */
  async getItemById(itemId) {
    const response = await api.get(`/catalog/items/${itemId}`)
    return response.data
  },

  /**
   * Search catalog items with permission filtering
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Search results
   * Requirements: 4.2
   */
  async searchItems(query, filters = {}) {
    const response = await api.get('/catalog/items', {
      params: {
        search: query,
        ...filters
      }
    })
    return response.data
  },

  /**
   * Check if user has access to a specific item
   * @param {string} itemId - Item UUID
   * @returns {Promise<boolean>} Has access
   * Requirements: 4.3
   */
  async hasAccessToItem(itemId) {
    try {
      const effectiveAccess = await this.getEffectiveAccess()
      
      // If access mode is 'all', user has access to all public items
      if (effectiveAccess.data?.accessMode === 'all') {
        return true
      }
      
      // If access mode is 'none', user has no access
      if (effectiveAccess.data?.accessMode === 'none') {
        return false
      }
      
      // Check if item is in allowed items or its category is allowed
      const allowedItems = effectiveAccess.data?.allowedItems || []
      const allowedCategories = effectiveAccess.data?.allowedCategories || []
      const deniedItems = effectiveAccess.data?.deniedItems || []
      
      // Denied items take precedence
      if (deniedItems.includes(itemId)) {
        return false
      }
      
      // Check if item is explicitly allowed
      if (allowedItems.includes(itemId)) {
        return true
      }
      
      // Need to check category - fetch item details
      try {
        const item = await this.getItemById(itemId)
        return allowedCategories.includes(item.data?.categoryId)
      } catch {
        return false
      }
    } catch {
      return false
    }
  },

  // ============================================
  // Cache Management Methods
  // ============================================

  /**
   * Invalidate effective permissions cache
   */
  invalidateEffectiveCache() {
    cacheUtils.remove(cacheUtils.getKey('effective'))
  },

  /**
   * Invalidate catalog data cache
   */
  invalidateCatalogCache() {
    cacheUtils.remove(cacheUtils.getKey('categories'))
    cacheUtils.remove(cacheUtils.getKey('items'))
  },

  /**
   * Clear all cached data
   */
  clearCache() {
    cacheUtils.clear()
  },

  /**
   * Preload common data into cache
   * @returns {Promise<void>}
   */
  async preloadCache() {
    try {
      await Promise.all([
        this.getEffectiveAccess(),
        this.getCategories()
      ])
    } catch (error) {
      console.warn('Failed to preload catalog access cache:', error)
    }
  }
}

export default catalogAccessService

// Export cache utilities for testing
export { cacheUtils, CACHE_CONFIG }
