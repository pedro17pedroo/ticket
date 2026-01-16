import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

/**
 * CatalogAccessAuditLog Model
 * Stores audit trail for catalog access permission changes
 * 
 * Entity types:
 * - 'client': Changes to client company permissions
 * - 'client_user': Changes to individual user permissions
 * 
 * Actions:
 * - 'create': New permission record created
 * - 'update': Existing permission record modified
 * - 'delete': Permission record deleted
 */
const CatalogAccessAuditLog = sequelize.define('CatalogAccessAuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
    comment: 'Tenant organization where the change occurred'
  },
  entityType: {
    type: DataTypes.ENUM('client', 'client_user'),
    allowNull: false,
    field: 'entity_type',
    comment: 'Type of entity: client or client_user'
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'entity_id',
    comment: 'ID of the client or client_user'
  },
  action: {
    type: DataTypes.ENUM('create', 'update', 'delete'),
    allowNull: false,
    comment: 'Action performed: create, update, delete'
  },
  previousState: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'previous_state',
    comment: 'JSON snapshot of permissions before change'
  },
  newState: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'new_state',
    comment: 'JSON snapshot of permissions after change'
  },
  changedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'changed_by',
    comment: 'User ID who made the change'
  },
  changedByName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'changed_by_name',
    comment: 'Name of user who made the change'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'ip_address',
    comment: 'IP address from which the change was made'
  }
}, {
  tableName: 'catalog_access_audit_logs',
  timestamps: true,
  updatedAt: false, // Audit logs are immutable, no updates
  underscored: true,
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['entity_type', 'entity_id'] },
    { fields: ['created_at'] },
    { fields: ['changed_by'] }
  ]
});

export default CatalogAccessAuditLog;
