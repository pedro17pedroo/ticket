/**
 * Catalog Access Service - Frontend API calls for Catalog Access Control
 * 
 * Provides methods for managing catalog access permissions for clients and client users.
 * Includes local caching for improved performance.
 * 
 * Feature: catalog-access-control
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
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
   * @param {string} type - Cache type (client, user, effective, categories, items)
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
    // Clean up expired entry
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
   * Invalidate cache entries by pattern
   * @param {string} pattern - Pattern to match (e.g., 'client_')
   */
  invalidateByPattern(pattern) {
    const fullPattern = `${CACHE_CONFIG.PREFIX}${pattern}`
    for (const key of cache.data.keys()) {
      if (key.startsWith(fullPattern)) {
        this.remove(key)
      }
    }
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
   * Get catalog access rules for a client
   * @param {string} clientId - Client UUID
   * @param {boolean} useCache - Whether to use cache (default: true)
   * @returns {Promise<Object>} Access rules
   * Requirements: 7.1
   */
  async getClientAccess(clientId, useCache = true) {
    const cacheKey = cacheUtils.getKey('client', clientId)
    
    if (useCache) {
      const cached = cacheUtils.get(cacheKey)
      if (cached) {
        return cached
      }
    }

    const response = await api.get(`/clients/${clientId}/catalog-access`)
    cacheUtils.set(cacheKey, response.data)
    return response.data
  },

  /**
   * Update catalog access rules for a client
   * @param {string} clientId - Client UUID
   * @param {Object} rules - Access rules
   * @returns {Promise<Object>} Updated access rules
   * Requirements: 7.2
   */
  async updateClientAccess(clientId, rules) {
    const response = await api.put(`/clients/${clientId}/catalog-access`, rules)
    
    // Invalidate related caches
    cacheUtils.remove(cacheUtils.getKey('client', clientId))
    // Invalidate all user caches for this client (they inherit from client)
    cacheUtils.invalidateByPattern('user_')
    cacheUtils.invalidateByPattern('effective')
    
    return response.data
  },

  /**
   * Get catalog access rules for a client user
   * @param {string} clientUserId - Client User UUID
   * @param {boolean} useCache - Whether to use cache (default: true)
   * @returns {Promise<Object>} Access rules with inheritance info
   * Requirements: 7.3
   */
  async getUserAccess(clientUserId, useCache = true) {
    const cacheKey = cacheUtils.getKey('user', clientUserId)
    
    if (useCache) {
      const cached = cacheUtils.get(cacheKey)
      if (cached) {
        return cached
      }
    }

    const response = await api.get(`/client-users/${clientUserId}/catalog-access`)
    cacheUtils.set(cacheKey, response.data)
    return response.data
  },

  /**
   * Update catalog access rules for a client user
   * @param {string} clientUserId - Client User UUID
   * @param {Object} rules - Access rules with inheritance mode
   * @returns {Promise<Object>} Updated access rules
   * Requirements: 7.4
   */
  async updateUserAccess(clientUserId, rules) {
    const response = await api.put(`/client-users/${clientUserId}/catalog-access`, rules)
    
    // Invalidate related caches
    cacheUtils.remove(cacheUtils.getKey('user', clientUserId))
    cacheUtils.invalidateByPattern('effective')
    
    return response.data
  },

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
   * Get audit history for client catalog access
   * @param {string} clientId - Client UUID
   * @param {Object} params - Pagination params
   * @returns {Promise<Object>} Audit history
   */
  async getClientAuditHistory(clientId, params = {}) {
    // Audit history is not cached as it should always be fresh
    const response = await api.get(`/clients/${clientId}/catalog-access/audit`, { params })
    return response.data
  },

  /**
   * Get audit history for client user catalog access
   * @param {string} clientUserId - Client User UUID
   * @param {Object} params - Pagination params
   * @returns {Promise<Object>} Audit history
   */
  async getUserAuditHistory(clientUserId, params = {}) {
    // Audit history is not cached as it should always be fresh
    const response = await api.get(`/client-users/${clientUserId}/catalog-access/audit`, { params })
    return response.data
  },

  /**
   * Get all catalog categories for the organization
   * @param {boolean} useCache - Whether to use cache (default: true)
   * @returns {Promise<Array>} Categories list
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
   * Get all catalog items for the organization
   * @param {boolean} useCache - Whether to use cache (default: true)
   * @returns {Promise<Array>} Items list
   */
  async getItems(useCache = true) {
    const cacheKey = cacheUtils.getKey('items')
    
    if (useCache) {
      const cached = cacheUtils.get(cacheKey)
      if (cached) {
        return cached
      }
    }

    const response = await api.get('/catalog/items')
    cacheUtils.set(cacheKey, response.data)
    return response.data
  },

  // ============================================
  // Cache Management Methods
  // ============================================

  /**
   * Invalidate cache for a specific client
   * @param {string} clientId - Client UUID
   */
  invalidateClientCache(clientId) {
    cacheUtils.remove(cacheUtils.getKey('client', clientId))
  },

  /**
   * Invalidate cache for a specific user
   * @param {string} clientUserId - Client User UUID
   */
  invalidateUserCache(clientUserId) {
    cacheUtils.remove(cacheUtils.getKey('user', clientUserId))
  },

  /**
   * Invalidate effective permissions cache
   */
  invalidateEffectiveCache() {
    cacheUtils.invalidateByPattern('effective')
  },

  /**
   * Invalidate catalog data cache (categories and items)
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
   * Get cache statistics (for debugging)
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      entries: cache.data.size,
      keys: Array.from(cache.data.keys())
    }
  },

  /**
   * Preload common data into cache
   * Useful for initializing the cache on app load
   * @returns {Promise<void>}
   */
  async preloadCache() {
    try {
      await Promise.all([
        this.getCategories(),
        this.getItems()
      ])
    } catch (error) {
      console.warn('Failed to preload catalog access cache:', error)
    }
  }
}

export default catalogAccessService

// Export cache utilities for testing
export { cacheUtils, CACHE_CONFIG }
