import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const ProjectTaskAttachment = sequelize.define('ProjectTaskAttachment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'task_id',
    references: {
      model: 'project_tasks',
      key: 'id'
    }
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Filename cannot be empty'
      }
    }
  },
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'original_name',
    validate: {
      notEmpty: {
        msg: 'Original name cannot be empty'
      }
    }
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'mime_type'
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  path: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Path cannot be empty'
      }
    }
  },
  uploadedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'uploaded_by'
    // No foreign key - can reference organization_users
  }
}, {
  tableName: 'project_task_attachments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true,
  indexes: [
    { fields: ['task_id'] },
    { fields: ['uploaded_by'] }
  ]
});

// Instance method to get file extension
ProjectTaskAttachment.prototype.getExtension = function() {
  const parts = this.originalName.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

// Instance method to check if file is an image
ProjectTaskAttachment.prototype.isImage = function() {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  return imageTypes.includes(this.mimeType);
};

// Instance method to check if file is a document
ProjectTaskAttachment.prototype.isDocument = function() {
  const docTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];
  return docTypes.includes(this.mimeType);
};

// Instance method to get human-readable file size
ProjectTaskAttachment.prototype.getHumanSize = function() {
  if (!this.size) return 'Unknown';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = this.size;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

// Static method to get attachments for a task
ProjectTaskAttachment.getTaskAttachments = async function(taskId) {
  return ProjectTaskAttachment.findAll({
    where: { taskId },
    order: [['created_at', 'DESC']]
  });
};

// Static method to get total size of attachments for a task
ProjectTaskAttachment.getTotalSize = async function(taskId) {
  const result = await ProjectTaskAttachment.sum('size', {
    where: { taskId }
  });
  return result || 0;
};

export default ProjectTaskAttachment;
