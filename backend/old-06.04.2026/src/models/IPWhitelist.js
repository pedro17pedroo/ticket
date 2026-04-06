import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const IPWhitelist = sequelize.define('IPWhitelist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'IP ou range (CIDR)'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  createdById: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'ip_whitelists',
  timestamps: true,
  underscored: true
});

export default IPWhitelist;
