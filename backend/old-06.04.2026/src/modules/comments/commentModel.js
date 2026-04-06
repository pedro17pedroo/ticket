import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: true, // Temporariamente nullable para migração
    field: 'organization_id',
    comment: 'Organização do comentário (para isolamento multi-tenant)'
  },
  ticketId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tickets',
      key: 'id'
    }
  },
  // CAMPO LEGADO (manter por compatibilidade)
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'LEGADO - usar author_*_id polimórfico'
  },
  // CAMPOS POLIMÓRFICOS PARA AUTHOR
  authorType: {
    type: DataTypes.ENUM('provider', 'organization', 'client'),
    allowNull: true,
    comment: 'Tipo do author: provider = users, organization = organization_users, client = client_users'
  },
  authorUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'FK para users (provider SaaS)'
  },
  authorOrgUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'organization_users',
      key: 'id'
    },
    comment: 'FK para organization_users (tenant staff)'
  },
  authorClientUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'client_users',
      key: 'id'
    },
    comment: 'FK para client_users (empresa cliente)'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  isInternal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_internal'
  },
  emailMessageId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'email_message_id',
    comment: 'ID da mensagem de email (para threading)'
  }
}, {
  tableName: 'comments',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['ticket_id'] },
    { fields: ['user_id'] }, // Legado
    { fields: ['author_type'] },
    { fields: ['author_user_id'] },
    { fields: ['author_org_user_id'] },
    { fields: ['author_client_user_id'] },
    { fields: ['created_at'] },
    { fields: ['organization_id', 'ticket_id'] }
  ]
});

// MÉTODOS HELPER PARA ACESSO POLIMÓRFICO
Comment.prototype.getAuthor = function() {
  switch(this.authorType) {
    case 'provider':
      return this.authorUser;
    case 'organization':
      return this.authorOrgUser;
    case 'client':
      return this.authorClientUser;
    default:
      return null;
  }
};

Comment.prototype.getAuthorInfo = function() {
  const author = this.getAuthor();
  return author ? {
    id: author.id,
    name: author.name,
    email: author.email,
    type: this.authorType
  } : null;
};

// Método para definir author polimórfico
Comment.setAuthor = function(commentData, userId, userType) {
  commentData.authorType = userType;
  
  switch(userType) {
    case 'provider':
      commentData.authorUserId = userId;
      commentData.authorOrgUserId = null;
      commentData.authorClientUserId = null;
      break;
    case 'organization':
      commentData.authorUserId = null;
      commentData.authorOrgUserId = userId;
      commentData.authorClientUserId = null;
      break;
    case 'client':
      commentData.authorUserId = null;
      commentData.authorOrgUserId = null;
      commentData.authorClientUserId = userId;
      break;
  }
  
  return commentData;
};

export default Comment;
