import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

/**
 * ClientCatalogAccess Model
 * Stores catalog access permissions for client companies
 * 
 * Access modes:
 * - 'all': Full access to all public catalog items (minus denied)
 * - 'selected': Only specific items/categories are accessible
 * - 'none': No catalog access
 */
const ClientCatalogAccess = sequelize.define('ClientCatalogAccess', {
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
    comment: 'Tenant organization that owns this access rule'
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    field: 'client_id',
    references: {
      model: 'clients',
      key: 'id'
    },
    comment: 'Client company this access rule applies to'
  },
  accessMode: {
    type: DataTypes.ENUM('all', 'selected', 'none'),
    defaultValue: 'all',
    field: 'access_mode',
    comment: 'Access mode: all (full access), selected (specific items), none (no access)'
  },
  allowedCategories: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    field: 'allowed_categories',
    comment: 'Array of allowed category UUIDs (whitelist)'
  },
  allowedItems: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    field: 'allowed_items',
    comment: 'Array of allowed item UUIDs (whitelist)'
  },
  deniedCategories: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    field: 'denied_categories',
    comment: 'Array of denied category UUIDs (blacklist)'
  },
  deniedItems: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    field: 'denied_items',
    comment: 'Array of denied item UUIDs (blacklist)'
  },
  modifiedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'modified_by',
    references: {
      model: 'organization_users',
      key: 'id'
    },
    comment: 'Organization user who last modified this rule'
  }
}, {
  tableName: 'client_catalog_access',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['client_id'], unique: true }
  ]
});

export default ClientCatalogAccess;
