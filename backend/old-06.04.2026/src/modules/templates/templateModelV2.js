import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

export const Template = sequelize.define('Template', {
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
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.ENUM('ticket', 'comment', 'email'),
    defaultValue: 'ticket'
  },
  subject: {
    type: DataTypes.STRING(255)
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  categoryId: {
    type: DataTypes.UUID,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  priorityId: {
    type: DataTypes.UUID,
    references: {
      model: 'priorities',
      key: 'id'
    }
  },
  typeId: {
    type: DataTypes.UUID,
    references: {
      model: 'types',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdBy: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'templates',
  timestamps: true,
  underscored: true
});

export default Template;
