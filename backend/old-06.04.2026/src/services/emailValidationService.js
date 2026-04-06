import { Op } from 'sequelize';
import Direction from '../modules/directions/directionModel.js';
import Department from '../modules/departments/departmentModel.js';
import Section from '../modules/sections/sectionModel.js';
import logger from '../config/logger.js';

/**
 * Email Validation Service
 * Validates email uniqueness across organizational units (Directions, Departments, Sections)
 */
class EmailValidationService {
  /**
   * Validate email uniqueness across all organizational units within an organization
   * @param {string} email - Email to validate
   * @param {string} organizationId - Organization ID
   * @param {Object} excludeUnit - Unit to exclude from check (for updates)
   * @param {string} excludeUnit.type - Type of unit: 'direction', 'department', or 'section'
   * @param {string} excludeUnit.id - ID of the unit to exclude
   * @returns {Promise<{isValid: boolean, error?: string}>}
   */
  async validateEmailUniqueness(email, organizationId, excludeUnit = {}) {
    try {
      // If email is null or empty, it's valid (email is optional)
      if (!email || email.trim() === '') {
        return { isValid: true };
      }

      // Normalize email to lowercase for case-insensitive comparison
      const normalizedEmail = email.trim().toLowerCase();

      // Build query conditions
      const whereClause = {
        organizationId,
        email: normalizedEmail
      };

      // Check Directions
      const directionWhere = { ...whereClause };
      if (excludeUnit.type === 'direction' && excludeUnit.id) {
        directionWhere.id = { [Op.ne]: excludeUnit.id };
      }
      const existingDirection = await Direction.findOne({
        where: directionWhere,
        attributes: ['id', 'name', 'email']
      });

      if (existingDirection) {
        logger.warn(`Email ${normalizedEmail} already exists in Direction: ${existingDirection.name}`);
        return {
          isValid: false,
          error: `Este email já está associado à Direção "${existingDirection.name}"`
        };
      }

      // Check Departments
      const departmentWhere = { ...whereClause };
      if (excludeUnit.type === 'department' && excludeUnit.id) {
        departmentWhere.id = { [Op.ne]: excludeUnit.id };
      }
      const existingDepartment = await Department.findOne({
        where: departmentWhere,
        attributes: ['id', 'name', 'email']
      });

      if (existingDepartment) {
        logger.warn(`Email ${normalizedEmail} already exists in Department: ${existingDepartment.name}`);
        return {
          isValid: false,
          error: `Este email já está associado ao Departamento "${existingDepartment.name}"`
        };
      }

      // Check Sections
      const sectionWhere = { ...whereClause };
      if (excludeUnit.type === 'section' && excludeUnit.id) {
        sectionWhere.id = { [Op.ne]: excludeUnit.id };
      }
      const existingSection = await Section.findOne({
        where: sectionWhere,
        attributes: ['id', 'name', 'email']
      });

      if (existingSection) {
        logger.warn(`Email ${normalizedEmail} already exists in Section: ${existingSection.name}`);
        return {
          isValid: false,
          error: `Este email já está associado à Secção "${existingSection.name}"`
        };
      }

      // Email is unique
      return { isValid: true };

    } catch (error) {
      logger.error('Error validating email uniqueness:', error);
      throw error;
    }
  }
}

export default new EmailValidationService();
