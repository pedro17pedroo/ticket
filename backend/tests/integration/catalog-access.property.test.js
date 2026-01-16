/**
 * Property-Based Tests - Catalog Access Control Module
 * 
 * Feature: catalog-access-control
 * Tests correctness properties for catalog access permissions
 * 
 * Uses fast-check for property-based testing
 */

import { expect } from 'chai';
import fc from 'fast-check';
import {
  ClientCatalogAccess,
  ClientUserCatalogAccess,
  CatalogAccessAuditLog
} from '../../src/modules/catalogAccess/index.js';
import { CatalogCategory, CatalogItem } from '../../src/modules/catalog/catalogModel.js';
import Client from '../../src/modules/clients/clientModel.js';
import ClientUser from '../../src/modules/clients/clientUserModel.js';
import Direction from '../../src/modules/directions/directionModel.js';
import { Organization } from '../../src/modules/models/index.js';
import OrganizationUser from '../../src/models/OrganizationUser.js';
import catalogAccessService from '../../src/services/catalogAccessService.js';
import catalogAccessCacheService from '../../src/services/catalogAccessCacheService.js';
import catalogAccessAuditService from '../../src/services/catalogAccessAuditService.js';

// Valid values for enums
const VALID_ACCESS_MODES = ['all', 'selected', 'none'];
const VALID_INHERITANCE_MODES = ['inherit', 'override', 'extend'];

// Test data IDs (will be created in before hook)
let testOrganizationId;
let testClientId;
let testClientUserId;
let testDirectionId;
let testOrganizationUserId;
let testCategoryIds = [];
let testItemIds = [];

// Arbitrary generators for access data
const accessModeArb = fc.constantFrom(...VALID_ACCESS_MODES);
const inheritanceModeArb = fc.constantFrom(...VALID_INHERITANCE_MODES);

// Generator for UUID arrays (simulating category/item IDs)
const uuidArrayArb = (availableIds) => {
  if (!availableIds || availableIds.length === 0) {
    return fc.constant([]);
  }
  return fc.subarray(availableIds, { minLength: 0, maxLength: availableIds.length });
};

