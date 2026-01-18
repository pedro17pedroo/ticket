import Direction from '../modules/directions/directionModel.js';
import Department from '../modules/departments/departmentModel.js';
import Section from '../modules/sections/sectionModel.js';
import logger from '../config/logger.js';

/**
 * Email Router Service
 * Routes incoming emails to the appropriate organizational unit based on destination email
 */
class EmailRouterService {
  /**
   * Find organizational unit by email address
   * Searches in order: Sections, Departments, Directions
   * @param {string} email - Destination email address
   * @param {string} organizationId - Organization ID
   * @returns {Promise<{type: string, unit: Object}|null>} - Returns {type, unit} or null if no match
   */
  async findOrganizationalUnitByEmail(email, organizationId) {
    try {
      // If email is null or empty, return null
      if (!email || email.trim() === '') {
        logger.debug('Email is empty, returning null');
        return null;
      }

      // Normalize email to lowercase for case-insensitive comparison
      const normalizedEmail = email.trim().toLowerCase();

      logger.debug(`Searching for organizational unit with email: ${normalizedEmail} in organization: ${organizationId}`);

      // Search in order: Sections, Departments, Directions
      // This allows more specific units to take precedence

      // 1. Check Sections first (most specific)
      const section = await Section.findOne({
        where: {
          organizationId,
          email: normalizedEmail
        }
      });

      if (section) {
        logger.info(`Found Section with email ${normalizedEmail}: ${section.name}`);
        return {
          type: 'section',
          unit: section
        };
      }

      // 2. Check Departments (intermediate level)
      const department = await Department.findOne({
        where: {
          organizationId,
          email: normalizedEmail
        }
      });

      if (department) {
        logger.info(`Found Department with email ${normalizedEmail}: ${department.name}`);
        return {
          type: 'department',
          unit: department
        };
      }

      // 3. Check Directions (highest level)
      const direction = await Direction.findOne({
        where: {
          organizationId,
          email: normalizedEmail
        }
      });

      if (direction) {
        logger.info(`Found Direction with email ${normalizedEmail}: ${direction.name}`);
        return {
          type: 'direction',
          unit: direction
        };
      }

      // No match found
      logger.warn(`No organizational unit found with email: ${normalizedEmail}`);
      return null;

    } catch (error) {
      logger.error('Error finding organizational unit by email:', error);
      throw error;
    }
  }
}

export default new EmailRouterService();
