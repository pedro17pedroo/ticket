import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

// Asset (Equipamento)
export const Asset = sequelize.define('Asset', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id'
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'assigned_to'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'user_id'
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'client_id'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  serialNumber: {
    type: DataTypes.STRING(255),
    field: 'serial_number'
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'assigned_to'
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'active'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  collectionMethod: {
    type: DataTypes.STRING(50),
    field: 'collection_method'
  }
}, {
  tableName: 'assets',
  timestamps: true,
  underscored: true
});

// Software Instalado
export const SoftwareInstalled = sequelize.define('SoftwareInstalled', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  assetId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'asset_id'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  version: {
    type: DataTypes.STRING(100)
  },
  vendor: {
    type: DataTypes.STRING(255)
  },
  installDate: {
    type: DataTypes.DATEONLY,
    field: 'install_date'
  },
  installLocation: {
    type: DataTypes.STRING(500),
    field: 'install_location'
  }
}, {
  tableName: 'software_installed',
  timestamps: true,
  underscored: true
});

// Licença de Software
export const SoftwareLicense = sequelize.define('SoftwareLicense', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id'
  },
  softwareName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'software_name'
  },
  licenseKey: {
    type: DataTypes.STRING(500),
    field: 'license_key'
  },
  licenseType: {
    type: DataTypes.STRING(50),
    field: 'license_type'
  },
  quantity: {
    type: DataTypes.INTEGER
  },
  purchaseDate: {
    type: DataTypes.DATEONLY,
    field: 'purchase_date'
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    field: 'expiry_date'
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2)
  },
  vendor: {
    type: DataTypes.STRING(255)
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'software_licenses',
  timestamps: true,
  underscored: true
});

// Asset License (relacionamento)
export const AssetLicense = sequelize.define('AssetLicense', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  assetId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'asset_id'
  },
  licenseId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'license_id'
  },
  assignedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'assigned_at'
  }
}, {
  tableName: 'asset_licenses',
  timestamps: false
});

// Associações
Asset.hasMany(SoftwareInstalled, {
  foreignKey: 'assetId',
  as: 'software'
});

SoftwareInstalled.belongsTo(Asset, {
  foreignKey: 'assetId',
  as: 'asset'
});

Asset.belongsToMany(SoftwareLicense, {
  through: AssetLicense,
  foreignKey: 'assetId',
  otherKey: 'licenseId',
  as: 'licenses'
});

SoftwareLicense.belongsToMany(Asset, {
  through: AssetLicense,
  foreignKey: 'licenseId',
  otherKey: 'assetId',
  as: 'assets'
});

export default { Asset, SoftwareInstalled, SoftwareLicense, AssetLicense };
