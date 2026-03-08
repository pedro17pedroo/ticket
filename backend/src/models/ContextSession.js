import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ContextSession = sequelize.define('ContextSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    comment: 'ID do usuário (organization_users.id ou client_users.id)'
  },
  userType: {
    type: DataTypes.ENUM('provider', 'organization', 'client'),
    allowNull: false,
    field: 'user_type',
    comment: 'Tipo de usuário: provider, organization ou client'
  },
  contextId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'context_id',
    comment: 'ID do contexto (organization_id ou client_id)'
  },
  contextType: {
    type: DataTypes.ENUM('organization', 'client'),
    allowNull: false,
    field: 'context_type',
    comment: 'Tipo de contexto: organization ou client'
  },
  sessionToken: {
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: true,
    field: 'session_token',
    comment: 'Token JWT da sessão'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'ip_address',
    comment: 'Endereço IP do cliente (suporta IPv4 e IPv6)'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent',
    comment: 'User agent do navegador/cliente'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    field: 'is_active',
    comment: 'Indica se a sessão está ativa'
  },
  lastActivityAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'last_activity_at',
    comment: 'Timestamp da última atividade na sessão'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at',
    comment: 'Timestamp de expiração da sessão'
  }
}, {
  tableName: 'context_sessions',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['session_token'],
      name: 'idx_context_sessions_token'
    },
    {
      fields: ['user_id'],
      name: 'idx_context_sessions_user_id'
    },
    {
      fields: ['is_active'],
      name: 'idx_context_sessions_is_active'
    },
    {
      fields: ['user_id', 'is_active'],
      name: 'idx_context_sessions_user_active'
    },
    {
      fields: ['expires_at'],
      name: 'idx_context_sessions_expires_at'
    }
  ]
});

// Método para verificar se a sessão está expirada
ContextSession.prototype.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Método para atualizar última atividade
ContextSession.prototype.updateActivity = async function() {
  this.lastActivityAt = new Date();
  await this.save();
};

// Método para invalidar sessão
ContextSession.prototype.invalidate = async function() {
  this.isActive = false;
  await this.save();
};

export default ContextSession;
