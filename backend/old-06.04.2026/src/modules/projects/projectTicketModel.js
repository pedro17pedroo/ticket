import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const ProjectTicket = sequelize.define('ProjectTicket', {
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
  ticketId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'ticket_id',
    references: {
      model: 'tickets',
      key: 'id'
    }
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'task_id',
    references: {
      model: 'project_tasks',
      key: 'id'
    },
    comment: 'Optional reference to a specific task within the project'
  },
  linkedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'linked_at'
  },
  linkedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'linked_by'
    // No foreign key - can reference organization_users
  }
}, {
  tableName: 'project_tickets',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['ticket_id'] },
    { fields: ['task_id'] },
    { 
      fields: ['project_id', 'ticket_id'],
      unique: true,
      name: 'unique_project_ticket'
    }
  ]
});

// Static method to link a ticket to a project
ProjectTicket.linkTicket = async function(projectId, ticketId, options = {}) {
  const { taskId = null, linkedBy = null } = options;
  
  // Check if already linked
  const existing = await ProjectTicket.findOne({
    where: { projectId, ticketId }
  });
  
  if (existing) {
    // Update task association if provided
    if (taskId !== undefined) {
      existing.taskId = taskId;
      await existing.save();
    }
    return existing;
  }
  
  return ProjectTicket.create({
    projectId,
    ticketId,
    taskId,
    linkedBy,
    linkedAt: new Date()
  });
};

// Static method to unlink a ticket from a project
ProjectTicket.unlinkTicket = async function(projectId, ticketId) {
  const result = await ProjectTicket.destroy({
    where: { projectId, ticketId }
  });
  return result > 0;
};

// Static method to get all tickets for a project
ProjectTicket.getProjectTickets = async function(projectId, options = {}) {
  const { includeTask = false } = options;
  
  const include = [];
  
  if (includeTask) {
    const ProjectTask = sequelize.models.ProjectTask;
    if (ProjectTask) {
      include.push({
        model: ProjectTask,
        as: 'task',
        required: false
      });
    }
  }
  
  return ProjectTicket.findAll({
    where: { projectId },
    include,
    order: [['linkedAt', 'DESC']]
  });
};

// Static method to get all tickets for a task
ProjectTicket.getTaskTickets = async function(taskId) {
  return ProjectTicket.findAll({
    where: { taskId },
    order: [['linkedAt', 'DESC']]
  });
};

// Static method to check if a ticket is linked to a project
ProjectTicket.isLinked = async function(projectId, ticketId) {
  const count = await ProjectTicket.count({
    where: { projectId, ticketId }
  });
  return count > 0;
};

// Static method to get project info for a ticket
ProjectTicket.getTicketProject = async function(ticketId) {
  return ProjectTicket.findOne({
    where: { ticketId }
  });
};

export default ProjectTicket;
