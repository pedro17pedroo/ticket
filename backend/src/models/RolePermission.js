import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  roleId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  permissionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'permissions',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  granted: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'true = concedido, false = negado (para override)'
  }
}, {
  tableName: 'role_permissions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['roleId'] },
    { fields: ['permissionId'] },
    { fields: ['roleId', 'permissionId'], unique: true }
  ]
});

export default RolePermission;
