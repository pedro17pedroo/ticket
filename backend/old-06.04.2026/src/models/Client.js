import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Client = sequelize.define('Client', {
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
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tradeName: {
    type: DataTypes.STRING,
    field: 'trade_name'
  },
  nif: {
    type: DataTypes.STRING
  },
  taxId: {
    type: DataTypes.STRING,
    field: 'tax_id'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING
  },
  website: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.TEXT
  },
  contactPerson: {
    type: DataTypes.STRING,
    field: 'contact_person'
  },
  primaryContact: {
    type: DataTypes.JSONB,
    field: 'primary_contact'
  },
  industryType: {
    type: DataTypes.STRING,
    field: 'industry_type'
  },
  contract: {
    type: DataTypes.JSONB
  },
  billing: {
    type: DataTypes.JSONB
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  stats: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  suspendedAt: {
    type: DataTypes.DATE,
    field: 'suspended_at'
  },
  suspendedReason: {
    type: DataTypes.TEXT,
    field: 'suspended_reason'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'clients',
  timestamps: true,
  underscored: true
});

export default Client;
