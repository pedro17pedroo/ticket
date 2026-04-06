import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Report = sequelize.define('Report', {
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
      'tickets',
      'sla',
      'agents',
      'customers',
      'categories',
      'performance',
      'satisfaction',
      'custom'
    ),
    defaultValue: 'custom'
  },
  query: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Configuração da query'
  },
  columns: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Colunas a exibir'
  },
  filters: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Filtros do relatório'
  },
  groupBy: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Campos para agrupar'
  },
  orderBy: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Ordenação dos resultados'
  },
  schedule: {
    type: DataTypes.JSON,
    defaultValue: null,
    comment: 'Agendamento de envio'
    /*
    {
      enabled: true,
      frequency: 'daily|weekly|monthly',
      time: '09:00',
      dayOfWeek: 1, // 0-6
      dayOfMonth: 1, // 1-31
      recipients: ['email@example.com']
    }
    */
  },
  format: {
    type: DataTypes.ENUM('table', 'chart', 'pivot', 'list'),
    defaultValue: 'table'
  },
  chartConfig: {
    type: DataTypes.JSON,
    defaultValue: null,
    comment: 'Configuração de gráfico se format=chart'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isFavorite: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  executionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastExecutedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastExecutionTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tempo de execução em ms'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
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
  tableName: 'reports',
  timestamps: true,
  underscored: true
});

export default Report;
