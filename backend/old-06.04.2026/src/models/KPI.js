import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const KPI = sequelize.define('KPI', {
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
  metric: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nome da métrica a medir'
  },
  formula: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Fórmula de cálculo ou query'
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Unidade de medida (%, h, tickets, etc)'
  },
  target: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Meta do KPI'
  },
  threshold: {
    type: DataTypes.JSON,
    defaultValue: {
      excellent: 95,
      good: 80,
      acceptable: 60,
      poor: 40
    },
    comment: 'Limites para classificação'
  },
  currentValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  previousValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  trend: {
    type: DataTypes.ENUM('up', 'down', 'stable'),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('excellent', 'good', 'acceptable', 'poor', 'critical'),
    allowNull: true
  },
  period: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
    defaultValue: 'monthly'
  },
  category: {
    type: DataTypes.ENUM(
      'performance',
      'quality',
      'efficiency',
      'satisfaction',
      'sla',
      'finance'
    ),
    defaultValue: 'performance'
  },
  autoCalculate: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  calculationSchedule: {
    type: DataTypes.STRING,
    defaultValue: '0 0 * * *',
    comment: 'Cron expression para cálculo automático'
  },
  history: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Histórico de valores (últimos 12 períodos)'
  },
  lastCalculatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dashboardWidgetConfig: {
    type: DataTypes.JSON,
    defaultValue: null,
    comment: 'Config para exibição em dashboard'
  },
  alerts: {
    type: DataTypes.JSON,
    defaultValue: {
      enabled: false,
      thresholds: [],
      recipients: []
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
  tableName: 'kpis',
  timestamps: true,
  underscored: true
});

export default KPI;
