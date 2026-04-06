import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const ProjectPhase = sequelize.define('ProjectPhase', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'order_index'
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: {
        args: [['pending', 'in_progress', 'completed']],
        msg: 'Status must be one of: pending, in_progress, completed'
      }
    }
  },
  progress: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  tableName: 'project_phases',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['status'] },
    { fields: ['project_id', 'order_index'] }
  ],
  hooks: {
    beforeValidate: (phase) => {
      // Validate that endDate is not before startDate
      if (phase.startDate && phase.endDate) {
        const start = new Date(phase.startDate);
        const end = new Date(phase.endDate);
        if (end < start) {
          throw new Error('End date cannot be before start date');
        }
      }
    },
    beforeCreate: async (phase) => {
      // Auto-assign orderIndex if not provided
      if (phase.orderIndex === 0 || phase.orderIndex === undefined) {
        const maxOrder = await ProjectPhase.max('orderIndex', {
          where: { projectId: phase.projectId }
        });
        phase.orderIndex = (maxOrder || 0) + 1;
      }
    }
  }
});

// Instance method to check if phase has tasks
ProjectPhase.prototype.hasTasks = async function() {
  // This will be implemented when ProjectTask model is available
  // For now, return false
  const ProjectTask = sequelize.models.ProjectTask;
  if (ProjectTask) {
    const count = await ProjectTask.count({
      where: { phaseId: this.id }
    });
    return count > 0;
  }
  return false;
};

// Instance method to recalculate progress based on tasks
ProjectPhase.prototype.recalculateProgress = async function() {
  const ProjectTask = sequelize.models.ProjectTask;
  if (ProjectTask) {
    const tasks = await ProjectTask.findAll({
      where: { phaseId: this.id },
      attributes: ['status']
    });
    
    if (tasks.length === 0) {
      this.progress = 0;
      return this.save();
    }
    
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    this.progress = Math.round((completedTasks / tasks.length) * 100);
    
    // Auto-complete phase if all tasks are done
    if (this.progress === 100 && this.status !== 'completed') {
      this.status = 'completed';
    }
    
    return this.save();
  }
  return this;
};

// Instance method to check if phase can be deleted
ProjectPhase.prototype.canDelete = async function() {
  const hasTasks = await this.hasTasks();
  return !hasTasks;
};

// Static method to reorder phases
ProjectPhase.reorder = async function(projectId, phaseIds) {
  const transaction = await sequelize.transaction();
  
  try {
    for (let i = 0; i < phaseIds.length; i++) {
      await ProjectPhase.update(
        { orderIndex: i + 1 },
        { 
          where: { id: phaseIds[i], projectId },
          transaction 
        }
      );
    }
    
    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export default ProjectPhase;
