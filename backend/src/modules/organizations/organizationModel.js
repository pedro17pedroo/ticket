import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('provider', 'tenant'),
    allowNull: false,
    defaultValue: 'tenant',
    comment: 'Provider = TatuTicket, Tenant = Organizações clientes'
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'organizations',
      key: 'id'
    },
    comment: 'NULL para provider, ID do provider para tenants'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 255]
    }
  },
  tradeName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nome fantasia da organização'
  },
  taxId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'NIF/CNPJ da organização'
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      is: /^[a-z0-9-]+$/
    }
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  primaryColor: {
    type: DataTypes.STRING,
    defaultValue: '#3B82F6',
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  secondaryColor: {
    type: DataTypes.STRING,
    defaultValue: '#10B981',
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  subscription: {
    type: DataTypes.JSONB,
    defaultValue: {
      plan: 'professional',
      status: 'active',
      maxUsers: 50,
      maxClients: 100,
      maxStorageGB: 50,
      features: ['sla', 'automation', 'reports']
    },
    comment: 'Plano e limites para tenants'
  },
  deployment: {
    type: DataTypes.JSONB,
    defaultValue: {
      type: 'saas',
      region: 'eu-west'
    },
    comment: 'Configurações de deployment (SaaS ou On-Premise)'
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      language: 'pt',
      timezone: 'Europe/Lisbon',
      dateFormat: 'DD/MM/YYYY',
      allowSelfRegistration: true,
      requireApproval: false,
      sessionTimeout: 480,
      twoFactorAuth: false
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  suspendedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  suspendedReason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'organizations',
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['type'] },
    { fields: ['parent_id'] },
    { fields: ['is_active'] },
    { fields: ['tax_id'] }
  ]
});

export default Organization;
