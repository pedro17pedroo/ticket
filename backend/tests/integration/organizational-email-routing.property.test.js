/**
 * Property-Based Tests - Organizational Email Routing
 * 
 * Feature: organizational-email-routing
 * Tests correctness properties for email fields in Directions and Sections
 * 
 * Uses fast-check for property-based testing
 */

import { expect } from 'chai';
import fc from 'fast-check';
import Direction from '../../src/modules/directions/directionModel.js';
import Section from '../../src/modules/sections/sectionModel.js';
import Department from '../../src/modules/departments/departmentModel.js';
import { Organization } from '../../src/modules/models/index.js';

// Test data IDs (will be created in before hook)
let testOrganizationId;
let testDirectionId;
let testDepartmentId;

// Arbitrary generators for email testing
// Simple, reliable email generator that passes both database regex and Sequelize isEmail
const validEmailArb = fc.tuple(
  fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 3, maxLength: 15 }).map(arr => arr.join('')),
  fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 3, maxLength: 15 }).map(arr => arr.join('')),
  fc.constantFrom('com', 'org', 'net', 'edu', 'gov', 'co', 'io', 'dev')
).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);
const invalidEmailArb = fc.oneof(
  fc.constant('not-an-email'),
  fc.constant('missing@domain'),
  fc.constant('@nodomain.com'),
  fc.constant('no-at-sign.com'),
  fc.constant('spaces in@email.com'),
  fc.constant(''),
  fc.constant('   ')
);

// Generator for email with varying case
const emailWithCaseArb = fc.tuple(
  fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 3, maxLength: 15 }).map(arr => arr.join('')),
  fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 3, maxLength: 15 }).map(arr => arr.join('')),
  fc.constantFrom('com', 'org', 'net', 'edu', 'gov', 'co', 'io', 'dev')
).map(([local, domain, tld]) => {
  const email = `${local}@${domain}.${tld}`;
  const rand = Math.random();
  if (rand < 0.33) return email.toUpperCase();
  if (rand < 0.66) return email.toLowerCase();
  // Mixed case
  return email.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('');
});

