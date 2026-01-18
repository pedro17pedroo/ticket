/**
 * Integration Tests - Section Email API
 * Tests email functionality in Section API endpoints
 * 
 * Requirements: 7.5, 7.6
 */

import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app.js';
import { Organization, User, Direction, Department, Section } from '../../src/modules/models/index.js';

describe('Section Email API Integration Tests', function() {
  this.timeout(10000);

  let testOrg;
  let adminUser;
  let adminToken;
  let testDirection;
  let testDepartment;

  before(async function() {
    // Create test organization
    testOrg = await Organization.create({
      name: 'Test Organization for Section Email',
      slug: `test-org-section-email-${Date.now()}`,
      type: 'tenant',
      status: 'active'
    });

    // Create admin user
    adminUser = await User.create({
      organizationId: testOrg.id,
      name: 'Admin User',
      email: `admin-section-email-${Date.now()}@test.com`,
      password: 'password123',
      role: 'tenant-admin',
      isActive: true
    });

    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminUser.email,
        password: 'password123'
      });

    adminToken = loginRes.body.token;

    // Create test direction
    testDirection = await Direction.create({
      organizationId: testOrg.id,
      name: 'Test Direction for Section Email',
      isActive: true
    });

    // Create test department
    testDepartment = await Department.create({
      organizationId: testOrg.id,
      directionId: testDirection.id,
      name: 'Test Department for Section Email',
      isActive: true
    });
  });

  after(async function() {
    // Clean up
    await Section.destroy({ where: { organizationId: testOrg.id }, force: true });
    await Department.destroy({ where: { organizationId: testOrg.id }, force: true });
    await Direction.destroy({ where: { organizationId: testOrg.id }, force: true });
    if (adminUser) {
      await adminUser.destroy({ force: true });
    }
    await Organization.destroy({ where: { id: testOrg.id }, force: true });
  });

  describe('POST /api/sections - Create with Email', function() {
    it('should create section with valid email', async function() {
      const res = await request(app)
        .post('/api/sections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          departmentId: testDepartment.id,
          name: 'Section with Email',
          email: 'section-test@example.com'
        });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.section.email).to.equal('section-test@example.com');
    });

    it('should reject creation with duplicate email (already used in another section)', async function() {
      // Create first section with email
      await request(app)
        .post('/api/sections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          departmentId: testDepartment.id,
          name: 'Section Email 1',
          email: 'duplicate-section@example.com'
        });

      // Try to create second section with same email
      const res = await request(app)
        .post('/api/sections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          departmentId: testDepartment.id,
          name: 'Section Email 2',
          email: 'duplicate-section@example.com'
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.include('Secção');
    });

    it('should reject creation with duplicate email (already used in direction)', async function() {
      // Create direction with email
      await Direction.create({
        organizationId: testOrg.id,
        name: 'Direction with Email',
        email: 'direction-email-test@example.com',
        isActive: true
      });

      // Try to create section with same email
      const res = await request(app)
        .post('/api/sections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          departmentId: testDepartment.id,
          name: 'Section Conflict',
          email: 'direction-email-test@example.com'
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.include('Direção');
    });

    it('should reject creation with duplicate email (already used in department)', async function() {
      // Create department with email
      const dept = await Department.create({
        organizationId: testOrg.id,
        directionId: testDirection.id,
        name: 'Department with Email',
        email: 'department-email-test@example.com',
        isActive: true
      });

      // Try to create section with same email
      const res = await request(app)
        .post('/api/sections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          departmentId: dept.id,
          name: 'Section Conflict Dept',
          email: 'department-email-test@example.com'
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.include('Departamento');
    });

    it('should accept null email', async function() {
      const res = await request(app)
        .post('/api/sections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          departmentId: testDepartment.id,
          name: 'Section Without Email',
          email: null
        });

      expect(res.status).to.equal(201);
      expect(res.body.section.email).to.be.null;
    });

    it('should accept empty email (converted to null)', async function() {
      const res = await request(app)
        .post('/api/sections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          departmentId: testDepartment.id,
          name: 'Section Empty Email',
          email: ''
        });

      expect(res.status).to.equal(201);
      expect(res.body.section.email).to.be.null;
    });
  });

  describe('PUT /api/sections/:id - Update Email', function() {
    let sectionForUpdate;

    beforeEach(async function() {
      sectionForUpdate = await Section.create({
        organizationId: testOrg.id,
        departmentId: testDepartment.id,
        name: 'Section for Update Email',
        email: 'original-section@example.com',
        isActive: true
      });
    });

    afterEach(async function() {
      if (sectionForUpdate) {
        await sectionForUpdate.destroy({ force: true });
      }
    });

    it('should update section with new valid email', async function() {
      const res = await request(app)
        .put(`/api/sections/${sectionForUpdate.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Section Updated',
          email: 'updated-section@example.com'
        });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.section.email).to.equal('updated-section@example.com');
    });

    it('should reject update with duplicate email', async function() {
      // Create another section with email
      await Section.create({
        organizationId: testOrg.id,
        departmentId: testDepartment.id,
        name: 'Other Section',
        email: 'other-section@example.com',
        isActive: true
      });

      // Try to update to duplicate email
      const res = await request(app)
        .put(`/api/sections/${sectionForUpdate.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Section Updated',
          email: 'other-section@example.com'
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.include('Secção');
    });

    it('should allow update with same email (idempotence)', async function() {
      const res = await request(app)
        .put(`/api/sections/${sectionForUpdate.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Section Updated',
          email: 'original-section@example.com' // Same email
        });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.section.email).to.equal('original-section@example.com');
    });

    it('should allow removing email (set to null)', async function() {
      const res = await request(app)
        .put(`/api/sections/${sectionForUpdate.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Section Without Email',
          email: null
        });

      expect(res.status).to.equal(200);
      expect(res.body.section.email).to.be.null;
    });

    it('should allow removing email (set to empty string)', async function() {
      const res = await request(app)
        .put(`/api/sections/${sectionForUpdate.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Section Without Email',
          email: ''
        });

      expect(res.status).to.equal(200);
      expect(res.body.section.email).to.be.null;
    });
  });

  describe('GET /api/sections - Email in Response', function() {
    it('should include email field in section list', async function() {
      // Create section with email
      await Section.create({
        organizationId: testOrg.id,
        departmentId: testDepartment.id,
        name: 'Section with Email List',
        email: 'list-section@example.com',
        isActive: true
      });

      const res = await request(app)
        .get('/api/sections')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.sections).to.be.an('array');
      
      const sectionWithEmail = res.body.sections.find(s => s.email === 'list-section@example.com');
      expect(sectionWithEmail).to.exist;
      expect(sectionWithEmail).to.have.property('email');
    });

    it('should include email field (null) for sections without email', async function() {
      // Create section without email
      const section = await Section.create({
        organizationId: testOrg.id,
        departmentId: testDepartment.id,
        name: 'Section Without Email List',
        isActive: true
      });

      const res = await request(app)
        .get('/api/sections')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      
      const foundSection = res.body.sections.find(s => s.id === section.id);
      expect(foundSection).to.exist;
      expect(foundSection).to.have.property('email');
      expect(foundSection.email).to.be.null;
    });
  });

  describe('GET /api/sections/:id - Email in Response', function() {
    it('should include email field when getting section by ID', async function() {
      const section = await Section.create({
        organizationId: testOrg.id,
        departmentId: testDepartment.id,
        name: 'Section Get By ID',
        email: 'getbyid-section@example.com',
        isActive: true
      });

      const res = await request(app)
        .get(`/api/sections/${section.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.section).to.have.property('email');
      expect(res.body.section.email).to.equal('getbyid-section@example.com');
    });
  });
});
