import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const ProjectStakeholder = sequelize.define('ProjectStakeholder', {
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
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'user_id',
    // No foreign key - can reference organization_users
    comment: 'Reference to internal user (NULL for external stakeholders)'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: {
        msg: 'Must be a valid email address'
      }
    }
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'team_member',
    validate: {
      isIn: {
        args: [['sponsor', 'manager', 'team_member', 'observer', 'client']],
        msg: 'Role must be one of: sponsor, manager, team_member, observer, client'
      }
    }
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'internal',
    validate: {
      isIn: {
        args: [['internal', 'external']],
        msg: 'Type must be one of: internal, external'
      }
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'project_stakeholders',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['user_id'] },
    { fields: ['role'] },
    { fields: ['type'] }
  ],
  hooks: {
    beforeValidate: (stakeholder) => {
      // If type is internal, userId should be provided
      // If type is external, email should be provided
      if (stakeholder.type === 'internal' && !stakeholder.userId) {
        // Allow internal without userId for flexibility
        // but log a warning in production
      }
      
      if (stakeholder.type === 'external' && !stakeholder.email) {
        // Allow external without email for flexibility
        // but log a warning in production
      }
    }
  }
});

// Instance method to check if stakeholder is internal
ProjectStakeholder.prototype.isInternal = function() {
  return this.type === 'internal';
};

// Instance method to check if stakeholder is external
ProjectStakeholder.prototype.isExternal = function() {
  return this.type === 'external';
};

// Instance method to get display name
ProjectStakeholder.prototype.getDisplayName = function() {
  return this.name;
};

// Instance method to get contact info
ProjectStakeholder.prototype.getContactInfo = function() {
  return {
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    type: this.type
  };
};

// Static method to find stakeholders by role
ProjectStakeholder.findByRole = async function(projectId, role) {
  return ProjectStakeholder.findAll({
    where: { projectId, role }
  });
};

// Static method to find project managers
ProjectStakeholder.findManagers = async function(projectId) {
  return ProjectStakeholder.findAll({
    where: { 
      projectId, 
      role: ['sponsor', 'manager'] 
    }
  });
};

export default ProjectStakeholder;
