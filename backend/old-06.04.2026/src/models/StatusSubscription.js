import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const StatusSubscription = sequelize.define('StatusSubscription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM(
      'all',
      'incidents',
      'maintenances',
      'specific_services'
    ),
    defaultValue: 'all'
  },
  services: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'IDs dos serviços específicos para monitorar'
  },
  frequency: {
    type: DataTypes.ENUM(
      'immediate',
      'hourly',
      'daily',
      'weekly'
    ),
    defaultValue: 'immediate'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  unsubscribeToken: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      incidents: true,
      maintenances: true,
      updates: true,
      resolutions: true,
      postmortems: false
    }
  },
  lastNotificationAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notificationCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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
  tableName: 'status_subscriptions',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['email', 'organization_id']
    },
    {
      fields: ['unsubscribe_token']
    }
  ]
});

export default StatusSubscription;
