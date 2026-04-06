import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  organizationId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'create', 'update', 'delete',
      'login', 'logout',
      'ticket_created', 'ticket_updated', 'ticket_closed',
      'user_created', 'user_updated', 'user_deleted',
      'settings_changed',
      'export_data',
      'hours_added', 'hours_consumed',
      'approve', 'reject'
    ]
  },
  entityType: {
    type: String,
    required: true,
    enum: ['ticket', 'user', 'organization', 'direction', 'department', 'section', 'category', 'sla', 'priority', 'type', 'knowledge', 'hours', 'settings', 'template', 'project', 'client', 'catalog']
  },
  entityId: {
    type: String,
    index: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    ip: String,
    userAgent: String,
    location: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  collection: 'audit_logs',
  timeseries: {
    timeField: 'timestamp',
    metaField: 'metadata',
    granularity: 'hours'
  }
});

// Índices compostos para queries frequentes
auditLogSchema.index({ organizationId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
