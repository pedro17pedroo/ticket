import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const ProjectTask = sequelize.define('ProjectTask', {
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
  phaseId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'phase_id',
    references: {
      model: 'project_phases',
      key: 'id'
    }
  },
  title: {
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
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'todo',
    validate: {
      isIn: {
        args: [['todo', 'in_progress', 'in_review', 'done']],
        msg: 'Status must be one of: todo, in_progress, in_review, done'
      }
    }
  },
  priority: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'medium',
    validate: {
      isIn: {
        args: [['low', 'medium', 'high', 'critical']],
        msg: 'Priority must be one of: low, medium, high, critical'
      }
    }
  },
  estimatedHours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'estimated_hours',
    validate: {
      min: 0
    }
  },
  actualHours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'actual_hours',
    validate: {
      min: 0
    }
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'start_date'
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'due_date'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'assigned_to'
    // No foreign key - can reference organization_users
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'order_index'
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
    // No foreign key - can reference organization_users
  }
}, {
  tableName: 'project_tasks',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['phase_id'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['assigned_to'] },
    { fields: ['due_date'] },
    { fields: ['phase_id', 'order_index'] }
  ],
  hooks: {
    beforeValidate: (task) => {
      // Validate that dueDate is not before startDate
      if (task.startDate && task.dueDate) {
        const start = new Date(task.startDate);
        const due = new Date(task.dueDate);
        if (due < start) {
          throw new Error('Due date cannot be before start date');
        }
      }
    },
    beforeCreate: async (task) => {
      // Auto-assign orderIndex if not provided
      if (task.orderIndex === 0 || task.orderIndex === undefined) {
        const maxOrder = await ProjectTask.max('orderIndex', {
          where: { phaseId: task.phaseId }
        });
        task.orderIndex = (maxOrder || 0) + 1;
      }
    },
    afterCreate: async (task) => {
      // Recalculate phase progress after task creation
      await recalculatePhaseAndProjectProgress(task.phaseId, task.projectId);
    },
    afterUpdate: async (task, options) => {
      // If status changed to 'done', set completedAt
      if (task.changed('status')) {
        if (task.status === 'done' && !task.completedAt) {
          task.completedAt = new Date();
          await task.save({ hooks: false, transaction: options.transaction });
        } else if (task.status !== 'done' && task.completedAt) {
          task.completedAt = null;
          await task.save({ hooks: false, transaction: options.transaction });
        }
        
        // Recalculate phase progress when status changes
        await recalculatePhaseAndProjectProgress(task.phaseId, task.projectId);
      }
    },
    afterDestroy: async (task) => {
      // Recalculate phase progress after task deletion
      await recalculatePhaseAndProjectProgress(task.phaseId, task.projectId);
    }
  }
});

// Instance method to check if task is overdue
ProjectTask.prototype.isOverdue = function() {
  if (!this.dueDate || this.status === 'done') {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(this.dueDate);
  return due < today;
};

// Instance method to get task dependencies
ProjectTask.prototype.getDependencies = async function() {
  const ProjectTaskDependency = sequelize.models.ProjectTaskDependency;
  if (ProjectTaskDependency) {
    return ProjectTaskDependency.findAll({
      where: { taskId: this.id },
      include: [{
        model: ProjectTask,
        as: 'dependsOnTask'
      }]
    });
  }
  return [];
};

// Instance method to get tasks that depend on this task
ProjectTask.prototype.getDependentTasks = async function() {
  const ProjectTaskDependency = sequelize.models.ProjectTaskDependency;
  if (ProjectTaskDependency) {
    return ProjectTaskDependency.findAll({
      where: { dependsOnTaskId: this.id },
      include: [{
        model: ProjectTask,
        as: 'task'
      }]
    });
  }
  return [];
};

// Instance method to move task to different phase
ProjectTask.prototype.moveToPhase = async function(newPhaseId) {
  const maxOrder = await ProjectTask.max('orderIndex', {
    where: { phaseId: newPhaseId }
  });
  
  this.phaseId = newPhaseId;
  this.orderIndex = (maxOrder || 0) + 1;
  
  return this.save();
};

// Instance method to update status (for Kanban)
ProjectTask.prototype.updateStatus = async function(newStatus) {
  const validStatuses = ['todo', 'in_progress', 'in_review', 'done'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }
  
  this.status = newStatus;
  
  // Set progress based on status
  switch (newStatus) {
    case 'todo':
      this.progress = 0;
      break;
    case 'in_progress':
      this.progress = Math.max(this.progress, 25);
      break;
    case 'in_review':
      this.progress = Math.max(this.progress, 75);
      break;
    case 'done':
      this.progress = 100;
      this.completedAt = new Date();
      break;
  }
  
  return this.save();
};

// Static method to reorder tasks within a phase
ProjectTask.reorder = async function(phaseId, taskIds) {
  const transaction = await sequelize.transaction();
  
  try {
    for (let i = 0; i < taskIds.length; i++) {
      await ProjectTask.update(
        { orderIndex: i + 1 },
        { 
          where: { id: taskIds[i], phaseId },
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

/**
 * Helper function to recalculate phase and project progress
 * Requirements: 2.6, 2.7, 3.7
 * @param {string} phaseId - The phase ID
 * @param {string} projectId - The project ID
 */
async function recalculatePhaseAndProjectProgress(phaseId, projectId) {
  try {
    const ProjectPhase = sequelize.models.ProjectPhase;
    const Project = sequelize.models.Project;
    
    if (!ProjectPhase || !Project) {
      return;
    }
    
    // Recalculate phase progress
    const phase = await ProjectPhase.findByPk(phaseId);
    if (phase) {
      const tasks = await ProjectTask.findAll({
        where: { phaseId },
        attributes: ['status']
      });
      
      if (tasks.length === 0) {
        phase.progress = 0;
        // Reset status if no tasks
        if (phase.status === 'completed') {
          phase.status = 'pending';
        }
      } else {
        const completedTasks = tasks.filter(t => t.status === 'done').length;
        phase.progress = Math.round((completedTasks / tasks.length) * 100);
        
        // Auto-complete phase if all tasks are done (Requirement 2.7)
        if (phase.progress === 100 && phase.status !== 'completed') {
          phase.status = 'completed';
        } else if (phase.progress < 100 && phase.status === 'completed') {
          // Revert to in_progress if not all tasks are done
          phase.status = 'in_progress';
        } else if (phase.progress > 0 && phase.status === 'pending') {
          // Set to in_progress if some tasks are done
          phase.status = 'in_progress';
        }
      }
      
      await phase.save({ hooks: false });
    }
    
    // Recalculate project progress
    const phases = await ProjectPhase.findAll({
      where: { projectId },
      attributes: ['progress']
    });
    
    if (phases.length > 0) {
      const totalProgress = phases.reduce((sum, p) => sum + p.progress, 0);
      const averageProgress = Math.round(totalProgress / phases.length);
      
      await Project.update(
        { progress: averageProgress },
        { where: { id: projectId }, hooks: false }
      );
    }
  } catch (error) {
    console.error('Error recalculating progress:', error);
    // Don't throw - this is a side effect and shouldn't break the main operation
  }
}

export default ProjectTask;
