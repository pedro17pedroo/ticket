import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const SLA = sequelize.define('SLA', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('baixa', 'media', 'alta', 'urgente'),
    allowNull: false
  },
  responseTimeMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Tempo de primeira resposta em minutos'
  },
  resolutionTimeMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Tempo de resolução em minutos'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'slas',
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['priority'] },
    { fields: ['is_active'] }
  ]
});

export default SLA;
