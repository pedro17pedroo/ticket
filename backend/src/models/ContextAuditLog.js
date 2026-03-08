import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ContextAuditLog = sequelize.define('ContextAuditLog', {
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
  userEmail: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'user_email',
    comment: 'Email do usuário para auditoria'
  },
  userType: {
    type: DataTypes.ENUM('provider', 'organization', 'client'),
    allowNull: false,
    field: 'user_type',
    comment: 'Tipo de usuário: provider, organization ou client'
  },
  action: {
    type: DataTypes.ENUM('login', 'context_switch', 'logout'),
    allowNull: false,
    comment: 'Ação realizada: login, context_switch ou logout'
  },
  fromContextId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'from_context_id',
    comment: 'ID do contexto de origem (null para login)'
  },
  fromContextType: {
    type: DataTypes.ENUM('organization', 'client'),
    allowNull: true,
    field: 'from_context_type',
    comment: 'Tipo do contexto de origem (null para login)'
  },
  toContextId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'to_context_id',
    comment: 'ID do contexto de destino'
  },
  toContextType: {
    type: DataTypes.ENUM('organization', 'client'),
    allowNull: false,
    field: 'to_context_type',
    comment: 'Tipo do contexto de destino'
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
  success: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica se a ação foi bem-sucedida'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message',
    comment: 'Mensagem de erro caso a ação tenha falhado'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'context_audit_logs',
  timestamps: false, // Only createdAt, no updatedAt
  underscored: true,
  indexes: [
    {
      fields: ['user_id'],
      name: 'idx_context_audit_logs_user_id'
    },
    {
      fields: ['user_email'],
      name: 'idx_context_audit_logs_user_email'
    },
    {
      fields: ['action'],
      name: 'idx_context_audit_logs_action'
    },
    {
      fields: ['created_at'],
      name: 'idx_context_audit_logs_created_at'
    },
    {
      fields: ['user_id', 'created_at'],
      name: 'idx_context_audit_logs_user_created'
    },
    {
      fields: ['user_email', 'action'],
      name: 'idx_context_audit_logs_email_action'
    }
  ]
});

// Método estático para criar log de login
ContextAuditLog.logLogin = async function(userId, userEmail, userType, contextId, contextType, ipAddress, userAgent, success = true, errorMessage = null) {
  return await this.create({
    userId,
    userEmail,
    userType,
    action: 'login',
    fromContextId: null,
    fromContextType: null,
    toContextId: contextId,
    toContextType: contextType,
    ipAddress,
    userAgent,
    success,
    errorMessage
  });
};

// Método estático para criar log de troca de contexto
ContextAuditLog.logContextSwitch = async function(userId, userEmail, userType, fromContextId, fromContextType, toContextId, toContextType, ipAddress, userAgent, success = true, errorMessage = null) {
  return await this.create({
    userId,
    userEmail,
    userType,
    action: 'context_switch',
    fromContextId,
    fromContextType,
    toContextId,
    toContextType,
    ipAddress,
    userAgent,
    success,
    errorMessage
  });
};

// Método estático para criar log de logout
ContextAuditLog.logLogout = async function(userId, userEmail, userType, contextId, contextType, ipAddress, userAgent, success = true, errorMessage = null) {
  return await this.create({
    userId,
    userEmail,
    userType,
    action: 'logout',
    fromContextId: contextId,
    fromContextType: contextType,
    toContextId: contextId,
    toContextType: contextType,
    ipAddress,
    userAgent,
    success,
    errorMessage
  });
};

export default ContextAuditLog;
