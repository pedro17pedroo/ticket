import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const TeamWorkspace = sequelize.define('TeamWorkspace', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('department', 'project', 'incident', 'custom'),
    defaultValue: 'custom'
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#4F46E5'
  },
  members: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array de user IDs que são membros'
  },
  roles: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Roles dos membros no workspace'
    /*
    {
      userId: {
        role: 'owner|admin|member|viewer',
        permissions: ['read', 'write', 'delete']
      }
    }
    */
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      allowInvites: true,
      requireApproval: false,
      visibility: 'team'
    }
  },
  pinnedTickets: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: [],
    comment: 'IDs de tickets fixados'
  },
  sharedViews: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: [],
    comment: 'IDs de views compartilhadas'
  },
  goals: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Metas do time'
  },
  statistics: {
    type: DataTypes.JSON,
    defaultValue: {
      ticketsCount: 0,
      resolvedCount: 0,
      avgResolutionTime: 0
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Departments',
      key: 'id'
    }
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'team_workspaces',
  timestamps: true,
  underscored: true
});

export default TeamWorkspace;
