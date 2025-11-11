import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const Ticket = sequelize.define('Ticket', {
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
  ticketNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [5, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  status: {
    type: DataTypes.ENUM('novo', 'aguardando_aprovacao', 'em_progresso', 'aguardando_cliente', 'resolvido', 'fechado'),
    allowNull: false,
    defaultValue: 'novo'
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'media',
    comment: 'Prioridade definida pelo cliente (string legada)'
  },
  priorityId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'priorities',
      key: 'id'
    },
    comment: 'Referência à prioridade configurável da organização'
  },
  internalPriority: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Prioridade interna definida pela organização (pode ser diferente da prioridade do cliente)'
  },
  resolutionStatus: {
    type: DataTypes.ENUM(
      'pendente',           // Aguardando ação
      'em_analise',         // Sendo analisado
      'aguardando_terceiro',// Aguardando fornecedor/terceiro
      'solucao_proposta',   // Solução proposta ao cliente
      'resolvido',          // Problema resolvido
      'nao_resolvido',      // Não foi possível resolver
      'workaround'          // Solução temporária aplicada
    ),
    allowNull: true,
    comment: 'Estado específico da resolução do ticket'
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'suporte',
    comment: 'Nome do tipo (string legada)'
  },
  typeId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'types',
      key: 'id'
    },
    comment: 'Referência ao tipo configurável da organização'
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    },
    comment: 'LEGADO - Categoria funcional do ticket (manter por compatibilidade)'
  },
  // Campos do Catálogo de Serviços
  catalogCategoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'catalog_categories',
      key: 'id'
    },
    comment: 'Categoria do catálogo (hierarquia visual: TI, RH, Facilities)'
  },
  catalogItemId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'catalog_items',
      key: 'id'
    },
    comment: 'Item/Serviço do catálogo selecionado'
  },
  directionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'directions',
      key: 'id'
    }
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id'
    }
  },
  sectionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'sections',
      key: 'id'
    }
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'clients',
      key: 'id'
    },
    comment: 'Empresa cliente - preenchido quando requester é um client_user'
  },
  // CAMPOS LEGADOS (manter por compatibilidade)
  requesterId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'LEGADO - usar requester_*_id polimórfico'
  },
  // CAMPOS POLIMÓRFICOS PARA REQUESTER
  requesterType: {
    type: DataTypes.ENUM('provider', 'organization', 'client'),
    allowNull: true,
    defaultValue: 'client',
    comment: 'Tipo do requester: provider = users, organization = organization_users, client = client_users'
  },
  requesterUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'FK para users (provider SaaS)'
  },
  requesterOrgUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'organization_users',
      key: 'id'
    },
    comment: 'FK para organization_users (tenant staff)'
  },
  requesterClientUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'client_users',
      key: 'id'
    },
    comment: 'FK para client_users (empresa cliente)'
  },
  // ASSIGNEE - sempre organization_user (quem resolve)
  assigneeId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'organization_users',
      key: 'id'
    },
    comment: 'Sempre um organization_user (técnico/agent)'
  },
  source: {
    type: DataTypes.ENUM('portal', 'email', 'chat', 'whatsapp', 'telefone'),
    defaultValue: 'portal'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  slaBreached: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  customFields: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'tickets',
  indexes: [
    { fields: ['ticket_number'], unique: true },
    { fields: ['organization_id'] },
    { fields: ['client_id'] },
    { fields: ['requester_type'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['requester_id'] }, // Legado
    { fields: ['requester_user_id'] },
    { fields: ['requester_org_user_id'] },
    { fields: ['requester_client_user_id'] },
    { fields: ['assignee_id'] },
    { fields: ['department_id'] },
    { fields: ['created_at'] },
    { fields: ['organization_id', 'client_id'] }
  ],
  hooks: {
    beforeCreate: async (ticket) => {
      // Gerar número do ticket: ORG-YYYYMMDD-XXXX
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      const random = Math.floor(1000 + Math.random() * 9000);
      ticket.ticketNumber = `TKT-${dateStr}-${random}`;
    }
  }
});

// MÉTODOS HELPER PARA ACESSO POLIMÓRFICO
Ticket.prototype.getRequester = function() {
  switch(this.requesterType) {
    case 'provider':
      return this.requesterUser;
    case 'organization':
      return this.requesterOrgUser;
    case 'client':
      return this.requesterClientUser;
    default:
      return null;
  }
};

Ticket.prototype.getRequesterInfo = function() {
  const requester = this.getRequester();
  return requester ? {
    id: requester.id,
    name: requester.name,
    email: requester.email,
    type: this.requesterType
  } : null;
};

// Método para definir requester polimórfico
Ticket.setRequester = function(ticketData, userId, userType) {
  ticketData.requesterType = userType;
  
  switch(userType) {
    case 'provider':
      ticketData.requesterUserId = userId;
      ticketData.requesterOrgUserId = null;
      ticketData.requesterClientUserId = null;
      break;
    case 'organization':
      ticketData.requesterUserId = null;
      ticketData.requesterOrgUserId = userId;
      ticketData.requesterClientUserId = null;
      break;
    case 'client':
      ticketData.requesterUserId = null;
      ticketData.requesterOrgUserId = null;
      ticketData.requesterClientUserId = userId;
      break;
  }
  
  return ticketData;
};

export default Ticket;
