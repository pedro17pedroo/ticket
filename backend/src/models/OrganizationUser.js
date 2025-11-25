import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcryptjs';

const OrganizationUser = sequelize.define('OrganizationUser', {
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
    },
    comment: 'Organização Tenant à qual pertence'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 255]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('org-admin', 'org-manager', 'agent', 'technician'),
    allowNull: false,
    defaultValue: 'agent',
    comment: 'org-admin = admin da organização, agent = atende tickets, technician = técnico'
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  directionId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'direction_id',
    references: {
      model: 'directions',
      key: 'id'
    }
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'department_id',
    references: {
      model: 'departments',
      key: 'id'
    }
  },
  sectionId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'section_id',
    references: {
      model: 'sections',
      key: 'id'
    }
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: {
      canManageTickets: true,
      canManageUsers: false,
      canManageClients: false,
      canViewReports: false,
      canManageSettings: false
    }
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      notifications: true,
      emailNotifications: true,
      theme: 'light',
      language: 'pt',
      timezone: 'Europe/Lisbon'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login'
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'password_reset_token'
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'password_reset_expires'
  }
}, {
  tableName: 'organization_users',
  timestamps: true,
  underscored: true,
  indexes: [
    { 
      fields: ['email', 'organization_id'], 
      unique: true,
      name: 'org_users_email_org_unique'
    },
    { fields: ['organization_id'] },
    { fields: ['role'] },
    { fields: ['is_active'] }
  ],
  defaultScope: {
    attributes: { exclude: ['password'] }
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password'] }
    }
  }
});

// Hook para hash de senha
OrganizationUser.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

OrganizationUser.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Método para comparar senha
OrganizationUser.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Método toJSON sem senha
OrganizationUser.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

export default OrganizationUser;
