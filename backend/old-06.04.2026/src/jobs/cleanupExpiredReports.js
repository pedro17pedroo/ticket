/**
 * Job para limpar relatórios de projetos expirados
 * Executa diariamente para remover ficheiros e registos de relatórios expirados
 * 
 * Requirements: 10.4
 */

import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProjectReport } from '../modules/projects/index.js';
import logger from '../config/logger.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Reports upload directory
const REPORTS_DIR = path.join(__dirname, '../../uploads/reports');

// Default retention period in days (configurable via environment variable)
const DEFAULT_RETENTION_DAYS = parseInt(process.env.REPORT_RETENTION_DAYS) || 90;

/**
 * Clean up expired project reports
 * - Deletes physical files from disk
 * - Removes database records
 * 
 * @param {number} retentionDays - Number of days to retain reports (default: 90)
 * @returns {Object} - Cleanup statistics
 */
export const cleanupExpiredReports = async (retentionDays = DEFAULT_RETENTION_DAYS) => {
  const stats = {
    filesDeleted: 0,
    recordsDeleted: 0,
    errors: [],
    startTime: new Date()
  };

  try {
    const now = new Date();
    
    // Find all expired reports
    const expiredReports = await ProjectReport.findAll({
      where: {
        expiresAt: {
          [Op.lt]: now
        }
      }
    });

    if (expiredReports.length === 0) {
      logger.debug('No expired project reports to clean up');
      stats.endTime = new Date();
      return stats;
    }

    logger.info(`Found ${expiredReports.length} expired project report(s) to clean up`);

    // Process each expired report
    for (const report of expiredReports) {
      try {
        // Try to delete the physical file
        if (report.filePath) {
          const absolutePath = path.join(__dirname, '../../', report.filePath);
          
          if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
            stats.filesDeleted++;
            logger.debug(`Deleted report file: ${report.filename}`);
          } else {
            logger.debug(`Report file not found (already deleted?): ${report.filename}`);
          }
        }

        // Delete the database record
        await report.destroy();
        stats.recordsDeleted++;
        
      } catch (fileError) {
        const errorMsg = `Error cleaning up report ${report.id}: ${fileError.message}`;
        logger.error(errorMsg);
        stats.errors.push(errorMsg);
        
        // Still try to delete the database record even if file deletion failed
        try {
          await report.destroy();
          stats.recordsDeleted++;
        } catch (dbError) {
          stats.errors.push(`Failed to delete DB record for ${report.id}: ${dbError.message}`);
        }
      }
    }

    stats.endTime = new Date();
    
    logger.info(`Report cleanup completed: ${stats.filesDeleted} files deleted, ${stats.recordsDeleted} records removed`);
    
    if (stats.errors.length > 0) {
      logger.warn(`Report cleanup had ${stats.errors.length} error(s)`);
    }

    return stats;

  } catch (error) {
    logger.error('Error during report cleanup job:', error);
    stats.errors.push(error.message);
    stats.endTime = new Date();
    return stats;
  }
};

/**
 * Clean up orphaned report files
 * Files that exist on disk but have no corresponding database record
 * 
 * @returns {Object} - Cleanup statistics
 */
export const cleanupOrphanedFiles = async () => {
  const stats = {
    orphanedFilesDeleted: 0,
    errors: [],
    startTime: new Date()
  };

  try {
    // Check if reports directory exists
    if (!fs.existsSync(REPORTS_DIR)) {
      logger.debug('Reports directory does not exist, nothing to clean');
      stats.endTime = new Date();
      return stats;
    }

    // Get all files in the reports directory
    const files = fs.readdirSync(REPORTS_DIR);
    
    if (files.length === 0) {
      logger.debug('No files in reports directory');
      stats.endTime = new Date();
      return stats;
    }

    // Get all report filenames from database
    const reports = await ProjectReport.findAll({
      attributes: ['filename']
    });
    const dbFilenames = new Set(reports.map(r => r.filename));

    // Find and delete orphaned files
    for (const file of files) {
      if (!dbFilenames.has(file)) {
        try {
          const filePath = path.join(REPORTS_DIR, file);
          fs.unlinkSync(filePath);
          stats.orphanedFilesDeleted++;
          logger.debug(`Deleted orphaned report file: ${file}`);
        } catch (error) {
          stats.errors.push(`Failed to delete orphaned file ${file}: ${error.message}`);
        }
      }
    }

    stats.endTime = new Date();
    
    if (stats.orphanedFilesDeleted > 0) {
      logger.info(`Cleaned up ${stats.orphanedFilesDeleted} orphaned report file(s)`);
    }

    return stats;

  } catch (error) {
    logger.error('Error during orphaned files cleanup:', error);
    stats.errors.push(error.message);
    stats.endTime = new Date();
    return stats;
  }
};

/**
 * Run full cleanup (expired reports + orphaned files)
 */
export const runFullCleanup = async () => {
  logger.info('Starting full report cleanup...');
  
  const expiredStats = await cleanupExpiredReports();
  const orphanedStats = await cleanupOrphanedFiles();
  
  return {
    expired: expiredStats,
    orphaned: orphanedStats,
    totalFilesDeleted: expiredStats.filesDeleted + orphanedStats.orphanedFilesDeleted,
    totalRecordsDeleted: expiredStats.recordsDeleted,
    totalErrors: [...expiredStats.errors, ...orphanedStats.errors]
  };
};

/**
 * Start the cleanup job
 * Runs daily at 3:00 AM by default
 */
export const startCleanupJob = () => {
  // Run daily (24 hours)
  const INTERVAL = 24 * 60 * 60 * 1000;
  
  // Calculate time until next 3:00 AM
  const now = new Date();
  const next3AM = new Date(now);
  next3AM.setHours(3, 0, 0, 0);
  
  if (next3AM <= now) {
    next3AM.setDate(next3AM.getDate() + 1);
  }
  
  const timeUntilFirst = next3AM.getTime() - now.getTime();
  
  // Schedule first run at 3:00 AM
  setTimeout(() => {
    runFullCleanup();
    
    // Then run every 24 hours
    setInterval(runFullCleanup, INTERVAL);
  }, timeUntilFirst);
  
  logger.info(`✅ Report cleanup job scheduled (runs daily at 3:00 AM, retention: ${DEFAULT_RETENTION_DAYS} days)`);
  
  // Also run immediately on startup if there are expired reports
  cleanupExpiredReports().then(stats => {
    if (stats.recordsDeleted > 0) {
      logger.info(`Initial cleanup: removed ${stats.recordsDeleted} expired report(s)`);
    }
  });
};

export default {
  cleanupExpiredReports,
  cleanupOrphanedFiles,
  runFullCleanup,
  startCleanupJob
};