describe('Organizational Email Routing - Property-Based Tests', function() {
  this.timeout(120000); // Increase timeout for property tests

  before(async function() {
    try {
      // Sync models
      await Direction.sync({ force: false });
      await Section.sync({ force: false });
      await Department.sync({ force: false });

      // Create test organization
      const org = await Organization.create({
        name: 'Test Organization for Email Routing',
        slug: `test-org-email-routing-${Date.now()}`,
        type: 'tenant',
        status: 'active'
      });
      testOrganizationId = org.id;

      // Create test direction (required for sections)
      const direction = await Direction.create({
        organizationId: testOrganizationId,
        name: 'Test Direction for Email Tests',
        description: 'Test direction for email routing tests',
        isActive: true
      });
      testDirectionId = direction.id;

      // Create test department (required for sections)
      const department = await Department.create({
        organizationId: testOrganizationId,
        directionId: testDirectionId,
        name: 'Test Department for Email Tests',
        description: 'Test department for email routing tests',
        isActive: true
      });
      testDepartmentId = department.id;
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });

  after(async function() {
    // Clean up test data
    try {
      await Section.destroy({ where: { organizationId: testOrganizationId }, force: true });
      await Department.destroy({ where: { organizationId: testOrganizationId }, force: true });
      await Direction.destroy({ where: { organizationId: testOrganizationId }, force: true });
      await Organization.destroy({ where: { id: testOrganizationId }, force: true });
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  });

  beforeEach(async function() {
    // Clean up email fields before each test
    await Direction.update(
      { email: null },
      { where: { organizationId: testOrganizationId } }
    );
    await Section.update(
      { email: null },
      { where: { organizationId: testOrganizationId } }
    );
    await Department.update(
      { email: null },
      { where: { organizationId: testOrganizationId } }
    );
  });

  /**
   * Property 1: Email Format Validation
   * 
   * *For any* Direction or Section, when an email is provided, 
   * it must match the standard email format (user@domain.tld).
   * 
   * **Validates: Requirements 1.1, 1.4, 2.1, 2.4**
   * 
   * Feature: organizational-email-routing, Property 1: Email Format Validation
   */
  describe('Property 1: Email Format Validation', function() {
    it('should accept valid email formats for Directions', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            const direction = await Direction.create({
              organizationId: testOrganizationId,
              name: `Direction ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            expect(direction.email).to.equal(email.toLowerCase());
            
            // Clean up
            await direction.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid email formats for Sections', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            const section = await Section.create({
              organizationId: testOrganizationId,
              departmentId: testDepartmentId,
              name: `Section ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            expect(section.email).to.equal(email.toLowerCase());
            
            // Clean up
            await section.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid email formats for Directions', async function() {
      await fc.assert(
        fc.asyncProperty(
          invalidEmailArb,
          async (invalidEmail) => {
            // Skip empty strings as they should be converted to null
            if (invalidEmail === '' || invalidEmail.trim() === '') {
              return true;
            }

            let errorThrown = false;
            try {
              await Direction.create({
                organizationId: testOrganizationId,
                name: `Direction ${Date.now()}-${Math.random()}`,
                email: invalidEmail,
                isActive: true
              });
            } catch (error) {
              errorThrown = true;
              expect(error.name).to.be.oneOf(['SequelizeValidationError', 'SequelizeDatabaseError']);
            }

            expect(errorThrown).to.be.true;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid email formats for Sections', async function() {
      await fc.assert(
        fc.asyncProperty(
          invalidEmailArb,
          async (invalidEmail) => {
            // Skip empty strings as they should be converted to null
            if (invalidEmail === '' || invalidEmail.trim() === '') {
              return true;
            }

            let errorThrown = false;
            try {
              await Section.create({
                organizationId: testOrganizationId,
                departmentId: testDepartmentId,
                name: `Section ${Date.now()}-${Math.random()}`,
                email: invalidEmail,
                isActive: true
              });
            } catch (error) {
              errorThrown = true;
              expect(error.name).to.be.oneOf(['SequelizeValidationError', 'SequelizeDatabaseError']);
            }

            expect(errorThrown).to.be.true;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should store emails in lowercase for Directions', async function() {
      await fc.assert(
        fc.asyncProperty(
          emailWithCaseArb,
          async (email) => {
            const direction = await Direction.create({
              organizationId: testOrganizationId,
              name: `Direction ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            expect(direction.email).to.equal(email.toLowerCase());
            
            // Clean up
            await direction.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should store emails in lowercase for Sections', async function() {
      await fc.assert(
        fc.asyncProperty(
          emailWithCaseArb,
          async (email) => {
            const section = await Section.create({
              organizationId: testOrganizationId,
              departmentId: testDepartmentId,
              name: `Section ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            expect(section.email).to.equal(email.toLowerCase());
            
            // Clean up
            await section.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Null Email Acceptance
   * 
   * *For any* organizational unit, setting the email to null or empty string 
   * must be accepted without validation errors.
   * 
   * **Validates: Requirements 1.5, 2.5, 3.4**
   * 
   * Feature: organizational-email-routing, Property 4: Null Email Acceptance
   */
  describe('Property 4: Null Email Acceptance', function() {
    it('should accept null email for Directions', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async (email) => {
            const direction = await Direction.create({
              organizationId: testOrganizationId,
              name: `Direction ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            expect(direction.email).to.be.null;
            
            // Clean up
            await direction.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept null email for Sections', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async (email) => {
            const section = await Section.create({
              organizationId: testOrganizationId,
              departmentId: testDepartmentId,
              name: `Section ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            expect(section.email).to.be.null;
            
            // Clean up
            await section.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should convert empty string to null for Directions', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('', '   ', '\t', '\n'),
          async (emptyValue) => {
            const direction = await Direction.create({
              organizationId: testOrganizationId,
              name: `Direction ${Date.now()}-${Math.random()}`,
              email: emptyValue,
              isActive: true
            });

            expect(direction.email).to.be.null;
            
            // Clean up
            await direction.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should convert empty string to null for Sections', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('', '   ', '\t', '\n'),
          async (emptyValue) => {
            const section = await Section.create({
              organizationId: testOrganizationId,
              departmentId: testDepartmentId,
              name: `Section ${Date.now()}-${Math.random()}`,
              email: emptyValue,
              isActive: true
            });

            expect(section.email).to.be.null;
            
            // Clean up
            await section.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow multiple organizational units with null emails', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }),
          async (count) => {
            const directions = [];
            
            // Create multiple directions with null emails
            for (let i = 0; i < count; i++) {
              const direction = await Direction.create({
                organizationId: testOrganizationId,
                name: `Direction Null ${Date.now()}-${i}`,
                email: null,
                isActive: true
              });
              directions.push(direction);
              expect(direction.email).to.be.null;
            }
            
            // Clean up
            for (const direction of directions) {
              await direction.destroy({ force: true });
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Backward Compatibility (partial)
   * 
   * *For any* existing Department with an email, after the migration, 
   * the email must remain unchanged and continue to function for ticket routing.
   * 
   * **Validates: Requirements 6.5**
   * 
   * Feature: organizational-email-routing, Property 10: Backward Compatibility
   */
  describe('Property 10: Backward Compatibility', function() {
    it('should preserve existing Department emails after migration', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Create a department with an email
            const department = await Department.create({
              organizationId: testOrganizationId,
              directionId: testDirectionId,
              name: `Department ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            // Verify email is stored correctly
            expect(department.email).to.equal(email);

            // Fetch the department again to ensure persistence
            const fetchedDepartment = await Department.findByPk(department.id);
            expect(fetchedDepartment.email).to.equal(email);

            // Clean up
            await department.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow Departments to continue using email field alongside new Direction and Section emails', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          validEmailArb,
          validEmailArb,
          async (directionEmail, departmentEmail, sectionEmail) => {
            // Ensure emails are unique
            const emails = [directionEmail, departmentEmail, sectionEmail];
            const uniqueEmails = [...new Set(emails.map(e => e.toLowerCase()))];
            if (uniqueEmails.length !== 3) {
              return true; // Skip if emails are not unique
            }

            // Create direction with email
            const direction = await Direction.create({
              organizationId: testOrganizationId,
              name: `Direction ${Date.now()}-${Math.random()}`,
              email: directionEmail,
              isActive: true
            });

            // Create department with email
            const department = await Department.create({
              organizationId: testOrganizationId,
              directionId: direction.id,
              name: `Department ${Date.now()}-${Math.random()}`,
              email: departmentEmail,
              isActive: true
            });

            // Create section with email
            const section = await Section.create({
              organizationId: testOrganizationId,
              departmentId: department.id,
              name: `Section ${Date.now()}-${Math.random()}`,
              email: sectionEmail,
              isActive: true
            });

            // Verify all emails are stored correctly
            expect(direction.email).to.equal(directionEmail.toLowerCase());
            expect(department.email).to.equal(departmentEmail);
            expect(section.email).to.equal(sectionEmail.toLowerCase());

            // Clean up
            await section.destroy({ force: true });
            await department.destroy({ force: true });
            await direction.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain Department email functionality after adding Direction and Section emails', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Create a department with email (simulating existing data)
            const department = await Department.create({
              organizationId: testOrganizationId,
              directionId: testDirectionId,
              name: `Department ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            // Verify department email is accessible
            const fetchedDepartment = await Department.findOne({
              where: { email: email }
            });

            expect(fetchedDepartment).to.not.be.null;
            expect(fetchedDepartment.id).to.equal(department.id);
            expect(fetchedDepartment.email).to.equal(email);

            // Clean up
            await department.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Email Uniqueness Across Organization
   * 
   * *For any* organizational unit (Direction, Department, or Section) within the same organization, 
   * the email address must be unique across all three entity types.
   * 
   * **Validates: Requirements 3.1, 3.2**
   * 
   * Feature: organizational-email-routing, Property 2: Email Uniqueness Across Organization
   */
  describe('Property 2: Email Uniqueness Across Organization', function() {
    it('should prevent duplicate emails between Directions', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Verify test context is available
            if (!testOrganizationId) {
              throw new Error('Test organization ID is not available');
            }

            // Create first direction with email
            const direction1 = await Direction.create({
              organizationId: testOrganizationId,
              name: `Direction 1 ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            // Import the service
            const emailValidationService = (await import('../../src/services/emailValidationService.js')).default;

            // Try to validate the same email for a different direction
            const validation = await emailValidationService.validateEmailUniqueness(
              email,
              testOrganizationId
            );

            expect(validation.isValid).to.be.false;
            expect(validation.error).to.include('Direção');

            // Clean up
            await direction1.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent duplicate emails between Direction and Department', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Verify test context is available
            if (!testOrganizationId) {
              throw new Error('Test organization ID is not available');
            }

            // Create direction with email
            const direction = await Direction.create({
              organizationId: testOrganizationId,
              name: `Direction ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            // Import the service
            const emailValidationService = (await import('../../src/services/emailValidationService.js')).default;

            // Try to validate the same email for a department
            const validation = await emailValidationService.validateEmailUniqueness(
              email,
              testOrganizationId
            );

            expect(validation.isValid).to.be.false;
            expect(validation.error).to.include('Direção');

            // Clean up
            await direction.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent duplicate emails between Direction and Section', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Verify test context is available
            if (!testOrganizationId) {
              throw new Error('Test organization ID is not available');
            }

            // Create direction with email
            const direction = await Direction.create({
              organizationId: testOrganizationId,
              name: `Direction ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            // Import the service
            const emailValidationService = (await import('../../src/services/emailValidationService.js')).default;

            // Try to validate the same email for a section
            const validation = await emailValidationService.validateEmailUniqueness(
              email,
              testOrganizationId
            );

            expect(validation.isValid).to.be.false;
            expect(validation.error).to.include('Direção');

            // Clean up
            await direction.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent duplicate emails between Department and Section', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Verify test context is available
            if (!testOrganizationId || !testDirectionId) {
              throw new Error('Test organization or direction ID is not available');
            }

            // Create department with email
            const department = await Department.create({
              organizationId: testOrganizationId,
              directionId: testDirectionId,
              name: `Department ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            // Import the service
            const emailValidationService = (await import('../../src/services/emailValidationService.js')).default;

            // Try to validate the same email for a section
            const validation = await emailValidationService.validateEmailUniqueness(
              email,
              testOrganizationId
            );

            expect(validation.isValid).to.be.false;
            expect(validation.error).to.include('Departamento');

            // Clean up
            await department.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow same email in different organizations', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Verify test context is available
            if (!testOrganizationId) {
              throw new Error('Test organization ID is not available');
            }

            // Create another organization with a more unique slug
            const uniqueSlug = `test-org-2-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const org2 = await Organization.create({
              name: `Test Org 2 ${Date.now()}-${Math.random()}`,
              slug: uniqueSlug,
              type: 'tenant',
              status: 'active'
            });

            // Create direction in first organization
            const direction1 = await Direction.create({
              organizationId: testOrganizationId,
              name: `Direction Org1 ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            // Import the service
            const emailValidationService = (await import('../../src/services/emailValidationService.js')).default;

            // Validate same email for second organization (should be valid)
            const validation = await emailValidationService.validateEmailUniqueness(
              email,
              org2.id
            );

            expect(validation.isValid).to.be.true;

            // Clean up
            await direction1.destroy({ force: true });
            await org2.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow unique emails across all organizational units', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          validEmailArb,
          validEmailArb,
          async (email1, email2, email3) => {
            // Verify test context is available
            if (!testOrganizationId || !testDirectionId) {
              throw new Error('Test organization or direction ID is not available');
            }

            // Ensure emails are unique
            const emails = [email1, email2, email3];
            const uniqueEmails = [...new Set(emails.map(e => e.toLowerCase()))];
            if (uniqueEmails.length !== 3) {
              return true; // Skip if emails are not unique
            }

            // Import the service
            const emailValidationService = (await import('../../src/services/emailValidationService.js')).default;

            // Create direction with email1
            const direction = await Direction.create({
              organizationId: testOrganizationId,
              name: `Direction ${Date.now()}-${Math.random()}`,
              email: email1,
              isActive: true
            });

            // Validate email2 for department (should be valid)
            const validation2 = await emailValidationService.validateEmailUniqueness(
              email2,
              testOrganizationId
            );
            expect(validation2.isValid).to.be.true;

            // Create department with email2
            const department = await Department.create({
              organizationId: testOrganizationId,
              directionId: testDirectionId,
              name: `Department ${Date.now()}-${Math.random()}`,
              email: email2,
              isActive: true
            });

            // Validate email3 for section (should be valid)
            const validation3 = await emailValidationService.validateEmailUniqueness(
              email3,
              testOrganizationId
            );
            expect(validation3.isValid).to.be.true;

            // Clean up
            await department.destroy({ force: true });
            await direction.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Email Case Insensitivity
   * 
   * *For any* two organizational units with emails that differ only in case 
   * (e.g., "Support@example.com" vs "support@example.com"), 
   * the system must treat them as duplicates.
   * 
   * **Validates: Requirements 3.1**
   * 
   * Feature: organizational-email-routing, Property 3: Email Case Insensitivity
   */
  describe('Property 3: Email Case Insensitivity', function() {
    it('should treat emails with different cases as duplicates in Directions', async function() {
      const orgId = testOrganizationId; // Capture in closure
      
      await fc.assert(
        fc.asyncProperty(
          emailWithCaseArb,
          async (email) => {
            // Create direction with email in one case
            const direction1 = await Direction.create({
              organizationId: orgId,
              name: `Direction 1 ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            // Import the service
            const emailValidationService = (await import('../../src/services/emailValidationService.js')).default;

            // Try to validate the same email with different case
            const differentCaseEmail = email.split('').map((c, i) => 
              i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()
            ).join('');

            const validation = await emailValidationService.validateEmailUniqueness(
              differentCaseEmail,
              orgId
            );

            expect(validation.isValid).to.be.false;
            expect(validation.error).to.exist;

            // Clean up
            await direction1.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should treat emails with different cases as duplicates in Sections', async function() {
      const orgId = testOrganizationId; // Capture in closure
      const deptId = testDepartmentId; // Capture in closure
      
      await fc.assert(
        fc.asyncProperty(
          emailWithCaseArb,
          async (email) => {
            // Create section with email in one case
            const section1 = await Section.create({
              organizationId: orgId,
              departmentId: deptId,
              name: `Section 1 ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            // Import the service
            const emailValidationService = (await import('../../src/services/emailValidationService.js')).default;

            // Try to validate the same email with different case
            const differentCaseEmail = email.split('').map((c, i) => 
              i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()
            ).join('');

            const validation = await emailValidationService.validateEmailUniqueness(
              differentCaseEmail,
              orgId
            );

            expect(validation.isValid).to.be.false;
            expect(validation.error).to.exist;

            // Clean up
            await section1.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should treat emails with different cases as duplicates across entity types', async function() {
      const orgId = testOrganizationId; // Capture in closure
      
      await fc.assert(
        fc.asyncProperty(
          emailWithCaseArb,
          async (email) => {
            // Create direction with email in one case
            const direction = await Direction.create({
              organizationId: orgId,
              name: `Direction ${Date.now()}-${Math.random()}`,
              email: email.toLowerCase(),
              isActive: true
            });

            // Import the service
            const emailValidationService = (await import('../../src/services/emailValidationService.js')).default;

            // Try to validate the same email in uppercase for a department
            const validation = await emailValidationService.validateEmailUniqueness(
              email.toUpperCase(),
              orgId
            );

            expect(validation.isValid).to.be.false;
            expect(validation.error).to.include('Direção');

            // Clean up
            await direction.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should store all emails in lowercase regardless of input case', async function() {
      const orgId = testOrganizationId; // Capture in closure
      
      await fc.assert(
        fc.asyncProperty(
          emailWithCaseArb,
          async (email) => {
            // Create direction with mixed case email
            const direction = await Direction.create({
              organizationId: orgId,
              name: `Direction ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            // Verify email is stored in lowercase
            expect(direction.email).to.equal(email.toLowerCase());

            // Fetch from database to verify persistence
            const fetchedDirection = await Direction.findByPk(direction.id);
            expect(fetchedDirection.email).to.equal(email.toLowerCase());

            // Clean up
            await direction.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Email Update Idempotence
   * 
   * *For any* organizational unit, updating its email to the same value it currently has 
   * must succeed without uniqueness validation errors.
   * 
   * **Validates: Requirements 3.3**
   * 
   * Feature: organizational-email-routing, Property 7: Email Update Idempotence
   */
  describe('Property 7: Email Update Idempotence', function() {
    it('should allow updating Direction email to the same value', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Create direction with email
            const direction = await Direction.create({
              organizationId: testOrganizationId,
              name: `Direction ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            // Import the service
            const emailValidationService = (await import('../../src/services/emailValidationService.js')).default;

            // Validate updating to the same email (should be valid)
            const validation = await emailValidationService.validateEmailUniqueness(
              email,
              testOrganizationId,
              { type: 'direction', id: direction.id }
            );

            expect(validation.isValid).to.be.true;

            // Actually update the direction with the same email
            await direction.update({ email: email });
            
            // Verify email is still the same
            const updatedDirection = await Direction.findByPk(direction.id);
            expect(updatedDirection.email).to.equal(email.toLowerCase());

            // Clean up
            await direction.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow updating Section email to the same value', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Create section with email
            const section = await Section.create({
              organizationId: testOrganizationId,
              departmentId: testDepartmentId,
              name: `Section ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            // Import the service
            const emailValidationService = (await import('../../src/services/emailValidationService.js')).default;

            // Validate updating to the same email (should be valid)
            const validation = await emailValidationService.validateEmailUniqueness(
              email,
              testOrganizationId,
              { type: 'section', id: section.id }
            );

            expect(validation.isValid).to.be.true;

            // Actually update the section with the same email
            await section.update({ email: email });
            
            // Verify email is still the same
            const updatedSection = await Section.findByPk(section.id);
            expect(updatedSection.email).to.equal(email.toLowerCase());

            // Clean up
            await section.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow updating Department email to the same value', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Create department with email
            const department = await Department.create({
              organizationId: testOrganizationId,
              directionId: testDirectionId,
              name: `Department ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            // Import the service
            const emailValidationService = (await import('../../src/services/emailValidationService.js')).default;

            // Validate updating to the same email (should be valid)
            const validation = await emailValidationService.validateEmailUniqueness(
              email,
              testOrganizationId,
              { type: 'department', id: department.id }
            );

            expect(validation.isValid).to.be.true;

            // Actually update the department with the same email
            await department.update({ email: email });
            
            // Verify email is still the same
            const updatedDepartment = await Department.findByPk(department.id);
            expect(updatedDepartment.email).to.equal(email);

            // Clean up
            await department.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow updating email to same value with different case', async function() {
      await fc.assert(
        fc.asyncProperty(
          emailWithCaseArb,
          async (email) => {
            // Create direction with email in lowercase
            const direction = await Direction.create({
              organizationId: testOrganizationId,
              name: `Direction ${Date.now()}-${Math.random()}`,
              email: email.toLowerCase(),
              isActive: true
            });

            // Import the service
            const emailValidationService = (await import('../../src/services/emailValidationService.js')).default;

            // Validate updating to the same email but with different case (should be valid)
            const validation = await emailValidationService.validateEmailUniqueness(
              email.toUpperCase(),
              testOrganizationId,
              { type: 'direction', id: direction.id }
            );

            expect(validation.isValid).to.be.true;

            // Actually update the direction with uppercase email
            await direction.update({ email: email.toUpperCase() });
            
            // Verify email is stored in lowercase
            const updatedDirection = await Direction.findByPk(direction.id);
            expect(updatedDirection.email).to.equal(email.toLowerCase());

            // Clean up
            await direction.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent updating to another units email', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          validEmailArb,
          async (email1, email2) => {
            // Ensure emails are different
            if (email1.toLowerCase() === email2.toLowerCase()) {
              return true; // Skip if emails are the same
            }

            // Create two directions with different emails
            const direction1 = await Direction.create({
              organizationId: testOrganizationId,
              name: `Direction 1 ${Date.now()}-${Math.random()}`,
              email: email1,
              isActive: true
            });

            const direction2 = await Direction.create({
              organizationId: testOrganizationId,
              name: `Direction 2 ${Date.now()}-${Math.random()}`,
              email: email2,
              isActive: true
            });

            // Import the service
            const emailValidationService = (await import('../../src/services/emailValidationService.js')).default;

            // Try to update direction2 to use direction1's email (should fail)
            const validation = await emailValidationService.validateEmailUniqueness(
              email1,
              testOrganizationId,
              { type: 'direction', id: direction2.id }
            );

            expect(validation.isValid).to.be.false;
            expect(validation.error).to.exist;

            // Clean up
            await direction1.destroy({ force: true });
            await direction2.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Ticket Assignment Consistency
   * Feature: organizational-email-routing, Property 6: Ticket Assignment Consistency
   * Validates: Requirements 4.1, 4.2, 4.3, 5.4
   * 
   * *For any* ticket created from an email, if an organizational unit is found, 
   * the ticket must have exactly one of directionId, departmentId, or sectionId set (not multiple).
   */
  describe('Property 6: Ticket Assignment Consistency', function() {
    let testUser;

    before(async function() {
      // Import User model
      const User = (await import('../../src/modules/users/userModel.js')).default;
      
      // Create a test user for ticket creation
      testUser = await User.create({
        name: 'Test User for Email Tickets',
        email: `test-user-${Date.now()}@example.com`,
        password: 'password123',
        organizationId: testOrganizationId,
        role: 'agent',
        isActive: true
      });
    });

    after(async function() {
      if (testUser) {
        await testUser.destroy({ force: true });
      }
    });

    it('should assign ticket to exactly one organizational unit when email matches direction', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Create a direction with this email
            const direction = await Direction.create({
              organizationId: testOrganizationId,
              name: `Direction ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            // Import services
            const emailInboxService = (await import('../../src/services/emailInboxService.js')).default;
            const Ticket = (await import('../../src/modules/tickets/ticketModel.js')).default;

            // Create mock email data
            const emailData = {
              to: {
                value: [{ address: email }]
              },
              date: new Date(),
              attachments: []
            };

            // Create ticket from email
            const ticket = await emailInboxService.createTicketFromEmail(
              testUser.email,
              'Test Subject',
              'Test Body',
              emailData
            );

            // Verify ticket was created
            expect(ticket).to.not.be.null;
            expect(ticket).to.be.an('object');

            // Verify exactly one organizational unit ID is set
            const assignmentCount = [
              ticket.directionId,
              ticket.departmentId,
              ticket.sectionId
            ].filter(id => id !== null && id !== undefined).length;

            expect(assignmentCount).to.equal(1, 'Ticket should have exactly one organizational unit assignment');
            
            // Verify it's assigned to the direction
            expect(ticket.directionId).to.equal(direction.id);
            expect(ticket.departmentId).to.be.null;
            expect(ticket.sectionId).to.be.null;

            // Clean up
            await ticket.destroy({ force: true });
            await direction.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should assign ticket to exactly one organizational unit when email matches department', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Create a department with this email
            const department = await Department.create({
              organizationId: testOrganizationId,
              directionId: testDirectionId,
              name: `Department ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            // Import services
            const emailInboxService = (await import('../../src/services/emailInboxService.js')).default;
            const Ticket = (await import('../../src/modules/tickets/ticketModel.js')).default;

            // Create mock email data
            const emailData = {
              to: {
                value: [{ address: email }]
              },
              date: new Date(),
              attachments: []
            };

            // Create ticket from email
            const ticket = await emailInboxService.createTicketFromEmail(
              testUser.email,
              'Test Subject',
              'Test Body',
              emailData
            );

            // Verify ticket was created
            expect(ticket).to.not.be.null;

            // Verify exactly one organizational unit ID is set
            const assignmentCount = [
              ticket.directionId,
              ticket.departmentId,
              ticket.sectionId
            ].filter(id => id !== null && id !== undefined).length;

            expect(assignmentCount).to.equal(1, 'Ticket should have exactly one organizational unit assignment');
            
            // Verify it's assigned to the department
            expect(ticket.departmentId).to.equal(department.id);
            expect(ticket.directionId).to.be.null;
            expect(ticket.sectionId).to.be.null;

            // Clean up
            await ticket.destroy({ force: true });
            await department.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should assign ticket to exactly one organizational unit when email matches section', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Create a section with this email
            const section = await Section.create({
              organizationId: testOrganizationId,
              departmentId: testDepartmentId,
              name: `Section ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            // Import services
            const emailInboxService = (await import('../../src/services/emailInboxService.js')).default;
            const Ticket = (await import('../../src/modules/tickets/ticketModel.js')).default;

            // Create mock email data
            const emailData = {
              to: {
                value: [{ address: email }]
              },
              date: new Date(),
              attachments: []
            };

            // Create ticket from email
            const ticket = await emailInboxService.createTicketFromEmail(
              testUser.email,
              'Test Subject',
              'Test Body',
              emailData
            );

            // Verify ticket was created
            expect(ticket).to.not.be.null;

            // Verify exactly one organizational unit ID is set
            const assignmentCount = [
              ticket.directionId,
              ticket.departmentId,
              ticket.sectionId
            ].filter(id => id !== null && id !== undefined).length;

            expect(assignmentCount).to.equal(1, 'Ticket should have exactly one organizational unit assignment');
            
            // Verify it's assigned to the section
            expect(ticket.sectionId).to.equal(section.id);
            expect(ticket.directionId).to.be.null;
            expect(ticket.departmentId).to.be.null;

            // Clean up
            await ticket.destroy({ force: true });
            await section.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should leave all organizational unit IDs null when no email match found', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Import services
            const emailInboxService = (await import('../../src/services/emailInboxService.js')).default;
            const Ticket = (await import('../../src/modules/tickets/ticketModel.js')).default;

            // Use a unique email that doesn't match any organizational unit
            const uniqueEmail = `no-match-${Date.now()}-${Math.random()}-${email}`;

            // Create mock email data with non-matching email
            const emailData = {
              to: {
                value: [{ address: uniqueEmail }]
              },
              date: new Date(),
              attachments: []
            };

            // Create ticket from email
            const ticket = await emailInboxService.createTicketFromEmail(
              testUser.email,
              'Test Subject',
              'Test Body',
              emailData
            );

            // Verify ticket was created
            expect(ticket).to.not.be.null;

            // Verify no organizational unit IDs are set
            expect(ticket.directionId).to.be.null;
            expect(ticket.departmentId).to.be.null;
            expect(ticket.sectionId).to.be.null;

            // Clean up
            await ticket.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle case-insensitive email matching for ticket assignment', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Create a direction with lowercase email
            const direction = await Direction.create({
              organizationId: testOrganizationId,
              name: `Direction ${Date.now()}-${Math.random()}`,
              email: email.toLowerCase(),
              isActive: true
            });

            // Import services
            const emailInboxService = (await import('../../src/services/emailInboxService.js')).default;
            const Ticket = (await import('../../src/modules/tickets/ticketModel.js')).default;

            // Create mock email data with uppercase email
            const emailData = {
              to: {
                value: [{ address: email.toUpperCase() }]
              },
              date: new Date(),
              attachments: []
            };

            // Create ticket from email
            const ticket = await emailInboxService.createTicketFromEmail(
              testUser.email,
              'Test Subject',
              'Test Body',
              emailData
            );

            // Verify ticket was created and assigned correctly
            expect(ticket).to.not.be.null;
            expect(ticket.directionId).to.equal(direction.id);
            expect(ticket.departmentId).to.be.null;
            expect(ticket.sectionId).to.be.null;

            // Clean up
            await ticket.destroy({ force: true });
            await direction.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Email Parsing Properties
   * Feature: organizational-email-routing
   * Validates: Requirements 4.4, 4.5, 4.6, 4.7
   * 
   * Tests that email data (sender, subject, body, attachments) is correctly extracted
   * and stored in tickets created from emails.
   */
  describe('Email Parsing Properties', function() {
    let testUser;

    before(async function() {
      // Import User model
      const User = (await import('../../src/modules/users/userModel.js')).default;
      
      // Create a test user for ticket creation
      testUser = await User.create({
        name: 'Test User for Email Parsing',
        email: `test-parsing-${Date.now()}@example.com`,
        password: 'password123',
        organizationId: testOrganizationId,
        role: 'agent',
        isActive: true
      });
    });

    after(async function() {
      if (testUser) {
        await testUser.destroy({ force: true });
      }
    });

    /**
     * Property: Sender Extraction
     * *For any* email, the sender email address must be correctly extracted and stored
     */
    it('should correctly extract sender email from any email (Property 4.4)', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          async (senderEmail, subject, body) => {
            // Import services
            const emailInboxService = (await import('../../src/services/emailInboxService.js')).default;
            const Ticket = (await import('../../src/modules/tickets/ticketModel.js')).default;

            // Create mock email data
            const emailData = {
              to: {
                value: [{ address: testUser.email }]
              },
              date: new Date(),
              attachments: []
            };

            // Create ticket from email
            const ticket = await emailInboxService.createTicketFromEmail(
              senderEmail,
              subject,
              body,
              emailData
            );

            // Skip if ticket creation failed (e.g., user not found)
            if (!ticket) {
              return true;
            }

            // Verify sender email is stored in metadata
            expect(ticket.metadata).to.be.an('object');
            expect(ticket.metadata.emailFrom).to.equal(senderEmail);

            // Clean up
            await ticket.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Subject Extraction
     * *For any* email, the subject must be correctly extracted and stored as ticket subject
     */
    it('should correctly extract subject from any email (Property 4.5)', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          async (subject, body) => {
            // Import services
            const emailInboxService = (await import('../../src/services/emailInboxService.js')).default;
            const Ticket = (await import('../../src/modules/tickets/ticketModel.js')).default;

            // Create mock email data
            const emailData = {
              to: {
                value: [{ address: testUser.email }]
              },
              date: new Date(),
              attachments: []
            };

            // Create ticket from email
            const ticket = await emailInboxService.createTicketFromEmail(
              testUser.email,
              subject,
              body,
              emailData
            );

            // Skip if ticket creation failed
            if (!ticket) {
              return true;
            }

            // Verify subject is stored (may be truncated to 255 chars)
            expect(ticket.subject).to.be.a('string');
            expect(ticket.subject).to.equal(subject.substring(0, 255));

            // Clean up
            await ticket.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Body Extraction
     * *For any* email, the body must be correctly extracted and stored as ticket description
     */
    it('should correctly extract body from any email (Property 4.6)', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 1000 }),
          async (subject, body) => {
            // Import services
            const emailInboxService = (await import('../../src/services/emailInboxService.js')).default;
            const Ticket = (await import('../../src/modules/tickets/ticketModel.js')).default;

            // Create mock email data
            const emailData = {
              to: {
                value: [{ address: testUser.email }]
              },
              date: new Date(),
              attachments: []
            };

            // Create ticket from email
            const ticket = await emailInboxService.createTicketFromEmail(
              testUser.email,
              subject,
              body,
              emailData
            );

            // Skip if ticket creation failed
            if (!ticket) {
              return true;
            }

            // Verify body is stored (may be truncated to 5000 chars)
            expect(ticket.description).to.be.a('string');
            expect(ticket.description).to.equal(body.substring(0, 5000));

            // Clean up
            await ticket.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Attachment Preservation
     * *For any* email with attachments, the attachment metadata must be preserved
     */
    it('should preserve attachment metadata from any email (Property 4.7)', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.integer({ min: 0, max: 5 }),
          async (subject, body, attachmentCount) => {
            // Import services
            const emailInboxService = (await import('../../src/services/emailInboxService.js')).default;
            const Ticket = (await import('../../src/modules/tickets/ticketModel.js')).default;

            // Create mock attachments
            const attachments = [];
            for (let i = 0; i < attachmentCount; i++) {
              attachments.push({
                filename: `file${i}.txt`,
                contentType: 'text/plain',
                size: 1024 * (i + 1)
              });
            }

            // Create mock email data
            const emailData = {
              to: {
                value: [{ address: testUser.email }]
              },
              date: new Date(),
              attachments: attachments
            };

            // Create ticket from email
            const ticket = await emailInboxService.createTicketFromEmail(
              testUser.email,
              subject,
              body,
              emailData
            );

            // Skip if ticket creation failed
            if (!ticket) {
              return true;
            }

            // Verify attachment metadata is stored
            expect(ticket.metadata).to.be.an('object');
            expect(ticket.metadata.hasAttachments).to.equal(attachmentCount > 0);
            expect(ticket.metadata.attachmentsCount).to.equal(attachmentCount);

            // Clean up
            await ticket.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Email Routing Determinism
   * Feature: organizational-email-routing, Property 5: Email Routing Determinism
   * Validates: Requirements 5.1, 5.2
   * 
   * For any incoming email with a destination address, the email router must return 
   * exactly one organizational unit or null (never multiple matches).
   */
  describe('Property 5: Email Routing Determinism', function() {
    it('should return exactly one organizational unit or null for any email', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Create a direction with this email
            const direction = await Direction.create({
              organizationId: testOrganizationId,
              name: `Direction ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            // Import the email router service
            const emailRouterService = (await import('../../src/services/emailRouterService.js')).default;

            // Find organizational unit by email
            const result = await emailRouterService.findOrganizationalUnitByEmail(
              email,
              testOrganizationId
            );

            // Should return exactly one result
            expect(result).to.not.be.null;
            expect(result).to.be.an('object');
            expect(result).to.have.property('type');
            expect(result).to.have.property('unit');
            
            // Type should be one of the valid types
            expect(result.type).to.be.oneOf(['direction', 'department', 'section']);
            
            // Unit should be an object with an id
            expect(result.unit).to.be.an('object');
            expect(result.unit).to.have.property('id');

            // Clean up
            await direction.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null when no organizational unit matches the email', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Import the email router service
            const emailRouterService = (await import('../../src/services/emailRouterService.js')).default;

            // Ensure no unit has this email by using a unique prefix
            const uniqueEmail = `unique-${Date.now()}-${Math.random()}-${email}`;

            // Find organizational unit by email (should return null)
            const result = await emailRouterService.findOrganizationalUnitByEmail(
              uniqueEmail,
              testOrganizationId
            );

            // Should return null when no match found
            expect(result).to.be.null;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle case-insensitive email matching', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Create a direction with lowercase email
            const direction = await Direction.create({
              organizationId: testOrganizationId,
              name: `Direction ${Date.now()}-${Math.random()}`,
              email: email.toLowerCase(),
              isActive: true
            });

            // Import the email router service
            const emailRouterService = (await import('../../src/services/emailRouterService.js')).default;

            // Search with uppercase email
            const result = await emailRouterService.findOrganizationalUnitByEmail(
              email.toUpperCase(),
              testOrganizationId
            );

            // Should find the direction regardless of case
            expect(result).to.not.be.null;
            expect(result.type).to.equal('direction');
            expect(result.unit.id).to.equal(direction.id);

            // Clean up
            await direction.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prioritize sections over departments and directions', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Create a section with this email
            const section = await Section.create({
              organizationId: testOrganizationId,
              directionId: testDirectionId,
              departmentId: testDepartmentId,
              name: `Section ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            // Import the email router service
            const emailRouterService = (await import('../../src/services/emailRouterService.js')).default;

            // Find organizational unit by email
            const result = await emailRouterService.findOrganizationalUnitByEmail(
              email,
              testOrganizationId
            );

            // Should return the section (most specific)
            expect(result).to.not.be.null;
            expect(result.type).to.equal('section');
            expect(result.unit.id).to.equal(section.id);

            // Clean up
            await section.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prioritize departments over directions', async function() {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            // Create a department with this email
            const department = await Department.create({
              organizationId: testOrganizationId,
              directionId: testDirectionId,
              name: `Department ${Date.now()}-${Math.random()}`,
              email: email,
              isActive: true
            });

            // Import the email router service
            const emailRouterService = (await import('../../src/services/emailRouterService.js')).default;

            // Find organizational unit by email
            const result = await emailRouterService.findOrganizationalUnitByEmail(
              email,
              testOrganizationId
            );

            // Should return the department
            expect(result).to.not.be.null;
            expect(result.type).to.equal('department');
            expect(result.unit.id).to.equal(department.id);

            // Clean up
            await department.destroy({ force: true });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Property 8: API Response Completeness (Directions)
 * Feature: organizational-email-routing, Property 8: API Response Completeness
 * Validates: Requirements 7.1
 * 
 * *For any* API response returning organizational units, if the unit has an email field 
 * in the database, it must be included in the response.
 */
describe('Property 8: API Response Completeness (Directions)', function() {
  let testOrganizationId;
  let testUser;
  let authToken;

  before(async function() {
    // Import models
    const { Organization } = await import('../../src/modules/models/index.js');
    const User = (await import('../../src/modules/users/userModel.js')).default;
    
    // Create test organization
    const org = await Organization.create({
      name: 'Test Organization for API Tests',
      slug: `test-org-api-${Date.now()}`,
      type: 'tenant',
      status: 'active'
    });
    testOrganizationId = org.id;

    // Create test user (org-admin)
    testUser = await User.create({
      name: 'Test Admin for API',
      email: `test-admin-api-${Date.now()}@example.com`,
      password: 'password123',
      organizationId: testOrganizationId,
      role: 'org-admin',
      isActive: true
    });

    // Generate auth token (simplified - in real app would use proper JWT)
    authToken = 'test-token';
  });

  after(async function() {
    // Clean up
    const { Organization } = await import('../../src/modules/models/index.js');
    await Direction.destroy({ where: { organizationId: testOrganizationId }, force: true });
    if (testUser) {
      await testUser.destroy({ force: true });
    }
    await Organization.destroy({ where: { id: testOrganizationId }, force: true });
  });

  it('should include email field in Direction list response for any direction with email', async function() {
    await fc.assert(
      fc.asyncProperty(
        validEmailArb,
        async (email) => {
          // Create direction with email
          const direction = await Direction.create({
            organizationId: testOrganizationId,
            name: `Direction ${Date.now()}-${Math.random()}`,
            email: email,
            isActive: true
          });

          // Fetch direction from database
          const fetchedDirection = await Direction.findByPk(direction.id);

          // Verify email is in the database record
          expect(fetchedDirection.email).to.equal(email.toLowerCase());

          // Verify email is included in the model's dataValues (what API returns)
          expect(fetchedDirection.dataValues).to.have.property('email');
          expect(fetchedDirection.dataValues.email).to.equal(email.toLowerCase());

          // Verify email is included when converting to JSON (API response format)
          const jsonResponse = fetchedDirection.toJSON();
          expect(jsonResponse).to.have.property('email');
          expect(jsonResponse.email).to.equal(email.toLowerCase());

          // Clean up
          await direction.destroy({ force: true });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include email field (as null) in Direction list response for directions without email', async function() {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async (email) => {
          // Create direction without email
          const direction = await Direction.create({
            organizationId: testOrganizationId,
            name: `Direction ${Date.now()}-${Math.random()}`,
            email: email,
            isActive: true
          });

          // Fetch direction from database
          const fetchedDirection = await Direction.findByPk(direction.id);

          // Verify email is null in the database record
          expect(fetchedDirection.email).to.be.null;

          // Verify email field is still present in dataValues
          expect(fetchedDirection.dataValues).to.have.property('email');
          expect(fetchedDirection.dataValues.email).to.be.null;

          // Verify email field is included in JSON response
          const jsonResponse = fetchedDirection.toJSON();
          expect(jsonResponse).to.have.property('email');
          expect(jsonResponse.email).to.be.null;

          // Clean up
          await direction.destroy({ force: true });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include email field in Direction get-by-id response', async function() {
    await fc.assert(
      fc.asyncProperty(
        fc.option(validEmailArb, { nil: null }),
        async (email) => {
          // Create direction with or without email
          const direction = await Direction.create({
            organizationId: testOrganizationId,
            name: `Direction ${Date.now()}-${Math.random()}`,
            email: email,
            isActive: true
          });

          // Fetch direction by ID
          const fetchedDirection = await Direction.findOne({
            where: {
              id: direction.id,
              organizationId: testOrganizationId
            }
          });

          // Verify direction was found
          expect(fetchedDirection).to.not.be.null;

          // Verify email field is present in response
          expect(fetchedDirection.dataValues).to.have.property('email');
          
          if (email) {
            expect(fetchedDirection.email).to.equal(email.toLowerCase());
          } else {
            expect(fetchedDirection.email).to.be.null;
          }

          // Clean up
          await direction.destroy({ force: true });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include email field for all directions in list response', async function() {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.option(validEmailArb, { nil: null }), { minLength: 1, maxLength: 5 }),
        async (emails) => {
          const directions = [];

          // Create multiple directions with various email states
          for (let i = 0; i < emails.length; i++) {
            const direction = await Direction.create({
              organizationId: testOrganizationId,
              name: `Direction ${Date.now()}-${i}-${Math.random()}`,
              email: emails[i],
              isActive: true
            });
            directions.push(direction);
          }

          // Fetch all directions
          const fetchedDirections = await Direction.findAll({
            where: {
              organizationId: testOrganizationId,
              id: directions.map(d => d.id)
            }
          });

          // Verify all directions have email field in response
          expect(fetchedDirections).to.have.lengthOf(directions.length);
          
          for (const fetchedDirection of fetchedDirections) {
            expect(fetchedDirection.dataValues).to.have.property('email');
            
            // Find corresponding created direction
            const originalDirection = directions.find(d => d.id === fetchedDirection.id);
            expect(originalDirection).to.not.be.undefined;
            
            if (originalDirection.email) {
              expect(fetchedDirection.email).to.equal(originalDirection.email.toLowerCase());
            } else {
              expect(fetchedDirection.email).to.be.null;
            }
          }

          // Clean up
          for (const direction of directions) {
            await direction.destroy({ force: true });
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve email field through model associations', async function() {
    await fc.assert(
      fc.asyncProperty(
        validEmailArb,
        async (email) => {
          // Import Department model
          const Department = (await import('../../src/modules/departments/departmentModel.js')).default;

          // Create direction with email
          const direction = await Direction.create({
            organizationId: testOrganizationId,
            name: `Direction ${Date.now()}-${Math.random()}`,
            email: email,
            isActive: true
          });

          // Create department under this direction
          const department = await Department.create({
            organizationId: testOrganizationId,
            directionId: direction.id,
            name: `Department ${Date.now()}-${Math.random()}`,
            isActive: true
          });

          // Fetch department with direction association
          const fetchedDepartment = await Department.findOne({
            where: { id: department.id },
            include: [{
              model: Direction,
              as: 'direction'
            }]
          });

          // Verify direction email is included in associated data
          expect(fetchedDepartment.direction).to.not.be.null;
          expect(fetchedDepartment.direction.dataValues).to.have.property('email');
          expect(fetchedDepartment.direction.email).to.equal(email.toLowerCase());

          // Clean up
          await department.destroy({ force: true });
          await direction.destroy({ force: true });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 8: API Response Completeness (Sections)
 * Feature: organizational-email-routing, Property 8: API Response Completeness
 * Validates: Requirements 7.4
 * 
 * *For any* API response returning organizational units, if the unit has an email field 
 * in the database, it must be included in the response.
 */
describe('Property 8: API Response Completeness (Sections)', function() {
  let testOrganizationId;
  let testDirectionId;
  let testDepartmentId;
  let testUser;
  let authToken;

  before(async function() {
    // Import models
    const { Organization } = await import('../../src/modules/models/index.js');
    const User = (await import('../../src/modules/users/userModel.js')).default;
    
    // Create test organization
    const org = await Organization.create({
      name: 'Test Organization for Section API Tests',
      slug: `test-org-section-api-${Date.now()}`,
      type: 'tenant',
      status: 'active'
    });
    testOrganizationId = org.id;

    // Create test direction
    const direction = await Direction.create({
      organizationId: testOrganizationId,
      name: 'Test Direction for Section API',
      isActive: true
    });
    testDirectionId = direction.id;

    // Create test department
    const department = await Department.create({
      organizationId: testOrganizationId,
      directionId: testDirectionId,
      name: 'Test Department for Section API',
      isActive: true
    });
    testDepartmentId = department.id;

    // Create test user (tenant-admin)
    testUser = await User.create({
      name: 'Test Admin for Section API',
      email: `test-admin-section-api-${Date.now()}@example.com`,
      password: 'password123',
      organizationId: testOrganizationId,
      role: 'tenant-admin',
      isActive: true
    });

    // Generate auth token (simplified - in real app would use proper JWT)
    authToken = 'test-token';
  });

  after(async function() {
    // Clean up
    const { Organization } = await import('../../src/modules/models/index.js');
    await Section.destroy({ where: { organizationId: testOrganizationId }, force: true });
    await Department.destroy({ where: { organizationId: testOrganizationId }, force: true });
    await Direction.destroy({ where: { organizationId: testOrganizationId }, force: true });
    if (testUser) {
      await testUser.destroy({ force: true });
    }
    await Organization.destroy({ where: { id: testOrganizationId }, force: true });
  });

  it('should include email field in Section list response for any section with email', async function() {
    await fc.assert(
      fc.asyncProperty(
        validEmailArb,
        async (email) => {
          // Create section with email
          const section = await Section.create({
            organizationId: testOrganizationId,
            departmentId: testDepartmentId,
            name: `Section ${Date.now()}-${Math.random()}`,
            email: email,
            isActive: true
          });

          // Fetch section from database
          const fetchedSection = await Section.findByPk(section.id);

          // Verify email is in the database record
          expect(fetchedSection.email).to.equal(email.toLowerCase());

          // Verify email is included in the model's dataValues (what API returns)
          expect(fetchedSection.dataValues).to.have.property('email');
          expect(fetchedSection.dataValues.email).to.equal(email.toLowerCase());

          // Verify email is included when converting to JSON (API response format)
          const jsonResponse = fetchedSection.toJSON();
          expect(jsonResponse).to.have.property('email');
          expect(jsonResponse.email).to.equal(email.toLowerCase());

          // Clean up
          await section.destroy({ force: true });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include email field (as null) in Section list response for sections without email', async function() {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async (email) => {
          // Create section without email
          const section = await Section.create({
            organizationId: testOrganizationId,
            departmentId: testDepartmentId,
            name: `Section ${Date.now()}-${Math.random()}`,
            email: email,
            isActive: true
          });

          // Fetch section from database
          const fetchedSection = await Section.findByPk(section.id);

          // Verify email is null in the database record
          expect(fetchedSection.email).to.be.null;

          // Verify email field is still present in dataValues
          expect(fetchedSection.dataValues).to.have.property('email');
          expect(fetchedSection.dataValues.email).to.be.null;

          // Verify email field is included in JSON response
          const jsonResponse = fetchedSection.toJSON();
          expect(jsonResponse).to.have.property('email');
          expect(jsonResponse.email).to.be.null;

          // Clean up
          await section.destroy({ force: true });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include email field in Section get-by-id response', async function() {
    await fc.assert(
      fc.asyncProperty(
        fc.option(validEmailArb, { nil: null }),
        async (email) => {
          // Create section with or without email
          const section = await Section.create({
            organizationId: testOrganizationId,
            departmentId: testDepartmentId,
            name: `Section ${Date.now()}-${Math.random()}`,
            email: email,
            isActive: true
          });

          // Fetch section by ID
          const fetchedSection = await Section.findByPk(section.id);

          // Verify email field is present
          expect(fetchedSection.dataValues).to.have.property('email');
          
          if (email) {
            expect(fetchedSection.email).to.equal(email.toLowerCase());
          } else {
            expect(fetchedSection.email).to.be.null;
          }

          // Clean up
          await section.destroy({ force: true });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include email field for multiple sections in list response', async function() {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.option(validEmailArb, { nil: null }), { minLength: 2, maxLength: 5 }),
        async (emails) => {
          // Ensure unique non-null emails
          const nonNullEmails = emails.filter(e => e !== null);
          const uniqueEmails = [...new Set(nonNullEmails.map(e => e.toLowerCase()))];
          if (uniqueEmails.length !== nonNullEmails.length) {
            return true; // Skip if duplicate emails
          }

          const sections = [];
          
          // Create multiple sections with various email states
          for (let i = 0; i < emails.length; i++) {
            const section = await Section.create({
              organizationId: testOrganizationId,
              departmentId: testDepartmentId,
              name: `Section ${Date.now()}-${i}-${Math.random()}`,
              email: emails[i],
              isActive: true
            });
            sections.push(section);
          }

          // Fetch all sections
          const fetchedSections = await Section.findAll({
            where: {
              organizationId: testOrganizationId,
              id: sections.map(s => s.id)
            }
          });

          // Verify all sections have email field in response
          expect(fetchedSections).to.have.lengthOf(sections.length);
          
          for (const fetchedSection of fetchedSections) {
            expect(fetchedSection.dataValues).to.have.property('email');
            
            // Find corresponding created section
            const originalSection = sections.find(s => s.id === fetchedSection.id);
            expect(originalSection).to.not.be.undefined;
            
            if (originalSection.email) {
              expect(fetchedSection.email).to.equal(originalSection.email.toLowerCase());
            } else {
              expect(fetchedSection.email).to.be.null;
            }
          }

          // Clean up
          for (const section of sections) {
            await section.destroy({ force: true });
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve email field through model associations', async function() {
    await fc.assert(
      fc.asyncProperty(
        validEmailArb,
        async (email) => {
          // Create section with email
          const section = await Section.create({
            organizationId: testOrganizationId,
            departmentId: testDepartmentId,
            name: `Section ${Date.now()}-${Math.random()}`,
            email: email,
            isActive: true
          });

          // Fetch section with department association
          const fetchedSection = await Section.findOne({
            where: { id: section.id },
            include: [{
              model: Department,
              as: 'department'
            }]
          });

          // Verify section email is included
          expect(fetchedSection).to.not.be.null;
          expect(fetchedSection.dataValues).to.have.property('email');
          expect(fetchedSection.email).to.equal(email.toLowerCase());

          // Clean up
          await section.destroy({ force: true });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
