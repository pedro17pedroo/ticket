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
    references: {
      model: 'users',
      key: 'id'
    }
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
    type: DataTypes.STRING(50), // nome do ícone lucide
    defaultValue: 'FolderOpen'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'catalog_categories',
  timestamps: true
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
    references: {
      model: 'users',
      key: 'id'
    }
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'catalog_categories',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  shortDescription: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  fullDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(50),
    defaultValue: 'Box'
  },
  // SLA específico para este serviço
  slaId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'slas',
      key: 'id'
    }
  },
  // Categoria de ticket padrão
  defaultTicketCategoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  // Prioridade padrão
  defaultPriority: {
    type: DataTypes.ENUM('baixa', 'media', 'alta', 'critica'),
    defaultValue: 'media'
  },
  // Aprovação necessária
  requiresApproval: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Aprovador padrão
  defaultApproverId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Departamento responsável
  assignedDepartmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id'
    }
  },
  // Custo estimado (opcional)
  estimatedCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  costCurrency: {
    type: DataTypes.STRING(3),
    defaultValue: 'EUR'
  },
  // Tempo estimado de entrega (em horas)
  estimatedDeliveryTime: {
    type: DataTypes.INTEGER, // horas
    allowNull: true
  },
  // Formulário customizado (JSON)
  customFields: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array de campos personalizados do formulário'
  },
  // Popularidade
  requestCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Disponibilidade
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // visível para todos os clientes
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'catalog_items',
  timestamps: true
});

// Solicitação de Serviço (Service Request)
export const ServiceRequest = sequelize.define('ServiceRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  catalogItemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'catalog_items',
      key: 'id'
    }
  },
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  ticketId: {
    type: DataTypes.UUID,
    allowNull: true, // criado após aprovação
    references: {
      model: 'tickets',
      key: 'id'
    }
  },
  // Dados do formulário preenchido
  formData: {
    type: DataTypes.JSON,
    allowNull: false
  },
  // Status da solicitação
  status: {
    type: DataTypes.ENUM('pending_approval', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending_approval'
  },
  // Aprovação
  approverId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approvalDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  approvalComments: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Custo aprovado (pode ser diferente do estimado)
  approvedCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'service_requests',
  timestamps: true
});

export default { CatalogCategory, CatalogItem, ServiceRequest };
