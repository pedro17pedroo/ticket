import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const Priority = sequelize.define('Priority', {
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
    },
    onDelete: 'CASCADE',
    field: 'organization_id'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  color: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '#6B7280'
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'priorities',
  timestamps: true,
  underscored: true
});

export default Priority;
