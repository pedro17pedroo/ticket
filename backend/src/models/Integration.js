import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Integration = sequelize.define('Integration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM(
      'slack',
      'teams',
      'google_workspace',
      'microsoft_365',
      'salesforce',
      'jira',
      'github',
      'gitlab',
      'zapier',
      'make',
      'custom'
    ),
    allowNull: false
  },
  config: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    comment: 'Configurações específicas da integração'
    /*
    {
      slack: {
        webhookUrl: 'https://...',
        channel: '#tickets',
        botToken: 'xoxb-...'
      },
      teams: {
        webhookUrl: 'https://...'
      },
      google_workspace: {
        clientId: '...',
        clientSecret: '...',
        refreshToken: '...'
      }
    }
    */
  },
  credentials: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Credenciais sensíveis (encriptadas)'
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Configurações adicionais'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastSyncAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  syncStatus: {
    type: DataTypes.ENUM('idle', 'syncing', 'error'),
    defaultValue: 'idle'
  },
  errorMessage: {
    type: DataTypes.TEXT,
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
  createdById: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'integrations',
  timestamps: true,
  underscored: true
});

export default Integration;
