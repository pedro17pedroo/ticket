/**
 * End-to-End Integration Tests - Email to Ticket Flow
 * 
 * Tests the complete flow from receiving an email to creating a ticket
 * assigned to the correct organizational unit (Direction, Department, or Section)
 * 
 * Validates: Requirements 4.1, 4.3, 10.1, 10.2, 10.3, 10.4, 3.1
 */

import { expect } from 'chai';
import Direction from '../../src/modules/directions/directionModel.js';
import Section from '../../src/modules/sections/sectionModel.js';
import Department from '../../src/modules/departments/departmentModel.js';
import { Organization, User } from '../../src/modules/models/index.js';
import Ticket from '../../src/modules/tickets/ticketModel.js';
import emailInboxService from '../../src/services/emailInboxService.js';
import emailValidationService from '../../src/services/emailValidationService.js';

describe('End-to-End Integration Tests - Email to Ticket Flow', function() {
  this.timeout(30000);

  let testOrganization;
  let testUser;
  let testDirection;
  let testDepartment;

  before(async function() {
    try {
      // Create test organization
      testOrganization = await Organization.create({
        name: 'Test Organization for E2E Email Tests',
        slug: `test-org-e2e-email-${Date.now()}`,
        type: 'tenant',
        status: 'active'
      });

      // Create test user (required for ticket creation)
      testUser = await User.create({
        name: 'Test User for E2E Email',
        email: `test-e2e-user-${Date.now()}@example.com`,
        password: 'password123',
        organizationId: testOrganization.id,
        role: 'agent',
        isActive: true
      });

      // Create test direction (required for departments and sections)
      testDirection = await Direction.create({
        organizationId: testOrganization.id,
        name: 'Test Direction for E2E Email',
        description: 'Test direction for E2E email tests',
        isActive: true
      });

      // Create test department (required for sections)
      testDepartment = await Department.create({
        organizationId: testOrganization.id,
        directionId: testDirection.id,
        name: 'Test Department for E2E Email',
        description: 'Test department for E2E email tests',
        isActive: true
      });
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });

  after(async function() {
    // Clean up test data
    try {
      await Ticket.destroy({ where: { organizationId: testOrganization.id }, force: true });
      await Section.destroy({ where: { organizationId: testOrganization.id }, force: true });
      await Department.destroy({ where: { organizationId: testOrganization.id }, force: true });
      await Direction.destroy({ where: { organizationId: testOrganization.id }, force: true });
      if (testUser) {
        await testUser.destroy({ force: true });
      }
      await Organization.destroy({ where: { id: testOrganization.id }, force: true });
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  });

  /**
   * Test 12.1: Direction email-to-ticket flow
   * 
   * Create Direction with email
   * Simulate email received at that address
   * Verify ticket created with directionId
   * 
   * **Validates: Requirements 4.1, 10.1, 10.2**
   */
  describe('12.1 Direction Email-to-Ticket Flow', function() {
    it('should create ticket assigned to Direction when email is sent to Direction address', async function() {
      // Create Direction with email
      const directionEmail = `direction-e2e-${Date.now()}@example.com`;
      const direction = await Direction.create({
        organizationId: testOrganization.id,
        name: 'Direction with Email E2E',
        email: directionEmail,
        isActive: true
      });

      // Simulate email received at that address
      const emailData = {
        to: {
          value: [{ address: directionEmail }]
        },
        date: new Date(),
        attachments: []
      };

      // Create ticket from email
      const ticket = await emailInboxService.createTicketFromEmail(
        testUser.email,
        'Test Subject for Direction',
        'Test Body for Direction',
        emailData
      );

      // Verify ticket created with directionId
      expect(ticket).to.not.be.null;
      expect(ticket).to.be.an('object');
      expect(ticket.directionId).to.equal(direction.id);
      expect(ticket.departmentId).to.be.null;
      expect(ticket.sectionId).to.be.null;
      expect(ticket.subject).to.equal('Test Subject for Direction');
      expect(ticket.description).to.equal('Test Body for Direction');
      expect(ticket.source).to.equal('email');
      expect(ticket.metadata.emailFrom).to.equal(testUser.email);
      expect(ticket.metadata.emailTo).to.equal(directionEmail);

      // Clean up
      await ticket.destroy({ force: true });
      await direction.destroy({ force: true });
    });

    it('should handle case-insensitive email matching for Direction', async function() {
      // Create Direction with lowercase email
      const directionEmail = `direction-case-${Date.now()}@example.com`;
      const direction = await Direction.create({
        organizationId: testOrganization.id,
        name: 'Direction Case Test',
        email: directionEmail.toLowerCase(),
        isActive: true
      });

      // Simulate email with uppercase address
      const emailData = {
        to: {
          value: [{ address: directionEmail.toUpperCase() }]
        },
        date: new Date(),
        attachments: []
      };

      // Create ticket from email
      const ticket = await emailInboxService.createTicketFromEmail(
        testUser.email,
        'Test Subject Case',
        'Test Body Case',
        emailData
      );

      // Verify ticket created with directionId
      expect(ticket).to.not.be.null;
      expect(ticket.directionId).to.equal(direction.id);

      // Clean up
      await ticket.destroy({ force: true });
      await direction.destroy({ force: true });
    });

    it('should preserve email metadata in ticket', async function() {
      // Create Direction with email
      const directionEmail = `direction-metadata-${Date.now()}@example.com`;
      const direction = await Direction.create({
        organizationId: testOrganization.id,
        name: 'Direction Metadata Test',
        email: directionEmail,
        isActive: true
      });

      const emailDate = new Date();
      const emailData = {
        to: {
          value: [{ address: directionEmail }]
        },
        date: emailDate,
        attachments: [
          { filename: 'test.pdf', contentType: 'application/pdf', size: 1024 }
        ]
      };

      // Create ticket from email
      const ticket = await emailInboxService.createTicketFromEmail(
        testUser.email,
        'Test with Attachments',
        'Test Body with Attachments',
        emailData
      );

      // Verify metadata
      expect(ticket.metadata).to.be.an('object');
      expect(ticket.metadata.emailFrom).to.equal(testUser.email);
      expect(ticket.metadata.emailTo).to.equal(directionEmail);
      expect(ticket.metadata.hasAttachments).to.be.true;
      expect(ticket.metadata.attachmentsCount).to.equal(1);

      // Clean up
      await ticket.destroy({ force: true });
      await direction.destroy({ force: true });
    });
  });

  /**
   * Test 12.2: Department email-to-ticket flow (Backward Compatibility)
   * 
   * Verify existing Department email functionality still works
   * 
   * **Property 10: Backward Compatibility**
   * **Validates: Requirements 10.1, 10.2, 10.3, 10.4**
   */
  describe('12.2 Department Email-to-Ticket Flow (Backward Compatibility)', function() {
    it('should create ticket assigned to Department when email is sent to Department address', async function() {
      // Create Department with email
      const departmentEmail = `department-e2e-${Date.now()}@example.com`;
      const department = await Department.create({
        organizationId: testOrganization.id,
        directionId: testDirection.id,
        name: 'Department with Email E2E',
        email: departmentEmail,
        isActive: true
      });

      // Simulate email received at that address
      const emailData = {
        to: {
          value: [{ address: departmentEmail }]
        },
        date: new Date(),
        attachments: []
      };

      // Create ticket from email
      const ticket = await emailInboxService.createTicketFromEmail(
        testUser.email,
        'Test Subject for Department',
        'Test Body for Department',
        emailData
      );

      // Verify ticket created with departmentId
      expect(ticket).to.not.be.null;
      expect(ticket).to.be.an('object');
      expect(ticket.departmentId).to.equal(department.id);
      expect(ticket.directionId).to.be.null;
      expect(ticket.sectionId).to.be.null;
      expect(ticket.subject).to.equal('Test Subject for Department');
      expect(ticket.description).to.equal('Test Body for Department');

      // Clean up
      await ticket.destroy({ force: true });
      await department.destroy({ force: true });
    });

    it('should maintain Department email functionality after adding Direction and Section emails', async function() {
      // Create Direction with email
      const directionEmail = `direction-compat-${Date.now()}@example.com`;
      const direction = await Direction.create({
        organizationId: testOrganization.id,
        name: 'Direction Compat Test',
        email: directionEmail,
        isActive: true
      });

      // Create Department with different email
      const departmentEmail = `department-compat-${Date.now()}@example.com`;
      const department = await Department.create({
        organizationId: testOrganization.id,
        directionId: direction.id,
        name: 'Department Compat Test',
        email: departmentEmail,
        isActive: true
      });

      // Create Section with different email
      const sectionEmail = `section-compat-${Date.now()}@example.com`;
      const section = await Section.create({
        organizationId: testOrganization.id,
        departmentId: department.id,
        name: 'Section Compat Test',
        email: sectionEmail,
        isActive: true
      });

      // Test Department email still works
      const emailData = {
        to: {
          value: [{ address: departmentEmail }]
        },
        date: new Date(),
        attachments: []
      };

      const ticket = await emailInboxService.createTicketFromEmail(
        testUser.email,
        'Department Compat Test',
        'Testing backward compatibility',
        emailData
      );

      // Verify ticket assigned to Department
      expect(ticket).to.not.be.null;
      expect(ticket.departmentId).to.equal(department.id);
      expect(ticket.directionId).to.be.null;
      expect(ticket.sectionId).to.be.null;

      // Clean up
      await ticket.destroy({ force: true });
      await section.destroy({ force: true });
      await department.destroy({ force: true });
      await direction.destroy({ force: true });
    });

    it('should preserve existing Department emails after migration', async function() {
      // Create Department with email (simulating existing data)
      const departmentEmail = `existing-dept-${Date.now()}@example.com`;
      const department = await Department.create({
        organizationId: testOrganization.id,
        directionId: testDirection.id,
        name: 'Existing Department',
        email: departmentEmail,
        isActive: true
      });

      // Verify email is stored correctly
      expect(department.email).to.equal(departmentEmail);

      // Fetch from database to ensure persistence
      const fetchedDepartment = await Department.findByPk(department.id);
      expect(fetchedDepartment.email).to.equal(departmentEmail);

      // Verify ticket routing still works
      const emailData = {
        to: {
          value: [{ address: departmentEmail }]
        },
        date: new Date(),
        attachments: []
      };

      const ticket = await emailInboxService.createTicketFromEmail(
        testUser.email,
        'Existing Department Test',
        'Testing existing department email',
        emailData
      );

      expect(ticket).to.not.be.null;
      expect(ticket.departmentId).to.equal(department.id);

      // Clean up
      await ticket.destroy({ force: true });
      await department.destroy({ force: true });
    });
  });

  /**
   * Test 12.3: Section email-to-ticket flow
   * 
   * Create Section with email
   * Simulate email received at that address
   * Verify ticket created with sectionId
   * 
   * **Validates: Requirements 4.3, 10.1, 10.2**
   */
  describe('12.3 Section Email-to-Ticket Flow', function() {
    it('should create ticket assigned to Section when email is sent to Section address', async function() {
      // Create Section with email
      const sectionEmail = `section-e2e-${Date.now()}@example.com`;
      const section = await Section.create({
        organizationId: testOrganization.id,
        departmentId: testDepartment.id,
        name: 'Section with Email E2E',
        email: sectionEmail,
        isActive: true
      });

      // Simulate email received at that address
      const emailData = {
        to: {
          value: [{ address: sectionEmail }]
        },
        date: new Date(),
        attachments: []
      };

      // Create ticket from email
      const ticket = await emailInboxService.createTicketFromEmail(
        testUser.email,
        'Test Subject for Section',
        'Test Body for Section',
        emailData
      );

      // Verify ticket created with sectionId
      expect(ticket).to.not.be.null;
      expect(ticket).to.be.an('object');
      expect(ticket.sectionId).to.equal(section.id);
      expect(ticket.departmentId).to.be.null;
      expect(ticket.directionId).to.be.null;
      expect(ticket.subject).to.equal('Test Subject for Section');
      expect(ticket.description).to.equal('Test Body for Section');
      expect(ticket.source).to.equal('email');

      // Clean up
      await ticket.destroy({ force: true });
      await section.destroy({ force: true });
    });

    it('should handle case-insensitive email matching for Section', async function() {
      // Create Section with lowercase email
      const sectionEmail = `section-case-${Date.now()}@example.com`;
      const section = await Section.create({
        organizationId: testOrganization.id,
        departmentId: testDepartment.id,
        name: 'Section Case Test',
        email: sectionEmail.toLowerCase(),
        isActive: true
      });

      // Simulate email with mixed case address
      const emailData = {
        to: {
          value: [{ address: sectionEmail.toUpperCase() }]
        },
        date: new Date(),
        attachments: []
      };

      // Create ticket from email
      const ticket = await emailInboxService.createTicketFromEmail(
        testUser.email,
        'Test Subject Case Section',
        'Test Body Case Section',
        emailData
      );

      // Verify ticket created with sectionId
      expect(ticket).to.not.be.null;
      expect(ticket.sectionId).to.equal(section.id);

      // Clean up
      await ticket.destroy({ force: true });
      await section.destroy({ force: true });
    });

    it('should prioritize Section over Department when both have emails', async function() {
      // Create Department with email
      const departmentEmail = `dept-priority-${Date.now()}@example.com`;
      const department = await Department.create({
        organizationId: testOrganization.id,
        directionId: testDirection.id,
        name: 'Department Priority Test',
        email: departmentEmail,
        isActive: true
      });

      // Create Section with different email
      const sectionEmail = `section-priority-${Date.now()}@example.com`;
      const section = await Section.create({
        organizationId: testOrganization.id,
        departmentId: department.id,
        name: 'Section Priority Test',
        email: sectionEmail,
        isActive: true
      });

      // Send email to Section address
      const emailData = {
        to: {
          value: [{ address: sectionEmail }]
        },
        date: new Date(),
        attachments: []
      };

      const ticket = await emailInboxService.createTicketFromEmail(
        testUser.email,
        'Priority Test',
        'Testing priority',
        emailData
      );

      // Verify ticket assigned to Section (not Department)
      expect(ticket).to.not.be.null;
      expect(ticket.sectionId).to.equal(section.id);
      expect(ticket.departmentId).to.be.null;
      expect(ticket.directionId).to.be.null;

      // Clean up
      await ticket.destroy({ force: true });
      await section.destroy({ force: true });
      await department.destroy({ force: true });
    });
  });

  /**
   * Test 12.4: Cross-entity uniqueness
   * 
   * Create Direction with email
   * Attempt to create Department with same email (should fail)
   * Attempt to create Section with same email (should fail)
   * 
   * **Validates: Requirements 3.1, 10.4**
   */
  describe('12.4 Cross-Entity Email Uniqueness', function() {
    it('should prevent Department from using same email as Direction', async function() {
      // Create Direction with email
      const email = `unique-test-${Date.now()}@example.com`;
      const direction = await Direction.create({
        organizationId: testOrganization.id,
        name: 'Direction Unique Test',
        email: email,
        isActive: true
      });

      // Attempt to validate same email for Department (should fail)
      const validation = await emailValidationService.validateEmailUniqueness(
        email,
        testOrganization.id
      );

      expect(validation.isValid).to.be.false;
      expect(validation.error).to.include('Direção');

      // Clean up
      await direction.destroy({ force: true });
    });

    it('should prevent Section from using same email as Direction', async function() {
      // Create Direction with email
      const email = `unique-dir-sec-${Date.now()}@example.com`;
      const direction = await Direction.create({
        organizationId: testOrganization.id,
        name: 'Direction for Section Unique Test',
        email: email,
        isActive: true
      });

      // Attempt to validate same email for Section (should fail)
      const validation = await emailValidationService.validateEmailUniqueness(
        email,
        testOrganization.id
      );

      expect(validation.isValid).to.be.false;
      expect(validation.error).to.include('Direção');

      // Clean up
      await direction.destroy({ force: true });
    });

    it('should prevent Section from using same email as Department', async function() {
      // Create Department with email
      const email = `unique-dept-sec-${Date.now()}@example.com`;
      const department = await Department.create({
        organizationId: testOrganization.id,
        directionId: testDirection.id,
        name: 'Department for Section Unique Test',
        email: email,
        isActive: true
      });

      // Attempt to validate same email for Section (should fail)
      const validation = await emailValidationService.validateEmailUniqueness(
        email,
        testOrganization.id
      );

      expect(validation.isValid).to.be.false;
      expect(validation.error).to.include('Departamento');

      // Clean up
      await department.destroy({ force: true });
    });

    it('should prevent Direction from using same email as Department', async function() {
      // Create Department with email
      const email = `unique-dept-dir-${Date.now()}@example.com`;
      const department = await Department.create({
        organizationId: testOrganization.id,
        directionId: testDirection.id,
        name: 'Department for Direction Unique Test',
        email: email,
        isActive: true
      });

      // Attempt to validate same email for Direction (should fail)
      const validation = await emailValidationService.validateEmailUniqueness(
        email,
        testOrganization.id
      );

      expect(validation.isValid).to.be.false;
      expect(validation.error).to.include('Departamento');

      // Clean up
      await department.destroy({ force: true });
    });

    it('should prevent Direction from using same email as Section', async function() {
      // Create Section with email
      const email = `unique-sec-dir-${Date.now()}@example.com`;
      const section = await Section.create({
        organizationId: testOrganization.id,
        departmentId: testDepartment.id,
        name: 'Section for Direction Unique Test',
        email: email,
        isActive: true
      });

      // Attempt to validate same email for Direction (should fail)
      const validation = await emailValidationService.validateEmailUniqueness(
        email,
        testOrganization.id
      );

      expect(validation.isValid).to.be.false;
      expect(validation.error).to.include('Secção');

      // Clean up
      await section.destroy({ force: true });
    });

    it('should prevent Department from using same email as Section', async function() {
      // Create Section with email
      const email = `unique-sec-dept-${Date.now()}@example.com`;
      const section = await Section.create({
        organizationId: testOrganization.id,
        departmentId: testDepartment.id,
        name: 'Section for Department Unique Test',
        email: email,
        isActive: true
      });

      // Attempt to validate same email for Department (should fail)
      const validation = await emailValidationService.validateEmailUniqueness(
        email,
        testOrganization.id
      );

      expect(validation.isValid).to.be.false;
      expect(validation.error).to.include('Secção');

      // Clean up
      await section.destroy({ force: true });
    });

    it('should allow same email in different organizations', async function() {
      // Create another organization
      const org2 = await Organization.create({
        name: 'Second Organization for Unique Test',
        slug: `test-org-2-unique-${Date.now()}`,
        type: 'tenant',
        status: 'active'
      });

      // Create Direction in first organization with email
      const email = `cross-org-${Date.now()}@example.com`;
      const direction1 = await Direction.create({
        organizationId: testOrganization.id,
        name: 'Direction Org 1',
        email: email,
        isActive: true
      });

      // Validate same email for second organization (should succeed)
      const validation = await emailValidationService.validateEmailUniqueness(
        email,
        org2.id
      );

      expect(validation.isValid).to.be.true;

      // Clean up
      await direction1.destroy({ force: true });
      await org2.destroy({ force: true });
    });

    it('should handle case-insensitive uniqueness validation', async function() {
      // Create Direction with lowercase email
      const email = `case-unique-${Date.now()}@example.com`;
      const direction = await Direction.create({
        organizationId: testOrganization.id,
        name: 'Direction Case Unique',
        email: email.toLowerCase(),
        isActive: true
      });

      // Attempt to validate uppercase version (should fail)
      const validation = await emailValidationService.validateEmailUniqueness(
        email.toUpperCase(),
        testOrganization.id
      );

      expect(validation.isValid).to.be.false;
      expect(validation.error).to.include('Direção');

      // Clean up
      await direction.destroy({ force: true });
    });
  });
});
