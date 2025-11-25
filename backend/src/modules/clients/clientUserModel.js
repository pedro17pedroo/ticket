import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import bcrypt from 'bcryptjs';

const ClientUser = sequelize.define('ClientUser', {
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
    },
    comment: 'Tenant - para multi-tenancy'
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    },
    comment: 'Empresa cliente à qual pertence'
  },
  // Identificação
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
  // Role dentro da empresa cliente
  role: {
    type: DataTypes.ENUM('client-admin', 'client-manager', 'client-user'),
    allowNull: false,
    defaultValue: 'client-user',
    comment: 'client-admin pode criar users, client-manager aprova, client-user apenas usa'
  },
  // Perfil
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  position: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Cargo na empresa cliente'
  },
  departmentName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Departamento dentro da empresa cliente'
  },
  // Localização (para suporte on-site)
  location: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'building, floor, room, site para multi-site'
  },
  // Permissões
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: {
      canCreateTickets: true,
      canViewAllClientTickets: false,
      canApproveRequests: false,
      canAccessKnowledgeBase: true,
      canRequestServices: true
    }
  },
  // Configurações pessoais
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      notifications: true,
      emailNotifications: true,
      theme: 'light',
      language: 'pt',
      autoWatchTickets: true
    }
  },
  // Status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'client_users',
  timestamps: true,
  indexes: [
    { 
      fields: ['email', 'organization_id'], 
      unique: true,
      name: 'client_users_email_org_unique'
    },
    { fields: ['client_id'] },
    { fields: ['organization_id'] },
    { fields: ['role'] },
    { fields: ['is_active'] }
  ],
  hooks: {
    beforeCreate: async (clientUser) => {
      if (clientUser.password) {
        const salt = await bcrypt.genSalt(10);
        clientUser.password = await bcrypt.hash(clientUser.password, salt);
      }
    },
    beforeUpdate: async (clientUser) => {
      if (clientUser.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        clientUser.password = await bcrypt.hash(clientUser.password, salt);
      }
    }
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password'] }
    }
  }
});

// Método para comparar senha
ClientUser.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Excluir senha do JSON
ClientUser.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

export default ClientUser;
