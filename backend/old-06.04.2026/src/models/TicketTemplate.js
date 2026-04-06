import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const TicketTemplate = sequelize.define('TicketTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM(
      'response',      // Template de resposta
      'macro',         // Macro de ações
      'workflow',      // Template de workflow
      'email',         // Template de e-mail
      'ticket',        // Template de ticket completo
      'knowledge'      // Template de artigo de conhecimento
    ),
    defaultValue: 'response'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  trigger: {
    type: DataTypes.ENUM(
      'manual',        // Aplicado manualmente
      'automatic',     // Aplicado automaticamente
      'scheduled',     // Aplicado em horário específico
      'condition'      // Aplicado por condição
    ),
    defaultValue: 'manual'
  },
  triggerConditions: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Condições para aplicação automática'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Conteúdo do template (resposta, descrição, etc)'
  },
  variables: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Lista de variáveis disponíveis: {{ticket.number}}, {{user.name}}, etc'
  },
  actions: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Ações a executar (mudar status, atribuir, adicionar tag, etc)'
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Anexos padrão do template'
  },
  shortcuts: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Atalhos de teclado para acesso rápido'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se pode ser usado por todos os agentes'
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Contador de uso do template'
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Tags para organização e busca'
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {
      roles: [],       // Roles que podem usar
      users: [],       // Usuários específicos
      departments: []  // Departamentos
    }
  },
  quickAccess: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se aparece no menu de acesso rápido'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    comment: 'Ordem de exibição (menor = mais prioritário)'
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Departments',
      key: 'id'
    }
  },
  catalogCategoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'catalog_category_id',
    references: {
      model: 'catalog_categories',
      key: 'id'
    }
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'ticket_templates',
  timestamps: true,
  underscored: true
});

export default TicketTemplate;
