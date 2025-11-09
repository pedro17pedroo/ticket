import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Macro = sequelize.define('Macro', {
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
  icon: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Ícone para exibição visual'
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#4F46E5',
    comment: 'Cor para exibição visual'
  },
  actions: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Lista de ações a executar'
    /*
    Exemplos de ações:
    [
      { type: 'status', value: 'resolvido' },
      { type: 'priority', value: 'baixa' },
      { type: 'assign', value: 'userId' },
      { type: 'department', value: 'departmentId' },
      { type: 'addTag', value: 'tag-name' },
      { type: 'removeTag', value: 'tag-name' },
      { type: 'addComment', value: 'texto do comentário', isPublic: true },
      { type: 'sendEmail', template: 'templateId' },
      { type: 'createTask', title: 'título', assignTo: 'userId' },
      { type: 'setCustomField', field: 'fieldName', value: 'valor' },
      { type: 'webhook', url: 'https://...', method: 'POST' },
      { type: 'runScript', script: 'scriptId' },
      { type: 'scheduleFollowUp', days: 3 },
      { type: 'mergeTicket', targetTicketId: null },
      { type: 'linkKB', articleId: 'kbId' }
    ]
    */
  },
  conditions: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Condições para aplicar a macro'
    /*
    Exemplos de condições:
    {
      ticketStatus: ['novo', 'em_progresso'],
      priority: ['alta', 'urgente'],
      category: 'categoryId',
      department: 'departmentId',
      hasTag: 'tag-name',
      timeOpen: { operator: '>', value: 24, unit: 'hours' },
      requesterType: 'cliente-org',
      customField: { field: 'fieldName', operator: '=', value: 'valor' }
    }
    */
  },
  executionOrder: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Ordem de execução das ações'
  },
  shortcuts: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Atalhos de teclado'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  requireConfirmation: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Se requer confirmação antes de executar'
  },
  confirmationMessage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  executionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastExecutedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  executionHistory: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Histórico de execuções (últimas 100)'
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {
      roles: [],
      users: [],
      departments: []
    }
  },
  quickAccess: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 100
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
  tableName: 'macros',
  timestamps: true,
  underscored: true
});

export default Macro;
