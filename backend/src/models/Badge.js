import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Badge = sequelize.define('Badge', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL ou nome do ícone'
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#4F46E5'
  },
  category: {
    type: DataTypes.ENUM(
      'productivity',
      'quality',
      'speed',
      'collaboration',
      'leadership',
      'milestone',
      'special'
    ),
    defaultValue: 'productivity'
  },
  criteria: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Critérios para ganhar o badge'
    /*
    {
      type: 'tickets_resolved',
      threshold: 100,
      period: 'all_time' | 'monthly' | 'weekly'
    }
    */
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    comment: 'Pontos ganhos ao conquistar o badge'
  },
  rarity: {
    type: DataTypes.ENUM('common', 'uncommon', 'rare', 'epic', 'legendary'),
    defaultValue: 'common'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  timesAwarded: {
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
  tableName: 'badges',
  timestamps: true,
  underscored: true
});

export default Badge;
