/**
 * File Uploader Module
 * Gerencia upload de arquivos com suporte a drag & drop, preview e progresso
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class FileUploader {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedTypes = [
      // Imagens
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Documentos
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Texto
      'text/plain',
      'text/csv',
      'text/html',
      'text/css',
      'text/javascript',
      'application/json',
      'application/xml',
      // Arquivos compactados
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip'
    ];
    
    this.allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.txt', '.csv', '.html', '.css', '.js', '.json', '.xml',
      '.zip', '.rar', '.7z', '.tar', '.gz'
    ];
  }

  /**
   * Valida um arquivo
   * @param {string} filePath - Caminho do arquivo
   * @returns {object} Resultado da validação
   */
  validateFile(filePath) {
    try {
      // Verificar se arquivo existe
      if (!fs.existsSync(filePath)) {
        return {
          valid: false,
          error: 'Arquivo não encontrado'
        };
      }

      // Obter informações do arquivo
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const fileName = path.basename(filePath);

      // Verificar tamanho
      if (stats.size > this.maxFileSize) {
        return {
          valid: false,
          error: `Arquivo muito grande. Máximo: ${this.formatFileSize(this.maxFileSize)}`
        };
      }

      // Verificar extensão
      if (!this.allowedExtensions.includes(ext)) {
        return {
          valid: false,
          error: `Tipo de arquivo não permitido: ${ext}`
        };
      }

      return {
        valid: true,
        file: {
          path: filePath,
          name: fileName,
          size: stats.size,
          extension: ext,
          mimeType: this.getMimeType(ext)
        }
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Valida múltiplos arquivos
   * @param {array} filePaths - Array de caminhos de arquivos
   * @returns {object} Resultado da validação
   */
  validateFiles(filePaths) {
    const results = {
      valid: [],
      invalid: []
    };

    for (const filePath of filePaths) {
      const validation = this.validateFile(filePath);
      
      if (validation.valid) {
        results.valid.push(validation.file);
      } else {
        results.invalid.push({
          path: filePath,
          name: path.basename(filePath),
          error: validation.error
        });
      }
    }

    return results;
  }

  /**
   * Faz upload de um arquivo
   * @param {string} ticketId - ID do ticket
   * @param {string} filePath - Caminho do arquivo
   * @param {function} onProgress - Callback de progresso
   * @returns {Promise<object>} Resultado do upload
   */
  async uploadFile(ticketId, filePath, onProgress = null) {
    try {
      // Validar arquivo
      const validation = this.validateFile(filePath);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      const file = validation.file;

      // Ler arquivo
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');

      // Preparar dados para upload
      const uploadData = {
        ticketId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.mimeType,
        data: base64Data
      };

      // Fazer upload via API
      const result = await this.apiClient.uploadAttachment(ticketId, uploadData, onProgress);

      return {
        success: true,
        attachment: result.attachment
      };
    } catch (error) {
      console.error('[FileUploader] Erro ao fazer upload:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Faz upload de múltiplos arquivos
   * @param {string} ticketId - ID do ticket
   * @param {array} filePaths - Array de caminhos de arquivos
   * @param {function} onProgress - Callback de progresso
   * @returns {Promise<object>} Resultado dos uploads
   */
  async uploadFiles(ticketId, filePaths, onProgress = null) {
    const results = {
      success: [],
      failed: []
    };

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      const fileName = path.basename(filePath);

      try {
        // Callback de progresso geral
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: filePaths.length,
            fileName,
            status: 'uploading'
          });
        }

        // Upload individual
        const result = await this.uploadFile(ticketId, filePath, (fileProgress) => {
          if (onProgress) {
            onProgress({
              current: i + 1,
              total: filePaths.length,
              fileName,
              status: 'uploading',
              fileProgress: fileProgress.percent
            });
          }
        });

        if (result.success) {
          results.success.push({
            fileName,
            attachment: result.attachment
          });
        } else {
          results.failed.push({
            fileName,
            error: result.error
          });
        }
      } catch (error) {
        results.failed.push({
          fileName,
          error: error.message
        });
      }
    }

    return {
      success: results.failed.length === 0,
      uploaded: results.success.length,
      failed: results.failed.length,
      results
    };
  }

  /**
   * Gera preview de imagem
   * @param {string} filePath - Caminho do arquivo
   * @returns {Promise<string>} Data URL da imagem
   */
  async generateImagePreview(filePath) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

      if (!imageExtensions.includes(ext)) {
        return null;
      }

      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = this.getMimeType(ext);

      return `data:${mimeType};base64,${base64Data}`;
    } catch (error) {
      console.error('[FileUploader] Erro ao gerar preview:', error);
      return null;
    }
  }

  /**
   * Obtém informações de um arquivo
   * @param {string} filePath - Caminho do arquivo
   * @returns {object} Informações do arquivo
   */
  getFileInfo(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const fileName = path.basename(filePath);

      return {
        path: filePath,
        name: fileName,
        size: stats.size,
        sizeFormatted: this.formatFileSize(stats.size),
        extension: ext,
        mimeType: this.getMimeType(ext),
        isImage: this.isImage(ext),
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Verifica se é uma imagem
   * @param {string} ext - Extensão do arquivo
   * @returns {boolean} true se for imagem
   */
  isImage(ext) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.includes(ext.toLowerCase());
  }

  /**
   * Obtém MIME type baseado na extensão
   * @param {string} ext - Extensão do arquivo
   * @returns {string} MIME type
   */
  getMimeType(ext) {
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.7z': 'application/x-7z-compressed',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip'
    };

    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Formata tamanho de arquivo
   * @param {number} bytes - Tamanho em bytes
   * @returns {string} Tamanho formatado
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Obtém ícone para tipo de arquivo
   * @param {string} ext - Extensão do arquivo
   * @returns {string} Emoji do ícone
   */
  getFileIcon(ext) {
    const icons = {
      '.jpg': '🖼️',
      '.jpeg': '🖼️',
      '.png': '🖼️',
      '.gif': '🖼️',
      '.webp': '🖼️',
      '.svg': '🖼️',
      '.pdf': '📄',
      '.doc': '📝',
      '.docx': '📝',
      '.xls': '📊',
      '.xlsx': '📊',
      '.ppt': '📊',
      '.pptx': '📊',
      '.txt': '📄',
      '.csv': '📊',
      '.html': '🌐',
      '.css': '🎨',
      '.js': '⚙️',
      '.json': '⚙️',
      '.xml': '⚙️',
      '.zip': '📦',
      '.rar': '📦',
      '.7z': '📦',
      '.tar': '📦',
      '.gz': '📦'
    };

    return icons[ext.toLowerCase()] || '📎';
  }
}

module.exports = FileUploader;
