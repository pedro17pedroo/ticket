import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Service = sequelize.define('Service', {
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
  displayName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM(
      'core',
      'api',
      'database',
      'storage',
      'network',
      'authentication',
      'payment',
      'notification',
      'integration',
      'other'
    ),
    defaultValue: 'core'
  },
  status: {
    type: DataTypes.ENUM(
      'operational',
      'degraded_performance',
      'partial_outage',
      'major_outage',
      'under_maintenance'
    ),
    defaultValue: 'operational'
  },
  statusMessage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    comment: 'Lower number = higher priority in display'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  monitoringEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  healthCheckUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL para health check automático'
  },
  healthCheckInterval: {
    type: DataTypes.INTEGER,
    defaultValue: 60,
    comment: 'Intervalo em segundos entre health checks'
  },
  lastHealthCheck: {
    type: DataTypes.DATE,
    allowNull: true
  },
  responseTime: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Tempo de resposta em ms'
  },
  uptime: {
    type: DataTypes.FLOAT,
    defaultValue: 100,
    comment: 'Percentual de uptime'
  },
  uptimeHistory: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Histórico de uptime dos últimos 90 dias'
  },
  dependencies: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'IDs de serviços que este depende'
  },
  metrics: {
    type: DataTypes.JSON,
    defaultValue: {
      last24h: { uptime: 100, incidents: 0, responseTime: 0 },
      last7d: { uptime: 100, incidents: 0, responseTime: 0 },
      last30d: { uptime: 100, incidents: 0, responseTime: 0 },
      last90d: { uptime: 100, incidents: 0, responseTime: 0 }
    }
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  }
}, {
  tableName: 'services',
  timestamps: true,
  underscored: true
});

export default Service;
