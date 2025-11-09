import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

// Categoria do Catálogo
export const CatalogCategory = sequelize.define('CatalogCategory', {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(50),
    defaultValue: 'Folder'
  },
  color: {
    type: DataTypes.STRING(20),
    defaultValue: '#3B82F6'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'catalog_categories',
  timestamps: true,
  underscored: true
});

// Item do Catálogo (Serviço)
export const CatalogItem = sequelize.define('CatalogItem', {
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
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'category_id'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  shortDescription: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'short_description'
  },
  fullDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'full_description'
  },
  icon: {
    type: DataTypes.STRING(50),
    defaultValue: 'Box'
  },
  defaultPriority: {
    type: DataTypes.STRING(20),
    defaultValue: 'media',
    field: 'default_priority'
  },
  requiresApproval: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'requires_approval'
  },
  estimatedCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'estimated_cost'
  },
  costCurrency: {
    type: DataTypes.STRING(3),
    defaultValue: 'EUR',
    field: 'cost_currency'
  },
  estimatedDeliveryTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'estimated_delivery_time'
  },
  customFields: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'custom_fields'
  },
  requestCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'request_count'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_public'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'catalog_items',
  timestamps: true,
  underscored: true
});

// Service Request
export const ServiceRequest = sequelize.define('ServiceRequest', {
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
  catalogItemId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'catalog_item_id'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  },
  ticketId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'ticket_id'
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending'
  },
  formData: {
    type: DataTypes.JSON,
    defaultValue: {},
    field: 'form_data'
  },
  requestedForUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'requested_for_user_id'
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'approved_at'
  },
  approvedById: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'approved_by_id'
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'rejected_at'
  },
  rejectedById: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'rejected_by_id'
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'rejection_reason'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'service_requests',
  timestamps: true,
  underscored: true
});

// Associações
CatalogItem.belongsTo(CatalogCategory, {
  foreignKey: 'categoryId',
  as: 'category'
});

CatalogCategory.hasMany(CatalogItem, {
  foreignKey: 'categoryId',
  as: 'items'
});

ServiceRequest.belongsTo(CatalogItem, {
  foreignKey: 'catalogItemId',
  as: 'catalogItem'
});

export default { CatalogCategory, CatalogItem, ServiceRequest };
