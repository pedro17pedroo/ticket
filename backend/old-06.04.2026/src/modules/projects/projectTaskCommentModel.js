import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const ProjectTaskComment = sequelize.define('ProjectTaskComment', {
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
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
    // No foreign key - can reference organization_users
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Comment content cannot be empty'
      }
    }
  }
}, {
  tableName: 'project_task_comments',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['task_id'] },
    { fields: ['user_id'] },
    { fields: ['created_at'] }
  ]
});

// Instance method to check if user can edit comment
ProjectTaskComment.prototype.canEdit = function(userId) {
  return this.userId === userId;
};

// Instance method to check if user can delete comment
ProjectTaskComment.prototype.canDelete = function(userId) {
  return this.userId === userId;
};

// Static method to get comments for a task
ProjectTaskComment.getTaskComments = async function(taskId, options = {}) {
  const { limit = 50, offset = 0, order = 'DESC' } = options;
  
  return ProjectTaskComment.findAndCountAll({
    where: { taskId },
    limit,
    offset,
    order: [['createdAt', order]]
  });
};

// Static method to get recent comments for a project
ProjectTaskComment.getProjectRecentComments = async function(projectId, limit = 10) {
  const ProjectTask = sequelize.models.ProjectTask;
  
  if (!ProjectTask) {
    return [];
  }
  
  return ProjectTaskComment.findAll({
    include: [{
      model: ProjectTask,
      as: 'task',
      where: { projectId },
      attributes: ['id', 'title']
    }],
    order: [['createdAt', 'DESC']],
    limit
  });
};

export default ProjectTaskComment;
