import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const Asset = sequelize.define('Asset', {
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
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Identificação
  assetTag: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM(
      'desktop',
      'laptop',
      'server',
      'tablet',
      'smartphone',
      'printer',
      'scanner',
      'network_device',
      'monitor',
      'other'
    ),
    defaultValue: 'desktop'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance', 'retired', 'lost', 'stolen'),
    defaultValue: 'active'
  },
  // Hardware
  manufacturer: {
    type: DataTypes.STRING,
    allowNull: true
  },
  model: {
    type: DataTypes.STRING,
    allowNull: true
  },
  serialNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  processor: {
    type: DataTypes.STRING,
    allowNull: true
  },
  processorCores: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  ram: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ramGB: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  storage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  storageGB: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  storageType: {
    type: DataTypes.ENUM('HDD', 'SSD', 'NVME', 'Hybrid', 'Other'),
    allowNull: true
  },
  graphicsCard: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Sistema Operativo
  os: {
    type: DataTypes.STRING,
    allowNull: true
  },
  osVersion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  osBuild: {
    type: DataTypes.STRING,
    allowNull: true
  },
  osArchitecture: {
    type: DataTypes.ENUM('x86', 'x64', 'ARM', 'ARM64'),
    allowNull: true
  },
  // Rede
  hostname: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  macAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  domain: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Segurança
  hasAntivirus: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  antivirusName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  antivirusVersion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  antivirusUpdated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  hasFirewall: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isEncrypted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Datas
  purchaseDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  warrantyExpiry: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  lastSeen: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastInventoryScan: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Localização
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  building: {
    type: DataTypes.STRING,
    allowNull: true
  },
  floor: {
    type: DataTypes.STRING,
    allowNull: true
  },
  room: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Financeiro
  purchasePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  currentValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  supplier: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Informações adicionais
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rawData: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Dados brutos do último scan'
  },
  // Método de coleta
  collectionMethod: {
    type: DataTypes.ENUM('manual', 'web', 'agent', 'script', 'api'),
    defaultValue: 'manual'
  }
}, {
  tableName: 'assets',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['client_id'] },
    { fields: ['user_id'] },
    { fields: ['asset_tag'], unique: true },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['serial_number'] },
    { fields: ['hostname'] },
    { fields: ['last_seen'] }
  ]
});

export default Asset;
