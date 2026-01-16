import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

/**
 * ClientUserCatalogAccess Model
 * Stores catalog access permissions for individual client users
 * 
 * Inheritance modes:
 * - 'inherit': Use client company's permissions
 * - 'override': Use user-specific permissions instead of client's
 * - 'extend': Add user-specific permissions to client's permissions
 */
const ClientUserCatalogAccess = sequelize.define('ClientUserCatalogAccess', {
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
  clientUserId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    field: 'client_user_id',
    references: {
      model: 'client_users',
      key: 'id'
    },
    comment: 'Client user this access rule applies to'
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'client_id',
    references: {
      model: 'clients',
      key: 'id'
    },
    comment: 'Parent client company for reference'
  },
  inheritanceMode: {
    type: DataTypes.ENUM('inherit', 'override', 'extend'),
    defaultValue: 'inherit',
    field: 'inheritance_mode',
    comment: 'How permissions are inherited: inherit, override, extend'
  },
  accessMode: {
    type: DataTypes.ENUM('all', 'selected', 'none'),
    defaultValue: 'all',
    field: 'access_mode',
    comment: 'Access mode when inheritance_mode is override: all, selected, none'
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
  tableName: 'client_user_catalog_access',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['client_id'] },
    { fields: ['client_user_id'], unique: true }
  ]
});

export default ClientUserCatalogAccess;
