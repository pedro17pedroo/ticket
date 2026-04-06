import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const License = sequelize.define('License', {
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
  clientId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  // Identificação
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  vendor: {
    type: DataTypes.STRING,
    allowNull: false
  },
  product: {
    type: DataTypes.STRING,
    allowNull: false
  },
  version: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Licença
  licenseKey: {
    type: DataTypes.STRING,
    allowNull: false
  },
  licenseType: {
    type: DataTypes.ENUM('perpetual', 'subscription', 'trial', 'volume', 'oem', 'academic', 'nfr'),
    allowNull: false,
    defaultValue: 'subscription'
  },
  // Quantidades
  totalSeats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  usedSeats: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  availableSeats: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.totalSeats - this.usedSeats;
    }
  },
  // Datas
  purchaseDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  activationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  renewalDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  // Status
  status: {
    type: DataTypes.ENUM('active', 'expired', 'suspended', 'cancelled', 'trial'),
    defaultValue: 'active'
  },
  autoRenew: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Financeiro
  purchasePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  renewalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'EUR'
  },
  billingCycle: {
    type: DataTypes.ENUM('monthly', 'quarterly', 'yearly', 'one_time'),
    allowNull: true
  },
  // Fornecedor
  supplier: {
    type: DataTypes.STRING,
    allowNull: true
  },
  supplierContact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  supplierEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Documentação
  purchaseOrder: {
    type: DataTypes.STRING,
    allowNull: true
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contractDocument: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL or path to contract file'
  },
  // Suporte
  supportLevel: {
    type: DataTypes.ENUM('none', 'basic', 'standard', 'premium', 'enterprise'),
    allowNull: true
  },
  supportContact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  supportExpiry: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  // Alertas
  notifyDaysBefore: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    comment: 'Days before expiry to send notification'
  },
  lastNotificationSent: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Informações adicionais
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'licenses',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['client_id'] },
    { fields: ['vendor'] },
    { fields: ['status'] },
    { fields: ['expiry_date'] },
    { fields: ['license_type'] }
  ],
  hooks: {
    beforeSave: (license) => {
      // Garantir que usedSeats não excede totalSeats
      if (license.usedSeats > license.totalSeats) {
        license.usedSeats = license.totalSeats;
      }
    }
  }
});

export default License;
