import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Workflow = sequelize.define('Workflow', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM(
      'ticket_created',
      'ticket_updated',
      'ticket_assigned',
      'ticket_status_changed',
      'comment_added',
      'time_based',
      'sla_breach',
      'custom'
    ),
    defaultValue: 'custom'
  },
  trigger: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Condições de disparo do workflow'
    /*
    Exemplo:
    {
      event: 'ticket_created',
      conditions: {
        priority: ['alta', 'urgente'],
        category: 'categoryId',
        requesterType: 'cliente-org',
        contains: ['palavras', 'chave']
      }
    }
    */
  },
  steps: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Passos do workflow'
    /*
    Exemplo:
    [
      {
        id: 'step1',
        name: 'Verificar SLA',
        type: 'condition',
        condition: { field: 'priority', operator: '=', value: 'alta' },
        onTrue: 'step2',
        onFalse: 'step3'
      },
      {
        id: 'step2',
        name: 'Atribuir ao especialista',
        type: 'action',
        action: { type: 'assign', value: 'userId' },
        next: 'step4'
      },
      {
        id: 'step3',
        name: 'Atribuir ao time geral',
        type: 'action',
        action: { type: 'assign_to_team', value: 'departmentId' },
        next: 'step4'
      },
      {
        id: 'step4',
        name: 'Enviar notificação',
        type: 'action',
        action: { type: 'send_email', template: 'templateId' },
        next: null
      }
    ]
    */
  },
  variables: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Variáveis do workflow'
  },
  schedule: {
    type: DataTypes.JSON,
    defaultValue: null,
    comment: 'Agendamento para workflows time-based'
    /*
    Exemplo:
    {
      type: 'cron',
      expression: '0 9 * * MON-FRI',
      timezone: 'America/Sao_Paulo'
    }
    */
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se é um workflow do sistema (não pode ser editado)'
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
  errorCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastError: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {
      viewable: [],
      editable: []
    }
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    comment: 'Ordem de execução quando múltiplos workflows são disparados'
  },
  maxExecutions: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Número máximo de execuções (null = ilimitado)'
  },
  cooldownMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Tempo mínimo entre execuções para o mesmo objeto'
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
  tableName: 'workflows',
  timestamps: true,
  underscored: true
});

export default Workflow;
