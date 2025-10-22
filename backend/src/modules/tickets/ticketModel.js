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
    type: DataTypes.ENUM('novo', 'em_progresso', 'aguardando_cliente', 'resolvido', 'fechado'),
    allowNull: false,
    defaultValue: 'novo'
  },
  priority: {
    type: DataTypes.ENUM('baixa', 'media', 'alta', 'urgente'),
    allowNull: false,
    defaultValue: 'media'
  },
  type: {
    type: DataTypes.ENUM('suporte', 'implementacao', 'problema', 'duvida'),
    allowNull: false,
    defaultValue: 'suporte'
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
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
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assigneeId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
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
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['requester_id'] },
    { fields: ['assignee_id'] },
    { fields: ['department_id'] },
    { fields: ['created_at'] }
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

export default Ticket;
