import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const EmailTemplate = sequelize.define('EmailTemplate', {
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
  type: {
    type: DataTypes.ENUM(
      'auto_response',
      'ticket_created',
      'ticket_updated',
      'ticket_closed',
      'ticket_reopened',
      'sla_warning',
      'sla_violation',
      'password_reset',
      'welcome',
      'custom'
    ),
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  variables: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Lista de variáveis disponíveis no template'
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  }
}, {
  tableName: 'email_templates',
  timestamps: true
});

export default EmailTemplate;
