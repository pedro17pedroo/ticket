/**
 * Catalog Access Cache Service - Redis Cache for Effective Permissions
 * 
 * Provides caching layer for catalog access permissions to optimize
 * performance when checking user access to catalog items.
 * 
 * Feature: catalog-access-control
 * Requirements: 4.4, 4.5
 */

import redisClient from '../config/redis.js';
import logger from '../config/logger.js';

// Cache key prefixes
const CACHE_PREFIX = 'catalog_access:';
const USER_CACHE_PREFIX = `${CACHE_PREFIX}user:`;
const CLIENT_USERS_PREFIX = `${CACHE_PREFIX}client_users:`;

// Default TTL: 1 hour (in seconds)
const DEFAULT_TTL = 3600;

class CatalogAccessCacheService {
  constructor() {
    this.ttl = DEFAULT_TTL;
  }

  /**
   * Check if Redis client is connected and ready
   * @returns {boolean} Whether Redis is available
   * @private
   */
  _isRedisAvailable() {
    return redisClient && redisClient.isOpen;
  }

  /**
   * Generate cache key for user effective permissions
   * @param {string} clientUserId - Client User UUID
   * @returns {string} Cache key
   * @private
   */
  _getUserCacheKey(clientUserId) {
    return `${USER_CACHE_PREFIX}${clientUserId}`;
  }

  /**
   * Generate cache key for tracking users of a client
   * @param {string} clientId - Client UUID
   * @returns {string} Cache key
   * @private
   */
  _getClientUsersKey(clientId) {
    return `${CLIENT_USERS_PREFIX}${clientId}`;
  }

  /**
   * Cache effective permissions for a client user
   * @param {string} clientUserId - Client User UUID
   * @param {Object} permissions - Effective permissions object
   * @param {string} clientId - Client UUID (for tracking)
   * @returns {Promise<boolean>} Success status
   * 
   * Requirements: 4.4
   */
  async cacheEffectiveAccess(clientUserId, permissions, clientId = null) {
    if (!clientUserId || !permissions) {
      return false;
    }

    if (!this._isRedisAvailable()) {
      logger.warn('Redis not available, skipping cache write');
      return false;
    }

    try {
      const cacheKey = this._getUserCacheKey(clientUserId);
      const serialized = JSON.stringify(permissions);

      // Store permissions with TTL
      await redisClient.setEx(cacheKey, this.ttl, serialized);

      // Track this user under their client for bulk invalidation
      if (clientId) {
        const clientUsersKey = this._getClientUsersKey(clientId);
        await redisClient.sAdd(clientUsersKey, clientUserId);
        // Set TTL on the set as well
        await redisClient.expire(clientUsersKey, this.ttl * 2);
      }

      logger.debug(`Cached effective access for user ${clientUserId}`);
      return true;
    } catch (error) {
      logger.error(`Error caching effective access for user ${clientUserId}:`, error);
      return false;
    }
  }

