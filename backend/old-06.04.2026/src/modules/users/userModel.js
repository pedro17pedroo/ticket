import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'organizations',
      key: 'id'
    }
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
    type: DataTypes.ENUM(
      // Provider roles
      'super-admin', 'provider-admin', 'provider-support',
      // Tenant roles
      'tenant-admin', 'tenant-manager', 'agent', 'viewer'
    ),
    allowNull: false,
    defaultValue: 'agent',
    comment: 'Roles para staff interno (Provider ou Tenant). Client users usam ClientUser model'
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
    references: {
      model: 'directions',
      key: 'id'
    }
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id'
    }
  },
  sectionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'sections',
      key: 'id'
    }
  },
  // Permissões especiais (JSONB para flexibilidade)
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: {
      canManageUsers: false,
      canManageClients: false,
      canManageTickets: true,
      canViewReports: false,
      canManageSettings: false,
      canAccessAPI: false
    },
    comment: 'Permissões granulares para o usuário'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      notifications: true,
      emailNotifications: true,
      theme: 'light',
      language: 'pt'
    }
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Para utilizadores cliente-org, indica a empresa cliente à qual pertencem'
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
  tableName: 'users',
  indexes: [
    { 
      fields: ['email', 'organization_id'], 
      unique: true,
      name: 'users_email_organization_unique'
    },
    { fields: ['organization_id'] },
    { fields: ['role'] },
    { fields: ['direction_id'] },
    { fields: ['department_id'] },
    { fields: ['section_id'] }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Método para comparar senha
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Excluir senha do JSON
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

// Scope para incluir senha (usado apenas no login)
User.addScope('withPassword', {
  attributes: { include: ['password'] }
});

export default User;
