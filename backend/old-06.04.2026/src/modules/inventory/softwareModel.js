import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const Software = sequelize.define('Software', {
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
  assetId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'assets',
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
    allowNull: true
  },
  version: {
    type: DataTypes.STRING,
    allowNull: true
  },
  edition: {
    type: DataTypes.STRING,
    allowNull: true
  },
  architecture: {
    type: DataTypes.ENUM('x86', 'x64', 'ARM', 'ARM64', 'Universal'),
    allowNull: true
  },
  // Tipo
  category: {
    type: DataTypes.ENUM(
      'operating_system',
      'office_suite',
      'security',
      'development',
      'database',
      'design',
      'communication',
      'browser',
      'productivity',
      'utility',
      'game',
      'system',
      'application',
      'other'
    ),
    defaultValue: 'other'
  },
  // Instalação
  installDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  installLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  installSize: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Size in bytes'
  },
  // Licença
  licenseType: {
    type: DataTypes.ENUM('perpetual', 'subscription', 'trial', 'free', 'open_source'),
    allowNull: true
  },
  licenseKey: {
    type: DataTypes.STRING,
    allowNull: true
  },
  licenseExpiry: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  isLicensed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastUsed: {
    type: DataTypes.DATE,
    allowNull: true
  },
  autoUpdate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Informações adicionais
  publisher: {
    type: DataTypes.STRING,
    allowNull: true
  },
  supportUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  uninstallString: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'software',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['asset_id'] },
    { fields: ['name'] },
    { fields: ['vendor'] },
    { fields: ['category'] },
    { fields: ['is_active'] }
  ]
});

export default Software;
