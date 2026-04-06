import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const UserBadge = sequelize.define('UserBadge', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  badgeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Badges',
      key: 'id'
    }
  },
  awardedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Motivo/contexto do recebimento'
  },
  isDisplayed: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Se o usuário escolheu exibir este badge'
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
  tableName: 'user_badges',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id', 'badge_id'],
      unique: true
    }
  ]
});

export default UserBadge;