  /**
   * Get cached effective permissions for a client user
   * @param {string} clientUserId - Client User UUID
   * @returns {Promise<Object|null>} Cached permissions or null if not found
   * 
   * Requirements: 4.4
   */
  async getFromCache(clientUserId) {
    if (!clientUserId) {
      return null;
    }

    if (!this._isRedisAvailable()) {
      logger.warn('Redis not available, cache miss');
      return null;
    }

    try {
      const cacheKey = this._getUserCacheKey(clientUserId);
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        logger.debug(`Cache hit for user ${clientUserId}`);
        return JSON.parse(cached);
      }

      logger.debug(`Cache miss for user ${clientUserId}`);
      return null;
    } catch (error) {
      logger.error(`Error reading cache for user ${clientUserId}:`, error);
      return null;
    }
  }

  /**
   * Invalidate cached permissions for a specific client user
   * @param {string} clientUserId - Client User UUID
   * @returns {Promise<boolean>} Success status
   * 
   * Requirements: 4.5
   */
  async invalidateCache(clientUserId) {
    if (!clientUserId) {
      return false;
    }

    if (!this._isRedisAvailable()) {
      logger.warn('Redis not available, skipping cache invalidation');
      return false;
    }

    try {
      const cacheKey = this._getUserCacheKey(clientUserId);
      const deleted = await redisClient.del(cacheKey);

      logger.info(`Invalidated cache for user ${clientUserId}, deleted: ${deleted}`);
      return deleted > 0;
    } catch (error) {
      logger.error(`Error invalidating cache for user ${clientUserId}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cached permissions for all users of a client
   * Used when client-level permissions change
   * @param {string} clientId - Client UUID
   * @returns {Promise<number>} Number of invalidated entries
   * 
   * Requirements: 4.5
   */
  async invalidateClientCache(clientId) {
    if (!clientId) {
      return 0;
    }

    if (!this._isRedisAvailable()) {
      logger.warn('Redis not available, skipping client cache invalidation');
      return 0;
    }

    try {
      const clientUsersKey = this._getClientUsersKey(clientId);
      
      // Get all user IDs for this client
      const userIds = await redisClient.sMembers(clientUsersKey);
      
      if (!userIds || userIds.length === 0) {
        logger.debug(`No cached users found for client ${clientId}`);
        return 0;
      }

      // Delete all user caches
      const cacheKeys = userIds.map(userId => this._getUserCacheKey(userId));
      const deleted = await redisClient.del(cacheKeys);

      // Clear the client users set
      await redisClient.del(clientUsersKey);

      logger.info(`Invalidated cache for ${deleted} users of client ${clientId}`);
      return deleted;
    } catch (error) {
      logger.error(`Error invalidating client cache for ${clientId}:`, error);
      return 0;
    }
  }

  /**
   * Invalidate all catalog access caches
   * Used for maintenance or when organization-wide changes occur
   * @returns {Promise<number>} Number of invalidated entries
   */
  async invalidateAllCaches() {
    if (!this._isRedisAvailable()) {
      logger.warn('Redis not available, skipping all cache invalidation');
      return 0;
    }

    try {
      // Find all catalog access cache keys
      const pattern = `${CACHE_PREFIX}*`;
      const keys = await redisClient.keys(pattern);

      if (!keys || keys.length === 0) {
        logger.debug('No catalog access caches to invalidate');
        return 0;
      }

      const deleted = await redisClient.del(keys);
      logger.info(`Invalidated ${deleted} catalog access cache entries`);
      return deleted;
    } catch (error) {
      logger.error('Error invalidating all caches:', error);
      return 0;
    }
  }

  /**
   * Set custom TTL for cache entries
   * @param {number} ttlSeconds - TTL in seconds
   */
  setTTL(ttlSeconds) {
    if (ttlSeconds > 0) {
      this.ttl = ttlSeconds;
      logger.info(`Cache TTL set to ${ttlSeconds} seconds`);
    }
  }

  /**
   * Get current TTL setting
   * @returns {number} TTL in seconds
   */
  getTTL() {
    return this.ttl;
  }

  /**
   * Check if a user has cached permissions
   * @param {string} clientUserId - Client User UUID
   * @returns {Promise<boolean>} Whether cache exists
   */
  async hasCachedAccess(clientUserId) {
    if (!clientUserId || !this._isRedisAvailable()) {
      return false;
    }

    try {
      const cacheKey = this._getUserCacheKey(clientUserId);
      const exists = await redisClient.exists(cacheKey);
      return exists === 1;
    } catch (error) {
      logger.error(`Error checking cache existence for user ${clientUserId}:`, error);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getCacheStats() {
    if (!this._isRedisAvailable()) {
      return { available: false, userCaches: 0, clientSets: 0 };
    }

    try {
      const userKeys = await redisClient.keys(`${USER_CACHE_PREFIX}*`);
      const clientKeys = await redisClient.keys(`${CLIENT_USERS_PREFIX}*`);

      return {
        available: true,
        userCaches: userKeys.length,
        clientSets: clientKeys.length,
        ttl: this.ttl
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return { available: false, error: error.message };
    }
  }
}

export default new CatalogAccessCacheService();
