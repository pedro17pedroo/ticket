import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const ProjectReport = sequelize.define('ProjectReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
    references: {
      model: 'organizations',
      key: 'id'
    }
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'project_id',
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: {
        args: [[
          'project_charter',
          'project_closure',
          'status_report',
          'schedule_report',
          'task_report',
          'stakeholder_report',
          'executive_summary'
        ]],
        msg: 'Invalid report type'
      }
    }
  },
  format: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pdf',
    validate: {
      isIn: {
        args: [['pdf', 'excel']],
        msg: 'Format must be pdf or excel'
      }
    }
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'file_path'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'file_size'
  },
  options: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Report generation options (filters, period, etc.)'
  },
  generatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'generated_by'
    // No foreign key - can reference organization_users
  },
  generatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'generated_at'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at'
  }
}, {
  tableName: 'project_reports',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['project_id'] },
    { fields: ['type'] },
    { fields: ['generated_by'] },
    { fields: ['generated_at'] },
    { fields: ['expires_at'] }
  ],
  hooks: {
    beforeCreate: (report) => {
      // Set default expiration to 90 days from now
      if (!report.expiresAt) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 90);
        report.expiresAt = expirationDate;
      }
    }
  }
});

// Instance method to check if report is expired
ProjectReport.prototype.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > new Date(this.expiresAt);
};

// Static method to find expired reports
ProjectReport.findExpired = async function(organizationId = null) {
  const where = {
    expiresAt: {
      [sequelize.Sequelize.Op.lt]: new Date()
    }
  };
  
  if (organizationId) {
    where.organizationId = organizationId;
  }
  
  return this.findAll({ where });
};

// Static method to clean up expired reports
ProjectReport.cleanupExpired = async function(organizationId = null) {
  const where = {
    expiresAt: {
      [sequelize.Sequelize.Op.lt]: new Date()
    }
  };
  
  if (organizationId) {
    where.organizationId = organizationId;
  }
  
  return this.destroy({ where });
};

export default ProjectReport;
