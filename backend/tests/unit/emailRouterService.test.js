/**
 * Unit Tests - Email Router Service
 * 
 * Tests edge cases for email routing functionality
 * Validates: Requirements 5.2, 5.3
 */

import { expect } from 'chai';
import Direction from '../../src/modules/directions/directionModel.js';
import Section from '../../src/modules/sections/sectionModel.js';
import Department from '../../src/modules/departments/departmentModel.js';
import { Organization } from '../../src/modules/models/index.js';
import emailRouterService from '../../src/services/emailRouterService.js';

describe('Email Router Service - Unit Tests', function() {
  let testOrganizationId;
  let testDirectionId;
  let testDepartmentId;

  before(async function() {
    // Create test organization
    const org = await Organization.create({
      name: 'Test Organization for Email Router Unit Tests',
      slug: `test-org-email-router-unit-${Date.now()}`,
      type: 'tenant',
      status: 'active'
    });
    testOrganizationId = org.id;

    // Create test direction
    const direction = await Direction.create({
      organizationId: testOrganizationId,
      name: 'Test Direction for Email Router Unit Tests',
      description: 'Test direction',
      isActive: true
    });
    testDirectionId = direction.id;

    // Create test department
    const department = await Department.create({
      organizationId: testOrganizationId,
      directionId: testDirectionId,
      name: 'Test Department for Email Router Unit Tests',
      description: 'Test department',
      isActive: true
    });
    testDepartmentId = department.id;
  });

  after(async function() {
    // Clean up test data
    await Section.destroy({ where: { organizationId: testOrganizationId }, force: true });
    await Department.destroy({ where: { organizationId: testOrganizationId }, force: true });
    await Direction.destroy({ where: { organizationId: testOrganizationId }, force: true });
    await Organization.destroy({ where: { id: testOrganizationId }, force: true });
  });

  describe('Edge Case: No Match Found', function() {
    it('should return null when no organizational unit matches the email', async function() {
      const nonExistentEmail = `nonexistent-${Date.now()}@example.com`;
      
      const result = await emailRouterService.findOrganizationalUnitByEmail(
        nonExistentEmail,
        testOrganizationId
      );

      expect(result).to.be.null;
    });

    it('should return null for empty email string', async function() {
      const result = await emailRouterService.findOrganizationalUnitByEmail(
        '',
        testOrganizationId
      );

      expect(result).to.be.null;
    });

    it('should return null for null email', async function() {
      const result = await emailRouterService.findOrganizationalUnitByEmail(
        null,
        testOrganizationId
      );

      expect(result).to.be.null;
    });

    it('should return null for whitespace-only email', async function() {
      const result = await emailRouterService.findOrganizationalUnitByEmail(
        '   ',
        testOrganizationId
      );

      expect(result).to.be.null;
    });

    it('should return null when searching in wrong organization', async function() {
      // Create a direction with email in test organization
      const direction = await Direction.create({
        organizationId: testOrganizationId,
        name: `Direction ${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        isActive: true
      });

      // Create another organization
      const otherOrg = await Organization.create({
        name: 'Other Organization',
        slug: `other-org-${Date.now()}`,
        type: 'tenant',
        status: 'active'
      });

      // Search for the email in the other organization
      const result = await emailRouterService.findOrganizationalUnitByEmail(
        direction.email,
        otherOrg.id
      );

      expect(result).to.be.null;

      // Clean up
      await direction.destroy({ force: true });
      await otherOrg.destroy({ force: true });
    });
  });

  describe('Edge Case: Multiple Matches (Should Not Happen)', function() {
    it('should return the first match when multiple units have same email (section priority)', async function() {
      const sharedEmail = `shared-${Date.now()}@example.com`;

      // Create direction with email
      const direction = await Direction.create({
        organizationId: testOrganizationId,
        name: `Direction ${Date.now()}`,
        email: sharedEmail,
        isActive: true
      });

      // Create department with same email (should be prevented by validation, but testing edge case)
      const department = await Department.create({
        organizationId: testOrganizationId,
        directionId: testDirectionId,
        name: `Department ${Date.now()}`,
        email: sharedEmail,
        isActive: true
      });

      // Create section with same email
      const section = await Section.create({
        organizationId: testOrganizationId,
        directionId: testDirectionId,
        departmentId: testDepartmentId,
        name: `Section ${Date.now()}`,
        email: sharedEmail,
        isActive: true
      });

      // Router should return section (highest priority)
      const result = await emailRouterService.findOrganizationalUnitByEmail(
        sharedEmail,
        testOrganizationId
      );

      expect(result).to.not.be.null;
      expect(result.type).to.equal('section');
      expect(result.unit.id).to.equal(section.id);

      // Clean up
      await section.destroy({ force: true });
      await department.destroy({ force: true });
      await direction.destroy({ force: true });
    });

    it('should return department when both department and direction have same email', async function() {
      const sharedEmail = `shared-dept-dir-${Date.now()}@example.com`;

      // Create direction with email
      const direction = await Direction.create({
        organizationId: testOrganizationId,
        name: `Direction ${Date.now()}`,
        email: sharedEmail,
        isActive: true
      });

      // Create department with same email
      const department = await Department.create({
        organizationId: testOrganizationId,
        directionId: testDirectionId,
        name: `Department ${Date.now()}`,
        email: sharedEmail,
        isActive: true
      });

      // Router should return department (higher priority than direction)
      const result = await emailRouterService.findOrganizationalUnitByEmail(
        sharedEmail,
        testOrganizationId
      );

      expect(result).to.not.be.null;
      expect(result.type).to.equal('department');
      expect(result.unit.id).to.equal(department.id);

      // Clean up
      await department.destroy({ force: true });
      await direction.destroy({ force: true });
    });
  });

  describe('Edge Case: Case Sensitivity', function() {
    it('should find organizational unit regardless of email case', async function() {
      const email = `test-case-${Date.now()}@example.com`;

      // Create direction with lowercase email
      const direction = await Direction.create({
        organizationId: testOrganizationId,
        name: `Direction ${Date.now()}`,
        email: email.toLowerCase(),
        isActive: true
      });

      // Search with uppercase
      const result1 = await emailRouterService.findOrganizationalUnitByEmail(
        email.toUpperCase(),
        testOrganizationId
      );

      expect(result1).to.not.be.null;
      expect(result1.type).to.equal('direction');
      expect(result1.unit.id).to.equal(direction.id);

      // Search with mixed case
      const mixedCase = email.split('').map((c, i) => 
        i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()
      ).join('');

      const result2 = await emailRouterService.findOrganizationalUnitByEmail(
        mixedCase,
        testOrganizationId
      );

      expect(result2).to.not.be.null;
      expect(result2.type).to.equal('direction');
      expect(result2.unit.id).to.equal(direction.id);

      // Clean up
      await direction.destroy({ force: true });
    });
  });

  describe('Edge Case: Email with Whitespace', function() {
    it('should trim whitespace from email before searching', async function() {
      const email = `test-whitespace-${Date.now()}@example.com`;

      // Create direction with email
      const direction = await Direction.create({
        organizationId: testOrganizationId,
        name: `Direction ${Date.now()}`,
        email: email,
        isActive: true
      });

      // Search with leading/trailing whitespace
      const result = await emailRouterService.findOrganizationalUnitByEmail(
        `  ${email}  `,
        testOrganizationId
      );

      expect(result).to.not.be.null;
      expect(result.type).to.equal('direction');
      expect(result.unit.id).to.equal(direction.id);

      // Clean up
      await direction.destroy({ force: true });
    });
  });

  describe('Return Value Structure', function() {
    it('should return correct structure for direction', async function() {
      const email = `test-structure-dir-${Date.now()}@example.com`;

      const direction = await Direction.create({
        organizationId: testOrganizationId,
        name: `Direction ${Date.now()}`,
        email: email,
        isActive: true
      });

      const result = await emailRouterService.findOrganizationalUnitByEmail(
        email,
        testOrganizationId
      );

      expect(result).to.be.an('object');
      expect(result).to.have.property('type');
      expect(result).to.have.property('unit');
      expect(result.type).to.equal('direction');
      expect(result.unit).to.be.an('object');
      expect(result.unit).to.have.property('id');
      expect(result.unit).to.have.property('name');
      expect(result.unit).to.have.property('email');

      await direction.destroy({ force: true });
    });

    it('should return correct structure for department', async function() {
      const email = `test-structure-dept-${Date.now()}@example.com`;

      const department = await Department.create({
        organizationId: testOrganizationId,
        directionId: testDirectionId,
        name: `Department ${Date.now()}`,
        email: email,
        isActive: true
      });

      const result = await emailRouterService.findOrganizationalUnitByEmail(
        email,
        testOrganizationId
      );

      expect(result).to.be.an('object');
      expect(result).to.have.property('type');
      expect(result).to.have.property('unit');
      expect(result.type).to.equal('department');
      expect(result.unit).to.be.an('object');
      expect(result.unit).to.have.property('id');
      expect(result.unit).to.have.property('name');
      expect(result.unit).to.have.property('email');

      await department.destroy({ force: true });
    });

    it('should return correct structure for section', async function() {
      const email = `test-structure-sect-${Date.now()}@example.com`;

      const section = await Section.create({
        organizationId: testOrganizationId,
        directionId: testDirectionId,
        departmentId: testDepartmentId,
        name: `Section ${Date.now()}`,
        email: email,
        isActive: true
      });

      const result = await emailRouterService.findOrganizationalUnitByEmail(
        email,
        testOrganizationId
      );

      expect(result).to.be.an('object');
      expect(result).to.have.property('type');
      expect(result).to.have.property('unit');
      expect(result.type).to.equal('section');
      expect(result.unit).to.be.an('object');
      expect(result.unit).to.have.property('id');
      expect(result.unit).to.have.property('name');
      expect(result.unit).to.have.property('email');

      await section.destroy({ force: true });
    });
  });
});