describe('Catalog Access Control - Property-Based Tests', function() {
  this.timeout(120000); // Increase timeout for property tests

  before(async function() {
    try {
      // Sync models
      await ClientCatalogAccess.sync({ force: false });
      await ClientUserCatalogAccess.sync({ force: false });
      await CatalogAccessAuditLog.sync({ force: false });

      // Create test organization
      const org = await Organization.create({
        name: 'Test Organization for Catalog Access',
        slug: `test-org-catalog-access-${Date.now()}`,
        type: 'tenant',
        status: 'active'
      });
      testOrganizationId = org.id;

      // Create test client
      const client = await Client.create({
        organizationId: testOrganizationId,
        name: 'Test Client Company',
        email: `test-client-${Date.now()}@example.com`,
        isActive: true
      });
      testClientId = client.id;

      // Create test client user
      const clientUser = await ClientUser.create({
        organizationId: testOrganizationId,
        clientId: testClientId,
        name: 'Test Client User',
        email: `test-user-${Date.now()}@example.com`,
        password: 'testpassword123',
        role: 'client-user',
        isActive: true
      });
      testClientUserId = clientUser.id;

      // Create test organization user (for audit tests)
      const orgUser = await OrganizationUser.create({
        organizationId: testOrganizationId,
        name: 'Test Org Admin',
        email: `test-org-admin-${Date.now()}@example.com`,
        password: 'testpassword123',
        role: 'org-admin',
        isActive: true
      });
      testOrganizationUserId = orgUser.id;

      // Create test direction (required for catalog items)
      const direction = await Direction.create({
        organizationId: testOrganizationId,
        name: 'Test Direction',
        description: 'Test direction for catalog access tests',
        isActive: true
      });
      testDirectionId = direction.id;

      // Create test categories
      for (let i = 0; i < 5; i++) {
        const category = await CatalogCategory.create({
          organizationId: testOrganizationId,
          name: `Test Category ${i}`,
          description: `Test category ${i} description`,
          isActive: true,
          order: i
        });
        testCategoryIds.push(category.id);

        // Create test items for each category
        for (let j = 0; j < 3; j++) {
          const item = await CatalogItem.create({
            organizationId: testOrganizationId,
            categoryId: category.id,
            name: `Test Item ${i}-${j}`,
            shortDescription: `Test item ${i}-${j} description`,
            itemType: 'service',
            defaultDirectionId: testDirectionId,
            isActive: true,
            isPublic: true
          });
          testItemIds.push(item.id);
        }
      }
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });

  after(async function() {
    // Clean up test data
    try {
      await ClientUserCatalogAccess.destroy({ where: { organizationId: testOrganizationId }, force: true });
      await ClientCatalogAccess.destroy({ where: { organizationId: testOrganizationId }, force: true });
      await CatalogAccessAuditLog.destroy({ where: { organizationId: testOrganizationId }, force: true });
      await CatalogItem.destroy({ where: { organizationId: testOrganizationId }, force: true });
      await CatalogCategory.destroy({ where: { organizationId: testOrganizationId }, force: true });
      await ClientUser.destroy({ where: { organizationId: testOrganizationId }, force: true });
      await Client.destroy({ where: { organizationId: testOrganizationId }, force: true });
      await Direction.destroy({ where: { organizationId: testOrganizationId }, force: true });
      await OrganizationUser.destroy({ where: { organizationId: testOrganizationId }, force: true });
      await Organization.destroy({ where: { id: testOrganizationId }, force: true });
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  });

  beforeEach(async function() {
    // Clean up access rules before each test
    await ClientUserCatalogAccess.destroy({ where: { organizationId: testOrganizationId }, force: true });
    await ClientCatalogAccess.destroy({ where: { organizationId: testOrganizationId }, force: true });
  });

  /**
   * Property 4: Effective Permissions Calculation
   * 
   * *For any* client user:
   * - If inheritanceMode='inherit': effective permissions equal client permissions
   * - If inheritanceMode='override': effective permissions equal user-specific permissions
   * - If inheritanceMode='extend': effective permissions equal union of client and user permissions
   * 
   * **Validates: Requirements 2.2, 2.3, 2.4, 2.5**
   * 
   * Feature: catalog-access-control, Property 4: Effective Permissions Calculation
   */
  describe('Property 4: Effective Permissions Calculation', function() {
    it('should return client permissions when inheritanceMode is inherit', async function() {
      await fc.assert(
        fc.asyncProperty(
          accessModeArb,
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testItemIds),
          async (clientAccessMode, clientAllowedCategories, clientAllowedItems) => {
            // Set client access
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: clientAccessMode,
              allowedCategories: clientAllowedCategories,
              allowedItems: clientAllowedItems,
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user access with inherit mode (user-specific values should be ignored)
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit',
              accessMode: 'selected', // This should be ignored
              allowedCategories: [], // Empty - will be ignored anyway
              allowedItems: [], // Empty - will be ignored anyway
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Get effective access
            const effective = await catalogAccessService.getEffectiveAccess(testClientUserId);

            // Verify effective permissions equal client permissions
            expect(effective.accessMode).to.equal(clientAccessMode);
            expect(effective.allowedCategories).to.deep.equal(clientAllowedCategories);
            expect(effective.allowedItems).to.deep.equal(clientAllowedItems);
            expect(effective.inheritanceMode).to.equal('inherit');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return user-specific permissions when inheritanceMode is override', async function() {
      await fc.assert(
        fc.asyncProperty(
          accessModeArb,
          accessModeArb,
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testItemIds),
          async (clientAccessMode, userAccessMode, userAllowedCategories, userAllowedItems) => {
            // Set client access (should be ignored)
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: clientAccessMode,
              allowedCategories: testCategoryIds.slice(0, 2),
              allowedItems: testItemIds.slice(0, 3),
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user access with override mode
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'override',
              accessMode: userAccessMode,
              allowedCategories: userAllowedCategories,
              allowedItems: userAllowedItems,
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Get effective access
            const effective = await catalogAccessService.getEffectiveAccess(testClientUserId);

            // Verify effective permissions equal user-specific permissions
            expect(effective.accessMode).to.equal(userAccessMode);
            expect(effective.allowedCategories).to.deep.equal(userAllowedCategories);
            expect(effective.allowedItems).to.deep.equal(userAllowedItems);
            expect(effective.inheritanceMode).to.equal('override');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return union of permissions when inheritanceMode is extend', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testItemIds),
          uuidArrayArb(testItemIds),
          async (clientCategories, userCategories, clientItems, userItems) => {
            // Set client access
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'selected',
              allowedCategories: clientCategories,
              allowedItems: clientItems,
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user access with extend mode
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'extend',
              accessMode: 'selected',
              allowedCategories: userCategories,
              allowedItems: userItems,
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Get effective access
            const effective = await catalogAccessService.getEffectiveAccess(testClientUserId);

            // Calculate expected union
            const expectedCategories = [...new Set([...clientCategories, ...userCategories])];
            const expectedItems = [...new Set([...clientItems, ...userItems])];

            // Verify effective permissions are union of both
            expect(effective.inheritanceMode).to.equal('extend');
            expect(effective.allowedCategories.sort()).to.deep.equal(expectedCategories.sort());
            expect(effective.allowedItems.sort()).to.deep.equal(expectedItems.sort());

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should default to inherit when no user access rules exist', async function() {
      await fc.assert(
        fc.asyncProperty(
          accessModeArb,
          uuidArrayArb(testCategoryIds),
          async (clientAccessMode, clientAllowedCategories) => {
            // Set only client access (no user access)
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: clientAccessMode,
              allowedCategories: clientAllowedCategories,
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Get effective access (without setting user access)
            const effective = await catalogAccessService.getEffectiveAccess(testClientUserId);

            // Verify effective permissions equal client permissions (inherit by default)
            expect(effective.accessMode).to.equal(clientAccessMode);
            expect(effective.allowedCategories).to.deep.equal(clientAllowedCategories);
            expect(effective.inheritanceMode).to.equal('inherit');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Filtered Access Returns Only Permitted Items
   * 
   * *For any* client with accessMode='selected' and any catalog query, 
   * all returned items must be in the allowedItems array OR belong to a 
   * category in allowedCategories, AND must not be in deniedItems or deniedCategories.
   * 
   * **Validates: Requirements 1.4, 4.1, 4.2**
   * 
   * Feature: catalog-access-control, Property 2: Filtered Access Returns Only Permitted Items
   */
  describe('Property 2: Filtered Access Returns Only Permitted Items', function() {
    it('should return only permitted items when accessMode is selected', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testItemIds),
          async (allowedCategories, allowedItems) => {
            // Set client access with selected mode
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'selected',
              allowedCategories,
              allowedItems,
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user to inherit client permissions
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Filter catalog
            const filteredItems = await catalogAccessService.filterCatalog(testClientUserId, {});

            // Verify all returned items are permitted
            for (const item of filteredItems) {
              const isAllowedItem = allowedItems.includes(item.id);
              const isInAllowedCategory = allowedCategories.includes(item.categoryId);
              
              expect(isAllowedItem || isInAllowedCategory).to.be.true;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all items when accessMode is all', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.constant('all'),
          async (accessMode) => {
            // Set client access with all mode
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode,
              allowedCategories: [],
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user to inherit client permissions
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Filter catalog
            const filteredItems = await catalogAccessService.filterCatalog(testClientUserId, {});

            // Should return all active public items
            expect(filteredItems.length).to.equal(testItemIds.length);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return no items when accessMode is none', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.constant('none'),
          async (accessMode) => {
            // Set client access with none mode
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode,
              allowedCategories: [],
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user to inherit client permissions
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Filter catalog
            const filteredItems = await catalogAccessService.filterCatalog(testClientUserId, {});

            // Should return no items
            expect(filteredItems.length).to.equal(0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should exclude denied items even when category is allowed', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testItemIds),
          async (allowedCategories, deniedItems) => {
            // Only test when we have both allowed categories and denied items
            if (allowedCategories.length === 0) {
              return true; // Skip this case
            }

            // Set client access with allowed categories but some denied items
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'selected',
              allowedCategories,
              allowedItems: [],
              deniedCategories: [],
              deniedItems
            }, null);

            // Set user to inherit client permissions
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Filter catalog
            const filteredItems = await catalogAccessService.filterCatalog(testClientUserId, {});

            // Verify no denied items are returned
            for (const item of filteredItems) {
              expect(deniedItems).to.not.include(item.id);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly check access to specific items', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testItemIds),
          async (allowedItems) => {
            // Set client access with specific allowed items
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'selected',
              allowedCategories: [],
              allowedItems,
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user to inherit client permissions
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Check access to each test item
            for (const itemId of testItemIds) {
              const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
              const shouldHaveAccess = allowedItems.includes(itemId);
              
              expect(hasAccess).to.equal(shouldHaveAccess);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Cache Invalidation on Permission Change
   * 
   * *For any* permission update (client or user), all cached effective permissions 
   * for affected users must be invalidated, and subsequent requests must recalculate permissions.
   * 
   * **Validates: Requirements 4.5**
   * 
   * Feature: catalog-access-control, Property 7: Cache Invalidation on Permission Change
   */
  describe('Property 7: Cache Invalidation on Permission Change', function() {
    it('should invalidate user cache when user permissions change', async function() {
      await fc.assert(
        fc.asyncProperty(
          accessModeArb,
          accessModeArb,
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testCategoryIds),
          async (initialAccessMode, newAccessMode, initialCategories, newCategories) => {
            // Set initial client access
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'all',
              allowedCategories: [],
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set initial user access with override mode
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'override',
              accessMode: initialAccessMode,
              allowedCategories: initialCategories,
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Get effective access (this should cache the result)
            const initialEffective = await catalogAccessService.getEffectiveAccess(testClientUserId);
            expect(initialEffective.accessMode).to.equal(initialAccessMode);

            // Update user permissions (this should invalidate cache)
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'override',
              accessMode: newAccessMode,
              allowedCategories: newCategories,
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Get effective access again (should reflect new permissions)
            const newEffective = await catalogAccessService.getEffectiveAccess(testClientUserId);
            
            // Verify the new permissions are returned (not cached old ones)
            expect(newEffective.accessMode).to.equal(newAccessMode);
            expect(newEffective.allowedCategories.sort()).to.deep.equal(newCategories.sort());

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should invalidate all user caches when client permissions change', async function() {
      await fc.assert(
        fc.asyncProperty(
          accessModeArb,
          accessModeArb,
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testCategoryIds),
          async (initialAccessMode, newAccessMode, initialCategories, newCategories) => {
            // Set initial client access
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: initialAccessMode,
              allowedCategories: initialCategories,
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user to inherit client permissions
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit',
              accessMode: 'all',
              allowedCategories: [],
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Get effective access (this should cache the result)
            const initialEffective = await catalogAccessService.getEffectiveAccess(testClientUserId);
            expect(initialEffective.accessMode).to.equal(initialAccessMode);
            expect(initialEffective.allowedCategories.sort()).to.deep.equal(initialCategories.sort());

            // Update client permissions (this should invalidate cache for all users)
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: newAccessMode,
              allowedCategories: newCategories,
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Get effective access again (should reflect new client permissions)
            const newEffective = await catalogAccessService.getEffectiveAccess(testClientUserId);
            
            // Verify the new permissions are returned (not cached old ones)
            expect(newEffective.accessMode).to.equal(newAccessMode);
            expect(newEffective.allowedCategories.sort()).to.deep.equal(newCategories.sort());

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should recalculate permissions after cache invalidation', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testItemIds),
          async (allowedCategories, allowedItems) => {
            // Set client access
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'selected',
              allowedCategories,
              allowedItems,
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user to inherit
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Get effective access (caches result)
            const effective1 = await catalogAccessService.getEffectiveAccess(testClientUserId);

            // Manually invalidate cache
            await catalogAccessCacheService.invalidateCache(testClientUserId);

            // Get effective access again (should recalculate)
            const effective2 = await catalogAccessService.getEffectiveAccess(testClientUserId);

            // Both should have the same permissions
            expect(effective1.accessMode).to.equal(effective2.accessMode);
            expect(effective1.allowedCategories.sort()).to.deep.equal(effective2.allowedCategories.sort());
            expect(effective1.allowedItems.sort()).to.deep.equal(effective2.allowedItems.sort());

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should cache effective permissions after calculation', async function() {
      await fc.assert(
        fc.asyncProperty(
          accessModeArb,
          uuidArrayArb(testCategoryIds),
          async (accessMode, allowedCategories) => {
            // Clear any existing cache
            await catalogAccessCacheService.invalidateCache(testClientUserId);

            // Set client access
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode,
              allowedCategories,
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user to inherit
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Verify cache is empty before
            const cachedBefore = await catalogAccessCacheService.getFromCache(testClientUserId);
            expect(cachedBefore).to.be.null;

            // Get effective access (should cache result)
            const effective = await catalogAccessService.getEffectiveAccess(testClientUserId);

            // Verify cache now has the permissions
            const cachedAfter = await catalogAccessCacheService.getFromCache(testClientUserId);
            
            // If Redis is available, cache should be populated
            if (cachedAfter) {
              expect(cachedAfter.accessMode).to.equal(effective.accessMode);
              expect(cachedAfter.allowedCategories.sort()).to.deep.equal(effective.allowedCategories.sort());
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Audit Log Completeness
   * 
   * *For any* permission modification, an audit log entry must be created containing:
   * timestamp, entity type, entity ID, action, previous state, new state, and modifier identity.
   * 
   * **Validates: Requirements 5.1, 5.2**
   * 
   * Feature: catalog-access-control, Property 8: Audit Log Completeness
   */
  describe('Property 8: Audit Log Completeness', function() {
    beforeEach(async function() {
      // Clean up audit logs before each test
      await CatalogAccessAuditLog.destroy({ where: { organizationId: testOrganizationId }, force: true });
    });

    it('should create audit log with all required fields when client permissions are created', async function() {
      await fc.assert(
        fc.asyncProperty(
          accessModeArb,
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testItemIds),
          async (accessMode, allowedCategories, allowedItems) => {
            // Clean up any existing access rules
            await ClientCatalogAccess.destroy({ where: { clientId: testClientId }, force: true });
            await CatalogAccessAuditLog.destroy({ where: { entityId: testClientId }, force: true });

            // Set client access (this should create an audit log)
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode,
              allowedCategories,
              allowedItems,
              deniedCategories: [],
              deniedItems: []
            }, testOrganizationUserId, { changedByName: 'Test User', ipAddress: '127.0.0.1' });

            // Get the audit log entry
            const auditResult = await catalogAccessAuditService.getAuditHistory('client', testClientId);
            
            // Verify audit log was created
            expect(auditResult.logs.length).to.be.greaterThan(0);
            
            const auditLog = auditResult.logs[0];
            
            // Verify all required fields are present
            expect(auditLog.id).to.exist;
            expect(auditLog.organizationId).to.equal(testOrganizationId);
            expect(auditLog.entityType).to.equal('client');
            expect(auditLog.entityId).to.equal(testClientId);
            expect(auditLog.action).to.equal('create');
            expect(auditLog.previousState).to.be.null; // No previous state for create
            expect(auditLog.newState).to.exist;
            expect(auditLog.newState.accessMode).to.equal(accessMode);
            expect(auditLog.changedBy).to.equal(testOrganizationUserId);
            expect(auditLog.changedByName).to.equal('Test User');
            expect(auditLog.ipAddress).to.equal('127.0.0.1');
            expect(auditLog.createdAt).to.exist;

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create audit log with previous and new state when client permissions are updated', async function() {
      await fc.assert(
        fc.asyncProperty(
          accessModeArb,
          accessModeArb,
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testCategoryIds),
          async (initialAccessMode, newAccessMode, initialCategories, newCategories) => {
            // Clean up any existing access rules
            await ClientCatalogAccess.destroy({ where: { clientId: testClientId }, force: true });
            await CatalogAccessAuditLog.destroy({ where: { entityId: testClientId }, force: true });

            // Create initial access
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: initialAccessMode,
              allowedCategories: initialCategories,
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, testOrganizationUserId);

            // Update access (this should create an update audit log)
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: newAccessMode,
              allowedCategories: newCategories,
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, testOrganizationUserId);

            // Get the audit log entries
            const auditResult = await catalogAccessAuditService.getAuditHistory('client', testClientId);
            
            // Should have at least 2 entries (create + update)
            expect(auditResult.logs.length).to.be.greaterThanOrEqual(2);
            
            // Find the update entry (most recent)
            const updateLog = auditResult.logs.find(log => log.action === 'update');
            
            if (updateLog) {
              // Verify update log has both previous and new state
              expect(updateLog.entityType).to.equal('client');
              expect(updateLog.entityId).to.equal(testClientId);
              expect(updateLog.action).to.equal('update');
              expect(updateLog.previousState).to.exist;
              expect(updateLog.previousState.accessMode).to.equal(initialAccessMode);
              expect(updateLog.newState).to.exist;
              expect(updateLog.newState.accessMode).to.equal(newAccessMode);
              expect(updateLog.changedBy).to.equal(testOrganizationUserId);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create audit log when client user permissions are modified', async function() {
      await fc.assert(
        fc.asyncProperty(
          inheritanceModeArb,
          accessModeArb,
          uuidArrayArb(testCategoryIds),
          async (inheritanceMode, accessMode, allowedCategories) => {
            // Clean up any existing access rules
            await ClientUserCatalogAccess.destroy({ where: { clientUserId: testClientUserId }, force: true });
            await CatalogAccessAuditLog.destroy({ where: { entityId: testClientUserId }, force: true });

            // Set user access (this should create an audit log)
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode,
              accessMode,
              allowedCategories,
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, testOrganizationUserId, { changedByName: 'Test Admin' });

            // Get the audit log entry
            const auditResult = await catalogAccessAuditService.getAuditHistory('client_user', testClientUserId);
            
            // Verify audit log was created
            expect(auditResult.logs.length).to.be.greaterThan(0);
            
            const auditLog = auditResult.logs[0];
            
            // Verify all required fields are present
            expect(auditLog.entityType).to.equal('client_user');
            expect(auditLog.entityId).to.equal(testClientUserId);
            expect(auditLog.action).to.equal('create');
            expect(auditLog.newState).to.exist;
            expect(auditLog.newState.inheritanceMode).to.equal(inheritanceMode);
            expect(auditLog.newState.accessMode).to.equal(accessMode);
            expect(auditLog.changedBy).to.equal(testOrganizationUserId);
            expect(auditLog.changedByName).to.equal('Test Admin');
            expect(auditLog.createdAt).to.exist;

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return audit history in chronological order (newest first)', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.array(accessModeArb, { minLength: 2, maxLength: 5 }),
          async (accessModes) => {
            // Clean up any existing access rules
            await ClientCatalogAccess.destroy({ where: { clientId: testClientId }, force: true });
            await CatalogAccessAuditLog.destroy({ where: { entityId: testClientId }, force: true });

            // Create multiple permission changes
            for (const accessMode of accessModes) {
              await catalogAccessService.setClientAccess(testClientId, {
                accessMode,
                allowedCategories: [],
                allowedItems: [],
                deniedCategories: [],
                deniedItems: []
              }, testOrganizationUserId);
              
              // Small delay to ensure different timestamps
              await new Promise(resolve => setTimeout(resolve, 10));
            }

            // Get the audit log entries
            const auditResult = await catalogAccessAuditService.getAuditHistory('client', testClientId);
            
            // Verify we have entries
            expect(auditResult.logs.length).to.be.greaterThanOrEqual(accessModes.length);
            
            // Verify chronological order (newest first)
            for (let i = 1; i < auditResult.logs.length; i++) {
              const currentDate = new Date(auditResult.logs[i - 1].createdAt);
              const previousDate = new Date(auditResult.logs[i].createdAt);
              expect(currentDate.getTime()).to.be.greaterThanOrEqual(previousDate.getTime());
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should count audit entries correctly', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          async (numChanges) => {
            // Clean up any existing access rules
            await ClientCatalogAccess.destroy({ where: { clientId: testClientId }, force: true });
            await CatalogAccessAuditLog.destroy({ where: { entityId: testClientId }, force: true });

            // Create multiple permission changes
            for (let i = 0; i < numChanges; i++) {
              await catalogAccessService.setClientAccess(testClientId, {
                accessMode: VALID_ACCESS_MODES[i % VALID_ACCESS_MODES.length],
                allowedCategories: [],
                allowedItems: [],
                deniedCategories: [],
                deniedItems: []
              }, testOrganizationUserId);
            }

            // Count audit entries
            const count = await catalogAccessAuditService.countAuditEntries('client', testClientId);
            
            // Verify count matches number of changes
            expect(count).to.equal(numChanges);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Access Denied for Restricted Items
   * 
   * *For any* client user attempting to access an item not in their effective permissions,
   * the system must return a 403 Forbidden error.
   * 
   * **Validates: Requirements 4.3**
   * 
   * Feature: catalog-access-control, Property 6: Access Denied for Restricted Items
   */
  describe('Property 6: Access Denied for Restricted Items', function() {
    it('should deny access to items not in allowed list when accessMode is selected', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testItemIds),
          async (allowedCategories, allowedItems) => {
            // Set client access with selected mode
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'selected',
              allowedCategories,
              allowedItems,
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user to inherit client permissions
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Check access to each test item
            for (const itemId of testItemIds) {
              const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
              
              // Get the item to check its category
              const item = await CatalogItem.findByPk(itemId);
              const isAllowedItem = allowedItems.includes(itemId);
              const isInAllowedCategory = item && allowedCategories.includes(item.categoryId);
              const shouldHaveAccess = isAllowedItem || isInAllowedCategory;
              
              // Verify access matches expected
              expect(hasAccess).to.equal(shouldHaveAccess);
              
              // If access is denied, verify it's because item is not permitted
              if (!hasAccess) {
                expect(isAllowedItem).to.be.false;
                expect(isInAllowedCategory).to.be.false;
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access to all items when accessMode is none', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.constant('none'),
          async (accessMode) => {
            // Set client access with none mode
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode,
              allowedCategories: [],
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user to inherit client permissions
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Check access to each test item - all should be denied
            for (const itemId of testItemIds) {
              const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
              expect(hasAccess).to.be.false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access to explicitly denied items even when category is allowed', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testItemIds),
          async (allowedCategories, deniedItems) => {
            // Only test when we have both allowed categories and denied items
            if (allowedCategories.length === 0 || deniedItems.length === 0) {
              return true; // Skip this case
            }

            // Set client access with allowed categories but some denied items
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'selected',
              allowedCategories,
              allowedItems: [],
              deniedCategories: [],
              deniedItems
            }, null);

            // Set user to inherit client permissions
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Check access to denied items - all should be denied regardless of category
            for (const itemId of deniedItems) {
              const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
              expect(hasAccess).to.be.false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access to items in denied categories', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testCategoryIds),
          async (deniedCategories) => {
            // Only test when we have denied categories
            if (deniedCategories.length === 0) {
              return true; // Skip this case
            }

            // Set client access with all mode but some denied categories
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'all',
              allowedCategories: [],
              allowedItems: [],
              deniedCategories,
              deniedItems: []
            }, null);

            // Set user to inherit client permissions
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Check access to items in denied categories
            for (const itemId of testItemIds) {
              const item = await CatalogItem.findByPk(itemId);
              if (item && deniedCategories.includes(item.categoryId)) {
                const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
                expect(hasAccess).to.be.false;
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access when user override mode has no permissions', async function() {
      await fc.assert(
        fc.asyncProperty(
          accessModeArb,
          uuidArrayArb(testCategoryIds),
          async (clientAccessMode, clientAllowedCategories) => {
            // Set client access with some permissions
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: clientAccessMode,
              allowedCategories: clientAllowedCategories,
              allowedItems: testItemIds.slice(0, 3),
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user access with override mode and no permissions
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'override',
              accessMode: 'none',
              allowedCategories: [],
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Check access to all items - all should be denied due to user override
            for (const itemId of testItemIds) {
              const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
              expect(hasAccess).to.be.false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for non-existent items', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (nonExistentItemId) => {
            // Set client access with all mode
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'all',
              allowedCategories: [],
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user to inherit client permissions
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Check access to non-existent item
            const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, nonExistentItemId);
            
            // Should return false for non-existent items
            expect(hasAccess).to.be.false;

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly handle blacklist precedence over whitelist', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testItemIds),
          async (itemsToTest) => {
            // Only test when we have items
            if (itemsToTest.length === 0) {
              return true;
            }

            // Split items: first half allowed, second half denied
            const midpoint = Math.ceil(itemsToTest.length / 2);
            const allowedItems = itemsToTest.slice(0, midpoint);
            const deniedItems = itemsToTest.slice(midpoint);

            // Also add some items to both lists (should be denied due to blacklist precedence)
            const overlappingItems = allowedItems.slice(0, Math.min(2, allowedItems.length));
            const finalDeniedItems = [...deniedItems, ...overlappingItems];

            // Set client access with both allowed and denied items
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'selected',
              allowedCategories: [],
              allowedItems,
              deniedCategories: [],
              deniedItems: finalDeniedItems
            }, null);

            // Set user to inherit client permissions
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Check access to overlapping items - should be denied (blacklist precedence)
            for (const itemId of overlappingItems) {
              const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
              expect(hasAccess).to.be.false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 11: Permission Validation
   * 
   * *For any* permission update request containing category or item IDs, 
   * all referenced IDs must exist in the organization's catalog, 
   * otherwise the request must be rejected with a validation error.
   * 
   * **Validates: Requirements 7.6**
   * 
   * Feature: catalog-access-control, Property 11: Permission Validation
   */
  describe('Property 11: Permission Validation', function() {
    let validateCatalogReferences;

    before(async function() {
      // Dynamically import the validation function
      const controllerModule = await import('../../src/modules/catalogAccess/catalogAccessController.js');
      validateCatalogReferences = controllerModule.validateCatalogReferences;
    });

    it('should validate that all referenced category IDs exist', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testCategoryIds),
          fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }),
          async (validCategoryIds, invalidCategoryIds) => {
            // Mix valid and invalid IDs
            const allCategoryIds = [...validCategoryIds, ...invalidCategoryIds];
            
            // Validate references
            const result = await validateCatalogReferences(
              testOrganizationId,
              allCategoryIds,
              []
            );

            // If we have invalid IDs, validation should fail
            if (invalidCategoryIds.length > 0) {
              expect(result.isValid).to.be.false;
              // All invalid IDs should be reported
              for (const invalidId of invalidCategoryIds) {
                expect(result.invalidCategories).to.include(invalidId);
              }
            }

            // Valid IDs should never be in the invalid list
            for (const validId of validCategoryIds) {
              expect(result.invalidCategories).to.not.include(validId);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate that all referenced item IDs exist', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testItemIds),
          fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }),
          async (validItemIds, invalidItemIds) => {
            // Mix valid and invalid IDs
            const allItemIds = [...validItemIds, ...invalidItemIds];
            
            // Validate references
            const result = await validateCatalogReferences(
              testOrganizationId,
              [],
              allItemIds
            );

            // If we have invalid IDs, validation should fail
            if (invalidItemIds.length > 0) {
              expect(result.isValid).to.be.false;
              // All invalid IDs should be reported
              for (const invalidId of invalidItemIds) {
                expect(result.invalidItems).to.include(invalidId);
              }
            }

            // Valid IDs should never be in the invalid list
            for (const validId of validItemIds) {
              expect(result.invalidItems).to.not.include(validId);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return valid when all referenced IDs exist', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testItemIds),
          async (categoryIds, itemIds) => {
            // Validate references with only valid IDs
            const result = await validateCatalogReferences(
              testOrganizationId,
              categoryIds,
              itemIds
            );

            // Should be valid
            expect(result.isValid).to.be.true;
            expect(result.invalidCategories).to.be.empty;
            expect(result.invalidItems).to.be.empty;

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return valid when no IDs are provided', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.constant([]),
          fc.constant([]),
          async (categoryIds, itemIds) => {
            // Validate references with empty arrays
            const result = await validateCatalogReferences(
              testOrganizationId,
              categoryIds,
              itemIds
            );

            // Should be valid
            expect(result.isValid).to.be.true;
            expect(result.invalidCategories).to.be.empty;
            expect(result.invalidItems).to.be.empty;

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject IDs from different organizations', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testItemIds),
          fc.uuid(),
          async (categoryIds, itemIds, differentOrgId) => {
            // Skip if no IDs to test
            if (categoryIds.length === 0 && itemIds.length === 0) {
              return true;
            }

            // Validate references with a different organization ID
            const result = await validateCatalogReferences(
              differentOrgId, // Different org
              categoryIds,
              itemIds
            );

            // Should be invalid because IDs belong to testOrganizationId
            if (categoryIds.length > 0 || itemIds.length > 0) {
              expect(result.isValid).to.be.false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate both categories and items simultaneously', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testCategoryIds),
          fc.array(fc.uuid(), { minLength: 0, maxLength: 2 }),
          uuidArrayArb(testItemIds),
          fc.array(fc.uuid(), { minLength: 0, maxLength: 2 }),
          async (validCategoryIds, invalidCategoryIds, validItemIds, invalidItemIds) => {
            // Mix valid and invalid IDs
            const allCategoryIds = [...validCategoryIds, ...invalidCategoryIds];
            const allItemIds = [...validItemIds, ...invalidItemIds];
            
            // Validate references
            const result = await validateCatalogReferences(
              testOrganizationId,
              allCategoryIds,
              allItemIds
            );

            // Check validity
            const hasInvalidCategories = invalidCategoryIds.length > 0;
            const hasInvalidItems = invalidItemIds.length > 0;
            
            if (hasInvalidCategories || hasInvalidItems) {
              expect(result.isValid).to.be.false;
            } else {
              expect(result.isValid).to.be.true;
            }

            // Verify invalid categories are reported
            for (const invalidId of invalidCategoryIds) {
              expect(result.invalidCategories).to.include(invalidId);
            }

            // Verify invalid items are reported
            for (const invalidId of invalidItemIds) {
              expect(result.invalidItems).to.include(invalidId);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 1: Default Access Grants All Public Items
   * 
   * *For any* client without specific access rules (no ClientCatalogAccess record 
   * or accessMode='all'), querying the catalog should return all public catalog 
   * items for that organization.
   * 
   * **Validates: Requirements 1.3**
   * 
   * Feature: catalog-access-control, Property 1: Default Access Grants All Public Items
   */
  describe('Property 1: Default Access Grants All Public Items', function() {
    it('should return all public items when no access rules exist', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null), // No specific rules
          async () => {
            // Clean up any existing access rules to test default behavior
            await ClientCatalogAccess.destroy({ where: { clientId: testClientId }, force: true });
            await ClientUserCatalogAccess.destroy({ where: { clientUserId: testClientUserId }, force: true });

            // Get effective access (should default to 'all')
            const effectiveAccess = await catalogAccessService.getEffectiveAccess(testClientUserId);

            // Verify default access mode is 'all'
            expect(effectiveAccess.accessMode).to.equal('all');

            // Filter catalog - should return all public items
            const filteredItems = await catalogAccessService.filterCatalog(testClientUserId, {});

            // Should return all test items (all are public)
            expect(filteredItems.length).to.equal(testItemIds.length);

            // Verify all returned items are public
            for (const item of filteredItems) {
              expect(item.isPublic).to.be.true;
              expect(item.isActive).to.be.true;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all public items when accessMode is explicitly all', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.constant('all'),
          async (accessMode) => {
            // Set client access with 'all' mode
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode,
              allowedCategories: [],
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user to inherit
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Filter catalog
            const filteredItems = await catalogAccessService.filterCatalog(testClientUserId, {});

            // Should return all test items
            expect(filteredItems.length).to.equal(testItemIds.length);

            // Verify all items are accessible
            for (const itemId of testItemIds) {
              const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
              expect(hasAccess).to.be.true;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return default access when getClientAccess is called for non-existent rules', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            // Clean up any existing access rules
            await ClientCatalogAccess.destroy({ where: { clientId: testClientId }, force: true });

            // Get client access (should return default)
            const clientAccess = await catalogAccessService.getClientAccess(testClientId);

            // Verify default values
            expect(clientAccess.accessMode).to.equal('all');
            expect(clientAccess.allowedCategories).to.deep.equal([]);
            expect(clientAccess.allowedItems).to.deep.equal([]);
            expect(clientAccess.deniedCategories).to.deep.equal([]);
            expect(clientAccess.deniedItems).to.deep.equal([]);
            expect(clientAccess.isDefault).to.be.true;

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return default inherit mode when getUserAccess is called for non-existent rules', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            // Clean up any existing access rules
            await ClientUserCatalogAccess.destroy({ where: { clientUserId: testClientUserId }, force: true });

            // Get user access (should return default)
            const userAccess = await catalogAccessService.getUserAccess(testClientUserId);

            // Verify default values
            expect(userAccess.inheritanceMode).to.equal('inherit');
            expect(userAccess.isDefault).to.be.true;

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Access Modes Behave Correctly
   * 
   * *For any* client:
   * - If accessMode='all': all public items are accessible (minus denied)
   * - If accessMode='selected': only allowed items/categories are accessible
   * - If accessMode='none': no items are accessible
   * 
   * **Validates: Requirements 1.5**
   * 
   * Feature: catalog-access-control, Property 3: Access Modes Behave Correctly
   */
  describe('Property 3: Access Modes Behave Correctly', function() {
    it('should grant access to all items when accessMode is all', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.constant('all'),
          async (accessMode) => {
            // Set client access with 'all' mode
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode,
              allowedCategories: [],
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user to inherit
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Check access to all items
            for (const itemId of testItemIds) {
              const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
              expect(hasAccess).to.be.true;
            }

            // Filter catalog should return all items
            const filteredItems = await catalogAccessService.filterCatalog(testClientUserId, {});
            expect(filteredItems.length).to.equal(testItemIds.length);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should grant access only to selected items when accessMode is selected', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testItemIds),
          async (allowedCategories, allowedItems) => {
            // Set client access with 'selected' mode
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'selected',
              allowedCategories,
              allowedItems,
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user to inherit
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Check access to each item
            for (const itemId of testItemIds) {
              const item = await CatalogItem.findByPk(itemId);
              const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
              
              const isAllowedItem = allowedItems.includes(itemId);
              const isInAllowedCategory = item && allowedCategories.includes(item.categoryId);
              const shouldHaveAccess = isAllowedItem || isInAllowedCategory;
              
              expect(hasAccess).to.equal(shouldHaveAccess);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access to all items when accessMode is none', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.constant('none'),
          async (accessMode) => {
            // Set client access with 'none' mode
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode,
              allowedCategories: [],
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user to inherit
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Check access to all items - all should be denied
            for (const itemId of testItemIds) {
              const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
              expect(hasAccess).to.be.false;
            }

            // Filter catalog should return empty
            const filteredItems = await catalogAccessService.filterCatalog(testClientUserId, {});
            expect(filteredItems.length).to.equal(0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should respect denied items even when accessMode is all', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testItemIds),
          async (deniedItems) => {
            // Set client access with 'all' mode but some denied items
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'all',
              allowedCategories: [],
              allowedItems: [],
              deniedCategories: [],
              deniedItems
            }, null);

            // Set user to inherit
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Check access to each item
            for (const itemId of testItemIds) {
              const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
              const isDenied = deniedItems.includes(itemId);
              
              // If denied, should not have access; otherwise should have access
              expect(hasAccess).to.equal(!isDenied);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should respect denied categories even when accessMode is all', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testCategoryIds),
          async (deniedCategories) => {
            // Set client access with 'all' mode but some denied categories
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'all',
              allowedCategories: [],
              allowedItems: [],
              deniedCategories,
              deniedItems: []
            }, null);

            // Set user to inherit
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Check access to each item
            for (const itemId of testItemIds) {
              const item = await CatalogItem.findByPk(itemId);
              const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
              const isInDeniedCategory = item && deniedCategories.includes(item.categoryId);
              
              // If in denied category, should not have access; otherwise should have access
              expect(hasAccess).to.equal(!isInDeniedCategory);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Whitelist and Blacklist Modes
   * 
   * *For any* permission configuration:
   * - Items in allowedItems/allowedCategories are accessible (whitelist)
   * - Items in deniedItems/deniedCategories are NOT accessible (blacklist)
   * - Blacklist takes precedence over whitelist
   * 
   * **Validates: Requirements 6.4**
   * 
   * Feature: catalog-access-control, Property 9: Whitelist and Blacklist Modes
   */
  describe('Property 9: Whitelist and Blacklist Modes', function() {
    it('should allow access to whitelisted items', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testItemIds),
          async (allowedItems) => {
            // Set client access with whitelist
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'selected',
              allowedCategories: [],
              allowedItems,
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user to inherit
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Check access to whitelisted items
            for (const itemId of allowedItems) {
              const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
              expect(hasAccess).to.be.true;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow access to items in whitelisted categories', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testCategoryIds),
          async (allowedCategories) => {
            // Set client access with whitelisted categories
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'selected',
              allowedCategories,
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            }, null);

            // Set user to inherit
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Check access to items in whitelisted categories
            for (const itemId of testItemIds) {
              const item = await CatalogItem.findByPk(itemId);
              const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
              const isInAllowedCategory = item && allowedCategories.includes(item.categoryId);
              
              expect(hasAccess).to.equal(isInAllowedCategory);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access to blacklisted items', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testItemIds),
          async (deniedItems) => {
            // Set client access with blacklist
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'all',
              allowedCategories: [],
              allowedItems: [],
              deniedCategories: [],
              deniedItems
            }, null);

            // Set user to inherit
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Check access to blacklisted items - should be denied
            for (const itemId of deniedItems) {
              const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
              expect(hasAccess).to.be.false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access to items in blacklisted categories', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testCategoryIds),
          async (deniedCategories) => {
            // Set client access with blacklisted categories
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'all',
              allowedCategories: [],
              allowedItems: [],
              deniedCategories,
              deniedItems: []
            }, null);

            // Set user to inherit
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Check access to items in blacklisted categories - should be denied
            for (const itemId of testItemIds) {
              const item = await CatalogItem.findByPk(itemId);
              const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
              const isInDeniedCategory = item && deniedCategories.includes(item.categoryId);
              
              if (isInDeniedCategory) {
                expect(hasAccess).to.be.false;
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should give blacklist precedence over whitelist for items', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testItemIds),
          async (itemsToTest) => {
            // Skip if no items
            if (itemsToTest.length === 0) {
              return true;
            }

            // Put all items in both whitelist and blacklist
            const allowedItems = itemsToTest;
            const deniedItems = itemsToTest;

            // Set client access with both whitelist and blacklist
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'selected',
              allowedCategories: [],
              allowedItems,
              deniedCategories: [],
              deniedItems
            }, null);

            // Set user to inherit
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Check access - blacklist should take precedence
            for (const itemId of itemsToTest) {
              const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
              expect(hasAccess).to.be.false; // Blacklist wins
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should give blacklist precedence over whitelist for categories', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testCategoryIds),
          async (categoriesToTest) => {
            // Skip if no categories
            if (categoriesToTest.length === 0) {
              return true;
            }

            // Put all categories in both whitelist and blacklist
            const allowedCategories = categoriesToTest;
            const deniedCategories = categoriesToTest;

            // Set client access with both whitelist and blacklist
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'selected',
              allowedCategories,
              allowedItems: [],
              deniedCategories,
              deniedItems: []
            }, null);

            // Set user to inherit
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Check access to items in these categories - blacklist should take precedence
            for (const itemId of testItemIds) {
              const item = await CatalogItem.findByPk(itemId);
              if (item && categoriesToTest.includes(item.categoryId)) {
                const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
                expect(hasAccess).to.be.false; // Blacklist wins
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny item if in blacklist even when category is whitelisted', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testItemIds),
          async (allowedCategories, deniedItems) => {
            // Skip if no data
            if (allowedCategories.length === 0 || deniedItems.length === 0) {
              return true;
            }

            // Set client access with whitelisted categories but blacklisted items
            await catalogAccessService.setClientAccess(testClientId, {
              accessMode: 'selected',
              allowedCategories,
              allowedItems: [],
              deniedCategories: [],
              deniedItems
            }, null);

            // Set user to inherit
            await catalogAccessService.setUserAccess(testClientUserId, {
              inheritanceMode: 'inherit'
            }, null);

            // Check access to denied items - should be denied even if category is allowed
            for (const itemId of deniedItems) {
              const hasAccess = await catalogAccessService.hasAccessToItem(testClientUserId, itemId);
              expect(hasAccess).to.be.false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Serialization Round-Trip
   * 
   * *For any* valid CatalogAccessRules object, serializing to storage format 
   * and deserializing back must produce an equivalent object.
   * 
   * **Validates: Requirements 6.6**
   * 
   * Feature: catalog-access-control, Property 10: Serialization Round-Trip
   */
  describe('Property 10: Serialization Round-Trip', function() {
    it('should preserve client access rules through save and retrieve', async function() {
      await fc.assert(
        fc.asyncProperty(
          accessModeArb,
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testItemIds),
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testItemIds),
          async (accessMode, allowedCategories, allowedItems, deniedCategories, deniedItems) => {
            // Create access rules
            const originalRules = {
              accessMode,
              allowedCategories,
              allowedItems,
              deniedCategories,
              deniedItems
            };

            // Save to database
            await catalogAccessService.setClientAccess(testClientId, originalRules, null);

            // Retrieve from database
            const retrievedRules = await catalogAccessService.getClientAccess(testClientId);

            // Verify round-trip preserves data
            expect(retrievedRules.accessMode).to.equal(originalRules.accessMode);
            expect(retrievedRules.allowedCategories.sort()).to.deep.equal(originalRules.allowedCategories.sort());
            expect(retrievedRules.allowedItems.sort()).to.deep.equal(originalRules.allowedItems.sort());
            expect(retrievedRules.deniedCategories.sort()).to.deep.equal(originalRules.deniedCategories.sort());
            expect(retrievedRules.deniedItems.sort()).to.deep.equal(originalRules.deniedItems.sort());

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve client user access rules through save and retrieve', async function() {
      await fc.assert(
        fc.asyncProperty(
          inheritanceModeArb,
          accessModeArb,
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testItemIds),
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testItemIds),
          async (inheritanceMode, accessMode, allowedCategories, allowedItems, deniedCategories, deniedItems) => {
            // Create access rules
            const originalRules = {
              inheritanceMode,
              accessMode,
              allowedCategories,
              allowedItems,
              deniedCategories,
              deniedItems
            };

            // Save to database
            await catalogAccessService.setUserAccess(testClientUserId, originalRules, null);

            // Retrieve from database
            const retrievedRules = await catalogAccessService.getUserAccess(testClientUserId);

            // Verify round-trip preserves data
            expect(retrievedRules.inheritanceMode).to.equal(originalRules.inheritanceMode);
            expect(retrievedRules.accessMode).to.equal(originalRules.accessMode);
            expect(retrievedRules.allowedCategories.sort()).to.deep.equal(originalRules.allowedCategories.sort());
            expect(retrievedRules.allowedItems.sort()).to.deep.equal(originalRules.allowedItems.sort());
            expect(retrievedRules.deniedCategories.sort()).to.deep.equal(originalRules.deniedCategories.sort());
            expect(retrievedRules.deniedItems.sort()).to.deep.equal(originalRules.deniedItems.sort());

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve empty arrays through serialization', async function() {
      await fc.assert(
        fc.asyncProperty(
          accessModeArb,
          async (accessMode) => {
            // Create access rules with empty arrays
            const originalRules = {
              accessMode,
              allowedCategories: [],
              allowedItems: [],
              deniedCategories: [],
              deniedItems: []
            };

            // Save to database
            await catalogAccessService.setClientAccess(testClientId, originalRules, null);

            // Retrieve from database
            const retrievedRules = await catalogAccessService.getClientAccess(testClientId);

            // Verify empty arrays are preserved
            expect(retrievedRules.allowedCategories).to.deep.equal([]);
            expect(retrievedRules.allowedItems).to.deep.equal([]);
            expect(retrievedRules.deniedCategories).to.deep.equal([]);
            expect(retrievedRules.deniedItems).to.deep.equal([]);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve UUID format through serialization', async function() {
      await fc.assert(
        fc.asyncProperty(
          uuidArrayArb(testCategoryIds),
          uuidArrayArb(testItemIds),
          async (allowedCategories, allowedItems) => {
            // Create access rules
            const originalRules = {
              accessMode: 'selected',
              allowedCategories,
              allowedItems,
              deniedCategories: [],
              deniedItems: []
            };

            // Save to database
            await catalogAccessService.setClientAccess(testClientId, originalRules, null);

            // Retrieve from database
            const retrievedRules = await catalogAccessService.getClientAccess(testClientId);

            // Verify UUIDs are preserved correctly
            for (const categoryId of allowedCategories) {
              expect(retrievedRules.allowedCategories).to.include(categoryId);
            }
            for (const itemId of allowedItems) {
              expect(retrievedRules.allowedItems).to.include(itemId);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple updates preserving latest state', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.array(accessModeArb, { minLength: 2, maxLength: 5 }),
          async (accessModes) => {
            // Perform multiple updates
            for (const accessMode of accessModes) {
              await catalogAccessService.setClientAccess(testClientId, {
                accessMode,
                allowedCategories: [],
                allowedItems: [],
                deniedCategories: [],
                deniedItems: []
              }, null);
            }

            // Retrieve from database
            const retrievedRules = await catalogAccessService.getClientAccess(testClientId);

            // Should have the last access mode
            const lastAccessMode = accessModes[accessModes.length - 1];
            expect(retrievedRules.accessMode).to.equal(lastAccessMode);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});