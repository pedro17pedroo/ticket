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
      model: 'organizations',
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
  color: {
    type: DataTypes.STRING(7), // Cor em hex, ex: #4A90E2
    defaultValue: '#6B7280'
  },
  // Hierarquia de categorias (subcategorias)
  parentCategoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'catalog_categories',
      key: 'id'
    },
    comment: 'ID da categoria pai (para subcategorias)'
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Nível hierárquico (1=raiz, 2=subcategoria, etc)'
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL da imagem/logo da categoria'
  },
  // Roteamento padrão para toda a categoria
  defaultDirectionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'directions',
      key: 'id'
    }
  },
  defaultDepartmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id'
    }
  },
  defaultSectionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'sections',
      key: 'id'
    },
    comment: 'Seção padrão para esta categoria'
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
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
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
    references: {
      model: 'organizations',
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
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL da imagem/logo do item'
  },
  // Tipo do item/serviço
  itemType: {
    type: DataTypes.ENUM('incident', 'service', 'support', 'request'),
    defaultValue: 'service',
    allowNull: false,
    comment: 'incident=Incidente, service=Serviço, support=Suporte, request=Requisição'
  },
  // Tipo de ticket configurável (referência à tabela types)
  typeId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'types',
      key: 'id'
    },
    comment: 'Tipo de ticket configurável pela organização'
  },
  // Prioridade configurável (referência à tabela priorities)
  priorityId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'priorities',
      key: 'id'
    },
    comment: 'Prioridade padrão configurável pela organização'
  },
  // Prioridade padrão (LEGADO - manter por compatibilidade)
  defaultPriority: {
    type: DataTypes.ENUM('baixa', 'media', 'alta', 'critica'),
    defaultValue: 'media',
    comment: 'LEGADO - usar priorityId'
  },
  // Auto-definir prioridade baseado no tipo
  autoAssignPriority: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se true, incidentes recebem prioridade alta/crítica automaticamente'
  },
  // Incidentes pulam aprovação
  skipApprovalForIncidents: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Incidentes pulam aprovação automática'
  },
  // Aprovação necessária
  requiresApproval: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // ===== ROTEAMENTO ORGANIZACIONAL =====
  // Direção responsável
  defaultDirectionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'directions',
      key: 'id'
    },
    comment: 'Direção responsável pelo item/serviço (OBRIGATÓRIO)'
  },
  // Departamento responsável
  defaultDepartmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id'
    },
    comment: 'Departamento responsável pelo item/serviço (Opcional)'
  },
  // Seção responsável
  defaultSectionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'sections',
      key: 'id'
    },
    comment: 'Secção responsável pelo item/serviço (Opcional)'
  },
  // SLA padrão para este item/serviço
  slaId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'slas',
      key: 'id'
    },
    comment: 'SLA padrão para tickets criados a partir deste item'
  },
  // Categoria padrão do ticket
  defaultTicketCategoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    },
    comment: 'Categoria padrão para o ticket criado'
  },
  // Aprovador padrão
  defaultApproverId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Usuário responsável pela aprovação'
  },
  // Departamento atribuído
  assignedDepartmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id'
    },
    comment: 'Departamento para atribuição automática'
  },
  // Workflow específico para incidentes
  incidentWorkflowId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'workflows',
      key: 'id'
    },
    comment: 'Workflow específico quando itemType é incident'
  },
  // ===== CUSTOS E TEMPO =====
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
  // Tags/Palavras-chave para busca
  keywords: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Palavras-chave para busca e categorização'
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
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

export default { CatalogCategory, CatalogItem };
