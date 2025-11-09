import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const RemoteAccess = sequelize.define('RemoteAccess', {
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
  ticketId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'ticket_id'
  },
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'requester_id'
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'client_id'
  },
  assetId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'asset_id'
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'expired', 'active', 'ended'),
    allowNull: false,
    defaultValue: 'pending'
  },
  accessToken: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    field: 'access_token'
  },
  sessionData: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'session_data'
  },
  requestedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'requested_at'
  },
  respondedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'responded_at'
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'started_at'
  },
  endedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'ended_at'
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'rejection_reason'
  },
  connectionType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Tipo de conexão: webrtc, anydesk, teamviewer, vnc'
  },
  connectionId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID da sessão de conexão'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data de expiração da solicitação'
  },
  durationSeconds: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duração total da sessão em segundos'
  },
  clientIp: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'IP do cliente para auditoria'
  },
  requesterIp: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'IP do solicitante para auditoria'
  },
  auditLog: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Log de auditoria de ações'
  },
  chatMessages: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Mensagens de chat durante a sessão'
  }
}, {
  sequelize,
  modelName: 'RemoteAccess',
  tableName: 'remote_accesses',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default RemoteAccess;
