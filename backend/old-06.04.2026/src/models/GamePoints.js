import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const GamePoints = sequelize.define('GamePoints', {
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
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  totalPointsEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total de pontos ganhos (histórico)'
  },
  currentStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Dias consecutivos de atividade'
  },
  longestStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastActivityDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  statistics: {
    type: DataTypes.JSON,
    defaultValue: {
      ticketsResolved: 0,
      commentsPosted: 0,
      articlesCreated: 0,
      badgesEarned: 0,
      avgResponseTime: 0
    }
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
  tableName: 'game_points',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id', 'organization_id'],
      unique: true
    }
  ]
});

export default GamePoints;
