import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
    references: {
      model: 'organizations',
      key: 'id'
    },
    comment: 'Organização tenant'
  },
  planId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'plan_id',
    references: {
      model: 'plans',
      key: 'id'
    },
    comment: 'Plano contratado'
  },
  // Status da subscription
  status: {
    type: DataTypes.ENUM('trial', 'active', 'past_due', 'cancelled', 'suspended'),
    allowNull: false,
    defaultValue: 'trial',
    comment: 'Status da assinatura'
  },
  // Datas importantes
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'start_date',
    comment: 'Data de início da assinatura'
  },
  trialEndsAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'trial_ends_at',
    comment: 'Data de fim do período trial'
  },
  currentPeriodStart: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'current_period_start',
    comment: 'Início do período atual de cobrança'
  },
  currentPeriodEnd: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'current_period_end',
    comment: 'Fim do período atual de cobrança'
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'cancelled_at',
    comment: 'Data de cancelamento'
  },
  // Billing
  billingCycle: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    allowNull: false,
    defaultValue: 'monthly',
    field: 'billing_cycle',
    comment: 'Ciclo de cobrança'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Valor cobrado por período'
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'EUR',
    comment: 'Moeda (EUR, USD, etc)'
  },
  // Usage tracking
  currentUsage: {
    type: DataTypes.JSONB,
    defaultValue: {
      users: 0,
      clients: 0,
      ticketsThisMonth: 0,
      storageUsedGB: 0
    },
    field: 'current_usage',
    comment: 'Uso atual dos recursos'
  },
  // Payment info
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'payment_method',
    comment: 'Método de pagamento (card, transfer, etc)'
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'stripe_customer_id',
    comment: 'ID do cliente no Stripe'
  },
  stripeSubscriptionId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'stripe_subscription_id',
    comment: 'ID da subscription no Stripe'
  },
  // Notas
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas internas sobre a subscription'
  }
}, {
  tableName: 'subscriptions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['organization_id'], unique: true }, // Uma subscription por org
    { fields: ['plan_id'] },
    { fields: ['status'] },
    { fields: ['trial_ends_at'] },
    { fields: ['current_period_end'] },
    { fields: ['stripe_customer_id'] },
    { fields: ['stripe_subscription_id'] }
  ]
});

export default Subscription;
