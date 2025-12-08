import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

export const ResponseTemplate = sequelize.define('ResponseTemplate', {
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
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('ticket', 'comment', 'email'),
    defaultValue: 'ticket'
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  priorityId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'priorities',
      key: 'id'
    }
  },
  typeId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'types',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true // Visível para todos da organização
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'templates',
  timestamps: true
});

export default ResponseTemplate;
