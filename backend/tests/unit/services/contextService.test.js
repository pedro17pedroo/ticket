/**
 * Testes Unitários - ContextService
 * Testa a funcionalidade de rastreamento de último contexto usado
 */

import { expect } from 'chai';
import sinon from 'sinon';
import contextService from '../../../src/services/contextService.js';
import OrganizationUser from '../../../src/models/OrganizationUser.js';
import ClientUser from '../../../src/models/ClientUser.js';
import ContextSession from '../../../src/models/ContextSession.js';
import Organization from '../../../src/modules/organizations/organizationModel.js';
import Client from '../../../src/models/Client.js';

describe('ContextService - Last Used Context Tracking', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getContextsForEmail', () => {
    it('deve marcar o último contexto usado com isLastUsed=true', async () => {
      const testEmail = 'test@example.com';
      const testOrgId = 'org-123';
      const testUserId = 'user-123';
      const lastActivityDate = new Date('2024-01-15T10:00:00Z');

      // Mock organization users
      const mockOrgUser = {
        id: testUserId,
        email: testEmail,
        organizationId: testOrgId,
        name: 'Test User',
        role: 'agent',
        permissions: [],
        avatar: null,
        isActive: true,
        organization: {
          name: 'Test Org',
          slug: 'test-org',
          isActive: true
        },
        comparePassword: sandbox.stub().resolves(true)
      };

      sandbox.stub(OrganizationUser, 'scope').returns({
        findAll: sandbox.stub().resolves([mockOrgUser])
      });

      sandbox.stub(ClientUser, 'scope').returns({
        findAll: sandbox.stub().resolves([])
      });

      // Mock last session
      const mockSession = {
        userId: testUserId,
        contextId: testOrgId,
        contextType: 'organization',
        lastActivityAt: lastActivityDate
      };

      sandbox.stub(ContextSession, 'findOne').resolves(mockSession);

      // Execute
      const contexts = await contextService.getContextsForEmail(testEmail, 'password123');

      // Verify
      expect(contexts).to.have.lengthOf(1);
      expect(contexts[0].isLastUsed).to.be.true;
      expect(contexts[0].lastAccessedAt).to.deep.equal(lastActivityDate);
    });

    it('deve marcar isLastUsed=false quando não há sessão anterior', async () => {
      const testEmail = 'test@example.com';
      const testOrgId = 'org-123';
      const testUserId = 'user-123';

      // Mock organization users
      const mockOrgUser = {
        id: testUserId,
        email: testEmail,
        organizationId: testOrgId,
        name: 'Test User',
        role: 'agent',
        permissions: [],
        avatar: null,
        isActive: true,
        organization: {
          name: 'Test Org',
          slug: 'test-org',
          isActive: true
        },
        comparePassword: sandbox.stub().resolves(true)
      };

      sandbox.stub(OrganizationUser, 'scope').returns({
        findAll: sandbox.stub().resolves([mockOrgUser])
      });

      sandbox.stub(ClientUser, 'scope').returns({
        findAll: sandbox.stub().resolves([])
      });

      // Mock no session found
      sandbox.stub(ContextSession, 'findOne').resolves(null);

      // Execute
      const contexts = await contextService.getContextsForEmail(testEmail, 'password123');

      // Verify
      expect(contexts).to.have.lengthOf(1);
      expect(contexts[0].isLastUsed).to.be.false;
      expect(contexts[0].lastAccessedAt).to.be.null;
    });

    it('deve marcar apenas um contexto como último usado quando há múltiplos contextos', async () => {
      const testEmail = 'test@example.com';
      const testOrgId1 = 'org-123';
      const testOrgId2 = 'org-456';
      const testUserId1 = 'user-123';
      const testUserId2 = 'user-456';
      const lastActivityDate = new Date('2024-01-15T10:00:00Z');

      // Mock organization users
      const mockOrgUser1 = {
        id: testUserId1,
        email: testEmail,
        organizationId: testOrgId1,
        name: 'Test User 1',
        role: 'agent',
        permissions: [],
        avatar: null,
        isActive: true,
        organization: {
          name: 'Test Org 1',
          slug: 'test-org-1',
          isActive: true
        },
        comparePassword: sandbox.stub().resolves(true)
      };

      const mockOrgUser2 = {
        id: testUserId2,
        email: testEmail,
        organizationId: testOrgId2,
        name: 'Test User 2',
        role: 'admin',
        permissions: [],
        avatar: null,
        isActive: true,
        organization: {
          name: 'Test Org 2',
          slug: 'test-org-2',
          isActive: true
        },
        comparePassword: sandbox.stub().resolves(true)
      };

      sandbox.stub(OrganizationUser, 'scope').returns({
        findAll: sandbox.stub().resolves([mockOrgUser1, mockOrgUser2])
      });

      sandbox.stub(ClientUser, 'scope').returns({
        findAll: sandbox.stub().resolves([])
      });

      // Mock last session for second user
      const mockSession = {
        userId: testUserId2,
        contextId: testOrgId2,
        contextType: 'organization',
        lastActivityAt: lastActivityDate
      };

      sandbox.stub(ContextSession, 'findOne').resolves(mockSession);

      // Execute
      const contexts = await contextService.getContextsForEmail(testEmail, 'password123');

      // Verify
      expect(contexts).to.have.lengthOf(2);
      
      const lastUsedContexts = contexts.filter(ctx => ctx.isLastUsed);
      expect(lastUsedContexts).to.have.lengthOf(1);
      expect(lastUsedContexts[0].userId).to.equal(testUserId2);
      expect(lastUsedContexts[0].lastAccessedAt).to.deep.equal(lastActivityDate);

      const notLastUsedContexts = contexts.filter(ctx => !ctx.isLastUsed);
      expect(notLastUsedContexts).to.have.lengthOf(1);
      expect(notLastUsedContexts[0].userId).to.equal(testUserId1);
      expect(notLastUsedContexts[0].lastAccessedAt).to.be.null;
    });
  });
});
