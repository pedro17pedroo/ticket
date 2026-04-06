import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const SearchIndex = sequelize.define('SearchIndex', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Tipo da entidade (ticket, user, article, etc)'
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID da entidade'
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Metadados adicionais para busca'
  },
  searchVector: {
    type: DataTypes.TSVECTOR,
    allowNull: true,
    comment: 'Vetor de busca para full-text search (PostgreSQL)'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: true
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  departmentId: {
    type: DataTypes.INTEGER,
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
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'search_indexes',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['entity_type', 'entity_id'],
      unique: true
    },
    {
      fields: ['organization_id']
    },
    {
      type: 'GIN',
      fields: ['tags']
    },
    {
      type: 'GIN',
      fields: ['search_vector'],
      using: 'gin'
    }
  ]
});

export default SearchIndex;
