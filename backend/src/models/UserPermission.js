import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const UserPermission = sequelize.define('UserPermission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
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
    allowNull: false,
    comment: 'true = concede permissão adicional, false = nega permissão do role'
  },
  grantedBy: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Quem concedeu esta permissão'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data de expiração (null = permanente)'
  },
  reason: {
    type: DataTypes.TEXT,
    comment: 'Motivo para conceder/negar esta permissão'
  }
}, {
  tableName: 'user_permissions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['permissionId'] },
    { fields: ['userId', 'permissionId'], unique: true }
  ]
});

export default UserPermission;
