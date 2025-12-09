import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Plan = sequelize.define('Plan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 50]
    },
    comment: 'Nome do plano (starter, professional, enterprise)'
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'display_name',
    comment: 'Nome de exibição (Iniciante, Profissional, Empresarial)'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrição detalhada do plano'
  },
  // Preços
  monthlyPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'monthly_price',
    comment: 'Preço mensal em euros'
  },
  yearlyPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'yearly_price',
    comment: 'Preço anual (com desconto)'
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'EUR',
    comment: 'Moeda do preço (EUR, USD, BRL, AOA, etc.)'
  },
  // Limites de recursos
  maxUsers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    field: 'max_users',
    comment: 'Máximo de usuários da organização'
  },
  maxClients: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50,
    field: 'max_clients',
    comment: 'Máximo de clientes'
  },
  maxTicketsPerMonth: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'max_tickets_per_month',
    comment: 'Limite de tickets por mês (null = ilimitado)'
  },
  maxStorageGB: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    field: 'max_storage_gb',
    comment: 'Limite de armazenamento em GB'
  },
  maxAttachmentSizeMB: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    field: 'max_attachment_size_mb',
    comment: 'Tamanho máximo de anexos em MB'
  },
  // Features disponíveis (flags booleanas)
  features: {
    type: DataTypes.JSONB,
    defaultValue: {
      basicTicketing: true,
      emailIntegration: true,
      knowledgeBase: false,
      slaManagement: false,
      reporting: false,
      automation: false,
      apiAccess: false,
      whiteLabel: false,
      prioritySupport: false,
      customFields: false,
      workflows: false,
      integrations: false
    },
    comment: 'Features habilitadas no plano (flags)'
  },
  // Features em texto livre (para exibição na landing page)
  featuresText: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'features_text',
    comment: 'Lista de funcionalidades em texto para exibição'
  },
  // Trial
  trialDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 14,
    field: 'trial_days',
    comment: 'Dias de trial gratuito'
  },
  // Status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'Se o plano está ativo para novas contratações'
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_default',
    comment: 'Se é o plano padrão para novos signups'
  },
  // Ordem de exibição
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'sort_order',
    comment: 'Ordem de exibição nos planos'
  }
}, {
  tableName: 'plans',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['name'], unique: true },
    { fields: ['is_active'] },
    { fields: ['is_default'] },
    { fields: ['sort_order'] }
  ]
});

export default Plan;
