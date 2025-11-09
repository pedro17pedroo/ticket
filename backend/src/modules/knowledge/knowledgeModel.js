import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const KnowledgeArticle = sequelize.define('KnowledgeArticle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id'
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'category_id'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [5, 255]
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  excerpt: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: true
  },
  authorId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'author_id'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'view_count'
  },
  helpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'helpful_count'
  },
  notHelpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'not_helpful_count'
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_featured'
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_published'
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'published_at'
  }
}, {
  tableName: 'knowledge_articles',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['organization_id'] },
    { fields: ['category_id'] },
    { fields: ['is_published'] }
  ]
});

export default KnowledgeArticle;
