import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const Attachment = sequelize.define('Attachment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ticketId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'ticket_id',
    references: {
      model: 'tickets',
      key: 'id'
    }
  },
  commentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'comment_id',
    references: {
      model: 'comments',
      key: 'id'
    }
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'original_name'
  },
  mimetype: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'mime_type'
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  uploadedById: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'uploaded_by_id'
  },
  uploadedByType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'uploaded_by_type',
    comment: 'provider, organization, client'
  },
  uploadedByUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'uploaded_by_user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  uploadedByOrgUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'uploaded_by_org_user_id',
    references: {
      model: 'organization_users',
      key: 'id'
    }
  },
  uploadedByClientUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'uploaded_by_client_user_id',
    references: {
      model: 'client_users',
      key: 'id'
    }
  }
}, {
  tableName: 'attachments',
  timestamps: true,
  underscored: true
});

export default Attachment;
