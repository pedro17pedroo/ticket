import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const Project = sequelize.define('Project', {
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
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Unique project code within organization (e.g., PRJ-001)'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  methodology: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'waterfall',
    validate: {
      isIn: {
        args: [['waterfall', 'agile', 'scrum', 'kanban', 'hybrid']],
        msg: 'Methodology must be one of: waterfall, agile, scrum, kanban, hybrid'
      }
    }
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'planning',
    validate: {
      isIn: {
        args: [['planning', 'in_progress', 'on_hold', 'completed', 'cancelled']],
        msg: 'Status must be one of: planning, in_progress, on_hold, completed, cancelled'
      }
    }
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'end_date'
  },
  progress: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_by'
    // No foreign key - can reference organization_users or users
  },
  archivedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'archived_at'
  }
}, {
  tableName: 'projects',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['status'] },
    { fields: ['methodology'] },
    { fields: ['created_by'] },
    { fields: ['start_date'] },
    { fields: ['end_date'] },
    { fields: ['code'] },
    { 
      fields: ['organization_id', 'code'],
      unique: true,
      name: 'unique_project_code_per_org'
    }
  ],
  hooks: {
    beforeValidate: async (project) => {
      // Generate unique project code: PRJ-XXX (must be done before validation)
      // Only generate code for new projects (not updates)
      if (!project.code && project.isNewRecord) {
        // Find the highest code number for this organization
        const lastProject = await Project.findOne({
          where: { organizationId: project.organizationId },
          order: [['code', 'DESC']],
          attributes: ['code']
        });
        
        let nextNum = 1;
        if (lastProject && lastProject.code) {
          // Extract number from code like PRJ-001
          const match = lastProject.code.match(/PRJ-(\d+)/);
          if (match) {
            nextNum = parseInt(match[1], 10) + 1;
          }
        }
        
        // Format as PRJ-XXX with leading zeros
        project.code = `PRJ-${String(nextNum).padStart(3, '0')}`;
      }
      
      // Validate that endDate is not before startDate
      if (project.startDate && project.endDate) {
        const start = new Date(project.startDate);
        const end = new Date(project.endDate);
        if (end < start) {
          throw new Error('End date cannot be before start date');
        }
      }
    }
  }
});

// Static method to generate project code
Project.generateCode = async function(organizationId) {
  const lastProject = await Project.findOne({
    where: { organizationId },
    order: [['code', 'DESC']],
    attributes: ['code']
  });
  
  let nextNum = 1;
  if (lastProject && lastProject.code) {
    const match = lastProject.code.match(/PRJ-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  
  return `PRJ-${String(nextNum).padStart(3, '0')}`;
};

// Instance method to check if project is archived
Project.prototype.isArchived = function() {
  return this.archivedAt !== null;
};

// Instance method to archive project
Project.prototype.archive = async function() {
  this.archivedAt = new Date();
  this.status = 'cancelled';
  return this.save();
};

// Instance method to calculate progress based on phases/tasks
Project.prototype.recalculateProgress = async function() {
  // This will be implemented when ProjectTask model is available
  // For now, return current progress
  return this.progress;
};

export default Project;
