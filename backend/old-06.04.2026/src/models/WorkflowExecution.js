import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const WorkflowExecution = sequelize.define('WorkflowExecution', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  workflowId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Workflows',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'running',
      'completed',
      'failed',
      'cancelled',
      'paused'
    ),
    defaultValue: 'pending'
  },
  triggerType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Tipo de evento que disparou o workflow'
  },
  triggerData: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Dados do evento que disparou o workflow'
  },
  targetType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Tipo do objeto alvo (ticket, user, etc)'
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID do objeto alvo'
  },
  currentStep: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID do passo atual'
  },
  variables: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Variáveis da execução'
  },
  steps: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Histórico de passos executados'
    /*
    Exemplo:
    [
      {
        stepId: 'step1',
        stepName: 'Verificar SLA',
        startedAt: '2024-01-01T10:00:00Z',
        completedAt: '2024-01-01T10:00:01Z',
        status: 'completed',
        result: { condition: true },
        error: null
      }
    ]
    */
  },
  result: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Resultado final da execução'
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mensagem de erro se a execução falhou'
  },
  errorDetails: {
    type: DataTypes.JSON,
    defaultValue: null,
    comment: 'Detalhes do erro para debug'
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duração em milissegundos'
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxRetries: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  nextRetryAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  executedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Usuário que disparou o workflow (null se automático)'
  }
}, {
  tableName: 'workflow_executions',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['workflow_id', 'status']
    },
    {
      fields: ['target_type', 'target_id']
    },
    {
      fields: ['started_at']
    },
    {
      fields: ['organization_id']
    }
  ]
});

export default WorkflowExecution;
