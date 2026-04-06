import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const SavedSearch = sequelize.define('SavedSearch', {
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
  query: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Query de busca'
  },
  filters: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Filtros aplicados'
  },
  entityTypes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Tipos de entidade para buscar'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isFavorite: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  executionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastExecutedAt: {
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
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'saved_searches',
  timestamps: true,
  underscored: true
});

export default SavedSearch;
