/**
 * Report Generator Service
 * 
 * Main entry point for report generation utilities.
 * Supports PDF and Excel formats for various report types.
 * 
 * Requirements: 3.2, 4.2, 5.3, 6.2, 7.3, 8.2, 9.3
 */

import PDFGenerator from './pdfGenerator.js';
import ExcelGenerator from './excelGenerator.js';
import { REPORT_TYPES, REPORT_FORMATS } from './constants.js';

export {
  PDFGenerator,
  ExcelGenerator,
  REPORT_TYPES,
  REPORT_FORMATS
};

/**
 * Generate a report in the specified format
 * @param {string} type - Report type
 * @param {string} format - Output format (pdf or excel)
 * @param {Object} data - Report data
 * @param {Object} options - Generation options
 * @returns {Promise<Buffer>} - Generated file buffer
 */
export async function generateReport(type, format, data, options = {}) {
  if (!REPORT_TYPES[type]) {
    throw new Error(`Invalid report type: ${type}`);
  }

  const reportConfig = REPORT_TYPES[type];
  
  if (!reportConfig.formats.includes(format)) {
    throw new Error(`Format ${format} not supported for report type ${type}. Supported formats: ${reportConfig.formats.join(', ')}`);
  }

  if (format === 'pdf') {
    const pdfGenerator = new PDFGenerator(data, options);
    return pdfGenerator.generate(type);
  } else if (format === 'excel') {
    const excelGenerator = new ExcelGenerator(data, options);
    return excelGenerator.generate(type);
  }

  throw new Error(`Unsupported format: ${format}`);
}

/**
 * Get supported formats for a report type
 * @param {string} type - Report type
 * @returns {string[]} - Array of supported formats
 */
export function getSupportedFormats(type) {
  const reportConfig = REPORT_TYPES[type];
  return reportConfig ? reportConfig.formats : [];
}

/**
 * Check if a format is supported for a report type
 * @param {string} type - Report type
 * @param {string} format - Format to check
 * @returns {boolean}
 */
export function isFormatSupported(type, format) {
  const formats = getSupportedFormats(type);
  return formats.includes(format);
}

export default {
  generateReport,
  getSupportedFormats,
  isFormatSupported,
  PDFGenerator,
  ExcelGenerator,
  REPORT_TYPES,
  REPORT_FORMATS
};
