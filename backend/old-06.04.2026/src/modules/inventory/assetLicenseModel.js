import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const AssetLicense = sequelize.define('AssetLicense', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  assetId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'assets',
      key: 'id'
    }
  },
  licenseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'licenses',
      key: 'id'
    }
  },
  assignedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  unassignedDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'asset_licenses',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['asset_id'] },
    { fields: ['license_id'] },
    { fields: ['is_active'] },
    { fields: ['asset_id', 'license_id'], unique: true }
  ]
});

export default AssetLicense;
